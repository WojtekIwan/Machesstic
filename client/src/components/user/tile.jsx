import { useEffect, useRef } from "react"

function Tile(props){
    const x = props.x
    const y = props.y

    return (
        <div key={x + "-" + y} className={(x + y) % 2 != 0 ? "dark_tile chess_tile" : "light_tile chess_tile"}>
            {props.possible_move ? <div className="possible_move"></div> : <></>}
            {props.notation_x ? <div className="notation_x">{props.notation_x}</div> : <></>}
            {props.notation_y ? <div className="notation_y">{props.notation_y}</div> : <></>}
        </div>
    )
}

export default Tile