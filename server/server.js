// *************************************************************************************************
//                                              Server
// *************************************************************************************************

// Neccessary imports
import express from "express"
import {createServer} from "http"
import { Server } from "socket.io"

// Basic setup of server
const app = express()
const server = createServer(app)
const io = new Server(server)

const PORT = 3000

// Starting server
server.listen(PORT, (e) => {
    if(!e){
        console.log(`Server is running on port ${PORT}`)
    }
})