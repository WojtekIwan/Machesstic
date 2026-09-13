// +---------------------------------------------------------------------------------+
// |                                 MAIN SERVER                                     |
// |                 The core of the application, connects everything                |
// +---------------------------------------------------------------------------------+

// Necessary imports
import express from "express"
import cors from "cors"
import user_router from "./routers/user.js"
import cookieParser from "cookie-parser"
import * as jwt_connector from "./jwt.js"
import path from "path"
import process from "process"

import dotenv from "dotenv"
dotenv.config()

// Logger for custom messages
import Logger from "./logger.js"
const logger = new Logger()

logger.title("MACHESSTIC SERVER INIT")

// Express server setup
const app = express()
app.use(express.json())
app.use(cors({origin: "http://localhost:5173", credentials: true}))
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

// Connecting uploads to server (for getting profile pictures)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Server and socket io setup
import http from "http"
import { Server } from "socket.io"

const server = http.createServer(app)
const io = new Server(server, {cors: {origin: "http://localhost:5173",methods: ["GET", "POST"], credentials: true}})

// Database Connector setup
import DatabaseConnector from "./database_connector.js"
import { ChessGame } from "./chess_game.js"

// Connecting with database for test
const dc = new DatabaseConnector()
if(!await dc.ping_database()){
    logger.error("Can`t connect with database!")
}else{
    logger.okay("Connection with database established!")
}

app.get("/", (req, res) => {
    return res.status(200).send("This is main server site. Nothing to see here")
})

app.use("/user", user_router) // Connection to user router

// +---------------------------------------------------------------------------------+
// |                                GAME SECTION                                     |
// |       Its responsible for connecting to game and playing chess matches          |
// +---------------------------------------------------------------------------------+

const active_players = new Map() // All players, only delete on disconnect
const players_lobby = new Map() // Only for joining games

const current_games = new Map() // All games, delete only when empty

const disconnected_players = new Map()

// The middleware for connections of socket
io.use((socket, next) => {
    try{
        let cookies = {}
        if(!socket.request.headers.cookie) return next(new Error("403")) // There are no cookies to verify
        socket.request.headers.cookie.split(";").map((element) => {
            cookies[element.split("=")[0].trim()] = element.split("=")[1].trim()
        })

        if(!cookies["accessToken"] && !cookies["refreshToken"]){
            return next(new Error("403")) // There is no access token in cookies to verify
        }else if(!cookies["accessToken"] && cookies["refreshToken"]){
             return next(new Error("401")) // There is no access token in cookies to verify but refresh exist
        }

        // Access token is not verified, try to refresh it if possible
        if(!jwt_connector.authenticate_token_for_socket(cookies["accessToken"])) return next(new Error("401"))
        
        // Everything is good, socket will recive it`s signal
        next()
    }catch(err){
        return next(new Error("Unexpected error"));
    }
})

