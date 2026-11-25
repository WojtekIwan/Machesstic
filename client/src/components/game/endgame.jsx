// +---------------------------------------------------------------------------------+
// |                                 ENDGAME MODULE                                  |
// |             Box with info whose won, why and updated ranking is showed.         |
// |                            You can also go back to menu                         |
// +---------------------------------------------------------------------------------+

// Imports
import { Link } from "react-router-dom";
import "../../styles/main.scss";

// Endgame component
export default function Endgame(props){
    // Rendering endgame window
    return(
        <div id="endgame_container">
            {/* Depending on reason the correct text is displayed (-1 for draw, 0 for lose and 1 for win) */}
            <h2>{props.won == -1 ? "Draw" : props.won == 1 ? "You won" : "You lost"}</h2>
            <span>{props.reason}</span>
            {props.won == 1 ? 
            <p>Elo: {props.elo} + {Math.abs(props.reward)} = {props.elo + props.reward}</p> 
            : 
            <p>Elo: {props.elo} - {Math.abs(props.reward)} = {props.elo + props.reward}</p>}
            <div>
                <Link className="btn" to={"/user"}>Go to main menu</Link>
            </div>
        </div>
    )
}