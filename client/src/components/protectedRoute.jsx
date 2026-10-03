// +---------------------------------------------------------------------------------+
// |                           PROTECTED ROUTE COMPONENT                             |
// |         If you are logged in you get custom errors plus if operation is         |           
// |                    taking to long "laoding data" is displayed                   |
// +---------------------------------------------------------------------------------+

// Imports
import { Navigate, Outlet } from "react-router-dom"
import { useContext } from "react"
import "../styles/main.scss"
import { userContext } from "../main"

// Protected route component
export default function ProtectedRoute(){
    const {user, loading} = useContext(userContext) // getting user context

    // If its laoding return load screen
    if(loading) return <div id="error-component">
        <div>
            <p>Loading data</p>
        </div>
    </div>

    return user?.id ? <Outlet/> : <Navigate to={"/user/login"} replace /> // If user is not logged in send him error
}