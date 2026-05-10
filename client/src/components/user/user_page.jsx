import { useEffect } from "react"
import axios from "axios"

function UserPage(){
    useEffect(() => {
        axios.get("http://localhost:3000/user/get_user_data", {withCredentials: true}).then(res => {
            console.log(res)
        })
    }, [])

    return (
        <div>
            <p>Welcome to our site!</p>
        </div>
    )
}

export default UserPage