export class ChessGame{
    constructor(){
        this.board = []
        this.board_length = 8
        this.turn = 0
        let pom = "RHBQKBHRPPPPPPPP................................PPPPPPPPRHBQKBHR"

        for(let i = 0; i < this.board_length; i++){
            this.board.push([])
            for(let j = 0; j < this.board_length; j++){
                this.board[i].push(pom.charAt(i * this.board_length + j))
            }
        }

        this.print_chess_board()
    }

    print_chess_board(){
        for(let i = 0; i < this.board_length; i++){
            console.log(" " + this.board[i].join(" ") + "\n")
        }
    }
}