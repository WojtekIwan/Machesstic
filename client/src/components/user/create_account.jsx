import axios from "axios"
import { useState } from "react"
import "../../styles/main.scss"

function CreateAccount(){
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [repeatePassword, setRepeatPassword] = useState("")

    const [errorMessage, setErrorMessage] = useState("")

    function create_account(e){
        e.preventDefault()
        console.log(`Username: ${username} email: ${email} password: ${password} repated password: ${repeatePassword}`)

        axios.post("http://localhost:3000/user/create_user", {
            "username": username,
            "email": email,
            "password": password,
            "repeatePassword": repeatePassword
        }).then((res) => {
            if(res.data.code == 400){
                setErrorMessage(p => res.data.message)
                console.log(res.data.message)
            }else if(res.status == 200){
                console.log("Succesfull")
                // Redirecting to log in page (token is not created yet)
                window.location = "/login"
            }
        })
    }

    return (
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
        </div>
    )
}

export default CreateAccount