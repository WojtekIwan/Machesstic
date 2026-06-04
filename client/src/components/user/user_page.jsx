import { useEffect } from "react"
import axios from "axios"
import { useState } from "react"
import io from 'socket.io-client';

const socket = io.connect('http://localhost:3000');

socket.on("test", () => {
    console.log("SOmething happend!")
})

function UserPage(){
    const [username, setUsername] = useState("")
    const [id, setId] = useState("")

    useEffect(() => {
        axios.get("http://localhost:3000/user/get_user_data", {withCredentials: true}).then(res => {
            setUsername(p => res.data.username)
            setId(p => res.data.user_id)

            socket.emit("join_server", res.data.user_id, res.data.username)
        })
    }, [])

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