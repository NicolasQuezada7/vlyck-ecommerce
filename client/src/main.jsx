import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext' // <--- IMPORTAR

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider> {/* <--- ENVOLVER INICIO */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CartProvider> {/* <--- ENVOLVER FINAL */}
  </React.StrictMode>,
)