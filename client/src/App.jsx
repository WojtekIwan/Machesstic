import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

function App() {
  const navigate = useNavigate()
  useEffect(() => {
    // Checking if user can be redirected to user page. If not redirect it to user/login
    navigate("/user/login")
  }, [])
  return (
    <>
      <h2>Main website</h2>
    </>
  )
}

export default App
