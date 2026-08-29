// +---------------------------------------------------------------------------------+
// |                            AUTH CONSTS MODULE                                   |
// |          Standarizing consts for auth files (cookies options, time etc)         |
// +---------------------------------------------------------------------------------+

// Cookies times
export let fifteen_minuts = new Date(Date.now() + 15 * 60 * 1000)
export let one_week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

// Cookie placeholder
export function cookie_placeholder(time){
    return {sameSite: "strict", path: "/", secure: true, httpOnly: true, expires: time}
}

// User verification template
export function verification_email(username, code){
    return `<!DOCTYPE html>
        <html>
            <head>
                <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
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
                    color: #FE66C4;
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
}