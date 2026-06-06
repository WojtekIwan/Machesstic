import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Error from './components/404_component.jsx'
import {createBrowserRouter, RouterProvider} from "react-router-dom"
import Login from './components/user/login.jsx'
import CreateAccount from './components/user/create_account.jsx'
import UserPage from './components/user/user_page.jsx'
import Game from './components/user/game.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    errorElement: <Error/>
  },
  {
    path: "/user/login",
    element: <Login/>,
  },
  {
    path: "/user/",
    element: <UserPage/>,
  },
  {
    path: "/user/create_account",
    element: <CreateAccount/>,
    errorElement: <Error/>
  },
  {
    path: "/game/:id",
    element: <Game/>,
    errorElement: <Error/>
  }
])

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <RouterProvider router={router}/>
  // </StrictMode>,
)
