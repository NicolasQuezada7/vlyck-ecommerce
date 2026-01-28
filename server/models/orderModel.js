import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'User' },
  
  guestInfo: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    instagramUser: { type: String }
  },

  orderItems: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
      
      // Datos extra que ya tenías
      category: { type: String }, 
      customInstructions: { type: String }, 
      originalLayers: { type: Array },

      // ⚠️ NUEVO: IMPORTANTE PARA EL STOCK
      variant: { 
         color: { type: String },
         model: { type: String }
      }
    }
  ],

  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    region: { type: String }, // ⚠️ NUEVO: Faltaba este campo
    postalCode: { type: String },
    country: { type: String, required: true },
  },

  paymentMethod: { type: String, required: true, default: 'Manual' },
  
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String },
  },

  // Campos de lógica de negocio y precios
  isCustomOrder: { type: Boolean, default: false },
  orderSource: { type: String, default: 'Web' }, 
  workflowStatus: { type: String, default: 'Pendiente' },
  
  itemsPrice: { type: Number, default: 0.0 },
  taxPrice: { type: Number, default: 0.0 },
  shippingPrice: { type: Number, default: 0.0 },
  totalPrice: { type: Number, required: true, default: 0.0 },
  
  // Abonos y saldos
  depositAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  isPartiallyPaid: { type: Boolean, default: false },
  
  // Estados finales
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, required: true, default: false },
  deliveredAt: { type: Date },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);
export default Order;