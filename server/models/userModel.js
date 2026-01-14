import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },

    // --- 👇 NUEVO: CAMPOS PARA EL PERFIL ---
    phone: { type: String },
    shippingAddress: {
      address: { type: String }, // Calle y número
      city: { type: String },    // Ciudad
      comuna: { type: String },  // Comuna
      region: { type: String }   // Región (opcional)
    }
    // --------------------------------------
  },
  { timestamps: true }
);

// Método para comparar contraseñas al loguearse
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Antes de guardar, encriptamos la contraseña automáticamente
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;