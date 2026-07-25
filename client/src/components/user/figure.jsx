import "../../styles/main.scss"
import { useEffect, useRef, useState } from "react"

import pawn_white from "../../assets/pawn_white.png"
import pawn_black from "../../assets/pawn_black.png"

function Figure(props){
    let [x, setX] = useState(props.x)
    let [y, setY] = useState(props.y)

    let figureRef = useRef(null)

    let [imagePath, setImagePath] = useState("")
    let images = {"pawn_white": pawn_white, "pawn_black": pawn_black}

    const [drag, setDrag] = useState(false)

    useEffect(() => {
        go_back()
        set_propper_image()
    }, [])

    useEffect(() => {
        window.addEventListener("mousemove", drag_figure)
        window.addEventListener("mouseup", drop_figure)
        return () => {
            window.removeEventListener("mousemove", drag_figure)
            window.removeEventListener("mouseup", drop_figure)
        }
    }, [drag])

    function drag_figure(e){
        if(drag){        
            let box = props.table.current.getBoundingClientRect()

            let x_drag = Math.min(Math.max(e.clientX, box.left), box.left + box.width) - 32
            let y_drag = Math.min(Math.max(e.clientY, box.top), box.top + box.height) - 32

            figureRef.current.style.left = `${Math.round(x_drag)}px`
            figureRef.current.style.top = `${Math.round(y_drag)}px`
        }
    }

    function clamp(num, max, min){
        return Math.min(Math.max(num, max), min)
    }

    function start_dragging_figure(e){
        figureRef.current = e.target
        setDrag(p => true)
        let box = e.target.getBoundingClientRect()
        e.target.style.zIndex = 999
        props.setCurrentFigure({"figure":e.target, "go_back": go_back, "update_pos": update_position, "old_pos": {"x": x, "y": y}})
        props.drag(x, y)
    }

    function go_back(){
        figureRef.current.style.top = `${props.table.current.getBoundingClientRect().top + x * 64}px`
        figureRef.current.style.left = `${props.table.current.getBoundingClientRect().left + y * 64}px`
    }

    function update_position(new_x, new_y){
        setX(x => new_x)
        setY(y => new_y)

        figureRef.current.style.top = `${props.table.current.getBoundingClientRect().top + new_x * 64}px`
        figureRef.current.style.left = `${props.table.current.getBoundingClientRect().left + new_y * 64}px`
        console.log(new_x, new_y, " <- YA BUDDY")
    }

    function drop_figure(e){
        if(drag){
            // Checking the cords of mouse drop (setting x,y in board)
            let box = props.table.current.getBoundingClientRect()
            let x_drag = Math.min(Math.max(e.clientX, box.left), box.left + box.width) 
            let y_drag = Math.min(Math.max(e.clientY, box.top), box.top + box.height) 

            let x_in_table = parseInt(clamp(Math.round(x_drag - box.left) / 64, 0, 7))
            let y_in_table = parseInt(clamp(Math.round(y_drag - box.top) / 64, 0, 7))

            console.log(x_in_table, y_in_table)
            setDrag(p => false)
            props.figure_drop(y_in_table, x_in_table)
        }
    }

    function set_propper_image(){
        switch(props.type){
            case "P":
                setImagePath(p => images["pawn_" + props.color])
                break
            default:
                setImagePath(p => "")
        }
    }

    return (
        <div className={props.possible_move ? "figure can_take" : "figure"} onDragStart={(e) => e.preventDefault()} ref={figureRef} onMouseDown={(e) => start_dragging_figure(e)}>
            <img src={imagePath}  alt={props.type}/>
        </div>
    )
}

export default Figure