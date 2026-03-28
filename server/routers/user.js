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

    [username_in_database, email_in_database, password_diffrent].forEach((element) => {
        if(element){
            return res.send({code: 400, message: element})
        }
    })

    console.log("Everything is okay with data. Procesing to add it to database")

    return res.status(200)
})

export default user_router