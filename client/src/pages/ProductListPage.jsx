import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BRANDS = ["Todas", "Apple", "Samsung", "Huawei", "Redmi", "Xiaomi", "Motorola", "Vivo", "Oppo", "Honor", "Genericos"];
const CATEGORIES = ["Todas", "MagFrame", "MagSafe Clear", "Clear Protect", "Personalizadas", "Accesorios"];

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('Todas');
  const [filterCategory, setFilterCategory] = useState('Todas');

  // Estados de carga
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const { userInfo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      fetchProducts();
    } else {
      navigate('/admin');
    }
  }, [userInfo, navigate]);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`/api/products`);
      setProducts(data);
      setLoading(false);
    } catch (err) {
      setError('Error cargando productos');
      setLoading(false);
    }
  };

  // --- FUNCIÓN DE IMAGEN MEJORADA (BÚSQUEDA PROFUNDA) ---
  const getProductImg = (prod) => {
    // 1. Prioridad: Imagen de Portada Nueva
    if (prod.images && prod.images.length > 0) return prod.images[0];
    
    // 2. Prioridad: Imagen de Portada Vieja
    if (prod.imageUrl) return prod.imageUrl;

    // 3. Prioridad: Buscar en CUALQUIER variante (no solo la primera)
    if (prod.variants && prod.variants.length > 0) {
        // Buscamos la primera variante que tenga al menos una imagen
        const variantWithImage = prod.variants.find(v => v.images && v.images.length > 0);
        
        if (variantWithImage) {
            return variantWithImage.images[0];
        }
    }

    // 4. Fallback final
    return "https://via.placeholder.com/150?text=Sin+Foto";
  };

  const deleteHandler = async (id) => {
    if (window.confirm('¿Estás seguro de borrar este producto?')) {
      setLoadingDelete(true);
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`/api/products/${id}`, config);
        fetchProducts();
        setLoadingDelete(false);
      } catch (error) {
        alert('Error borrando producto');
        setLoadingDelete(false);
      }
    }
  };

  const createProductHandler = async () => {
    setLoadingCreate(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data: createdProduct } = await axios.post(`/api/products`, {}, config);
      navigate(`/admin/product/${createdProduct._id}/edit`);
    } catch (error) {
      console.error(error);
      alert('Error al crear producto');
      setLoadingCreate(false);
    }
  };

  // --- LÓGICA DE FILTRADO ---
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === 'Todas' || product.brand === filterBrand;
    const matchesCategory = filterCategory === 'Todas' || product.category === filterCategory;

    return matchesSearch && matchesBrand && matchesCategory;
  });

  if (loading) return <div className="text-white pt-32 text-center">Cargando inventario...</div>;

  return (
    <div className="pt-32 pb-20 px-4 max-w-[1440px] mx-auto">
      
      {/* Cabecera y Botón de Crear */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Inventario</h2>
          <p className="text-gray-500 text-sm">Gestiona tu catálogo ({products.length} productos)</p>
        </div>

        <button
          onClick={createProductHandler}
          disabled={loadingCreate}
          className="flex items-center gap-2 px-6 py-3 bg-vlyck-gradient text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(167,255,45,0.3)] disabled:opacity-50"
        >
          {loadingCreate ? (
            <span>Creando...</span>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Crear Producto
            </>
          )}
        </button>
      </div>

      {/* --- BARRA DE HERRAMIENTAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-[#111] p-4 rounded-2xl border border-white/10">
        <div className="md:col-span-2 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">search</span>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-vlyck-lime outline-none"
          />
        </div>

        <div className="relative">
          <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white appearance-none cursor-pointer focus:border-vlyck-lime outline-none">
            {BRANDS.map(brand => <option key={brand} value={brand} className="bg-[#111]">{brand}</option>)}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">expand_more</span>
        </div>

        <div className="relative">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white appearance-none cursor-pointer focus:border-vlyck-lime outline-none">
            {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#111]">{cat}</option>)}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">expand_more</span>
        </div>
      </div>

      {error && <div className="bg-red-500/10 text-red-500 p-4 rounded mb-4">{error}</div>}

      {/* Tabla Detallada */}
      <div className="w-full bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-xl mb-20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-gray-500 text-[10px] uppercase tracking-widest font-semibold border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Imagen</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Marca</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="group hover:bg-white/5 transition-colors">

                  {/* Columna Imagen */}
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                      <img 
                        src={getProductImg(product)} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        // Si la imagen falla, ponemos placeholder
                        onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error" }}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                  <td className="px-6 py-4 text-vlyck-lime font-mono">${product.basePrice.toLocaleString('es-CL')}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-gray-300 border border-white/10">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{product.brand}</td>

                  <td className="px-6 py-4 text-right flex justify-end gap-2 items-center h-full pt-6">
                    <Link to={`/admin/product/${product._id}/edit`} className="p-2 rounded-lg bg-white/5 text-white hover:bg-vlyck-cyan hover:text-black transition-all" title="Editar">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </Link>
                    <button onClick={() => deleteHandler(product._id)} disabled={loadingDelete} className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-500 hover:text-white transition-all" title="Eliminar">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    {searchTerm ? 'No se encontraron productos.' : 'No hay productos en inventario.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}