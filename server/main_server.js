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
//          Its responsible for connecting to game and playing chess matches
// ***********************************************************************************

const players_lobby = new Map() // Only for joining games
const active_players = new Map() // All players, only delete on disconnect

const current_games = new Map() // All games, delete only when empty

// ***********************************************************************************
//                                   SOCKET SECTION
//      All socket events, from player making a move to leaving and joining a game
// ***********************************************************************************

// The connection of socket to server
io.on("connection", (socket) => {
    socket.on("join-server", (id, username, elo) => {
        // If socket is not on the list then it is added
        if(!active_players.has(id)){
            active_players.set(id, {"username": username, "socket": socket, "elo": elo, "game_id": null, "color": null})
        }else{
            // User is already logged in - log him out or something like that

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
        io.to(player.game_id).emit("update-timers", game.timers, game.chessboard.turn, game.finished)
        // Jak gra skończona inaczej przesylaj dane

        if(game.finished){
            // Send endgame data
        }
    })

    socket.on("make-move", async (id, x, y, old) => {
        let player = active_players.get(id)
        if(current_games.get(player.game_id).finished) socket.emit("make-move", false, x, y) // If finished return false

        let game = current_games.get(player.game_id)
        let color = id == current_games.get(player.game_id).white ? "white" : "black"
        
        console.log(`Player: ${player.username} is making a move!`)

        x = color == "black" ? 7 - x : x
        let move = game.chessboard.move_figure(color, x, y, old.x, old.y)
        console.log("MOVE PARAMS:", move)
        socket.emit("make-move", move.can_move, x, y)

        if(!move.can_move && move.can_promote){
            socket.emit("promotion", x, y)
        }   

        if(move.can_move){
            // Updating timers for each player
            // Checking who moved and updating server time for him
            if(id == game.white){
                // White moved
                game.timers.white = game.timers.white - Math.round(Math.abs(Date.now() - game.last_move) / 1000)
            }else{
                // Black moved
                game.timers.black = game.timers.black - Math.round(Math.abs(Date.now() - game.last_move) / 1000)
            }
            game.last_move = Date.now()

            // Checking endgames (stalemate, checkmate)
            if(move.stalemate){
                current_games.get(player.game_id).finished = true
                io.to(player.game_id).emit("finished", "stalemate", -1, 0)
            }else if(move.checkmate){
                let reason = "checkmated"
                current_games.get(player.game_id).finished = true
                let elo_gained = 8 // Here come with some funny elo equation (scale with the diffrence from elo`s)
                if(game.turn == "white"){
                    active_players.get(current_games.get(player.game_id).white).socket.emit("finish", reason, 1, elo_gained)
                    active_players.get(current_games.get(player.game_id).black).socket.emit("finish", reason, 0, -elo_gained)
                }else{
                    active_players.get(current_games.get(player.game_id).black).socket.emit("finish", reason, 1, elo_gained)
                    active_players.get(current_games.get(player.game_id).white).socket.emit("finish", reason, 0, -elo_gained)
                }
            }

            io.to(player.game_id).emit("update-board")
            console.log("*****************************************************")
        }
        
        socket.on("disconnect", () => {
            // cuś
        })
    })

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
        if(game_in_database && current_games.has(id)){
            // Game exist, now check if player is already in it
            if(active_players.has(user_id) && active_players.get(user_id).game_id == id){
                console.log("Already in game! Sending some funny data")
                let user = active_players.get(user_id)
                user.socket = socket
                user.socket.join(id)
                let game = current_games.get(user.game_id)

                // When website is refreshed last move is changed
                if(!game.finished){
                    if(game.chessboard.turn == "white"){
                        // White moved lately
                        game.timers.white = game.timers.white - Math.round(Math.abs(Date.now() - game.last_move) / 1000)
                    }else{
                        // Black moved lately
                        game.timers.black = game.timers.black - Math.round(Math.abs(Date.now() - game.last_move) / 1000)
                    }
                    game.last_move = Date.now()
                }

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
                io.to(id).emit("update-timers", current_game.timers, current_game.chessboard.turn, current_game.finished)
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
app.get("/find_game", jwt_connector.authenticate_token, async (req, res) => {
    console.log(`${req.username} wants to play!`)
    // Player lobby do czego służy, active players do czego?  - przypomnienie jakbym nie pamiętał
    if(!players_lobby.has(req.user_id)){
        players_lobby.set(req.user_id, active_players.get(req.user_id))

        // Matchmaking
        let sorted_players = [...players_lobby.entries()].sort((a, b) => b.elo - a.elo)

        let i = 2
        while(i <= sorted_players.length){
            // Getting players varibles
            let player1_id = sorted_players[i - 1][0]
            let player1 = sorted_players[i - 1][1]
            
            let player2_id = sorted_players[i - 2][0]
            let player2 = sorted_players[i - 2][1]

            // Adding game to database
            let game = await dc.create_game(player1_id, player2_id)

            player1.socket.emit("start-game", game.game_id)
            player2.socket.emit("start-game", game.game_id)

            // Creating chessboard
            const chessboard = new ChessGame()
            current_games.set(game.game_id, {"chessboard": chessboard, "black": null, "white": null, "finished": false, "timers": {"black": 600, "white": 600}, "last_move": Date.now()})

            console.log("We got it - starting new game for:", player1.username, "and", player2.username)
             
            // Remove players from player lobby so they wont be selected for other games
            players_lobby.delete(player1_id)
            players_lobby.delete(player2_id)
            
            sorted_players.splice(i - 2, 2) 

            i += 2
        }

        console.log(players_lobby, sorted_players)
    }else{
        console.log("Player already in lobby, can`t join again!")
    }

    return res.status(200)
})

// Starting server that listens on given port
server.listen(process.env.SERVER_PORT, (e) => {
    if(!e){
        console.log(`Server is succesfully runing on port ${process.env.SERVER_PORT}`)
    }else{
        console.log(`Error: ${e}`)
    }
})