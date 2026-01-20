import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js'; // ✅ Importante
import paymentRoutes from './routes/paymentRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js'; // ✅ Importante

dotenv.config();
connectDB();

const app = express();

// --- LISTA DE DOMINIOS PERMITIDOS ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "https://vlyck.cl",
  "https://www.vlyck.cl",
  "https://vlyck-front.netlify.app",
  process.env.FRONTEND_URL
];

// --- CONFIGURACIÓN CORS (Blindada) ---
app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como Postman) o si el origen está en la lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("🚫 Bloqueado por CORS:", origin);
      callback(new Error('No permitido por la política CORS'));
    }
  },
  credentials: true,
  // 👇 ESTO ES LO QUE SOLUCIONA EL ERROR "PREFLIGHT"
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- RUTAS ---
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes); // ✅ Ruta de subida (Cloudinary)
app.use('/api/payment', paymentRoutes);
app.use('/api/expenses', expenseRoutes); // ✅ Ruta de finanzas

if (orderRoutes) {
  app.use('/api/orders', orderRoutes);
} else {
  console.error("ERROR CRÍTICO: orderRoutes no se importó correctamente.");
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});