import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import user_router from "./routers/user.js"
import cookieParser from "cookie-parser"
import * as jwt_connector from "./jwt.js"

dotenv.config()

// Express server setup
const app = express()
app.use(express.json())
app.use(cors({origin: "http://localhost:5173", credentials: true}))
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

// Server and socket io setup
import http from "http"
import { Server } from "socket.io"

const server = http.createServer(app)

const io = await new Server(server, {cors: {origin: "http://localhost:5173",methods: ["GET", "POST"], credentials: true}})

// Database Connector setup
import DatabaseConnector from "./database_connector.js"
import { ChessGame } from "./chess_game.js"

const dc = new DatabaseConnector()

app.get("/", (req, res) => {
    return res.status(200).send("This is main server site. Nothing to see here")
})

app.use("/user", user_router) // Connection to user router

// ***********************************************************************************
//                                   GAME SECTION
//      Its responsible for connecting to game and playing chess matches
// ***********************************************************************************

const players_lobby = new Map()
const active_players = new Map()

const current_games = new Map()

// The connection of socket to server
io.on("connection", (socket) => {
    socket.on("join_server", (id, username) => {
        // If socket is not on the list then it is added
        if(!active_players.has(id)){
            active_players.set(id, {"username": username, "socket": socket, "game_id": null, "color": null})
            console.log(active_players.size, " <- size of active players")
        }
    })

    socket.on("get_game_data", (id) => {
        console.log("something important")
        console.log(active_players, id, active_players.get(id))
        socket.emit("board_data", active_players.get(id).color, current_games.get(active_players.get(id).game_id).game)
    })
})

io.of("/").adapter.on("create-room", async (room) => {
    let game_in_database = await dc.get_game(room)
    if(game_in_database){
        const game = new ChessGame()
        console.log(`A new room was created: ${room}`);

        current_games.set(room, {"game": game})

        let user1 = active_players.get(game_in_database.user1)
        let user2 = active_players.get(game_in_database.user2)
        
        let color = Math.floor(Math.random() * 2)

        user1.game_id = room
        user1.color = color ? "white" : "black"

        user2.game_id = room
        user2.color = color ? "black" : "white"

        console.log(active_players)
    }
    // Do something here (e.g., update an active rooms list in a database)
});

app.get("/find_game", jwt_connector.authenticate_token, async (req, res) => {
    console.log(`${req.username} wants to play!`)

    if(!players_lobby.has(req.user_id)){
        players_lobby.set(req.user_id, active_players.get(req.user_id))

        if(players_lobby.size == 2){
            // Tu logika dobierania graczy do solidnej poprawy - dobieranie po elo plus nie pętlą raczej
            let players = []
            for (const [key, value] of players_lobby.entries()) {
                players.push({"player_id": key, "socket": value.socket})
            }

            let game = await dc.create_game(players[0].player_id, players[1].player_id)
            players[0].socket.join(game.game_id)
            players[1].socket.join(game.game_id)

            io.to(game.game_id).emit("start_game", game.game_id)
            console.log("We got it - starting new game!")
            // Tutaj dodać usuwanie graczy z lobby żeby nie dobierało kilku gier na raz
        }
    }

    return res.status(200)
})

server.listen(process.env.SERVER_PORT, (e) => {
    if(!e){
        console.log(`Server is succesfully runing on port ${process.env.SERVER_PORT}`)
    }else{
        console.log(`Error: ${e}`)
    }
})