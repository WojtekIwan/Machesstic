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
    socket.on("join-server", (id, username, elo) => {
        // If socket is not on the list then it is added
        if(!active_players.has(id)){
            active_players.set(id, {"username": username, "socket": socket, "elo": elo, "game_id": null, "color": null})
        }
    })

    socket.on("get-game-data", (id) => {
        console.log("Getting user data")
        // Getting enemy basic data (for profile purpose)
        let game = current_games.get(active_players.get(id).game_id)
        let player = active_players.get(id)

        let enemy = null
        if(player.color == "white"){
            enemy = active_players.get(game.black)
        }else{
            enemy = active_players.get(game.white)
        }

        socket.emit("board-data", active_players.get(id).color, current_games.get(active_players.get(id).game_id).chessboard.board, enemy.username, enemy.elo)
    })

    socket.on("make-move", async (id, x, y, old) => {
        let player = active_players.get(id)
        if(current_games.get(player.game_id).finished) socket.emit("make-move", false, x, y) // If finished return false

        let game = current_games.get(player.game_id).chessboard
        let color = id == current_games.get(player.game_id).white ? "white" : "black"
        
        console.log(`Player: ${player.username} is making a move!`)

        x = color == "black" ? 7 - x : x
        let move = game.move_figure(color, x, y, old.x, old.y)

        socket.emit("make-move", move.can_move, x, y)
        io.to(player.game_id).emit("update-board")
        
        if(move.can_move){
            if(move.checkmate){
                let reason = "checkmated"
                current_games.get(player.game_id).finished = true
                if(game.turn == "white"){
                    console.log(active_players, current_games.get(player.game_id).white, active_players.get(current_games.get(player.game_id).white))

                    active_players.get(current_games.get(player.game_id).white).socket.emit("lose", reason)
                    active_players.get(current_games.get(player.game_id).black).socket.emit("won", reason)
                }else{
                    active_players.get(current_games.get(player.game_id).black).socket.emit("lose", reason)
                    active_players.get(current_games.get(player.game_id).white).socket.emit("won", reason)
                }
            }
        }
        console.log("*****************************************************")
    })

    // Socket joins new game as soon as they got redirected to game
    socket.on("join-game", async (id, user_id) => {
        let game_in_database = await dc.get_game(id)
        if(game_in_database && current_games.has(id)){
            // Game exist, now check if player is already in it
            if(active_players.has(user_id) && active_players.get(user_id).game_id == id){
                console.log("Already in game! Sending some funny data")
                let user = active_players.get(user_id)
                user.socket = socket
                user.socket.join(id)

                io.to(id).emit("update-board")
                return
            }
            console.log("Joining game!")
            // If game exist join it
            let user = active_players.get(user_id)
            let current_game = current_games.get(id)
            
            // Assining color to player
            if(current_game.white == null && current_game.black == null){
                let color = Math.floor(Math.random() * 2)
                if(color){
                    current_game.white = user_id
                    user.color = "white"
                }else{
                    current_game.black = user_id
                    user.color = "black"
                }
            }else{
                if(current_game.white != null){
                    current_game.black = user_id
                    user.color = "black"
                }else{
                    current_game.white = user_id
                    user.color = "white"
                }
            }

            user.game_id = id
            user.socket.join(id)

            // Update when both join the game
            if(current_game.white && current_game.black){
                io.to(id).emit("update-board")
            }else{
                user.socket.emit("waiting-for-enemy")
            }
        }
    })

    socket.on("possible-moves", async (x, y, id, user_id) => {
        let game_in_database = await dc.get_game(id)
        console.log("Checking possible moves...", game_in_database, current_games.has(id), id, current_games)
        if(game_in_database && current_games.has(id)){
            let game = current_games.get(id)
            let player = players_lobby.get(user_id)
            let moves = game.chessboard.get_possible_moves(player.color == "black" ? 7 - x : x, y, player.color)
            let pom_moves = [...moves]
            if(player.color == "black"){
                for(let i = 0; i < pom_moves.length; i++){
                    pom_moves[i] = [7 - pom_moves[i][0], pom_moves[i][1]]
                }
            }
            socket.emit("set-possible-moves", pom_moves)
        }

    })
})

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
            
            players[0].socket.emit("start-game", game.game_id)
            players[1].socket.emit("start-game", game.game_id)

            const chessboard = new ChessGame()
            current_games.set(game.game_id, {"chessboard": chessboard, "black": null, "white": null, "finished": false})

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