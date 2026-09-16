// ***********************************************************************************
//                                 ENDGAME MODULE
//       When game end box with info whose won, by what and updated ranking is showed.
//                      You can also play again and go back to menu  
// ***********************************************************************************

// Imports
import { Link } from "react-router-dom";
import "../../styles/main.scss";

// Rendering endgame window
export default function Endgame(props){
    // Rendering endgame window
    return(
        <div id="endgame_container">
            <h2>{props.won == 1 ? "You won" : "You lost"}</h2>
            <span>By {props.reason}</span>
            <p>Elo: {props.elo} {props.won == 1 ? "+" : "-"} {Math.abs(props.reward)} = {props.elo - props.reward}</p>
            <div>
                <Link className="btn" to={"/user"}>Go to main menu</Link>
            </div>
        </div>
    )
}