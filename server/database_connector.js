import mysql from "mysql2"
import dotenv from "dotenv"
import bycrpt from "bcrypt"
import crypto from "crypto"

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

    async add_user_to_database(username, email, password){
        let hashed_password = ""
        let error = false

        bycrpt.hash(password, 10, async (err, hash) => {
            if(err){
                return {status: 400, message: "Problem with hashing a password."}

            }else{
                hashed_password = hash

                let data = new Date()
                let account_creation_data = data.getFullYear() + "-" + (data.getMonth() + 1) + "-" + data.getDate()

                try{
                    await this.pool.query("insert into user_basic values (?, ?, ?, ?, ?)", 
                        [crypto.randomUUID(), username, email, hashed_password, account_creation_data])
                }catch(e){
                    error = true
                }
            }
        })
        if(error) return {status: 400, message: "Unexpected error appered!"}
        return {status: 200, message: "User has been added to database"}
    }
}

export default DatabaseConnector