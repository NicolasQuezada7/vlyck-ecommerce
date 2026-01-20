import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  // Función auxiliar para saber si el link está activo
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* --- SIDEBAR FIJO --- */}
      {/* Nota: Agregamos pt-20 para que baje un poco por la Navbar global */}
      <aside className="w-[80px] md:w-[260px] bg-[#0d0d0d] border-r border-white/10 flex flex-col h-full shrink-0 z-20 transition-all pt-24">
        <div className="p-4 md:p-8 mb-4 text-center md:text-left">
          <h1 className="hidden md:block text-xl font-black tracking-[0.2em] text-white">VLYCK</h1>
          <span className="material-symbols-outlined md:hidden text-vlyck-lime">bolt</span>
          <span className="hidden md:block text-[10px] text-vlyck-lime font-bold uppercase tracking-wider">Command Center</span>
        </div>
        
        <nav className="flex-grow px-2 md:px-4 space-y-2 overflow-y-auto">
          
          {/* Link Dashboard */}
          <Link 
            to="/admin/dashboard" 
            className={`flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl transition-all group ${
              isActive('/admin/dashboard') 
              ? 'bg-vlyck-lime/10 text-vlyck-lime border border-vlyck-lime/20' 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="hidden md:block font-medium text-sm">Dashboard</span>
          </Link>
            <Link to="/admin/pos" className="flex items-center gap-2 p-2 hover:text-vlyck-lime">
              <span className="material-symbols-outlined">point_of_sale</span> POS
            </Link>
          {/* Link Productos */}
          <Link 
            to="/admin/productlist" 
            className={`flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl transition-all group ${
              isActive('/admin/productlist') 
              ? 'bg-vlyck-lime/10 text-vlyck-lime border border-vlyck-lime/20' 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="hidden md:block font-medium text-sm">Productos</span>
          </Link>
               <Link to="/admin/finance" className="flex items-center gap-2 p-2 hover:text-vlyck-lime">
              <span className="material-symbols-outlined">attach_money</span> Finanzas
          </Link> 
          {/* Link Clientes (Placeholder) */}
          <div className="flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 transition-all cursor-pointer opacity-50">
             <span className="material-symbols-outlined">group</span>
             <span className="hidden md:block font-medium text-sm">Clientes</span>
          </div>
        </nav>
        
        <div className="p-4 md:p-6 border-t border-white/5 mt-auto mb-10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all">
            <span className="material-symbols-outlined">logout</span>
            <span className="hidden md:block font-medium text-sm">Desconectar</span>
          </button>
        </div>
      </aside>

      {/* --- AQUÍ SE CARGA EL CONTENIDO DE CADA PÁGINA --- */}
      <main className="flex-1 p-6 pt-24 md:p-10 md:pt-28 overflow-y-auto relative h-full">
        <Outlet />
      </main>

    </div>
  );
}