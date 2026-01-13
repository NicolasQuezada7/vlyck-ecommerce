import Product from '../models/productModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({});
  res.json(products);
});

// @desc    Fetch single product by slug
// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Producto no encontrado');
  }
});
// @desc    Fetch single product by ID (Admin)
// @route   GET /api/products/id/:id
// @access  Private/Admin
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Producto no encontrado (ID inválido)');
  }
});
// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({ message: 'Producto eliminado' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
// @desc    Create a product
// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const product = new Product({
    name: 'Producto Nuevo',
    basePrice: 0,
    user: req.user._id,
    imageUrl: 'https://placehold.co/600x400',
    brand: 'Genericos', // Obligatorio
    category: 'Accesorios', // Obligatorio
    countInStock: 0,
    numReviews: 0,
    // 👇 CAMBIO AQUÍ: Ponemos un texto real, no lo dejes vacío
    description: 'Descripción pendiente...',
    slug: 'producto-nuevo-' + Date.now(),
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    basePrice,
    description,
    images, // <--- AHORA RECIBIMOS ARRAY DE IMÁGENES
    brand,
    category,
    countInStock,
    slug,
    variants, // <--- Y LAS VARIANTES CON FOTOS
    imageUrl, // Mantenemos compatibilidad
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.basePrice = basePrice || product.basePrice;
    product.description = description || product.description;
    product.images = images || product.images; // <--- GUARDAMOS LA GALERÍA
    product.brand = brand || product.brand;
    product.category = category || product.category;
    product.countInStock = countInStock;
    product.slug = slug || product.slug;
    product.variants = variants || product.variants; // <--- GUARDAMOS LAS VARIANTES
    product.imageUrl = imageUrl || product.imageUrl;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// UNA SOLA EXPORTACIÓN AL FINAL CON TODAS LAS FUNCIONES
export {
  getProducts,
  getProductBySlug,
  deleteProduct,
  createProduct,
  updateProduct,
  getProductById
};