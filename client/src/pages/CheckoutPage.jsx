import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  
  // Estado del Formulario
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    lastname: '',
    address: '',
    region: '',
    city: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('webpay'); // 'webpay' o 'transfer'
  const [loading, setLoading] = useState(false);

  // Costo de envío fijo (podríamos hacerlo dinámico luego)
  const shippingCost = 3990;
  const finalTotal = totalPrice + shippingCost;

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ENVIAR PEDIDO AL BACKEND
  // ... imports y estados anteriores ...

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Preparamos los datos
      const orderData = {
        orderItems: cart.map(item => ({
          name: item.name,
          qty: item.quantity,
          image: item.imageUrl || 'https://placehold.co/300',
          price: item.basePrice,
          product: item._id,
          variant: item.selectedVariant || {}
        })),
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          region: formData.region,
          country: 'Chile'
        },
        guestInfo: {
          name: `${formData.name} ${formData.lastname}`,
          email: formData.email
        },
        paymentMethod: paymentMethod,
        itemsPrice: totalPrice,
        taxPrice: 0,
        shippingPrice: shippingCost,
        totalPrice: finalTotal,
      };

      // 2. Enviamos al backend
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/orders`, orderData);
      
      console.log("Orden Creada:", data);
      
      // 3. Limpiamos carrito
      clearCart();

      // 4. REDIRECCIÓN CORRECTA (Aquí estaba el problema)
      // Usamos las comillas invertidas ` ` para poner el ID
      navigate(`/order/${data._id}`); 
      
    } catch (error) {
      console.error("Error detallado:", error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.message || "Revisa la consola"}`);
    } finally {
      setLoading(false);
    }
  };

  // ... resto del componente ...

  if (cart.length === 0) {
    return <div className="text-white text-center pt-40">No tienes items para pagar. <Link to="/" className="text-primary">Volver</Link></div>;
  }

  return (
    <div className="bg-background-dark text-white font-sans antialiased min-h-screen flex flex-col pt-24">
      
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
        
        {/* Barra de Progreso */}
        <div className="w-full py-8 flex justify-center items-center gap-4 text-sm font-medium mb-8">
          <Link to="/cart" className="text-gray-500 hover:text-white transition">1. Carrito</Link>
          <div className="h-px w-12 bg-white/10"></div>
          <span className="text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">person</span>
            2. Datos y Pago
          </span>
          <div className="h-px w-12 bg-primary/30"></div>
          <span className="text-white font-bold">3. Confirmación</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <div className="w-full lg:w-[60%] flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-6">Información de Envío</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold pl-1">Email</label>
                <input required name="email" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-vlyck-cyan focus:ring-1 focus:ring-vlyck-cyan outline-none transition-all placeholder-gray-600" placeholder="ejemplo@correo.com" type="email"/>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold pl-1">Nombre</label>
                <input required name="name" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-vlyck-cyan focus:ring-1 focus:ring-vlyck-cyan outline-none transition-all placeholder-gray-600" placeholder="Tu nombre" type="text"/>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold pl-1">Apellido</label>
                <input required name="lastname" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-vlyck-cyan focus:ring-1 focus:ring-vlyck-cyan outline-none transition-all placeholder-gray-600" placeholder="Tu apellido" type="text"/>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold pl-1">Dirección</label>
                <input required name="address" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-vlyck-cyan focus:ring-1 focus:ring-vlyck-cyan outline-none transition-all placeholder-gray-600" placeholder="Calle, número, depto..." type="text"/>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold pl-1">Región</label>
                <div className="relative">
                  <select name="region" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white appearance-none focus:border-vlyck-cyan outline-none cursor-pointer">
                    <option value="">Selecciona una región</option>
                    <option value="Metropolitana">Región Metropolitana</option>
                    <option value="Valparaiso">Valparaíso</option>
                    <option value="Biobio">Biobío</option>
                    <option value="Araucania">Araucanía</option>
                  </select>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold pl-1">Comuna / Ciudad</label>
                <input required name="city" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-vlyck-cyan focus:ring-1 focus:ring-vlyck-cyan outline-none transition-all placeholder-gray-600" placeholder="Ej: Providencia" type="text"/>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-6 pt-6 border-t border-white/5">Método de Pago</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opción WebPay */}
              <div 
                onClick={() => setPaymentMethod('webpay')}
                className={`p-6 rounded-2xl flex flex-col items-center gap-3 cursor-pointer relative overflow-hidden group transition-all ${paymentMethod === 'webpay' ? 'border-2 border-primary bg-white/5 shadow-[0_0_15px_rgba(167,255,45,0.2)]' : 'border border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <span className={`material-symbols-outlined text-4xl relative z-10 ${paymentMethod === 'webpay' ? 'text-primary' : 'text-gray-400'}`}>credit_card</span>
                <span className={`font-bold relative z-10 ${paymentMethod === 'webpay' ? 'text-white' : 'text-gray-400'}`}>WebPay / Crédito</span>
                {paymentMethod === 'webpay' && (
                    <div className="absolute top-2 right-2 text-primary"><span className="material-symbols-outlined text-lg">check_circle</span></div>
                )}
              </div>

              {/* Opción Transferencia */}
              <div 
                onClick={() => setPaymentMethod('transfer')}
                className={`p-6 rounded-2xl flex flex-col items-center gap-3 cursor-pointer relative overflow-hidden group transition-all ${paymentMethod === 'transfer' ? 'border-2 border-primary bg-white/5 shadow-[0_0_15px_rgba(167,255,45,0.2)]' : 'border border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <span className={`material-symbols-outlined text-4xl relative z-10 ${paymentMethod === 'transfer' ? 'text-primary' : 'text-gray-400'}`}>account_balance</span>
                <span className={`font-medium relative z-10 ${paymentMethod === 'transfer' ? 'text-white' : 'text-gray-400'}`}>Transferencia</span>
                {paymentMethod === 'transfer' && (
                    <div className="absolute top-2 right-2 text-primary"><span className="material-symbols-outlined text-lg">check_circle</span></div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: RESUMEN (Sticky) */}
          <aside className="w-full lg:w-[40%]">
            <div className="bg-[#111111] p-8 rounded-2xl border border-white/10 h-fit sticky top-28 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Resumen del Pedido</h3>
              
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map(item => (
                    <div key={item.cartItemId} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                        <div className="w-12 h-12 bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden border border-white/10 flex items-center justify-center">
                            {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />}
                        </div>
                        <div className="flex-grow">
                            <p className="text-sm text-white font-medium truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">x{item.quantity} {item.selectedVariant ? `(${item.selectedVariant.model})` : ''}</p>
                        </div>
                        <span className="text-sm font-bold text-white">${(item.basePrice * item.quantity).toLocaleString('es-CL')}</span>
                    </div>
                ))}
              </div>

              <div className="space-y-3 py-6 border-t border-white/10">
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Subtotal</span>
                  <span>${totalPrice.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Envío</span>
                  <span className="text-white">${shippingCost.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-white text-xl font-bold mt-4 pt-4 border-t border-white/5 items-end">
                  <span className="text-base font-normal text-gray-400">Total Final</span>
                  <span className="text-2xl text-vlyck-lime">${finalTotal.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-vlyck-gradient text-black font-extrabold text-lg mt-2 hover:shadow-[0_0_25px_rgba(45,255,255,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
              
              <div className="flex justify-center items-center gap-2 mt-4 text-xs text-gray-500">
                <span className="material-symbols-outlined text-sm">lock</span>
                Pagos encriptados y seguros
              </div>
            </div>
          </aside>
        
        </form>
      </main>
    </div>
  );
}