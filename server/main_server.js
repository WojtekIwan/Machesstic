import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

// Express server setup
const app = express()
app.use(cors())
app.use(express.urlencoded({extended: true}))

// Database Connector setup
import DatabaseConnector from "./database_connector.js"

const dc = new DatabaseConnector()

app.get("/", (req, res) => {
    return res.status(200).send("This is main server site. Nothing to see here")
})

app.listen(process.env.SERVER_PORT, (e) => {
    if(!e){
        console.log(`Server is succesfully runing on port ${process.env.SERVER_PORT}`)
    }else{
        console.log(`Error: ${e}`)
    }
})