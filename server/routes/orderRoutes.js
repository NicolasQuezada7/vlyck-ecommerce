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

// Ruta POS
router.route('/pos').post(protect, admin, addPosOrder);

// --- 🛠️ AQUÍ ESTABA EL ERROR ---
// Antes tenías todo dentro de .get(). Ahora separamos .get() y .delete()
router.route('/:id')
    .get(protect, getOrderById)              // Para VER la orden
    .delete(protect, admin, deleteOrder);    // Para BORRAR la orden (Solución al 404)

// Rutas de acciones específicas
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/manual-update').put(protect, admin, updateManualOrder);
router.route('/:id/pay-balance').put(protect, admin, payOrderBalance);

export default router;