// ***********************************************************************************
//                                 DATABASE MODULE
//      Its responsible for all operation that require connection with database
//      Its divided to 5 sections:
//      - user basic (logging in, creating account etc)
//      - user jwt (all conected to jwt)
//      - user main (user page)
//      - chess game (creating games, updating them and more)
// ***********************************************************************************

// Imports
import mysql from "mysql2"
import dotenv from "dotenv"
import bycrpt from "bcrypt"
import crypto from "crypto"

dotenv.config()

export default class DatabaseConnector{
    // Database connector init
    constructor(){
        this.pool = mysql.createPool({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        }).promise()
    }
    
    // Checking if database if active and if connection was established
    async ping_database(){
        try{
            let connection_test = await this.pool.query("Select 1")
            return true
        }catch(err){
            return false
        }
    }

    // **********************************************************************************
    //                                  User section
    // **********************************************************************************

    // Is username already taken
    async username_in_database(username){
        let correct_username = this.validate_username(username) // Validate username (it can`t contain spaces of special characters)
        if(!correct_username) return "Username can`t contain special characters or spaces!"

        // Check if username is not short or too long
        if(username.length < 3 || username.length > 10){
            return "This username if to short or too long. Try something between 3 and 10"
        }
        // Checking if username is already in database
        let records = await this.pool.query("select * from user_basic_info where user_basic_info.username = ?;", [username])

        if(records[0].length != 0) return "This username is already taken!" // Username is in database
        return false // Username is not in database
    }

    // Validating username (if contains forbiden characters)
    validate_username(username){
        let restricted_signs = " =+\"\\/?()[]{}|*:;'`~<>" // Forbiden characters
        for(let i = 0; i < username.length; i++){
            if(restricted_signs.includes(username[i])){
                return false
            }
        }
        return true
    }

    // Is email already taken
    async email_in_database(email){
        let records = await this.pool.query("select * from user_basic_info where user_basic_info.email = ?;", [email])
        if(records[0].length != 0) return "This email is already in use!" // Email is in database
        return false // Email is not in database
    }

    // Adding user to database
    async add_user_to_database(username, email, password){
        let hashed_password = ""
        let error = false

        // Encrypting password (safety reasons)
        bycrpt.hash(password, 10, async (err, hash) => {
            if(err) return {code: 400, message: "Problem with hashing a password."} // Problems with hashing

            hashed_password = hash

            // Getting and formating currrent data for account creation
            let data = new Date() 
            let account_creation_data = data.getFullYear() + "-" + (data.getMonth() + 1) + "-" + data.getDate()

            // Adding user data to database
            try{
                let rand_id_for_basic = crypto.randomUUID()
                let rand_id_for_additional = crypto.randomUUID()
                await this.pool.query("insert into user_basic_info values (?, ?, ?, ?, ?, ?)", 
                    [rand_id_for_basic, username, email, hashed_password, account_creation_data, 100])

                await this.pool.query("insert into user_additional_info values (?, ?, ?, ?)", 
                    [rand_id_for_additional, rand_id_for_basic, '', ''])
            }catch(e){
                error = true
            }     
        })
        if(error) return {code: 400, message: "Unexpected error appered!"} // Something unexpected happend
        return {code: 200, message: "User has been added to database"}
    }

    // Checking if user can be logged in
    async log_user_in(usernameOrEmail, password){
        // Selecting user with given data (if @ is in usernameOrEmail it must be email)
        let result = await this.pool.query(`Select * from user_basic_info where 
            ${usernameOrEmail.includes("@") ? 'email' : 'username'} = ?;`, [usernameOrEmail])
        
        // User not found
        if(result[0].length == 0) return {code: 400, message: "User not found"}
        
        // Comparing password with encrypted one
        let check_password = await bycrpt.compare(password, result[0][0]["password"])

        if(check_password) return {code: 200, id: result[0][0].id} // Everything is good, send
        return {code: 400, message: "Wrong password"}
    }

    // **********************************************************************************
    //                               User section - JWT
    // **********************************************************************************

    // Checking if jwt token exist (checking in jwt_for_users table)
    async check_if_jwt_exist(id){
        let result = await this.pool.query(`Select * from jwt_for_users where jwt_for_users.user_id = ?;`, [id])
        return result[0].length == 1
    }

    // Adding completly new token to token table
    async add_token_for_user(user_id, jwt_refresh){     
        let result = await this.pool.query(`insert into jwt_for_users values (?, ?, ?, ?)`,
             [crypto.randomUUID(), user_id, jwt_refresh, true])
        return {code: 200, message: "Refresh token added to database"}
    }

