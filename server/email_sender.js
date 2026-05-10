import nodemailer from "nodemailer"
import { configDotenv } from "dotenv"

configDotenv()

class EmailSender{
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

    async sendVerificationMail(username, mail){
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
        let code = ""
        for(let i = 0; i < 8; i++){
            code += letters.charAt(Math.floor(Math.random() * letters.length))
        }

        let html_for_verification = `
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                    background-color: #e6ede6;
                }
                .email-container {
                    max-width: 600px;
                    margin: auto;
                    background: #323232;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                    overflow: hidden;
                }
                .header {
                    background: #212121;
                    color: white;
                    text-align: center;
                    padding: 20px;
                    font-size: 24px;
                }
                .body {
                    padding: 20px;
                    color: #e6ede6;
                    line-height: 1.6;
                }
                .code{
                    color: #3cff00;
                }
                .footer {
                    text-align: center;
                    background: #212121;
                    padding: 10px;
                    font-size: 12px;
                    color: #e6ede6;
                }
                </style>
            </head>
            <body>
                <div class="email-container">
                <div class="header">
                    Welcome to Machesstic ${username}!
                </div>
                <div class="body">
                    <p>We are really greatful for you being here. We hope you will have a great time playing!</p>
                    <p>Your verification code: <b class='code'>${code}</b></p>
                    <p>Your code expire after 15 minutes</p>
                </div>
                <div class="footer">
                    © ${new Date().getFullYear()} Machesstic. All Rights Reserved.
                </div>
                </div>
            </body>
        </html>`

        console.log("Sending mail to: ", mail)
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

export default EmailSender