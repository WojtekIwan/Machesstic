export class ChessGame{
    constructor(){
        this.board = []
        this.board_length = 8
        this.turn = "white"
        let pom = "RHBQKBHRPPPPPPPP................................PPPPPPPPRHBQKBHR"

        for(let i = 0; i < this.board_length; i++){
            this.board.push([])
            for(let j = 0; j < this.board_length; j++){
                let f = pom.charAt(i * this.board_length + j)
                if(f != "."){
                    let figure = {name: pom.charAt(i * this.board_length + j), color: i > 3 ? "white": "black", possible_moves: []}
                    this.board[i].push(figure)
                }else{
                    this.board[i].push({name: f})
                }
            }
        }

        this.print_chess_board()
    }

    print_chess_board(){
        for(let i = 0; i < this.board_length; i++){
            let str = ""
            for(let j = 0; j < this.board_length; j++){
                str += this.board[i][j].name + " "
            }
            console.log(str)
        }
    }

    move_figure(color, x, y, old_x, old_y){
        console.log("Moving a figure...")

        let turn = color == this.turn
        let occupied = this.board[x][y].name != "."

        if(occupied && this.board[x][y].color != color){
            return false
        }
        if(turn && !occupied){
            if(color == "black"){
                if(x == 7 - old_x && y == old_y) return false
                this.board[x][y] = this.board[7 - old_x][old_y]
                this.board[7 - old_x][old_y] = {name: "."}
            }else{
                if(x == old_x && y == old_y) return false
                this.board[x][y] = this.board[old_x][old_y]
                this.board[old_x][old_y] = {name: "."}
            }
            this.turn = this.turn == "white" ? "black" : "white"
            this.print_chess_board()
            return true
        }else{
            console.log("Can`t make this move!")
            return false
        }
    }

    get_possible_moves(x, y, color){
        x = color == "black" ? 7 - x : x
        let figure = this.board[x][y]
        
        if(figure.name == ".") return []

        eval(`this.${String(figure.name).toLowerCase()}_moves(${x}, ${y}, '${color}')`)
    }

    p_moves(x, y, color){
        console.log("Possible moves for pawn: ", x, y, color)
    }

    h_moves(x, y, color){
        console.log("Possible moves for horse: ", x, y, color)
    }

    b_moves(x, y, color){
        console.log("Possible moves for bishop: ", x, y, color)
    }

    r_moves(x, y, color){
        console.log("Possible moves for rook: ", x, y, color)
    }

    q_moves(x, y, color){
        console.log("Possible moves for queen: ", x, y, color)
    }

    k_moves(x, y, color){
        console.log("Possible moves for king: ", x, y, color)
    }
}