import asyncHandler from 'express-async-handler';
import Mockup from '../models/mockupModel.js';

// @desc    Obtener todos los moldes activos
// @route   GET /api/mockups
// @access  Public
const getMockups = asyncHandler(async (req, res) => {
  // Opcional: Si eres admin podrías querer ver incluso los inactivos, 
  // pero por ahora traigamos solo los activos para el customizer
  const mockups = await Mockup.find({ isActive: true });
  res.json(mockups);
});

// @desc    Crear un molde (Admin)
// @route   POST /api/mockups
// @access  Private/Admin
const createMockup = asyncHandler(async (req, res) => {
  const { name, brand, image, price } = req.body;
  
  const mockup = new Mockup({ 
    name, 
    brand, 
    image, 
    price: price || 8990 // Precio por defecto si no se envía
  });

  const createdMockup = await mockup.save();
  res.status(201).json(createdMockup);
});

// ---------------------------------------------------------
// 🆕 NUEVO: Actualizar un molde
// @desc    Update a mockup
// @route   PUT /api/mockups/:id
// @access  Private/Admin
const updateMockup = asyncHandler(async (req, res) => {
  const mockup = await Mockup.findById(req.params.id);

  if (mockup) {
    mockup.name = req.body.name || mockup.name;
    mockup.brand = req.body.brand || mockup.brand;
    mockup.image = req.body.image || mockup.image;
    mockup.price = req.body.price || mockup.price;
    // Permitimos desactivarlo sin borrarlo (Soft Delete)
    mockup.isActive = req.body.isActive !== undefined ? req.body.isActive : mockup.isActive;

    const updatedMockup = await mockup.save();
    res.json(updatedMockup);
  } else {
    res.status(404);
    throw new Error('Molde no encontrado');
  }
});

// 🆕 NUEVO: Eliminar un molde
// @desc    Delete a mockup
// @route   DELETE /api/mockups/:id
// @access  Private/Admin
const deleteMockup = asyncHandler(async (req, res) => {
  const mockup = await Mockup.findById(req.params.id);

  if (mockup) {
    await mockup.deleteOne();
    res.json({ message: 'Molde eliminado correctamente' });
  } else {
    res.status(404);
    throw new Error('Molde no encontrado');
  }
});

// ⚠️ No olvides exportar las nuevas funciones
export { 
    getMockups, 
    createMockup, 
    updateMockup, 
    deleteMockup 
};