import express from 'express';
const router = express.Router();
import { 
  addExpense, 
  getExpenses, 
  deleteExpense,
  addSupplier, 
  getSuppliers 
} from '../controllers/expenseController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// Rutas de Gastos
router.route('/')
    .post(protect, admin, addExpense)
    .get(protect, admin, getExpenses);

router.route('/:id')
    .delete(protect, admin, deleteExpense); // Nueva: Para borrar errores

// Rutas de Proveedores
router.route('/suppliers')
    .post(protect, admin, addSupplier)
    .get(protect, admin, getSuppliers);

export default router;