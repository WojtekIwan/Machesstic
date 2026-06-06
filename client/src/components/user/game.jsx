import { useEffect } from "react"
import axios from "axios"
import { useState } from "react"
import io from 'socket.io-client';
import "../../styles/main.scss"

const socket = io.connect('http://localhost:3000');

function Game(){
    const [username, setUsername] = useState("")
    const [id, setId] = useState("")
    let [visualBoard, setVisualBoard] = useState([])
    let board_length = 8

    useEffect(() => {
        axios.get("http://localhost:3000/user/get_user_data", {withCredentials: true}).then(res => {
            setUsername(p => res.data.username)
            setId(p => res.data.user_id)

            socket.emit("update_socket", id)
        })

        generate_board()
    }, [])

    function generate_board(){
        for(let i = 0; i < board_length * board_length; i++){
            setVisualBoard(p => [...p, <div className={(parseInt(i / 8) + i) % 2 == 0 ? "dark_tile chess_tile" : "light_tile chess_tile"}></div>])
        }//CIASTKA SĄ UNDEFINED Z JAKIEGOS POWODU NAPRAW TO
    }

    return (<div>
        <h1>You are in game {username}!</h1>
        <div id="game_board">
            {visualBoard.map(row => {
                return row
            })}
        </div>    
        </div>)
}

export default Game