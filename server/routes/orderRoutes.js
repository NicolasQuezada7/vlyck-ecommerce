import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
// Importamos TODAS las funciones del controlador
import { 
    addOrderItems, 
    getOrderById, 
    updateOrderToPaid, 
    updateOrderToDelivered,
    getMyOrders, // <--- ESTA ES LA QUE TE FALTA IMPORTAR
    getOrders 
} from '../controllers/orderController.js';

const router = express.Router();

// 1. Ruta Raíz
router.route('/')
    .post(protect, addOrderItems) // Agregué 'protect' para que solo usuarios logueados compren
    .get(protect, admin, getOrders);

// 2. 👇 RUTA CRÍTICA PARA EL PERFIL (Debe ir ANTES de /:id)
router.route('/myorders').get(protect, getMyOrders);

// 3. Rutas con ID (Detalles, Pagar, Entregar)
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

export default router;