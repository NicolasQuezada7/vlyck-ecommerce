import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// --- CONFIGURACIÓN ---
const PRICE_ONE = 8990;
const PRICE_PROMO = 8000; 
const SHIPPING_OPTIONS = {
    'Retiro Centro Chillán': 0,
    'Domicilio Coihueco': 0,
    'Despacho Chillán': 1000,
    'Despacho Chillán Viejo': 2000
};
const CITIES = ['Chillán', 'Chillán Viejo', 'Coihueco'];
const STATUS_OPTIONS = ['Pendiente', 'Boceto Listo', 'Aprobado', 'En Producción', 'Terminado', 'Entregado'];

// Base inicial
const INITIAL_PHONE_DB = {
    'Apple': ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11'],
    'Samsung': ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S23 Ultra', 'Galaxy S21 FE', 'Galaxy A55', 'Galaxy A54', 'Galaxy A35', 'Galaxy A15'],
    'Xiaomi': ['14 Ultra', '13T Pro', '13T', '12T Pro', 'Poco X6 Pro', 'Poco F6', 'Poco X5 Pro'],
    'Redmi': ['Note 13 Pro+', 'Note 13', 'Note 12', 'Note 11', '13C'],
    'Motorola': ['Edge 50 Ultra', 'Edge 40 Neo', 'Moto G84', 'Moto G54', 'Moto G14'],
    'Honor': ['Magic 6 Pro', 'Honor 90', 'Honor X8b', 'Honor X7b'],
    'Huawei': ['Pura 70 Ultra', 'P60 Pro', 'Nova 12s', 'Nova 11'],
    'Vivo': ['V30', 'V29', 'Y36', 'Y27'],
    'Oppo': ['Reno 11 F', 'A79', 'A78', 'A58']
};

