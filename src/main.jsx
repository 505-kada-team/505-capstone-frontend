import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from "@/context/AuthContext"
import { ContextEngineProvider } from "@/AI/contextEngine/ContextEngineContext"
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ContextEngineProvider>
        <App />
        </ContextEngineProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
