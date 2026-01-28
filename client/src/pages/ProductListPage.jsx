import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// --- CONSTANTES ---
const BRANDS = ["Todas", "Apple", "Samsung", "Huawei", "Redmi", "Xiaomi", "Motorola", "Vivo", "Oppo", "Honor", "Genericos"];
const CATEGORIES = ["Todas", "MagFrame", "MagSafe Clear", "Clear Protect", "Personalizadas", "Accesorios", "Láminas", "Colorful", "Transparente MagSafe"];
const PRESET_COLORS = ["Todos", "Negro", "Blanco", "Rosado", "Naranja", "Burdeo", "Azul", "Verde", "Transparente", "Rojo", "Lila"];

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('Todas');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterColor, setFilterColor] = useState('Todos');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados de carga y feedback
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  // --- NUEVO: ESTADOS PARA MODAL DE ELIMINAR ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const { userInfo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      fetchProducts();
    } else {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  // Resetear a pág 1 si cambian los filtros
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterBrand, filterCategory, filterColor]);

  // --- HELPER NOTIFICACIONES ---
  const showToastMsg = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`/api/products`);
      // ORDENAR: El más nuevo primero (descendente por fecha)
      const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProducts(sortedData);
      setLoading(false);
    } catch (err) {
      showToastMsg('Error cargando inventario', 'error');
      setLoading(false);
    }
  };

  // --- OBTENER IMAGEN ---
  const getProductImg = (prod) => {
    if (prod.images && prod.images.length > 0) return prod.images[0];
    if (prod.imageUrl) return prod.imageUrl;
    if (prod.variants && prod.variants.length > 0) {
        const variantWithImage = prod.variants.find(v => v.images && v.images.length > 0);
        if (variantWithImage) return variantWithImage.images[0];
    }
    return "https://via.placeholder.com/150?text=Sin+Foto";
  };

  // --- LÓGICA ELIMINAR (MODIFICADA) ---
  const openDeleteModal = (id) => {
      setProductToDelete(id);
      setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    setProcessing(true); // Usamos loadingDelete visualmente
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`/api/products/${productToDelete}`, config);
      
      showToastMsg('Producto eliminado correctamente');
      setShowDeleteModal(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      showToastMsg('Error al eliminar producto', 'error');
    }
    setProcessing(false);
  };

  const createProductHandler = async () => {
    setProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data: createdProduct } = await axios.post(`/api/products`, {}, config);
      navigate(`/admin/product/${createdProduct._id}/edit`);
    } catch (error) {
      showToastMsg('Error al inicializar producto', 'error');
      setProcessing(false);
    }
  };

  // --- LÓGICA DE FILTRADO ---
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === 'Todas' || product.brand === filterBrand;
    const matchesCategory = filterCategory === 'Todas' || product.category === filterCategory;
    
    let matchesColor = true;
    if (filterColor !== 'Todos') {
        const hasVariantColor = product.variants?.some(v => v.color === filterColor);
        const hasRootColor = product.color === filterColor; 
        matchesColor = hasVariantColor || hasRootColor;
    }

    return matchesSearch && matchesBrand && matchesCategory && matchesColor;
  });

  // Índices Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="text-vlyck-lime pt-32 text-center animate-pulse">Cargando inventario...</div>;

  return (
    <div className="pt-4 pb-20 px-4 max-w-[1440px] mx-auto font-sans relative">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Inventario</h2>
          <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-widest">
            {filteredProducts.length} productos • Ordenados por fecha
          </p>
        </div>

        <button
          onClick={createProductHandler}
          disabled={processing}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-vlyck-lime text-black font-black uppercase text-sm rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(167,255,45,0.3)] disabled:opacity-50"
        >
          {processing ? 'Procesando...' : (
            <>
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Crear Producto
            </>
          )}
        </button>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="bg-[#111] p-4 rounded-2xl border border-white/10 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Buscador */}
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">search</span>
                <input
                    type="text"
                    placeholder="Buscar nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white text-xs focus:border-vlyck-lime outline-none transition-colors"
                />
            </div>

            {/* Marca */}
            <div className="relative">
                <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white text-xs appearance-none cursor-pointer focus:border-vlyck-lime outline-none">
                    {BRANDS.map(b => <option key={b} value={b} className="bg-[#111]">{b}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">expand_more</span>
            </div>

            {/* Categoría */}
            <div className="relative">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white text-xs appearance-none cursor-pointer focus:border-vlyck-lime outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">expand_more</span>
            </div>

            {/* Color */}
            <div className="relative">
                <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white text-xs appearance-none cursor-pointer focus:border-vlyck-lime outline-none">
                    {PRESET_COLORS.map(c => <option key={c} value={c} className="bg-[#111]">{c === 'Todos' ? 'Todos los Colores' : c}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">palette</span>
            </div>
          </div>
      </div>

      {/* --- VISTA MÓVIL (CARDS) --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden mb-8">
        {currentItems.map(product => (
            <div key={product._id} className="bg-[#111] border border-white/10 rounded-xl p-4 flex gap-4 items-start shadow-lg relative overflow-hidden group">
                
                {/* Imagen */}
                <div className="w-20 h-20 bg-black rounded-lg shrink-0 border border-white/5 flex items-center justify-center overflow-hidden">
                    <img src={getProductImg(product)} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error" }} />
                </div>
                
                {/* Información Principal */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    
                    {/* Nombre y Categorías */}
                    <div className="mb-2">
                        {/* Nombre completo (text-wrap para que baje de línea si es largo) */}
                        <h3 className="text-white font-bold text-sm leading-tight mb-1.5">{product.name}</h3>
                        
                        {/* Badges para Marca y Categoría */}
                        <div className="flex flex-wrap gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-vlyck-lime/10 text-vlyck-lime border border-vlyck-lime/20">
                                {product.brand}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-gray-400 border border-white/10">
                                {product.category}
                            </span>
                        </div>
                    </div>

                    {/* Stock y Fecha */}
                    <div className="flex items-center gap-3">
                        <p className={`text-[10px] font-bold px-2 py-0.5 rounded ${product.countInStock > 0 ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                            {product.countInStock > 0 ? `Stock: ${product.countInStock}` : 'AGOTADO'}
                        </p>
                    </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-col gap-2 pl-2 border-l border-white/10 justify-center h-full">
                    <Link to={`/admin/product/${product._id}/edit`} className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                    </Link>
                    <button onClick={() => openDeleteModal(product._id)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* --- VISTA DESKTOP (TABLA) - SIN CAMBIOS --- */}
      <div className="hidden md:block w-full bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-xl mb-8">
        <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-gray-500 text-[10px] uppercase tracking-widest font-semibold border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Imagen</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Detalles</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentItems.map((product) => (
                <tr key={product._id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded-lg border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                      <img src={getProductImg(product)} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error" }} />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-white text-sm">{product.name}</td>
                  <td className="px-6 py-4 text-vlyck-lime font-mono text-sm">${product.basePrice.toLocaleString('es-CL')}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-300 uppercase">{product.brand}</span>
                        <span className="text-[9px] text-gray-500">{product.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-400">{product.countInStock}</td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-mono">{new Date(product.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Link to={`/admin/product/${product._id}/edit`} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Link>
                        {/* Botón llama al Modal */}
                        <button onClick={() => openDeleteModal(product._id)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>

      {/* --- ESTADO VACÍO --- */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-20 text-gray-500 bg-[#111] rounded-2xl border border-white/10 border-dashed">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-30">inventory_2</span>
            <p>{searchTerm ? 'No se encontraron productos.' : 'Inventario vacío.'}</p>
        </div>
      )}

      {/* --- PAGINACIÓN --- */}
      {filteredProducts.length > itemsPerPage && (
          <div className="flex justify-center md:justify-end gap-2 mt-4">
              <button onClick={() => paginate(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#111] border border-white/10 text-white disabled:opacity-30 hover:border-vlyck-lime"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
              <div className="flex items-center px-4 bg-[#111] border border-white/10 rounded-lg text-xs font-bold text-gray-400">
                  Página {currentPage} / {totalPages}
              </div>
              <button onClick={() => paginate(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#111] border border-white/10 text-white disabled:opacity-30 hover:border-vlyck-lime"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          </div>
      )}

      {/* --- MODAL CONFIRMACIÓN BORRAR --- */}
      {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#111] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-bounce-in relative">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">¿Eliminar Producto?</h3>
                      <p className="text-xs text-gray-400 mb-6">
                          Esta acción borrará el producto del inventario permanentemente. No se puede deshacer.
                      </p>
                      
                      <div className="flex gap-3 w-full">
                          <button 
                              onClick={() => { setShowDeleteModal(false); setProductToDelete(null); }} 
                              className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-colors text-xs uppercase"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={confirmDelete}
                              disabled={processing}
                              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 text-xs uppercase disabled:opacity-50"
                          >
                              {processing ? 'Borrando...' : 'Sí, Eliminar'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- TOAST --- */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
            <div className={`px-6 py-3 rounded-full border flex items-center gap-3 backdrop-blur-md shadow-2xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-vlyck-lime/10 border-vlyck-lime text-vlyck-lime'}`}>
                <span className="material-symbols-outlined">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                <span className="font-bold text-sm uppercase">{toast.msg}</span>
            </div>
        </div>
      )}

    </div>
  );
}