// +---------------------------------------------------------------------------------+
// |                                GAME COMPONENT                                   |
// |            Handeling game on user site - connecting through socket.io           |
// +---------------------------------------------------------------------------------+

// Imports
import { useEffect, useRef, useContext, useState } from "react"
import "../../styles/main.scss"

// Components imports
import Figure from "./figure";
import Tile from "./tile";
import Endgame from "./endgame";

import { socketContext } from "../../main"; // Socket context
import { useParams } from "react-router-dom";

// User default image
import user_default from "../../assets/user_default.png"

// Images for promotion graphics
import bishop_white from "../../assets/bishop_white.png"
import bishop_black from "../../assets/bishop_black.png"

import horse_white from "../../assets/horse_white.png"
import horse_black from "../../assets/horse_black.png"

import rook_white from "../../assets/rook_white.png"
import rook_black from "../../assets/rook_black.png"

import queen_white from "../../assets/queen_white.png"
import queen_black from "../../assets/queen_black.png"


import { userContext } from "../../main";

// Game component
export default function Game(){
    // Basic enemy data
    const [enemy, setEnemy] = useState({username: "", elo: 0, color: "", image: ""})
    
    const socket = useContext(socketContext) // Getting reference to socket

    let [currentFigure, setCurrentFigure] = useState(null)

    const backRef = useRef(null)

    const [board, setBoard] = useState(null)
    const [color, setColor] = useState("")

    // User timers (for player and enemy)
    const [timers, setTimers] = useState({"white": 600, "black": 600})
    let intervalId = null // Timer interval

    const [promotion, setPromotion] = useState(false)
    let images = {
        "b_white": bishop_white, "b_black": bishop_black,
        "h_white": horse_white, "h_black": horse_black,
        "r_white": rook_white, "r_black": rook_black,
        "q_white": queen_white, "q_black": queen_black
    }


    const [finished, setFinished] = useState(null)

    // Board object generating
    let board_length = 8
    const [visualBoard, setVisualBoard] = useState(() => {
        let tab = []
        for(let i = 0; i < board_length; i++){
            tab.push([])
            for(let j = 0; j < board_length; j++){
                tab[i].push({x: i, y: j, possible_move: false})
            }
        }
        return tab
    })
    const tableRef = useRef(null) // Table ref

    // Setting up user data and joining a game
    let params = useParams() // Getting params from url (game id is crucial here)
    const user = useContext(userContext)

    // Join game as soon as user change
    useEffect(() => {
        if(!user.id) return
        socket.emit("join-game", params.id, user.id) // Joining game      
    }, [user])


    const currentFigureRef = useRef(currentFigure);
    useEffect(() => {
        currentFigureRef.current = currentFigure;
    }, [currentFigure]);

    useEffect(() => {
        // Updating board (setting up figure positions etc)
        function update_board(){
            socket.emit("get-game-data", user.id)
            setBoard(p => board) // Another call of setBoard() to update the figures
            setPromotion(p => null) // Reset promotion varible
        }
        
        // Updating board data
        function get_board_data(color, board, enemy_username, enemy_elo, enemy_image){
            setBoard(p => board)
            setColor(p => color) // User color

            // Setting up enemy data
            setEnemy({
                username: enemy_username,
                elo: enemy_elo, 
                color: color == "black" ? "white" : "black", 
                image: enemy_image
            })
        }

         // Updating timers for players
        function update_timers(timersNew, whose, finished){
            setTimers(p => timersNew)
            if(finished) return // Game is already finished, don`t do anything
            
            // If timer is not set another one
            if(intervalId == null){
                intervalId = setInterval(() => {
                    setTimers(previous => ({...previous, [whose]: previous[whose] - 1})) // Updating correct timer depending of color
                }, 1000)
            }else{
                // Clearing interval and creating new one
                clearInterval(intervalId)
                intervalId = null
                update_timers(timersNew, whose, finished)
            }
        }
        
        // Making figure move and clearing old interval
        function make_move(can_move, new_x, new_y){
            currentFigureRef.current.figure.style.pointerEvents = "all"

            // If figure moved clear current interval. If not figure go back
            if(can_move){
                currentFigureRef.current.update_pos(new_x, new_y)
                clearInterval(intervalId)
                intervalId = null
            }else{
                currentFigureRef.current.go_back()
            }

            // Cleaning up posssible moves after a move
            clear_possible_moves()
        }

        // Setting up indicators for tile of possible moves for current figure
        function possible_moves(moves){
            let pom_board = [...visualBoard]
            for(let i = 0; i < moves.length; i++){
                pom_board[moves[i][0]][moves[i][1]].possible_move = true
            }
            setVisualBoard(p => pom_board)
        }

        // Setting up finish component with basic data
        function finish(reason, won, eloGained){
            setFinished({"reason": reason, "won": won, "reward": eloGained})
            clearInterval(intervalId)
            intervalId = null
            user.fetch_data() // Fetching after winning so data is updated
        }

        // Updating promotion if possible
        function promotion(x, y){
            setPromotion(p => [x, y])
        }

        // Waiting for enemy to join - for now only console.log message
        function wait_for_enemy(){
            console.log("Waiting for enemy")
        }
        
        // Other player is not in game yet, load waiting message
        socket.on("wait-for-enemy", wait_for_enemy) 
        // Getting actuall board data from server
        socket.on("board-data", get_board_data)
        // Updating timers
        socket.on("update-timers", update_timers)
        // Updating board data
        socket.on("update-board", update_board)
        // Updating a promotion (its possible so display promotion menu)
        socket.on("promotion", promotion)
        // If game is finished display it review (who won/lost, by what, elo gained/lost)
        socket.on("finish", finish)
        // Setting up tiles if there are in possible moves
        socket.on("set-possible-moves", possible_moves)
        // Placing figure at correct place after a move
        socket.on("make-move", make_move)

        return () => {
            // Turining off sockets events (for cleanup purposes)
            socket.off("wait-for-enemy", wait_for_enemy)
            socket.off("update-timers", update_timers)
            socket.off("board-data", get_board_data)
            socket.off("update-board", update_board)
            socket.off("promotion", promotion)
            socket.off("finish", finish)
            socket.off("set-possible-moves", possible_moves)           
            socket.off("make-move", make_move)
        }
    }, [socket, user])

    // Start dragging figure
    function start_dragging(x, y){
        socket.emit("possible-moves", x, y, params.id, user.id)
    }

    // Clearing up possible moves
    function clear_possible_moves(){
        let copy = [...visualBoard]
        for(let i = 0; i < board_length; i++){
            for(let j = 0; j < board_length; j++){
                copy[i][j].possible_move = false
            }
        }
        setVisualBoard(p => copy)
    }

    // Dropping figure at given place
    function figure_drop(x, y){ 
        if(!backRef.current && currentFigure != null){
            currentFigure.figure.style.pointerEvents = "none"
            currentFigure.figure.style.zIndex = 1
            socket.emit("make-move", user.id, x, y, currentFigure.old_pos)       
        }else{
            // Figure can`t move there (x, y) so go back
            currentFigure.go_back()
            setCurrentFigure(p => null)
            clear_possible_moves()
        }
    }

    // Responsible for placing figure back in place when player tries to drag it from the board
    useEffect(() => {
        window.addEventListener("mouseup", figure_back)

        return () => {
            window.removeEventListener("mouseup", figure_back)
        }
    }, [])

    // Does figure need to go back? (if it`s outside the board)
    function figure_back(e){
        let box = tableRef.current.getBoundingClientRect()
        let is_not_in_x = box.left > e.clientX || box.left + box.width < e.clientX
        let is_not_in_y = box.top > e.clientY || box.top + box.height < e.clientY

        backRef.current = is_not_in_x || is_not_in_y // Setting up back ref
    }

    // Choosing promotion
    function choose_promotion(type){
        socket.emit("choose-promotion", user.id, currentFigure.old_pos, promotion[0], promotion[1], type)
    }

    // Whole board and UI is generated here
    return (
        <div id="main_container">
            {/* Enemy profile picture (the bar on the top of board) */}
            <div id="enemy_profile">
                <div>
                    <img src={`http://localhost:3000/uploads/${enemy.image}?t=${new Date().getTime()}`} alt="Enemy profile picture" onError={e => {e.target.src = user_default}} />
                    <div>
                        <p>{enemy.username}</p>
                        <p>{enemy.elo}</p>
                    </div>
                </div>
                <span>{timers[enemy.color] != null ? <p style={{backgroundColor: enemy.color, color: color}}>{Math.floor(timers[enemy.color] / 60)} : {Math.round(timers[enemy.color] % 60) <= 9 ? "0" + Math.round(timers[enemy.color] % 60) : Math.round(timers[enemy.color] % 60)}</p> : ""}</span>
            </div>

            {/* Generating chess board */}
            <table id="game_board" ref={tableRef}>
                <tbody>
                    {visualBoard?.map((row, index) => {
                        let notations = "ABCDEFGH" // Side numeration
                        return <tr key={index}>{row.map((tile, index2) => {
                            let x2 = color == "black" ? 7 - tile.x : tile.x // Reversing x depending on color

                            let notation_x = tile.x == 7 ? notations.charAt(color == "black" ? 7 - tile.y : tile.y) : ""
                            let notation_y = tile.y == 7 ? 7 - tile.x + 1 : 7 - x2 + 1 

                            // Generating invidual tiles for given cords
                            return <td key={index2}><Tile key={x2 * board_length + tile.y} x={x2} y={tile.y} possible_move={tile.possible_move} notation_x={notation_x} notation_y={notation_y} /></td>
                        })
                    }</tr>})}
                </tbody>
            </table>

            {/* Promotion */}
            {promotion ? <div id="promotion" style={{left: tableRef.current.getBoundingClientRect().left, top: tableRef.current.getBoundingClientRect().top}}>
                <img src={images["h_" + color]} alt="horse for promotion" onClick={() => choose_promotion("h")} />
                <img src={images["b_" + color]} alt="bishop for promotion" onClick={() => choose_promotion("b")} />
                <img src={images["r_" + color]} alt="rook for promotion" onClick={() => choose_promotion("r")} />
                <img src={images["q_" + color]} alt="queen for promotion" onClick={() => choose_promotion("q")} />
            </div> : <></>}

            {/* Generating figures for board */}
            { board != null ? 
            board?.map((row, x) => {
                return <div key={x}>{row?.map((element, y) => {
                    if(element.name != "."){
                        let x2 = color == "black" ? 7 - x : x  // Reversing for black
                        
                        // Generating figure component
                        return <Figure key={x * board_length + y} x={x2} y={y} type={element.name} possible_move={visualBoard[x2][y].possible_move} color={element.color} setCurrentFigure={setCurrentFigure} figure_drop={figure_drop} table={tableRef} drag={start_dragging} />
                    }
                })}
                </div>
            }) : <div></div>}  

            {/* Generating user profile (bottom bar with username, elo and profile picture) */}
            <div id="your_profile">
                <div>
                    {/* Dynamically getting user image from server */}
                    <img src={`http://localhost:3000/uploads/${user.profile_picture}?t=${new Date().getTime()}`} alt="User profile picture" onError={e => {e.target.src = user_default}} />
                    <div>
                        <p>{user.username}</p>
                        <p>{user.elo}</p>
                    </div>
                </div>
                <span>{timers[color] != null ? <p style={{backgroundColor: color, color: enemy.color}}>{Math.floor(timers[color] / 60)} : {Math.round(timers[color] % 60) <= 9 ? "0" + Math.round(timers[color] % 60) : Math.round(timers[color] % 60)}</p> : ""}</span>
            </div>

            {/* If finished display endgame component */}
            {finished ? <Endgame won={finished.won} reason={finished.reason} elo={user.elo} reward={finished.reward}></Endgame> : <></>}
        </div>
    )
}