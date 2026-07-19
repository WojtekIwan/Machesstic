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
                    let figure = {name: pom.charAt(i * this.board_length + j), color: i > 3 ? "white": "black", possible_moves: [], first_move: true}
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

            if(this.board[x][y].name != "."){
                if(color == "black"){
                    this.white.splice(this.white.indexOf(this.board[x][y]), 1)
                }else{
                    this.black.splice(this.black.indexOf(this.board[x][y]), 1)
                }
                console.log("A figure was taken from the board!")
            }
            this.board[x][y] = this.board[pom_x][old_y]
            this.board[pom_x][old_y] = {name: "."}

            this.board[x][y].first_move = false // Move was made (this is for pawns, and casteling)

            console.log("figure -> ", this.board[x][y])

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

        if(figure.color != color){
            console.log("Not your figure mate")
            return []
        }

        figure.possible_moves = []
        
        if(figure.name == ".") return []

        return eval(`this.${String(figure.name).toLowerCase()}_moves(${x}, ${y}, '${color}')`)
    }

    in_board(x, y){
        return x >= 0 && x < this.board_length && y >= 0 && y < this.board_length
    }

    can_move(x, y, color){
        return x >= 0 && x < this.board_length && y >= 0 && y < this.board_length && (this.board[x][y].name == "." || this.board[x][y].color != color)
    }

    // Possible moves for pawn
    p_moves(x, y, color){
        let pom = color == "black" ? 1 : -1
        let pawn = this.board[x][y]

        if(this.in_board(x + pom, y) && this.board[x + pom][y].name == "."){
            pawn.possible_moves.push([x + pom, y])

            if(pawn.first_move && this.in_board(x + pom * 2, y) && this.board[x + pom * 2][y].name == "."){
                pawn.possible_moves.push([x + pom * 2, y])
            }
        }

        // Taking figures (left and right)
        if(this.can_move(x + pom, y + 1, color) && this.board[x + pom][y + 1].name != "."){
            pawn.possible_moves.push([x + pom, y + 1])
        }

        if(this.can_move(x + pom, y - 1, color) && this.board[x + pom][y - 1].name != "."){
            pawn.possible_moves.push([x + pom, y - 1])
        }

        console.log("Possible moves for pawn: ", x, y, this.board[x][y].possible_moves)
        return this.board[x][y].possible_moves
    }

    // Getting possible moves for horse
    h_moves(x, y, color){
        let horse = this.board[x][y]
        let combinations = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]]
        for(let i = 0; i < combinations.length; i++){
            let new_x = x + combinations[i][0]
            let new_y = y + combinations[i][1]
            if(this.can_move(new_x, new_y, color)){
                horse.possible_moves.push([new_x, new_y])
            }
        }

        console.log("Possible moves for horse: ", x, y, horse.possible_moves)
        return horse.possible_moves
    }

    // Getting possible moves for bishop
    b_moves(x, y, color){
        let bishop = this.board[x][y]
        let directions = {"bl": [1, -1], "br": [1, 1], "tl": [-1, -1], "tr": [-1, 1]} // Directions for bishop 

        let i = 1
        let sd = true
        do{
            sd = directions.bl || directions.br || directions.tl || directions.tr
            // Iterating through directions, if it`s possible add move to possible moves
            for (let [key, value] of Object.entries(directions)) {
                let new_x = x + value[0] * i
                let new_y = y + value[1] * i
                if(value && this.can_move(new_x, new_y, color)){
                    bishop.possible_moves.push([new_x, new_y])
                }else{
                    directions[key] = false
                }
            }
            i += 1
        }while(sd)
        
        console.log("Possible moves for bishop: ", x, y, bishop.possible_moves)
        return bishop.possible_moves
    }

    // Getting possible moves for rook
    r_moves(x, y, color){
        let rook = this.board[x][y]
        let directions = {"l": [0, -1], "r": [0, 1], "t": [-1, 0], "b": [1, 0]} // Directions for rook 

        let i = 1
        let sd = true
        do{
            sd = directions.l || directions.r || directions.t || directions.b
            // Iterating through directions, if it`s possible add move to possible moves
            for (let [key, value] of Object.entries(directions)) {
                let new_x = x + value[0] * i
                let new_y = y + value[1] * i
                if(value && this.can_move(new_x, new_y, color)){
                    rook.possible_moves.push([new_x, new_y])
                }else{
                    directions[key] = false
                }
            }
            i += 1
        }while(sd)
        
        console.log("Possible moves for rook: ", x, y, rook.possible_moves)
        return rook.possible_moves
    }

    // Getting possible moves for queen (rook + bishop moves)
    q_moves(x, y, color){
        let queen = this.board[x][y]

        let r = this.r_moves(x, y, color)
        let b = this.b_moves(x, y, color)

        queen.possible_moves = r.concat(b) // Adding up two arrays (bishop and rook)

        console.log("Possible moves for queen: ", x, y, queen.possible_moves)
        return queen.possible_moves
    }

    // Getting possible moves for king
    k_moves(x, y, color){
        let king = this.board[x][y]
        // check if king is checked. If it is eliminate some of his moves
        // let enemy_moves = [...]
        for(let i = -1; i < 2; i++){
            for(let j = -1; j < 2; j++){
                if(this.can_move(x + i, y + j, color)){
                    if(x + i == x && y + j == y) continue
                    king.possible_moves.push([x + i, y + j])
                }
            }
        }
        console.log("Possible moves for king: ", x, y, king.possible_moves)
        return king.possible_moves
    }
}