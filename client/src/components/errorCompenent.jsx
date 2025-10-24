import "../../styles/error_styles.css"
import notFound from "../../public/notFound.gif"
import { Link } from "react-router-dom"

function ErrorComponent(){
    return (
        <div className="main">
            <div id="error_element">
                <img src={notFound} id="error_gif" alt="Not found gif"/>
                <h2>Error 404</h2>
                <p>You get lost! This page dosen`t exist.</p>
                <Link className="link" to={"/"}>Go back</Link>
            </div>
        </div>
    )
}

export default ErrorComponent