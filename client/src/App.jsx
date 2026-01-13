import { useEffect } from 'react'; // <--- Importar useEffect
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// ... (Tus imports de componentes y páginas siguen igual) ...
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // <--- NUEVA PÁGINA QUE CREAREMOS
import DashboardPage from './pages/DashboardPage';
import ProductListPage from './pages/ProductListPage';
import ProductEditPage from './pages/ProductEditPage';
import ProfilePage from './pages/ProfilePage'; // <--- IMPORTAR

// Componente interno para manejar la lógica de inactividad
function InactivityHandler() {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Si no hay usuario o no es admin, no hacemos nada
    if (!userInfo || !userInfo.isAdmin) return;

    const TIMEOUT_MS = 30 * 60 * 1000; // 30 Minutos
    let logoutTimer;

    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        alert("Sesión cerrada por seguridad (30 min de inactividad).");
        logout();
        navigate('/login');
      }, TIMEOUT_MS);
    };

    // Eventos que reinician el contador
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    // Iniciar timer la primera vez
    resetTimer();

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [userInfo, logout, navigate]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        {/* El Handler debe estar DENTRO del AuthProvider */}
        <InactivityHandler />

        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
          <Navbar />
          <main className="flex-grow w-full">
            <Routes>
              {/* --- RUTAS PÚBLICAS --- */}
              <Route path="/" element={<HomePage />} />
              <Route path="/all" element={<CatalogPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/profile" element={<ProfilePage />} /> {/* <--- RUTA NUEVA */}

              {/* Autenticación */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} /> {/* <--- RUTA NUEVA */}

              {/* Truco: Si entran a /admin y no están logueados, van al login. Si están, al dashboard */}
              <Route path="/admin" element={<LoginPage />} />

              {/* --- RUTAS PROTEGIDAS (ADMIN) --- */}
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/productlist" element={<ProductListPage />} />
                <Route path="/admin/product/:id/edit" element={<ProductEditPage />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;