export default function CustomManagerPage() {
  const { userInfo } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Vistas
  const [viewMode, setViewMode] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showFinished, setShowFinished] = useState(false);

  // Auxiliares
  const [showPayModal, setShowPayModal] = useState(false);
  const [payData, setPayData] = useState({ id: '', amount: 0, method: 'Transferencia' });
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [lightboxImg, setLightboxImg] = useState(null);

  // DB Dinámica
  const [phoneDB, setPhoneDB] = useState(INITIAL_PHONE_DB);

  // Form Data
  const [formData, setFormData] = useState({
    clientName: '', phone: '', source: 'Instagram', 
    city: 'Chillán', deliveryMethod: 'Retiro Centro Chillán', address: '',
    items: [], discount: 0, deposit: 0,
    itemsTotal: 0, shippingCost: 0, finalTotal: 0
  });

  const [newItem, setNewItem] = useState({brand: 'Apple', specificModel: '', manualModel: '', isManual: false, instructions: '', imageFiles: [], imageUrls: []});

  // Calculadora
  useEffect(() => {
    const qty = formData.items.length;
    let itemsPrice = (qty === 1) ? PRICE_ONE : (qty >= 2 ? qty * PRICE_PROMO : 0);
    const shippingPrice = SHIPPING_OPTIONS[formData.deliveryMethod] || 0;
    const total = itemsPrice + shippingPrice - (formData.discount || 0);
    setFormData(prev => ({ ...prev, itemsTotal: itemsPrice, shippingCost: shippingPrice, finalTotal: total > 0 ? total : 0 }));
  }, [formData.items, formData.deliveryMethod, formData.discount]);

  // Fetch
  const fetchCustomOrders = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/orders', config);
      const customOnes = data.filter(o => o.isCustomOrder || ['Instagram', 'Facebook', 'WhatsApp', 'Presencial'].includes(o.orderSource));
      customOnes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(customOnes);
      setLoading(false);
    } catch (error) { console.error(error); setLoading(false); }
  };
  useEffect(() => { fetchCustomOrders(); }, [userInfo]);

  const showToastMsg = (msg, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast({ ...toast, show: false }), 3000); };
  
  const handleFileChange = (e) => { const files = Array.from(e.target.files); if (files.length > 0) setNewItem(prev => ({ ...prev, imageFiles: [...prev.imageFiles, ...files] })); };
  
  const handleAddItem = () => {
      if (newItem.imageFiles.length === 0 && newItem.imageUrls.length === 0) return alert("Falta imagen");
      let finalModelName = newItem.isManual ? newItem.manualModel : newItem.specificModel;
      if (!finalModelName) return alert("Define el modelo");
      
      if(newItem.isManual) {
          setPhoneDB(prev => {
             const current = prev[newItem.brand] || [];
             if(!current.includes(finalModelName)) return { ...prev, [newItem.brand]: [finalModelName, ...current] };
             return prev;
          });
      }
      setFormData(prev => ({ ...prev, items: [...prev.items, { model: finalModelName, instructions: newItem.instructions, imageFiles: newItem.imageFiles, imageUrls: newItem.imageUrls, idTemp: Date.now() }] }));
      setNewItem(prev => ({ brand: prev.brand, specificModel: '', manualModel: '', isManual: false, instructions: '', imageFiles: [], imageUrls: [] }));
  };

  const handleRemoveItem = (index) => { const updated = [...formData.items]; updated.splice(index, 1); setFormData(prev => ({ ...prev, items: updated })); };
  
  const uploadImage = async (file) => { const formDataImg = new FormData(); formDataImg.append('image', file); const { data } = await axios.post('/api/upload', formDataImg, { headers: { 'Content-Type': 'multipart/form-data' } }); return data; };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) return alert("Agrega items");
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    try {
        const processedItems = await Promise.all(formData.items.map(async (item) => {
            const uploadedUrls = await Promise.all(item.imageFiles.map(file => uploadImage(file)));
            const allImages = [...(item.imageUrls || []), ...uploadedUrls];
            const mainImage = allImages.length > 0 ? allImages[0] : 'https://via.placeholder.com/300?text=Sin+Imagen';
            return { product: '6973ad0c8e605928260af54a', name: `Personalizada - ${item.model}`, qty: 1, image: mainImage, originalLayers: allImages, price: formData.items.length >= 2 ? PRICE_PROMO : PRICE_ONE, category: 'Personalizadas', customInstructions: item.instructions };
        }));
        const payload = {
            orderItems: processedItems, guestInfo: { name: formData.clientName, phone: formData.phone, instagramUser: formData.source === 'Instagram' ? formData.clientName : '' },
            shippingAddress: { city: formData.city, address: formData.deliveryMethod.includes('Despacho') ? `${formData.address} (${formData.deliveryMethod})` : formData.deliveryMethod, country: 'Chile' },
            itemsPrice: formData.itemsTotal, shippingPrice: formData.shippingCost, totalPrice: formData.finalTotal, depositAmount: formData.deposit, remainingAmount: formData.finalTotal - formData.deposit,
            isPartiallyPaid: formData.deposit > 0 && formData.deposit < formData.finalTotal, isPaid: formData.deposit >= formData.finalTotal,
            orderSource: formData.source, isCustomOrder: true, workflowStatus: isEditing && selectedOrder ? selectedOrder.workflowStatus : 'Pendiente'
        };
        if (isEditing && selectedOrder) { await axios.put(`/api/orders/${selectedOrder._id}/manual-update`, payload, config); showToastMsg('Actualizado'); } 
        else { await axios.post('/api/orders', payload, config); showToastMsg('Creado'); }
        closeDetail(); fetchCustomOrders();
    } catch (e) { showToastMsg('Error', 'error'); }
  };

  const openDetail = (order) => {
      setSelectedOrder(order);
      let method = 'Retiro Centro Chillán', addr = '';
      const savedAddr = order.shippingAddress?.address || '';
      if (Object.keys(SHIPPING_OPTIONS).includes(savedAddr)) method = savedAddr;
      else if (savedAddr.includes('Despacho')) { method = savedAddr.includes('Viejo') ? 'Despacho Chillán Viejo' : 'Despacho Chillán'; addr = savedAddr.split('(')[0].trim(); }
      setFormData({ clientName: order.guestInfo?.name || '', phone: order.guestInfo?.phone || '', source: order.orderSource, city: order.shippingAddress?.city || 'Chillán', deliveryMethod: method, address: addr, items: order.orderItems.map(i => ({ model: i.name.replace('Personalizada - ', ''), instructions: i.customInstructions, imageUrls: i.originalLayers?.length ? i.originalLayers : [i.image], imageFiles: [], idTemp: Math.random() })), deposit: order.depositAmount, discount: 0, itemsTotal: order.itemsPrice || 0, shippingCost: order.shippingPrice || 0, finalTotal: order.totalPrice });
      setIsEditing(false); setViewMode('detail');
  };

  const closeDetail = () => { setSelectedOrder(null); setIsEditing(false); resetForm(); setViewMode('list'); };
  
  const resetForm = () => { setFormData({ clientName: '', phone: '', source: 'Instagram', city: 'Chillán', deliveryMethod: 'Retiro Centro Chillán', address: '', items: [], discount: 0, deposit: 0, itemsTotal: 0, shippingCost: 0, finalTotal: 0 }); setNewItem({ brand: 'Apple', specificModel: '', manualModel: '', isManual: false, instructions: '', imageFiles: [], imageUrls: [] }); };
  
  // --- 🔥 PAGO QUE ACTUALIZA LA UI 🔥 ---
  const handlePayBalance = async (e) => {
      e.stopPropagation(); e.preventDefault();
      try {
          await axios.put(`/api/orders/${payData.id}/pay-balance`, { amount: payData.amount, paymentMethod: payData.method }, { headers: { Authorization: `Bearer ${userInfo.token}` } });
          showToastMsg('Pago registrado'); setShowPayModal(false); 
          if(viewMode === 'detail') {
             // Actualiza visualmente el formulario sin recargar
             setFormData(prev => ({ ...prev, deposit: prev.deposit + payData.amount }));
             if(selectedOrder) {
                 setSelectedOrder({
                     ...selectedOrder,
                     depositAmount: selectedOrder.depositAmount + payData.amount,
                     remainingAmount: selectedOrder.remainingAmount - payData.amount
                 });
             }
          } else {
             fetchCustomOrders();
          }
      } catch (e) { showToastMsg('Error Pago', 'error'); }
  };

  const updateWorkflow = async (newStatus) => { if (!selectedOrder) return; try { await axios.put(`/api/orders/${selectedOrder._id}/manual-update`, { workflowStatus: newStatus }, { headers: { Authorization: `Bearer ${userInfo.token}` } }); showToastMsg(`Estado: ${newStatus}`); setSelectedOrder({...selectedOrder, workflowStatus: newStatus}); fetchCustomOrders(); } catch(e) {} };
  
  const handleStatusChange = async (e, orderId) => { e.stopPropagation(); const newStatus = e.target.value; const updatedOrders = orders.map(o => o._id === orderId ? { ...o, workflowStatus: newStatus } : o); setOrders(updatedOrders); try { await axios.put(`/api/orders/${orderId}/manual-update`, { workflowStatus: newStatus }, { headers: { Authorization: `Bearer ${userInfo.token}` } }); showToastMsg(`Estado actualizado`); } catch (error) { showToastMsg('Error', 'error'); fetchCustomOrders(); } };
  
  const handleDelete = async (id) => { if(!window.confirm('¿Borrar?')) return; try { await axios.delete(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${userInfo.token}` } }); showToastMsg('Borrado'); fetchCustomOrders(); if(viewMode==='detail') closeDetail(); } catch(e) { showToastMsg('Error', 'error'); } };

  // Funciones Mobile
  const openWhatsApp = (phone) => { if(!phone) return; window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank'); };
  const openMaps = (address) => { if(!address) return; window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ', Chillan, Chile')}`, '_blank'); };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-vlyck-lime animate-pulse">Cargando...</div>;

  return (
    <div className="pb-20 relative min-h-screen font-sans bg-[#050505]">
      
      {/* VISTA LISTADO */}
      {viewMode === 'list' && (
        <>
            <div className="flex flex-col xl:flex-row justify-between items-end mb-6 gap-4 border-b border-white/10 pb-4 p-4 md:p-0">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center justify-between">
                        <span>Gestión <span className="text-vlyck-lime">Pedidos</span></span>
                        {/* Botón Móvil */}
                        <button onClick={() => { resetForm(); setViewMode('create'); }} className="md:hidden bg-vlyck-lime text-black w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(167,255,45,0.4)]"><span className="material-symbols-outlined font-bold">add</span></button>
                    </h1>
                    <div className="flex gap-2 mt-4 bg-[#111] p-1 rounded-lg w-full md:w-fit border border-white/10">
                        <button onClick={() => setShowFinished(false)} className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase rounded-md transition-all ${!showFinished ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-white'}`}>Activos</button>
                        <button onClick={() => setShowFinished(true)} className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase rounded-md transition-all ${showFinished ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-white'}`}>Historial</button>
                    </div>
                </div>
                <button onClick={() => { resetForm(); setViewMode('create'); }} className="hidden md:flex bg-vlyck-lime text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform items-center gap-2 shadow-[0_0_20px_rgba(167,255,45,0.4)]"><span className="material-symbols-outlined">add_circle</span> Nueva Venta</button>
            </div>

            <div className="flex flex-col gap-4 p-2 md:p-0">
                {orders.filter(o => showFinished ? o.workflowStatus === 'Entregado' : o.workflowStatus !== 'Entregado').map((order) => (
                    <div key={order._id} onClick={() => openDetail(order)} className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden hover:border-vlyck-lime/50 transition-all group relative cursor-pointer shadow-lg flex flex-col md:flex-row">
                        
                        {/* --- MÓVIL (COMPACTO) --- */}
                        <div className="flex md:hidden p-3 gap-3">
                            <div className="w-20 h-20 shrink-0 bg-black rounded-lg overflow-hidden border border-white/10 relative" onClick={(e) => { e.stopPropagation(); setLightboxImg(order.orderItems[0]?.image); }}>
                                <img src={order.orderItems[0]?.image} className="w-full h-full object-cover" />
                                {order.orderItems.length > 1 && <div className="absolute bottom-0 right-0 bg-black/80 text-white text-[9px] px-1 font-bold">+{order.orderItems.length-1}</div>}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-sm font-bold text-white leading-tight">{order.guestInfo?.name}</h3>
                                        
                                        {/* 🔥 AQUI ESTÁ EL CAMBIO SOLICITADO: NOMBRE MODELO NEON 🔥 */}
                                        <div className="flex flex-wrap gap-1 mt-1 mb-1">
                                            {order.orderItems.map((item, idx) => (
                                                <span key={idx} className="text-[10px] font-black text-vlyck-lime uppercase tracking-wide drop-shadow-[0_0_5px_rgba(167,255,45,0.6)]">
                                                    {item.name.replace('Personalizada - ', '')}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-[10px] text-gray-400 uppercase">{order.shippingAddress?.city}</p>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${order.remainingAmount > 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>{order.remainingAmount > 0 ? `$${order.remainingAmount.toLocaleString('es-CL')} Pend.` : 'Pagado'}</span>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <div className="w-2/3" onClick={(e) => e.stopPropagation()}>
                                        <select value={order.workflowStatus} onChange={(e) => handleStatusChange(e, order._id)} className={`w-full text-[10px] font-bold p-1 rounded border bg-[#111] text-white outline-none ${order.workflowStatus === 'Entregado' ? 'border-green-500' : 'border-white/20'}`}>
                                            {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); openWhatsApp(order.guestInfo?.phone); }} className="w-8 h-8 rounded-full bg-green-600/20 text-green-500 flex items-center justify-center border border-green-600/50"><span className="material-symbols-outlined text-sm">chat</span></button>
                                </div>
                            </div>
                        </div>
                        <div className="flex md:hidden border-t border-white/10 divide-x divide-white/10">
                            <button onClick={(e) => { e.stopPropagation(); openMaps(order.shippingAddress?.address); }} className="flex-1 py-2 text-[10px] text-gray-400 font-bold uppercase hover:bg-white/5 flex items-center justify-center gap-1"><span className="material-symbols-outlined text-xs">map</span> Mapa</button>
                            {order.remainingAmount > 0 && <button onClick={(e) => { e.stopPropagation(); setPayData({ id: order._id, amount: order.remainingAmount, method: 'Transferencia' }); setShowPayModal(true); }} className="flex-1 py-2 text-[10px] text-vlyck-lime font-bold uppercase hover:bg-white/5 flex items-center justify-center gap-1"><span className="material-symbols-outlined text-xs">payments</span> Cobrar</button>}
                            <button onClick={() => openDetail(order)} className="flex-1 py-2 text-[10px] text-blue-400 font-bold uppercase hover:bg-white/5 flex items-center justify-center gap-1"><span className="material-symbols-outlined text-xs">edit</span> Ver Todo</button>
                        </div>

                        {/* --- DESKTOP (DETALLADO) --- */}
                        <div className="hidden md:flex flex-row h-full w-full p-6 gap-6">
                            <div className="w-48 aspect-[3/4] bg-black rounded-xl overflow-hidden border border-white/5 relative shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); setLightboxImg(order.orderItems[0]?.image); }}>
                                <img src={order.orderItems[0]?.image} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                {order.orderItems.length > 1 && <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded font-bold border border-white/20">+{order.orderItems.length-1}</div>}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div><h3 className="text-2xl font-bold text-white mb-1">{order.guestInfo?.name}</h3><div className="flex gap-2"><span className="px-2 py-0.5 rounded text-[10px] font-black uppercase border border-orange-500 text-orange-500">{order.orderSource}</span><span className="px-2 py-0.5 rounded text-[10px] font-black uppercase border border-white/20 text-gray-400">{order.shippingAddress?.city}</span></div></div>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openDetail(order); }} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-sm">edit</span></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(order._id); }} className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Entrega</p>
                                            <p className="text-sm text-white font-bold mb-1 truncate">{order.shippingAddress?.address}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1 cursor-pointer hover:text-vlyck-lime" onClick={(e) => {e.stopPropagation(); openWhatsApp(order.guestInfo?.phone)}}><span className="material-symbols-outlined text-[10px]">call</span> {order.guestInfo?.phone}</p>
                                        </div>
                                        <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Carcasas</p>
                                            {order.orderItems.map((item, i) => (<div key={i} className="mb-1"><p className="text-xs text-vlyck-lime font-bold">{item.name.replace('Personalizada - ', '')}</p></div>))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-64 border-l border-white/10 pl-6 flex flex-col justify-between gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Estado</p>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <select value={order.workflowStatus || 'Pendiente'} onChange={(e) => handleStatusChange(e, order._id)} className="w-full text-xs font-bold p-2 rounded-lg border bg-[#222] border-white/20 text-white outline-none cursor-pointer">
                                            {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-400"><span>Total</span> <span>${order.totalPrice.toLocaleString('es-CL')}</span></div>
                                    <div className="flex justify-between text-xs text-green-500"><span>Abonado</span> <span>-${(order.depositAmount || 0).toLocaleString('es-CL')}</span></div>
                                    <div className="border-t border-white/10 pt-2 flex justify-between items-center mb-2"><span className="text-xs font-bold text-gray-500">SALDO</span><span className={`text-xl font-black ${order.remainingAmount > 0 ? 'text-red-500' : 'text-gray-500'}`}>${order.remainingAmount.toLocaleString('es-CL')}</span></div>
                                    {order.remainingAmount > 0 ? (
                                        <button onClick={(e) => { e.stopPropagation(); setPayData({ id: order._id, amount: order.remainingAmount, method: 'Transferencia' }); setShowPayModal(true); }} className="w-full py-3 bg-vlyck-lime text-black font-black uppercase text-xs rounded-lg hover:scale-[1.02] shadow">Pagar Saldo</button>
                                    ) : (<div className="w-full py-2 bg-gray-800 text-gray-500 font-bold uppercase text-xs rounded-lg text-center">Pagado</div>)}
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        </>
      )}

      {/* MODAL EDITAR / CREAR */}
      {(viewMode === 'create' || viewMode === 'detail') && (
        <div className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-6 bg-[#050505]/95 backdrop-blur sticky top-0 py-4 z-20 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <button onClick={closeDetail} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-outlined">arrow_back</span></button>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase truncate max-w-[200px] md:max-w-none">{viewMode === 'create' ? 'Nueva Venta' : selectedOrder?.guestInfo?.name || 'Expediente'}</h2>
                    </div>
                    <div className="flex gap-2">
                        {viewMode === 'detail' && !isEditing && <button onClick={() => setIsEditing(true)} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs uppercase"><span className="material-symbols-outlined text-sm md:hidden">edit</span><span className="hidden md:inline">Editar</span></button>}
                        {(viewMode === 'create' || isEditing) && (
                            <>
                                <button onClick={() => setIsEditing(false)} className="text-red-500 font-bold text-xs uppercase hidden md:block">Cancelar</button>
                                <button onClick={handleSubmit} className="px-4 py-2 bg-vlyck-lime text-black rounded-lg font-black uppercase text-xs shadow-lg shadow-vlyck-lime/20">Guardar</button>
                            </>
                        )}
                    </div>
                </div>
                
                {/* --- CONTENIDO DEL MODAL --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="cyber-box"><h3 className="cyber-title"><span className="material-symbols-outlined text-sm">person</span> Datos Cliente</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Input label="Nombre" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} disabled={!isEditing && viewMode === 'detail'} /><Input label="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={!isEditing && viewMode === 'detail'} /><Select label="Origen" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} options={['Instagram', 'Facebook', 'WhatsApp', 'Presencial', 'Web']} disabled={!isEditing && viewMode === 'detail'} /><Select label="Ciudad" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} options={CITIES} disabled={!isEditing && viewMode === 'detail'} /><div className="md:col-span-2"><Select label="Entrega" value={formData.deliveryMethod} onChange={e => setFormData({...formData, deliveryMethod: e.target.value})} options={Object.keys(SHIPPING_OPTIONS)} disabled={!isEditing && viewMode === 'detail'} /></div>{formData.deliveryMethod.includes('Despacho') && <div className="md:col-span-2"><Input label="Dirección" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={!isEditing && viewMode === 'detail'} /></div>}</div></div>
                        <div className="cyber-box">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2"><h3 className="cyber-title mb-0 border-0 pb-0"><span className="material-symbols-outlined text-sm">phone_iphone</span> Carcasas ({formData.items.length})</h3>{formData.items.length >= 2 && <span className="text-[10px] bg-vlyck-lime/20 text-vlyck-lime px-2 py-1 rounded font-black uppercase">Promo 2x$16k</span>}</div>
                            <div className="space-y-4">{formData.items.map((item, idx) => (<div key={idx} className="flex flex-row gap-3 p-3 bg-[#111] rounded-xl border border-white/5 relative group"><div className="w-16 h-16 shrink-0 bg-black rounded overflow-hidden" onClick={() => setLightboxImg(item.imageFiles?.[0] ? URL.createObjectURL(item.imageFiles[0]) : item.imageUrls[0])}><img src={item.imageFiles?.[0] ? URL.createObjectURL(item.imageFiles[0]) : item.imageUrls[0]} className="w-full h-full object-cover" /></div><div className="flex-1"><h4 className="text-white font-bold text-sm">{item.model}</h4><p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.instructions || 'Sin instrucciones'}</p></div>{(viewMode === 'create' || isEditing) && <button onClick={() => handleRemoveItem(idx)} className="text-red-500"><span className="material-symbols-outlined">delete</span></button>}</div>))}</div>
                            {(viewMode === 'create' || isEditing) && (<div className="mt-6 bg-[#151515] p-4 rounded-xl border border-dashed border-white/20"><div className="flex justify-between items-center mb-4"><p className="text-xs font-bold text-vlyck-lime uppercase">Agregar Carcasa</p><button onClick={() => setNewItem({...newItem, isManual: !newItem.isManual, manualModel: '', specificModel: ''})} className="text-[10px] text-gray-400 underline">{newItem.isManual ? 'Ver Lista' : 'Manual'}</button></div><div className="space-y-3"><Select label="Marca" value={newItem.brand} onChange={e => setNewItem({...newItem, brand: e.target.value, specificModel: ''})} options={Object.keys(phoneDB)} />{!newItem.isManual ? (<Select label="Modelo" value={newItem.specificModel} onChange={e => setNewItem({...newItem, specificModel: e.target.value})} options={phoneDB[newItem.brand] || []} />) : (<Input label="Modelo Manual" value={newItem.manualModel} onChange={e => setNewItem({...newItem, manualModel: e.target.value})} />)}<div className="flex items-center gap-2"><label className="flex-1 h-10 bg-black border border-white/20 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-gray-400 cursor-pointer"><span className="material-symbols-outlined text-sm">cloud_upload</span> Fotos<input type="file" multiple className="hidden" onChange={handleFileChange} /></label>{newItem.imageFiles.length > 0 && <span className="text-[10px] text-vlyck-lime">+{newItem.imageFiles.length}</span>}</div><textarea className="w-full bg-black border border-white/15 rounded-lg p-3 text-xs text-white outline-none resize-none h-20" placeholder="Instrucciones..." value={newItem.instructions} onChange={e => setNewItem({...newItem, instructions: e.target.value})}></textarea><button type="button" onClick={handleAddItem} className="w-full py-3 bg-white/10 text-white font-bold uppercase text-xs rounded-lg">Confirmar</button></div></div>)}
                        </div>
                    </div>
                    
                    {/* FINANZAS MODAL */}
                    <div className="space-y-6">
                        <div className="cyber-box"><h3 className="cyber-title mb-4 border-b border-white/10 pb-2">Estado</h3><select className="w-full bg-[#151515] text-white p-3 rounded-lg border border-white/20 outline-none font-bold uppercase text-sm" value={selectedOrder?.workflowStatus || 'Pendiente'} onChange={(e) => updateWorkflow(e.target.value)} disabled={!isEditing && viewMode === 'detail'}>{STATUS_OPTIONS.map(st => <option key={st}>{st}</option>)}</select></div>
                        <div className="cyber-box sticky top-20 border-vlyck-lime/20"><h3 className="cyber-title mb-4 border-b border-white/10 pb-2 text-vlyck-lime">Total a Pagar</h3><div className="space-y-2 mb-4 text-xs"><div className="flex justify-between"><span className="text-gray-400">Subtotal</span> <span className="text-white">${formData.itemsTotal.toLocaleString('es-CL')}</span></div><div className="flex justify-between"><span className="text-gray-400">Envío</span> <span className="text-blue-400">+${formData.shippingCost.toLocaleString('es-CL')}</span></div><div className="flex justify-between items-center"><span className="text-gray-400">Descuento</span><input type="number" className="w-20 bg-black border border-white/20 rounded text-right text-white p-1" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} disabled={!isEditing && viewMode === 'detail'} /></div><div className="border-t border-white/20 pt-2 flex justify-between text-base font-bold text-white"><span>Total</span><span>${formData.finalTotal.toLocaleString('es-CL')}</span></div></div><div className="bg-[#151515] p-3 rounded-xl border border-white/10 mb-4"><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Abonado</label><div className="flex items-center gap-2"><span className="text-lg text-vlyck-lime font-bold">$</span><input type="number" className="bg-transparent text-2xl font-black text-white w-full outline-none" value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} disabled={!isEditing && viewMode === 'detail'} /></div></div><div className="text-right mb-4"><p className="text-[10px] text-gray-500 uppercase font-bold">Saldo</p><p className={`text-2xl font-black ${formData.finalTotal - formData.deposit > 0 ? 'text-red-500' : 'text-green-500'}`}>${Math.max(0, formData.finalTotal - formData.deposit).toLocaleString('es-CL')}</p></div>{viewMode === 'detail' && formData.finalTotal - formData.deposit > 0 && !isEditing && (<button onClick={() => { setPayData({ id: selectedOrder._id, amount: formData.finalTotal - formData.deposit, method: 'Transferencia' }); setShowPayModal(true); }} className="w-full py-3 bg-vlyck-lime text-black font-bold uppercase text-xs rounded-xl shadow-lg">Cobrar Saldo</button>)}</div>
                        {viewMode === 'detail' && <button onClick={() => handleDelete(selectedOrder._id)} className="w-full py-3 text-red-500 font-bold uppercase text-xs border border-transparent hover:border-red-500/20 rounded-lg">Eliminar</button>}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* LIGHTBOX & MODALES */}
      {lightboxImg && <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}><img src={lightboxImg} className="max-w-full max-h-[90vh] object-contain rounded-lg" /><button className="absolute top-4 right-4 text-white"><span className="material-symbols-outlined text-4xl">close</span></button></div>}
      {showPayModal && (
           <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur flex items-center justify-center p-4">
              <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">Cobrar</h3>
                  <div className="mb-4"><label className="text-xs text-gray-500 block mb-1">Monto</label><input type="number" className="w-full bg-black border border-white/20 p-2 text-white rounded outline-none text-2xl font-black text-vlyck-lime" value={payData.amount} onChange={e => setPayData({...payData, amount: Number(e.target.value)})} /></div>
                  <div className="mb-6"><label className="text-xs text-gray-500 block mb-1">Método</label><select className="w-full bg-black border border-white/20 p-2 text-white rounded outline-none" value={payData.method} onChange={e => setPayData({...payData, method: e.target.value})}><option>Transferencia</option><option>Efectivo</option><option>Tarjeta (POS)</option></select></div>
                  <div className="flex gap-3"><button onClick={() => setShowPayModal(false)} className="flex-1 py-3 rounded-lg font-bold text-gray-400 hover:bg-white/10">Cancelar</button><button onClick={handlePayBalance} className="flex-1 py-3 bg-vlyck-lime text-black font-bold rounded-lg">Confirmar</button></div>
              </div>
          </div>
      )}
      {toast.show && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in"><div className={`px-6 py-3 rounded-full border flex items-center gap-3 backdrop-blur-md shadow-2xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-vlyck-lime/10 border-vlyck-lime text-vlyck-lime'}`}><span className="material-symbols-outlined">{toast.type === 'error' ? 'error' : 'check_circle'}</span><span className="font-bold text-sm uppercase">{toast.msg}</span></div></div>}
      <style>{`.cyber-box { @apply border border-white/10 rounded-2xl p-6 bg-[#0a0a0a] relative overflow-hidden; } .cyber-title { @apply text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2; }`}</style>
    </div>
  );
}

function Input({ label, value, onChange, disabled }) { return (<div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{label}</label><input type="text" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-vlyck-lime transition-colors disabled:opacity-50 focus:bg-black" value={value} onChange={onChange} disabled={disabled} /></div>); }
function Select({ label, value, onChange, options, disabled }) { return (<div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{label}</label><div className="relative"><select className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-vlyck-lime transition-colors disabled:opacity-50 appearance-none cursor-pointer focus:bg-black" value={value} onChange={onChange} disabled={disabled}>{options.map(opt => <option key={opt}>{opt}</option>)}</select><span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none material-symbols-outlined text-sm">expand_more</span></div></div>); }