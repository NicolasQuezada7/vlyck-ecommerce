import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  // Calcular totales
  const totalSales = orders.reduce((acc, order) => acc + order.totalPrice, 0);
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

        // 2. Traer Productos (para contar cuántos hay)
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

  if (loading) return <div className="text-white pt-20 text-center">Cargando datos...</div>;

  return (
    <>
        {/* Header con Saludo y Status */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">Hola, {userInfo.name}</h2>
            <p className="text-xs text-gray-500 mt-1">System Status: Optimal</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-sm text-white font-medium">Admin</p>
                <div className="flex items-center justify-end gap-1.5">
                   <span className="block w-1.5 h-1.5 rounded-full bg-vlyck-lime animate-pulse"></span>
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest">Online</p>
                </div>
             </div>
          </div>
        </header>

        {/* KPIs (Tarjetas de Estadísticas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Tarjeta 1: Ingresos */}
          <div className="p-6 bg-[#111] rounded-2xl border border-white/10 relative overflow-hidden group hover:border-vlyck-lime/30 transition-all duration-300">
            <div className="relative z-10">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Ingresos Totales</p>
              <h3 className="text-3xl font-bold text-white mt-3">${totalSales.toLocaleString('es-CL')}</h3>
            </div>
            <div className="absolute top-6 right-6 text-vlyck-lime opacity-80 bg-vlyck-lime/5 p-2 rounded-lg border border-vlyck-lime/10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">attach_money</span>
            </div>
          </div>

          {/* Tarjeta 2: Órdenes */}
          <div className="p-6 bg-[#111] rounded-2xl border border-white/10 relative overflow-hidden group hover:border-vlyck-cyan/30 transition-all duration-300">
            <div className="relative z-10">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Órdenes Totales</p>
              <h3 className="text-3xl font-bold text-white mt-3">{totalOrders}</h3>
            </div>
            <div className="absolute top-6 right-6 text-vlyck-cyan opacity-80 bg-vlyck-cyan/5 p-2 rounded-lg border border-vlyck-cyan/10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">shopping_cart</span>
            </div>
          </div>

          {/* Tarjeta 3: Productos */}
          <div className="p-6 bg-[#111] rounded-2xl border border-white/10 relative overflow-hidden group hover:border-white/30 transition-all duration-300">
            <div className="relative z-10">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Productos Activos</p>
              <h3 className="text-3xl font-bold text-white mt-3">{productsCount}</h3>
            </div>
            <div className="absolute top-6 right-6 text-white/40 bg-white/5 p-2 rounded-lg border border-white/5 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
          </div>
        </div>

        {/* Tabla de Órdenes Recientes */}
        <div className="flex flex-col mb-20">
          <div className="flex justify-between items-center mb-6 px-1">
            <h3 className="text-lg font-bold text-white tracking-tight">Órdenes Recientes</h3>
          </div>
          
          <div className="w-full bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-gray-500 text-[10px] uppercase tracking-widest font-semibold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Cliente / Email</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Pago</th>
                    <th className="px-6 py-4">Entrega</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((order) => (
                    <tr key={order._id} className="group hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm text-white font-mono tracking-wide">#{order._id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-white font-medium">{order.user ? order.user.name : (order.guestInfo?.name || 'Invitado')}</span>
                            <span className="text-xs text-gray-500">{order.user ? order.user.email : order.guestInfo?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white">${order.totalPrice.toLocaleString('es-CL')}</td>
                      
                      {/* Estado Pago */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border inline-flex items-center gap-1.5 ${order.isPaid ? 'bg-vlyck-lime/10 text-vlyck-lime border-vlyck-lime/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${order.isPaid ? 'bg-vlyck-lime' : 'bg-yellow-500'}`}></span>
                           {order.isPaid ? 'PAGADO' : 'PENDIENTE'}
                        </span>
                      </td>

                      {/* Estado Entrega */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border inline-flex items-center gap-1.5 ${order.isDelivered ? 'bg-vlyck-lime/10 text-vlyck-lime border-vlyck-lime/20' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                            {order.isDelivered ? 'ENTREGADO' : 'EN PROCESO'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link to={`/order/${order._id}`} target="_blank" className="p-2 rounded-lg bg-white/5 text-white hover:bg-vlyck-cyan hover:text-black transition-all inline-block">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                        <td colSpan="7" className="text-center py-10 text-gray-500">No hay órdenes todavía.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </>
  );
}