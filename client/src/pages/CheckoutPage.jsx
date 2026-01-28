import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart(); 
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  
  // --- LÓGICA DE PRECIOS SEGURA (Anti-NaN) ---
  const getPrice = (item) => {
    const val = item.price !== undefined ? item.price : item.basePrice;
    return Number(val) || 0;
  };

  // Calculamos subtotal
  const subtotal = cart.reduce((acc, item) => {
      return acc + (getPrice(item) * (Number(item.quantity) || 0));
  }, 0);

  const shippingCost = 3990;
  const finalTotal = subtotal + shippingCost;

  // --- ESTADOS ---
  const [formData, setFormData] = useState({
    email: userInfo?.email || '',
    name: userInfo?.name || '',
    lastname: '',
    address: userInfo?.shippingAddress?.address || '',
    region: '',
    city: userInfo?.shippingAddress?.city || ''
  });

  const [paymentMethod, setPaymentMethod] = useState('MercadoPago'); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      if (cart.length === 0) navigate('/cart');
  }, [cart, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Preparar Items (Asegurando números y ID)
      const orderItems = cart.map(item => ({
          name: item.name,
          qty: Number(item.quantity),
          image: item.image || item.imageUrl || (item.selectedVariant?.images?.[0]) || 'https://placehold.co/300',
          price: getPrice(item),
          // Usamos item._id o item.product por seguridad
          product: item._id || item.product, 
          variant: item.selectedVariant || {}
      }));

      // 2. Preparar Payload Completo
      const orderData = {
        orderItems,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          region: formData.region,
          country: 'Chile'
        },
        // ⚠️ CLAVE: Si no hay usuario logueado, mandamos guestInfo
        guestInfo: userInfo ? null : {
            name: `${formData.name} ${formData.lastname}`,
            email: formData.email
        },
        paymentMethod: paymentMethod,
        itemsPrice: subtotal,
        taxPrice: 0,
        shippingPrice: shippingCost,
        totalPrice: finalTotal,
      };

      const config = { 
        headers: { 
            'Content-Type': 'application/json',
            // Solo mandamos token si existe
            ...(userInfo && { Authorization: `Bearer ${userInfo.token}` }) 
        } 
      };

      const { data } = await axios.post(`/api/orders`, orderData, config);
      
      clearCart();
      // Redirigimos a la página de éxito donde se paga
      navigate(`/order/${data._id}`); 
      
    } catch (error) {
      console.error("Error checkout:", error);
      alert(`Error: ${error.response?.data?.message || "Hubo un problema al crear la orden"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#050505] text-white font-sans antialiased min-h-screen flex flex-col pt-32 pb-20">
      
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* HEADER PROGRESO */}
        <div className="w-full flex justify-center items-center gap-3 md:gap-6 text-sm font-medium mb-10">
          <Link to="/cart" className="flex items-center gap-2 text-gray-500 hover:text-white transition">
            <span className="material-symbols-outlined text-lg">shopping_cart</span> 1. Carrito
          </Link>
          <div className="h-px w-8 md:w-16 bg-white/10"></div>
          <div className="flex items-center gap-2 text-vlyck-lime font-bold">
            <span className="material-symbols-outlined text-lg">feed</span> 2. Datos
          </div>
          <div className="h-px w-8 md:w-16 bg-white/10"></div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="material-symbols-outlined text-lg">credit_card</span> 3. Pago
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* FORMULARIO */}
          <div className="w-full lg:w-[60%]">
            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Datos de Envío</h2>
            
            <div className="grid grid-cols-2 gap-4 bg-[#111] p-6 md:p-8 rounded-2xl border border-white/10 shadow-xl">
                <div className="col-span-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-1 block">Email</label>
                    <input required name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white focus:border-vlyck-lime outline-none transition-colors font-medium" type="email"/>
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-1 block">Nombre</label>
                    <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white focus:border-vlyck-lime outline-none transition-colors font-medium" type="text"/>
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-1 block">Apellido</label>
                    <input required name="lastname" value={formData.lastname} onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white focus:border-vlyck-lime outline-none transition-colors font-medium" type="text"/>
                </div>
                <div className="col-span-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-1 block">Dirección de Entrega</label>
                    <input required name="address" value={formData.address} onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white focus:border-vlyck-lime outline-none transition-colors font-medium" placeholder="Calle, número, depto..." type="text"/>
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-1 block">Región</label>
                    <select name="region" onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white focus:border-vlyck-lime outline-none transition-colors font-medium cursor-pointer appearance-none">
                        <option value="">Seleccionar</option>
                        <option value="Metropolitana">Metropolitana</option>
                        <option value="Valparaiso">Valparaíso</option>
                        <option value="Biobio">Biobío</option>
                        <option value="Ñuble">Ñuble</option>
                    </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-1 block">Ciudad / Comuna</label>
                    <input required name="city" value={formData.city} onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white focus:border-vlyck-lime outline-none transition-colors font-medium" type="text"/>
                </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-6 mt-10 uppercase tracking-tight">Método de Pago</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setPaymentMethod('MercadoPago')} className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 relative overflow-hidden group ${paymentMethod === 'MercadoPago' ? 'border-vlyck-lime bg-vlyck-lime/5' : 'border-white/10 bg-[#111] hover:border-white/30'}`}>
                    <div className="flex justify-between items-center relative z-10">
                        <span className="font-bold text-white uppercase tracking-wider">Mercado Pago</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'MercadoPago' ? 'border-vlyck-lime' : 'border-gray-500'}`}>
                            {paymentMethod === 'MercadoPago' && <div className="w-3 h-3 bg-vlyck-lime rounded-full"></div>}
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 relative z-10">Tarjetas de Crédito, Débito y Transferencia.</p>
                </div>
            </div>
          </div>

          {/* RESUMEN FINAL */}
          <aside className="w-full lg:w-[40%] bg-[#111] p-8 rounded-2xl border border-white/10 sticky top-32 shadow-2xl">
             <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Confirmación</h3>
             
             <div className="space-y-4 mb-8">
                {cart.slice(0, 3).map(item => (
                    <div key={item.cartItemId || item._id} className="flex justify-between text-sm text-gray-400">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-mono text-white">${(getPrice(item) * item.quantity).toLocaleString('es-CL')}</span>
                    </div>
                ))}
                {cart.length > 3 && <p className="text-xs text-gray-600 text-center pt-2">... y {cart.length - 3} más</p>}
             </div>

             <div className="space-y-3 mb-6 pb-6 border-b border-white/10 border-t border-white/10 py-6 text-sm">
                <div className="flex justify-between text-gray-400">
                    <span>Productos</span>
                    <span className="font-mono text-white">${subtotal.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                    <span>Envío</span>
                    <span className="font-mono text-white">${shippingCost.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-white text-xl font-black pt-4 uppercase">
                    <span>Total a Pagar</span>
                    <span className="text-vlyck-lime font-mono">${finalTotal.toLocaleString('es-CL')}</span>
                </div>
             </div>
             
             <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 bg-vlyck-gradient text-black font-black uppercase rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(167,255,45,0.4)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3"
             >
                {loading ? (
                    <>Procesando <span className="material-symbols-outlined animate-spin">progress_activity</span></>
                ) : (
                    <>Confirmar y Pagar <span className="material-symbols-outlined font-bold">arrow_forward</span></>
                )}
             </button>
          </aside>

        </form>
      </main>
    </div>
  );
}