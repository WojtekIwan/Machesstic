import { useEffect } from "react"
import axios from "axios"
import { useState } from "react"
import io from 'socket.io-client';
import "../../styles/main.scss"

import Figure from "./figure";
import Tile from "./tile";

const socket = io.connect('http://localhost:3000');

function Game(){
    const [username, setUsername] = useState("")
    const [id, setId] = useState("")

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

    let [currentTile, setCurrentTile] = useState({})

    let [dropped, setDropped] = useState(false)
    let [currentFigure, setCurrentFigure] = useState({})

    
    useEffect(() => {
        axios.get("http://localhost:3000/user/get_user_data", {withCredentials: true}).then(res => {
            setUsername(p => res.data.username)
            setId(p => res.data.user_id)

            socket.emit("update_socket", res.data.user_id)
        })
    }, [])

    function change_current_tile(new_x, new_y){
        setCurrentTile(p => ({"x": new_x, "y": new_y}))
    }

    function figure_drop(figure_callback, e){
        e.target.style.pointerEvents = "none"
        setDropped(p => true)
        // figure_callback(currentTile)
    } 

    function updateMouseCords(e){
        let table_box = e.currentTarget.getBoundingClientRect()
        let x = e.clientX - table_box.left
        let y = e.clientY - table_box.top
        if(dropped){
            currentFigure.update_pos((Math.round(Math.max(x, 0) / 64)), (Math.round(Math.max(y, 0) / 64)))

            currentFigure.figure.style.left = `${e.target.getBoundingClientRect().left}px`
            currentFigure.figure.style.top = `${e.target.getBoundingClientRect().top}px`
            currentFigure.figure.style.pointerEvents = "all"
        }
        setDropped(p => false)
    }

    return (
        <div>
            <h1>You are in game {username}!</h1>
            <table id="game_board" onMouseMove={(e) => updateMouseCords(e)}>
                <tbody>
                    {visualBoard.map((row, index) => {
                        return <tr key={index}>{row.map((tile) => {
                            return <td><Tile key={tile.x * board_length + tile.y} x={tile.x} y={tile.y} set_current={change_current_tile} /></td>
                        })
                    }</tr>})}
                </tbody>
            </table>
            <Figure x={0} y={0} currentTile={currentTile} setCurrentFigure={setCurrentFigure} figure_drop={figure_drop} />
        </div>
    )
}

export default Game