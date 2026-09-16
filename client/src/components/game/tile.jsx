// +---------------------------------------------------------------------------------+
// |                                TILE COMPONENT                                   |
// |                     Tile - it can be taken (possible move)                      |
// +---------------------------------------------------------------------------------+

// Tile component
export default function Tile(props){
    // Variables from props
    const x = props.x
    const y = props.y
    const x_notation = props.notation_x
    const y_notation = props.notation_y
    
    // Component render
    return (
        <div key={x + "-" + y} className={(x + y) % 2 != 0 ? "dark_tile chess_tile" : "light_tile chess_tile"}>
            {props.possible_move ? <div className="possible_move"></div> : <></>}
            {x_notation ? <div className="notation_x">{x_notation}</div> : <></>}
            {y_notation ? <div className="notation_y">{y_notation}</div> : <></>}
        </div>
    )
}