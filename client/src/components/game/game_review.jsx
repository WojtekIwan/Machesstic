// +---------------------------------------------------------------------------------+
// |                            GAME REVIEW COMPONENT                                |
// |          After game review with data like moves, who won, by what etc.          |
// +---------------------------------------------------------------------------------+

// Imports
import axios from "axios"
import { useEffect, useState, useRef, useContext } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { userContext } from "../../main"

import user_default from "../../assets/user_default.png"

import Tile from "./tile"
import { FigurePlaceholder, MiniFigurePicture } from "./figure"

// Game review component
export default function GameReview(){
    // Getting after game data
    let params = useParams()
    const {user} = useContext(userContext) // Getting user context

    const [color, setColor] = useState("")
    
    // Storing loser and winner of the game
    const [bottom, setBottom] = useState({})
    const [upper, setUpper] = useState({})
    
    const [winner, setWinner] = useState("") // For setting up correct texts and colors
    const [game, setGame] = useState({})
    const [board, setBoard] = useState([])

    const navigate = useNavigate()

    useEffect(() => {
        // Game review is only possible to see by certain player
        axios.get(`http://localhost:3000/after_game_data/${params.id}`, {withCredentials: true}).then(res => {
            // Checking if game is checked by players who played or not
            let user_color
            setWinner(previous =>  res.data.winner)

            // By default winner is on bottom
            setBottom(previous => res.data.winner)
            setUpper(previous => res.data.loser)
            user_color = res.data.winner.color

            // In case if user is from game and lost reverse it so loser is on bottom
            let is_in_game = user.id == res.data.winner.id || user.id == res.data.loser.id
            if(is_in_game && user.id != res.data.winner.id){
                setBottom(previous => res.data.loser)
                setUpper(previous => res.data.winner)
                user_color = res.data.loser.color
            }

            setColor(previous => user_color)
            setMoves(previous => res.data.game.moves.split("|").map(element => {
                return {"old_move": element.slice(2, 4), "new_move": element.slice(4), "figure": element.slice(0, 2)}
            }))

            // Generating board from deafult game start
            let pom_board = []
            for(let i = 0; i < 8; i++){
                pom_board.push([])
                for(let j = 0; j < 8; j++){
                    let pom_color = i < 3 ? (user_color == "white" ? "black" : "white") : user_color
                    if(res.data.game.game_start[i * 8 + j] != "."){
                        pom_board[i].push({name: res.data.game.game_start[i * 8 + j], color: pom_color})
                    }else{
                        pom_board[i].push({name: "."})
                    }
                }
            }
            setBoard(previous => pom_board)
        }).catch(error => {
            navigate("/game/error")
        })
    }, [user])

    const tableRef = useRef(null) // Table ref

    // Board object generating
    let board_length = 8
    const [visualBoard, setVisualBoard] = useState(() => {
        let tab = []
        for(let i = 0; i < board_length; i++){
            tab.push([])
            for(let j = 0; j < board_length; j++){
                tab[i].push({x: i, y: j, possible_move: false})
            }
        }
        return tab
    })

    // Moving through game history
    let [index, setIndex] = useState(-1)
    let [moves, setMoves] = useState([])

    // Going to next moves in game history
    function go_forward(){
        if(index + 1 == moves.length) return

        let i = index + 1 < moves.length ?  index + 1 : index
        setIndex(previous => i)

        let old_move = [...moves[i].old_move]
        let new_move = [...moves[i].new_move]

        if(color == "black"){
            old_move[0] = 7 - old_move[0]
            new_move[0] = 7 - new_move[0]
        }

        // Replacing figures (and if it`s taking figure and storing it in object)
        let pom_board = board

        let p = pom_board[old_move[0]][old_move[1]]

        if(pom_board[new_move[0]][new_move[1]].name != "."){
            p["taken"] = pom_board[new_move[0]][new_move[1]]
        }

        pom_board[new_move[0]][new_move[1]] = p
        pom_board[old_move[0]][old_move[1]] = {name: "."}

        setBoard(previous => pom_board)
    }

    // Going to previous moves of game
    function go_back(){
        if(index < 0) return 

        let old_move = [...moves[index].old_move]
        let new_move = [...moves[index].new_move]

        if(color == "black"){
            old_move[0] = 7 - old_move[0]
            new_move[0] = 7 - new_move[0]
        }

        // Going back in moves (and restoring figure if was taken)
        let pom_board = board

        let p = pom_board[new_move[0]][new_move[1]]

        pom_board[new_move[0]][new_move[1]] = p.taken ? p["taken"] : {name: "."}  
        pom_board[old_move[0]][old_move[1]] = {"name": p.name, "color": p.color}

        setBoard(previous => [...pom_board])
        setIndex(previous => index - 1 >= -1 ?  index - 1 : index)
    }

    return <div id="main_container">
        <div>
            {/* Enemy profile picture (the bar on the top of board) */}
            <div id="enemy_profile">
                <div>
                    <img src={`http://localhost:3000/uploads/${upper.image}?t=${new Date().getTime()}`} alt="Enemy profile picture" onError={e => {e.target.src = user_default}} />
                    <div>
                        <p>{upper.username}</p>
                        <p>{upper.elo}</p>
                    </div>
                </div>
                <span><p style={{backgroundColor: upper.color, color: color}}>{winner.id == upper.id ? "Winner" : "Loser"}</p></span>
            </div>
                
            <div className="main_board">
                {/* Generating chess board */}
                <table id="game_board" ref={tableRef}>
                    <tbody>
                        {visualBoard?.map((row, index) => {
                            let notations = color=="black" ?  "ABCDEFGH" : "HGFEDCBA"
                            return <tr key={index}>{row.map((tile, index2) => {
                                let x2 = color == "black" ? 7 - tile.x : tile.x // Reversing x depending on color

                                let notation_x = tile.x == 7 ? notations.charAt(color == "black" ? tile.y : 7 - tile.y) : ""
                                let notation_y = tile.y == 7 ? 7 - x2 + 1 : 7 - tile.x + 1  

                                // Generating invidual tiles for given cords
                                return <td key={index2}><Tile key={x2 * board_length + tile.y} x={x2} y={tile.y} possible_move={tile.possible_move} notation_x={notation_x} notation_y={notation_y} /></td>
                            })
                        }</tr>})}
                    </tbody>
                </table>

                {/* Generating figures for board */}
                { board != null ? 
                    board?.map((row, x) => {
                        return <div key={x}>{row?.map((element, y) => {
                            if(element.name != "."){                             
                                // Generating figure component
                                return <FigurePlaceholder key={x+y} x={x} y={y} table={tableRef} type={board[x][y].name} color={board[x][y].color} />
                            }
                        })}
                        </div>
                }) : <div></div>}  
            
                {/* Sidebar info + moves control */}
                <div id="side_game_info">
                    <h2>{winner.id == user.id ? "You won" : "You lost"}</h2>
                    <p>{game.finish_reason}</p>
                    
                    <div id="game_history">
                        {moves.map((element, i) => {
                            if(element == "") return
                            let notations = "abcdefgh" // Side numeration
                            return <div className="mini_figure" key={i} style={{backgroundColor: i == index ? "gray" : ""}}>
                                <MiniFigurePicture color={element.figure[0]} type={element.figure[1]}/> {i + 1}. {(notations[element.new_move[1]]) + (Number(7 - element.new_move[0] + 1))}
                            </div>
                        })}
                    </div>
                    {/* Going through game history */}
                    <div id="back_and_forward_history">
                        <button onClick={go_back}>&#8592;</button>
                        <button onClick={go_forward}>&#8594;</button>
                    </div>
                    <Link className="btn" to={"/user"}>Go to main menu</Link>
                </div>
            </div>
            {/* Generating user profile (bottom bar with username, elo and profile picture) */}
            <div id="your_profile">
                <div>
                    {/* Dynamically getting user image from server */}
                    <img src={`http://localhost:3000/uploads/${bottom.image}?t=${new Date().getTime()}`} alt="User profile picture" onError={e => {e.target.src = user_default}} />
                    <div>
                        <p>{bottom.username}</p>
                        <p>{bottom.elo}</p>
                    </div>
                </div>
                <span>
                    <p style={{backgroundColor: color, color: upper.color}}>{winner.id == bottom.id ? "Winner" : "Loser"}</p>
                </span>
            </div>
        </div>
    </div>
}