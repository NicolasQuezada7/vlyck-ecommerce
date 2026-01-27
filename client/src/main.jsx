import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// Configuración de Axios (Se mantiene aquí, está perfecto)
axios.defaults.baseURL = 'https://vlyck-ecommerce-production.up.railway.app'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  /* YA NO necesitamos <BrowserRouter> ni Providers aquí,
     porque ahora todo eso vive dentro de <App />.
     
     Dejamos fuera el StrictMode como querías para evitar 
     el doble renderizado en desarrollo.
  */
    <App />
)