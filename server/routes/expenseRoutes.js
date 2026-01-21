import express from 'express';
const router = express.Router();
import { 
  addExpense, 
  getExpenses, 
  deleteExpense,
  addSupplier, 
  getSuppliers,
  updateExpense,
  updateSupplier,
  deleteSupplier     
} from '../controllers/expenseController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// --- GASTOS ---
router.route('/')
    .post(protect, admin, addExpense)
    .get(protect, admin, getExpenses);

router.route('/:id')
    .put(protect, admin, updateExpense)     // ✅ Editar Gasto
    .delete(protect, admin, deleteExpense); // ✅ Borrar Gasto

// --- PROVEEDORES ---
router.route('/suppliers')
    .post(protect, admin, addSupplier)
    .get(protect, admin, getSuppliers);

// 👇 ESTO ERA LO QUE FALTABA PARA QUE FUNCIONE EL EDITAR/BORRAR PROVEEDOR
router.route('/suppliers/:id')
    .put(protect, admin, updateSupplier)    // ✅ Editar Proveedor
    .delete(protect, admin, deleteSupplier); // ✅ Borrar Proveedor

export default router;