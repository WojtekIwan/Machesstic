import "../../styles/main.scss"
import { useEffect, useState } from "react"

function Figure(props){
    let x = props.x
    let y = props.y

    const [drag, setDrag] = useState(false)
    
    useEffect(e => {
        window.addEventListener("mousemove", drag_figure)
        return () => {
            window.removeEventListener("mousemove", drag_figure)
        }
    }, [drag])

    function drag_figure(e){
        if(drag){         
            e.target.style.left = `${e.pageX - 32}px`
            e.target.style.top = `${e.pageY - 32}px`
        }
    }

    function start_dragging_figure(e){
        setDrag(p => true)
        props.setCurrentFigure({"figure":e.target, "update_pos": update_position})
        // e.target.style.pointerEvents = "none"
    }

    function update_position(new_x, new_y){
        x = new_x
        y = new_y
        console.log(x, y, " <- YA BUDDY")
    }

    function drop_figure(e){
        setDrag(p => false)
        // e.target.style.pointerEvents = "none"
        props.figure_drop(update_position, e)
    }

    return (
        <div className='figure' onMouseDown={(e) => start_dragging_figure(e)} onMouseUp={(e) => drop_figure(e)}></div>
    )
}

export default Figure