<p align="center">
<img src="client/src/assets/logo.png" alt="drawing" width="300" style="display: block; margin: auto" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/MySQL-00758F?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <br>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white" alt="Sass" /> 
</p>


## ♟️ Briefly about the app

Machesstic is full-stack chess web application designed to make chess free-to-play and easily accessible to everyone.

## 🖥️ Functionalities
This application provides many functionalites such as:
* Creating account with email validation

* Safe login system with JWT

* Playing games with other players on similar elo

* Players profiles are public to anyone

* Editing profiles 

* Playing with friends (work in progress)


## 🔨 Technologies and project structue

### ⚙️ Prerequisites
Ensure you have the following installed on your machine:

* Git

* Docker Desktop (for Docker setup)

* Node.js (v18+) & MySQL (for local setup without Docker)

### 📖 Technologies and libraries:
In this part technologies used for server and client are presented and also there is a brief overview of folder structure in th project.

* #### Most esential for server part:
    * Express js
    * Mysql 2
    * jsonwebtoken
    * socket.io
* #### Client part
    * React (Vite)
    * Axios
    * React-router-dom
    * Scss

### 🏗️ Project structure overview

```
Machesstic/
│  
├── client/
│   ├── package.json            # Dependencies for  client
│   └── src/  
│       ├── assets/             # Images and gifs 
│       ├── components/         # Subcomponents for the app     
│       ├── styles/             # Styles  
│       └── main.jsx            # Main component with routing          
│  
├── server/
│   ├── package.json            # Dependencies for  server          
│   ├── chess_game.js           # All of game logic        
│   ├── database_connector.js   # Connection with database      
│   └── main_server.js          # Main server 
│  
├── Dockerfile                  # Dockerfile
├── .env                        # Enviormental variables
├── schema.sql                  # Database schema
└── docker-compose.yml          # Docker compose
```

## 🚀 Setup

In this section you will get specific steps you need to follow to deploy this app:
1. Create .env file in **root directory** with given variables:

    ```
    # Server port
    SERVER_PORT=3000

    # Database connection data

    DATABASE_HOST=db # or localhost if you use docker
    DATABASE_USER=chess_user
    DATABASE_PASSWORD=chess_password
    DATABASE_NAME=chess_db

    # Tokens for jwt
    ACCESS_TOKEN_SECRET=your_access_token_secret
    REFRESH_TOKEN_SECRET=your_refresh_token_secret

    # For sending email you need to configure smtp
    SMTP_HOST=smtp_host
    SMTP_PORT=smtp_port
    SMTP_EMAIL=your_email@gmail.com
    SMTP_PASSWORD=smtp_password

    # After disconnect player have given time in miliseconds to reconnect
    PLAYER_TIMEOUT=10000 
    ```
2. If you are using docker all you need to do is run:
    ```
    docker compose up --build 
    ```
3. If you are not using docker it gets more complicated. You need to follow this steps:
    * Create mysql database in and import **schema.sql**
    * For client you need to use:

        ```
        cd client # Change directory
        npm install # Install all dependencies
        npm run build # Run application
        ```   
        ```
        #If you are running client in development instead of last command type this
        npm run dev
        ```
    * **IMPORTANT** Copy client/dist to server/public
    * Run server with: 
        ```
        cd ../server # Change directory
        npm install # Install all dependencies
        node main_server.js # Run server
        ```
        ```
        #In case you are running server in development instead of last command type this
        npm run devServer
        ```
4. Voilà! In both cases you can access all services in given ports:
    ```
    # Application
    http://localhost:3000

    # For docker phpmyadmin (use login from .env)
    http://localhost:8080

    # Without docker its localhost port so probably
    http://localhost/phpmyadmin/index.php
    ```

## 🟣 License & Attribution

This app was created by **Wojciech Iwan**

All rights reserved, you can use this app in non-commercial and educational cases.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/wojciech-iwan-ba6647388/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/WojtekIwan)


