import { useState } from "react"
import {Link} from "react-router-dom"
import axios from "axios"
import "../../styles/main.scss"
import logo from "../../assets/logo.png"

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
                send_request_to_create_jwt_token(res.data.data[0].id)
                window.location = "/user"
            }else if(res.data.code == 400){
                setErrorMessage(p=> res.data.message)
                console.log(res.data, res.data.message)
            }
        })
    }

    function send_request_to_create_jwt_token(user_id){
        axios.post("http://localhost:3000/user/create_jwt", {"user_id": user_id}, {withCredentials: true}).then(res => {
            console.log(res.status, res.data)
        })
    }

    return (
        <div id="log-in-form">
            {/* Logging in form */}
            <div>
                <img src={logo} alt="Logo for Machesstic" />

                <h2>Log into your account:</h2>

                <input type="text" placeholder="Enter your username or email..." id="usernameOrEmail" onChange={(e) => setUsernameOrEmail(p => e.target.value)}/>

                <input type="password" placeholder="Enter your password..." id="password" onChange={(e) => setPassword(p => e.target.value)}/>

                <p className="error_paragraph">{errorMessage}</p>

                <button onClick={(e) => check_login_data(e)}>Log into your account</button>
                
                <Link to={"/user/create_account"} id="toCreateAccount">Don`t have account? Create one here</Link>
            </div>
        </div>
    )
}

export default Login