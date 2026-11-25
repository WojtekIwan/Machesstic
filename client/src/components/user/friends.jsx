// +---------------------------------------------------------------------------------+
// |                              FRIENDS COMPONENT                                  |
// |                        Shows friends ant let you challange                      |
// +---------------------------------------------------------------------------------+

// Imports
import axios from "axios";
import SideBar from "./sidebar";
import { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import addUserImage from "../../assets/add_user.png"
import user_default from "../../assets/user_default.png"
import { socketContext, userContext } from "../../main";

// Friends component
export default function Friends(){
    // Necessary variables
    const socket = useContext(socketContext)
    const {user} = useContext(userContext)

    let [players, setPlayers] = useState([])
    let [invites, setInvites] = useState([])
    let [friends, setFriends] = useState([])
    let [friendsChange, setFriendsChange] = useState(false)

    // Searchig for player with given name
    function search_for_friends(regex){
        if(!regex || regex.length < 3){
            setPlayers([])
            return false
        } 
        // Making a request for server to get players with regex
        axios.get(`http://localhost:3000/api/friends/serach_for_users/${regex}`, {withCredentials: true}).then(res => {
            setPlayers(previous => res.data.players)
        }).catch(error => {
            setPlayers(previous => [])
        })
    }

    // Sending invitation to given player
    function send_invitation(username){
        axios.post(`http://localhost:3000/api/friends/invite_friend`, {username: username}, {withCredentials: true}).then(res => {
            console.log("Invitation was send!")
        }).catch(error => {
            console.log(error.response.data)
        })
    }

    // Getting friends and invites on variable change
    useEffect(() => {
        axios.get(`http://localhost:3000/api/friends/get_friends`, {withCredentials: true}).then(res => {
            setFriends(previous => res.data.friends)
        })

        axios.get(`http://localhost:3000/api/friends/get_invites`, {withCredentials: true}).then(res => {
            setInvites(previous => res.data.invites)
        }).catch(error => {
            setPlayers(previous => [])
        })
    }, [friendsChange])

    // Challanging friend to a match
    function challenge_friend(username){
        socket.emit("challange-friend", user.id, username)
    }

    // Reciving invitation on send
    let [invitation, setInvitation] = useState("")
    useEffect(() => {
        function recive_invitation(username){
            setInvitation(previous => username)
        }
        socket.on("send-invitation", recive_invitation)

        return () => {
            socket.off("send-invitation", recive_invitation)
        }
    }, [socket])

    // Removing friend from friend list
    function remove_friend(username){
        axios.delete(`http://localhost:3000/api/friends/remove_friend/${username}`,{withCredentials: true}).then(res => {
            setFriendsChange(previous => !previous)
        })
    }

    // Accepting a friend request
    function accept_request(username){
        axios.post(`http://localhost:3000/api/friends/accept_request`, {username: username}, {withCredentials: true}).then(res => {
            setFriendsChange(previous => !previous)
        })
    }

    // Accepting a challange (getting redirected to game)
    function accept_challenge(username){
        socket.emit("accept-challange", user.id, username)
    }

    // Not accepting a challange 
    function denie_request(username){
        axios.post(`http://localhost:3000/api/friends/denie_request`, {username: username}, {withCredentials: true}).then(res => {
            setFriendsChange(previous => !previous)
        })
    }
    return (
        <div id="friends">
            <SideBar/>
            <div className="main_friends_component">
                <h2>Friend section</h2>
                <div>
                    <div className="friend_sections">
                        <div>
                            <h3>Add new friends</h3>
                            <input onKeyUp={(e) => search_for_friends(e.target.value)} placeholder="Search for friends to add"/>
                            {
                                players.length != 0 ?
                                players.map((user, index) => {
                                return <div key={index} className="player_search_result">
                                    <Link className="account_link" to={"/user/profile/" + user.username}>
                                        <img onError={e => {e.target.src = user_default}} src={`http://localhost:3000/uploads/${user.profile_image_path}?t=${new Date().getTime()}`} alt="" />
                                        <p>{user.username}</p>
                                    </Link>
                                    <button onClick={(e) => send_invitation(user.username)}>
                                        <img src={addUserImage} alt="Add friend icon" />
                                    </button>
                                </div>
                                })
                            :
                                <p></p>
                            }
                        </div>
                        <div>
                            <h3>Friend invites</h3>

                            {invites && invites.length == 0 
                            ? 
                            <p>No invites found</p>
                            :
                            invites.map((username, index) => {
                                return <div className="invite" key={index}>
                                    <p>{username} is inviting you to be friends!</p>
                                    <div>
                                        <button onClick={(e) => accept_request(username)}>✔</button>
                                        <button onClick={(e) => denie_request(username)}>✖</button>
                                    </div>
                                </div>
                            })}
                        </div>
                    </div>
                    
                    <div className="friend_sections">
                        <div>
                            <h3>Friend list</h3>
                            {/* Profile online challege friend remove friend */}
                            {
                                friends.length != 0 ?
                                friends.map((user, index) => {
                                return <div key={index} className="player_friend">
                                    <Link className="account_link" to={"/user/profile/" + user.username}>
                                        <img src={`http://localhost:3000/uploads/${user.profile_image_path}?t=${new Date().getTime()}`} onError={e => {e.target.src = user_default}} alt={user.username} />
                                        <p>{user.username}</p>
                                    </Link>

                                    <button onClick={(e) => challenge_friend(user.username)} id="challange_button">⚔️</button>
                                    <button onClick={e => remove_friend(user.username)}>Remove</button>
                                </div>
                                })
                            :
                                <p>You have no friends</p>
                            }
                        </div>
                    </div>
                    {invitation ? <div className="invitation">
                        <p>{invitation} challanged you! Do you accept?</p>
                        <div>
                            <button onClick={(e) => accept_challenge(invitation)}>✔</button>
                            <button onClick={(e) => setInvitation(previous => "")}>✖</button>
                        </div>
                    </div> : <div></div>}
                </div>
            </div>

        </div>
    )
}