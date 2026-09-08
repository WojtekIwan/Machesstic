// +---------------------------------------------------------------------------------+
// |                              SIDEBAR COMPONENT                                  |
// |                   Quick navigation for user between sites                       |
// +---------------------------------------------------------------------------------+

// Imports
import { Link } from "react-router-dom"
import logo from "../../assets/logo.png"

import { useContext } from "react"
import { userContext } from "../../main"
import { socketContext } from "../../main";

import axios from "axios"

import user_default from "../../assets/user_default.png"

// Siedbar component
export default function SideBar(){
    const user = useContext(userContext) // Variable that stores basic user info
    const socket = useContext(socketContext) // Connection with server by socket
    
    // Logging out when user clicks Link
    function logout(){
        axios.get("http://localhost:3000/user/logout", {withCredentials: true}).then(res => {
            console.log("You have been logged out!")
            if(socket.connected) socket.disconnect()
        })
        // Didn`t use catch because only 401 and 403 can occur here and they are handled in main
    }

    return (
        <nav>
            {/* Profile */}
            <img className="logo" src={logo} alt="machesstic logo" />

            {/* Links for diffrent subsites */}
            <Link className="link_to_page" to={"/user/play"}>Play</Link>
            <Link className="link_to_page" to={"/user/friends"}>Friends</Link>
            <Link className="link_to_page" to={"/about"}>About</Link>

            {/* Link for user profile (img has this date thing so react would update it on change) */}
            <Link className="profile" to={"/user/profile"}>
                <img src={`http://localhost:3000/uploads/${user.profile_picture}?t=${new Date().getTime()}`} onError={e => {e.target.src = user_default}} alt="user deafult image" />
                <div>
                    <h2>{user.username}</h2>
                    <p>Elo raiting: {user.elo}</p>
                </div>
            </Link>

            {/* Logout button */}
            <Link onClick={logout} className="log_out" to={"/user/login"}>Log out</Link>
        </nav>
    )
}