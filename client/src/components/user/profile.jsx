// +---------------------------------------------------------------------------------+
// |                              PROFILE COMPONENT                                  |
// |     It shows more detailed info about user (creation date, number of game won   |
// |           and some other stats). Maybe Achivements in the future?               |
// +---------------------------------------------------------------------------------+

// Imports
import SideBar from "./sidebar";
import { useContext, useState, useEffect } from "react";
import { userContext } from "../../main";
import user_default from "../../assets/user_default.png"
import "../../styles/main.scss"
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";

// Profile component
export default function Profile(){
    const {user} = useContext(userContext) // Variable contains basic user data (username, profile picture, elo etc.)
    
    // Profile of user and his games
    const [userProfile, setUserProfile] = useState({}) 
    const [userGames, setUserGames] = useState({}) 

    const params = useParams() // Getting params from url 
    const navigate = useNavigate()

    // Once it`s true display edit profile site
    let [editingProfile, setEditingProfile] = useState(false)
    
    // Varibles for editing user profile 
    let [profileUsername, setProfileUsername] = useState("")
    let [profileNote, setProfileNote] = useState("")
    let [profileImage, setProfileImage] = useState("")

    let [errorMessage, setErrorMessage] = useState(null) // Error message

    // At teh beggining check if user from url exist
    useEffect(() => {
        // If user is logged in and check own account dont fetch
        if(params.username == user.username){
            setUserProfile(previous => user)          
        }else{
            // In other case fetch it or if it fails throw 404
            axios.get(`http://localhost:3000/user/get_other_user_data/${params.username}`, {withCredentials: true}).then(res => {
                setUserProfile(previous => res.data)
            }).catch(error => {
                navigate("/user/404")
            })
        }

        // Getting games data for given user
        axios.get(`http://localhost:3000/user/game_stats/${params.username}`, {withCredentials: true}).then(res => {
            setUserGames(previous => res.data)
        }).catch(error => {
            navigate("/user/404")
        })
    }, [params])

    // Function for updating profile
    function submit_profile_changes(){
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
                            {/* Button for going to profile edit if user is on his own profile*/}
                            {params.username == user.username ? <button onClick={() => setEditingProfile(previous => true)}>🖋️</button>  : <></>}    
                            <div className="profile_picture">
                                {/* User profile picture */}
                                <img src={`http://localhost:3000/uploads/${userProfile.profile_picture}?t=${new Date().getTime()}`} alt="User profile picture" onError={e => {e.target.src = user_default}} />
                            </div>
                            <div>
                                {/* Basic user data */}
                                <h2>{userProfile.username}</h2>
                                <i>{userProfile.profile_note ? userProfile.profile_note +  " - " + userProfile.username : ""}</i>  
                                <p>Account created in: {String(userProfile.date).split("T")[0]}</p>

                            </div>
                        </div>

                        {/* Basic info (elo, games played, highest raiting etc) */}
                        <div className="player_game_info">
                            <div><h3>{userProfile.elo}</h3><p>ELO RATING</p></div>
                            
                            <div><h3>{userGames.basic_data.all_games}</h3><p>TOTAL GAMES</p></div>

                            <div><h3>{userProfile.maximal_elo}</h3><p>HIGHEST RAITING</p></div>
                        </div>

                        {/* Ratios for player (all games must be higher then zero) */}
                        {userGames.basic_data &&  userGames.basic_data.all_games != 0 ? 
                        <div className="player_ratios">
                            <div><h3>{Math.round(userGames.basic_data.games_won / userGames.basic_data.all_games) * 100}%</h3><p>WINS</p></div>

                            <div><h3>{Math.round(userGames.basic_data.games_draw / userGames.basic_data.all_games) * 100}%</h3><p>DRAWS</p></div>

                            <div><h3>{Math.round(userGames.basic_data.games_lost / userGames.basic_data.all_games) * 100}%</h3><p>LOSES</p></div>
                        </div> : <div className="player_ratios"></div>}
                        

                        {/* Playes game history (not ready yet) */}
                        <div className="player_game_history">
                        {userGames.games && userGames.basic_data.all_games != 0 ? 
                            <div>
                                {userGames.games.map(game => {
                                    return <div key={game.id}>
                                        <div className={userProfile.id == game.winner ? "plus" : "minus"}>{userProfile.id == game.winner ? "+" : "-"}</div>

                                        <div className="players">
                                            <div>
                                                <div className="color_square" style={{backgroundColor: game.user2 == userProfile.id ? game.user1_color : game.user2_color}}></div>
                                                <Link className="link" to={"/user/profile/" + (userProfile.username == game.white_username ? game.black_username : game.white_username)}>{userProfile.username == game.white_username ? game.black_username : game.white_username}</Link>
                                            </div>

                                            <div>
                                                <div className="color_square" style={{backgroundColor: game.user1 == userProfile.id ? game.user1_color : game.user2_color}}></div>
                                                <Link className="link" to={"/user/profile/" + userProfile.username}>{userProfile.username}</Link>
                                            </div>
                                        </div>
                                        <Link className="btn" to={`/game_review/${game.id}`}>See details</Link>
                                    </div>
                                })}
                            </div>
                            :
                            <p>Nothing to see here yet...</p>
                        }    
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