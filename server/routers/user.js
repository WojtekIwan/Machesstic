import express from "express"
// Database Connector setup for user router
import DatabaseConnector from "../database_connector.js"
import jwt from "jsonwebtoken"
import { configDotenv } from "dotenv"

const dc = new DatabaseConnector()

const user_router = express.Router()
configDotenv()

user_router.post("/create_user", async (req, res) => {
    let username_in_database = await dc.username_in_database(req.body.username)
    let email_in_database = await dc.email_in_database(req.body.email)
    let password_diffrent = req.body.password !== req.body.repeatePassword ? "Passwords need to be the same" : false

    if(req.body.username == "" || req.body.email == "" || req.body.password == "" || req.body.repeatePassword == ""){
        return res.send({code: 400, message: "You need to fill all of the fields"}) 
    }

    let data = [username_in_database, email_in_database, password_diffrent]
    for(let i = 0; i < data.length; i++){
        if(data[i]){
            return res.send({code: 400, message: data[i]})
        }
    }

    let result = await dc.add_user_to_database(req.body.username, req.body.email, req.body.password)
    return res.send({code: result.code, message: result.message})
})

user_router.post("/login", async (req, res) => {
    if(req.body.usernameOrEmail == "" || req.body.password == ""){
        return res.send({code: 400, message: "You need to fill all of the fields"}) 
    }
    let result = await dc.log_user_in(req.body.usernameOrEmail, req.body.password)
    return res.send(result)
})

user_router.post("/create_jwt", async (req, res) => {
    // Check if token exist 
    let user_id = req.body.user_id
    let jwt_exist = await dc.check_if_jwt_exist(user_id)

    let jwt_refresh = jwt.sign({"id": user_id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: 1000 * 60 * 24 * 7}) // To chyba oznacza tydzień
    let jwt_access = jwt.sign({"id": user_id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: 1000 * 60 * 15}) // 15 minut i think?
    
    if(!jwt_exist){
        await dc.add_token_for_user(user_id, jwt_refresh)
    }else{
        // jwt is in table - then just generate new jwt refresh token
        await dc.update_token_for_user(user_id, jwt_refresh)
    }
    let time_for_expire = new Date(Date.now() + 15 * 60 * 1000)
    res.cookie("accessToken", jwt_access, {sameSite: "strict", secure: true, httpOnly: true, expires: time_for_expire})
    res.cookie("refreshToken", jwt_refresh, {sameSite: "strict", secure: true, httpOnly: true, expires: time_for_expire})
    return res.status(200).json({"msg": "Token created!"})
})

user_router.get("/get_user_data", authenticate_token, (req, res) => {
    // Verify if jwt is okay
    console.log("Something")
    console.log(`User id: ${req.user_id}`)
    // If so return data on the other hand return error
    return res.status(200).json({"user_id": req.user_id})
})


// Validating jwt token
function authenticate_token(req, res, next){
    const user_access_token = req.cookies.accessToken
    if(user_access_token == null){
        // There is no access token
        return res.status(400).json({message: "Unexpected error: you dont have authentication token"})
    }

    jwt.verify(user_access_token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err){
            // The access token is not active - automaticly refresh it
            console.log("Token has been expired. trying to refresh...")
            let result = checkRefreshToken(req)
            if(!result){
                console.log("Token couldn`t be refreshed.")
                return res.send({code: 403, message: "Unexpected error: you dont have active authentication token"})
            }
            res.cookie("accessToken", result.accessToken, {sameSite: "strict", secure: true, httpOnly: true, expires: time_for_expire})
            res.cookie("refreshToken", result.accessToken, {sameSite: "strict", secure: true, httpOnly: true, expires: time_for_expire})
            console.log("Token was succesfully refreshed!")
        }

        req.user_id = user.id
        next()
    })
}

// Refreshing access token
async function checkRefreshToken(req){
    const user_refresh_token = req.cookies.refreshToken
    let result = await dc.check_refresh_token(user_refresh_token)

    if(result.code == 200){
        if(result.data.verified){
            jwt.verify(user_refresh_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if(err){
                    return false
                }
            })

            let new_access_token = jwt.sign({"id": user.id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: 1000 * 60 * 15})
            // When new access token is generated the refresh token is also changed
            let new_refresh_token = jwt.sign({"id": user.id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: 1000 * 60 * 24 * 7})
            await dc.update_token_for_user(user.id, jwt_refresh) 

            return {"accessToken": new_access_token, "refreshToken": new_refresh_token}
        }
    }
}

export default user_router