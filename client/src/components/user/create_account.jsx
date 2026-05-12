import axios from "axios"
import { useState } from "react"
import "../../styles/main.scss"
import logo from "../../assets/logo.png"

function CreateAccount(){
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [repeatePassword, setRepeatPassword] = useState("")

    const [errorMessage, setErrorMessage] = useState("")

    const [validated, setValidated] = useState(false)

    const [code, setCode] = useState("")

    function create_account(e){
        e.preventDefault()
        console.log(`Username: ${username} email: ${email} password: ${password} repated password: ${repeatePassword}`)
        axios.post("http://localhost:3000/user/verify_user", {
            "username": username,
            "email": email,
            "password": password,
            "repeatePassword": repeatePassword
        }, {withCredentials: true}).then((res) => {
            console.log("Succesfull validated. Email to your account was send")
            setValidated(p => res.data.validated)
            setErrorMessage(p => "")            
        }).catch(error => {
            if(error.response){
                setErrorMessage(p => error.response.data.error_message)
            }
        })
    }

    function verify_code(e){
        e.preventDefault()
        axios.post(`http://localhost:3000/user/verify_code/${code}`, {
            "username": username,
            "email": email,
            "password": password,
            "repeatePassword": repeatePassword
        }, {withCredentials: true}).then(res => {
            // Redirecting to log in page
            window.location = "/user/login"
        }).catch(error => {
            if(error.response){
                setErrorMessage(p => error.response.data.error_message)
            }
        })
    }

    return (
        <div>
            {validated // If validated show email verification form
            ? 
            <div id="create-account-form">
                <div>
                    <img src={logo} alt="Logo for Machesstic" />
                    <h2>Validate code</h2>
                    <label>Validation code was send to your email.</label>

                    <input type="text" id="code" placeholder="Enter your code..." onChange={(e) => setCode(p => e.target.value)}/>

                    <p className="error_message">{errorMessage}</p>

                    <button onClick={(e) => verify_code(e)}>Confirm code</button>
                </div>
            </div>
            : // If not show normal create account form
            <div id="create-account-form">
                <div>
                    <img src={logo} alt="Logo for Machesstic" />

                    <h2>Create account in Machesstic</h2>
                    <input type="text" id="username" placeholder="Enter your username..." onChange={(e) => setUsername(p => e.target.value)}/>

                    <input type="email" id="email" placeholder="Enter your email..." onChange={(e) => setEmail(p => e.target.value)}/>


                    <input type="password" id="password" placeholder="Enter password..." onChange={(e) => setPassword(p => e.target.value)}/>

                    <input type="password" id="repeated_password" placeholder="Repeat your password..." onChange={(e) => setRepeatPassword(p => e.target.value)}/>

                    <p className="error_message">{errorMessage}</p>

                    <button onClick={(e) => create_account(e)}>Create your account</button>
                </div>
            </div>}
        </div>
    )
}

export default CreateAccount