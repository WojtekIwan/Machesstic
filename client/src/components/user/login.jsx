// ***********************************************************************************
//                                   LOGIN COMPONENT
//          It`s responsible for user logging in and validating login data
// ***********************************************************************************

// Imports
import { useState } from "react"
import {Link, useNavigate} from "react-router-dom"
import axios from "axios"
import "../../styles/main.scss"
import logo from "../../assets/logo.png"

export default function Login(){
    const [usernameOrEmail, setUsernameOrEmail] = useState("")
    const [password, setPassword] = useState("")

    const [errorMessage, setErrorMessage] = useState("")

    const navigate = useNavigate()

    // Sending data to backend and validate it
    function check_login_data(e){
        e.preventDefault() // Not redirecting to another page yet
        // Sending request to log user in
        axios.post("http://localhost:3000/user/login", {"usernameOrEmail": usernameOrEmail, "password": password}).then((res) => {
            send_request_to_create_jwt_token(res.data.id)
        }).catch(error => {
            // Catch error from server (wrong password, not filling every input etc)
            setErrorMessage(p=> error.response.status == 400 ? error.response.data.message : "Unexpected error")
        })
    }

    // Sending request for creating jwt token
    function send_request_to_create_jwt_token(user_id){
        axios.post("http://localhost:3000/user/create_jwt", {"user_id": user_id}, {withCredentials: true}).then(res => {
            navigate("/user") // After creating tokens navigate to user main page
        }).catch((err) => {
            setErrorMessage(p=> "Unexpected error")
        })
    }

    // Component render
    return (
        <div id="log-in-form">
            <div>
                <img src={logo} alt="Logo for Machesstic" />

                <h2>Log to your account</h2>

                <input type="text" placeholder="Enter your username or email..." id="usernameOrEmail" onChange={(e) => setUsernameOrEmail(p => e.target.value)}/>

                <input type="password" placeholder="Enter your password..." id="password" onChange={(e) => setPassword(p => e.target.value)}/>

                <p className="error_paragraph">{errorMessage}</p>

                <button onClick={(e) => check_login_data(e)}>Log into your account</button>
                
                <Link to={"/user/create_account"} id="toCreateAccount">Don`t have account? Create one here</Link>
            </div>
        </div>
    )
}