import { useEffect } from "react"
import axios from "axios"
import { useState } from "react"

function UserPage(){
    let [username, setUsername] = useState("")
    useEffect(() => {
        axios.get("http://localhost:3000/user/get_user_data", {withCredentials: true}).then(res => {
            setUsername(p => res.data.username)
        })
    }, [])

    function find_game(e){

    }

    return (
        <div>
            <p>Welcome to our site {username}!</p>
            <button onClick={(e) => find_game(e)}>Find game</button>
        </div>
    )
}

export default UserPage