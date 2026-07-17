import { useEffect, useRef } from "react"

function Tile(props){
    const x = props.x
    const y = props.y

    return (
        <div key={x + "-" + y} className={(x + y) % 2 == 0 ? "dark_tile chess_tile" : "light_tile chess_tile"}>
            {props.possible_move ? <div className="possible_move"></div> : <></>}
        </div>
    )
}

export default Tile