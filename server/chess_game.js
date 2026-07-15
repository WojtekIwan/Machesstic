export class ChessGame{
    constructor(){
        this.board = []
        this.board_length = 8
        this.turn = "white"

        // This is for checking if enemy king is in check and if king can move. If not other player win
        this.white = []
        this.black = []

        let pom = "RHBQKBHRPPPPPPPP................................PPPPPPPPRHBQKBHR"


        for(let i = 0; i < this.board_length; i++){
            this.board.push([])
            for(let j = 0; j < this.board_length; j++){
                let f = pom.charAt(i * this.board_length + j)
                if(f != "."){
                    let figure = {name: pom.charAt(i * this.board_length + j), color: i > 3 ? "white": "black", possible_moves: []}
                    this.board[i].push(figure)
                    if(figure.color == "white"){
                        this.white.push(figure)
                    }else{
                        this.black.push(figure)
                    }
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
        let occupied = this.board[color == "black" ? 7 - old_x: old_x][old_y].name != "."

        if(occupied && this.board[color == "black" ? 7 - old_x: old_x][old_y].color != color){
            console.log("Not your figure mate.")
            return false
        }

        if(turn){
            let pom_x = color == "black" ? 7 - old_x : old_x
            console.log(pom_x, old_y, x, y, "<- tha data")
            if(!this.contains_move(this.board[pom_x][old_y], x, y)){
                console.log("Not in possible moves!")
                return false
            }

            if(x == pom_x && y == old_y) return false
            this.board[x][y] = this.board[pom_x][old_y]
            this.board[pom_x][old_y] = {name: "."}

            this.turn = this.turn == "white" ? "black" : "white"
            this.print_chess_board()
            return true
        }else{
            console.log("Can`t make this move!", turn, occupied)
            this.print_chess_board()
            return false
        }
    }

    contains_move(figure, x, y){
        console.log("Checking if in moves for ", x, y, figure.possible_moves)
        let moves = figure.possible_moves
        for(let i = 0; i < moves.length; i++){
            if(x == moves[i][0] && y == moves[i][1]){
                return true
            }
        }
        return false
    }

    get_possible_moves(x, y, color){
        x = color == "black" ? 7 - x : x
        let figure = this.board[x][y]

        figure.possible_moves = []
        
        if(figure.name == ".") return []

        return eval(`this.${String(figure.name).toLowerCase()}_moves(${x}, ${y}, '${color}')`)
    }

    in_board(x, y){
        return x >= 0 && x < this.board_length && y >= 0 && y < this.board_length
    }

    p_moves(x, y, color){
        if(color == "black"){
            if(this.in_board(x + 1, y) && this.board[x + 1][y].name == "."){
                this.board[x][y].possible_moves.push([x + 1, y])
            }

            if(this.in_board(x + 2, y) && this.board[x + 2][y].name == "."){
                this.board[x][y].possible_moves.push([x + 2, y])
            }
        }else{
            if(this.in_board(x - 1, y) && this.board[x - 1][y].name == "."){
                this.board[x][y].possible_moves.push([x - 1, y])
            }

            if(this.in_board(x - 2, y) && this.board[x - 2][y].name == "."){
                this.board[x][y].possible_moves.push([x - 2, y])
            }
        }
        console.log("Possible moves for pawn: ", x, y, this.board[x][y].possible_moves)
        return this.board[x][y].possible_moves
    }

    h_moves(x, y, color){
        console.log("Possible moves for horse: ", x, y, color)
        return []
    }

    b_moves(x, y, color){
        console.log("Possible moves for bishop: ", x, y, color)
        return []
    }

    r_moves(x, y, color){
        let rook = this.board[x][y]
        let directions = {"left": true, "right": true, "top": true, "bottom": true}

        let i = 0
        let sd = directions.bottom || directions.left || directions.right || directions.top
        while(sd){
            if(directions.bottom && this.in_board(x + i, y) && this.board[x + i][y].name == "."){
                rook.possible_moves.push([x + i, y])
            }else{
                directions.bottom = false
            }

            if(directions.top && this.in_board(x - i, y) && this.board[x - i][y].name == "."){
                rook.possible_moves.push([x - i, y])
            }else{
                directions.top = false
            }

            if(directions.right && this.in_board(x, y + i) && this.board[x][y + i].name == "."){
                rook.possible_moves.push([x, y + i])
            }else{
                directions.right = false
            }

            if(directions.left && this.in_board(x, y - i) && this.board[x][y - i].name == "."){
                rook.possible_moves.push([x, y - i])
            }else{
                directions.left = false
            }
            i += 1
        }
        
        console.log("Possible moves for rook: ", x, y, color)
        return rook.possible_moves
    }

    q_moves(x, y, color){
        console.log("Possible moves for queen: ", x, y, color)
        return []
    }

    k_moves(x, y, color){
        let king = this.board[x][y]
        // check if king is checked. If it is eliminate some of his moves
        // let enemy_moves = [...]
        for(let i = -1; i < 2; i++){
            for(let j = -1; j < 2; j++){
                if(i != j && this.in_board(x + i, y + j)){
                    king.possible_moves.push([x + i, y + j])
                }
            }
        }
        console.log("Possible moves for king: ", x, y, color)
        return king.possible_moves
    }
}