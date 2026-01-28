import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { initMercadoPago } from '@mercadopago/sdk-react';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart(); 
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  
  // Inicializar MP
  useEffect(() => {
    if (import.meta.env.VITE_MP_PUBLIC_KEY) {
        initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: 'es-CL' });
    }
  }, []);

  // --- LÓGICA DE PRECIOS SEGURA ---
  const getPrice = (item) => {
    const val = item.price !== undefined ? item.price : item.basePrice;
    return Number(val) || 0;
  };

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

  // Solo queda webpay como opción única
  const [paymentMethod, setPaymentMethod] = useState('webpay'); 
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
      const config = { headers: { 
          'Content-Type': 'application/json',
          ...(userInfo && { Authorization: `Bearer ${userInfo.token}` }) 
      }};

      // 1. Preparar Items
     // 1. Preparar Items (CORREGIDO PARA LIMPIAR ID)
      const orderItems = cart.map(item => {
          // A. Detectamos cuál es el ID que tenemos
          const rawId = item._id || item.product;
          
          // B. Si el ID tiene un guion (ej: "12345-negro"), nos quedamos solo con la primera parte
          const cleanId = rawId.toString().includes('-') 
              ? rawId.split('-')[0] 
              : rawId;

          return {
              name: item.name,
              qty: Number(item.quantity),
              image: item.image || item.imageUrl || (item.selectedVariant?.images?.[0]) || 'https://placehold.co/300',
              price: getPrice(item),
              
              // C. Enviamos el ID LIMPIO al backend
              product: cleanId, 
              
              variant: item.selectedVariant || {}
          };
      });

      // 2. Crear Datos de la Orden
      const orderData = {
        orderItems,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          region: formData.region,
          country: 'Chile'
        },
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

      // 3. ENVIAR ORDEN AL BACKEND
      const { data: createdOrder } = await axios.post(`/api/orders`, orderData, config);
      
      // 4. LÓGICA DE REDIRECCIÓN A MERCADO PAGO
      try {
          const { data: prefData } = await axios.post(`/api/orders/${createdOrder._id}/create-preference`, {}, config);
          
          clearCart();
          
          // Redirección directa a la URL de Mercado Pago
          window.location.href = `https://www.mercadopago.cl/checkout/v1/redirect?pref_id=${prefData.preferenceId}`;

      } catch (mpError) {
          console.error("Error Mercado Pago:", mpError);
          alert("Error conectando con el banco. Intenta nuevamente.");
          setLoading(false);
      }
      
    } catch (error) {
      console.error("Error checkout:", error);
      alert(`Error: ${error.response?.data?.message || "Hubo un problema al crear la orden"}`);
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
            <div className="grid grid-cols-1 gap-4">
                {/* 🔴 SOLO OPCIÓN MERCADO PAGO */}
                <div 
                    onClick={() => setPaymentMethod('webpay')} 
                    className="p-6 rounded-2xl border border-vlyck-lime bg-vlyck-lime/5 cursor-pointer transition-all flex flex-col gap-2 relative overflow-hidden group shadow-[0_0_15px_rgba(167,255,45,0.1)]"
                >
                    <div className="flex justify-between items-center relative z-10">
                        <span className="font-black text-white uppercase tracking-wider text-lg">Mercado Pago</span>
                        <div className="w-6 h-6 rounded-full border border-vlyck-lime flex items-center justify-center">
                            <div className="w-3 h-3 bg-vlyck-lime rounded-full"></div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 relative z-10">Tarjetas de Crédito, Débito (WebPay) y Saldo MP.</p>
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
             
             {/* BOTÓN FINAL */}
             <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 bg-vlyck-gradient text-black font-black uppercase rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(167,255,45,0.4)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3"
             >
                {loading ? (
                    <>Procesando <span className="material-symbols-outlined animate-spin">progress_activity</span></>
                ) : (
                    <>
                        Ir a Pagar
                        <span className="material-symbols-outlined font-bold">arrow_forward</span>
                    </>
                )}
             </button>
          </aside>

        </form>
      </main>
    </div>
  );
}