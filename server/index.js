import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();
connectDB();

const app = express();

// --- CONFIGURACIÓN DE CORS INTELIGENTE ---
// Lista de orígenes permitidos (Tu PC y tu futuro dominio)
const allowedOrigins = [
  "http://localhost:5173",          // Tu PC
  "http://localhost:5000",          // Postman / Local
  "https://vlyck.cl",               // Tu Dominio Final (Sin www)
  "https://www.vlyck.cl",           // Tu Dominio Final (Con www)
  "https://vlyck-front.netlify.app", // <--- 🔴 LA QUE FALTABA (Tu Netlify actual)
  process.env.FRONTEND_URL          // La variable de Railway
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como Postman) o si el origen está en la lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Origen bloqueado por CORS:", origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true // Permite envío de cookies/headers de autorización
}));

app.use(express.json());

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);

// Ruta de Pagos
app.use('/api/payment', paymentRoutes);

// Ruta de Órdenes
if (orderRoutes) {
  app.use('/api/orders', orderRoutes);
} else {
  console.error("ERROR CRÍTICO: orderRoutes no se importó correctamente.");
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});