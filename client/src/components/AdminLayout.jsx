import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) => `
    flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl transition-all group font-medium text-sm
    ${isActive(path) 
      ? 'bg-vlyck-lime/10 text-vlyck-lime border border-vlyck-lime/20 shadow-[0_0_10px_rgba(167,255,45,0.1)]' 
      : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
    }
  `;

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* --- SIDEBAR FIJO --- */}
      {/* Agregamos la clase 'custom-scrollbar' aquí */}
      <aside className="w-[80px] md:w-[260px] bg-[#0d0d0d] border-r border-white/10 flex flex-col h-full shrink-0 z-30 pt-32 overflow-y-auto custom-scrollbar transition-all duration-300">
        
        <div className="px-4 md:px-6 mb-6 md:mb-8 text-center md:text-left shrink-0">
          <h1 className="hidden md:block text-2xl font-black tracking-tight text-white uppercase">
            VLYCK <span className="text-vlyck-lime">ADMIN</span>
          </h1>
          <span className="material-symbols-outlined md:hidden text-vlyck-lime text-3xl">bolt</span>
          <p className="hidden md:block text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Command Center</p>
        </div>
        
        <nav className="flex-grow px-3 md:px-4 space-y-2">
          <Link to="/admin/dashboard" className={linkClass('/admin/dashboard')}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="hidden md:block">Dashboard</span>
          </Link>
          <Link to="/admin/pos" className={linkClass('/admin/pos')}>
            <span className="material-symbols-outlined">point_of_sale</span>
            <span className="hidden md:block">Punto de Venta</span>
          </Link>
          <Link to="/admin/productlist" className={linkClass('/admin/productlist')}>
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="hidden md:block">Productos</span>
          </Link>
          <Link to="/admin/finance" className={linkClass('/admin/finance')}>
            <span className="material-symbols-outlined">attach_money</span>
            <span className="hidden md:block">Finanzas</span>
          </Link>
          <Link to="/admin/custom-orders" className={linkClass('/admin/custom-orders')}>
            <span className="material-symbols-outlined">brush</span>
            <span className="hidden md:block">Personalizadas</span>
          </Link>
          <div className="flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-gray-600 cursor-not-allowed border border-transparent opacity-50">
             <span className="material-symbols-outlined">group</span>
             <span className="hidden md:block text-sm font-medium">Clientes</span>
          </div>
        </nav>
        
        <div className="p-4 md:p-6 border-t border-white/5 mt-auto mb-20 md:mb-0 shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all font-medium text-sm">
            <span className="material-symbols-outlined">logout</span>
            <span className="hidden md:block">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      {/* Agregamos la clase 'custom-scrollbar' aquí también */}
      <main className="flex-1 bg-[#050505] relative h-full overflow-y-auto custom-scrollbar pt-32 px-4 md:px-8 pb-12">
        
        <div className="mx-auto w-full max-w-[1800px]">
            <Outlet />
        </div>

      </main>

      {/* --- ESTILOS DEL SCROLLBAR (GLOBALES PARA ESTE LAYOUT) --- */}
      <style>{`
        /* Ancho de la barra */
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        /* Fondo de la barra (Track) - Negro */
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #050505;
            border-left: 1px solid #111;
        }
        
        /* La barra en sí (Thumb) - Gris Oscuro */
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 4px;
            border: 2px solid #050505; /* Borde para dar efecto flotante */
        }
        
        /* Al pasar el mouse por la barra - Verde Neón */
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a7ff2d; /* Vlyck Lime */
        }

        /* Para Firefox (Soporte limitado pero funcional) */
        .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #333 #050505;
        }
      `}</style>

    </div>
  );
}