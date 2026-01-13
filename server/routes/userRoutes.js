import express from 'express';
import {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    deleteUser,
    getUserById,
    updateUser,
} from '../controllers/userController.js'; // <--- Importamos TODO lo que definiste en tu controlador
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta raíz: POST para registrar, GET para listar (solo admin)
router.route('/').post(registerUser).get(protect, admin, getUsers);

// Ruta login
router.post('/login', authUser);

// Ruta perfil
router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Rutas por ID (Admin)
router
    .route('/:id')
    .delete(protect, admin, deleteUser)
    .get(protect, admin, getUserById)
    .put(protect, admin, updateUser);

export default router;