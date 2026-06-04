// ***********************************************************************************
//                                   USER MODULE
//      Its responsible for logging in and also basic communication with client
// ***********************************************************************************

// Necessary imports
import express from "express"
import jwt from "jsonwebtoken"
import { configDotenv } from "dotenv"

// Configuration of email sender
import EmailSender from "../email_sender.js"
const es = new EmailSender()

// Database Connector setup for user router
import DatabaseConnector from "../database_connector.js"
const dc = new DatabaseConnector()

import * as jwt_connector from "../jwt.js"

const user_router = express.Router()
configDotenv()

// Verifying user endpoint
user_router.post("/verify_user", async (req, res) => {
    let username_in_database = await dc.username_in_database(req.body.username)
    let email_in_database = await dc.email_in_database(req.body.email)
    let password_diffrent = req.body.password !== req.body.repeatePassword ? "Passwords need to be the same" : false

    if(req.body.username == "" || req.body.email == "" || req.body.password == "" || req.body.repeatePassword == ""){
        return res.status(400).json({validated: false, error_message: "You need to fill all of the fields"}) 
    }

    // If any error occured return error
    let data = [username_in_database, email_in_database, password_diffrent]
    for(let i = 0; i < data.length; i++){
        if(data[i]){
            return res.status(400).json({validated: false, error_message: data[i]})
        }
    }

    // User data is validated. Send him the email with validation code (checking if it`s acctually a human, not a bot)
    let response_from_email = await es.sendVerificationMail(req.body.username, req.body.email)
    if(!response_from_email.send){
        return res.status(400).json({validated:false, error_message: "Sorry but we can`t send verification email"})
    }

    res.cookie("code", response_from_email.code, {sameSite: "strict", secure: true, httpOnly: true, expires: new Date(Date.now() + 15 * 60 * 1000)})
    return res.status(200).json({validated: true})
})

user_router.post("/verify_code/:code", async (req, res) => {
    console.log(req.cookies)
    if(req.cookies.code == null){
        return res.status(400).json({verified: false, error_message: "Your code expire. Try again"})
    }

    // If code is correct then user is added to database and redirected to user page
    if(req.params.code == req.cookies.code){
        let result = await dc.add_user_to_database(req.body.username, req.body.email, req.body.password)
        return res.status(result.code).json({verified: true, message: result.message})
    }
    return res.status(400).json({verified: true, error_message: "Wrong code. Try again"})
})

user_router.post("/login", async (req, res) => {
    if(req.body.usernameOrEmail == "" || req.body.password == ""){
        return res.send({code: 400, message: "You need to fill all of the fields"}) 
    }
    let result = await dc.log_user_in(req.body.usernameOrEmail, req.body.password)
    return res.send(result)
})

user_router.post("/create_jwt", async (req, res) => {
    let tokens = await jwt_connector.create_tokens(req.body.user_id)

    let time_for_expire = new Date(Date.now() + 15 * 60 * 1000)

    res.cookie("accessToken", tokens.accessToken, {sameSite: "strict", path: "/", secure: true, httpOnly: true, expires: time_for_expire})
    res.cookie("refreshToken", tokens.refreshToken, {sameSite: "strict", path: "/", secure: true, httpOnly: true, expires: time_for_expire})
    return res.status(200).json({msg: "Token created!"})
})

user_router.get("/get_user_data", jwt_connector.authenticate_token, (req, res) => {
    // Verify if jwt is okay
    console.log(`User data: [user id: ${req.user_id} username: ${req.username}]`)
    // If so return data on the other hand return error
    return res.status(200).json({"user_id": req.user_id, "username": req.username})
})

export default user_router