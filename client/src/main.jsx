import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Error from './components/404_component.jsx'
import {createBrowserRouter, RouterProvider} from "react-router-dom"
import Login from './components/user/login.jsx'
import CreateAccount from './components/user/create_account.jsx'

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
    path: "/user/create_account",
    element: <CreateAccount/>,
    errorElement: <Error/>
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
