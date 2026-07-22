export class ChessGame{
    constructor(){
        this.board = []
        this.board_length = 8
        this.turn = "white"

        // This is for checking if enemy king is in check and if king can move. If not other player win
        this.white_king = null
        this.black_king = null

        let pom = "RHBQKBHRPPPPPPPP................................PPPPPPPPRHBQKBHR"


        for(let i = 0; i < this.board_length; i++){
            this.board.push([])
            for(let j = 0; j < this.board_length; j++){
                let f = pom.charAt(i * this.board_length + j)
                if(f != "."){
                    let figure = {name: pom.charAt(i * this.board_length + j), color: i > 3 ? "white": "black", possible_moves: [], first_move: true}
                    
                    // Setting up a king for black and white
                    if(figure.name == "K"){
                        if(figure.color == "black"){
                            this.black_king = [i, j]
                        }else{
                            this.white_king = [i, j]
                        }
                    }

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

    // Checks if 'checkedColor' is checked (what a suprise). If so return true
    is_in_check(checkedColor){
        let checked_king = checkedColor == "black" ? this.black_king : this.white_king
        console.log("Checked king position: ", checked_king, checkedColor)
        for(let i = 0; i < this.board_length; i++){
            for(let j = 0; j < this.board_length; j++){
                if(this.board[i][j].name != "." && this.board[i][j].color != checkedColor){
                    let figure = this.board[i][j]
                    figure.possible_moves = [] // because there was a lot of same moves repeated
                    eval(`this.${String(figure.name).toLowerCase()}_moves(${i}, ${j}, '${figure.color}')`)
                    for(let p = 0; p < figure.possible_moves.length; p++){
                        if(figure.possible_moves[p][0] == checked_king[0] && figure.possible_moves[p][1] == checked_king[1]){
                            console.log("CHECKED!!!", this.board[checked_king[0]][checked_king[1]].color, "king is checked")
                            return true
                        }
                    }
                }
            }
        }

        return false
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
                console.log("A figure was taken from the board!")
            }
            this.board[x][y] = this.board[pom_x][old_y]
            this.board[pom_x][old_y] = {name: "."}

            if(this.board[x][y].name == "K"){
                if(this.board[x][y].color == "black"){
                    this.black_king = [x,y]
                }else{
                    this.white_king = [x,y]
                }
            }

            this.board[x][y].first_move = false // Move was made (this is for pawns, and casteling)

            console.log("figure -> ", this.board[x][y])

            this.turn = this.turn == "white" ? "black" : "white"

            // this.is_in_check(this.turn, true) // Checking if enemy is checked
            let checkmate = this.is_checkmate(this.turn)

            if(checkmate){
                console.log("******************************************************************")
                console.log(`*               ${this.turn} KING IS CHECKMATED!                 *`)
                console.log("******************************************************************")
            }

            this.print_chess_board()
            return true
        }else{
            console.log("Can`t make this move!", turn, occupied)
            this.print_chess_board()
            return false
        }
    }

    // Checks if 'color' is checkmated
    is_checkmate(color){
        for(let i = 0; i < this.board_length; i++){
            for(let j = 0; j < this.board_length; j++){
                if(this.board[i][j].name != "." && this.board[i][j].color == color){
                    console.log(this.board[i][j].color, color)
                    let moves = this.get_possible_moves(i, j, color)

                    if(moves.length != 0){
                        return false
                    }

                    let figure = this.board[i][j]
                    figure.possible_moves = [] // because there was a lot of same moves repeated 
                }
            }
        }

        return true
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
        let figure = this.board[x][y]

        if(figure.color != color){
            console.log("Not your figure mate")
            return []
        }

        figure.possible_moves = []
        
        if(figure.name == ".") return []
        let moves = eval(`this.${String(figure.name).toLowerCase()}_moves(${x}, ${y}, '${color}', ${true})`)

        // Check if its checked after move
        let moves2 = []

        for(let i = 0; i < moves.length; i++){
            let pom = this.board[moves[i][0]][moves[i][1]]

            if(this.board[x][y].name == "K"){
                if(color == "black"){
                    this.black_king = [moves[i][0], moves[i][1]]
                }else{
                    this.white_king = [moves[i][0], moves[i][1]]
                }
            }
            
            this.board[moves[i][0]][moves[i][1]] = this.board[x][y]
            this.board[x][y] = {name: "."}

            if(!this.is_in_check(color)){
                console.log("*************************** KING MADE A MOVE AND IT`S NOT CHECKED ***************************")
                this.print_chess_board()
                moves2.push(moves[i])
            }

            if(this.board[moves[i][0]][moves[i][1]].name == "K"){
                if(color == "black"){
                    this.black_king = [x, y]
                }else{
                    this.white_king = [x, y]
                }
            }

            this.board[x][y] = this.board[moves[i][0]][moves[i][1]] 
            this.board[moves[i][0]][moves[i][1]] = pom
        }
        console.log("THERE ARE POSSIBLE MOVES FOR: ", this.board[x][y].name, this.board[x][y].possible_moves)
        this.board[x][y].possible_moves = moves2
        return moves2
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

        // console.log("Possible moves for pawn: ", x, y, this.board[x][y].possible_moves)
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
        horse.possible_moves = horse.possible_moves.filter((value, index, array) => array.indexOf(value) === index)
        // console.log("Possible moves for horse: ", x, y, horse.possible_moves)
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
                    if(this.board[new_x][new_y].name != "."){
                        directions[key] = false
                    }
                }else{
                    directions[key] = false
                }
            }
            i += 1
        }while(sd)
        bishop.possible_moves = bishop.possible_moves.filter((value, index, array) => array.indexOf(value) === index)
        // console.log("Possible moves for bishop: ", x, y, bishop.possible_moves)
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
                    if(this.board[new_x][new_y].name != "."){
                        directions[key] = false
                    }
                }else{
                    directions[key] = false
                }
            }
            i += 1
        }while(sd)
        rook.possible_moves = rook.possible_moves.filter((value, index, array) => array.indexOf(value) === index)
        // console.log("Possible moves for rook: ", x, y, rook.possible_moves)
        return rook.possible_moves
    }

    // Getting possible moves for queen (rook + bishop moves)
    q_moves(x, y, color){
        let queen = this.board[x][y]

        let r = this.r_moves(x, y, color)
        let b = this.b_moves(x, y, color)

        queen.possible_moves = r.concat(b) // Adding up two arrays (bishop and rook)
        queen.possible_moves = queen.possible_moves.filter((value, index, array) => array.indexOf(value) === index)
        // console.log("Possible moves for queen: ", x, y, queen.possible_moves)
        return queen.possible_moves
    }

    // Getting possible moves for king
    k_moves(x, y, color){
        let king = this.board[x][y]
        for(let i = -1; i < 2; i++){
            for(let j = -1; j < 2; j++){
                if(x + i == x && y + j == y) continue // It`s the same tile that king is at (skip it)

                if(this.can_move(x + i, y + j, color)){
                    king.possible_moves.push([x + i, y + j])
                }
            }
        }
        // Filtering repeated moves
        king.possible_moves = king.possible_moves.filter((value, index, array) => array.indexOf(value) === index)
        // console.log("Possible moves for king: ", x, y, king.possible_moves)
        return king.possible_moves
    }
}