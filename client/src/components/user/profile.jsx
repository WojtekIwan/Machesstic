// +---------------------------------------------------------------------------------+
// |                              PROFILE COMPONENT                                  |
// |     It shows more detailed info about user (creation date, number of game won   |
// |           and some other stats). Maybe Achivements in the future?               |
// +---------------------------------------------------------------------------------+

// Imports
import SideBar from "./sidebar";
import { useContext, useState } from "react";
import { userContext } from "../../main";
import user_default from "../../assets/user_default.png"
import "../../styles/main.scss"

import axios from "axios";

// Profile component
export default function Profile(){
    const user = useContext(userContext) // Variable contains basic user data (username, profile picture, elo etc.)

    // Once it`s true display edit profile site
    let [editingProfile, setEditingProfile] = useState(false)
    
    // Varibles for editing user profile 
    let [profileUsername, setProfileUsername] = useState("")
    let [profileNote, setProfileNote] = useState("")
    let [profileImage, setProfileImage] = useState("")

    // Error message
    let [errorMessage, setErrorMessage] = useState(null)

    // Function for updating profile
    function submit_profile_changes(e){
        // Setting up data for post request
        let data = new FormData()
        data.append("profileImage", profileImage)
        data.append("profileNote", profileNote)
        data.append("profileUsername", profileUsername)
        
        // Updating user profile
        axios.post("http://localhost:3000/user/update_profile", data, {withCredentials: true}).then((res) => {
            
            // Updating tokens for user (the username is updated immediately after change)
            axios.post("http://localhost:3000/user/refresh_user_tokens", {}, {withCredentials: true}).then(res => {
                user.fetch_data() // Update user data (tokens are now refreshed)
                setEditingProfile(previous => false)
                setErrorMessage(previous => null)
            })

        }).catch(error => {
            setErrorMessage(previous => error.response.data.message)
        })
    }

    return (
        <div className="user_page">
            <SideBar/>
            <section>
                { 
                !editingProfile // If user is not editing a profile display a deafult profile
                ?
                    <div className="profile">
                        <div id="main_profile">
                            {/* Button for going to profile edit */}
                            <button onClick={() => setEditingProfile(previous => true)}>🖋️</button> 
                            <div className="profile_picture">
                                {/* User profile picture */}
                                <img src={`http://localhost:3000/uploads/${user.profile_picture}?t=${new Date().getTime()}`} alt="User profile picture" onError={e => {e.target.src = user_default}} />
                            </div>
                            <div>
                                {/* Basic user data */}
                                <h2>{user.username}</h2>
                                <i>{user.profile_note} - {user.username}</i>  
                                <p>Account created in: {String(user.date).split("T")[0]}</p>

                            </div>
                        </div>

                        {/* Basic info (elo, games played, highest raiting etc) */}
                        <div className="player_game_info">
                            <div><h3>{user.elo}</h3><p>ELO RATING</p></div>
                            
                            <div><h3>{2}</h3><p>TOTAL GAMES</p></div>

                            <div><h3>{130}</h3><p>HIGHEST RAITING</p></div>
                        </div>

                        {/* Ratios for player */}
                        <div className="player_ratios">
                            <div><h3>50%</h3><p>WINS</p></div>

                            <div><h3>0%</h3><p>DRAWS</p></div>

                            <div><h3>50%</h3><p>LOSES</p></div>
                        </div>

                        {/* Playes game history (not ready yet) */}
                        <div className="player_game_history">
                            <p>Nothing to see here yet...</p>
                        </div>
                    </div>
                : // If user is editing the profile display edit window
                    <div className="edit_profile">
                        <h2>Edit your profile</h2>
                        <p>Disclaimer. If don`t want to change something, leave it empty, it will stay the same</p>
                        <button className="go_back" onClick={() => setEditingProfile(previous => false)}>👤</button> 
                        {/* Setting username */}
                        <input type="text" placeholder="Change your username..." onChange={e => setProfileUsername(prevoius => e.target.value)} />

                        {/* Setting profile note */}
                        <input type="text" placeholder="Change your note..." onChange={e => setProfileNote(prevoius => e.target.value)} />

                        {/* Setting input image */}
                        <div>
                            <label>Select profile picture</label>
                            <input type="file" onChange={(e) => setProfileImage(e.target.files[0])}></input>
                        </div>

                        <p className="error_paragraph">{errorMessage}</p>

                        <button onClick={(e) => submit_profile_changes(e)}>Submit changes</button>
                    </div>
                }
            </section>
        </div>
    )
}