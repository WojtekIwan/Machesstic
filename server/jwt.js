// +---------------------------------------------------------------------------------+
// |                                 JWT MODULE                                      |
// |            Its responsible for creating tokens and also refreshing them         |
// +---------------------------------------------------------------------------------+

// Database Connector setup
import DatabaseConnector from "./database_connector.js"
const dc = new DatabaseConnector()

// Conecting with dotenv
import { configDotenv } from "dotenv"
configDotenv()

import jwt from "jsonwebtoken"
import * as auth_consts from "./additional_components/auth_consts.js" // Basic consts for auth

// Creating jwt tokens
export async function create_tokens(user_id){
    try{
        let jwt_exist = await dc.check_if_jwt_exist(user_id) // Check if token exist 
        let user_data = await dc.get_user_data_by_id(user_id) // Get user data by id
        
        // Creating access and refresh token
        let jwt_access = jwt.sign({"user_id": user_id, "username": user_data.username, "elo": user_data.elo}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"})
        let jwt_refresh = jwt.sign({"user_id": user_id, "username": user_data.username, "elo": user_data.elo}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "7d"})
            
        if(!jwt_exist){
            // If token do not exist create one
            await dc.add_token_for_user(user_id, jwt_refresh)
        }else{
            // jwt is in table - then just overwrite new jwt refresh token
            await dc.update_token_for_user(user_id, jwt_refresh)
        }
    
        return {"accessToken": jwt_access, "refreshToken": jwt_refresh} // Return tokens
    }catch(err){
        return false // Something went wrong, return false
    }
}

// Validating jwt token for http endpoints
export async function authenticate_token(req, res, next){
    // Getting token from cookies
    const user_access_token = req.cookies.accessToken 
    const user_refresh_token = req.cookies.refreshToken

    // If you don`t have both tokens, return 401 (you are not logged in)
    if(!user_access_token && !user_refresh_token) return res.status(401).json({message: "You don`t have tokens! You need to log in!"})

    // Verify access token
    jwt.verify(user_access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        if(err){
            // Checking if refresh token is in active in database. If expired, return 403
            try{
                let refresh_token_results = await check_refresh_token(user_refresh_token)
                if(!refresh_token_results) return res.status(403).json({message: "You dont have refresh token"})

                // Refresh token is defined so tokens are created and cookies are refreshed
                let new_tokens = await create_tokens(refresh_token_results.user_id)
                
                // Creating cookies with tokens
                res.cookie("accessToken", new_tokens.accessToken, auth_consts.cookie_placeholder(auth_consts.fifteen_minuts))
                res.cookie("refreshToken", new_tokens.refreshToken, auth_consts.cookie_placeholder(auth_consts.one_week))
    
                // Setting up data for request
                req.user_id = refresh_token_results.user_id
                req.username = refresh_token_results.username
                req.elo = refresh_token_results.elo
            }catch(err){
                return res.status(500).json({message: "Something went wrong with your request"})
            }

        }else{
            // Setting up data for request 
            req.user_id = user.user_id
            req.username = user.username
            req.elo = user.elo
        }

        // Proceding further, because user have valid authentication
        next()
    })
}

// Refreshing jwt tokens
export async function check_refresh_token(user_refresh_token){
    // Checking if refresh token is in database
    let result = await dc.check_refresh_token(user_refresh_token)
    let data = null
    if(result.code == 200){
        // If token is in database check if it is verified. If not delete it
        if(result.data.verified){
            jwt.verify(user_refresh_token, process.env.REFRESH_TOKEN_SECRET,  (err, user) => {
                if(!err){          
                    data = {"user_id": user.user_id, "username": user.username, "elo": user.elo} // Updating data
                }else{
                    return data
                }
            })
        }else{
            // Token is not verified, delete it and return null
            await dc.delete_refresh_token(user_refresh_token)
            return data
        }
    }
    // Returning data for user. Null if something went wrong
    return data
}

// Validating jwt for socket
export function authenticate_token_for_socket(accessToken){
    if(!accessToken) return false // Both tokens are not implemented. The user is a guest
    let user_verified = false
    // Veryfing access token
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        if(!err){
            user_verified = true // No error so accessToken is authenticated. Return true
        } 
    })
    return user_verified // If tokens didn`t passed any verification, return false
}