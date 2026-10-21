// +---------------------------------------------------------------------------------+
// |                                ABOUT COMPONENT                                  |
// |                  It shows a little bit about application and author             |
// +---------------------------------------------------------------------------------+

// Imports
import SideBar from "./user/sidebar";
import github_logo from "../assets/github.png"
import linkedin_logo from "../assets/linkedin.svg"
import { useState } from "react";
import axios from "axios";

// About component
export default function About(){
    // Necessary variables
    let [message, setMessage] = useState("")
    let [response, setResponse] = useState("")
    
    // Submiting error function
    function submit_error(e){
        if(message == "" && e.target.disabled) return false

        e.target.disabled = true
        e.target.style.backgroundColor = "#323232"

        axios.post("http://localhost:3000/user/submit_error", {error_message: message}, {withCredentials: true}).then(res => {
            setResponse(previous => res.data.message)
        }).catch(error => {
            setResponse(previous => error.response.data.message)
        }).finally(() => {
            e.target.disabled = false
            e.target.style.backgroundColor = "#FE66C4"
        }) 
    }

    return (
        <div id="about">
            <SideBar/>
            <div id="about_container">
                <h2>About Machesstic</h2>

                <p>This application was created because such game as chess should be free with no ads and easy accessable to anyone.</p>
                
                <h3>Details about the app</h3>
                <p>In this list I placed most important functionalities of the app</p>
                <ul>
                    <li>♟️ Matchmaking: depending on how much elo you got you will be matched against oponents on similar elo</li>
                    <li>⌛ In case of disconnect: when you or your opponent disconnects you have 10s to reconnect</li>
                    <li>👤 All profiles are public: you can see your`s and your enemies profiles</li>
                    
                </ul>

                <p>In this list I placed what`s about to be added in the future</p>
                <ul>
                    <li>🧩 Puzzles: in the future you will access and solve chess puzzles</li>
                    <li>🤖 Playing with bots: in the future you can play bots in various elo levels</li>
                    <li>📊 More advanced analyze: after game analyze will be improved</li>
                </ul>

                <h3>About author</h3>
                <p>This is my first bigger project, it means a lot to me. I hope you will enjoy playing and using this app. Below you can access links to my github and linkedin:</p>

                {/* Links for profiles */}
                <div>
                    <a href="https://github.com/WojtekIwan">
                        <img src={github_logo} alt="Github logo" />
                    </a>

                    <a href="https://www.linkedin.com/in/wojciech-iwan-ba6647388/">
                        <img src={linkedin_logo} alt="Linkedin logo" />
                    </a>
                </div>

                <h3>Troubleshooting</h3>
                <p>If you spot any mistakes or something that don`t work you can send form below, it will be really helpful to further update and devlop this application.</p>

                <textarea onChange={e => setMessage(previous => e.target.value)} id="textarea" rows={8} cols={10} placeholder="Type what happend and when error occured"  spellCheck={false}></textarea>

                <button onClick={(e) => {submit_error(e)}}>Send error message</button>

                <p>Machesstic Version: 1.0.0</p>
            </div>

            {/* Popup for confirming a error submit */}
            {response ? <div className="popup_info">
                <p>{response}</p>
                <button onClick={e => setResponse(previous => "")}>x</button>
            </div> : <></>}
        </div>
    )
}