import express from 'express';
import { createPreference } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Esta es la ruta que tu botón está buscando
router.post('/create-order', protect, createPreference);

export default router;