import "../../styles/main.scss"
import { useEffect, useRef, useState } from "react"

function Figure(props){
    let [x, setX] = useState(props.x)
    let [y, setY] = useState(props.y)

    let figureRef = useRef(null)

    const [drag, setDrag] = useState(false)
    
    useEffect(() => {
        go_back()
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
            // console.log(e.clientX, props.table.current.getBoundingClientRect().top) 
            let box = props.table.current.getBoundingClientRect()

            let x_drag = Math.min(Math.max(e.clientX, box.left), box.left + box.width) - 32
            let y_drag = Math.min(Math.max(e.clientY, box.top), box.top + box.height) - 32

            figureRef.current.style.left = `${Math.round(x_drag)}px`
            figureRef.current.style.top = `${Math.round(y_drag)}px`
        }
    }

    function start_dragging_figure(e){
        figureRef.current = e.target
        setDrag(p => true)
        let box = e.target.getBoundingClientRect()
        props.setCurrentFigure({"figure":e.target, "go_back": go_back, "update_pos": update_position, "old_pos": {"x": box.left, "y": box.top}})
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
            setDrag(p => false)
            props.figure_drop()
        }
    }

    return (
        <div className='figure' onDragStart={(e) => e.preventDefault()} ref={figureRef} onMouseDown={(e) => start_dragging_figure(e)}></div>
    )
}

export default Figure