    // Updating token for user when token exist
    async update_token_for_user(user_id, jwt_refresh){     
        let result = await this.pool.query(`update jwt_for_users set jwt_for_users.refresh_token = ? where jwt_for_users.user_id = ?;`, [jwt_refresh, user_id])
        return {code: 200, message: "Refresh token updated in database"}
    }

    // Getting record from jwt_for_users table if refresh token is there
    async check_refresh_token(refreshToken){
        let result = await this.pool.query(`Select * from jwt_for_users where jwt_for_users.refresh_token = ?;`, [refreshToken])
        // if length is equal to 0 that means the token is not in database, else return data (user id)
        return result[0].length == 0 ? {code: 400, message: "Refresh token not found"} : {code: 200, "data": result[0][0]}
    }

    // Deleting token from database
    async delete_refresh_token(refreshToken){
        let result = await this.pool.query(`delete * from jwt_for_users where jwt_for_users.refresh_token = ?;`, [refreshToken])
        return result[0].length == 0 ? {code: 400, message: "Token not found"} :{code: 200, message: "Token was deleted from database"}
    }

    // **********************************************************************************
    //                            User section - User page
    // **********************************************************************************

    // Return row with given user id
    async get_user_data_by_id(user_id){
        let result = await this.pool.query(`Select * from user_basic_info where user_basic_info.id = ?;`, [user_id])
        return result[0][0]
    }

    // Return row with given user id from basic info and additional info
    async get_user_additional_data(user_id){
        let result1 = await this.pool.query(`Select * from user_basic_info where user_basic_info.id = ?;`, [user_id])
        let result2 = await this.pool.query(`Select * from user_additional_info where user_additional_info.user_id = ?;`, [user_id])
        
        return {"basic": result1[0][0], "additional": result2[0][0]}
    }

    // Updating profile username
    async update_username(user_id, username){
        let result = await this.pool.query("update user_basic_info set user_basic_info.username=? where user_basic_info.id=?", [username, user_id])
        return result
    }

    // Updating profile note
    async update_profile_note(user_id, note){
        let restricted_signs = "=+\"\\/?()[]{}|*:;'`~<>" // Forbiden characters
        for(let i = 0; i < note.length; i++){
            if(restricted_signs.includes(note[i])){
                return false
            }
        }

        await this.pool.query("update user_additional_info set user_additional_info.profile_note=? where user_additional_info.user_id=?", [note, user_id])
        return true
    }

    // Updating image path
    async update_profile_image(user_id, profile_image_path){
        let result = await this.pool.query("update user_additional_info set user_additional_info.profile_image_path=? where user_additional_info.user_id=?", [profile_image_path, user_id])
        return result
    }

    // **********************************************************************************
    //                                    Game 
    // **********************************************************************************
    async create_game(user_id1, user_id2){
        let game_id = crypto.randomUUID()

        // Dodać datę rozpoczęcia, timery 
        let result = await this.pool.query(`insert into chess_games values (?,?,?,"","",0, "")`, [game_id, user_id1, user_id2])
        return {code: 200, game_id: game_id}
    }

    async get_game(game_id){
        let result = await this.pool.query(`Select * from chess_games where chess_games.id = ?;`, [game_id])
        if(result[0].length != 1){
            return false
        }
        return result[0][0]
    }

    // Updating elo by user id
    async update_elo(user_id, elo_gain){
        await this.pool.query("update user_basic_info set user_basic_info.elo=user_basic_info.elo+? where user_basic_info.id=?", [elo_gain, user_id])
    }

    // Endgame - after game database operations
    async endgame(game_id, winner, moves, elo_gained, reason){
        let result = await this.pool.query("Update chess_games SET moves=?, winner=?, finished=?, finish_reason=? WHERE id=?", [moves, winner, true, reason, game_id])
        // update players elo
        if(reason != "stalemate"){
            let game = await this.get_game(game_id) // getting game
            // Determing winner and loser
            let w = game.user1 == winner ? game.user1 : game.user2
            let l = game.user1 != winner ? game.user1 : game.user2
            console.log(game, w, l)

            // Update their elo
            await this.update_elo(w, elo_gained)
            await this.update_elo(l, -elo_gained)
        }
        return result[0][0]
    }

    // Finishing game (it`s finished but making sure twice)
    async set_finished(game_id){
        let result = await this.pool.query("Update chess_games SET finished=? WHERE id=?", [true, game_id])
    }
}