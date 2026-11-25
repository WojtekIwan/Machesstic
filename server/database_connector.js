// +---------------------------------------------------------------------------------+
// |                               DATABASE MODULE                                   |
// |    Its responsible for all operation that require connection with database      |
// +---------------------------------------------------------------------------------+

// Imports
import mysql from "mysql2"
import dotenv from "dotenv"
import bycrpt from "bcrypt"
import crypto from "crypto"

dotenv.config()

// Database class creation
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

    // +---------------------------------------------------------------------------------+
    // |                                User section                                     |
    // +---------------------------------------------------------------------------------+

    // Is username already taken
    async username_in_database(username){
        let correct_username = this.validate_username(username) // Validate username (it can`t contain spaces of special characters)
        if(!correct_username) return "Username can`t contain special characters or spaces!"

        // Check if username is not short or too long
        if(username.length < 3 || username.length > 10) return "This username if to short or too long. Try something between 3 and 10"

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

                await this.pool.query("insert into user_additional_info values (?, ?, ?, ?, ?)", 
                    [rand_id_for_additional, rand_id_for_basic, '', '', 100])
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

    // +---------------------------------------------------------------------------------+
    // |                                    JWT                                          |
    // +---------------------------------------------------------------------------------+

    // Checking if jwt token exist (checking in jwt_for_users table)
    async check_if_jwt_exist(id){
        let result = await this.pool.query(`Select * from jwt_for_users where jwt_for_users.user_id = ?;`, [id])
        return result[0].length == 1
    }

    // Adding completly new token to token table
    async add_token_for_user(user_id, jwt_refresh){     
        await this.pool.query(`insert into jwt_for_users values (?, ?, ?, ?)`, [crypto.randomUUID(), user_id, jwt_refresh, true])
        return {code: 200, message: "Refresh token added to database"}
    }

    // Updating token for user when token exist
    async update_token_for_user(user_id, jwt_refresh){     
        await this.pool.query(`update jwt_for_users set jwt_for_users.refresh_token = ? where jwt_for_users.user_id = ?;`, [jwt_refresh, user_id])
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

    // +---------------------------------------------------------------------------------+
    // |                                     USER                                        |
    // +---------------------------------------------------------------------------------+

    // Return row with given user id
    async get_user_data_by_id(user_id){
        let result = await this.pool.query(`Select * from user_basic_info where user_basic_info.id = ?;`, [user_id])
        return result[0][0]
    }

    // Get id of user by username
    async get_id_by_username(username){
        let result = await this.pool.query(`Select id from user_basic_info where user_basic_info.username = ?;`, [username])
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
                return false // If note contains forbiden characters then return false
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

    // +---------------------------------------------------------------------------------+
    // |                                     GAME                                        |
    // +---------------------------------------------------------------------------------+

    // Getting games stats for user from last 20 games
    async get_game_stats(username){
        let pom = await this.get_id_by_username(username)
        let id = pom.id

        let games = await this.pool.query("SELECT chess_games.*, white.username AS white_username, black.username AS black_username FROM chess_games LEFT JOIN user_basic_info white ON chess_games.user1 = white.id LEFT JOIN user_basic_info black ON chess_games.user2 = black.id WHERE chess_games.user1 = ? OR chess_games.user2 = ? order by chess_games.start_time desc limit 20;", [id, id])

        // Counting games for game stats at profile
        let game_data = {
            "games_won": 0,
            "games_lost": 0,
            "games_draw": 0,
            "all_games":  games[0].length,
        }

        for(let i = 0; i < games[0].length; i++){
            // If game dosent have winner its draw
            if(!games[0][i].winner){
                game_data["games_draw"] += 1
                continue
            }

            // In other case increase win or lose
            game_data[games[0][i].winner == id ? "games_won" : "games_lost"] += 1
        }

        return {"basic_data": game_data,"games": games[0]}
    }

    // Creating game
    async create_game(user_id1, user_id2){
        let game_id = crypto.randomUUID()
        let date = new Date()
        let start_time = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate()
        let result = await this.pool.query(`insert into chess_games values (?,?, "",?, "","","",0, "", ?)`, [game_id, user_id1, user_id2, start_time])
        return {code: 200, game_id: game_id}
    }

    // Updating colors after both players connected
    async update_game_colors(game_id, black, white){
        let game = await this.get_game(game_id)

        // Setting up colors for users
        let user1_color = game.user1 == black ? "black" : "white"
        let user2_color = game.user2 == white ? "white" : "black"

        await this.pool.query(`update chess_games set chess_games.user1_color=?, chess_games.user2_color=? where chess_games.id=?`, [ user1_color, user2_color, game_id])
    }

    // Get game by given id
    async get_game(game_id){
        let result = await this.pool.query(`Select * from chess_games where chess_games.id = ?;`, [game_id])
        return result[0].length != 1 ? false : result[0][0]
    }

    // Updating elo by user id
    async update_elo(user_id, elo_gain){
        let data = await this.get_user_additional_data(user_id)
        await this.pool.query("update user_basic_info set user_basic_info.elo=user_basic_info.elo+? where user_basic_info.id=?", [elo_gain, user_id])
        // Elo is higher after this game. Update maximal elo
        if(data.additional.maximal_elo < elo_gain + data.basic.elo){
            await this.pool.query("update user_additional_info set user_additional_info.maximal_elo=?", [elo_gain + data.basic.elo])
        }
    }

    // After game update reason elo .etc
    async endgame(game_id, winner, moves, elo_gained, reason){
        let result = await this.pool.query("Update chess_games SET moves=?, winner=?, finished=?, finish_reason=? WHERE id=?", [moves, winner, true, reason, game_id])
        // Update players elo
        if(winner){
            let game = await this.get_game(game_id) // getting game
            // Determing winner and loser
            let w = game.user1 == winner ? game.user1 : game.user2
            let l = game.user1 != winner ? game.user1 : game.user2

            // Update their elo
            await this.update_elo(w, elo_gained[w])
            await this.update_elo(l, elo_gained[l])
        }
        return result[0][0]
    }

    // Finishing game if it wasnt finished by traditional endgame
    async set_finished(game_id){
        await this.pool.query("Update chess_games SET finished=? WHERE id=?", [true, game_id])
    }

    // +---------------------------------------------------------------------------------+
    // |                                 After game                                      |
    // +---------------------------------------------------------------------------------+
    
    // Get after game data for given game (game_id)
    async get_after_game_data(game_id){
        let game = await this.get_game(game_id)
        if(!game) return false

        let winner, loser = null
        if(game.winner){
            winner = await this.get_user_additional_data(game.winner)
            loser = await this.get_user_additional_data(game.user1 == game.winner ? game.user2 : game.user1)
        }else{
            winner = await this.get_user_additional_data(game.user1)
            loser = await this.get_user_additional_data(game.user2)
        }
        // Return game object with winner, loser and game
        return {
            game: {
                ...game,
                game_start: "RHBQKBHRPPPPPPPP................................PPPPPPPPRHBQKBHR"
            }, 
            winner: winner, 
            loser: loser
        }
    }

    // +---------------------------------------------------------------------------------+
    // |                             FRIEND SECTION                                      |
    // +---------------------------------------------------------------------------------+

    // Find maximum of 20 players that match the regex
    async find_players(regex, username){
        let result = await this.pool.query("select user_basic_info.username, user_basic_info.elo, user_additional_info.profile_image_path from user_basic_info join user_additional_info on user_basic_info.id = user_additional_info.user_id where user_basic_info.username like ? and username != ? limit 20;", [regex + "%", username])
        return result[0]
    }

    // Add friend to database
    async add_friends(id, username){
        let friend_id = await this.get_id_by_username(username)
        let result = await this.get_friends(id)
        
        // If friend is not allready added then add him
        for(let i = 0; i < result.length; i++){
            if(result[i].username == username){
                return false
            }
        }
        await this.pool.query("INSERT INTO friends VALUES (?, ?, ?);", [crypto.randomUUID(), id, friend_id.id])
        return true
    }

    // Remove friend for database
    async remove_friend(id, friend_username){
        let friend_id = await this.get_id_by_username(friend_username)
        try{
            await this.pool.query("DELETE FROM `friends` WHERE (user1 = ? and user2 = ?) or (user1 = ? and user2 = ?);", [id, friend_id.id, friend_id.id, id])
            return true
        }catch(error){
            return false
        }   
    }

    // Find all friends for given user id
    async get_friends(id){
        let result = await this.pool.query("select user1, user2 from friends where user1 = ? or user2 = ?;", [id, id])
        let friends = [] // Array of friends
        for(let i = 0; i < result[0].length; i++){
            let friend = await this.pool.query("select user_basic_info.username, user_basic_info.elo, user_additional_info.profile_image_path from user_basic_info join user_additional_info on user_basic_info.id = user_additional_info.user_id where user_basic_info.id = ?", [result[0][i].user1 == id ? result[0][i].user2 : result[0][i].user1])
            friends.push(friend[0][0])
        }
        return friends
    }
}