// ***********************************************************************************
//                                  GAME MODULE
//      All that is connected to actual game, from chessboard, to moving and
//                                also overal game
// ***********************************************************************************
export class ChessGame{
    // Chess game init
    constructor(){
        // Basic variables
        this.board = []
        this.board_length = 8
        this.turn = "white"

        // This is for checking if enemy king is in check and if king can move. If not other player win
        this.kings = {"black": null, "white": null}

        let pom = "RHBQKBHRPPPPPPPP................................PPPPPPPPRHBQKBHR" // We don`t talk about it, it works 

        // Creating board from scratch
        for(let i = 0; i < this.board_length; i++){
            this.board.push([])
            for(let j = 0; j < this.board_length; j++){
                let f = pom.charAt(i * this.board_length + j)
                if(f != "."){
                    let figure = {name: pom.charAt(i * this.board_length + j), color: i > 3 ? "white": "black", possible_moves: [], first_move: true, en_passant: false}
                    
                    // Setting up a king for black and white
                    if(figure.name == "K"){
                        this.kings[figure.color] = [i, j]
                    }

                    this.board[i].push(figure)
                }else{
                    this.board[i].push({name: f}) // Empty tile '.'
                }
            }
        }

        this.print_chess_board()
    }


    // Printing formated chessboard in console (helps in debugging)
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
        for(let i = 0; i < this.board_length; i++){
            for(let j = 0; j < this.board_length; j++){
                if(this.board[i][j].name == "K") continue // If king is checking you, congrats (it`s impossible)
                // If it`s enemy figure check it`s possible moves. Then if player king is in that moves return true
                if(this.board[i][j].name != "." && this.board[i][j].color != checkedColor){
                    let figure = this.board[i][j]
                    figure.possible_moves = [] // because there was a lot of same moves repeated
                    
                    eval(`this.${String(figure.name).toLowerCase()}_moves(${i}, ${j}, '${figure.color}')`)

                    for(let p = 0; p < figure.possible_moves.length; p++){
                        if(figure.possible_moves[p][0] == this.kings[checkedColor][0] && figure.possible_moves[p][1] ==  this.kings[checkedColor][1]){
                            // There is a check from an enemy figure (return true)
                            return true
                        }
                    }

                    figure.possible_moves = [] // because there was a lot of same moves repeated
                }
            }
        }

