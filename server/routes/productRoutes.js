import express from 'express';
const router = express.Router();
import {
  getProducts,
  getProductBySlug,
  getProductById, // <--- IMPORTAR
  deleteProduct,
  updateProduct,
  createProduct,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// 1. Ruta Raíz
router.route('/')
    .get(getProducts)
    .post(protect, admin, createProduct);

// 2. NUEVA RUTA ESPECÍFICA PARA ID (Debe ir ANTES de /:slug)
// Esto soluciona el conflicto. El admin usará esta ruta.
router.route('/id/:id').get(protect, admin, getProductById); 

// 3. Ruta para el público (Slug)
router.route('/:slug').get(getProductBySlug);

// 4. Rutas de Edición/Borrado (Usan ID pero son PUT/DELETE, no chocan)
router.route('/:id')
    .delete(protect, admin, deleteProduct)
    .put(protect, admin, updateProduct);

export default router;