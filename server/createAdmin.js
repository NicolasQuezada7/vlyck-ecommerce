import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const createAdmin = async () => {
  try {
    // 1. Borramos usuarios viejos por si acaso (Opcional)
    await User.deleteMany();

    // 2. Creamos el Admin
    const user = await User.create({
      name: 'Admin Vlyck',
      email: 'admin@vlyck.cl', // <--- ESTE SERÁ TU CORREO DE ACCESO
      password: '123456',      // <--- ESTA SERÁ TU CONTRASEÑA (Cámbiala si quieres)
      isAdmin: true,
    });

    console.log('¡Usuario Admin Creado con Éxito!');
    console.log(`Email: ${user.email}`);
    console.log(`Password: 123456`);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

createAdmin();