        return false // No checks from enemy
    }

    // Move figure in board
    move_figure(color, x, y, old_x, old_y){
        let pom_x = color == "black" ? 7 - old_x : old_x // if it`s black 'rotate' the x
        let turn = color == this.turn 
        let occupied = this.board[pom_x][old_y].name != "."

        // Checks if it is player figure
        if(occupied && this.board[pom_x][old_y].color != color){
            console.log("Not your figure mate.")
            return {can_move: false}
        }

        // If it`s player turn procced to move
        if(turn){
            // If not in possible moves than move can`t be made
            if(!this.contains_move(this.board[pom_x][old_y], x, y)){
                return {can_move: false}
            }
            
            if(x == pom_x && y == old_y) return {can_move: false} // Figure returend to original position, so move wasn`t made

            // If it`s pawn and it reached the other side of a board - promote it
            if(this.board[pom_x][old_y].name == "P"){
                let pom = this.board[pom_x][old_y].color == "white" ? x == 0 : x == 7
                console.log("Can promote...", pom, this.board[pom_x][old_y].color == "white" , x == 0 , x == 7)
                if(pom) return {can_move: false, can_promote: true}
            }

            if(this.board[pom_x][old_y].name == "K" && (old_y == y + 2 || old_y == y - 2)){
                console.log("This is a castle")
                
                // Moving a rook
                if(old_y == y + 2){
                    // This is short castle
                    let rook = this.board[x][7]
                    rook.first_move = false
                    this.board[x][0] = {name: "."}
                    this.board[x][y + 1] = rook
                }else{
                    // This is long castle
                    let rook = this.board[x][0]
                    rook.first_move = false
                    this.board[x][7] = {name: "."}
                    this.board[x][y - 1] = rook
                }
            }

            // For pawns: el passant was made
            if(this.board[pom_x][old_y].name == "P" && pom_x != x && old_y != y && this.board[x][y].name == "."){
                this.board[pom_x][y] = {name: "."}
            }


            // Actualy making a move
            this.board[x][y] = this.board[pom_x][old_y]
            this.board[pom_x][old_y] = {name: "."}

            // If it`s king update his position
            if(this.board[x][y].name == "K"){
                this.kings[this.board[x][y].color] = [x, y]
            }

            // Clearing en passant
            for(let i = 0; i < this.board_length; i++){
                for(let j = 0; j < this.board_length; j++){
                    if(this.board[i][j].name == "P"){
                        this.board[i][j].en_passant = false
                    }      
                }
            }
            
            // Pawn moved two tiles, en passant is possible, add it to en_passants
            this.board[x][y].en_passant = this.board[x][y].name == "P" && Math.abs(x - pom_x) == 2 && this.board[x][y].first_move
            
            // Move was made (this is for pawns, and casteling)
            this.board[x][y].first_move = false 

            this.turn = this.turn == "white" ? "black" : "white"

            this.print_chess_board()

            return {can_move: true, checkmate: this.is_checkmate(this.turn), stalemate: this.is_stalemate(this.turn)}
        }else{
            // You can`t make this move
            return {can_move: false}
        }
    }

    promote(color, x, y, old_x, old_y, type){
        this.board[x][y] = {name: String(type).toUpperCase(), color: color, possible_moves: [], first_move: false, en_passant: false}
        this.board[old_x][old_y] = {name: "."}
        this.turn = color == "black" ? "white" : "black"
    }

    // Checks if given color is checkmated
    is_checkmate(color){
        for(let i = 0; i < this.board_length; i++){
            for(let j = 0; j < this.board_length; j++){
                // For each figure that is in given color check possible moves for it
                // If there any possible moves there is no checkmate
                if(this.board[i][j].name != "." && this.board[i][j].color == color){
                    let moves = this.get_possible_moves(i, j, color)

                    if(moves.length != 0){
                        return false // Not a checkmate, there are some moves that can protected king
                    }

                    let figure = this.board[i][j]
                    figure.possible_moves = [] // Because there was a lot of same moves repeated 
                }
            }
        }
        return true // Checkmate!
    }

    // If you don`t have moves and enemy is not checking you then its stalemate
    is_stalemate(color){
        return this.is_checkmate(color) || !this.is_in_check(color)
    }

    // Checking if x and y is in possible moves
    contains_move(figure, x, y){
        for(let i = 0; i < figure.possible_moves.length; i++){
            if(x == figure.possible_moves[i][0] && y == figure.possible_moves[i][1]){
                return true
            }
        }
        return false
    }

    // Checks which moves are possible for given figure
    get_possible_moves(x, y, color){
        let figure = this.board[x][y]

        if(figure.color != color){
            console.log("Not your figure mate")
            return []
        }

        figure.possible_moves = []
        
        if(figure.name == ".") return [] // That is not a figure (this case is not likely to happen but it`s safer to check)
        let moves = eval(`this.${String(figure.name).toLowerCase()}_moves(${x}, ${y}, '${color}', ${true})`)
        
        // If after move there is a check you can`t make this move and it`s removed from possible moves
        let moves_under_check = []
        for(let i = 0; i < moves.length; i++){
            let pom = this.board[moves[i][0]][moves[i][1]] // Placeholder for eventual figure

            // Updating king position
            if(this.board[x][y].name == "K"){
                this.kings[this.board[x][y].color] = [x, y]
            }
            
            // Moving figure
            this.board[moves[i][0]][moves[i][1]] = this.board[x][y]
            this.board[x][y] = {name: "."}

            // There is no check so you can make this move
            if(!this.is_in_check(color)){
                moves_under_check.push(moves[i])
            }

            // King is going back
            if(this.board[moves[i][0]][moves[i][1]].name == "K"){
                this.kings[this.board[x][y].color] = [x, y]
            }

            // Going back
            this.board[x][y] = this.board[moves[i][0]][moves[i][1]] 
            this.board[moves[i][0]][moves[i][1]] = pom
        }
        this.board[x][y].possible_moves = moves_under_check
        return moves_under_check
    }

    // Checks if x and y is in board
    in_board(x, y){
        return x >= 0 && x < this.board_length && y >= 0 && y < this.board_length
    }

    // Checks if x and y is in board + if figure can be taken
    can_move(x, y, color){
        return this.in_board(x, y) && (this.board[x][y].name == "." || this.board[x][y].color != color)
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

        // El passant
        if(this.in_board(x, y - 1) && this.board[x][y - 1].name == "P" &&  this.board[x][y - 1].color != color && this.board[x][y - 1].en_passant){
            pawn.possible_moves.push([x + pom, y - 1])
            console.log(this.board[x][y - 1])
        }

        if(this.in_board(x, y + 1) && this.board[x][y + 1].name == "P" && this.board[x][y + 1].color != color  && this.board[x][y + 1].en_passant){
            pawn.possible_moves.push([x + pom, y + 1])
            console.log(this.board[x][y + 1].en_passant)
        }

        return pawn.possible_moves
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
                    // There is a figure on a way, you can`t move further than that
                    if(this.board[new_x][new_y].name != "."){
                        directions[key] = false
                    }
                }else{
                    directions[key] = false
                }
            }
            i += 1
        }while(sd)
        return bishop.possible_moves
    }

    // Getting possible moves for rook (works )
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
                    // There is a figure on a way, you can`t move further than that
                    if(this.board[new_x][new_y].name != "."){
                        directions[key] = false
                    }
                }else{
                    directions[key] = false
                }
            }
            i += 1
        }while(sd)
        return rook.possible_moves
    }

    // Getting possible moves for queen (rook + bishop moves)
    q_moves(x, y, color){
        let queen = this.board[x][y]

        let r = this.r_moves(x, y, color)
        let b = this.b_moves(x, y, color)

        queen.possible_moves = r.concat(b) // Adding up two arrays (bishop and rook)
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

        // CASTELING
        // If possible add moves responsible for casteling
        if(king.first_move && !this.is_in_check(king.color)){
            let pom = king.color == "black" ? 0 : 7
            let left = true
            let right = true
            // Left rook
            if(this.board[pom][0].name == "R" && this.board[pom][0].first_move){
                // Neither of figures moved so you can check if tiles are in check
                for(let i = 1; i < y; i++){
                    if(this.board[pom][i].name != "." || this.is_in_check(king.color)){
                        left = false
                    }
                }
            }

            // Right rook
            if(this.board[pom][7].name == "R" && this.board[pom][7].first_move){
                // Neither of figures moved so you can check if tiles are in check
                for(let i = 6; i > y; i--){
                    if(this.board[pom][i].name != "." || this.is_in_check(king.color)){
                        right = false
                    }
                }
            }

            if(left) king.possible_moves.push([pom, y - 2])
            if(right) king.possible_moves.push([pom, y + 2])
        }

        return king.possible_moves
    }
}