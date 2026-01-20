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
      enum: ['Inventario', 'Marketing', 'Logística', 'Servicios', 'Impuestos', 'Otros'] 
    },
    date: { type: Date, default: Date.now },
    
    // ✅ CAMBIO 1: Relación real con Proveedor (opcional, por si es un gasto casual)
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    // ✅ CAMBIO 2: Campo de respaldo (string para buscar rápido si no hay proveedor creado)
    supplierName: { type: String },

    // ✅ CAMBIO 3: URL del archivo (PDF o Imagen)
    invoiceUrl: { type: String }, 
    
    status: { type: String, default: 'Pagado', enum: ['Pagado', 'Pendiente'] } // Para deudas
  },
  { timestamps: true }
);

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;