import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // --- PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Cantidad por página
  
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  // --- 1. DATOS FINANCIEROS GLOBALES ---
  const totalSales = orders.reduce((acc, order) => {
      if (order.isPaid) return acc + (order.totalPrice || 0);
      return acc + (order.depositAmount || 0);
  }, 0);

  const totalOrders = orders.length;

  // --- 2. LÓGICA DEL GRÁFICO (POR MESES) ---
  const salesData = useMemo(() => {
      const months = [];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const name = d.toLocaleDateString('es-CL', { month: 'short' }).replace('.', ''); 
          months.push({ label: name.charAt(0).toUpperCase() + name.slice(1), key: key, amount: 0 });
      }
      orders.forEach(order => {
          const d = new Date(order.createdAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const monthStat = months.find(m => m.key === key);
          if (monthStat) {
              const income = order.isPaid ? order.totalPrice : (order.depositAmount || 0);
              monthStat.amount += income;
          }
      });
      const maxAmount = Math.max(...months.map(m => m.amount)) || 1;
      return months.map(m => ({ ...m, height: Math.round((m.amount / maxAmount) * 100) }));
  }, [orders]);

  // --- 3. LÓGICA DE PAGINACIÓN ---
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data: ordersData } = await axios.get(`/api/orders`, config);
        setOrders(ordersData);
        const { data: productsData } = await axios.get(`/api/products`);
        setProductsCount(productsData.length);
        setLoading(false);
      } catch (error) {
        console.error("Error dashboard:", error);
        setLoading(false);
      }
    };
    if (userInfo && userInfo.isAdmin) fetchData();
    else navigate('/admin');
  }, [userInfo, navigate]);

  if (loading) return <div className="text-vlyck-lime pt-20 text-center animate-pulse">Cargando métricas...</div>;

  return (
    <div className="w-full pb-20 px-4 md:px-0">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-tight">
                HOLA, <span className="text-vlyck-lime">{userInfo.name.split(' ')[0]}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">Resumen de Negocio</p>
          </div>
          <div className="bg-[#111] px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vlyck-lime opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-vlyck-lime"></span>
             </span>
             <p className="text-[10px] text-white font-bold uppercase">Online</p>
          </div>
        </header>

        {/* GRÁFICO */}
        <div className="mb-10">
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-vlyck-lime">calendar_month</span> Ventas Mensuales
            </h3>
            <div className="w-full bg-[#111] rounded-2xl border border-white/10 p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-end justify-between h-48 md:h-64 gap-2 md:gap-4 relative z-10">
                    {salesData.map((month, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer">
                            <div className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[10px] font-bold px-2 py-1 rounded absolute -mt-8 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                                ${month.amount.toLocaleString('es-CL')}
                            </div>
                            <div className={`w-full max-w-[40px] rounded-t-lg transition-all duration-1000 ease-out relative overflow-hidden ${month.amount > 0 ? 'bg-vlyck-lime shadow-[0_0_15px_rgba(167,255,45,0.3)]' : 'bg-white/5'}`} style={{ height: `${month.height > 0 ? month.height : 5}%` }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>
                            <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase mt-3">{month.label}</p>
                        </div>
                    ))}
                </div>
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 px-6 py-12">
                    <div className="border-t border-white dashed"></div><div className="border-t border-white dashed"></div><div className="border-t border-white dashed"></div>
                </div>
            </div>
        </div>

        {/* KPIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="p-5 bg-[#111] rounded-2xl border border-white/10 relative overflow-hidden group">
            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Caja Total (Histórico)</p>
            <h3 className="text-3xl font-black text-white tracking-tight">${totalSales.toLocaleString('es-CL')}</h3>
            <span className="material-symbols-outlined absolute top-4 right-4 text-4xl text-vlyck-lime opacity-10 group-hover:scale-110 transition-transform">payments</span>
          </div>
          <div className="p-5 bg-[#111] rounded-2xl border border-white/10 relative overflow-hidden group">
            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Órdenes Totales</p>
            <h3 className="text-3xl font-black text-white tracking-tight">{totalOrders}</h3>
            <span className="material-symbols-outlined absolute top-4 right-4 text-4xl text-vlyck-cyan opacity-10 group-hover:scale-110 transition-transform">shopping_cart</span>
          </div>
          <div className="p-5 bg-[#111] rounded-2xl border border-white/10 relative overflow-hidden group">
            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Productos Activos</p>
            <h3 className="text-3xl font-black text-white tracking-tight">{productsCount}</h3>
            <span className="material-symbols-outlined absolute top-4 right-4 text-4xl text-white opacity-10 group-hover:scale-110 transition-transform">inventory_2</span>
          </div>
        </div>

        {/* TABLA DE ÓRDENES (CON PAGINACIÓN) */}
        <div className="flex flex-col mb-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Movimientos</h3>
            <Link to="/admin/custom-manager" className="text-xs text-vlyck-lime font-bold hover:underline flex items-center gap-1">Ver Gestión <span className="material-symbols-outlined text-sm">arrow_forward</span></Link>
          </div>
          
          <div className="w-full bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px] md:min-w-0">
                <thead className="bg-white/5 text-gray-500 text-[10px] uppercase tracking-widest font-bold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Pago</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentOrders.map((order) => (
                    <tr key={order._id} className="group hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">#{order._id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-white font-bold">{order.user ? order.user.name : (order.guestInfo?.name || 'Invitado')}</span>
                            <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{order.orderSource}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white font-mono">${order.totalPrice.toLocaleString('es-CL')}</td>
                      <td className="px-6 py-4">
                        {order.isPaid ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-vlyck-lime/10 text-vlyck-lime border border-vlyck-lime/20"><span className="w-1.5 h-1.5 rounded-full bg-vlyck-lime"></span> Pagado</span>
                        ) : order.depositAmount > 0 ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/20"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Abono ${order.depositAmount}</span>
                        ) : (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Pendiente</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-white/5 text-gray-400 border border-white/10`}>
                            {order.workflowStatus || (order.isDelivered ? 'Entregado' : 'En Proceso')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/order/${order._id}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-vlyck-cyan hover:text-black transition-all ml-auto">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan="7" className="text-center py-10 text-gray-500 flex flex-col items-center justify-center"><span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>No hay órdenes registradas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- CONTROLES DE PAGINACIÓN --- */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-4 border-t border-white/10 bg-[#0f0f0f]">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={currentPage === 1}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    
                    {/* Números de página */}
                    <div className="flex gap-1 overflow-x-auto max-w-[200px] hide-scrollbar">
                        {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            // Mostrar solo algunas páginas si son muchas (Lógica simple: mostrar todas por ahora)
                            return (
                                <button 
                                    key={pageNum} 
                                    onClick={() => paginate(pageNum)} 
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-vlyck-lime text-black scale-110 shadow-lg shadow-vlyck-lime/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            )}
          </div>
        </div>
    </div>
  );
}