// +---------------------------------------------------------------------------------+
// |                              FIGURE COMPONENT                                   |
// |                   Control whole figure movement and dragging                    |
// +---------------------------------------------------------------------------------+

// Imports
import "../../styles/main.scss"
import { useEffect, useRef, useState } from "react"

// Images imports for figure
import pawn_white from "../../assets/pawn_white.png"
import pawn_black from "../../assets/pawn_black.png"

import bishop_white from "../../assets/bishop_white.png"
import bishop_black from "../../assets/bishop_black.png"

import horse_white from "../../assets/horse_white.png"
import horse_black from "../../assets/horse_black.png"

import rook_white from "../../assets/rook_white.png"
import rook_black from "../../assets/rook_black.png"

import queen_white from "../../assets/queen_white.png"
import queen_black from "../../assets/queen_black.png"

import king_white from "../../assets/king_white.png"
import king_black from "../../assets/king_black.png"

// Figure component
export default function Figure(props){
    // Neccesary variables
    let [x, setX] = useState(props.x)
    let [y, setY] = useState(props.y)
    let [imagePath, setImagePath] = useState(null)

    const figureRef = useRef(null)
    const [drag, setDrag] = useState(false)

    // Images for figure
    const images = {
        "p_white": pawn_white, "p_black": pawn_black,
        "b_white": bishop_white, "b_black": bishop_black,
        "h_white": horse_white, "h_black": horse_black,
        "r_white": rook_white, "r_black": rook_black,
        "q_white": queen_white, "q_black": queen_black,
        "k_white": king_white, "k_black": king_black,
    }

    // On loading page going to correct tile and settign up correct image path
    useEffect(() => {
        go_back()
        // Setting up image for figure
        setImagePath(p => images[String(props.type).toLowerCase() + "_" + props.color])
    }, [imagePath])

    // Adding listeners for window
    useEffect(() => {
        window.addEventListener("mousemove", drag_figure)
        window.addEventListener("mouseup", drop_figure)
        return () => {
            window.removeEventListener("mousemove", drag_figure)
            window.removeEventListener("mouseup", drop_figure)
        }
    }, [drag])

    // Dragging figure around the board
    function drag_figure(e){
        if(drag){        
            let box = props.table.current.getBoundingClientRect() // Getting table bounding box

            let x_drag = clamp(e.clientX, box.left, box.left + box.width) - 32
            let y_drag = clamp(e.clientY, box.top, box.top + box.height) - 32

            // Setting up new figure position
            figureRef.current.style.left = `${Math.round(x_drag)}px`
            figureRef.current.style.top = `${Math.round(y_drag)}px`
        }
    }

    // Clamping two values
    function clamp(num, max, min){
        return Math.min(Math.max(num, max), min)
    }

    // Start dragging figure
    function start_dragging_figure(e){
        figureRef.current = e.target // Setting current
        setDrag(p => true) // figure is dragged
        figureRef.current.style.zIndex = 999 // Setting up big index (so figure is always on top)

        // Updating current figure at game component
        props.setCurrentFigure({
            "figure": figureRef.current,
            "go_back": go_back,
            "update_pos": update_position, 
            "old_pos": {"x": x, "y": y}
        })
        // Setting up drag so possible moves are displayed
        props.drag(x, y)
    }

    // Updating figure (going back to previous position - x and y don`t need to be changed)
    function go_back(){
        figureRef.current.style.top = `${props.table.current.getBoundingClientRect().top + x * 64}px`
        figureRef.current.style.left = `${props.table.current.getBoundingClientRect().left + y * 64}px`
    }

    // Updating position to given new x and y
    function update_position(new_x, new_y){
        setX(x => new_x)
        setY(y => new_y)

        // I am not using go back because x and y is not updated yet
        figureRef.current.style.top = `${props.table.current.getBoundingClientRect().top + new_x * 64}px`
        figureRef.current.style.left = `${props.table.current.getBoundingClientRect().left + new_y * 64}px`
    }

    // Dropping figure at given place if it`s dragged
    function drop_figure(e){
        if(drag){
            // Checking the cords of mouse drop (setting x, y in board)
            let box = props.table.current.getBoundingClientRect()
            let x_drag = clamp(e.clientX, box.left, box.left + box.width) 
            let y_drag = clamp(e.clientY, box.top, box.top + box.height) 

            // Locating a figure position in board cords (from 0 to 7 like board length)
            let x_in_table = parseInt(clamp(Math.round(x_drag - box.left) / 64, 0, 7))
            let y_in_table = parseInt(clamp(Math.round(y_drag - box.top) / 64, 0, 7))

            setDrag(p => false) // Figure is dropped so you don`t drag it
            props.figure_drop(y_in_table, x_in_table)
        }
    }

    // Rendering figure
    return (
        <div >
            <img src={imagePath} className={props.possible_move ? "figure can_take" : "figure"} onDragStart={(e) => e.preventDefault()} ref={figureRef} onMouseDown={(e) => start_dragging_figure(e)}  alt={props.type}/>
        </div>
    )
}