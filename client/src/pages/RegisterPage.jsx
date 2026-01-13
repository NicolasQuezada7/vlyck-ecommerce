import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png'; // Asegúrate de que apunte a tu logo

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState(null); // Para errores de validación (passwords no coinciden)
    const [error, setError] = useState(null);     // Para errores del servidor (usuario ya existe)
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { userInfo, login } = useAuth(); // Usamos login para guardar la sesión al registrarse

    // Si ya está logueado, redirigir
    useEffect(() => {
        if (userInfo) {
            navigate('/');
        }
    }, [navigate, userInfo]);

    const submitHandler = async (e) => {
        e.preventDefault();
        // Limpiamos errores previos
        setMessage(null);
        setError(null);

        if (password !== confirmPassword) {
            setMessage('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            // 1. Petición al Backend
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/users`, { name, email, password });

            // 2. Si es exitoso, logueamos automáticamente en el contexto
            login(data);

            // 3. Redirigimos al inicio (o perfil)
            navigate('/profile');

        } catch (err) {
            // AQUÍ MOSTRAMOS EL ERROR AL CLIENTE
            // Si el backend dice "El usuario ya existe", esto lo captura y lo muestra en pantalla
            setError(err.response?.data?.message || 'Ocurrió un error al registrarse');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center pt-24 pb-10 px-4 bg-[#050505]">

            {/* Fondo decorativo (opcional, igual que el login) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            <div className="bg-[#111] border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10">

                <div className="text-center mb-6">
                    <Link to="/" className="inline-block">
                        <img src={logo} alt="Vlyck" className="h-12 mx-auto mb-4 object-contain" />
                    </Link>
                    <h1 className="text-2xl font-black text-white uppercase tracking-widest">Crear Cuenta</h1>
                    <p className="text-gray-500 text-xs mt-2 uppercase tracking-wider">Únete para comprar más rápido</p>
                </div>

                {/* ALERTA DE ERROR (CONTRASEÑAS) */}
                {message && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-sm text-center font-bold">
                        {message}
                    </div>
                )}

                {/* ALERTA DE ERROR (SERVIDOR - EJ: USUARIO EXISTE) */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-sm text-center font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={submitHandler} className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Nombre Completo</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-vlyck-lime" placeholder="Ej: Juan Pérez" required />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Correo Electrónico</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-vlyck-lime" placeholder="juan@ejemplo.com" required />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-vlyck-lime" placeholder="Mínimo 6 caracteres" required />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Confirmar Contraseña</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-vlyck-lime" placeholder="Repite la contraseña" required />
                    </div>

                    <button type="submit" disabled={loading} className="mt-4 w-full py-3 bg-vlyck-gradient text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform hover:shadow-[0_0_20px_rgba(167,255,45,0.4)]">
                        {loading ? 'Creando cuenta...' : 'Registrarse'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-vlyck-lime hover:underline font-bold uppercase tracking-wider">Inicia Sesión</Link>
                </div>
            </div>
        </div>
    );
}