import mongoose from 'mongoose';

const supplierSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rut: { type: String },
    contactName: { type: String },
    email: { type: String },
    phone: { type: String },
    category: { type: String },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Supplier = mongoose.model('Supplier', supplierSchema);

// 👇 ESTA ES LA LÍNEA QUE TE FALTA Y ESTÁ BOTANDO EL SERVIDOR
export default Supplier;