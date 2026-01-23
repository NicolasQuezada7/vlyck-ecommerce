import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// --- COMPONENTES GLOBALES ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';

// --- PÁGINAS PÚBLICAS ---
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import PaymentSuccess from './pages/PaymentSuccess';
import OrderSuccessPage from './pages/OrderSuccessPage';
import CustomizerPage from './pages/CustomizerPage';

// --- PÁGINAS ADMIN (CARPETA /admin) ---
import DashboardPage from './pages/admin/DashboardPage';
import PosPage from './pages/admin/PosPage';
import FinancePage from './pages/admin/FinancePage';
import CustomManagerPage from './pages/admin/CustomManagerPage';
// --- PÁGINAS ADMIN (CARPETA RAÍZ /pages) ---
// (Estas dijiste que NO están en la carpeta admin)
import ProductListPage from './pages/ProductListPage';
import ProductEditPage from './pages/ProductEditPage';

// Componente interno para manejar inactividad
function InactivityHandler() {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
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

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

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
        <InactivityHandler />

        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
          {/* Navbar Global (Visible en todas partes) */}
          <Navbar />
          
          <main className="flex-grow w-full">
            <Routes>
              {/* --- RUTAS PÚBLICAS --- */}
              <Route path="/" element={<HomePage />} />
              <Route path="/all" element={<CatalogPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/order/:id" element={<OrderSuccessPage />} />
              <Route path="/customizer" element={<CustomizerPage />} />
              
              {/* --- AUTENTICACIÓN --- */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Redirección inteligente para /admin */}
              <Route path="/admin" element={<LoginPage />} />

              {/* --- RUTAS PROTEGIDAS (ADMIN) --- */}
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/pos" element={<PosPage />} />
                <Route path="/admin/finance" element={<FinancePage />} />
                <Route path="/admin/custom-orders" element={<CustomManagerPage />} />  
                {/* Estas rutas usan los archivos que están en /pages raíz */}
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