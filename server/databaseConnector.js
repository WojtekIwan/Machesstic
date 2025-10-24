// *************************************************************************************************
//                                      Database connector
//               It lets you connect with database and perform basic quieries on it.
// *************************************************************************************************

// Neccessary imports
import mysql from "mysql2"
import dotenv from "dotenv"

class DatabaseConnector{
    // Basic setup of connector
    constructor(){
        dotenv.config()

        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE
        }).promise()
    }
}

export default DatabaseConnector