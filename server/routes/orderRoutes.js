import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
    addOrderItems, 
    getOrderById, 
    updateOrderToPaid, 
    updateOrderToDelivered,
    getMyOrders, 
    getOrders,
    addPosOrder,
    deleteOrder,
    updateManualOrder,
    payOrderBalance 
} from '../controllers/orderController.js';

const router = express.Router();

// Rutas Raíz
router.route('/')
    .post(protect, addOrderItems) 
    .get(protect, admin, getOrders);

// Ruta Mis Ordenes
router.route('/myorders').get(protect, getMyOrders);

// 👇 RUTA POS (Nueva)
router.route('/pos').post(protect, admin, addPosOrder);

// Rutas con ID (Siempre al final para no chocar)
router.route('/:id').get(protect, getOrderById, deleteOrder);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/manual-update').put(protect, admin, updateManualOrder);
router.route('/:id/pay-balance').put(protect, admin, payOrderBalance);
router.route('/:id/manual-update').put(protect, admin, updateManualOrder);
router.route('/:id/pay-balance').put(protect, admin, payOrderBalance);
export default router;