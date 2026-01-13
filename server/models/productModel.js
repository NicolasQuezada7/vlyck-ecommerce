import mongoose from 'mongoose';

// 1. ESQUEMA DE VARIANTES (Hijo)
const variantSchema = mongoose.Schema({
  color: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  // NUEVO: Aquí guardaremos las 3 fotos específicas del color (ej: fotos de la carcasa naranja)
  images: [{ type: String }],
});

// 2. ESQUEMA DE RESEÑAS (Hijo)
const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// 3. ESQUEMA DEL PRODUCTO (Padre)
const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    // IMPORTANTE: Mantenemos 'imageUrl' para que no se rompa lo antiguo
    imageUrl: { type: String, required: true },

    // NUEVO: Agregamos 'images' para la galería general del producto
    images: [{ type: String }],

    brand: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },

    basePrice: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },

    // Variantes (Colores + sus propias fotos)
    variants: [variantSchema],

    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;