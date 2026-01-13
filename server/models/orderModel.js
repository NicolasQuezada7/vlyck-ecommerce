import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
  // Usuario es OPCIONAL (para permitir invitados)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: false, 
    ref: 'User',
  },
  // Agregamos info del cliente para cuando es invitado
  guestInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  orderItems: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
      },
      // Variantes opcionales
      variant: {
        model: String,
        color: String
      }
    },
  ],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    region: { type: String, required: true }, // Agregamos Región
    country: { type: String, required: true, default: 'Chile' },
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentResult: { // Datos de Webpay/Stripe futuro
    id: String,
    status: String,
    update_time: String,
    email_address: String,
  },
  itemsPrice: { type: Number, required: true, default: 0.0 },
  taxPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  totalPrice: { type: Number, required: true, default: 0.0 },
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, required: true, default: false },
  deliveredAt: { type: Date },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;