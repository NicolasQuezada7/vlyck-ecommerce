import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function FinancePage() {
  const { userInfo } = useAuth();
  
  // --- ESTADOS DE DATOS ---
  const [expenses, setExpenses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE VISTA (TABS) ---
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'transactions', 'suppliers'

  // Filtros
  const [dateFilter, setDateFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [supplierFilter, setSupplierFilter] = useState('Todos');

  // Modales
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // Formularios
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Infrastructure', supplier: '', image: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', rut: '', contactName: '', category: 'General' });
  const [uploading, setUploading] = useState(false);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetchData();
  }, [userInfo]);

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
    } catch (error) { console.error(error); setLoading(false); }
  };

  // --- HANDLERS (Iguales que antes) ---
  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        const { data } = await axios.post('/api/upload', formData, config);
        setExpenseForm({ ...expenseForm, image: data });
        setUploading(false);
    } catch (error) {
        console.error(error);
        setUploading(false);
        alert('Error al subir archivo');
    }
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const selectedSup = suppliers.find(s => s._id === expenseForm.supplier);
        const payload = {
            ...expenseForm,
            supplierName: selectedSup ? selectedSup.name : 'Varios',
            invoiceUrl: expenseForm.image
        };
        await axios.post('/api/expenses', payload, config);
        alert('✅ Gasto registrado');
        setShowExpenseModal(false);
        setExpenseForm({ description: '', amount: '', category: 'Infrastructure', supplier: '', image: '' });
        fetchData(); 
    } catch (error) { alert('Error al guardar'); }
  };

  const submitSupplier = async (e) => {
    e.preventDefault();
    try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.post('/api/expenses/suppliers', supplierForm, config);
        alert('✅ Proveedor creado');
        setShowSupplierModal(false);
        setSupplierForm({ name: '', rut: '', contactName: '', category: 'General' });
        fetchData(); 
    } catch (error) { alert('Error al crear proveedor'); }
  };

  // --- CÁLCULOS ---
  const filteredExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    const matchMonth = expDate.getMonth() + 1 === parseInt(dateFilter.month) && expDate.getFullYear() === parseInt(dateFilter.year);
    const matchSupplier = supplierFilter !== 'Todos' ? (exp.supplier?._id === supplierFilter || exp.supplier === supplierFilter) : true;
    const matchCategory = categoryFilter !== 'Todas' ? exp.category === categoryFilter : true;
    return matchMonth && matchSupplier && matchCategory;
  });

  const totalIncome = orders.filter(o => o.isPaid).reduce((acc, o) => acc + o.totalPrice, 0); 
  const totalExpensesCalc = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const profit = totalIncome - totalExpensesCalc;

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* Scrollbar Styles */}
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d0d0d; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>

      {/* ❌ ELIMINADO EL ASIDE INTERNO (SIDEBAR DOBLE) */}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
        
        {/* Header & Tabs */}
        <header className="border-b border-white/5 bg-[#050505]/50 backdrop-blur pt-8 px-8 shrink-0 flex flex-col gap-6">
           <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-vlyck-lime rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-black font-bold text-xl">diamond</span>
                    </div>
                    <div>
                        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">CONTROL DE GASTOS</h1>
                        <p className="text-xs text-gray-500 font-mono">Control Financiero & Proveedores</p>
                    </div>
               </div>
               
               <div className="flex items-center gap-3">
                    <button onClick={() => setShowSupplierModal(true)} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-bold text-white transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">group_add</span>
                        Nuevo Proveedor
                    </button>
                    <button onClick={() => setShowExpenseModal(true)} className="px-4 py-2 rounded-lg bg-vlyck-lime text-black text-xs font-black hover:shadow-[0_0_15px_rgba(167,255,45,0.4)] transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm font-bold">add</span>
                        Registrar Gasto
                    </button>
               </div>
           </div>

           {/* 🔹 PESTAÑAS SUPERIORES (TABS) */}
           <div className="flex items-center gap-6 text-sm font-medium">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'border-vlyck-lime text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="material-symbols-outlined text-lg">dashboard</span> Visión General
                </button>
                <button 
                    onClick={() => setActiveTab('transactions')}
                    className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'transactions' ? 'border-vlyck-lime text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="material-symbols-outlined text-lg">receipt_long</span> Transacciones
                </button>
                <button 
                    onClick={() => setActiveTab('suppliers')}
                    className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'suppliers' ? 'border-vlyck-lime text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="material-symbols-outlined text-lg">corporate_fare</span> Proveedores
                </button>
           </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth pb-32">
           
           {/* --- VISTA 1: OVERVIEW (DASHBOARD) --- */}
           {activeTab === 'overview' && (
               <div className="animate-fade-in">
                   {/* KPI CARDS */}
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                      {/* Profit */}
                      <div className="relative bg-[#111] p-6 rounded-2xl border border-white/10 overflow-hidden group hover:border-vlyck-lime/30 transition-colors">
                         <div className="relative z-10">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Utilidad Neta</p>
                            <h3 className={`text-3xl font-mono font-black tracking-tight ${profit >= 0 ? 'text-vlyck-lime' : 'text-red-500'}`}>
                               $ {profit.toLocaleString()}
                            </h3>
                         </div>
                      </div>
                      {/* Income */}
                      <div className="relative bg-[#111] p-6 rounded-2xl border border-white/10 overflow-hidden group hover:border-white/30 transition-colors">
                         <div className="relative z-10">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Ingresos Totales</p>
                            <h3 className="text-3xl font-mono font-black text-white tracking-tight">$ {totalIncome.toLocaleString()}</h3>
                         </div>
                      </div>
                      {/* Expenses */}
                      <div className="relative bg-[#111] p-6 rounded-2xl border border-white/10 overflow-hidden group hover:border-red-500/30 transition-colors">
                         <div className="relative z-10">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Gastos Registrados</p>
                            <h3 className="text-3xl font-mono font-black text-red-500 tracking-tight">$ {totalExpensesCalc.toLocaleString()}</h3>
                         </div>
                      </div>
                      {/* Suppliers Count */}
                      <div className="relative bg-[#111] p-6 rounded-2xl border border-white/10 overflow-hidden group hover:border-vlyck-cyan/30 transition-colors">
                          <div className="relative z-10">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Proveedores Activos</p>
                            <h3 className="text-3xl font-mono font-black text-vlyck-cyan tracking-tight">{suppliers.length}</h3>
                          </div>
                      </div>
                   </div>

                   {/* Filtros Rapidos */}
                   <div className="flex gap-4 mb-6">
                        <select className="bg-[#151515] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none" value={dateFilter.month} onChange={e => setDateFilter({...dateFilter, month: e.target.value})}>
                            {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Mes {m}</option>)}
                        </select>
                        <select className="bg-[#151515] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                            <option value="Todas">Todas las Categorías</option>
                            <option>Infrastructure</option>
                            <option>Marketing</option>
                            <option>Office</option>
                            <option>Logística</option>
                        </select>
                   </div>
                   
                   {/* Tabla Resumen */}
                   <ExpensesTable expenses={filteredExpenses} />
               </div>
           )}

           {/* --- VISTA 2: TRANSACCIONES (Solo Tabla Full) --- */}
           {activeTab === 'transactions' && (
               <div className="animate-fade-in">
                   <h2 className="text-xl font-bold mb-4">Historial Completo</h2>
                   {/* Reusamos la tabla pero quizás sin límite de filas en el futuro */}
                   <ExpensesTable expenses={filteredExpenses} />
               </div>
           )}

           {/* --- VISTA 3: PROVEEDORES (Nueva Vista) --- */}
           {activeTab === 'suppliers' && (
               <div className="animate-fade-in">
                   <h2 className="text-xl font-bold mb-4">Directorio de Proveedores</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suppliers.length > 0 ? suppliers.map(sup => (
                            <div key={sup._id} className="bg-[#111] p-5 rounded-xl border border-white/10 hover:border-vlyck-cyan/50 transition-colors group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-10 h-10 rounded-full bg-vlyck-cyan/10 flex items-center justify-center text-vlyck-cyan font-bold border border-vlyck-cyan/20">
                                        {sup.name.charAt(0)}
                                    </div>
                                    <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400 uppercase border border-white/5">{sup.category || 'General'}</span>
                                </div>
                                <h3 className="font-bold text-lg text-white">{sup.name}</h3>
                                <p className="text-sm text-gray-500 mb-4">{sup.contactName || 'Sin contacto'}</p>
                                <div className="space-y-2 text-xs text-gray-400 font-mono">
                                    <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">id_card</span> {sup.rut || '-'}</p>
                                    <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">mail</span> {sup.email || '-'}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-3 text-center py-10 text-gray-500">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">group_off</span>
                                <p>No tienes proveedores registrados.</p>
                            </div>
                        )}
                   </div>
               </div>
           )}
        </div>
      </main>

      {/* --- MODALES (Iguales que antes, ocultos por defecto) --- */}
      {showExpenseModal && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* ... (Contenido del modal de gasto igual al anterior) ... */}
            <div className="w-full max-w-2xl bg-[#111] rounded-3xl border border-white/20 p-8 shadow-2xl relative overflow-hidden animate-fade-in">
               <div className="flex justify-between items-start mb-6 relative z-10">
                  <h2 className="text-2xl font-mono font-bold text-white">Nuevo Gasto</h2>
                  <button onClick={() => setShowExpenseModal(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                     <span className="material-symbols-outlined">close</span>
                  </button>
               </div>

               <div className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center mb-8 hover:border-vlyck-lime/50 hover:bg-white/5 cursor-pointer transition-all group relative z-10">
                  <input type="file" onChange={handleUploadFile} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*,application/pdf" />
                  <div className="bg-white/5 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                     <span className="material-symbols-outlined text-gray-400 group-hover:text-vlyck-lime">cloud_upload</span>
                  </div>
                  {uploading ? <p className="text-xs text-vlyck-lime animate-pulse">Subiendo...</p> : expenseForm.image ? <p className="text-xs text-green-500">Archivo Cargado</p> : <p className="text-xs text-gray-500">Arrastra factura (PDF/JPG)</p>}
               </div>

               <form onSubmit={submitExpense} className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="col-span-2">
                     <label className="text-xs uppercase font-bold text-gray-500">Descripción</label>
                     <input required value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-vlyck-lime outline-none mt-1" placeholder="Ej: Pago servidor"/>
                  </div>
                  <div>
                     <label className="text-xs uppercase font-bold text-gray-500">Monto</label>
                     <input required type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-vlyck-lime outline-none mt-1" placeholder="0.00"/>
                  </div>
                  <div>
                     <label className="text-xs uppercase font-bold text-gray-500">Categoría</label>
                     <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-vlyck-lime outline-none mt-1">
                        <option>Infrastructure</option><option>Office</option><option>Marketing</option><option>Logística</option><option>Servicios</option>
                     </select>
                  </div>
                  <div className="col-span-2">
                     <label className="text-xs uppercase font-bold text-gray-500">Proveedor</label>
                     <select value={expenseForm.supplier} onChange={e => setExpenseForm({...expenseForm, supplier: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-vlyck-lime outline-none mt-1">
                           <option value="">Seleccionar Proveedor...</option>
                           {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                     </select>
                  </div>
                  <div className="col-span-2 mt-4 flex justify-end gap-3">
                      <button type="button" onClick={() => setShowExpenseModal(false)} className="px-6 py-3 rounded-xl border border-white/10 text-gray-300">Cancelar</button>
                      <button type="submit" disabled={uploading} className="px-8 py-3 rounded-xl bg-vlyck-lime text-black font-bold">Guardar</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showSupplierModal && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-[#111] rounded-3xl border border-white/20 p-8 shadow-2xl relative animate-fade-in">
               <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-mono font-bold text-white">Nuevo Proveedor</h2>
                  <button onClick={() => setShowSupplierModal(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400"><span className="material-symbols-outlined">close</span></button>
               </div>
               <form onSubmit={submitSupplier} className="flex flex-col gap-4">
                  <input required value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vlyck-cyan" placeholder="Nombre Empresa"/>
                  <input value={supplierForm.rut} onChange={e => setSupplierForm({...supplierForm, rut: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vlyck-cyan" placeholder="RUT"/>
                  <input value={supplierForm.contactName} onChange={e => setSupplierForm({...supplierForm, contactName: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vlyck-cyan" placeholder="Nombre Contacto"/>
                  <button type="submit" className="mt-4 px-8 py-3 rounded-xl bg-vlyck-cyan text-black font-bold">Crear Proveedor</button>
               </form>
            </div>
         </div>
      )}

    </div>
  );
}

// --- COMPONENTE DE TABLA (EXTRAÍDO PARA LIMPIEZA) ---
function ExpensesTable({ expenses }) {
    return (
        <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-left border-collapse">
                 <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
                    <tr>
                       <th className="p-4 font-semibold">Fecha</th>
                       <th className="p-4 font-semibold">Proveedor</th>
                       <th className="p-4 font-semibold">Descripción</th>
                       <th className="p-4 font-semibold">Categoría</th>
                       <th className="p-4 font-semibold text-center">Boleta</th>
                       <th className="p-4 font-semibold text-right">Monto</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 text-sm">
                    {expenses.map(exp => (
                       <tr key={exp._id} className="group hover:bg-white/5 transition-colors cursor-pointer">
                          <td className="p-4 text-gray-400 font-mono">{new Date(exp.date).toLocaleDateString()}</td>
                          <td className="p-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-gray-500 border border-white/5">
                                   {(exp.supplier?.name || exp.supplierName || '?').charAt(0)}
                                </div>
                                <span className="text-white font-medium">{exp.supplier?.name || exp.supplierName}</span>
                             </div>
                          </td>
                          <td className="p-4 text-gray-400">{exp.description}</td>
                          <td className="p-4">
                             <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 uppercase tracking-tight">
                                {exp.category}
                             </span>
                          </td>
                          <td className="p-4 text-center">
                             {exp.invoiceUrl ? (
                                <a href={exp.invoiceUrl} target="_blank" rel="noreferrer" className="text-vlyck-lime hover:text-white transition-colors">
                                   <span className="material-symbols-outlined text-lg">description</span>
                                </a>
                             ) : <span className="text-gray-700">-</span>}
                          </td>
                          <td className="p-4 text-right">
                             <span className="font-mono font-bold text-red-400">-${exp.amount.toLocaleString()}</span>
                          </td>
                       </tr>
                    ))}
                    {expenses.length === 0 && (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-500">No hay datos para mostrar.</td></tr>
                    )}
                 </tbody>
            </table>
        </div>
    );
}