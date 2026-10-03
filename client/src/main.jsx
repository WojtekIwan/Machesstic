// +---------------------------------------------------------------------------------+
// |                                MAIN COMPONENT                                   |
// |    Includes router, user basic data sharing with other components and more      |
// +---------------------------------------------------------------------------------+

// Basic imports
import { createRoot } from 'react-dom/client'
import {createBrowserRouter, Navigate, RouterProvider, useNavigate} from "react-router-dom"
import { useEffect, useState, createContext } from 'react'

import lostGif from "./assets/404.gif"
import rageGif from "./assets/no_game.gif"

// Components imports
import Error from './components/custom_error.jsx'
import Login from './components/user/login.jsx'
import CreateAccount from './components/user/create_account.jsx'
import UserPage from './components/user/user_page.jsx'
import Game from './components/game/game.jsx'
import Play from './components/user/play.jsx'
import Profile from './components/user/profile.jsx'
import About from './components/about.jsx'
import Friends from './components/user/friends.jsx'
import ProtectedRoute from './components/protectedRoute.jsx'
import GameReview from './components/game/game_review.jsx'

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
  // Not protected routes - so they are visible to everyone
  {path: "/", element: <Navigate to="/user" replace />}, // Navigating to user login automaticly
  
  {path: "/user/login", element: <Login/>}, // User login page
  // Protected routes - you need to be logged in
  {
    element: <ProtectedRoute/>,
    children: [
       { path: "/user", element: <UserPage/>}, // User main page,
       { path: "/user/create_account", element: <CreateAccount/>}, // Account creation page
       { path: "/user/play", element: <Play/>}, // User play page
       { path: "/user/profile", element: <Profile/>}, // User profile page
       { path: "/user/friends", element: <Friends/>}, // User friends page
       { path: "/about", element: <About/>}, // About page
       { path: "/game/:id", element: <Game/>}, // Single game page
       { path: "/game_review/:id", element: <GameReview/>} // Game review page
    ],
    errorElement: <Error error={"You are not logged in!"} additional={"To access this content you need to log in"} image={rageGif} image_alt={"chess rage gif"}/>
  },
  // Error routes
  {path: "*", element: <Error error="404 - page not found" image={lostGif} image_alt="lost gif" />}, // 404 error

  {path: "/game/error", element: <Error error={"Game is not finished or dosen`t exist"} image={rageGif} image_alt={"chess ragebait gif"}/>}, // Error (no game, game is not finished)

  {path: "/user/error", element: <Error error={"You are not logged in!"} additional={"To access this content you need to log in"} image={rageGif} image_alt={"chess rage gif"}/>}, // You are not logged in

  {path: "/user/logout", element: <Error error={"You`ve been logged out`!"} additional={"Log in again!"} image={rageGif} image_alt={"chess rage gif"}/>} // You are not logged in
])

// Interceptor (if user is not authenticeted redirect him to login page)
axios.interceptors.response.use((res) => {return res},
  (error) => {
    let path = window.location.pathname // Current path
    // 401 tokens are here but not authenticated
    if(error.status == 401){
      axios.post("http://localhost:3000/user/refresh_user_tokens", {withCredentials: true}).catch(err => {
        axios.get("http://localhost:3000/user/logout", {withCredentials: true})
        window.location.href = "/user/logout"
        return Promise.reject(error)
      })
    }

    // There are no tokens to authanticate or refresh
    if(error.status == 403){
      if(path != "/user/login" && path != "/user/error" && path != "/user/logout") window.location.href = "/user/error" 
    }
    return Promise.reject(error)
})

// Main layout 
function MainLayout(){
  // User data object
  const [user, setUser] = useState({
    username: null,
    id: null,
    elo: 0,
    creation_date: null, 
    profile_note: null, 
    profile_picture: null
  })

  const [loading, setLoading] = useState(true) // Use state for loading data from server
  
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
  async function fetch_user_data(){
    await axios.get("http://localhost:3000/user/get_user_full_data", {withCredentials: true}).then(res => {
      // Getting main data - most important 
      setUser(previous => ({
        username: res.data.username,
        id: res.data.id,
        elo: res.data.elo,
        date: res.data.date, 
        profile_note: res.data.profile_note, 
        profile_picture: res.data.profile_image_path
      }))

      if(!socket.connected) socket.connect() // Reconnect if needed
      socket.emit("join-server", res.data.id, res.data.username, res.data.elo) // After refreshing data, join server again
      
    })
    setLoading(false)   
  }

  // Rendering app
  return (
    <socketContext.Provider value={socket}>
      <userContext.Provider value={{fetch_data: fetch_user_data, user: user, loading: loading}}>
        <RouterProvider router={router}/>
      </userContext.Provider>
    </socketContext.Provider>
  )
}

// Creating root
createRoot(document.getElementById('root')).render(<MainLayout/>)
