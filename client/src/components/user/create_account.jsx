import axios from "axios"
import { useState } from "react"

function CreateAccount(){
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [repeatePassword, setRepeatPassword] = useState("")

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
                console.log(res.data.message)
            }
        })
    }

    return (
        <div>
            <h2>Create account in Machesstic</h2>

            <label htmlFor="username">Enter your username:</label>
            <input type="text" id="username" onChange={(e) => setUsername(p => e.target.value)}/>

            <label htmlFor="email">Enter your email:</label>
            <input type="email" id="email" onChange={(e) => setEmail(p => e.target.value)}/>

            <label htmlFor="password">Create a password:</label>
            <input type="password" id="password" onChange={(e) => setPassword(p => e.target.value)}/>

            <label htmlFor="repeated_password">Enter your email:</label>
            <input type="password" id="repeated_password" onChange={(e) => setRepeatPassword(p => e.target.value)}/>

            <button onClick={(e) => create_account(e)}>Create your account</button>
        </div>
    )
}

export default CreateAccount