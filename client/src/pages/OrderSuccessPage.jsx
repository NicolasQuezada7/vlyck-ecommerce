import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`/api/orders/${id}`);
        setOrder(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div className="text-white text-center pt-40">Cargando recibo...</div>;
  if (!order) return <div className="text-white text-center pt-40">Orden no encontrada</div>;

  return (
    <div className="bg-background-dark text-white font-sans antialiased min-h-screen flex flex-col pt-20">
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
        
        {/* Encabezado Éxito */}
        <div className="flex flex-col items-center text-center pt-8 pb-8">
          <div className="w-20 h-20 rounded-full bg-vlyck-lime/20 flex items-center justify-center mb-6 animate-pulse">
            <span className="material-symbols-outlined text-4xl text-vlyck-lime" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">¡Orden Recibida!</h1>
          <p className="text-gray-400 text-lg">Tu pedido <span className="text-white font-mono">#{order._id.slice(-8).toUpperCase()}</span> ha sido procesado correctamente.</p>
        </div>

        {/* TICKET / RECIBO */}
        <div className="max-w-2xl mx-auto bg-[#111111] rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          
          {/* Grid de Datos */}
          <div className="p-8 border-b border-dashed border-white/10 grid grid-cols-2 gap-y-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Fecha</span>
              <span className="text-white font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Email</span>
              <span className="text-white font-medium">{order.guestInfo?.email || order.user?.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Método</span>
              <span className="text-white font-medium capitalize">{order.paymentMethod === 'webpay' ? 'WebPay / Crédito' : 'Transferencia'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Estado</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${order.isPaid ? 'bg-vlyck-lime/10 text-vlyck-lime' : 'bg-yellow-500/10 text-yellow-500'}`}>
                {order.isPaid ? 'Pagado' : 'Pendiente'}
              </span>
            </div>
          </div>

          {/* Lista de Items */}
          <div className="p-8 space-y-4">
            {order.orderItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                        {item.name} <span className="text-gray-500">x{item.qty}</span>
                        {item.variant && item.variant.model && <span className="text-gray-500 text-xs ml-1">({item.variant.model})</span>}
                    </span>
                    <span className="text-white font-mono">${(item.price * item.qty).toLocaleString('es-CL')}</span>
                </div>
            ))}
          </div>

          {/* Datos de Transferencia (Solo si eligió transferencia y no está pagado) */}
          {order.paymentMethod === 'transfer' && !order.isPaid && (
            <div className="mx-8 mb-8 p-6 bg-black rounded-2xl border border-vlyck-lime/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 bg-vlyck-lime/10 text-vlyck-lime text-[10px] font-bold uppercase tracking-tighter">Instrucciones</div>
                <h4 className="text-vlyck-lime text-sm font-bold mb-3">Datos para Transferencia</h4>
                <div className="space-y-2 text-xs text-gray-400">
                <p>Banco: <span className="text-white">Banco Estado</span></p>
                <p className="flex items-center justify-between">
                    <span>Cuenta Vista: <span className="text-white">123456789</span></span>
                    <button className="text-vlyck-cyan hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">content_copy</span> Copiar
                    </button>
                </p>
                <p>RUT: <span className="text-white">77.123.456-K</span></p>
                <p>Email: <span className="text-white">pagos@vlyck.cl</span></p>
                </div>
            </div>
          )}

          {/* Totales */}
          <div className="p-8 bg-white/5 space-y-2">
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Subtotal</span>
              <span>${order.itemsPrice.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Envío</span>
              <span>${order.shippingPrice.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-white text-2xl font-bold pt-4 border-t border-white/10 items-end">
              <span className="text-lg font-normal text-gray-400">Total Final</span>
              <span className="text-vlyck-lime">${order.totalPrice.toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>

        {/* Botones Finales */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-12 pb-20">
          <button className="py-4 px-10 rounded-full bg-vlyck-gradient text-black font-extrabold transition-all hover:scale-105 shadow-[0_0_20px_rgba(45,255,255,0.3)] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-xl">download</span>
             Descargar Comprobante
          </button>
          <Link to="/" className="py-4 px-10 rounded-full border border-white/20 text-white font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2">
             Seguir Comprando
             <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </Link>
        </div>

      </main>
    </div>
  );
}