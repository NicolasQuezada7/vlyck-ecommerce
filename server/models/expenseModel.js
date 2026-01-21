import mongoose from 'mongoose';

const expenseSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { 
      type: String, 
      required: true, 
      enum: ['Insumos', 'Publicidad', 'Envíos', 'Otros'] // ✅ Nuevas Categorías
    },
    date: { type: Date, default: Date.now },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    supplierName: { type: String },
    
    // ✅ CAMBIO: Array de Strings para múltiples archivos
    attachments: [{ type: String }], 
    
    // Mantenemos invoiceUrl por compatibilidad con datos viejos (opcional)
    invoiceUrl: { type: String }, 
  },
  { timestamps: true }
);

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;