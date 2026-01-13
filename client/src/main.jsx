import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import axios from 'axios' // <--- 1. NUEVO: IMPORTAR AXIOS

// <--- 2. NUEVO: CONFIGURACIÓN GLOBAL DE URL
// Si existe la variable en Netlify (VITE_API_URL), usa esa.
// Si no existe (estás en tu PC), usa localhost:5000.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CartProvider>
  </React.StrictMode>,
)