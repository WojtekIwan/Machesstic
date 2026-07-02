import { useEffect, useRef, useContext } from "react"
import axios from "axios"
import { useState } from "react"
// import io from 'socket.io-client';
import "../../styles/main.scss"

import Figure from "./figure";
import Tile from "./tile";

import { socketContext } from "../../main";


function Game(){
    const [username, setUsername] = useState("")
    const [id, setId] = useState("")
    
    const socket = useContext(socketContext)

    // Board section
    let board_length = 8
    const [visualBoard, setVisualBoard] = useState(() => {
        let tab = []
        for(let i = 0; i < board_length; i++){
            tab.push([])
            for(let j = 0; j < board_length; j++){
                tab[i].push({x: i, y: j})
            }
        }
        return tab
    })

    let currentTileRef = useRef(null)

    let [dropped, setDropped] = useState(false)
    let droppedRef = useRef(null)
    let [currentFigure, setCurrentFigure] = useState(null)

    const backRef = useRef(null)
    
    useEffect(() => {
        axios.get("http://localhost:3000/user/get_user_data", {withCredentials: true}).then(res => {
            setUsername(p => res.data.username)
            setId(p => res.data.user_id)
            console.log(socket)
            socket.emit("get_game_data", res.data.user_id)
        })

    }, [])

    useEffect(() => {
        socket.on("board_data", a)

        function a (board, color){
            console.log("Board data: ", board, color)
        }

        return () => {
            socket.off("board-data", a)
        }
    }, [socket])

    function change_current_tile(new_x, new_y, tile){
        currentTileRef.current = {"x": new_x, "y": new_y, "tile": tile}
        // After updating tile check if figure was dropped. Then drop it
        if(dropped && currentFigure != null){
            currentFigure.figure.style.pointerEvents = "all"
            currentFigure.update_pos(new_x, new_y)
            setDropped(p => false)
            setCurrentFigure(p => null)
        }
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
            <Figure x={7} y={7} setCurrentFigure={setCurrentFigure} figure_drop={figure_drop} table={tableRef} />
        </div>
    )
}

export default Game