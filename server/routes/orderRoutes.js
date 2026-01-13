import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
// Importamos las funciones del controlador
import { addOrderItems, getOrderById, getOrders } from '../controllers/orderController.js';

const router = express.Router();

// Definimos las rutas
router.route('/')
    .post(addOrderItems)
    .get(protect, admin, getOrders);
router.route('/:id').get(getOrderById);

// --- ESTA ES LA LÍNEA CRÍTICA QUE SUELE FALTAR ---
export default router;