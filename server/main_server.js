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

const dc = new DatabaseConnector()

app.get("/", (req, res) => {
    return res.status(200).send("This is main server site. Nothing to see here")
})

app.use("/user", user_router) // Connection to user router

// ***********************************************************************************
//                                   GAME SECTION
//      Its responsible for connecting to game and playing chess matches
// ***********************************************************************************

const players_lobby = []
const active_players = []

// The connection of socket to server
io.on("connection", (socket) => {
    socket.on("join_server", (id, username) => {
        // If socket is not on the list then it is added
        if(active_players.filter(element => element.player_id == id).length == 0){
            active_players.push({"socket": socket, "player_id": id, "username": username})
            console.log("Active players: ", active_players)
        }
    })

    socket.on("update_socket", (id) => {
        for(let i = 0; i < active_players.length; i ++){
            if(active_players[i].player_id == id){
                active_players[i].socket = socket
                console.log("Socket updated for: ", active_players[i].player_name)
            }
        }
    })
})

app.get("/find_game", jwt_connector.authenticate_token, async (req, res) => {
    console.log(`${req.username} wants to play!`)
    let user_already_wants_to_play = players_lobby.filter(element => element.player_id == req.user_id)

    if(user_already_wants_to_play.length == 0){
        let player = active_players.filter(element => element.player_id == req.user_id)[0]
        players_lobby.push({"socket": player.socket, "player_id": player.player_id, "username": player.username})

        console.log("Playing players: ", active_players)

        if(players_lobby.length == 2){
            let game = await dc.create_game(players_lobby[0].player_id, players_lobby[1].player_id)
            players_lobby[0].socket.join(game.game_id)
            players_lobby[1].socket.join(game.game_id)

            io.to(game.game_id).emit("start_game", game.game_id)
            console.log("We got it - starting new game!")
            // Tutaj dodać usuwanie graczy z lobby żeby nie dobierało kilku gier na raz
            console.log(active_players.length, players_lobby.length)
        }
    }else{
        console.log("Already playing!")
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