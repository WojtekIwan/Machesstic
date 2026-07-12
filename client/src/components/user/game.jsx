import { useEffect, useRef, useContext } from "react"
import axios from "axios"
import { useState } from "react"
import "../../styles/main.scss"

import Figure from "./figure";
import Tile from "./tile";

import { socketContext } from "../../main";
import { useParams } from "react-router-dom";


function Game(){
    const [username, setUsername] = useState("")
    const [id, setId] = useState("")
    const idRef = useRef(null)
    
    const socket = useContext(socketContext)

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

    let currentTileRef = useRef(null)

    let [dropped, setDropped] = useState(false)
    let droppedRef = useRef(null)
    let [currentFigure, setCurrentFigure] = useState(null)

    const backRef = useRef(null)

    const [board, setBoard] = useState(null)
    const [color, setColor] = useState("")
    
    let params = useParams()
    useEffect(() => {
        axios.get("http://localhost:3000/user/get_user_data", {withCredentials: true}).then(res => {
            // Setting username and id
            setUsername(p => res.data.username)
            setId(p => res.data.user_id)
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
        }
        
        function get_board_data(color, board){
            console.log("Board data: ", board, color)
            setBoard(p => board)
            setColor(p => color)
        }
        
        function make_move(can_move, new_x, new_y){
            currentFigureRef.current.figure.style.pointerEvents = "all"
            // tu coś podmienić bo stawia się na polu do przodu (zamiast 3 4 jest 3 3)
            if(can_move){
                currentFigureRef.current.update_pos(new_x, new_y)
            }else{
                currentFigureRef.current.go_back()
            }
            setDropped(p => false)
            setCurrentFigure(p => null)
        }
        
        socket.on("make-move", make_move)
        socket.on("board-data", get_board_data)
        socket.on("update-board", update_board)

        return () => {
            socket.off("make-move", make_move)
            socket.off("board-data", get_board_data)
            socket.off("update-board", update_board)
        }
    }, [socket])

    function change_current_tile(new_x, new_y, tile){
        currentTileRef.current = {"x": new_x, "y": new_y, "tile": tile}
        // After updating tile check if figure was dropped. Then drop it
        if(dropped && currentFigure != null){
            console.log(new_x, new_y, " <- there are new positions for figure")
            socket.emit("make-move", id, color == "black" ? 7 - new_x : new_x, new_y, currentFigure.old_pos)
        }
    }

    function start_dragging(x, y){
        console.log("start dragging <- in game")
        socket.emit("possible-moves", x, y, params.id, idRef.current)
    }

    function figure_drop(){
        if(!backRef.current){
            currentFigure.figure.style.pointerEvents = "none"
            setDropped(p => true)
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
            <h1>Welcome to game {username}</h1>
            <table id="game_board" ref={tableRef}>
                <tbody>
                    {visualBoard.map((row, index) => {
                        return <tr key={index}>{row.map((tile, index2) => {
                            return <td key={index2}><Tile key={tile.x * board_length + tile.y} x={tile.x} y={tile.y} set_current={change_current_tile} /></td>
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
                        return <Figure key={x * board_length + y} x={x2} y={y} type={element.name} color={element.color} setCurrentFigure={setCurrentFigure} figure_drop={figure_drop} table={tableRef} drag={start_dragging} />
                    }
                })}
                </div>
            }) : <div></div>}  
        </div>
    )
}

export default Game