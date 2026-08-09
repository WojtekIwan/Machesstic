// ***********************************************************************************
//                                FRIENDS COMPONENT
//              Shows online friends, let you challange them or add them
// ***********************************************************************************

// Imports
import SideBar from "./sidebar";

// Friends component
export default function Friends(){
    return (
        <div className="user_page">
            <SideBar/>
            {/* Place holders */}
            <button>Add friend</button>
            <button>Challenge friend</button>
        </div>
    )
}