import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import WelcomePage from './components/welcomePage'
import ErrorComponent from './components/errorCompenent'

const router = createBrowserRouter([
  {
    path: "/",
    element: <WelcomePage/>,
    errorElement: <ErrorComponent/>
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
