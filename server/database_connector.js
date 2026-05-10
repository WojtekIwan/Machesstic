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

    // Is username in database
    async username_in_database(username){
        let correct_username = this.validate_username(username)
        if(!correct_username){
            return "Username cant contain special characters or spaces!"
        }
        
        // Checking if username is already in database
        let records = await this.pool.query("select * from user_basic where user_basic.username = ?;", [username])
        if(records[0].length != 0){
            let error = "This username is already taken!"
            console.log(`Database error: ${error}`)
            return error
        }
        return false
    }

    // Validating username
    validate_username(username){
        let restricted_signs = " =+ \"\\/?()[]{}|*:;'`~<>" // Forbiden characters
        for(let i = 0; i < username.length; i++){
            if(restricted_signs.includes(username[i])){
                return false
            }
        }
        return true
    }

    async email_in_database(email){
        let records = await this.pool.query("select * from user_basic where user_basic.email = ?;", [email])
        if(records[0].length != 0){
            let error = "This email is already in use!"
            console.log(`Database error: ${error}`)
            return {code: 400, message: error}
        }
        return false
    }

    async add_user_to_database(username, email, password){
        let hashed_password = ""
        let error = false

        bycrpt.hash(password, 10, async (err, hash) => {
            if(err){
                return {code: 400, message: "Problem with hashing a password."}

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
        if(error) return {code: 400, message: "Unexpected error appered!"}
        return {code: 200, message: "User has been added to database"}
    }

    // Checking if user creadtentials are correct
    async log_user_in(usernameOrEmail, password){
        let result = await this.pool.query(`Select * from user_basic where 
            ${usernameOrEmail.includes("@") ? 'email' : 'username'} = ?;`, [usernameOrEmail])
        
        if(result[0].length == 0){
            return {code: 400, message: "User not found in database"}
        }

        let check_password = await bycrpt.compare(password, result[0][0]["password"])
        if(check_password){
            return {code: 200, data: result[0]}
        }
        return {code: 400, message: "Wrong password"}
    }

    // **********************************************************************************
    //                               User section - JWT
    // **********************************************************************************

    async check_if_jwt_exist(id){
        let result = await this.pool.query(`Select * from jwt_for_user where jwt_for_user.user_id = ?;`, [id])
        return result[0].length == 1
    }

    async add_token_for_user(user_id, jwt_refresh){     
        let result = await this.pool.query(`insert into jwt_for_user values (?, ?, ?, ?)`,
             [crypto.randomUUID(), user_id, jwt_refresh, true])
        return {code: 200, message: "Refresh token added to database"}
    }

    // Updating token for user when token exist
    async update_token_for_user(user_id, jwt_refresh){     
        let result = await this.pool.query(`update jwt_for_user set jwt_for_user.refresh_token = ? where jwt_for_user.id = ?;`, [jwt_refresh, user_id])
        return {code: 200, message: "Refresh token updated in database"}
    }

    async check_refresh_token(jwt_refresh){
        let result = await this.pool.query(`Select * from jwt_for_user where jwt_for_user.refresh_token = ?;`, [jwt_refresh])
        if(result[0].length == 0){
            return {code: 400, message: "Refresh token not found"}
        }
        return {code: 200, "data": result[0][0]}
    }
}

export default DatabaseConnector