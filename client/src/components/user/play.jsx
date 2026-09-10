// +---------------------------------------------------------------------------------+
// |                                PLAY COMPONENT                                   |
// |               Starting games and playing with other players                     |
// +---------------------------------------------------------------------------------+

// Basic imports
import axios from "axios"
import { useState, useContext, useEffect } from "react"
import SideBar from "./sidebar"
import "../../styles/main.scss"
import { socketContext } from "../../main";
import { useNavigate } from "react-router-dom";

// Play component
export default function Play(){
    const [waiting, setWaiting] = useState(false)
    const socket = useContext(socketContext) // Getting reference to socket

    const navigate = useNavigate()

    const [gameTime, setGameTime] = useState(600) // Defult 10m
    const [gameTimeOptions, setGameTimeOptions] = useState([60, 300, 600]) // Possible times: 1m 5m 10m

    // UseEffect with socket io event for starting game
    useEffect(() => {
        function start(game_id){
            setWaiting(p => false)
            navigate(`/game/${game_id}`)
        }

        socket.on("start-game", start)

        return () => {socket.off("start-game", start)}
    })

    function play_with_another_player(e){
        setWaiting(p => true)
        axios.get(`http://localhost:3000/find_game/${gameTime}`, {withCredentials: true}).then(res => {
            console.log(res.status)
        })
    }
    
    return (
        <div className="user_page">
            <SideBar/>
            {/* Player section */}
            <section>
                <div className="play_page">
                    <h2>Play Chess Match</h2>
                    <p>Select time:</p>
                    <div>
                        {/* Time select */}
                        {gameTimeOptions.map((element, index) => {
                            return <div style={{backgroundColor: element == gameTime ? "#8B53FF" : "#323232"}} key={index} onClick={e => setGameTime(previous => element)} >{Number(element / 60)}:00</div>
                        })}
                    </div>
                    <p>{waiting ? "Searching for enemy..." : ""}</p>
                    <button onClick={(e) => play_with_another_player(e)}>Find game</button>
                </div>
            </section>
        </div>
    )
}