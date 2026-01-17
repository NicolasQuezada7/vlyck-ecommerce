import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function CatalogPage() {
  const [originalProducts, setOriginalProducts] = useState([]);
  const [displayItems, setDisplayItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [filters, setFilters] = useState({ category: [], brand: [] });

  const brands = ["Apple", "Samsung", "Huawei", "Redmi", "Xiaomi", "Motorola", "Vivo", "Oppo", "Honor", "Genericos"];
  const categories = ["MagFrame", "MagSafe Clear", "Clear Protect", "Personalizadas", "Accesorios", "Láminas", "Colorful", "Transparente MagSafe"];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`/api/products`);
        setOriginalProducts(data.reverse());
        setLoading(false);
      } catch (error) { setLoading(false); }
    };
    fetchProducts();
  }, []);

  // --- LÓGICA DE EXPLOSIÓN ACTUALIZADA ---
  useEffect(() => {
    let processed = [];
    originalProducts.forEach(product => {
      const mainImg = (Array.isArray(product.images) && product.images.length > 0)
        ? product.images[0]
        : product.imageUrl;

      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
          const variantImg = (variant.images && variant.images.length > 0)
            ? variant.images[0]
            : mainImg;

          processed.push({
            _id: `${product._id}-${variant.color}`,
            originalId: product._id,
            name: `${product.name} - ${variant.color}`,
            slug: product.slug,
            basePrice: product.basePrice,
            imageUrl: variantImg,
            brand: product.brand,
            category: product.category,
            color: variant.color,
            isVariant: true,
            stock: variant.stock
          });
        });
      } else {
        processed.push({
          ...product,
          imageUrl: mainImg,
          isVariant: false,
          stock: product.countInStock
        });
      }
    });
    setDisplayItems(processed);
  }, [originalProducts]);

  const getFilteredItems = () => {
    let result = displayItems.filter(item => {
      const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = filters.category.length === 0 || filters.category.includes(item.category);
      const brandMatch = filters.brand.length === 0 || filters.brand.includes(item.brand);
      return searchMatch && categoryMatch && brandMatch;
    });
    if (sortOrder === 'low-high') result.sort((a, b) => a.basePrice - b.basePrice);
    else if (sortOrder === 'high-low') result.sort((a, b) => b.basePrice - a.basePrice);
    return result;
  };

  const finalItems = getFilteredItems();

  const handleFilterChange = (type, value) => {
    setFilters(prev => {
      const currentList = prev[type];
      return currentList.includes(value) ? { ...prev, [type]: currentList.filter(item => item !== value) } : { ...prev, [type]: [...currentList, value] };
    });
  };

  const getProductImage = (img) => (!img || img.includes('placehold.co')) ? img : img;
  const getSortLabel = () => sortOrder === 'low-high' ? 'Precio: Menor a Mayor' : sortOrder === 'high-low' ? 'Precio: Mayor a Menor' : 'Ordenar por: Novedad';

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white pt-20">
      <style>{`::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-track { background: #0a0a0a; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: #a7ff2d; }`}</style>

      {/* HEADER */}
      <nav className="bg-[#050505] py-8 px-4 lg:px-8 border-b border-white/10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 min-w-fit">
          <h1 className="text-3xl font-bold font-sans text-white">Catálogo Completo</h1>
          <div className="text-sm text-gray-400 flex items-center">
            <Link to="/" className="cursor-pointer hover:text-vlyck-lime">Inicio</Link>
            <span className="mx-2">{'>'}</span><span className="text-vlyck-lime">Catálogo</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:justify-end">
          <div className="relative w-full md:w-96 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-vlyck-lime transition-colors">search</span>
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#111] border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-vlyck-lime outline-none transition-all" />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-between">
            <div className="relative group z-30 min-w-[200px]">
              <button className="flex items-center justify-between w-full gap-2 py-2.5 px-4 bg-white/10 rounded-lg text-white text-sm border border-white/20 hover:border-vlyck-cyan transition-colors"><span>{getSortLabel()}</span><span className="material-symbols-outlined text-sm">expand_more</span></button>
              <div className="absolute right-0 mt-2 w-full bg-[#111111] border border-white/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <button onClick={() => setSortOrder('newest')} className="block w-full text-left px-4 py-3 text-sm hover:bg-white/10">Novedad</button>
                <button onClick={() => setSortOrder('low-high')} className="block w-full text-left px-4 py-3 text-sm hover:bg-white/10">Precio: Menor a Mayor</button>
                <button onClick={() => setSortOrder('high-low')} className="block w-full text-left px-4 py-3 text-sm hover:bg-white/10">Precio: Mayor a Menor</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        <aside className="hidden lg:block w-[280px] p-8 border-r border-white/10 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar">
          <h3 className="text-xl font-bold mb-6 font-sans text-white">Filtros</h3>
          <div className="mb-6 border-b border-white/10 pb-4">
            <div className="py-2 text-lg font-semibold text-vlyck-lime mb-2">Categoría</div>
            <div className="space-y-3">{categories.map(cat => (<label key={cat} className="flex items-center gap-3 py-1 text-gray-300 hover:text-white cursor-pointer group"><input type="checkbox" className="hidden" checked={filters.category.includes(cat)} onChange={() => handleFilterChange('category', cat)} /><div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${filters.category.includes(cat) ? 'bg-vlyck-lime border-vlyck-lime' : 'border-gray-500 group-hover:border-vlyck-lime'}`}><span className={`material-symbols-outlined text-black text-[14px] font-bold ${filters.category.includes(cat) ? 'opacity-100' : 'opacity-0'}`}>check</span></div><span className="text-base">{cat}</span></label>))}</div>
          </div>
          <div className="mb-6 border-b border-white/10 pb-4">
            <div className="py-2 text-lg font-semibold text-vlyck-lime mb-2">Marca</div>
            <div className="space-y-3">{brands.map(b => (<label key={b} className="flex items-center gap-3 py-1 text-gray-300 hover:text-white cursor-pointer group"><input type="checkbox" className="hidden" checked={filters.brand.includes(b)} onChange={() => handleFilterChange('brand', b)} /><div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${filters.brand.includes(b) ? 'bg-vlyck-lime border-vlyck-lime' : 'border-gray-500 group-hover:border-vlyck-lime'}`}><span className={`material-symbols-outlined text-black text-[14px] font-bold ${filters.brand.includes(b) ? 'opacity-100' : 'opacity-0'}`}>check</span></div><span className="text-base">{b}</span></label>))}</div>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8 bg-[#050505]">
          
          {/* --- BANNER DE PERSONALIZACIÓN --- */}
          {/* Se muestra si no hay filtros O si el filtro incluye 'Personalizadas' */}
          {(filters.category.length === 0 || filters.category.includes('Personalizadas')) && (
            <div className="w-full bg-gradient-to-r from-purple-900 to-black rounded-2xl p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 max-w-lg">
                    <span className="px-3 py-1 bg-vlyck-lime text-black text-xs font-black uppercase tracking-widest rounded-full mb-4 inline-block">Nuevo Motor</span>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">Crea tu propia <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-vlyck-lime to-white">Obra de Arte</span></h2>
                    <p className="text-gray-300 text-sm md:text-base">Sube tu foto, ajusta el diseño y recibe una carcasa única en el mundo. Disponible para iPhone 13.</p>
                </div>
                <Link to="/customizer" className="relative z-10 px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-vlyck-lime hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 whitespace-nowrap">
                    <span className="material-symbols-outlined">edit</span> Personalizar Ahora
                </Link>
            </div>
          )}

          {loading ? <div className="text-center py-20 text-vlyck-lime">Cargando catálogo...</div> : finalItems.length === 0 ? <div className="flex flex-col items-center justify-center py-20 text-gray-500"><span className="material-symbols-outlined text-5xl mb-4 opacity-50">search_off</span><p>No hay variantes que coincidan.</p></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {finalItems.map((item) => (
                <Link to={`/product/${item.slug}${item.isVariant ? `?variant=${item.color}` : ''}`} key={item._id} className="group relative bg-[#111111] rounded-xl shadow-lg overflow-hidden flex flex-col border border-white/5 hover:border-vlyck-lime/50 h-full hover:-translate-y-1 transition-all duration-300">
                  <span className="absolute top-2 left-2 z-20 px-3 py-1 rounded-full text-xs font-bold text-black bg-white/80 backdrop-blur-sm">{item.category}</span>
                  {item.isVariant && <span className="absolute top-2 right-2 z-20 px-3 py-1 rounded-full text-xs font-bold text-white bg-black/50 border border-white/20 backdrop-blur-sm">{item.color}</span>}
                  <div className="w-full h-64 overflow-hidden flex items-center justify-center bg-[#1a1a1a] relative">
                    <img src={getProductImage(item.imageUrl)} alt={item.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <p className="text-xs text-vlyck-cyan font-bold uppercase tracking-wider mb-1">{item.brand}</p>
                    <h3 className="text-lg font-bold mb-1 font-sans text-white truncate">{item.name}</h3>
                    <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
                      <p className="text-xl font-bold text-white">${item.basePrice.toLocaleString('es-CL')}</p>
                      {item.stock === 0 && <span className="text-xs text-red-500 font-bold uppercase">Agotado</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}