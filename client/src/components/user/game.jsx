import { useEffect, useRef, useContext } from "react"
import axios from "axios"
import { useState } from "react"
import "../../styles/main.scss"

import Figure from "./figure";
import Tile from "./tile";

import { socketContext } from "../../main";
import { useParams } from "react-router-dom";

import userDefault from "../../assets/user_default.png"


function Game(){
    const [username, setUsername] = useState("")
    const [id, setId] = useState("")
    const [elo, setElo] = useState(0)

    const [enemyUsername, setEnemyUsername] = useState("")
    const [enemyElo, setEnemyElo] = useState(0)

    const idRef = useRef(null)
    
    const socket = useContext(socketContext)

    let currentTileRef = useRef(null)

    let [dropped, setDropped] = useState(false)
    let droppedRef = useRef(null)
    let [currentFigure, setCurrentFigure] = useState(null)

    const backRef = useRef(null)

    const [board, setBoard] = useState(null)
    const [color, setColor] = useState("")

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
            socket.emit("join-game", params.id, res.data.user_id, (response) => {
                socket.emit("get-game-data", res.data.user_id)
            })
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
        }
        
        function get_board_data(color, board, enemy_username, enemy_elo){
            console.log("Board data: ", board, color)
            setBoard(p => board)
            setColor(p => color)

            setEnemyUsername(p => enemy_username)
            setEnemyElo(p=> enemy_elo)
        }
        
        function make_move(can_move, new_x, new_y){
            currentFigureRef.current.figure.style.pointerEvents = "all"

            if(can_move){
                currentFigureRef.current.update_pos(new_x, new_y)
            }else{
                currentFigureRef.current.go_back()
            }
            setDropped(p => false)
            setCurrentFigure(p => null)

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
        
        socket.on("make-move", make_move)
        socket.on("board-data", get_board_data)
        socket.on("update-board", update_board)
        socket.on("set-possible-moves", possible_moves)

        return () => {
            socket.off("make-move", make_move)
            socket.off("board-data", get_board_data)
            socket.off("update-board", update_board)
            socket.off("set-possible-moves", possible_moves)
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

    return (
        <div id="main_container">
            <div id="enemy_profile">
                <img src={userDefault} alt="user default profile" />
                <div>
                    <p>{enemyUsername}</p>
                    <p>{enemyElo}</p>
                </div>
            </div>

            <table id="game_board" ref={tableRef}>
                <tbody>
                    {visualBoard?.map((row, index) => {
                        let notations = "abcdefgh"
                        return <tr key={index}>{row.map((tile, index2) => {
                            let x2 = color == "black" ? 7 - tile.x : tile.x

                            let notation_x = tile.x == 7 ? notations.charAt(color == "black" ? 7 - tile.y : tile.y) : ""
                            let notation_y = tile.y == 7 ? 7 - tile.x + 1 : 7 - x2 + 1 

                            return <td key={index2}><Tile key={x2 * board_length + tile.y} x={x2} y={tile.y} possible_move={tile.possible_move} notation_x={notation_x} notation_y={notation_y} /></td>
                        })
                    }</tr>})}
                </tbody>
            </table>

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
                <img src={userDefault} alt="user default profile" />
                <div>
                    <p>{username}</p>
                    <p>{elo}</p>
                </div>
            </div>
        </div>
    )
}

export default Game