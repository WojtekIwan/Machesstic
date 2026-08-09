// ***********************************************************************************
//                               GAME HISTORY COMPONENT
//       It`s responsible for showing games that user played (about 20 maximum)
// ***********************************************************************************

// Imports
import SideBar from "./sidebar";

// Game history component
export default function GameHistory(){
    return (
        <div className="user_page"> 
            <SideBar/>
            <h2>Game history</h2>
        </div>
    )
}