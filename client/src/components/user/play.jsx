import axios from "axios"
import { useState, useContext } from "react"
import SideBar from "./sidebar"
import "../../styles/main.scss"

export default function Play(props){
    const [waiting, setWaiting] = useState(false)

    function find_game(e){
        axios.get("http://localhost:3000/find_game", {withCredentials: true}).then(res => {
            console.log(res.status)
        })
    }
    return (
        <div className="user_page">
            <SideBar/>
            <h2>Play</h2>
            <section>  
                <p>{waiting ? "Searching for enemy..." : ""}</p>
                <button onClick={(e) => find_game(e)}>Find game</button>
            </section>
        </div>
    )
}