// On socket connection handeling + all socket events
io.on("connection", (socket) => {

    // User came from logging in to user page
    socket.on("join-server", async (id, username, elo) => {
        // If socket is not on the list then it is added
        if(id && !active_players.has(id)){
            // Getting profile picture
            const profile_picture = await (await dc.get_user_additional_data(id)).additional.profile_image_path
            active_players.set(id, {"username": username, "socket": socket, "elo": elo, "game_id": null, "color": null, "profile_picture": profile_picture})

            logger.okay(`${username} has joined the game. Number of players: ${active_players.size}`)
        }else{
            // Player reconnected - dont delete him, update socket and join him to game
            if(disconnected_players.has(id)){
                // Getting basic user data by id
                let player_data = disconnected_players.get(id)
                clearTimeout(player_data.timer) // Removing timeout for removing player

                // If player was in game add him again
                active_players.get(id).socket = socket // Update socket!!!
                disconnected_players.delete(id)

                if(player_data.game_id){
                    socket.join(player_data.game_id)
                    current_games.get(player_data.game_id)[player_data.color] = id
                }
                
                logger.okay(`${active_players.get(id).username} rejoined!`)
            }
        }    
    })

    // Getting game data for user
    socket.on("get-game-data", async (id) => {
        // Basic data for user
        let player = active_players.get(id)
        let game = current_games.get(player.game_id)
        
        // Getting enemy basic data (for profile purpose)
        let enemy = player.color == "white" ? active_players.get(game.black) : active_players.get(game.white)

        // Updating user ingame data 
        socket.emit("board-data", active_players.get(id).color, current_games.get(active_players.get(id).game_id).chessboard.board, enemy.username, enemy.elo, enemy.profile_picture)
        
        // Updating timers for game
        io.to(player.game_id).emit("update-timers", game.timers, game.chessboard.turn, game.finished)
    })

    // Perform a move by a player
    socket.on("make-move", async (id, x, y, old) => {
        let player = active_players.get(id)
        if(current_games.get(player.game_id).finished) socket.emit("make-move", false, x, y) // If finished return false

        let game = current_games.get(player.game_id)
        let color = id == current_games.get(player.game_id).white ? "white" : "black"
        
        console.log(`Player: ${player.username} is making a move!`)

        x = color == "black" ? 7 - x : x
        let move = game.chessboard.move_figure(color, x, y, old.x, old.y)
        socket.emit("make-move", move.can_move, x, y)

        if(!move.can_move && move.can_promote){
            socket.emit("promotion", x, y)
        }   

        // If move was performed
        if(move.can_move){
            // Updating timers for each player
            if(id == game.white){
                // White moved
                game.timers.white = game.timers.white - Math.round(Math.abs(Date.now() - game.last_move) / 1000)
            }else{
                // Black moved
                game.timers.black = game.timers.black - Math.round(Math.abs(Date.now() - game.last_move) / 1000)
            }
            game.last_move = Date.now()

            // Checking endgames (stalemate, checkmate)
            current_games.get(player.game_id).finished = move.checkmate || move.stalemate

            if(move.stalemate){
                io.to(player.game_id).emit("finished", "stalemate", -1, 0)
                // Update game in database
                await dc.endgame(game.game_id, null, game.chessboard.moves_history) // null because it`s a draw
            }else if(move.checkmate){
                let reason = "checkmated"
                let white = active_players.get(game.white)
                let black = active_players.get(game.black)
                let elo_gained = 8 + Math.floor(Math.abs(white.elo - black.elo) / 8) // Here come with some funny elo equation (scale with the diffrence from elo`s). 
                // This formula is not perfect however it works

                // Depending on whose turn it is update win screen
                if(game.turn == "white"){
                    white.socket.emit("finish", reason, 0, elo_gained)
                    black.socket.emit("finish", reason, 1, black.elo - elo_gained >= 0 ? -elo_gained : -(black.elo - elo_gained)) // For a case when enemy has less elo than a lose value
                }else{
                    black.socket.emit("finish", reason, 0, elo_gained)
                    white.socket.emit("finish", reason, 1, white.elo - elo_gained >= 0 ? -elo_gained : -(white.elo - elo_gained)) // For a case when enemy has less elo than a lose value
                }

                // Update game database
                await dc.endgame(game.game_id, game[game.turn], game.chessboard.moves_history, elo_gained, -elo_gained)
            }

            io.to(player.game_id).emit("update-board")
        }
        
    })

    // On disconnect remove player from active players and eventually leave all games
    socket.on("disconnect", async () => {
        let players = [...active_players.entries()]
        for(let i = 0; i < players.length; i++){
            if(players[i][1].socket == socket){
                logger.wait_message(`${players[i][1].username} disconnected. Trying to connect...`)

                let timer = setTimeout(async () => {
                    if(!disconnected_players.has(players[i][0])) return
                    logger.error(`${players[i][1].username} left the game!`)
                    // Player is in game! Update it
                    if(players[i][1].game_id){
                        let game = current_games.get(players[i][1].game_id)
                        game.finished = true
                        
                        let elo_gained = 8 + Math.floor(Math.abs(active_players.get(game.white).elo - active_players.get(game.black).elo) / 8)
                        
                        if(players[i][1].color == "white"){
                            active_players.get(game.black).socket.emit("finish", "Enemy left", 1, elo_gained)
                            game.white = null // Player left, remove him from game
                        }else{
                            active_players.get(game.white).socket.emit("finish", "Enemy left", 1, elo_gained)
                            game.black = null // Player left, remove him from game
                        }
                        
                        // If both left, end it
                        if(game.white == null && game.black == null){
                            current_games.delete(players[i][1].game_id) // deleting game from history
                        }
                        
                        
                        // Update game database
                        await dc.endgame(game.game_id, game[game.turn], game.chessboard.moves_history, elo_gained, -elo_gained)
                    }
                    active_players.delete(players[i][0]) // Delete player from active players
                }, 10000)
                disconnected_players.set(players[i][0], {"game_id": players[i][1].game_id, "color": players[i][1].color,  "timer": timer}) // Adding player to possible disconnects
            }
        }
    })

    // Promoting some figure
    socket.on("chose-promotion", (id, old, x, y, type) => {
        let player = active_players.get(id)
        let game = current_games.get(player.game_id)

        let color = id == current_games.get(player.game_id).white ? "white" : "black"
        
        console.log(`Player: ${player.username} is promoting!`)

        x = color == "black" ? 7 - x : x

        game.chessboard.promote(color, x, y, old.x, old.y, type)
        io.to(player.game_id).emit("update-board")
    })

    // Socket joins new game as soon as they got redirected to game
    socket.on("join-game", async (id, user_id) => {
        let game_in_database = await dc.get_game(id)
        if(game_in_database && !game_in_database.finished && current_games.has(id)){
            // Game exist, now check if player is already in it
            if(active_players.has(user_id) && active_players.get(user_id).game_id == id){
                let user = active_players.get(user_id)
                logger.warning(`${user.username} already in game. Rejoining!`)
                // Joining socket to game room after rejoining
                user.socket = socket
                user.socket.join(id)
                let game = current_games.get(user.game_id) // Getting reference to game data

                // When website is refreshed last move is changed
                if(!game.finished){
                    // Updating last move time
                    game.timers[game.chessboard.turn] = game.timers[game.chessboard.turn] - Math.round(Math.abs(Date.now() - game.last_move) / 1000)
                    game.last_move = Date.now()
                }

                io.to(id).emit("update-board")
                return
            }

            // If game exist and player is not in it, then join it
            logger.okay("Joining game!")
            let user = active_players.get(user_id)
            let current_game = current_games.get(id)
            // Assining color to player
            if(current_game.white == null && current_game.black == null){
                // Both colors are not taken so they are assigned randomly
                let color = ["white", "black"][Math.floor(Math.random() * 2)]
                current_game[color] = user_id
                user.color = color
            }else{
                // One color is taken, assign player to other one
                let other_color = current_game.white != null ? "black" : "white"
                current_game[other_color] = user_id
                user.color = other_color
            }

            // Setting up game id for user
            user.game_id = id
            user.socket.join(id)

            // Update when both join the game
            if(current_game.white && current_game.black){
                io.to(id).emit("update-board")
            }else{
                socket.emit("wait-for-enemy") // If enemy is not in game yet send waiting
            }
        }else if(game_in_database && game_in_database.finished && !current_games.has(id) ){
            // The game is finished so show after game
            logger.warning("Game already finished. Showing after match preview...")
        }
    })

    socket.on("possible-moves", async (x, y, id, user_id) => {
        let game_in_database = await dc.get_game(id)
        console.log("Checking possible moves...")
        if(game_in_database && current_games.has(id)){
            let game = current_games.get(id)
            let player = active_players.get(user_id)
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

// Finding game for player
app.get("/find_game/:time", jwt_connector.authenticate_token, async (req, res) => {
    logger.okay(`${req.username} wants to play!`)

    // Is player in game already? If not then it will be added to player lobby
    if(!players_lobby.has(req.user_id) && active_players.get(req.user_id).game_id == null){
        players_lobby.set(req.user_id, active_players.get(req.user_id))
        players_lobby.get(req.user_id)["play_time"] = req.params.time // Setting play time for players
        // Matchmaking - sorting players by elo
        let sorted_players = [...players_lobby.entries()].sort((a, b) => b.time - a.time || b.elo - a.elo)

        let i = 2
        while(i <= sorted_players.length && 0 <= i - 2){
            // Getting players varibles
            let player1_id = sorted_players[i - 1][0]
            let player1 = sorted_players[i - 1][1]
            
            let player2_id = sorted_players[i - 2][0]
            let player2 = sorted_players[i - 2][1]

            // Diffrence between elo is to high, find other enemy
            if(Math.abs(player1.elo - player2.elo) > 40){
                logger.warning("Elo diffrence is to high, finding other enemy...")
                i -= 1
                continue
            }

            // If players have diffrent times then dont match them
            if(player1.play_time != player2.play_time){
                logger.warning("Diffrent times, finding other enemy...")
                i -= 1
                continue
            }

            // Adding game to database
            let game = await dc.create_game(player1_id, player2_id)
    
            // Creating chessboard and adding custom time for players (they cant play with enemy who choose diffrent time)
            const chessboard = new ChessGame()
            current_games.set(game.game_id, {"chessboard": chessboard, "black": null, "white": null, "finished": false, "timers": {"black": Number(player1.play_time), "white": Number(player1.play_time)}, "last_move": Date.now()})
            
            logger.okay(`Starting new game for: ${player1.username} and ${player2.username}`)
            
            player1.socket.emit("start-game", game.game_id)
            player2.socket.emit("start-game", game.game_id)

            // Remove players from player lobby so they wont be selected for other games
            players_lobby.delete(player1_id)
            players_lobby.delete(player2_id)

            i += 2
        }
    }else{
        logger.error("Player already in lobby, can`t join again!")
        return res.status(400).json({message: "You are already in game"})
    }

    return res.status(200)
})

// Starting server that listens on given port
server.listen(process.env.SERVER_PORT, (e) => {
    if(!e){
        logger.default_message(`Server is succesfully runing on port ${process.env.SERVER_PORT}`)
    }else{
        logger.error(`Error: ${e}`)
    }
})