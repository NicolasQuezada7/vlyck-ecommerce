import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
// VERIFICA ESTA LÍNEA: debe coincidir con el nombre de tu archivo en la carpeta routes
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);

// --- AQUÍ ES DONDE DABA EL ERROR ---
// Si orderRoutes es undefined (porque falló el import), esto explota.
if (orderRoutes) {
  app.use('/api/orders', orderRoutes);
} else {
  console.error("ERROR CRÍTICO: orderRoutes no se importó correctamente. Revisa el archivo server/routes/orderRoutes.js");
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});