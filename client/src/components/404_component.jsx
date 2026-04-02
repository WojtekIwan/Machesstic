import "../styles/main.scss"
import {Link} from "react-router-dom"
import lostGif from "../assets/404.gif"

function Error(){
    return (
        <div id="error-component">
            <div>
                <img src={lostGif} alt="Lost gif" />
                <h2>404 - page not found</h2>
                <Link to={"/"} className="link">Go back to main page</Link>
            </div>
        </div>
    )
}

export default Error