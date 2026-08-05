// ***********************************************************************************
//                             CREATE ACCOUNT COMPONENT
//                   Creating account by user and validating data
// ***********************************************************************************

// Imports
import axios from "axios"
import { useState } from "react"
import "../../styles/main.scss"
import logo from "../../assets/logo.png"
import {useNavigate} from "react-router-dom"

export default function CreateAccount(){
    // Varibles - user data
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [repeatePassword, setRepeatPassword] = useState("")

    const [errorMessage, setErrorMessage] = useState("")

    // Varibles - verification section
    const [validated, setValidated] = useState(false)
    const [code, setCode] = useState("")

    const [veryfing, setVeryfing] = useState("")

    const navigate = useNavigate()

    // Validate user data
    function validate_account(e){
        e.preventDefault() // Prevent from redirecting to next page
        // Send request for validating user data. Then the code is sent
        let userData = {"username": username, "email": email, "password": password, "repeatePassword": repeatePassword}
        setVeryfing(p => "Veryfing data...")
        setErrorMessage(p => "")     
        axios.post("http://localhost:3000/user/verify_user", userData, {withCredentials: true}).then((res) => {
            setValidated(p => res.data.validated) // Changing form     
            setVeryfing(p => "")
        }).catch(error => {
            // Little bit of time out for preventing the flickering effect
            setTimeout(() => {
                setVeryfing(p => "")
                setErrorMessage(p => error.response.data.error_message)
            }, 500)
        })
    }

    // Send verification request to backend
    function verify_code(e){
        e.preventDefault() // Prevent loading to another page
        let userData = {"username": username, "email": email, "password": password, "repeatePassword": repeatePassword}
        axios.post(`http://localhost:3000/user/verify_code/${code}`, userData, {withCredentials: true}).then(res => {
            setVeryfing(p => "Verification complete! Redirecting to login...")
            // Redirecting to log in page after short delay (visualy it looks better)
            setTimeout(() => {
                navigate("/user/login")
            }, 500)
        }).catch(error => {
            setErrorMessage(p => error.response.data.error_message)
        })
    }

    return (
        <div>
            {validated // If validated show email verification form
            ? 
            <div id="code-form">
                <div>
                    <img src={logo} alt="Logo for Machesstic" />

                    <h2>Validate code</h2>
                    <p className="code-text">Validation code was send to your email.</p>

                    <input key="code" autoComplete="off" type="text" id="code" placeholder="Enter your code..." onChange={(e) => setCode(p => e.target.value)}/>

                    {veryfing ? <p className="veryfing">{veryfing}</p> : <p className="error_message">{errorMessage}</p>}

                    <button onClick={(e) => verify_code(e)}>Confirm code</button>
                </div>
            </div>
            : // If not show normal create account form
            <div id="create-account-form">
                <div>
                    <img src={logo} alt="Logo for Machesstic" />

                    <h2>Create account in Machesstic</h2>

                    <input type="text" id="username" autoComplete="off" placeholder="Enter your username..." onChange={(e) => setUsername(p => e.target.value)}/>

                    <input type="email" id="email" autoComplete="off" placeholder="Enter your email..." onChange={(e) => setEmail(p => e.target.value)}/>

                    <input type="password" id="password" placeholder="Enter password..." onChange={(e) => setPassword(p => e.target.value)}/>

                    <input type="password" id="repeated_password" placeholder="Repeat your password..." onChange={(e) => setRepeatPassword(p => e.target.value)}/>

                    {veryfing ? <p className="veryfing">{veryfing}</p> : <p className="error_message">{errorMessage}</p>}
                
                    <button onClick={(e) => validate_account(e)}>Create your account</button>
                </div>
            </div>}
        </div>
    )
}