// ***********************************************************************************
//                                 ENDGAME MODULE
//       When game end box with info whose won, by what and updated ranking is showed.
//                      You can also play again and go back to menu  
// ***********************************************************************************

// Imports
import { Link } from "react-router-dom";
import "../../../styles/main.scss";
import { useEffect, useRef, useContext } from "react"

import { socketContext } from "../../../main";

export default function Endgame(props){
    const socket = useContext(socketContext) // Socket context shaerd with all files
    
    useEffect(() => {
        function start (game_id) {
            navigate(`/game/${game_id}`)
        }

        socket.on("start-game", start)

        return () => {
            socket.off("start-game", start)
        }
    })
    
    // Rendering endgame window
    return(
        <div id="endgame_container">
            <h2>{props.won == 1 ? "You won" : "You lost"}</h2>
            <span>By {props.reason}</span>
            <p>Elo: {props.elo} {props.won == 1 ? "+" : "-"} {Math.abs(props.reward)} = {props.elo + props.reward}</p>
            <div>
                <Link className="btn" to={"/user"}>Play again</Link>
                <button className="btn">Main menu</button>
            </div>
        </div>
    )
}