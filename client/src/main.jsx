// +---------------------------------------------------------------------------------+
// |                                MAIN COMPONENT                                   |
// |    Includes router, user basic data sharing with other components and more      |
// +---------------------------------------------------------------------------------+

// Basic imports
import { createRoot } from 'react-dom/client'
import {createBrowserRouter, Navigate, RouterProvider, useNavigate} from "react-router-dom"
import { useEffect, useState, createContext } from 'react'

// Components imports
import Error from './components/404_component.jsx'
import Login from './components/user/login.jsx'
import CreateAccount from './components/user/create_account.jsx'
import UserPage from './components/user/user_page.jsx'
import Game from './components/game/game.jsx'
import Play from './components/user/play.jsx'
import Profile from './components/user/profile.jsx'
import About from './components/about.jsx'
import Friends from './components/user/friends.jsx'

// IO import
import io from 'socket.io-client';

// Axios import
import axios from 'axios'

// Socket 
const socket = io('http://localhost:3000', {withCredentials: true, autoConnect: false})

export const socketContext = createContext() // Socket context
export const userContext = createContext() // User context with basic user data

// Router for paths in main
const router = createBrowserRouter([
  // Navigating to user login automaticly
  {path: "/", element: <Navigate to="/user/login" replace />, errorElement: <Error/>},
  // User login page
  {path: "/user/login", element: <Login/>, errorElement: <Error/> },
  // User main page 
  {path: "/user/", element: <UserPage/>, errorElement: <Error/> },
  // Account creation page
  {path: "/user/create_account", element: <CreateAccount/>, errorElement: <Error/>},
  // User play page
  {path: "/user/play", element: <Play/>, errorElement: <Error/>},
  // User profile page
  {path: "/user/profile", element: <Profile/>, errorElement: <Error/>},
  // About page
  {path: "/about", element: <About/>, errorElement: <Error/>},
  // Single game page
  {path: "/game/:id", element: <Game/>, errorElement: <Error/>},
  // User friends page
  {path: "/user/friends", element: <Friends/>, errorElement: <Error/>}
])

// Interceptor (if user is not authenticeted redirect him to login page)
axios.interceptors.response.use((res) => {return res},
  (error) => {
    if(error.status == 403 || error.status == 401){ // Not verified or token expired

      if(window.location.pathname == "/user/login") return Promise.reject(error) // If its user pgae there is no point in redirect
      window.location.href = "/user/login"
      alert(error.status) // For debugging purposes - gives exact time when error occurd
      axios.get("http://localhost:3000/user/logout", {withCredentials: true}) // Logging user out (if old cookies existed)
    }
    return Promise.reject(error)
})

// Main layout 
function MainLayout(){
  // User data object
  const [user, setUser] = useState({
    username: null,
    id: 0,
    elo: 0,
    creation_date: null, 
    profile_note: null, 
    profile_picture: null
  })
  
  // If user data (username, elo or id) is not defined call fetch function
  useEffect(() => {    
    function error_conncetion_handler (err){
        socket.disconnect()
        if(err.message == "401") fetch_user_data()  
      }
    
    // If socket could connect (middleware error for cookies in most times) re-fetch data
    socket.on("connect_error", error_conncetion_handler);

    if(!user.id || !user.username || !user.elo) fetch_user_data() 
    
    // Clean up function
    return () => {
      socket.off("connect_error", error_conncetion_handler)
      socket.disconnect()
    };
  }, [])

  // Fetch user data from backend
  function fetch_user_data(){
    axios.get("http://localhost:3000/user/get_user_full_data", {withCredentials: true}).then(res => {
      // Getting main data - most important 
      setUser(previous => ({
        username: res.data.username,
        id: res.data.id,
        elo: res.data.elo,
        creation_date: res.data.creation_date, 
        profile_note: res.data.profile_note, 
        profile_picture: res.data.profile_image_path
      }))

      if(!socket.connected) socket.connect() // Reconnect if needed
      socket.emit("join-server", res.data.id, res.data.username, res.data.elo) // After refreshing data, join server again
    })
  }

  // Rendering app
  return (
    <socketContext.Provider value={socket}>
      <userContext.Provider value={{fetch_data: fetch_user_data, id: user.id, elo: user.elo, username: user.username, profile_picture: user.profile_picture, profile_note: user.profile_note, date: user.date}}>
        <RouterProvider router={router}/>
      </userContext.Provider>
    </socketContext.Provider>
  )
}

// Creating root
createRoot(document.getElementById('root')).render(
  <MainLayout/>
)
