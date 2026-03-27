import mysql from "mysql2"
import dotenv from "dotenv"

dotenv.config()

class DatabaseConnector{
    constructor(){
        this.pool = mysql.createPool({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        }).promise()

        console.log(`Connection with database ${process.env.DATABASE_NAME} established!`)
    }

    // **********************************************************************************
    //                                  User section
    // **********************************************************************************

    async username_in_database(username){
        let records = await this.pool.query("select * from user_basic where user_basic.username = ?;", [username])
        if(records[0].length != 0){
            let error = "This username is already taken!"
            console.log(`Database error: ${error}`)
            return error
        }
        return false
    }

    async email_in_database(email){
        let records = await this.pool.query("select * from user_basic where user_basic.email = ?;", [email])
        if(records[0].length != 0){
            let error = "This email is already in use!"
            console.log(`Database error: ${error}`)
            return error
        }
        return false
    }
}

export default DatabaseConnector