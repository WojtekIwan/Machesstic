// +---------------------------------------------------------------------------------+
// |                                PLAY COMPONENT                                   |
// |               Starting games and playing with other players                     |
// +---------------------------------------------------------------------------------+

// Basic imports
import axios from "axios"
import { useState, useContext } from "react"
import SideBar from "./sidebar"
import "../../styles/main.scss"
import { socketContext } from "../../main";

// Play component
export default function Play(){
    const [waiting, setWaiting] = useState(false)
    const socket = useContext(socketContext) // Getting reference to socket

    const [gameTime, setGameTime] = useState(600) // Defult 10m
    const [gameTimeOptions, setGameTimeOptions] = useState([60, 300, 600]) // Possible times: 1m 5m 10m

    // Waiting for enother player
    function play_with_another_player(e){
        setWaiting(p => true)
        axios.get(`http://localhost:3000/find_game/${gameTime}`, {withCredentials: true}).then(res => {
            console.log("Finding game...")
            console.log(socket.id)
        })
    }

    // Canceling the matchmaking
    function cancel_search(e){
        axios.post(`http://localhost:3000/cancel_game_find`, {}, {withCredentials: true}).then(res => {
            console.log("Matchmaking canceled")
            setWaiting(p => false)
        })
    }
    
    return (
        <div id="play">
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
                    {waiting ? 
                        <button onClick={(e) => cancel_search(e)}>Cancel</button>
                    :
                        <button onClick={(e) => play_with_another_player(e)}>Find game</button>
                    }
                </div>
            </section>
        </div>
    )
}