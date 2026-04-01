import express from "express"
// Database Connector setup for user router
import DatabaseConnector from "../database_connector.js"

const dc = new DatabaseConnector()

const user_router = express.Router()

user_router.post("/create_user", async (req, res) => {
    let username_in_database = await dc.username_in_database(req.body.username)
    let email_in_database = await dc.email_in_database(req.body.email)
    let password_diffrent = req.body.password !== req.body.repeatePassword ? "Passwords need to be the same" : false

    if(req.body.username == "" || req.body.email == "" || req.body.password == "" || req.body.repeatePassword == ""){
        return res.send({code: 400, message: "You need to fill all of the fields"}) 
    }

    let data = [username_in_database, email_in_database, password_diffrent]
    for(let i = 0; i < data.length; i++){
        if(data[i]){
            return res.send({code: 400, message: data[i]})
        }
    }

    let result = await dc.add_user_to_database(req.body.username, req.body.email, req.body.password)
    return res.send({code: result.status, message: result.message})
})

export default user_router