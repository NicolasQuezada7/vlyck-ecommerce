import asyncHandler from 'express-async-handler';
import Expense from '../models/expenseModel.js';
import Supplier from '../models/supplierModel.js';

// --- GASTOS ---

// @desc    Crear gasto
// @route   POST /api/expenses
const addExpense = asyncHandler(async (req, res) => {
  // Recibimos 'attachments' (Array) en lugar de 'invoiceUrl'
  const { description, amount, category, date, supplier, supplierName, attachments } = req.body;

  const expense = new Expense({
    user: req.user._id,
    description,
    amount,
    category,
    date: date || Date.now(),
    supplier: supplier || null,
    supplierName: supplierName || 'Varios',
    attachments: attachments || [] // ✅ Guardamos el array
  });

  const createdExpense = await expense.save();
  res.status(201).json(createdExpense);
});

// @desc    Obtener gastos con FILTROS
// @route   GET /api/expenses?from=2023-01-01&to=2023-01-31&supplier=ID
const getExpenses = asyncHandler(async (req, res) => {
  const { from, to, supplier, category } = req.query;

  // Construir filtro dinámico
  let filter = {};

  // 1. Filtro de Fechas
  if (from && to) {
    filter.date = {
      $gte: new Date(from),
      $lte: new Date(to)
    };
  }

  // 2. Filtro de Proveedor
  if (supplier) {
    filter.supplier = supplier;
  }

  // 3. Filtro de Categoría
  if (category && category !== 'Todas') {
    filter.category = category;
  }

  const expenses = await Expense.find(filter)
    .populate('supplier', 'name rut') // Traer nombre del proveedor
    .sort({ date: -1 });

  res.json(expenses);
});

// @desc    Borrar gasto
// @route   DELETE /api/expenses/:id
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (expense) {
    await expense.deleteOne();
    res.json({ message: 'Gasto eliminado' });
  } else {
    res.status(404);
    throw new Error('Gasto no encontrado');
  }
});

// --- PROVEEDORES (SUPPLIERS) ---

// @desc    Crear proveedor
// @route   POST /api/expenses/suppliers
const addSupplier = asyncHandler(async (req, res) => {
  const { name, rut, contactName, email, phone, category } = req.body;
  const supplier = new Supplier({
    user: req.user._id,
    name, rut, contactName, email, phone, category
  });
  const createdSupplier = await supplier.save();
  res.status(201).json(createdSupplier);
});

// @desc    Obtener proveedores
// @route   GET /api/expenses/suppliers
const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({}).sort({ name: 1 });
  res.json(suppliers);
});
// ... imports ...

// --- GASTOS ---

// @desc    Actualizar gasto
// @route   PUT /api/expenses/:id
const updateExpense = asyncHandler(async (req, res) => {
  const { description, amount, category, supplier, supplierName, date, attachments } = req.body;
  const expense = await Expense.findById(req.params.id);

  if (expense) {
    expense.description = description || expense.description;
    expense.amount = amount || expense.amount;
    expense.category = category || expense.category;
    expense.date = date || expense.date;
    expense.supplier = supplier || expense.supplier;
    expense.supplierName = supplierName || expense.supplierName;
    
    // ✅ Reemplazamos el array completo con lo que manda el frontend (que ya gestionó borrados/agregados)
    expense.attachments = attachments || expense.attachments;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } else {
    res.status(404);
    throw new Error('Gasto no encontrado');
  }
});

// (deleteExpense ya lo tenías, asegúrate que esté exportado)

// --- PROVEEDORES ---

// @desc    Actualizar proveedor
// @route   PUT /api/expenses/suppliers/:id
const updateSupplier = asyncHandler(async (req, res) => {
  const { name, rut, contactName, email, phone, category } = req.body;
  const supplier = await Supplier.findById(req.params.id);

  if (supplier) {
    supplier.name = name || supplier.name;
    supplier.rut = rut || supplier.rut;
    supplier.contactName = contactName || supplier.contactName;
    supplier.email = email || supplier.email;
    supplier.phone = phone || supplier.phone;
    supplier.category = category || supplier.category;

    const updatedSupplier = await supplier.save();
    res.json(updatedSupplier);
  } else {
    res.status(404);
    throw new Error('Proveedor no encontrado');
  }
});

// @desc    Borrar proveedor
// @route   DELETE /api/expenses/suppliers/:id
const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (supplier) {
    await supplier.deleteOne();
    res.json({ message: 'Proveedor eliminado' });
  } else {
    res.status(404);
    throw new Error('Proveedor no encontrado');
  }
});

export { 
  addExpense, 
  getExpenses, 
  deleteExpense,
  updateExpense, // <--- NUEVO
  addSupplier, 
  getSuppliers,
  updateSupplier, // <--- NUEVO
  deleteSupplier  // <--- NUEVO
};
