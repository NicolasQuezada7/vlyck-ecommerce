import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import axios from 'axios' // <--- Asegúrate que axios esté importado

// 🔴 CAMBIO IMPORTANTE: PEGA AQUÍ TU URL DE RAILWAY DIRECTA
// (La que copiaste antes, tipo: https://vlyck-production.up.railway.app)
// ¡SIN la barra "/" al final!
axios.defaults.baseURL = 'https://TU-URL-DE-RAILWAY-AQUI.up.railway.app'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CartProvider>
  </React.StrictMode>,
)