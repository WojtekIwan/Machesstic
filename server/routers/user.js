// +---------------------------------------------------------------------------------+
// |                                USER MODULE                                      |
// |    Its responsible for logging in and also basic communication with client      |
// +---------------------------------------------------------------------------------+

// Necessary imports
import express from "express"
import * as auth_consts from "../additional_components/auth_consts.js" // Basic consts for auth
import { configDotenv } from "dotenv"
configDotenv()

// Configuration of email sender
import EmailSender from "../additional_components/email_sender.js"
const es = new EmailSender()

// Database Connector setup for user router
import DatabaseConnector from "../database_connector.js"
const dc = new DatabaseConnector()

// Importing jwt connector
import * as jwt_connector from "../jwt.js"

// Setting up express router for user routes
const user_router = express.Router()

// Verification 1: Verifying user account creation
user_router.post("/verify_user", async (req, res) => {
    let username_in_database = await dc.username_in_database(req.body.username) // Correct username which is not taken
    let is_not_email = String(req.body.email).includes("@") ? false : "It`s not an email!" // Check if its an email
    let email_in_database = await dc.email_in_database(req.body.email) // Email is not taken
    let password_diffrent = req.body.password !== req.body.repeatePassword ? "Passwords need to be the same" : false // Same passwords

    // Checking if fields are not blank
    if(!req.body.username|| !req.body.email || !req.body.password || !req.body.repeatePassword){
        return res.status(400).json({validated: false, error_message: "You need to fill all of the fields"}) 
    }

    // If any error occured return error
    let data = [username_in_database, is_not_email, email_in_database, password_diffrent]
    for(let i = 0; i < data.length; i++){
        if(data[i]){
            return res.status(400).json({validated: false, error_message: data[i]})
        }
    }

    try {
        // User data is validated. Send him the email with validation code (checking if it`s acctually a human, not a bot)
        let response_from_email = await es.sendVerificationMail(req.body.username, req.body.email)
        if(!response_from_email.send){
            return res.status(400).json({validated:false, error_message: "Sorry but we can`t send verification email"})
        }  
        res.cookie("code", response_from_email.code, auth_consts.cookie_placeholder(auth_consts.fifteen_minuts)) // Setting code cookie for 15 minutes
        return res.status(200).json({validated: true})
    } catch (error) {
        return res.status(400).json({validated:false, error_message: "Sorry but we can`t send verification email"})
    }
})

// Verification 2: Verifying user code
user_router.post("/verify_code/:code", async (req, res) => {
    if(req.cookies.code == null) return res.status(400).json({verified: false, error_message: "Your code expire. Try again"})

    // If code is correct then user is added to database and redirected to user page
    if(req.params.code == req.cookies.code){
        let result = await dc.add_user_to_database(req.body.username, req.body.email, req.body.password)
        return res.status(result.code).json({verified: true, message: result.message})
    }
    return res.status(400).json({verified: true, error_message: "Wrong code. Try again"})
})

// Checking if user exist in database and if so, log user in
user_router.post("/login", async (req, res) => {
    try{
        if(!req.body.usernameOrEmail || !req.body.password) return res.status(400).send({message: "You need to fill all of the fields"}) 
        // If fields are not empty try to log user in
        let result = await dc.log_user_in(req.body.usernameOrEmail, req.body.password)
        return res.status(result.code).json(result.code == 200 ? {id: result.id} : {message: result.message})
    }catch(err){
        return res.sendStatus(500) // Server couldn`t process this operation
    }
})

// Create jwt tokens
user_router.post("/create_jwt", async (req, res) => {
    try{
        let tokens = await jwt_connector.create_tokens(req.body.user_id) // Create jwt tokens
        
        if(!tokens) return res.status(400) // Something went wrong with tokens, send error

        res.cookie("accessToken", tokens.accessToken, auth_consts.cookie_placeholder(auth_consts.fifteen_minuts)) // Access token cookie with 15 minutes expiretion
        res.cookie("refreshToken", tokens.refreshToken, auth_consts.cookie_placeholder(auth_consts.one_week)) // Refresh token cookie with one week expiretion
    
        return res.sendStatus(200)
    }catch(err){
        return res.sendStatus(500)
    }
})

// Getting basic user data after authentication (This is really important function, used a lot )
user_router.get("/get_user_data", jwt_connector.authenticate_token, (req, res) => {
    return res.status(200).json({"user_id": req.user_id, "username": req.username, "elo": req.elo})
})

// User logout - removing cookies with tokens
user_router.get("/logout",  (req, res) => {
    // Clearing up cookies for tokens
    res.clearCookie("accessToken", {path: "/", sameSite: "strict", secure: true, httpOnly: true})
    res.clearCookie("refreshToken", {path: "/", sameSite: "strict", secure: true, httpOnly: true})  
    return res.status(200).send("Cookies were sucesfully deleted")
})

export default user_router