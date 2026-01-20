import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js'; 

// @desc    Create new order (WEB)
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    guestInfo
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    // --- 🛡️ VALIDACIÓN DE STOCK (WEB) ---
    for (const item of orderItems) {
      const productDb = await Product.findById(item.product);

      if (!productDb) {
        res.status(404);
        throw new Error(`El producto ${item.name} ya no existe.`);
      }

      const variantColor = item.selectedVariant?.color || item.variant?.color;

      if (variantColor) {
        const variantDb = productDb.variants.find(
          (v) => v.color.toLowerCase() === variantColor.toLowerCase()
        );

        if (!variantDb) {
            res.status(400);
            throw new Error(`La variante ${variantColor} de ${productDb.name} no está disponible.`);
        }

        if (variantDb.stock < item.qty) {
          res.status(400);
          throw new Error(`Lo sentimos, ${productDb.name} - ${variantColor} se acaba de agotar (Quedan ${variantDb.stock}).`);
        }

      } else {
        if (productDb.countInStock < item.qty) {
          res.status(400);
          throw new Error(`Lo sentimos, ${productDb.name} se acaba de agotar.`);
        }
      }
    }
    // ------------------------------------

    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x.product,
        _id: undefined,
      })),
      user: req.user?._id,
      guestInfo,
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

// @desc    Crear venta rápida (POS) - Solo Admin
// @route   POST /api/orders/pos
// @access  Private/Admin
const addPosOrder = asyncHandler(async (req, res) => {
  const { orderItems, totalPrice, paymentMethod } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No hay items en la orden POS');
  }

  // 1. DESCUENTO DE STOCK INMEDIATO
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    
    if (product) {
      // A) Es variante
      if (item.variant && item.variant.color) {
        const variant = product.variants.find(v => v.color === item.variant.color);
        if (variant) {
            if (variant.stock < item.qty) {
                res.status(400);
                throw new Error(`Stock insuficiente POS: ${product.name} ${variant.color}`);
            }
            variant.stock -= item.qty;
        }
      } else {
        // B) Es producto simple
        if (product.countInStock < item.qty) {
            res.status(400);
            throw new Error(`Stock insuficiente POS: ${product.name}`);
        }
        product.countInStock -= item.qty;
      }
      await product.save();
    }
  }

  // 2. CREAR ORDEN PAGADA
  const order = new Order({
    user: req.user._id, // El admin
    guestInfo: { name: 'Venta Presencial', email: 'pos@vlyck.com' },
    orderItems,
    shippingAddress: { address: 'Tienda Física', city: '-', region: '-', country: 'Chile' },
    paymentMethod: paymentMethod || 'Efectivo',
    paymentResult: { id: `POS-${Date.now()}`, status: 'completed', update_time: String(Date.now()) },
    itemsPrice: totalPrice,
    shippingPrice: 0,
    taxPrice: 0,
    totalPrice: totalPrice,
    isPaid: true,
    paidAt: Date.now(),
    isDelivered: true,
    deliveredAt: Date.now(),
  });

  const createdOrder = await order.save();
  res.status(201).json(createdOrder);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer?.email_address,
    };
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name');
  res.json(orders);
});

export {
  addOrderItems,
  addPosOrder, // <--- EXPORTADA
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
};