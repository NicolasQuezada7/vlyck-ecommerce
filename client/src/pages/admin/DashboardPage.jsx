import { useEffect, useState } from 'react';
import axios from 'axios';
// ✅ CORRECCIÓN: Se cerraron las comillas y el punto y coma
import { useAuth } from '../../context/AuthContext'; 
import { Link, useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  // Calcular totales (Solo ordenes pagadas cuentan como ingreso real)
  const paidOrders = orders.filter(o => o.isPaid);
  const totalSales = paidOrders.reduce((acc, order) => acc + order.totalPrice, 0);
  const totalOrders = orders.length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };

        // 1. Traer Órdenes
        const { data: ordersData } = await axios.get(`/api/orders`, config);
        setOrders(ordersData);

        // 2. Traer Productos
        const { data: productsData } = await axios.get(`/api/products`);
        setProductsCount(productsData.length);

        setLoading(false);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
        setLoading(false);
      }
    };

    if (userInfo && userInfo.isAdmin) {
      fetchData();
    } else {
      navigate('/admin');
    }
  }, [userInfo, navigate]);

  if (loading) return <div className="text-vlyck-lime pt-20 text-center animate-pulse">Cargando métricas...</div>;

  return (
    <div className="w-full pb-20">
        
        {/* Header con Saludo y Status */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-3xl font-black text-white leading-tight uppercase tracking-tight">
                HOLA, <span className="text-vlyck-lime">{userInfo.name.split(' ')[0]}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">Resumen de Actividad</p>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="text-right hidden md:block bg-[#111] px-4 py-2 rounded-lg border border-white/10">
                <div className="flex items-center justify-end gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vlyck-lime opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-vlyck-lime"></span>
                    </span>
                    <p className="text-[10px] text-white font-bold uppercase tracking-widest">Sistema Online</p>
                </div>
              </div>
          </div>
        </header>

        {/* KPIs (Tarjetas de Estadísticas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Tarjeta 1: Ingresos */}
          <div className="p-6 bg-[#111] rounded-2xl border border-white/10 relative overflow-hidden group hover:border-vlyck-lime/50 transition-all duration-300 shadow-lg">
            <div className="relative z-10">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1">Ingresos Totales</p>
              <h3 className="text-3xl font-black text-white tracking-tight">${totalSales.toLocaleString('es-CL')}</h3>
            </div>
            <div className="absolute top-4 right-4 text-vlyck-lime opacity-20 bg-vlyck-lime/10 p-3 rounded-xl group-hover:scale-110 transition-transform group-hover:opacity-100">
              <span className="material-symbols-outlined text-2xl">attach_money</span>
            </div>
          </div>

          {/* Tarjeta 2: Órdenes */}
          <div className="p-6 bg-[#111] rounded-2xl border border-white/10 relative overflow-hidden group hover:border-vlyck-cyan/50 transition-all duration-300 shadow-lg">
            <div className="relative z-10">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1">Órdenes Totales</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{totalOrders}</h3>
            </div>
            <div className="absolute top-4 right-4 text-vlyck-cyan opacity-20 bg-vlyck-cyan/10 p-3 rounded-xl group-hover:scale-110 transition-transform group-hover:opacity-100">
              <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            </div>
          </div>

          {/* Tarjeta 3: Productos */}
          <div className="p-6 bg-[#111] rounded-2xl border border-white/10 relative overflow-hidden group hover:border-white/30 transition-all duration-300 shadow-lg">
            <div className="relative z-10">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1">Productos Activos</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{productsCount}</h3>
            </div>
            <div className="absolute top-4 right-4 text-white opacity-20 bg-white/10 p-3 rounded-xl group-hover:scale-110 transition-transform group-hover:opacity-100">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
          </div>
        </div>

        {/* Tabla de Órdenes Recientes */}
        <div className="flex flex-col mb-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Órdenes Recientes</h3>
            <Link to="/admin/pos" className="text-xs text-vlyck-lime font-bold hover:underline flex items-center gap-1">
                Ver Todo <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          
          <div className="w-full bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-gray-500 text-[10px] uppercase tracking-widest font-bold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Estado Pago</th>
                    <th className="px-6 py-4">Entrega</th>
                    <th className="px-6 py-4 text-right">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.slice(0, 10).map((order) => ( // Mostramos solo las ultimas 10
                    <tr key={order._id} className="group hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">#{order._id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-white font-bold">{order.user ? order.user.name : (order.guestInfo?.name || 'Invitado')}</span>
                            <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{order.user ? order.user.email : order.guestInfo?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white font-mono">${order.totalPrice.toLocaleString('es-CL')}</td>
                      
                      {/* Estado Pago */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${order.isPaid ? 'bg-vlyck-lime/10 text-vlyck-lime border border-vlyck-lime/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${order.isPaid ? 'bg-vlyck-lime' : 'bg-yellow-500'}`}></span>
                           {order.isPaid ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>

                      {/* Estado Entrega */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${order.isDelivered ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                            {order.isDelivered ? 'Entregado' : 'En Proceso'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link to={`/order/${order._id}`} target="_blank" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-vlyck-cyan hover:text-black transition-all ml-auto">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                        <td colSpan="7" className="text-center py-10 text-gray-500 flex flex-col items-center justify-center">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
                            No hay órdenes registradas.
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </div>
  );
}