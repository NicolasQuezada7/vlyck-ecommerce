import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; 
import logo from '../assets/logo.png';

export default function Navbar() {
  const { userInfo, logout } = useAuth();
  
  // 🔴 CORRECCIÓN AQUÍ: Usamos 'cart' en lugar de 'cartItems'
  const { cart } = useCart(); 
  
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // 🔴 CORRECCIÓN AQUÍ: Calculamos sobre 'cart'
  const totalItems = cart ? cart.reduce((acc, item) => {
    // Forzamos a que sea numero. Si 'quantity' no existe, buscamos 'qty'. Si falla, es 0.
    const qty = Number(item.quantity) || Number(item.qty) || 0;
    return acc + qty;
  }, 0) : 0;
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  return (
    <nav className="fixed w-full z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">

          {/* 1. LOGO */}
          <div className="flex-shrink-0 flex items-center z-50">
            <Link to="/">
              <img src={logo} alt="Vlyck" className="h-10 md:h-16 w-auto object-contain" />
            </Link>
          </div>

          {/* 2. MENÚ CENTRADO */}
          <div className="hidden md:flex items-center justify-center flex-1 gap-10 absolute left-1/2 -translate-x-1/2">
            <Link to="/" className="text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-vlyck-lime transition-colors">Inicio</Link>
            <Link to="/all" className="text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-vlyck-lime transition-colors">Catálogo</Link>
            {/* NUEVA SECCIÓN PERSONALIZA */}
            <Link to="/customizer" className="text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-vlyck-lime transition-colors">Personaliza</Link>
            <Link to="/about" className="text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-vlyck-lime transition-colors">Nosotros</Link>
          </div>

          {/* 3. ACCIONES DERECHA */}
          <div className="hidden md:flex items-center gap-6">

            {/* BOTÓN ADMIN */}
            {userInfo && userInfo.isAdmin && (
              <Link
                to="/admin/productlist"
                className="px-4 py-2 bg-[#111] border border-vlyck-lime text-vlyck-lime rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-vlyck-lime hover:text-black transition-all shadow-[0_0_10px_rgba(167,255,45,0.2)]"
              >
                Panel Admin
              </Link>
            )}

            <div className="flex items-center gap-4 pl-4 border-l border-white/10">

              {userInfo ? (
                // LOGUEADO
                <div className="relative group">
                  <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-vlyck-lime/20 text-white hover:text-vlyck-lime transition-all">
                    <span className="material-symbols-outlined text-[24px]">person</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-xs text-gray-500 uppercase tracking-widest">Hola,</p>
                      <p className="text-white font-bold truncate">{userInfo.name}</p>
                    </div>
                    <Link to="/profile" className="block px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">Mi Perfil</Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-white/5 transition-colors last:rounded-b-xl font-bold">Cerrar Sesión</button>
                  </div>
                </div>
              ) : (
                // NO LOGUEADO
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-xs font-bold text-white hover:text-vlyck-lime uppercase tracking-widest transition-colors">Ingresar</Link>
                  <Link to="/register" className="px-6 py-2.5 bg-vlyck-gradient text-black rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">Registrarse</Link>
                </div>
              )}

              {/* CARRITO CON CONTADOR */}
              <Link to="/cart" className="relative p-2 text-white hover:text-vlyck-lime transition-colors group">
                <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">shopping_cart</span>
                
                {/* 🔴 EL CONTADOR YA DEBERÍA APARECER PORQUE AHORA LEE 'cart' */}
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#a7ff2d] text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-black shadow-[0_0_15px_#a7ff2d] z-10 animate-pulse">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* MENÚ MÓVIL */}
          <div className="md:hidden flex items-center gap-4">
            <Link to="/cart" className="relative p-2 text-white">
              <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
              {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-vlyck-lime text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_5px_#a7ff2d]">{totalItems}</span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-white p-2">
              <span className="material-symbols-outlined text-[28px]">{menuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* DROPDOWN MÓVIL */}
      {menuOpen && (
        <div className="md:hidden bg-[#050505] border-b border-white/10 px-4 pt-2 pb-8 flex flex-col gap-4 shadow-2xl h-screen fixed top-24 left-0 w-full z-40 overflow-y-auto">
          <Link to="/" onClick={() => setMenuOpen(false)} className="text-xl font-bold text-gray-300 py-3 border-b border-white/5 flex items-center justify-between">INICIO</Link>
          <Link to="/all" onClick={() => setMenuOpen(false)} className="text-xl font-bold text-gray-300 py-3 border-b border-white/5 flex items-center justify-between">CATÁLOGO</Link>
          {/* NUEVA SECCIÓN PERSONALIZA MÓVIL */}
          <Link to="/customizer" onClick={() => setMenuOpen(false)} className="text-xl font-bold text-gray-300 py-3 border-b border-white/5 flex items-center justify-between">PERSONALIZA</Link>
          
          {userInfo && userInfo.isAdmin && (
            <Link to="/admin/productlist" onClick={() => setMenuOpen(false)} className="mt-4 px-4 py-4 bg-[#111] border border-vlyck-lime text-vlyck-lime rounded-xl text-center font-black uppercase tracking-widest shadow-lg">Panel Admin</Link>
          )}

          <div className="mt-auto mb-32">
            {userInfo ? (
                <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 text-red-500 rounded-lg font-bold border border-red-500/20">CERRAR SESIÓN</button>
            ) : (
              <div className="flex flex-col gap-3">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="w-full py-4 text-center border border-white/20 rounded-xl text-white font-bold uppercase tracking-widest">INGRESAR</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}