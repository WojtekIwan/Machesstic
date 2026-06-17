// ***********************************************************************************
//                                   JWT MODULE
//      Its responsible for creating tokens and also refreshing them
// ***********************************************************************************

// Database Connector setup for user router
import DatabaseConnector from "./database_connector.js"
const dc = new DatabaseConnector()

// Conecting with dotenv
import { configDotenv } from "dotenv"
configDotenv()

import jwt from "jsonwebtoken"

// Creating tokens
export async function create_tokens(user_id){
    // Check if token exist 
    let jwt_exist = await dc.check_if_jwt_exist(user_id)
    let user_data = await dc.get_user_data_by_id(user_id)
    
    // Creating access and refresh token
    let jwt_access = jwt.sign({"id": user_id, "username": user_data.username}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"})
    let jwt_refresh = jwt.sign({"id": user_id, "username": user_data.username}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "7d"})
        
    if(!jwt_exist){
        // If token do not exist create one
        await dc.add_token_for_user(user_id, jwt_refresh)
    }else{
        // jwt is in table - then just generate new jwt refresh token
        await dc.update_token_for_user(user_id, jwt_refresh)
    }

    return {"accessToken": jwt_access, "refreshToken": jwt_refresh}
}

// Validating jwt token
export async function authenticate_token(req, res, next){
    const user_access_token = req.cookies.accessToken // Getting token from http only cookie
    console.log("Authenticating...")

    // ! pierwsze logowanie nie działa, ogarnij to !

    // If access token is not found then try to generate new one
    if(user_access_token == null){
        let result = await checkRefreshToken(req)
        if(!result){
            return res.status(400).json({message: "Unexpected error: you dont have authentication token"})
        }

        // Setting times for cookies
        let time_for_expire_access = new Date(Date.now() + 15 * 60 * 1000)
        let time_for_expire_refresh = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        // Acctually creating cookies
        res.cookie("accessToken", result.accessToken, {sameSite: "strict", secure: true, httpOnly: true, expires: time_for_expire_access})
        res.cookie("refreshToken", result.refreshToken, {sameSite: "strict", secure: true, httpOnly: true, expires: time_for_expire_refresh})
        
        req.user_id = result.user_id
        req.username = result.username
        next()
    }else{
        jwt.verify(user_access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
            if(err){
                // The access token is not active - automaticly refresh it
                let result = await checkRefreshToken(req)
                if(!result){
                    console.log("Token couldn`t be refreshed.")
                    return res.send({code: 403, message: "Unexpected error: you dont have active authentication token"})
                }

                // Setting times for cookies
                let time_for_expire_access = new Date(Date.now() + 15 * 60 * 1000)
                let time_for_expire_refresh = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

                // Acctually creating cookies
                res.cookie("accessToken", result.accessToken, {sameSite: "strict", secure: true, httpOnly: true, expires: time_for_expire_access})
                res.cookie("refreshToken", result.refreshToken, {sameSite: "strict", secure: true, httpOnly: true, expires: time_for_expire_refresh})
           
                req.user_id = result.user_id
                req.username = result.username

                next()
            }else{
                req.user_id = user.id
                req.username = user.username

                next()
            }
        })
    }
}

// Refreshing access token
export async function checkRefreshToken(req){
    const user_refresh_token = req.cookies.refreshToken
    let result = await dc.check_refresh_token(user_refresh_token)
    let data = {}
    if(result.code == 200){
        if(result.data.verified){
            await jwt.verify(user_refresh_token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
                if(err){
                    data = null
                }else{
                    let new_access_token = jwt.sign({"id": user.id, "username": user.username}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"})
                    // When new access token is generated the refresh token is also changed
                    let new_refresh_token = jwt.sign({"id": user.id, "username": user.username}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "7d"})
                    await dc.update_token_for_user(user.id, new_refresh_token) // Updating new token for users
        
                    data = {"accessToken": new_access_token, "refreshToken": new_refresh_token, "user_id": user.id, "username": user.username}
                }
            })
        }
    }

    return data
}