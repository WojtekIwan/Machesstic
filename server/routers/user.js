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

// Imports for image upload
import multer from "multer"
import fs from "fs"
import path from "path"

import Logger from "../logger.js" // Logger for prettier console.log
const logger = new Logger()

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

// Get user additional data
user_router.get("/additional_data", jwt_connector.authenticate_token, async (req, res) => {
    let result = await dc.get_user_additional_data(req.user_id)

    return res.status(200).json({"date": result["basic"]["creation_date"], "profile_image_path": result["additional"]["profile_image_path"], "profile_note": result["additional"]["profile_note"]})
})


// +---------------------------------------------------------------------------------+
// |                         SET USER PROFILE PICTURE                                |
// |                Multer is used for uploading images to server and                |
// |                        saving them (uploads folder)                             |
// +---------------------------------------------------------------------------------+

// Multer storage for profile picuters
const storage = multer.diskStorage({
    // Where to save file - uploads folder
    destination: (req, file, callBack) => {
        callBack(null, 'uploads') // Uploads folder
    },
    // How to name file - user id with orginal extension, replace if needed
    filename: (req, file, callBack) => {
        let path = `${req.user_id}_profile_picture.${file.originalname.split(".")[1]}`
        req.profileImagePath = path
        callBack(null, path)
    }
  }
)

// Multer init
let upload = multer({storage: storage,  
    // Checking if file is in correct format (jpeg, png)
    fileFilter: (req, file, cb) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            return cb(new Error('Images only allowed'), false);
        }
        
        cb(null, true)
    },
    // Maximum size of 1 MB
    limits: { fileSize: 1 * 1024 * 1024 } 
 })

 const image_uploaded = upload.single('profileImage') // Function that uploads images (profile pictures in this case)

 // Upadting user profile (profile picture, note and username)
user_router.post('/update_profile', jwt_connector.authenticate_token, (req, res) => {
    image_uploaded(req, res, async function (err) {
        if (err) {     
            return res.status(400).json({message: err.message}) // Error happend while uploading an image
        }

        let data = await dc.get_user_additional_data(req.user_id)

        // Deleting other profile picture if exist (if extension is diffrent it will be deleted, otherwise replaced)
        if(data.additional.profile_image_path != req.profileImagePath){
            fs.unlink(path.join(process.cwd(), "uploads", data.additional.profile_image_path), (err) => {
                if(err)  logger.warning("No file found")
                logger.okay("File deleted succesfully")    
            })
        }
        
        // Update image path for user profile picture
        if(req.profileImagePath) await dc.update_profile_image(req.user_id, req.profileImagePath) 
        
        // Profile note is not empty, user updated it
        if(req.body.profileNote && req.body.profileNote != ""){
            let result = await dc.update_profile_note(req.user_id, req.body.profileNote)
            if(!result) return res.status(400).json({message: "You can`t use special characters in your note!"})
        }

        // Username is not empty, user wants to change it
        if(req.body.profileUsername && req.body.profileUsername != ""){
            let result = await dc.username_in_database(req.body.profileUsername) // Validate username
            if(!result){
                await dc.update_username(req.user_id, req.body.profileUsername)
            }else{
                return res.status(400).json({message: result})
            }
        }
        
        return res.status(200).json({message: "Profile updated correctly"})
    })
})

// Refreshing user token
user_router.post("/refresh_user_tokens", jwt_connector.authenticate_token, async (req, res) => {
    let tokens = await jwt_connector.create_tokens(req.user_id)
    // Creating cookies with tokens
    res.cookie("accessToken", tokens.accessToken, auth_consts.cookie_placeholder(auth_consts.fifteen_minuts))
    res.cookie("refreshToken", tokens.refreshToken, auth_consts.cookie_placeholder(auth_consts.one_week))

    return res.status(200).json({message: "Refresh of tokens was succesfull"})
})

export default user_router