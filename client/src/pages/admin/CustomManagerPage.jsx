import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// --- CONFIGURACIÓN ---
const PRICE_ONE = 8990;
const PRICE_PROMO = 8000; // 2x16000
const SHIPPING_OPTIONS = {
    'Retiro Centro Chillán': 0,
    'Domicilio Coihueco': 0,
    'Despacho Chillán': 1000,
    'Despacho Chillán Viejo': 2000
};
const CITIES = ['Chillán', 'Chillán Viejo', 'Coihueco'];
const MODELS = ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 15 Pro', 'Samsung S21', 'Samsung S23', 'Xiaomi Redmi Note'];
const STATUS_OPTIONS = ['Pendiente', 'Boceto Listo', 'Aprobado', 'En Producción', 'Terminado', 'Entregado'];

export default function CustomManagerPage() {
  const { userInfo } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Vistas
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'detail'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showFinished, setShowFinished] = useState(false);

  // Estados Auxiliares
  const [showPayModal, setShowPayModal] = useState(false);
  const [payData, setPayData] = useState({ id: '', amount: 0, method: 'Transferencia' });
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [lightboxImg, setLightboxImg] = useState(null);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    clientName: '', phone: '', source: 'Instagram', 
    city: 'Chillán', deliveryMethod: 'Retiro Centro Chillán', address: '',
    items: [], 
    discount: 0, deposit: 0,
    itemsTotal: 0, shippingCost: 0, finalTotal: 0
  });

  const [newItem, setNewItem] = useState({
      model: 'iPhone 11', instructions: '', 
      imageFiles: [], imageUrls: []
  });

  // --- CALCULADORA ---
  useEffect(() => {
    const qty = formData.items.length;
    let itemsPrice = (qty === 1) ? PRICE_ONE : (qty >= 2 ? qty * PRICE_PROMO : 0);
    const shippingPrice = SHIPPING_OPTIONS[formData.deliveryMethod] || 0;
    const total = itemsPrice + shippingPrice - (formData.discount || 0);

    setFormData(prev => ({
        ...prev,
        itemsTotal: itemsPrice,
        shippingCost: shippingPrice,
        finalTotal: total > 0 ? total : 0
    }));
  }, [formData.items, formData.deliveryMethod, formData.discount]);

  // --- FETCH DATOS ---
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

  const showToastMsg = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  // --- CAMBIO DE ESTADO (FIXED) ---
  const handleStatusChange = async (e, orderId) => {
      e.stopPropagation(); // ⛔ EVITA QUE SE ABRA EL MODAL
      const newStatus = e.target.value;

      // 1. Actualización Visual Inmediata
      const updatedOrders = orders.map(o => o._id === orderId ? { ...o, workflowStatus: newStatus } : o);
      setOrders(updatedOrders);

      // 2. Llamada al Backend Silenciosa
      try {
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          await axios.put(`/api/orders/${orderId}/manual-update`, { workflowStatus: newStatus }, config);
          showToastMsg(`Estado cambiado a: ${newStatus}`);
      } catch (error) {
          showToastMsg('Error al guardar estado', 'error');
          fetchCustomOrders(); // Revertir si falla
      }
  };

  // --- HANDLERS ITEMS ---
  const handleFileChange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
          setNewItem(prev => ({ ...prev, imageFiles: [...prev.imageFiles, ...files] }));
      }
  };

  const handleAddItem = () => {
      if (newItem.imageFiles.length === 0 && newItem.imageUrls.length === 0) return alert("Sube al menos una imagen.");
      setFormData(prev => ({ ...prev, items: [...prev.items, { ...newItem, idTemp: Date.now() }] }));
      setNewItem({ model: 'iPhone 11', instructions: '', imageFiles: [], imageUrls: [] });
  };

  const handleRemoveItem = (index) => {
      const updated = [...formData.items];
      updated.splice(index, 1);
      setFormData(prev => ({ ...prev, items: updated }));
  };

  const uploadImage = async (file) => {
      const formDataImg = new FormData();
      formDataImg.append('image', file);
      const { data } = await axios.post('/api/upload', formDataImg, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data;
  };

  // --- GUARDAR ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) return alert("Agrega al menos una carcasa.");
    
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    try {
        const processedItems = await Promise.all(formData.items.map(async (item) => {
            const uploadedUrls = await Promise.all(item.imageFiles.map(file => uploadImage(file)));
            const allImages = [...(item.imageUrls || []), ...uploadedUrls];
            const mainImage = allImages.length > 0 ? allImages[0] : '';
            
            return {
                product: '6973ad0c8e605928260af54a',
                name: `Personalizada - ${item.model}`,
                qty: 1, image: mainImage, originalLayers: allImages,
                price: formData.items.length >= 2 ? PRICE_PROMO : PRICE_ONE,
                category: 'Personalizadas', customInstructions: item.instructions
            };
        }));

        const payload = {
            orderItems: processedItems,
            guestInfo: { name: formData.clientName, phone: formData.phone, instagramUser: formData.source === 'Instagram' ? formData.clientName : '' },
            shippingAddress: { city: formData.city, address: formData.deliveryMethod.includes('Despacho') ? `${formData.address} (${formData.deliveryMethod})` : formData.deliveryMethod, country: 'Chile' },
            itemsPrice: formData.itemsTotal, shippingPrice: formData.shippingCost, totalPrice: formData.finalTotal, depositAmount: formData.deposit,
            remainingAmount: formData.finalTotal - formData.deposit,
            isPartiallyPaid: formData.deposit > 0 && formData.deposit < formData.finalTotal,
            isPaid: formData.deposit >= formData.finalTotal,
            orderSource: formData.source, isCustomOrder: true,
            workflowStatus: isEditing && selectedOrder ? selectedOrder.workflowStatus : 'Pendiente'
        };

        if (isEditing && selectedOrder) {
            await axios.put(`/api/orders/${selectedOrder._id}/manual-update`, payload, config);
            showToastMsg('Expediente actualizado');
        } else {
            await axios.post('/api/orders', payload, config);
            showToastMsg('Venta creada');
        }
        
        closeDetail();
        fetchCustomOrders();
    } catch (e) { console.error(e); showToastMsg('Error al guardar', 'error'); }
  };

  // --- ABRIR MODAL ---
  const openDetail = (order) => {
      setSelectedOrder(order);
      let method = 'Retiro Centro Chillán';
      let addr = '';
      const savedAddr = order.shippingAddress?.address || '';
      if (Object.keys(SHIPPING_OPTIONS).includes(savedAddr)) method = savedAddr;
      else if (savedAddr.includes('Despacho')) {
          method = savedAddr.includes('Viejo') ? 'Despacho Chillán Viejo' : 'Despacho Chillán';
          addr = savedAddr.split('(')[0].trim();
      }

      setFormData({
          clientName: order.guestInfo?.name || order.user?.name || '',
          phone: order.guestInfo?.phone || '',
          source: order.orderSource,
          city: order.shippingAddress?.city || 'Chillán',
          deliveryMethod: method, address: addr,
          items: order.orderItems.map(i => ({
              model: i.name.replace('Personalizada - ', ''),
              instructions: i.customInstructions,
              imageUrls: (i.originalLayers && i.originalLayers.length > 0) ? i.originalLayers : [i.image],
              imageFiles: [], idTemp: Math.random()
          })),
          deposit: order.depositAmount, discount: 0,
          itemsTotal: order.itemsPrice || 0, shippingCost: order.shippingPrice || 0, finalTotal: order.totalPrice
      });
      setIsEditing(false);
      setViewMode('detail');
  };

  const closeDetail = () => { setSelectedOrder(null); setIsEditing(false); resetForm(); setViewMode('list'); };
  const resetForm = () => { setFormData({ clientName: '', phone: '', source: 'Instagram', city: 'Chillán', deliveryMethod: 'Retiro Centro Chillán', address: '', items: [], discount: 0, deposit: 0, itemsTotal: 0, shippingCost: 0, finalTotal: 0 }); setNewItem({ model: 'iPhone 11', instructions: '', imageFiles: [], imageUrls: [] }); };

  const handlePayBalance = async (e) => {
      e.stopPropagation();
      e.preventDefault();
      try {
          await axios.put(`/api/orders/${payData.id}/pay-balance`, { amount: payData.amount, paymentMethod: payData.method }, { headers: { Authorization: `Bearer ${userInfo.token}` } });
          showToastMsg('Pago registrado'); setShowPayModal(false); fetchCustomOrders(); if(viewMode==='detail') closeDetail();
      } catch (e) { showToastMsg('Error pago', 'error'); }
  };

  const handleDelete = async (id) => {
      if(!window.confirm('¿Eliminar Pedido?')) return;
      try { await axios.delete(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${userInfo.token}` } }); showToastMsg('Pedido eliminado'); fetchCustomOrders(); if(viewMode==='detail') closeDetail(); } catch(e) { showToastMsg('Error al borrar', 'error'); }
  };

  if (loading) return <div className="text-center pt-20 text-vlyck-lime">Cargando...</div>;

  return (
    <div className="pb-20 relative min-h-screen">
      
      {/* VISTA 1: LISTADO (ESTILO HORIZONTAL CLÁSICO) */}
      {viewMode === 'list' && (
        <>
            <div className="flex flex-col xl:flex-row justify-between items-end mb-8 gap-6 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Gestión <span className="text-vlyck-lime">Personalizadas</span></h1>
                    <div className="flex gap-2 mt-4 bg-[#111] p-1 rounded-lg w-fit border border-white/10">
                        <button onClick={() => setShowFinished(false)} className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-all ${!showFinished ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-white'}`}>Activos</button>
                        <button onClick={() => setShowFinished(true)} className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-all ${showFinished ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-white'}`}>Historial</button>
                    </div>
                </div>
                <button onClick={() => { resetForm(); setViewMode('create'); }} className="bg-vlyck-lime text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(167,255,45,0.4)]">
                    <span className="material-symbols-outlined">add_circle</span> Nueva Venta
                </button>
            </div>

            <div className="flex flex-col gap-6">
                {orders.filter(o => showFinished ? o.workflowStatus === 'Entregado' : o.workflowStatus !== 'Entregado').map((order) => (
                    <div key={order._id} onClick={() => openDetail(order)} className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 relative group hover:border-vlyck-lime/30 transition-all cursor-pointer">
                        
                        {/* 1. Imagen Grande Vertical */}
                        <div className="w-full md:w-48 aspect-[3/4] bg-black rounded-xl overflow-hidden border border-white/5 relative shrink-0" onClick={(e) => { e.stopPropagation(); setLightboxImg(order.orderItems[0]?.image); }}>
                            <img src={order.orderItems[0]?.image} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                            {order.orderItems.length > 1 && (
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded font-bold border border-white/20">+{order.orderItems.length-1}</div>
                            )}
                        </div>

                        {/* 2. Información Central */}
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1">{order.guestInfo?.name || order.user?.name || 'Cliente'}</h3>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase border border-orange-500 text-orange-500">{order.orderSource}</span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase border border-white/20 text-gray-400">{order.shippingAddress?.city || 'Sin Ciudad'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); openDetail(order); }} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-sm">edit</span></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(order._id); }} className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Detalles Entrega</p>
                                        <p className="text-sm text-white font-bold mb-1">{order.shippingAddress?.address || 'Retiro en Tienda'}</p>
                                        <p className="text-xs text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">call</span> {order.guestInfo?.phone || 'S/N'}</p>
                                    </div>
                                    <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Instrucciones</p>
                                        {order.orderItems.map((item, idx) => (
                                            <div key={idx} className="mb-2 last:mb-0">
                                                <p className="text-xs text-gray-300 italic">"{item.customInstructions || 'Ninguna'}"</p>
                                                <p className="text-[10px] text-vlyck-lime font-bold mt-0.5">{item.name.replace('Personalizada - ', '')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Panel Lateral Derecho */}
                        <div className="w-full md:w-64 border-l border-white/10 md:pl-6 flex flex-col justify-between gap-4">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Estado Pedido</p>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <select 
                                        value={order.workflowStatus || 'Pendiente'}
                                        onChange={(e) => handleStatusChange(e, order._id)}
                                        className={`w-full text-xs font-bold p-2 rounded-lg border outline-none cursor-pointer appearance-none ${
                                            order.workflowStatus === 'Entregado' ? 'bg-green-500/10 border-green-500 text-green-500' : 
                                            order.workflowStatus === 'En Producción' ? 'bg-blue-500/10 border-blue-500 text-blue-500' :
                                            'bg-[#222] border-white/20 text-white'
                                        }`}
                                    >
                                        {STATUS_OPTIONS.map(st => <option key={st} value={st} className="bg-black text-white">{st}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-400"><span>Total</span> <span>${order.totalPrice.toLocaleString('es-CL')}</span></div>
                                <div className="flex justify-between text-xs text-green-500"><span>Pagado</span> <span>-${order.depositAmount.toLocaleString('es-CL')}</span></div>
                                <div className="border-t border-white/10 pt-2 flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-gray-500">SALDO</span>
                                    <span className={`text-xl font-black ${order.remainingAmount > 0 ? 'text-red-500' : 'text-gray-500'}`}>${order.remainingAmount.toLocaleString('es-CL')}</span>
                                </div>
                                
                                {order.remainingAmount > 0 ? (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setPayData({ id: order._id, amount: order.remainingAmount, method: 'Transferencia' }); setShowPayModal(true); }}
                                        className="w-full py-3 bg-vlyck-lime text-black font-black uppercase text-xs rounded-lg hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(167,255,45,0.3)]"
                                    >
                                        Pagar Saldo
                                    </button>
                                ) : (
                                    <div className="w-full py-2 bg-gray-800 text-gray-500 font-bold uppercase text-xs rounded-lg text-center">Pagado Completo</div>
                                )}
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        </>
      )}

      {/* VISTA 2: MODAL DETALLE / EDITAR (MODERNO) */}
      {(viewMode === 'create' || viewMode === 'detail') && (
        <div className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                {/* Navbar Modal */}
                <div className="flex justify-between items-center mb-8 bg-[#050505]/95 backdrop-blur sticky top-0 py-4 z-20 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <button onClick={closeDetail} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-outlined">arrow_back</span></button>
                        <h2 className="text-2xl font-black text-white uppercase">{viewMode === 'create' ? 'Nueva Venta' : selectedOrder?.guestInfo?.name || 'Expediente'}</h2>
                    </div>
                    <div className="flex gap-3">
                        {viewMode === 'detail' && !isEditing && <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs uppercase flex items-center gap-2"><span className="material-symbols-outlined text-sm">edit</span> Editar</button>}
                        {(viewMode === 'create' || isEditing) && (
                            <>
                                <button onClick={() => setIsEditing(false)} className="text-red-500 font-bold text-xs uppercase hover:underline mr-2">Cancelar</button>
                                <button onClick={handleSubmit} className="px-6 py-2 bg-vlyck-lime text-black rounded-lg font-black uppercase text-xs hover:scale-105 transition-transform shadow-lg shadow-vlyck-lime/20 flex items-center gap-2"><span className="material-symbols-outlined text-sm">save</span> Guardar</button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                    {/* DATOS IZQUIERDA */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="cyber-box">
                            <h3 className="cyber-title"><span className="material-symbols-outlined text-sm">person</span> Datos Cliente & Envío</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Nombre Cliente" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} disabled={!isEditing && viewMode === 'detail'} />
                                <Input label="Teléfono / WhatsApp" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={!isEditing && viewMode === 'detail'} />
                                <Select label="Origen" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} options={['Instagram', 'Facebook', 'WhatsApp', 'Presencial', 'Web']} disabled={!isEditing && viewMode === 'detail'} />
                                <Select label="Ciudad" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} options={CITIES} disabled={!isEditing && viewMode === 'detail'} />
                                <div className="md:col-span-2">
                                    <Select label="Método de Entrega" value={formData.deliveryMethod} onChange={e => setFormData({...formData, deliveryMethod: e.target.value})} options={Object.keys(SHIPPING_OPTIONS)} disabled={!isEditing && viewMode === 'detail'} />
                                </div>
                                {formData.deliveryMethod.includes('Despacho') && (
                                    <div className="md:col-span-2">
                                        <Input label="Dirección Exacta" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={!isEditing && viewMode === 'detail'} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="cyber-box">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
                                <h3 className="cyber-title mb-0 border-0 pb-0"><span className="material-symbols-outlined text-sm">phone_iphone</span> Carcasas ({formData.items.length})</h3>
                                {formData.items.length >= 2 && <span className="text-[10px] bg-vlyck-lime/20 text-vlyck-lime px-3 py-1 rounded font-black uppercase">Promo 2x$16.000</span>}
                            </div>
                            
                            <div className="space-y-4">
                                {formData.items.map((item, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-[#111] rounded-xl border border-white/5 relative group">
                                        <div className="flex flex-wrap gap-2 md:w-40 shrink-0">
                                            {(item.imageFiles && item.imageFiles.length > 0 ? item.imageFiles.map(f => URL.createObjectURL(f)) : item.imageUrls).map((src, i) => (
                                                <div key={i} onClick={() => setLightboxImg(src)} className="w-12 h-12 bg-black rounded border border-white/10 overflow-hidden cursor-zoom-in hover:border-vlyck-lime/50 transition-colors">
                                                    <img src={src} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex-1 pl-2">
                                            <h4 className="text-white font-bold text-lg">{item.model}</h4>
                                            <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">{item.instructions || 'Sin instrucciones'}</p>
                                        </div>
                                        {(viewMode === 'create' || isEditing) && <button onClick={() => handleRemoveItem(idx)} className="absolute top-2 right-2 text-red-500 opacity-50 hover:opacity-100"><span className="material-symbols-outlined">delete</span></button>}
                                    </div>
                                ))}
                            </div>

                            {(viewMode === 'create' || isEditing) && (
                                <div className="mt-8 bg-[#151515] p-5 rounded-xl border border-dashed border-white/20">
                                    <p className="text-xs font-bold text-vlyck-lime uppercase mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-sm">add_circle</span> Agregar Carcasa</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                        <Select label="Modelo" value={newItem.model} onChange={e => setNewItem({...newItem, model: e.target.value})} options={MODELS} />
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Imágenes Referencia</label>
                                            <div className="flex items-center gap-2">
                                                <label className="flex-1 h-[46px] bg-black border border-white/20 hover:border-vlyck-lime rounded-lg cursor-pointer text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2">
                                                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                                    <span className="text-xs font-bold">Seleccionar Fotos</span>
                                                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                                                </label>
                                            </div>
                                            {newItem.imageFiles.length > 0 && <span className="text-[10px] text-gray-500 self-center">+{newItem.imageFiles.length} fotos</span>}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Instrucciones</label>
                                            <textarea className="w-full bg-black border border-white/15 rounded-lg p-3 text-sm text-white outline-none focus:border-vlyck-lime resize-none h-24" placeholder="Ej: Fondo rojo, letras blancas..." value={newItem.instructions} onChange={e => setNewItem({...newItem, instructions: e.target.value})}></textarea>
                                        </div>
                                    </div>
                                    <button type="button" onClick={handleAddItem} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs rounded-lg border border-white/10">Confirmar Item</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- COLUMNA DERECHA: FINANZAS --- */}
                    <div className="space-y-6">
                        <div className="cyber-box sticky top-24 border-vlyck-lime/20 shadow-[0_0_30px_rgba(167,255,45,0.05)]">
                            <h3 className="cyber-title mb-4 border-b border-white/10 pb-2 text-vlyck-lime">Resumen Pago</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span> <span className="text-white font-mono">${formData.itemsTotal.toLocaleString('es-CL')}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-400">Envío</span> <span className="text-blue-400 font-mono">+${formData.shippingCost.toLocaleString('es-CL')}</span></div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-400 text-sm">Descuento</span>
                                    <div className="relative w-28 group">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none"><span className="text-gray-500 font-bold group-focus-within:text-vlyck-lime">$</span></div>
                                        <input type="number" className="w-full bg-black border border-white/20 rounded-md pl-6 pr-2 py-1 text-right text-white text-sm outline-none focus:border-vlyck-lime transition-all" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} disabled={!isEditing && viewMode === 'detail'} />
                                    </div>
                                </div>
                                <div className="border-t border-white/20 pt-4 flex justify-between items-end"><span className="text-sm font-bold text-gray-400 uppercase">Total</span><span className="text-3xl font-black text-white leading-none">${formData.finalTotal.toLocaleString('es-CL')}</span></div>
                            </div>
                            <div className="bg-[#151515] p-5 rounded-xl border border-white/10 mb-4">
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Abono Inicial / Pagado</label>
                                <div className="flex items-center gap-2"><span className="text-2xl text-vlyck-lime font-bold">$</span><input type="number" className="bg-transparent text-4xl font-black text-white w-full outline-none placeholder-gray-800" value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} disabled={!isEditing && viewMode === 'detail'} /></div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Saldo Pendiente</p>
                                <p className={`text-3xl font-black ${formData.finalTotal - formData.deposit > 0 ? 'text-red-500' : 'text-green-500'}`}>${Math.max(0, formData.finalTotal - formData.deposit).toLocaleString('es-CL')}</p>
                            </div>
                            {viewMode === 'detail' && formData.finalTotal - formData.deposit > 0 && !isEditing && (
                                <button onClick={() => { setPayData({ id: selectedOrder._id, amount: formData.finalTotal - formData.deposit, method: 'Transferencia' }); setShowPayModal(true); }} className="w-full mt-6 py-4 bg-vlyck-lime text-black font-black uppercase text-sm rounded-xl shadow-lg hover:scale-[1.02] transition-transform">Registrar Pago Saldo</button>
                            )}
                        </div>
                        {viewMode === 'detail' && <button onClick={() => handleDelete(selectedOrder._id)} className="w-full py-3 text-red-500 font-bold uppercase text-xs hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20">Eliminar Pedido</button>}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- LIGHTBOX --- */}
      {lightboxImg && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightboxImg(null)}>
              <img src={lightboxImg} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
              <button className="absolute top-4 right-4 text-white hover:text-vlyck-lime"><span className="material-symbols-outlined text-4xl">close</span></button>
          </div>
      )}

      {/* MODAL PAGO */}
      {showPayModal && (
           <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur flex items-center justify-center p-4">
              <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">Registrar Pago</h3>
                  <div className="mb-4"><label className="text-xs text-gray-500 block mb-1">Monto a pagar</label><input type="number" className="w-full bg-black border border-white/20 p-2 text-white rounded outline-none text-2xl font-black text-vlyck-lime" value={payData.amount} onChange={e => setPayData({...payData, amount: Number(e.target.value)})} /></div>
                  <div className="mb-6"><label className="text-xs text-gray-500 block mb-1">Método</label><select className="w-full bg-black border border-white/20 p-2 text-white rounded outline-none" value={payData.method} onChange={e => setPayData({...payData, method: e.target.value})}><option>Transferencia</option><option>Efectivo</option><option>Tarjeta (POS)</option></select></div>
                  <div className="flex gap-3"><button onClick={() => setShowPayModal(false)} className="flex-1 py-3 rounded-lg font-bold text-gray-400 hover:bg-white/10">Cancelar</button><button onClick={handlePayBalance} className="flex-1 py-3 bg-vlyck-lime text-black font-bold rounded-lg hover:brightness-110">Confirmar</button></div>
              </div>
          </div>
      )}
      
      {toast.show && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in"><div className={`px-6 py-3 rounded-full border flex items-center gap-3 backdrop-blur-md shadow-2xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-vlyck-lime/10 border-vlyck-lime text-vlyck-lime'}`}><span className="material-symbols-outlined">{toast.type === 'error' ? 'error' : 'check_circle'}</span><span className="font-bold text-sm uppercase">{toast.msg}</span></div></div>}

      <style>{`
        .cyber-box { @apply border border-white/10 rounded-2xl p-6 bg-[#0a0a0a] relative overflow-hidden; }
        .cyber-title { @apply text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2; }
      `}</style>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
function Input({ label, value, onChange, disabled }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{label}</label>
            <input type="text" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-vlyck-lime transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:bg-black" value={value} onChange={onChange} disabled={disabled} />
        </div>
    );
}

function Select({ label, value, onChange, options, disabled }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{label}</label>
            <div className="relative">
                <select className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-vlyck-lime transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer focus:bg-black" value={value} onChange={onChange} disabled={disabled}>
                    {options.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none material-symbols-outlined text-sm">expand_more</span>
            </div>
        </div>
    );
}