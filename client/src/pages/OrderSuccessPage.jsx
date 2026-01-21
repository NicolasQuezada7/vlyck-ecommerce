import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// 1. IMPORTAR EL LOGO (Asegúrate que la ruta y extensión sean correctas)
// Si tu archivo es .svg o .jpg, cámbialo aquí.
import logoImg from '../assets/logo2.png'; 

export default function OrderSuccessPage() {
  const { id } = useParams();
  const { userInfo } = useAuth();
  
  // 2. CREAR CONSTANTE
  const VLYCK_LOGO = logoImg;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const config = userInfo ? {
            headers: { Authorization: `Bearer ${userInfo.token}` }
        } : {};

        const { data } = await axios.get(`/api/orders/${id}`, config);
        setOrder(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setErrorMsg(error.response?.data?.message || "Error al cargar la orden");
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, userInfo]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <img src={VLYCK_LOGO} alt="Cargando..." className="w-16 animate-pulse opacity-50" />
            <p className="text-vlyck-lime font-mono text-sm">Generando recibo...</p>
        </div>
    </div>
  );

  if (errorMsg || !order) return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-6xl text-red-500">error_outline</span>
        <h1 className="text-2xl font-bold">Orden no encontrada</h1>
        <p className="text-gray-400">{errorMsg}</p>
        <Link to="/" className="text-vlyck-lime hover:underline mt-4">Volver al inicio</Link>
    </div>
  );

  return (
    <div className="bg-[#050505] text-white font-sans antialiased min-h-screen flex flex-col pt-20">
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
        
        {/* Encabezado Éxito */}
        <div className="flex flex-col items-center text-center pt-8 pb-8">
          <div className="w-20 h-20 rounded-full bg-vlyck-lime/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(167,255,45,0.2)] animate-bounce-slow">
            <span className="material-symbols-outlined text-4xl text-vlyck-lime font-bold">check</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">¡Gracias por tu compra!</h1>
          <p className="text-gray-400 text-lg">Tu orden <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">#{order._id.slice(-8).toUpperCase()}</span> fue procesada correctamente.</p>
        </div>

        {/* TICKET / RECIBO */}
        <div className="max-w-2xl mx-auto bg-[#111111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative print:shadow-none print:border-black">
          
          {/* Decoración superior */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-vlyck-lime to-vlyck-cyan"></div>

          {/* 3. USAR LA CONSTANTE DEL LOGO EN EL TICKET */}
          <div className="flex justify-center pt-8 pb-4">
              <img src={VLYCK_LOGO} alt="Vlyck Logo" className="h-12 object-contain" />
          </div>

          {/* Grid de Datos */}
          <div className="px-8 pb-8 pt-4 border-b border-dashed border-white/10 grid grid-cols-2 gap-y-6 bg-[#111]">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Fecha</span>
              <span className="text-white font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Cliente</span>
              <span className="text-white font-medium truncate pr-4">{order.guestInfo?.email || order.user?.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Método Pago</span>
              <span className="text-white font-medium capitalize flex items-center gap-2">
                  {order.paymentMethod === 'webpay' ? 'WebPay / Tarjeta' : 'Transferencia'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Estado</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase w-fit tracking-wide ${order.isPaid ? 'bg-vlyck-lime text-black' : 'bg-yellow-500 text-black'}`}>
                {order.isPaid ? 'Pagado' : 'Pendiente'}
              </span>
            </div>
          </div>

          {/* Lista de Items */}
          <div className="p-8 space-y-4 bg-[#161616]/50">
            {order.orderItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm items-center border-b border-white/5 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#000] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                             {/* Intentamos mostrar la imagen del producto si viene en el objeto, si no el icono */}
                             {item.image ? (
                                <img src={item.image} className="w-full h-full object-cover" alt="prod"/>
                             ) : (
                                <span className="material-symbols-outlined text-gray-600">inventory_2</span>
                             )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-200 font-bold leading-tight">
                                {item.name}
                            </span>
                            <span className="text-xs text-gray-500">
                                Cant: {item.qty} {item.variant && item.variant.color && <span className="text-vlyck-lime">• {item.variant.color}</span>}
                            </span>
                        </div>
                    </div>
                    <span className="text-white font-mono font-bold ml-4">${(item.price * item.qty).toLocaleString('es-CL')}</span>
                </div>
            ))}
          </div>

          {/* Datos Transferencia (Solo si aplica) */}
          {order.paymentMethod === 'transfer' && !order.isPaid && (
            <div className="mx-8 mb-6 p-5 bg-black/40 rounded-xl border border-vlyck-lime/20 relative overflow-hidden">
                <div className="flex items-center gap-2 text-vlyck-lime mb-3">
                    <span className="material-symbols-outlined">info</span>
                    <h4 className="text-sm font-bold uppercase tracking-wide">Datos Transferencia</h4>
                </div>
                <div className="space-y-1.5 text-xs text-gray-400 font-mono pl-1">
                    <p>Banco: <span className="text-white font-bold">Banco Estado</span></p>
                    <p>Tipo: <span className="text-white font-bold">Cuenta Vista / Rut</span></p>
                    <p>Número: <span className="text-white font-bold">123456789</span></p>
                    <p>RUT: <span className="text-white font-bold">77.123.456-K</span></p>
                    <p>Email: <span className="text-white font-bold">pagos@vlyck.cl</span></p>
                </div>
            </div>
          )}

          {/* Totales */}
          <div className="p-8 bg-white/5 space-y-3 border-t border-white/10">
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Subtotal Productos</span>
              <span>${order.itemsPrice?.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Costo de Envío</span>
              <span>${order.shippingPrice?.toLocaleString('es-CL') || '0'}</span>
            </div>
            <div className="flex justify-between text-white text-3xl font-black pt-4 border-t border-white/10 items-center mt-2">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Pagado</span>
              <span className="text-vlyck-lime tracking-tight">${order.totalPrice.toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>

        {/* Botones Finales */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-12 pb-20 print:hidden">
          <button onClick={() => window.print()} className="py-4 px-10 rounded-full bg-[#111] border border-white/20 text-white font-bold transition-all hover:bg-white/10 hover:scale-105 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">print</span>
            Imprimir
          </button>
          <Link to="/" className="py-4 px-10 rounded-full bg-vlyck-lime text-black font-extrabold hover:shadow-[0_0_20px_rgba(167,255,45,0.4)] transition-all flex items-center justify-center gap-2 hover:scale-105">
             Volver a la Tienda
             <span className="material-symbols-outlined font-bold">arrow_forward</span>
          </Link>
        </div>

      </main>
    </div>
  );
}