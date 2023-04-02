import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './samples/node-api'
import 'roku-ui/style.css'
import './styles/index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'
import { Dash } from './pages/Dash'
import { Settings } from './pages/Settings'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <Dash />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
