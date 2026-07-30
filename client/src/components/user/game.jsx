import { useEffect, useRef, useContext } from "react"
import axios from "axios"
import { useState } from "react"
import "../../styles/main.scss"

import Figure from "./figure";
import Tile from "./tile";

import { socketContext } from "../../main";
import { useParams } from "react-router-dom";

import userDefault from "../../assets/user_default.png"

import bishop_white from "../../assets/bishop_white.png"
import bishop_black from "../../assets/bishop_black.png"

import horse_white from "../../assets/horse_white.png"
import horse_black from "../../assets/horse_black.png"

import rook_white from "../../assets/rook_white.png"
import rook_black from "../../assets/rook_black.png"

import queen_white from "../../assets/queen_white.png"
import queen_black from "../../assets/queen_black.png"


function Game(){
    const [username, setUsername] = useState("")
    const [id, setId] = useState("")
    const [elo, setElo] = useState(0)

    const [enemyUsername, setEnemyUsername] = useState("")
    const [enemyElo, setEnemyElo] = useState(0)
    const [enemyColor, setEnemyColor] = useState("")

    const idRef = useRef(null)
    
    const socket = useContext(socketContext)

    let currentTileRef = useRef(null)

    let [dropped, setDropped] = useState(false)
    let droppedRef = useRef(null)
    let [currentFigure, setCurrentFigure] = useState(null)

    const backRef = useRef(null)

    const [board, setBoard] = useState(null)
    const [color, setColor] = useState("")

    // User timers (for player and enemy)
    const [timers, setTimers] = useState({"white": 600, "black": 600})
    const [blackTimer, setBlackTimer] = useState(0)
    const [whiteTimer, setWhiteTimer] = useState(0)

    const [promotion, setPromotion] = useState(false)
    let images = {
        "b_white": bishop_white, "b_black": bishop_black,
        "h_white": horse_white, "h_black": horse_black,
        "r_white": rook_white, "r_black": rook_black,
        "q_white": queen_white, "q_black": queen_black
    }

    let intervalId = null

    // Board section
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

    let params = useParams()
    useEffect(() => {
        axios.get("http://localhost:3000/user/get_user_data", {withCredentials: true}).then(res => {
            // Setting username and id
            setUsername(p => res.data.username)
            setId(p => res.data.user_id)
            setElo(p => res.data.elo)

            idRef.current = res.data.user_id
            
            // Joining game
            socket.emit("join-game", params.id, res.data.user_id)
        })
    }, [])

    const currentFigureRef = useRef(currentFigure);

    useEffect(() => {
        currentFigureRef.current = currentFigure;
    }, [currentFigure]);

    useEffect(() => {
        function update_board(){
            socket.emit("get-game-data", idRef.current)
            setBoard(p => board) // Another call of setBoard() to update the figures
            setPromotion(p => null) // reset promotion varible
        }
        
        function get_board_data(color, board, enemy_username, enemy_elo){
            console.log("Board data: ", board, color)
            setBoard(p => board)
            setColor(p => color)

            setEnemyUsername(p => enemy_username)
            setEnemyElo(p=> enemy_elo)
            setEnemyColor(p => color == "black" ? "white" : "black")
        }
        
        function make_move(can_move, new_x, new_y){
            currentFigureRef.current.figure.style.pointerEvents = "all"

            if(can_move){
                currentFigureRef.current.update_pos(new_x, new_y)
                console.log("Interval was cleared!", intervalId)
                clearInterval(intervalId)
                intervalId = null
            }else{
                currentFigureRef.current.go_back()
            }
            setDropped(p => false)
            // setCurrentFigure(p => null)

            // Cleaning up posssible moves after a move
            let copy = [...visualBoard]
            for(let i = 0; i < board_length; i++){
                for(let j = 0; j < board_length; j++){
                    copy[i][j].possible_move = false
                }
            }
            setVisualBoard(p => copy)
        }

        function possible_moves(moves){
            let pom_board = [...visualBoard]
            console.log(moves, " <- moves")
            for(let i = 0; i < moves.length; i++){
                pom_board[moves[i][0]][moves[i][1]].possible_move = true
            }
            setVisualBoard(p => pom_board)
        }

        function waiting_for_enemy(){
            console.log("Waiting for enemy...")
        }

        function finish(reason){
            console.log(reason)
        }

        function update_timers(timersNew, whose){
            console.log("***** STARTING TIMERS ******")
            setTimers(p => timersNew)
            
            if(intervalId == null){
                console.log("BIG STEP: ", whose)
                intervalId = setInterval(() => {
                    timersNew[whose] -= 1
                    setBlackTimer(p => timersNew["black"])
                    setWhiteTimer(p => timersNew["white"])
                    console.log(timersNew, whose)
                }, 1000)
            }else{
                clearInterval(intervalId)
                intervalId = null
                update_timers(timersNew, whose)
            }
        }

        function promotion(x, y){
            setPromotion(p => [x, y])
        }
        
        
        socket.on("make-move", make_move)

        socket.on("board-data", get_board_data)
        socket.on("update-board", update_board)

        socket.on("set-possible-moves", possible_moves)

        socket.on("finish", finish)

        socket.on("waiting-for-enemy", waiting_for_enemy)

        socket.on("update-timers", update_timers)

        socket.on("promotion", promotion)

        return () => {
            socket.off("make-move", make_move)

            socket.off("board-data", get_board_data)
            socket.off("update-board", update_board)

            socket.off("set-possible-moves", possible_moves)

            socket.off("finish", finish)

            socket.off("waiting-for-enemy", waiting_for_enemy)

            socket.off("update-timers", update_timers)

            socket.off("promotion", promotion)
        }
    }, [socket])

    function start_dragging(x, y){
        console.log("start dragging <- in game")
        socket.emit("possible-moves", x, y, params.id, idRef.current)
    }

    function figure_drop(x, y){ 
        if(!backRef.current){
            currentTileRef.current = {"x": x, "y": y}
            currentFigure.figure.style.pointerEvents = "none"
            currentFigure.figure.style.zIndex = 1
            setDropped(p => true)
            if(currentFigure != null){
                console.log(x, y, " <- there are new positions for figure")
                socket.emit("make-move", id, x, y, currentFigure.old_pos)
            }
        }else{
            currentFigure.go_back()
            setCurrentFigure(p => null)
        }
    }

    // Table ref
    const tableRef = useRef(null)
    useEffect(() => {
        const table = tableRef.current;
    }, [tableRef])

    // This fragment of code is responsible for placing figure back in place when player tries to drag it from the board
    useEffect(() => {
        window.addEventListener("mouseup", figure_back)

        return () => {
            window.removeEventListener("mouseup", figure_back)
        }
    }, [])

    function figure_back(e){
        let box = tableRef.current.getBoundingClientRect()
        let is_not_in_x = box.left > e.clientX || box.left + box.width < e.clientX
        let is_not_in_y = box.top > e.clientY || box.top + box.height < e.clientY

        if(is_not_in_x || is_not_in_y){
            backRef.current = true
            setDropped(p => false)
        }else{
            backRef.current = false
        }
    }

    function choose_promotion(type){
        console.log("You chose a " + type + " for promotion!", currentFigure)
        socket.emit("chose-promotion", id, currentFigure.old_pos, promotion[0], promotion[1], type)
    }

    // Whole board and UI is generated here
    return (
        <div id="main_container">
            <div id="enemy_profile">
                <div>
                    <img src={userDefault} alt="user default profile" />
                    <div>
                        <p>{enemyUsername}</p>
                        <p>{enemyElo}</p>
                    </div>
                </div>
                <span>{timers[enemyColor] != null ? <p style={{backgroundColor: enemyColor, color: color}}>{Math.floor(timers[enemyColor] / 60)} : {Math.round(timers[enemyColor] % 60) <= 9 ? "0" + Math.round(timers[enemyColor] % 60) : Math.round(timers[enemyColor] % 60)}</p> : ""}</span>
            </div>

            <table id="game_board" ref={tableRef}>
                <tbody>
                    {visualBoard?.map((row, index) => {
                        let notations = "ABCDEFGH"
                        return <tr key={index}>{row.map((tile, index2) => {
                            let x2 = color == "black" ? 7 - tile.x : tile.x

                            let notation_x = tile.x == 7 ? notations.charAt(color == "black" ? 7 - tile.y : tile.y) : ""
                            let notation_y = tile.y == 7 ? 7 - tile.x + 1 : 7 - x2 + 1 

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
                        let x2 = color == "black" ? 7 - x : x           
                        return <Figure key={x * board_length + y} x={x2} y={y} type={element.name} possible_move={visualBoard[x2][y].possible_move} color={element.color} setCurrentFigure={setCurrentFigure} figure_drop={figure_drop} table={tableRef} drag={start_dragging} />
                    }
                })}
                </div>
            }) : <div></div>}  
            <div id="your_profile">
                <div>
                    <img src={userDefault} alt="user default profile" />
                    <div>
                        <p>{username}</p>
                        <p>{elo}</p>
                    </div>
                </div>
                <span>{timers[color] != null ? <p style={{backgroundColor: color, color: enemyColor}}>{Math.floor(timers[color] / 60)} : {Math.round(timers[color] % 60) <= 9 ? "0" + Math.round(timers[color] % 60) : Math.round(timers[color] % 60)}</p> : ""}</span>
            </div>
        </div>
    )
}

export default Game