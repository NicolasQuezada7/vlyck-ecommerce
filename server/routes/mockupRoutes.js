import express from 'express';
import { 
    getMockups, 
    createMockup, 
    updateMockup, // 👈 Importar
    deleteMockup  // 👈 Importar
} from '../controllers/mockupController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta raíz: Ver todos (Público) y Crear (Admin)
router.route('/')
  .get(getMockups)
  .post(protect, admin, createMockup);

// 🆕 NUEVAS RUTAS POR ID:
// Editar y Borrar (Solo Admin)
router.route('/:id')
  .put(protect, admin, updateMockup)
  .delete(protect, admin, deleteMockup);

export default router;