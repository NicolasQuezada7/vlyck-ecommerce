import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios'; // Importante: Usaremos axios aquí
import { useAuth } from '../context/AuthContext';

// Importa el logo principal
import logoImg from '../assets/logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { userInfo, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Redirección si ya está logueado
  useEffect(() => {
    if (userInfo) {
      if (userInfo.isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate(from === '/admin' ? '/' : from);
      }
    }
  }, [navigate, userInfo, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. HACEMOS LA PETICIÓN AL BACKEND
      const { data } = await axios.post(`/api/users/login`, {
        email,
        password,
      });

      // 2. SI EL LOGIN ES CORRECTO, PASAMOS LOS DATOS (data) AL CONTEXTO
      // 'data' contiene: { _id, name, email, isAdmin: true, token }
      login(data);

      // El useEffect de arriba se encargará de redirigir al detectar el cambio en userInfo

    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
      setLoading(false);
    }
  };

  return (
    <div className="font-sans antialiased bg-[#050505] text-white min-h-screen w-full flex items-center justify-center overflow-hidden relative">

      {/* Background Grid Overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-vlyck-lime/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 hover:border-vlyck-lime/30 group mx-4">

        {/* Header Section */}
        <div className="text-center mb-10 flex flex-col items-center">
          <Link to="/">
            <img src={logoImg} alt="Vlyck" className="h-16 w-auto object-contain mb-6 drop-shadow-[0_0_15px_rgba(167,255,45,0.4)] hover:scale-105 transition-transform" />
          </Link>

          <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2">Acceso Clientes</h1>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">Ingresa para gestionar tus pedidos</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group/input">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within/input:text-vlyck-lime z-10 pointer-events-none">
              <span className="material-symbols-outlined">mail</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 transition-all duration-300 focus:border-vlyck-lime focus:ring-1 focus:ring-vlyck-lime outline-none"
              placeholder="Correo Electrónico"
            />
          </div>

          <div className="relative group/input">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within/input:text-vlyck-lime z-10 pointer-events-none">
              <span className="material-symbols-outlined">lock</span>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-600 transition-all duration-300 focus:border-vlyck-lime focus:ring-1 focus:ring-vlyck-lime outline-none"
              placeholder="Contraseña"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-vlyck-gradient text-black font-black text-sm tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(167,255,45,0.4)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 text-center flex flex-col gap-2">
          <Link to="/register" className="text-sm text-white hover:text-vlyck-lime transition-colors font-bold uppercase tracking-wider">
            ¿No tienes cuenta? Regístrate
          </Link>
          <a className="text-xs text-gray-600 hover:text-gray-400 transition-colors" href="#">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>
    </div>
  );
}