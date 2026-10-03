// +---------------------------------------------------------------------------------+
// |                            CUSTOM ERROR COMPONENT                               |
// |    Depending on props you can create custom error such as 404, logout or more   |
// +---------------------------------------------------------------------------------+

// Imports
import "../styles/main.scss"
import {Link} from "react-router-dom"
import { userContext } from "../main"
import { useContext } from "react"

// Custom error component
export default function Error(props){
    const {user} = useContext(userContext) // Getting user context
    return <div id="error-component">
        <div>
            <img src={props.image} alt={props.image_alt} /> 
            <h2>{props.error}</h2>
            <p>{props.additional ? props.additional : ""}</p>
            {/* If user id is defined you go to user page. Otherwise to login page */}
            {user?.id ? 
                <Link to={"/user"} className="link">Go back to main page</Link> 
                : 
                <Link to={"/user/login"} className="link">Go to login page</Link>
            }
        </div>
    </div>
}