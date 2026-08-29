// +---------------------------------------------------------------------------------+
// |                                 EMAIL SENDER                                    |
// |                      Sends emails (user verification code .etc)                 |
// +---------------------------------------------------------------------------------+


// Basic imports
import nodemailer from "nodemailer"
import { configDotenv } from "dotenv"
configDotenv()

import * as auth_consts from "./auth_consts.js" // Basic consts for auth

// Email sender component
export default class EmailSender{
    // Creating transport (connecting with email to send messages)
    constructor(){
        this.transporter = nodemailer.createTransport({
            host: process.env.IMAP_HOST,
            secure: true,
            port: process.env.IMAP_PORT,
            auth: {
                user: process.env.IMAP_EMAIL,
                pass: process.env.IMAP_PASSWORD
            }
        })
    }

    // Sends verification mail
    async sendVerificationMail(username, mail){
        // Generating a code for user verification
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
        let code = ""
        for(let i = 0; i < 8; i++){
            code += letters.charAt(Math.floor(Math.random() * letters.length))
        }

        // HTML code for user verification
        let html_for_verification = auth_consts.verification_email(username, code)

        // Sending mail for given user
        try{
            const info = await this.transporter.sendMail({
                from: `Machesstic <${process.env.IMAP_EMAIL}>`,
                to: mail,
                subject: "Machesstic verification code",
                html: html_for_verification
            })
        }catch(e){
            return {send: false}
        }

        return {send: true, code: code}
    }
}