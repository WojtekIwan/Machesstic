import { useEffect, useContext } from "react"
import axios from "axios"
import { useState } from "react"
import io from 'socket.io-client';
import "../../styles/main.scss"
import { Link, useNavigate } from 'react-router-dom';
import { socketContext } from "../../main";


function UserPage(){
    const socket = useContext(socketContext)
    
    const [username, setUsername] = useState("")
    const [id, setId] = useState("")
    const navigate = useNavigate()

    useEffect(() => {
        axios.get("http://localhost:3000/user/get_user_data", {withCredentials: true}).then(res => {
            if(res.data.code == 403){
                navigate("/user/login")
                alert("You have been logged out. Log in again")
            }
            setUsername(p => res.data.username)
            setId(p => res.data.user_id)

            socket.emit("join-server", res.data.user_id, res.data.username, res.data.elo)
        })
        
    }, [])

    useEffect(() => {
        function start (game_id) {
            navigate(`/game/${game_id}`)
        }

        socket.on("start-game", start)

        return () => {
            socket.off("start-game", start)
        }
    })

    function find_game(e){
        axios.get("http://localhost:3000/find_game", {withCredentials: true}).then(res => {
            console.log(res.status)
        })
    }

    return (   
        <div>
            <p>Welcome to our site {username}!</p>
            <button onClick={(e) => find_game(e)}>Find game</button>
        </div>
    )
}

export default UserPage