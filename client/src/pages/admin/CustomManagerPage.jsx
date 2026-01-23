import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CustomManagerPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Estados para Nueva Venta Externa
  const [newOrder, setNewOrder] = useState({
    clientName: '',
    phone: '',
    source: 'Instagram', // Instagram, Facebook, WhatsApp, Presencial
    model: 'iPhone 13',
    instructions: '',
    totalPrice: 15000,
    deposit: 5000,
    imageFile: null
  });

  // Cargar Pedidos
  const fetchCustomOrders = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/orders', config);
      
      // Filtramos: Que sean Custom (de la web) O que tengan origen externo
      const customOnes = data.filter(o => 
        o.isCustomOrder || 
        (o.orderItems && o.orderItems.some(i => i.category === 'Personalizadas')) ||
        ['Instagram', 'Facebook', 'WhatsApp', 'Presencial'].includes(o.orderSource)
      );
      
      setOrders(customOnes);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomOrders();
  }, [userInfo]);

  // Manejar creación de pedido externo
  const handleCreateExternal = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      // 1. Subir imagen (si existe)
      let imageUrl = 'https://via.placeholder.com/300?text=Sin+Imagen'; // Placeholder por defecto
      if (newOrder.imageFile) {
        const formData = new FormData();
        formData.append('image', newOrder.imageFile);
        const { data: uploadData } = await axios.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadData;
      }

      // 2. Crear la Orden
    // 2. Crear la Orden
      const orderData = {
        orderItems: [{
            product: '6973ad0c8e605928260af54a', // Tu ID real
            name: `Personalizada - ${newOrder.model}`,
            qty: 1,
            image: imageUrl,
            price: newOrder.totalPrice,
            category: 'Personalizadas',
            customInstructions: newOrder.instructions
        }],
        guestInfo: {
            name: newOrder.clientName,
            phone: newOrder.phone,
            instagramUser: newOrder.source === 'Instagram' ? newOrder.clientName : ''
        },
        paymentMethod: 'Manual/POS',
        
        // --- ✅ AGREGA ESTO PARA QUE NO FALLE NUNCA ---
        itemsPrice: newOrder.totalPrice,
        taxPrice: 0,
        shippingPrice: 0,
        // ----------------------------------------------

        totalPrice: newOrder.totalPrice,
        depositAmount: newOrder.deposit,
        remainingAmount: newOrder.totalPrice - newOrder.deposit,
        isPartiallyPaid: newOrder.deposit > 0 && newOrder.deposit < newOrder.totalPrice,
        isPaid: newOrder.deposit >= newOrder.totalPrice,
        orderSource: newOrder.source,
        isCustomOrder: true,
        workflowStatus: 'Pendiente'
      };

      await axios.post('/api/orders', orderData, config);
      
      setShowModal(false);
      // Limpiar formulario
      setNewOrder({
        clientName: '', phone: '', source: 'Instagram', model: 'iPhone 13', 
        instructions: '', totalPrice: 15000, deposit: 5000, imageFile: null
      });
      fetchCustomOrders();
      alert('Pedido Creado Correctamente');

    } catch (error) {
      alert('Error creando pedido. Revisa la consola.');
      console.error(error);
    }
  };

  // Actualizar Estado (Workflow) Visualmente
  const updateStatus = async (orderId, newStatus) => {
      // Idealmente aquí harías un axios.put al backend para guardar el cambio
      const updated = orders.map(o => o._id === orderId ? {...o, workflowStatus: newStatus} : o);
      setOrders(updated);
  };

  if (loading) return <div className="text-center pt-20 text-vlyck-lime">Cargando Gestor...</div>;

  return (
    <div className="pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Gestión <span className="text-vlyck-lime">Personalizadas</span></h1>
          <p className="text-gray-500 text-sm mt-1">Control de pedidos Web, Instagram y Presenciales.</p>
        </div>
        <button 
            onClick={() => setShowModal(true)}
            className="bg-vlyck-lime text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(167,255,45,0.4)]"
        >
            <span className="material-symbols-outlined">add_circle</span> Nueva Venta Manual
        </button>
      </div>

      {/* LISTA DE PEDIDOS */}
      <div className="grid grid-cols-1 gap-6">
        {orders.length === 0 && (
            <div className="text-center text-gray-500 py-10 bg-[#111] rounded-2xl border border-white/10">
                No hay pedidos personalizados activos.
            </div>
        )}

        {orders.map((order) => (
            <div key={order._id} className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-vlyck-lime/30 transition-colors">
                
                {/* 1. Imagen del Diseño */}
                <div className="w-full md:w-48 aspect-square bg-black rounded-xl overflow-hidden border border-white/5 relative group shrink-0">
                    <img src={order.orderItems[0]?.image} alt="Diseño" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={order.orderItems[0]?.image} target="_blank" rel="noreferrer" className="text-white text-xs font-bold underline">Ver Original</a>
                    </div>
                </div>

                {/* 2. Datos del Cliente */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {order.guestInfo?.name || order.user?.name || 'Cliente Web'}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span className="material-symbols-outlined text-xs">phone_iphone</span> 
                                    {order.orderItems[0]?.name}
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${
                                order.orderSource === 'Web' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                                {order.orderSource || 'Web'}
                            </span>
                        </div>

                        <div className="bg-black/30 p-3 rounded-lg border border-white/5 mb-4">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Contacto:</p>
                            <p className="text-sm text-gray-300 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xs">call</span> {order.guestInfo?.phone || 'N/A'}
                            </p>
                            {order.orderSource === 'Instagram' && (
                                <p className="text-sm text-gray-300 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs">alternate_email</span> {order.guestInfo?.instagramUser}
                                </p>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 italic">
                            "{order.orderItems[0]?.customInstructions || 'Sin instrucciones adicionales'}"
                        </p>
                    </div>
                </div>

                {/* 3. Estado Financiero y Workflow */}
                <div className="w-full md:w-64 border-l border-white/10 md:pl-6 flex flex-col gap-4">
                    
                    {/* Finanzas */}
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Estado de Pago</p>
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-gray-400 text-sm">Total</span>
                            <span className="text-white font-mono font-bold">${order.totalPrice?.toLocaleString('es-CL')}</span>
                        </div>
                        {order.depositAmount > 0 && (
                            <div className="flex justify-between items-end mb-1 text-green-400">
                                <span className="text-xs">Abonado</span>
                                <span className="font-mono font-bold">-${order.depositAmount?.toLocaleString('es-CL')}</span>
                            </div>
                        )}
                        <div className="border-t border-white/10 pt-2 flex justify-between items-end">
                            <span className="text-vlyck-lime text-sm font-bold">Resta</span>
                            <span className="text-vlyck-lime font-mono font-black text-lg">${(order.remainingAmount || 0).toLocaleString('es-CL')}</span>
                        </div>
                    </div>

                    {/* Workflow Actions */}
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Estado Producción</p>
                        <select 
                            value={order.workflowStatus || 'Pendiente'} 
                            onChange={(e) => updateStatus(order._id, e.target.value)}
                            className="w-full bg-[#222] border border-white/20 rounded-lg text-xs text-white p-2 outline-none focus:border-vlyck-lime"
                        >
                            <option>Pendiente</option>
                            <option>Boceto Listo</option>
                            <option>Aprobado</option>
                            <option>En Producción</option>
                            <option>Terminado</option>
                            <option>Entregado</option>
                        </select>
                    </div>

                </div>

            </div>
        ))}
      </div>

      {/* --- MODAL NUEVA VENTA EXTERNA --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-8">
                <h2 className="text-2xl font-black text-white uppercase mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-vlyck-lime">add_shopping_cart</span> Nueva Venta Manual
                </h2>

                <form onSubmit={handleCreateExternal} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Datos Cliente */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/10 pb-2">Cliente</h3>
                        <input type="text" placeholder="Nombre Cliente" required className="input-cyber" value={newOrder.clientName} onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} />
                        <input type="text" placeholder="Teléfono / WhatsApp" className="input-cyber" value={newOrder.phone} onChange={e => setNewOrder({...newOrder, phone: e.target.value})} />
                        <select className="input-cyber" value={newOrder.source} onChange={e => setNewOrder({...newOrder, source: e.target.value})}>
                            <option>Instagram</option>
                            <option>Facebook</option>
                            <option>WhatsApp</option>
                            <option>Presencial</option>
                        </select>
                    </div>

                    {/* Datos Producto */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/10 pb-2">Producto</h3>
                        <select className="input-cyber" value={newOrder.model} onChange={e => setNewOrder({...newOrder, model: e.target.value})}>
                            <option>iPhone 13</option>
                            <option>iPhone 14</option>
                            <option>iPhone 15 Pro</option>
                            <option>Samsung S23</option>
                        </select>
                        <textarea placeholder="Instrucciones del diseño..." className="input-cyber resize-none h-20" value={newOrder.instructions} onChange={e => setNewOrder({...newOrder, instructions: e.target.value})}></textarea>
                        <div className="bg-white/5 p-2 rounded-lg border border-dashed border-white/20">
                            <label className="text-xs text-gray-400 block mb-1">Subir Boceto / Foto (Opcional)</label>
                            <input type="file" className="text-xs text-gray-300 w-full" onChange={e => setNewOrder({...newOrder, imageFile: e.target.files[0]})} />
                        </div>
                    </div>

                    {/* Datos Pago */}
                    <div className="md:col-span-2 flex flex-col gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                        <h3 className="text-xs font-bold text-vlyck-lime uppercase tracking-widest border-b border-white/10 pb-2">Pago y Abono</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Precio Total</label>
                                <input type="number" className="input-cyber" value={newOrder.totalPrice} onChange={e => setNewOrder({...newOrder, totalPrice: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Abono Inicial</label>
                                <input type="number" className="input-cyber border-vlyck-lime/50 text-vlyck-lime font-bold" value={newOrder.deposit} onChange={e => setNewOrder({...newOrder, deposit: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div className="text-right text-sm text-gray-300">
                            Resta por pagar: <span className="font-bold text-white">${(newOrder.totalPrice - newOrder.deposit).toLocaleString('es-CL')}</span>
                        </div>
                    </div>

                    <div className="md:col-span-2 flex gap-4 mt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="w-full py-4 rounded-xl font-bold text-gray-400 hover:bg-white/10 transition-colors">Cancelar</button>
                        <button type="submit" className="w-full py-4 bg-vlyck-gradient text-black font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform shadow-lg">Registrar Venta</button>
                    </div>

                </form>
            </div>
        </div>
      )}

      <style>{`
        .input-cyber {
            width: 100%;
            background-color: #000;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 0.5rem;
            padding: 0.75rem;
            color: white;
            outline: none;
            font-size: 0.875rem;
            transition: all 0.2s;
        }
        .input-cyber:focus {
            border-color: #a7ff2d;
            box-shadow: 0 0 0 1px #a7ff2d;
        }
      `}</style>

    </div>
  );
}