import { useState } from "react"
import {Link} from "react-router-dom"

function Login(){
    const [usernameOrEmail, setUsernameOrEmail] = useState("")
    const [password, setPassword] = useState("")

    function check_login_data(e){
        e.preventDefault()
        console.log(`Email or username: ${usernameOrEmail} Password: ${password}`)
    }

    return (
        <div>
            {/* Logging in form */}
            <div>
                <h2>Log into Machesstic</h2>

                <label htmlFor="usernameOrEmail">Enter your email or username:</label>
                <input type="text" id="usernameOrEmail" onChange={(e) => setUsernameOrEmail(p => e.target.value)}/>

                <label htmlFor="password">Enter your password:</label>
                <input type="password" id="password" onChange={(e) => setPassword(p => e.target.value)}/>

                <button onClick={(e) => check_login_data(e)}>Log into your account</button>
            </div>
        </div>
    )
}

export default Login