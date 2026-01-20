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
    folder: 'vlyck-uploads', // Usamos una carpeta general para evitar conflictos
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'], // ✅ Agregamos PDF para las boletas
    resource_type: 'auto', // Auto-detectar si es imagen o PDF
  },
});

const upload = multer({ storage });

// 3. Ruta
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
      return res.status(400).send('No se subió ningún archivo.');
  }
  // Cloudinary devuelve la URL en req.file.path
  res.send(req.file.path);
});

export default router;