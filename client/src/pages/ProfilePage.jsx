import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // Agregué useNavigate por si acaso

export default function ProfilePage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  
  // Estados del Formulario
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [comuna, setComuna] = useState('');
  
  // Estados de Datos
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // 🛡️ GUARDIA DE SEGURIDAD (¡ESTO EVITA LA PANTALLA BLANCA!)
  // Si no hay usuario cargado aún, mostramos un loading o redirigimos
  useEffect(() => {
    if (!userInfo) {
        navigate('/login'); // Opcional: Redirigir si no hay usuario
    }
  }, [userInfo, navigate]);

  // Si userInfo es null (mientras carga o si no hay sesión), detenemos el render aquí
  if (!userInfo) {
    return <div className="min-h-screen bg-background-dark pt-32 text-center text-vlyck-lime">Cargando perfil...</div>;
  }

  // --- EFECTOS DE CARGA ---
  useEffect(() => {
    // Rellenar formulario con datos existentes
    if (userInfo) {
      setName(userInfo.name);
      setPhone(userInfo.phone || '');
      setAddress(userInfo.shippingAddress?.address || '');
      setCity(userInfo.shippingAddress?.city || '');
      setComuna(userInfo.shippingAddress?.comuna || '');
      
      fetchOrders(); // Solo buscamos órdenes si hay usuario
    }
  }, [userInfo]);

  const fetchOrders = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/orders/myorders', config);
      setOrders(data);
      setLoadingOrders(false);
    } catch (error) {
      console.error("Error cargando ordenes:", error);
      setLoadingOrders(false);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.put('/api/users/profile', {
        name,
        phone,
        shippingAddress: { address, city, comuna }
      }, config);
      
      // Actualizamos localStorage
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      alert('Error al actualizar perfil.');
    }
  };

  // --- VARIABLES DE ESTILO NEÓN ---
  const neonText = "text-[#a7ff2d]";
  const neonBorder = "border-[#a7ff2d]";
  const neonShadow = "shadow-[0_0_20px_rgba(167,255,45,0.3)]";

  return (
    <div className="bg-background-dark text-white min-h-screen pt-32 pb-20 px-4 md:px-10 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* --- HEADER PERFIL --- */}
        <div className="flex flex-col md:flex-row items-center gap-8 p-10 bg-[#111] rounded-xl border border-white/5 mb-10 relative overflow-hidden">
          
          {/* Avatar */}
          <div className={`relative w-28 h-28 rounded-full border-[3px] ${neonBorder} p-1 ${neonShadow} z-10`}>
            <img 
               src={`https://ui-avatars.com/api/?name=${userInfo.name}&background=000&color=a7ff2d`} 
               alt="Avatar" 
               className="w-full h-full rounded-full object-cover" 
            />
          </div>
          
          <div className="flex flex-col gap-2 items-center md:items-start z-10">
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">{userInfo.name}</h1>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1 rounded-full bg-[#a7ff2d]/10 ${neonText} text-[10px] font-black uppercase tracking-widest border border-[#a7ff2d]/20`}>
                 CLIENTE VIP
              </span>
              <span className="text-gray-500 text-xs font-medium">{userInfo.email}</span>
            </div>
          </div>

          <div className="md:ml-auto flex gap-3 z-10">
            {userInfo.isAdmin && (
                <Link to="/admin/productlist" className="px-6 py-3 rounded-xl border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                  Panel Admin
                </Link>
            )}
          </div>
        </div>

        {/* --- GRID DE CONTENIDO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
          
          {/* COLUMNA IZQUIERDA: DATOS DE ENVÍO */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-[#111] p-8 rounded-xl border border-white/5 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <span className={`material-symbols-outlined ${neonText}`}>location_on</span>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">Datos de Envío</h2>
              </div>
              
              <form onSubmit={submitHandler} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Nombre Completo</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-[#a7ff2d] focus:ring-0 outline-none transition-all placeholder:text-gray-700" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Dirección (Calle y Num)</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: Av. Siempreviva 742" className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-[#a7ff2d] focus:ring-0 outline-none transition-all placeholder:text-gray-700" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Comuna</label>
                    <input type="text" value={comuna} onChange={(e) => setComuna(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-[#a7ff2d] focus:ring-0 outline-none" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Ciudad</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-[#a7ff2d] focus:ring-0 outline-none transition-all" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Teléfono</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9..." className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-[#a7ff2d] focus:ring-0 outline-none transition-all" />
                </div>
                
                <button type="submit" className="w-full mt-4 py-4 rounded-xl bg-vlyck-gradient text-black font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(167,255,45,0.2)] flex items-center justify-center gap-2">
                  {updateSuccess ? (
                      <> <span className="material-symbols-outlined">check</span> GUARDADO </>
                  ) : (
                      <> <span className="material-symbols-outlined">save</span> GUARDAR DATOS </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* COLUMNA DERECHA: HISTORIAL */}
          <div className="lg:col-span-6">
            <div className="flex items-center justify-between mb-8 px-4">
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">Mis Pedidos</h2>
              <span className={`${neonText} text-xs font-bold uppercase tracking-widest`}>{orders.length} Órdenes</span>
            </div>

            <div className="space-y-4">
              {loadingOrders ? (
                  <div className="text-center py-10 text-gray-500 animate-pulse">Cargando historial...</div>
              ) : orders.length === 0 ? (
                  <div className="p-10 border border-dashed border-white/10 rounded-xl text-center">
                      <p className="text-gray-400 mb-4">Aún no has realizado compras.</p>
                      <Link to="/all" className={`${neonText} hover:underline font-bold`}>Ir a la tienda</Link>
                  </div>
              ) : (
                  orders.map((order) => (
                    <div key={order._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-[#111] rounded-xl border border-white/5 transition-all hover:border-white/20 group">
                        
                        <div className="w-20 h-20 rounded-xl bg-black overflow-hidden flex-shrink-0 border border-white/5 p-2">
                             {/* Mostramos la primera imagen de la orden si existe */}
                            {order.orderItems[0]?.image && (
                                <img src={order.orderItems[0].image} alt="Producto" className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                            )}
                        </div>
                        
                        <div className="flex-grow w-full">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-white font-semibold text-lg tracking-tight">Orden #{order._id.substring(20, 24)}</h3>
                                <span className="text-white font-black text-sm">${order.totalPrice.toLocaleString('es-CL')}</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                {new Date(order.createdAt).toLocaleDateString()} • {order.orderItems.length} Items
                            </p>
                            
                            <div className="flex items-center gap-4">
                                {order.isDelivered ? (
                                    <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${neonText}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full bg-[#a7ff2d] shadow-[0_0_8px_#a8ff2e]`}></span> Entregado
                                    </span>
                                ) : order.isPaid ? (
                                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Pagado
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Pendiente
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <Link to={`/order/${order._id}`} className={`w-full sm:w-auto px-6 py-3 rounded-full border border-white/20 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all text-center`}>
                            Ver Detalle
                        </Link>
                    </div>
                  ))
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}