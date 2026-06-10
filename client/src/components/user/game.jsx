import { useEffect } from "react"
import axios from "axios"
import { useState } from "react"
import io from 'socket.io-client';
import "../../styles/main.scss"

const socket = io.connect('http://localhost:3000');

function Game(){
    const [username, setUsername] = useState("")
    const [id, setId] = useState("")

    // Board section
    let [visualBoard, setVisualBoard] = useState([])
    let board_length = 8

    let [currentTile, setCurrentTile] = useState(null)

    let [mousedown, setMousedown] = useState(false)
    
    // Figure section
    let [figure, setFigure] = useState()

    useEffect(() => {
        axios.get("http://localhost:3000/user/get_user_data", {withCredentials: true}).then(res => {
            setUsername(p => res.data.username)
            setId(p => res.data.user_id)

            socket.emit("update_socket", id)
        })

        generate_board()
    }, [])
    
    useEffect(e => {
        setFigure(p => <div className="figure" onMouseMove={(e) => {
            if(mousedown){         
                console.log(e.clientX, e.clientY)
                e.target.style.left = `${e.clientX - 32}px`
                e.target.style.top = `${e.clientY - 32}px`
            }
        }}></div>)
        window.addEventListener("mousedown", md)

        function md(e){
            setMousedown(p => true)
            console.log(mousedown)
        }

        window.addEventListener("mouseup", mp)

        function mp(e){
            setMousedown(p => false)
            console.log(mousedown)
        }

        return () => {
            window.removeEventListener("mousedown", md)
            window.removeEventListener("mouseup", mp)
        }
    }, [mousedown])

    function change_current_tile(e, tile){
        setCurrentTile(p => tile)
    }

    function generate_board(){
        for(let i = 0; i < board_length * board_length; i++){
            let tile = <div key={i} onMouseEnter={(e) => change_current_tile(e, this)} className={(parseInt(i / 8) + i) % 2 == 0 ? "dark_tile chess_tile" : "light_tile chess_tile"}></div>
            
            setVisualBoard(p => [...p, tile])
        }
    }

    return (
        <div>
            <h1>You are in game {username}!</h1>
            <div id="game_board">
                {visualBoard.map(row => {
                    return row
                })}
            </div>
            {figure}   
        </div>
    )
}

export default Game