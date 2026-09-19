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
        let player = active_players.get(id) // Getting player reference
        let g = await dc.get_game(player.game_id) // Getting a reference to game in database

        if(!g || g.finished) socket.emit("make-move", false, x, y) // If finished return false
        if(current_games.get(player.game_id).finished) socket.emit("make-move", false, x, y) // If finished return false

        let game = current_games.get(player.game_id)
        let color = id == current_games.get(player.game_id).white ? "white" : "black"
        
        logger.okay(`Player: ${player.username} is making a move!`)

        x = color == "black" ? 7 - x : x // Reversing for black
        let move = game.chessboard.move_figure(color, x, y, old.x, old.y) // Making a move!
        socket.emit("make-move", move.can_move, x, y)

        // If promotion is possible send signal to client (the UI on client site will be set)
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
                io.to(player.game_id).emit("finished", "By stalemate", -1, 0)
                // Update game in database
                await dc.endgame(game.game_id, null, game.chessboard.moves_history, 0, "stalemate") // null because it`s a draw
            }else if(move.checkmate){
                let reason = "By checkmate"
                let white = active_players.get(game.white)
                let black = active_players.get(game.black)

                // Depending on whose turn it is update win screen
                if(game.turn == "black"){
                    white.socket.emit("finish", reason, 1, game.elo_gain)
                    black.socket.emit("finish", reason, 0, black.elo - game.elo_gain >= 0 ? -game.elo_gain : -(black.elo - game.elo_gain)) // For a case when enemy has less elo than a lose value
                }else{
                    black.socket.emit("finish", reason, 1, game.elo_gain)
                    white.socket.emit("finish", reason, 0, white.elo - game.elo_gain >= 0 ? -game.elo_gain : -(white.elo - game.elo_gain)) // For a case when enemy has less elo than a lose value
                }

                // Update game database
                let winner_color = game.chessboard.turn == "white" ? "black" : "white"
                await dc.endgame(player.game_id, game[winner_color], game.chessboard.moves_history, game.elo_gain, "checkmate")
            }

            io.to(player.game_id).emit("update-board")
        }  
    })

    // On disconnect remove player from active players and eventually leave all games
    socket.on("disconnect", async () => {
        let players = [...active_players.entries()] // Iterating through all players to see whose disconnected
        for(let i = 0; i < players.length; i++){
            if(players[i][1].socket == socket){
                logger.wait_message(`${players[i][1].username} disconnected. Trying to connect...`)

                // Setting up timer for player (after given time it`s pernamently disconnected)
                let timer = setTimeout(async () => {
                    if(!disconnected_players.has(players[i][0])) return
                    logger.error(`${players[i][1].username} left the game!`)
                    // Player is in game! Update it
                    if(players[i][1].game_id){
                        let game = current_games.get(players[i][1].game_id)
                        game.finished = true
                        
                        // Update endgame for diffrent players
                        let enemy = players[i][1].color == "white" ? "black" : "white"

                        // Enemy is in game so he won
                        if(active_players.has(game[enemy])){
                            active_players.get(game[enemy]).socket.emit("finish", "Enemy left", 1, game.elo_gain)
                            game[players[i][1].color] = null // Player left, remove him from game
                        }
                        
                        // If both left, end it
                        if(game[enemy] == null){
                            logger.warning("Closing game because there is no one in there")
                            await dc.set_finished(players[i][1].game_id)
                            current_games.delete(players[i][1].game_id) // Deleting game from history
                        }else{
                            // Update game database
                            let winner = players[i][1].color == "white" ? "black" : "white"
                            await dc.endgame(players[i][1].game_id, game[winner], game.chessboard.moves_history, game.elo_gain, "Enemy left")
                        }
                    }
                    active_players.delete(players[i][0]) // Delete player from active players
                }, process.env.PLAYER_TIMEOUT)

                disconnected_players.set(players[i][0], {"game_id": players[i][1].game_id, "color": players[i][1].color, "timer": timer}) // Adding player to possible disconnects
            }
        }
    })

    // Promoting some figure (you don`t need to check if game is active all moves are blocked previously)
    socket.on("choose-promotion", (id, old, x, y, type) => {
        let player = active_players.get(id)
        let game = current_games.get(player.game_id)

        let color = id == current_games.get(player.game_id).white ? "white" : "black"
        x = color == "black" ? 7 - x : x // Reversing for black again

        logger.okay(`Player: ${player.username} is promoting ${game.chessboard.board[x, y]} to ${type}!`)

        // Promoting given figure to choosen type
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

            // TODO: DISPLAYING REVIEW
        }
    })

    // Return possible moves for given figure (only for displaying purposes)
    socket.on("possible-moves", async (x, y, game_id, user_id) => {
        let game_in_database = await dc.get_game(game_id)
        // Checking if game is in database and if its finished
        if(game_in_database && !game_in_database.finished && current_games.has(game_id)){
            let game = current_games.get(game_id) // Getting game object
            let player = active_players.get(user_id) // Getting user

            // Returning moves that don`t end up in check
            let moves = game.chessboard.get_possible_moves(player.color == "black" ? 7 - x : x, y, player.color) 

            // Reversing moves for black (the board is flipped up for them)
            let pom_moves = [...moves]
            if(player.color == "black"){
                for(let i = 0; i < pom_moves.length; i++){
                    pom_moves[i] = [7 - pom_moves[i][0], pom_moves[i][1]]
                }
            }

            // Setting up possible moves for user
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

            // Here I come with some funny elo equation (scale with the diffrence from elo`s). 
            // This formula is not perfect however it works
            let elo_gain = 8 + Math.floor(Math.abs(player1.elo - player2.elo) / 20) 
    
            // Creating chessboard and adding custom time for players (they cant play with enemy who choose diffrent time)
            const chessboard = new ChessGame()
            current_games.set(game.game_id, {"chessboard": chessboard, "black": null, "white": null, "finished": false, "timers": {"black": Number(player1.play_time), "white": Number(player1.play_time)}, "last_move": Date.now(), "elo_gain": elo_gain})
            
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