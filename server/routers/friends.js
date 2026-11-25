// +---------------------------------------------------------------------------------+
// |                              FRIEND MODULE                                      |
// |    Its responsible for logging in and also basic communication with client      |
// +---------------------------------------------------------------------------------+

// Necessary imports
import express from "express"
import { configDotenv } from "dotenv"
configDotenv()

// Database Connector setup for user router
import DatabaseConnector from "../database_connector.js"
const dc = new DatabaseConnector()

// Importing jwt connector
import * as jwt_connector from "../jwt.js"

import Logger from "../logger.js" // Logger for prettier console.log
const logger = new Logger()

// Setting up express router for user routes
const friends_router = express.Router()

const pending_friend_invites = new Map()

// Searching for players with names that starts with given regex
friends_router.get("/serach_for_users/:regex", jwt_connector.authenticate_token, async (req, res) => {
    let players = await dc.find_players(req.params.regex, req.username)
    // If players where found return them otherwise send 400
    return players.length == 0 ? res.status(400).json({message: "No players found"}) : res.status(200).json({players: players})
})

// Searching for players with names that starts with given regex
friends_router.post("/invite_friend", jwt_connector.authenticate_token, async (req, res) => {
    logger.okay(`${req.username} invited ${req.body.username} to be friends!`)
    let friend = await dc.get_id_by_username(req.body.username)

    // Adding friends to pending invites
    if(pending_friend_invites.has(friend.id)){
        // So player has more friends
        let friends = pending_friend_invites.get(friend.id)
        for(let i = 0; i < friends.length; i++){
            if(friends[i] == req.username){
                // The user already have the invitation
                logger.warning(`Invitation was already sent to ${req.body.username}`)
                return res.status(400).json({message: `Invitation was already sent to ${req.body.username}`})
            }
        }

        pending_friend_invites.set(friend.id, [...pending_friend_invites.get(friend.id), req.username])
    }else{
        pending_friend_invites.set(friend.id, [req.username]) 
    }
    return res.status(200).json({message: "Invitation was send"})
})

// Searching for players with names that starts with given regex
friends_router.get("/get_invites", jwt_connector.authenticate_token, async (req, res) => {
    return res.status(200).json(pending_friend_invites.has(req.user_id) ? {invites: pending_friend_invites.get(req.user_id)} : {invites: []})
})

// Denie given request
friends_router.post("/denie_request", jwt_connector.authenticate_token, async (req, res) => {
    pending_friend_invites.set(req.user_id, pending_friend_invites.get(req.user_id).filter(element => element != req.body.username))
    return res.status(200).json({message: "Invitation was declined"})
})

// Accept given request
friends_router.post("/accept_request", jwt_connector.authenticate_token, async (req, res) => {
    // Adding friends to database
    let added = await dc.add_friends(req.user_id, req.body.username)
    pending_friend_invites.set(req.user_id, pending_friend_invites.get(req.user_id).filter(element => element != req.body.username))

    return added ? res.status(200).json({message: "Invitation was accepted"}) : res.status(200).json({message: "You are already friends!"})
})

// return friends of given player
friends_router.get("/get_friends", jwt_connector.authenticate_token, async (req, res) => {
    let friends = await dc.get_friends(req.user_id)
    return res.status(200).json({friends: friends})
})

// Remove friend from friend list
friends_router.delete("/remove_friend/:friend_username", jwt_connector.authenticate_token, async (req, res) => {
    let result = await dc.remove_friend(req.user_id, req.params.friend_username)
    return result ? res.status(200).json({message: "Friend removed!"}) : res.status(200).json({message: "Friend couldn`t be removed!"})
})


export {friends_router, pending_friend_invites}