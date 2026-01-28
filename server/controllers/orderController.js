import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js'; 
// 1. IMPORTAR MERCADO PAGO
import { MercadoPagoConfig, Preference } from 'mercadopago';

// 2. CONFIGURAR CLIENTE DE MERCADO PAGO
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });

// @desc    Create new order (WEB & MANUAL)
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
    guestInfo,
    isCustomOrder,
    orderSource,
    depositAmount,
    remainingAmount,
    isPartiallyPaid,
    workflowStatus,
    isPaid
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No hay ítems en la orden');
  } else {
    // --- 🛡️ VALIDACIÓN DE STOCK ---
    for (const item of orderItems) {
      if (item.product) {
          const productDb = await Product.findById(item.product);
          if (productDb) {
            const variantColor = item.selectedVariant?.color || item.variant?.color;
            if (variantColor) {
                const variantDb = productDb.variants.find(
                  (v) => v.color.toLowerCase() === variantColor.toLowerCase()
                );
                if (variantDb && variantDb.stock < item.qty && orderSource === 'Web') {
                   res.status(400);
                   throw new Error(`Lo sentimos, ${productDb.name} - ${variantColor} se acaba de agotar.`);
                }
            } else {
                if (productDb.countInStock < item.qty && orderSource === 'Web') {
                  res.status(400);
                  throw new Error(`Lo sentimos, ${productDb.name} se acaba de agotar.`);
                }
            }
          }
      }
    }

    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x.product,
        _id: undefined,
      })),
      user: req.user ? req.user._id : null,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      guestInfo, 
      isCustomOrder,
      orderSource: orderSource || 'Web',
      depositAmount: depositAmount || 0,
      remainingAmount: remainingAmount || 0,
      isPartiallyPaid: isPartiallyPaid || false,
      workflowStatus: workflowStatus || 'Pendiente',
      isPaid: isPaid || false,
      paidAt: isPaid ? Date.now() : null
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  }
});

// @desc    Crear venta rápida (POS)
// @route   POST /api/orders/pos
// @access  Private/Admin
const addPosOrder = asyncHandler(async (req, res) => {
  const { orderItems, totalPrice, paymentMethod } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No hay items en la orden POS');
  }

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
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
        if (product.countInStock < item.qty) {
            res.status(400);
            throw new Error(`Stock insuficiente POS: ${product.name}`);
        }
        product.countInStock -= item.qty;
      }
      await product.save();
    }
  }

  const order = new Order({
    user: req.user._id,
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
      email_address: req.body.payer?.email_address || req.body.email_address,
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

// @desc    Obtener todas las ordenes (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'id name email')
    .sort({ createdAt: -1 }); 
  res.json(orders);
});

// @desc    Borrar orden y REVERTIR STOCK
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    for (const item of order.orderItems) {
      if(item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            if (item.variant && item.variant.color) {
              const variant = product.variants.find(v => v.color === item.variant.color);
              if (variant) variant.stock += item.qty;
            } else {
              product.countInStock += item.qty;
            }
            await product.save();
          }
      }
    }
    await order.deleteOne();
    res.json({ message: 'Orden eliminada y stock restaurado' });
  } else {
    res.status(404);
    throw new Error('Orden no encontrada');
  }
});

