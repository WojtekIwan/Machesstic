import { useEffect, useRef } from "react"

function Tile(props){
    const x = props.x
    const y = props.y

    return (
        <div key={x + "-" + y} onMouseEnter={(e) => {props.set_current(x, y)}} className={(x + y) % 2 == 0 ? "dark_tile chess_tile" : "light_tile chess_tile"}></div>
    )
}

export default Tile