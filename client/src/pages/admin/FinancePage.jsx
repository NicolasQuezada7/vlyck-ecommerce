import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function FinancePage() {
  const { userInfo } = useAuth();
  
  // --- ESTADOS ---
  const [expenses, setExpenses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // --- FILTROS ---
  const [dateFilter, setDateFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [typeFilter, setTypeFilter] = useState('Todos'); 
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [supplierFilter, setSupplierFilter] = useState('Todos');

  // --- MODALES & FORMULARIOS ---
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingSupplierId, setEditingSupplierId] = useState(null);

  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Insumos', supplier: '', attachments: [] });
  const [supplierForm, setSupplierForm] = useState({ name: '', rut: '', contactName: '', category: 'General' });
  const [uploading, setUploading] = useState(false);

  // --- ESTADOS DE UI (TOAST Y CONFIRM) ---
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', msg: '', action: null, isLoading: false });

  // --- CARGA DE DATOS ---
  useEffect(() => { fetchData(); }, [userInfo]);

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const [expRes, supRes, ordRes] = await Promise.all([
          axios.get('/api/expenses', config),
          axios.get('/api/expenses/suppliers', config),
          axios.get('/api/orders', config)
      ]);
      setExpenses(expRes.data);
      setSuppliers(supRes.data);
      setOrders(ordRes.data);
      setLoading(false);
    } catch (error) { 
        console.error(error); 
        setLoading(false); 
        showToastMsg('Error cargando datos', 'error');
    }
  };

  // --- HELPER NOTIFICACIONES ---
  const showToastMsg = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  // --- LOGICA ARCHIVOS ---
  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        const { data } = await axios.post('/api/upload', formData, config);
        setExpenseForm(prev => ({ ...prev, attachments: [...prev.attachments, data] }));
        setUploading(false);
    } catch (error) { 
        console.error(error); 
        setUploading(false); 
        showToastMsg('Error al subir imagen', 'error'); 
    }
  };

  const removeAttachment = (indexToRemove) => {
    setExpenseForm(prev => ({
        ...prev,
        attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
    }));
  };

  // --- HANDLERS (CRUD CON MODAL PERSONALIZADO) ---
  
  // 1. GASTOS
  const promptDeleteExpense = (id) => {
      setConfirmModal({
          show: true,
          title: 'Eliminar Gasto',
          msg: '¿Estás seguro de eliminar este gasto? Esta acción es irreversible.',
          action: () => executeDeleteExpense(id)
      });
  };

  const executeDeleteExpense = async (id) => {
      setConfirmModal(prev => ({ ...prev, isLoading: true }));
      try {
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          await axios.delete(`/api/expenses/${id}`, config);
          fetchData();
          showToastMsg('Gasto eliminado correctamente');
          setConfirmModal({ show: false, title: '', msg: '', action: null, isLoading: false });
      } catch (error) { 
          showToastMsg('Error al eliminar gasto', 'error');
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
      }
  };

  // 2. ORDENES (VENTAS)
  const promptDeleteOrder = (id) => {
      setConfirmModal({
          show: true,
          title: 'Eliminar Venta',
          msg: '⚠️ ALERTA: Esto eliminará el registro de venta y RESTAURARÁ el stock de los productos. ¿Continuar?',
          action: () => executeDeleteOrder(id)
      });
  };

  const executeDeleteOrder = async (id) => {
      setConfirmModal(prev => ({ ...prev, isLoading: true }));
      try {
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          await axios.delete(`/api/orders/${id}`, config);
          fetchData();
          showToastMsg('Venta eliminada y stock restaurado');
          setConfirmModal({ show: false, title: '', msg: '', action: null, isLoading: false });
      } catch (error) { 
          showToastMsg('Error al eliminar orden', 'error'); 
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
      }
  };

  // 3. PROVEEDORES
  const promptDeleteSupplier = (id) => {
      setConfirmModal({
          show: true,
          title: 'Eliminar Proveedor',
          msg: '¿Eliminar este proveedor de la base de datos?',
          action: () => executeDeleteSupplier(id)
      });
  };

  const executeDeleteSupplier = async (id) => {
      setConfirmModal(prev => ({ ...prev, isLoading: true }));
      try {
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          await axios.delete(`/api/expenses/suppliers/${id}`, config);
          fetchData();
          showToastMsg('Proveedor eliminado');
          setConfirmModal({ show: false, title: '', msg: '', action: null, isLoading: false });
      } catch (error) { 
          showToastMsg('Error al eliminar proveedor', 'error');
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
      }
  };

  const openEditExpense = (exp) => {
      setEditingExpenseId(exp._id);
      let combinedAttachments = exp.attachments || [];
      if(exp.invoiceUrl && !combinedAttachments.includes(exp.invoiceUrl)) {
          combinedAttachments.push(exp.invoiceUrl);
      }
      setExpenseForm({
          description: exp.description,
          amount: exp.amount,
          category: exp.category,
          supplier: exp.supplier?._id || '',
          attachments: combinedAttachments
      });
      setShowExpenseModal(true);
  };

  const openEditSupplier = (sup) => {
      setEditingSupplierId(sup._id);
      setSupplierForm({ name: sup.name, rut: sup.rut, contactName: sup.contactName, category: sup.category });
      setShowSupplierModal(true);
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const selectedSup = suppliers.find(s => s._id === expenseForm.supplier);
        const payload = { ...expenseForm, supplierName: selectedSup ? selectedSup.name : 'Varios' };

        if (editingExpenseId) {
            await axios.put(`/api/expenses/${editingExpenseId}`, payload, config);
            showToastMsg('Gasto actualizado');
        } else {
            await axios.post('/api/expenses', payload, config);
            showToastMsg('Gasto registrado');
        }
        setShowExpenseModal(false);
        setEditingExpenseId(null);
        setExpenseForm({ description: '', amount: '', category: 'Insumos', supplier: '', attachments: [] });
        fetchData(); 
    } catch (error) { showToastMsg('Error al guardar gasto', 'error'); }
  };

  const submitSupplier = async (e) => {
    e.preventDefault();
    try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        if (editingSupplierId) {
            await axios.put(`/api/expenses/suppliers/${editingSupplierId}`, supplierForm, config);
            showToastMsg('Proveedor actualizado');
        } else {
            await axios.post('/api/expenses/suppliers', supplierForm, config);
            showToastMsg('Proveedor creado');
        }
        setShowSupplierModal(false);
        setEditingSupplierId(null);
        setSupplierForm({ name: '', rut: '', contactName: '', category: 'General' });
        fetchData(); 
    } catch (error) { showToastMsg('Error al guardar proveedor', 'error'); }
  };

  // --- CÁLCULOS Y FUSIÓN DE DATOS ---
  const allTransactions = [
      // 1. GASTOS
      ...expenses.map(e => ({ 
          ...e, 
          type: 'Gasto', 
          dateObj: new Date(e.date),
          displayAmount: -e.amount,
          colDescription: e.description,
          colSupplierOrItems: e.supplier ? e.supplier.name : (e.supplierName || 'Varios')
      })),
      
      // 2. INGRESOS (Solo Ventas PAGADAS)
      ...orders.filter(o => o.isPaid).map(o => { 
          const productList = o.orderItems.map(item => `${item.qty}x ${item.name}`).join(', ');
          
          return {
            _id: o._id,
            date: o.paidAt || o.createdAt,
            dateObj: new Date(o.paidAt || o.createdAt),
            amount: o.totalPrice,
            displayAmount: o.totalPrice,
            type: 'Ingreso',
            category: 'Venta',
            attachments: [],
            colDescription: `Venta #${o._id.substring(20, 24)}`,
            colSupplierOrItems: productList,
            internalLink: `/order/${o._id}`,
            isPaid: o.isPaid
          }
      })
  ].sort((a, b) => b.dateObj - a.dateObj);

  // --- FILTRADO ---
  const filteredTransactions = allTransactions.filter(trx => {
    const trxDate = new Date(trx.date);
    const matchMonth = trxDate.getMonth() + 1 === parseInt(dateFilter.month) && trxDate.getFullYear() === parseInt(dateFilter.year);
    
    let matchType = true;
    if(typeFilter === 'Ingresos') matchType = trx.type === 'Ingreso';
    if(typeFilter === 'Gastos') matchType = trx.type === 'Gasto';

    let matchCategory = true;
    if(categoryFilter !== 'Todas') matchCategory = trx.category === categoryFilter;

    let matchSupplier = true;
    if(supplierFilter !== 'Todos') {
        if(trx.type === 'Ingreso') matchSupplier = false; 
        else matchSupplier = (trx.supplier?._id === supplierFilter || trx.supplier === supplierFilter);
    }

    return matchMonth && matchType && matchCategory && matchSupplier;
  });

  const totalIncome = orders.filter(o => o.isPaid).reduce((acc, o) => acc + o.totalPrice, 0); 
  const totalExpensesCalc = expenses.reduce((acc, e) => acc + e.amount, 0);
  const profit = totalIncome - totalExpensesCalc;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      
      <style>{` ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0d0d0d; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; } `}</style>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full w-full">
        <header className="border-b border-white/5 bg-[#050505]/50 backdrop-blur pt-6 md:pt-8 px-4 md:px-8 shrink-0 flex flex-col gap-6">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-vlyck-lime rounded-xl flex items-center justify-center shadow-lg shadow-vlyck-lime/20">
                        <span className="material-symbols-outlined text-black font-bold text-xl">payments</span>
                    </div>
                    <div>
                        <h1 className="font-mono text-xl md:text-2xl font-bold tracking-tight text-white">FINANZAS</h1>
                        <p className="text-xs text-gray-500 font-mono">Control de Caja</p>
                    </div>
               </div>
               <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                    <button onClick={() => { setEditingSupplierId(null); setSupplierForm({name:'', rut:'', contactName:'', category:'General'}); setShowSupplierModal(true); }} className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-bold text-white flex justify-center items-center gap-2">
                        <span className="material-symbols-outlined text-sm">person_add</span> Proveedor
                    </button>
                    <button onClick={() => { setEditingExpenseId(null); setExpenseForm({description:'', amount:'', category:'Insumos', supplier:'', attachments:[]}); setShowExpenseModal(true); }} className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-vlyck-lime text-black text-xs font-black hover:shadow-lg transition-all flex justify-center items-center gap-2">
                        <span className="material-symbols-outlined text-sm font-bold">add</span> Gasto
                    </button>
               </div>
           </div>

           {/* Tabs Movibles */}
           <div className="flex items-center gap-6 text-sm font-medium overflow-x-auto hide-scrollbar pb-3">
                <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap flex items-center gap-2 ${activeTab === 'overview' ? 'text-vlyck-lime font-bold' : 'text-gray-500'}`}>
                    <span className="material-symbols-outlined text-lg">dashboard</span> Resumen
                </button>
                <button onClick={() => setActiveTab('transactions')} className={`whitespace-nowrap flex items-center gap-2 ${activeTab === 'transactions' ? 'text-vlyck-lime font-bold' : 'text-gray-500'}`}>
                    <span className="material-symbols-outlined text-lg">list_alt</span> Movimientos
                </button>
                <button onClick={() => setActiveTab('suppliers')} className={`whitespace-nowrap flex items-center gap-2 ${activeTab === 'suppliers' ? 'text-vlyck-lime font-bold' : 'text-gray-500'}`}>
                    <span className="material-symbols-outlined text-lg">groups</span> Proveedores
                </button>
           </div>
        </header>

        <div className="flex-1 p-4 md:p-8 pb-32">
           
           {/* VISTA 1: OVERVIEW */}
           {activeTab === 'overview' && (
               <div className="animate-fade-in space-y-8">
                   {/* KPI Cards */}
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                      <div className="bg-[#111] p-5 md:p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                          <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Utilidad Neta</p>
                          <h3 className={`text-2xl md:text-3xl font-mono font-black ${profit >= 0 ? 'text-vlyck-lime' : 'text-red-500'}`}>$ {profit.toLocaleString()}</h3>
                          <span className="material-symbols-outlined absolute top-4 right-4 text-4xl opacity-10">account_balance_wallet</span>
                      </div>
                      <div className="bg-[#111] p-5 md:p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                          <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Ingresos Totales</p>
                          <h3 className="text-2xl md:text-3xl font-mono font-black text-white">$ {totalIncome.toLocaleString()}</h3>
                          <span className="material-symbols-outlined absolute top-4 right-4 text-4xl opacity-10 text-green-500">trending_up</span>
                      </div>
                      <div className="bg-[#111] p-5 md:p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                          <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Gastos Totales</p>
                          <h3 className="text-2xl md:text-3xl font-mono font-black text-red-500">$ {totalExpensesCalc.toLocaleString()}</h3>
                          <span className="material-symbols-outlined absolute top-4 right-4 text-4xl opacity-10 text-red-500">trending_down</span>
                      </div>
                      <div className="bg-[#111] p-5 md:p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                          <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Proveedores</p>
                          <h3 className="text-2xl md:text-3xl font-mono font-black text-vlyck-cyan">{suppliers.length}</h3>
                          <span className="material-symbols-outlined absolute top-4 right-4 text-4xl opacity-10 text-cyan-500">store</span>
                      </div>
                   </div>
                   
                   {/* Filtros */}
                   <div className="flex flex-col md:flex-row gap-4 bg-[#111] p-4 rounded-xl border border-white/10">
                        <select className="bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none" value={dateFilter.month} onChange={e => setDateFilter({...dateFilter, month: e.target.value})}>
                            {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Mes {m}</option>)}
                        </select>
                        <select className="bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                            <option value="Todos">Todos los Movimientos</option>
                            <option value="Ingresos">Solo Ingresos (Ventas)</option>
                            <option value="Gastos">Solo Gastos</option>
                        </select>
                        <select className="bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                            <option value="Todas">Todas las Categorías</option>
                            <option>Insumos</option><option>Publicidad</option><option>Envíos</option><option>Otros</option><option>Venta</option>
                        </select>
                   </div>
                   
                   <TransactionsTable 
                       transactions={filteredTransactions} 
                       onDeleteExpense={promptDeleteExpense} 
                       onDeleteOrder={promptDeleteOrder} 
                       onEdit={openEditExpense} 
                   />
               </div>
           )}

           {/* VISTA 2: TRANSACCIONES */}
           {activeTab === 'transactions' && (
               <div className="animate-fade-in">
                   <TransactionsTable 
                       transactions={filteredTransactions} 
                       onDeleteExpense={promptDeleteExpense} 
                       onDeleteOrder={promptDeleteOrder} 
                       onEdit={openEditExpense} 
                   />
               </div>
           )}

           {/* VISTA 3: PROVEEDORES */}
           {activeTab === 'suppliers' && (
               <div className="animate-fade-in">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {suppliers.map(sup => (
                           <div key={sup._id} className="bg-[#111] p-5 rounded-xl border border-white/10 hover:border-vlyck-cyan/50 transition-colors group relative">
                               <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => openEditSupplier(sup)} className="p-1.5 bg-white/10 rounded text-white"><span className="material-symbols-outlined text-sm">edit</span></button>
                                   <button onClick={() => promptDeleteSupplier(sup._id)} className="p-1.5 bg-red-500/10 rounded text-red-500"><span className="material-symbols-outlined text-sm">delete</span></button>
                               </div>
                               <h3 className="font-bold text-lg text-white">{sup.name}</h3>
                               <p className="text-sm text-gray-500 mb-4">{sup.contactName}</p>
                               <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400 uppercase">{sup.category}</span>
                           </div>
                       ))}
                   </div>
               </div>
           )}
        </div>
      </main>

      {/* --- MODALES FORMULARIOS --- */}
      {showExpenseModal && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl bg-[#111] rounded-3xl border border-white/20 p-6 md:p-8 shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
               <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-mono font-bold text-white">{editingExpenseId ? 'Editar Gasto' : 'Nuevo Gasto'}</h2>
                  <button onClick={() => setShowExpenseModal(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400"><span className="material-symbols-outlined">close</span></button>
               </div>

               <form onSubmit={submitExpense} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2"><label className="text-xs text-gray-500 font-bold mb-1 block">Descripción</label><input required value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white focus:border-vlyck-lime outline-none transition-colors" placeholder="Ej: Compra de carcasas"/></div>
                  <div><label className="text-xs text-gray-500 font-bold mb-1 block">Monto</label><input required type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white focus:border-vlyck-lime outline-none transition-colors" placeholder="$"/></div>
                  <div>
                      <label className="text-xs text-gray-500 font-bold mb-1 block">Categoría</label>
                      <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white focus:border-vlyck-lime outline-none transition-colors">
                         <option>Insumos</option><option>Publicidad</option><option>Envíos</option><option>Otros</option>
                      </select>
                  </div>
                  <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 font-bold mb-1 block">Proveedor (Opcional)</label>
                      <select value={expenseForm.supplier} onChange={e => setExpenseForm({...expenseForm, supplier: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white focus:border-vlyck-lime outline-none transition-colors">
                           <option value="">Seleccionar Proveedor...</option>
                           {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                      <label className="text-xs uppercase font-bold text-gray-500">Comprobantes</label>
                      <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-white/5 cursor-pointer relative transition-colors">
                          <input type="file" onChange={handleUploadFile} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" />
                          <div className="bg-white/5 p-3 rounded-full mb-2 text-vlyck-lime"><span className="material-symbols-outlined">cloud_upload</span></div>
                          {uploading ? <p className="text-xs text-vlyck-lime animate-pulse">Subiendo...</p> : <p className="text-xs text-gray-500 font-bold">Toca para subir (+)</p>}
                      </div>
                      {expenseForm.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                              {expenseForm.attachments.map((url, idx) => (
                                  <div key={idx} className="relative w-16 h-16 bg-white/5 rounded-lg border border-white/10 overflow-hidden group">
                                      {url.endsWith('.pdf') ? <div className="flex items-center justify-center h-full text-red-500"><span className="material-symbols-outlined">picture_as_pdf</span></div> : <img src={url} className="w-full h-full object-cover" />}
                                      <button type="button" onClick={() => removeAttachment(idx)} className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                      <button type="button" onClick={() => setShowExpenseModal(false)} className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5">Cancelar</button>
                      <button type="submit" disabled={uploading} className="px-8 py-3 rounded-xl bg-vlyck-lime text-black font-black hover:scale-105 transition-transform shadow-lg shadow-vlyck-lime/20">Guardar</button>
                  </div>
               </form>
            </div>
         </div>
      )}
      
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-[#111] rounded-3xl border border-white/20 p-8 shadow-2xl relative animate-fade-in">
                <h2 className="text-2xl font-mono font-bold text-white mb-6">Nuevo Proveedor</h2>
                <button onClick={() => setShowSupplierModal(false)} className="absolute top-4 right-4 text-gray-400"><span className="material-symbols-outlined">close</span></button>
                <form onSubmit={submitSupplier} className="flex flex-col gap-4">
                    <input required value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white" placeholder="Nombre Empresa"/>
                    <input value={supplierForm.rut} onChange={e => setSupplierForm({...supplierForm, rut: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white" placeholder="RUT"/>
                    <input value={supplierForm.contactName} onChange={e => setSupplierForm({...supplierForm, contactName: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white" placeholder="Contacto (Nombre)"/>
                    <button type="submit" className="mt-4 px-8 py-3 rounded-xl bg-vlyck-cyan text-black font-bold hover:brightness-110 transition-all">Guardar</button>
                </form>
            </div>
        </div>
      )}

      {/* --- NUEVO: MODAL DE CONFIRMACIÓN (REEMPLAZA ALERTS) --- */}
      {confirmModal.show && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-[#111] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-bounce-in relative">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{confirmModal.title}</h3>
                      <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                          {confirmModal.msg}
                      </p>
                      
                      <div className="flex gap-3 w-full">
                          <button 
                              onClick={() => setConfirmModal({ ...confirmModal, show: false })} 
                              className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-colors text-xs uppercase"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={confirmModal.action}
                              disabled={confirmModal.isLoading}
                              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 text-xs uppercase disabled:opacity-50 flex justify-center items-center gap-2"
                          >
                              {confirmModal.isLoading ? (
                                  <>Procesando <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span></>
                              ) : 'Confirmar'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- TOAST NOTIFICATIONS --- */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
            <div className={`px-6 py-3 rounded-full border flex items-center gap-3 backdrop-blur-md shadow-2xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-vlyck-lime/10 border-vlyck-lime text-vlyck-lime'}`}>
                <span className="material-symbols-outlined">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                <span className="font-bold text-sm uppercase">{toast.msg}</span>
            </div>
        </div>
      )}

    </div>
  );
}

