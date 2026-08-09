// ***********************************************************************************
//                                SIDEBAR COMPONENT
//                     Quick navigation for user between sites
// ***********************************************************************************

// Imports
import { Link } from "react-router-dom"
import userDefault from "../../assets/user_default.png"
import logo from "../../assets/logo.png"
import { userContext } from "../../main"
import { useContext, useEffect } from "react"

export default function SideBar(){
    const user = useContext(userContext) // User context is a variable that stores basic user info. It`s created in Main component

    return (
        <nav>
            {/* Profile */}
            <img className="logo" src={logo} alt="machesstic logo" />

            <Link className="link_to_page" to={"/user/play"}>Play</Link>
            <Link className="link_to_page" to={"/user/friends"}>Friends</Link>
            <Link className="link_to_page" to={"/user/game_history"}>Game history</Link>
            <Link className="link_to_page" to={"/about"}>About</Link>

            <Link className="profile" to={"/user/profile"}>
                <img src={userDefault} alt="user deafult image" />
                <div>
                    <h2>{user.username}</h2>
                    <p>Elo raiting: {user.elo}</p>
                </div>
            </Link>

            <Link className="log_out" to={"/user/login"}>Log out</Link>
        </nav>
    )
}