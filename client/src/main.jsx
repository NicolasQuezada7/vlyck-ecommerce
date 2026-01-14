import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'

// --- IMPORTANTE: TUS CONTEXTOS ---
import { AuthProvider } from './context/AuthContext' // <--- FALTABA ESTE IMPORT
import { CartProvider } from './context/CartContext'

// Configuración de Axios (Tu URL de Railway)
axios.defaults.baseURL = 'https://vlyck-ecommerce-production.up.railway.app'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  /* 1. QUITAMOS <React.StrictMode> 
        Esto soluciona que el carrito sume de 2 en 2.
  */
  
  <BrowserRouter>
    {/* 2. AUTH PROVIDER (Debe envolver al CartProvider y a la App) */}
    <AuthProvider>
      
      {/* 3. CART PROVIDER (Ahora tiene acceso al usuario logueado) */}
      <CartProvider>
        <App />
      </CartProvider>
      
    </AuthProvider>
  </BrowserRouter>
)