// --- TABLA UNIFICADA (RESPONSIVE: CARDS EN MÓVIL, TABLA EN PC) ---
function TransactionsTable({ transactions, onDeleteExpense, onDeleteOrder, onEdit }) {
    if (transactions.length === 0) {
        return <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-[#111]">No hay movimientos en este periodo.</div>;
    }

    return (
        <>
            {/* VISTA MÓVIL: TARJETAS ORDENADAS (MODIFICADO) */}
            <div className="md:hidden space-y-3">
                {transactions.map(trx => (
                    <div key={trx._id} className="bg-[#111] p-4 rounded-xl border border-white/10 shadow-lg flex items-start gap-4">
                        
                        {/* COLUMNA IZQUIERDA: ICONO + DESCRIPCIÓN (EXPANDIBLE) */}
                        <div className="flex-1 min-w-0 flex gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-1 ${trx.type === 'Ingreso' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                <span className="material-symbols-outlined text-xl">{trx.type === 'Ingreso' ? 'arrow_upward' : 'arrow_downward'}</span>
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                                {/* Nombre completo sin truncate */}
                                <h4 className="font-bold text-white text-sm leading-tight mb-1">{trx.colDescription}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-500">{new Date(trx.date).toLocaleDateString()}</span>
                                    <span className="text-[9px] text-gray-400 bg-white/5 px-1.5 rounded uppercase">{trx.category}</span>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: MONTO + BOTONES (FIJA) */}
                        <div className="flex flex-col items-end justify-between shrink-0 gap-2">
                            {/* Monto: whitespace-nowrap evita que se corte */}
                            <p className={`font-mono font-black text-sm whitespace-nowrap ${trx.type === 'Ingreso' ? 'text-vlyck-lime' : 'text-white'}`}>
                                {trx.type === 'Ingreso' ? '+' : '-'}${Math.abs(trx.amount).toLocaleString()}
                            </p>
                            
                            {/* Acciones compactas */}
                            <div className="flex gap-2">
                                {trx.type === 'Gasto' ? (
                                    <>
                                        <button onClick={() => onEdit(trx)} className="text-gray-500 hover:text-white"><span className="material-symbols-outlined text-lg">edit</span></button>
                                        <button onClick={() => onDeleteExpense(trx._id)} className="text-red-500/50 hover:text-red-500"><span className="material-symbols-outlined text-lg">delete</span></button>
                                    </>
                                ) : (
                                    <button onClick={() => onDeleteOrder(trx._id)} className="text-red-500/50 hover:text-red-500"><span className="material-symbols-outlined text-lg">delete_forever</span></button>
                                )}
                            </div>
                        </div>

                    </div>
                ))}
            </div>

            {/* VISTA PC: TABLA (ORIGINAL) */}
            <div className="hidden md:block bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                     <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
                        <tr>
                           <th className="p-4">Fecha</th>
                           <th className="p-4">Tipo</th>
                           <th className="p-4">Descripción / Productos</th>
                           <th className="p-4">Categoría</th>
                           <th className="p-4 text-center">Comprobante</th>
                           <th className="p-4 text-right">Monto</th>
                           <th className="p-4 text-right">Acciones</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5 text-sm">
                        {transactions.map(trx => (
                           <tr key={trx._id} className="group hover:bg-white/5 transition-colors">
                              <td className="p-4 text-gray-400 font-mono">{new Date(trx.date).toLocaleDateString()}</td>
                              <td className="p-4">
                                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${trx.type === 'Ingreso' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    {trx.type}
                                 </span>
                              </td>
                              <td className="p-4 text-white">
                                 <div className="font-bold">{trx.colDescription}</div>
                                 <div className="text-xs text-gray-500 truncate max-w-[200px]" title={trx.colSupplierOrItems}>{trx.colSupplierOrItems}</div>
                              </td>
                              <td className="p-4">
                                 <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 uppercase">
                                    {trx.category}
                                 </span>
                              </td>
                              
                              <td className="p-4 text-center">
                                 {trx.type === 'Ingreso' ? (
                                    <Link to={trx.internalLink} target="_blank" className="flex items-center justify-center gap-1 text-vlyck-cyan hover:text-white transition-colors" title="Ver Boleta">
                                       <span className="material-symbols-outlined text-xl">receipt_long</span>
                                    </Link>
                                 ) : (
                                    (trx.attachments?.length > 0 || trx.invoiceUrl) ? (
                                        <div className="flex justify-center -space-x-2">
                                            {trx.attachments && trx.attachments.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#222] border border-white/10 flex items-center justify-center hover:scale-110 transition-transform hover:z-10 hover:border-vlyck-lime shadow-lg">
                                                    {url.endsWith('.pdf') ? <span className="material-symbols-outlined text-[14px] text-red-500">picture_as_pdf</span> : <span className="material-symbols-outlined text-[14px] text-vlyck-lime">image</span>}
                                                </a>
                                            ))}
                                            {/* Retrocompatibilidad */}
                                            {trx.invoiceUrl && (!trx.attachments || !trx.attachments.includes(trx.invoiceUrl)) && (
                                                <a href={trx.invoiceUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#222] border border-white/10 flex items-center justify-center hover:scale-110 transition-transform hover:z-10 hover:border-vlyck-lime shadow-lg">
                                                    <span className="material-symbols-outlined text-[14px] text-blue-400">description</span>
                                                </a>
                                            )}
                                        </div>
                                    ) : <span className="text-gray-700 text-xs">-</span>
                                 )}
                              </td>

                              <td className="p-4 text-right">
                                 <span className={`font-mono font-bold text-base ${trx.type === 'Ingreso' ? 'text-vlyck-lime' : 'text-white'}`}>
                                    {trx.type === 'Ingreso' ? '+' : '-'}${Math.abs(trx.amount).toLocaleString()}
                                 </span>
                              </td>
                              
                              <td className="p-4 text-right flex justify-end gap-2">
                                 {trx.type === 'Gasto' ? (
                                    <>
                                        <button onClick={() => onEdit(trx)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><span className="material-symbols-outlined text-sm">edit</span></button>
                                        <button onClick={() => onDeleteExpense(trx._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                                    </>
                                 ) : (
                                    <button onClick={() => onDeleteOrder(trx._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors" title="Eliminar Venta y Revertir Stock">
                                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                                    </button>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                </table>
            </div>
        </>
    );
}