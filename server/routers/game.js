// ***********************************************************************************
//                                   GAME MODULE
//      Its responsible for connecting to game and playing chess matches
// ***********************************************************************************

// Necessary imports
import express from "express"
import jwt from "jsonwebtoken"
import { configDotenv } from "dotenv"

// Database Connector setup for user router
import DatabaseConnector from "../database_connector.js"
const dc = new DatabaseConnector()

const game_router = express.Router()
configDotenv()

let players = []

game_router.get("/find_game", (req, res) => {
    
})

export default game_router