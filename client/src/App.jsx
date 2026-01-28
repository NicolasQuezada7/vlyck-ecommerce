import { useEffect } from 'react';
// ✅ CORRECCIÓN 1: Importar BrowserRouter
import { BrowserRouter, Routes, Route, useNavigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ScrollToTop from './components/ScrollToTop';

// --- COMPONENTES GLOBALES ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout'; // El layout del Dashboard

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
import AboutPage from './pages/AboutPage';
import CheckoutPage from './pages/CheckoutPage';
// --- PÁGINAS ADMIN (CARPETA /admin) ---
import DashboardPage from './pages/admin/DashboardPage';
import PosPage from './pages/admin/PosPage';
import FinancePage from './pages/admin/FinancePage';
import CustomManagerPage from './pages/admin/CustomManagerPage';
import UserListPage from './pages/admin/UserListPage';
import MockupManager from './pages/admin/MockupManager';
// --- PÁGINAS ADMIN (CARPETA RAÍZ /pages) ---
import ProductListPage from './pages/ProductListPage';
import ProductEditPage from './pages/ProductEditPage';

// --- COMPONENTE INTERNO: MANEJO DE INACTIVIDAD ---
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

// --- LAYOUT PÚBLICO (Para que el Navbar no salga en el Admin) ---
const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      <Navbar />
      <main className="flex-grow w-full">
        <Outlet /> {/* Aquí se renderizan las páginas hijas */}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    // ✅ CORRECCIÓN 2: BrowserRouter envuelve TODO
    <BrowserRouter>
      {/* ✅ CORRECCIÓN 3: ScrollToTop va aquí adentro */}
      <ScrollToTop />
      
      <AuthProvider>
        <CartProvider>
          <InactivityHandler />

          <Routes>
            {/* ------------------------------- */}
            {/* GRUPO 1: RUTAS PÚBLICAS (Con Navbar y Footer) */}
            {/* ------------------------------- */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/all" element={<CatalogPage />} />
              <Route path="/products" element={<CatalogPage />} /> {/* Alias por si acaso */}
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/order/:id" element={<OrderSuccessPage />} />
              <Route path="/customizer" element={<CustomizerPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              {/* Login/Register pueden ir aquí o separados si quieres sin Navbar */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* ------------------------------- */}
            {/* GRUPO 2: RUTAS ADMIN (Con Sidebar propio) */}
            {/* ------------------------------- */}
            
            {/* Redirección básica si alguien entra a /admin */}
            <Route path="/admin" element={<LoginPage />} />

            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/pos" element={<PosPage />} />
              <Route path="/admin/finance" element={<FinancePage />} />
              <Route path="/admin/custom-orders" element={<CustomManagerPage />} />
              <Route path="/admin/users" element={<UserListPage />} />
              <Route path="/admin/mockups" element={<MockupManager />} />
              {/* Rutas de Productos (Según tu estructura de carpetas actual) */}
              <Route path="/admin/productlist" element={<ProductListPage />} />
              <Route path="/admin/product/:id/edit" element={<ProductEditPage />} />
            </Route>

          </Routes>

        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;