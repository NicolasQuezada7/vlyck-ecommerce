import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js'; // <--- IMPORTANTE: Necesitamos consultar los productos

// @desc    Create new order
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
    guestInfo // Por si envías datos de invitado
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
    return;
  } else {

    // --- 🛡️ INICIO BLOQUE DE SEGURIDAD DE STOCK ---
    // Recorremos los items UNO POR UNO para verificar disponibilidad real en DB
    for (const item of orderItems) {
      // 1. Buscamos el producto en la Base de Datos
      const productDb = await Product.findById(item.product);

      if (!productDb) {
        res.status(404);
        throw new Error(`El producto ${item.name} ya no existe.`);
      }

      // 2. Verificamos si es una compra con VARIANTE (Color)
      // El frontend envía 'selectedVariant' o 'variant'
      const variantColor = item.selectedVariant?.color || item.variant?.color;

      if (variantColor) {
        // Buscamos esa variante específica en la DB (ignorando mayúsculas/minúsculas)
        const variantDb = productDb.variants.find(
          (v) => v.color.toLowerCase() === variantColor.toLowerCase()
        );

        // Si la variante no existe en la DB (error raro de sincronización)
        if (!variantDb) {
           res.status(400);
           throw new Error(`La variante ${variantColor} de ${productDb.name} no está disponible.`);
        }

        // VALIDACIÓN FINAL: ¿Hay suficiente stock de este color?
        if (variantDb.stock < item.qty) {
          res.status(400);
          throw new Error(`Lo sentimos, ${productDb.name} - ${variantColor} se acaba de agotar (Quedan ${variantDb.stock}).`);
        }

      } else {
        // 3. Si es un producto SIN variantes (Estándar)
        if (productDb.countInStock < item.qty) {
          res.status(400);
          throw new Error(`Lo sentimos, ${productDb.name} se acaba de agotar.`);
        }
      }
      
      // NOTA: Aquí NO descontamos el stock todavía (Reserva Blanda).
      // El stock se descontará cuando se confirme el pago en 'updateOrderToPaid'.
    }
    // --- 🛡️ FIN BLOQUE DE SEGURIDAD ---


    // Si el código llega aquí, hay stock para todos. Creamos la orden.
    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x.product,
        _id: undefined, // Quitamos el ID local del carrito para que Mongo genere uno nuevo si es necesario
      })),
      user: req.user?._id, // Usamos '?' por si en el futuro permites compras sin login
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
    
    // --- AQUÍ DEBERÍAS DESCONTAR EL STOCK (OPCIONAL) ---
    // Si quieres que el stock baje SOLO cuando pagan, aquí deberías
    // llamar a una función que reste las cantidades a los productos.
    
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
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
};