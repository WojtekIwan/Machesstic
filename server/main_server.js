import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.urlencoded({extended: true}))

app.get("/", (req, res) => {
    return res.status(200).send("This is main server site. Nothing to see here")
})

app.listen(PORT, (e) => {
    if(!e){
        console.log(`Server is succesfully runing on port ${process.env.PORT}`)
    }else{
        console.log(`Error: ${e}`)
    }
})