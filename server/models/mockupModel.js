import mongoose from 'mongoose';

const mockupSchema = mongoose.Schema({
  name: { type: String, required: true }, // Ej: "iPhone 13"
  brand: { type: String, required: true }, // Ej: "Apple"
  image: { type: String, required: true }, // URL de Cloudinary
  price: { type: Number, default: 8990 },  // Precio específico
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
});

const Mockup = mongoose.model('Mockup', mockupSchema);
export default Mockup;