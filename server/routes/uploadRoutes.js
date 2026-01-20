import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// 1. Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configurar Almacenamiento
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vlyck-finanzas', // 📁 Mejor separado de los productos
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'], // ✅ Agregamos PDF
    resource_type: 'auto', // Auto-detectar si es imagen o documento raw
  },
});

const upload = multer({ storage });

// 3. Ruta
router.post('/', upload.single('image'), (req, res) => {
  // Retorna la URL segura
  res.send(req.file.path);
});

export default router;