// @desc    Actualizar orden manual (Editar datos completos)
// @route   PUT /api/orders/:id/manual-update
// @access  Private/Admin
const updateManualOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.guestInfo.name = req.body.clientName || order.guestInfo.name;
    order.guestInfo.phone = req.body.phone || order.guestInfo.phone;
    order.guestInfo.instagramUser = req.body.instagramUser || order.guestInfo.instagramUser;
    
    if (req.body.shippingAddress) {
        order.shippingAddress = req.body.shippingAddress;
    }

    if (req.body.workflowStatus) {
        order.workflowStatus = req.body.workflowStatus;
    }

    if (req.body.orderItems && req.body.orderItems.length > 0) {
        order.orderItems = req.body.orderItems.map(item => ({
            ...item,
            _id: undefined
        }));
    }

    if (req.body.totalPrice !== undefined || req.body.depositAmount !== undefined) {
        if(req.body.itemsPrice !== undefined) order.itemsPrice = req.body.itemsPrice;
        if(req.body.shippingPrice !== undefined) order.shippingPrice = req.body.shippingPrice;
        if(req.body.totalPrice !== undefined) order.totalPrice = req.body.totalPrice;
        
        if (req.body.depositAmount !== undefined) {
            order.depositAmount = req.body.depositAmount;
        }
        
        order.remainingAmount = order.totalPrice - order.depositAmount;
        
        if (order.remainingAmount <= 0) {
            order.remainingAmount = 0;
            order.isPaid = true;
            order.isPartiallyPaid = false;
            if (!order.paidAt) order.paidAt = Date.now();
        } else {
            order.isPaid = false;
            order.isPartiallyPaid = (order.depositAmount > 0);
        }
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Orden no encontrada');
  }
});

// @desc    Registrar Pago del Saldo Restante
// @route   PUT /api/orders/:id/pay-balance
// @access  Private/Admin
const payOrderBalance = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    const amountPaid = Number(req.body.amount);
    order.depositAmount = (order.depositAmount || 0) + amountPaid;
    order.remainingAmount = order.totalPrice - order.depositAmount;
    
    if (order.remainingAmount <= 0) {
        order.remainingAmount = 0;
        order.isPaid = true;
        order.paidAt = Date.now();
        order.isPartiallyPaid = false;
        order.paymentMethod = req.body.paymentMethod || 'Efectivo/Transferencia';
    } else {
        order.isPartiallyPaid = true;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Orden no encontrada');
  }
});

// ---------------------------------------------------
// ⚠️ NUEVA FUNCIÓN: GENERAR PREFERENCIA MERCADO PAGO
// @desc    Create MP Preference for an Order
// @route   POST /api/orders/:id/create-preference
// @access  Public/Private
const createOrderPreference = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
  
    if (!order) {
      res.status(404);
      throw new Error('Orden no encontrada');
    }
  
    const preference = new Preference(client);
  
    const result = await preference.create({
      body: {
        items: order.orderItems.map((item) => ({
          id: item.product.toString(),
          title: item.name,
          quantity: Number(item.qty),
          unit_price: Number(item.price),
          currency_id: 'CLP',
        })),
        // Agregar el envío como item si existe
        ...(order.shippingPrice > 0 && {
            items: [
                ...order.orderItems.map((item) => ({
                    id: item.product.toString(),
                    title: item.name,
                    quantity: Number(item.qty),
                    unit_price: Number(item.price),
                    currency_id: 'CLP',
                })),
                {
                    id: 'shipping',
                    title: 'Costo de Envío',
                    quantity: 1,
                    unit_price: Number(order.shippingPrice),
                    currency_id: 'CLP'
                }
            ]
        }),
        payer: {
            email: order.guestInfo?.email || 'test_user_123@testuser.com', // Fallback si no hay email
            name: order.guestInfo?.name || 'Cliente'
        },
        back_urls: {
          // Cambia estas URLs a tu dominio de producción
          success: `https://vlyck-ecommerce-production.up.railway.app/payment-success`,
          failure: `https://vlyck-ecommerce-production.up.railway.app/cart`,
          pending: `https://vlyck-ecommerce-production.up.railway.app/cart`,
        },
        auto_return: 'approved',
        external_reference: order._id.toString(), // <--- VITAL PARA SABER QUÉ ORDEN SE PAGÓ
      },
    });
  
    res.json({ preferenceId: result.id });
});

export {
  addOrderItems,
  addPosOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  deleteOrder,
  updateManualOrder,
  payOrderBalance,
  createOrderPreference // <--- Exportada
};