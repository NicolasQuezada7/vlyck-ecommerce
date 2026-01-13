import Order from '../models/orderModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (Updated for Guest)
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    guestInfo // <--- Importante: Recibimos los datos del invitado
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No hay items en la orden');
    return;
  } else {
    // Creamos la orden
    const order = new Order({
      orderItems,
      user: req.user ? req.user._id : undefined, // Si hay usuario logueado lo usa, si no, undefined
      guestInfo, // Guardamos los datos del invitado
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Orden no encontrada');
  }
});
const getOrders = asyncHandler(async (req, res) => {
  // Traemos todas las ordenes y además los datos del usuario asociado (id y nombre)
  const orders = await Order.find({}).populate('user', 'id name');
  res.json(orders);
});

export { addOrderItems, getOrderById, getOrders };