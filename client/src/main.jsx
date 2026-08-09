// ***********************************************************************************
//                                  MAIN COMPONENT
//      Includes router, user basic data sharing with other components and more
// ***********************************************************************************

import { createRoot } from 'react-dom/client'
import App from './App.jsx'

import {createBrowserRouter, RouterProvider, useNavigate} from "react-router-dom"

import { useEffect, useState, createContext } from 'react'

// Components imports
import Error from './components/404_component.jsx'
import Login from './components/user/login.jsx'
import CreateAccount from './components/user/create_account.jsx'
import UserPage from './components/user/user_page.jsx'
import Game from './components/user/game.jsx'
import Play from './components/user/play.jsx'
import Profile from './components/user/profile.jsx'
import About from './components/about.jsx'
import GameHistory from './components/user/game_history.jsx'
import Friends from './components/user/friends.jsx'

// IO import
import io from 'socket.io-client';

// Axios import
import axios from 'axios'

// Socket context
const socket = io.connect('http://localhost:3000')

export const socketContext = createContext()

// Router for paths in main
const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    errorElement: <Error/>
  },
  {
    path: "/user/login",
    element: <Login/>,
    errorElement: <Error/>
  },
  {
    path: "/user/",
    element: <UserPage/>,
    errorElement: <Error/>
  },
  {
    path: "/user/create_account",
    element: <CreateAccount/>,
    errorElement: <Error/>
  },
  {
    path: "/user/play",
    element: <Play/>,
    errorElement: <Error/>
  },
  {
    path: "/user/game_history",
    element: <GameHistory/>,
    errorElement: <Error/>
  },
  {
    path: "/user/profile",
    element: <Profile/>,
    errorElement: <Error/>
  },
  {
    path: "/about",
    element: <About/>,
    errorElement: <Error/>
  },
  {
    path: "/game/:id",
    element: <Game/>,
    errorElement: <Error/>
  },
  {
    path: "/user/friends",
    element: <Friends/>,
    errorElement: <Error/>
  }
])

export const userContext = createContext()

// Interceptor (if user is not authenticeted redirect him to login page)
axios.interceptors.response.use((res) => {return res},
  (error) => {
    if(error.status == 403){
      if(window.location.pathname == "/user/login") return Promise.reject(error)
      alert("You`ve been log out! Log in again")
      window.location.href = "/user/login"
    }
    
})

// Main layout 
function MainLayout(){
  const [username, setUsername] = useState(null)
  const [id, setId] = useState(null)
  const [elo, setElo] = useState(0)
  
  // If user data (username, elo or id) is not defined call fetch function
  useEffect(() => {
    if(!id || !username || !elo) fetch_user_data() 
  }, [])

  // Fetch user data from backend
  function fetch_user_data(){
    axios.get("http://localhost:3000/user/get_user_data", {withCredentials: true}).then(res => {
      setUsername(p => res.data.username)
      setId(p => res.data.user_id)
      setElo(p => res.data.elo)
    })
  }

  return (
    <socketContext.Provider value={socket}>
      <userContext.Provider value={{fetch_data: fetch_user_data, id: id, elo: elo, username: username}}>
        <RouterProvider router={router}/>
      </userContext.Provider>
    </socketContext.Provider>
  )
}

// Creating root
createRoot(document.getElementById('root')).render(
  <MainLayout/>
)
