// +---------------------------------------------------------------------------------+
// |                           USER PAGE COMPONENT                                   |
// |    It`s responsible all user operations (playing games, viewing profile etc.)   |
// +---------------------------------------------------------------------------------+

// Imports
import { useContext } from "react"
import { userContext } from "../../main";

import "../../styles/main.scss"

import SideBar from "./sidebar";
import { Link } from "react-router-dom";

// Main user page component
export default function UserPage(){
    const user = useContext(userContext) // Basic user data

    return (   
        <div className="user_page">
            {/* Side-navigation */}
            <SideBar />
            <section>
                <div className="main_page">
                    <h2>Welcome {user.username}!</h2>
                    <p>Ready to play some games?</p>
                    <Link to="/user/play" className="link">Play game</Link>
                </div>
            </section>
        </div>
    )
}