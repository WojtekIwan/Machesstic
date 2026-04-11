import { useState } from "react"
import {Link} from "react-router-dom"
import axios from "axios"

function Login(){
    const [usernameOrEmail, setUsernameOrEmail] = useState("")
    const [password, setPassword] = useState("")

    const [errorMessage, setErrorMessage] = useState("")

    function check_login_data(e){
        e.preventDefault()
        console.log(`Email or username: ${usernameOrEmail} Password: ${password}`)
        axios.post("http://localhost:3000/user/login", {"usernameOrEmail": usernameOrEmail, "password": password}).then((res) => {
            console.log(res.data)
            if(res.data.code == 200){
                console.log("Create a JWT token")
            }else if(res.data.code == 400){
                setErrorMessage(p=> res.data.message)
                console.log(res.data, res.data.message)
            }
        })
    }

    return (
        <div>
            {/* Logging in form */}
            <div>
                <h2>Log into Machesstic</h2>

                <input type="text" placeholder="Enter your username or email..." id="usernameOrEmail" onChange={(e) => setUsernameOrEmail(p => e.target.value)}/>

                <input type="password" placeholder="Enter your password..." id="password" onChange={(e) => setPassword(p => e.target.value)}/>

                {errorMessage}

                <button onClick={(e) => check_login_data(e)}>Log into your account</button>
            </div>
        </div>
    )
}

export default Login