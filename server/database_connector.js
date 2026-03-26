import mysql from "mysql2"
import dotenv from "dotenv"

dotenv.config()

class DatabaseConnector{
    constructor(){
        this.pool = mysql.createPool({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_UESR,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        }).promise()

        console.log(`Connection with database ${process.env.DATABASE_NAME} established!`)
    }
}

export default DatabaseConnector