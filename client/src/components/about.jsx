// ***********************************************************************************
//                                     ABOUT COMPONENT
//                It shows a little bit about application and author
//          This is not important component but I thought adding it would
//                       make website a little bit realistic
// ***********************************************************************************

// Imports
import SideBar from "./user/sidebar";

// About component
export default function About(){
    return (
        <div className="user_page">
            <SideBar/>
            <h2>About Machesstic</h2>
        </div>
    )
}