import axios from "axios"
import { useState } from "react"
import "../../styles/main.scss"

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

            // Redirecting to log in page (token is not created yet)
            // window.location = "/login"
            
        }).catch(error => {
            if(error.response){
                setErrorMessage(p => error.response.data.error_messsage)
                console.log(error.response.data.error_messsage)
            }
        })
    }

    function verify_code(e){
        e.preventDefault()
        axios.get(`http://localhost:3000/user/verify_code/${code}`, {withCredentials: true}).then(res => {
            console.log("Correct code!!!!!")
        }).catch(error => {
            if(error.response){
                console.log(error.response)
            }
        })
    }

    return (
        <div>
            {validated // If validated show email verification form
            ? 
            <div id="create-account-form">
                <div>
                    <h2>Validate code</h2>
                    <p>Validation code was send to your email.</p>

                    <input type="text" id="code" placeholder="Enter your code..." onChange={(e) => setCode(p => e.target.value)}/>

                    <button onClick={(e) => verify_code(e)}>Confirm code</button>
                </div>
            </div>
            :
            <div id="create-account-form">
                <div>
                    <h2>Create account in Machesstic</h2>
                    <input type="text" id="username" placeholder="Enter your username..." onChange={(e) => setUsername(p => e.target.value)}/>

                    <input type="email" id="email" placeholder="Enter your email..." onChange={(e) => setEmail(p => e.target.value)}/>


                    <input type="password" id="password" placeholder="Enter password..." onChange={(e) => setPassword(p => e.target.value)}/>

                    <input type="password" id="repeated_password" placeholder="Repeat your password..." onChange={(e) => setRepeatPassword(p => e.target.value)}/>

                    <p>{errorMessage}</p>

                    <button onClick={(e) => create_account(e)}>Create your account</button>
                </div>
            </div>}
        </div>
    )
}

export default CreateAccount