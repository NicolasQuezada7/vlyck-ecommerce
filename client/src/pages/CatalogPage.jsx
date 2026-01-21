import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
// ✅ IMPORTAR LA IMAGEN DE FONDO
import personalizadasImg from '../assets/Personalizadas.png'; 

export default function CatalogPage() {
  // --- ESTADOS ---
  const [originalProducts, setOriginalProducts] = useState([]);
  const [displayItems, setDisplayItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Orden
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [filters, setFilters] = useState({ category: [], brand: [] });
  
  // UI States
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef(null);

  // Datos Estáticos
  const brands = ["Apple", "Samsung", "Huawei", "Redmi", "Xiaomi", "Motorola", "Vivo", "Oppo", "Honor", "Genericos"];
  const categories = ["MagFrame", "MagSafe Clear", "Clear Protect", "Personalizadas", "Accesorios", "Láminas", "Colorful", "Transparente MagSafe"];

  // --- CARGA DE DATOS ---
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortRef]);

  // --- PROCESAMIENTO ---
  useEffect(() => {
    let processed = [];
    originalProducts.forEach(product => {
      const mainImg = (Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : product.imageUrl;

      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
          const variantImg = (variant.images && variant.images.length > 0) ? variant.images[0] : mainImg;
          processed.push({
            _id: `${product._id}-${variant.color}`,
            originalId: product._id,
            name: `${product.name} - ${variant.color}`,
            shortName: product.name,
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
          shortName: product.name,
          imageUrl: mainImg,
          isVariant: false,
          stock: product.countInStock
        });
      }
    });
    setDisplayItems(processed);
  }, [originalProducts]);

  // --- LÓGICA DE FILTRADO ---
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
      return currentList.includes(value) 
        ? { ...prev, [type]: currentList.filter(item => item !== value) } 
        : { ...prev, [type]: [...currentList, value] };
    });
  };

  const clearFilters = () => setFilters({ category: [], brand: [] });
  const getProductImage = (img) => (!img || img.includes('placehold.co')) ? 'https://via.placeholder.com/300/000000/FFFFFF/?text=Vlyck' : img;

  const getSortLabel = () => {
      switch(sortOrder) {
          case 'low-high': return 'Precio: Bajo';
          case 'high-low': return 'Precio: Alto';
          default: return 'Novedad';
      }
  };

  // --- SIDEBAR CONTENT ---
  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-vlyck-lime rounded-full"></span> Categorías
        </h4>
        <div className="space-y-1">
            {categories.map(cat => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <div className={`w-4 h-4 rounded-sm border transition-all ${filters.category.includes(cat) ? 'bg-vlyck-lime border-vlyck-lime' : 'border-white/20 group-hover:border-white'}`}></div>
                    <input type="checkbox" className="hidden" checked={filters.category.includes(cat)} onChange={() => handleFilterChange('category', cat)} />
                    <span className={`text-sm ${filters.category.includes(cat) ? 'text-white font-bold' : 'text-gray-400 group-hover:text-white'}`}>{cat}</span>
                </label>
            ))}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-vlyck-cyan rounded-full"></span> Marcas
        </h4>
        <div className="space-y-1">
            {brands.map(b => (
                <label key={b} className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <div className={`w-4 h-4 rounded-sm border transition-all ${filters.brand.includes(b) ? 'bg-vlyck-cyan border-vlyck-cyan' : 'border-white/20 group-hover:border-white'}`}></div>
                    <input type="checkbox" className="hidden" checked={filters.brand.includes(b)} onChange={() => handleFilterChange('brand', b)} />
                    <span className={`text-sm ${filters.brand.includes(b) ? 'text-white font-bold' : 'text-gray-400 group-hover:text-white'}`}>{b}</span>
                </label>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white pt-20 font-sans selection:bg-vlyck-lime selection:text-black">
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; } 
        ::-webkit-scrollbar-track { background: #050505; } 
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #a7ff2d; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* --- HEADER CONTROL --- */}
      <div className="sticky top-[70px] z-30 bg-[#050505]/95 backdrop-blur-xl pt-6 pb-2">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div className="w-full md:w-auto">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-1 leading-none">
                        CATÁLOGO
                    </h1>
                    <p className="text-gray-500 text-sm font-medium">Explora {finalItems.length} productos premium</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative group w-full md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-vlyck-lime transition-colors">search</span>
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#111] border border-white/20 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:border-vlyck-lime focus:ring-1 focus:ring-vlyck-lime outline-none transition-all placeholder-gray-600 shadow-lg" />
                    </div>
                    
                    <div className="relative" ref={sortRef}>
                        <button onClick={() => setShowSortMenu(!showSortMenu)} className="h-full flex items-center justify-between gap-2 bg-[#111] border border-white/20 rounded-full px-4 text-sm font-bold text-white hover:border-vlyck-lime transition-colors min-w-[140px] shadow-lg">
                            <span>{getSortLabel()}</span>
                            <span className={`material-symbols-outlined text-lg transition-transform ${showSortMenu ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        {showSortMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col animate-fade-in">
                                <button onClick={() => { setSortOrder('newest'); setShowSortMenu(false); }} className="px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5">✨ Novedad</button>
                                <button onClick={() => { setSortOrder('low-high'); setShowSortMenu(false); }} className="px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5">💲 Precio: Bajo</button>
                                <button onClick={() => { setSortOrder('high-low'); setShowSortMenu(false); }} className="px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">💲 Precio: Alto</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <button onClick={() => setShowMobileFilters(true)} className="lg:hidden shrink-0 flex items-center gap-2 bg-vlyck-lime text-black px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide hover:brightness-110 transition-all shadow-lg">
                    <span className="material-symbols-outlined text-sm">tune</span> Filtros
                </button>

                <div className="flex gap-2 overflow-x-auto hide-scroll w-full items-center pb-2">
                    <button onClick={clearFilters} className={`shrink-0 px-5 py-2 rounded-full text-xs font-bold border transition-all ${filters.category.length === 0 ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-white/10 hover:border-white'}`}>
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => handleFilterChange('category', cat)} className={`shrink-0 px-5 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${filters.category.includes(cat) ? 'bg-vlyck-lime text-black border-vlyck-lime shadow-[0_0_15px_rgba(167,255,45,0.3)]' : 'bg-[#111] text-gray-300 border-white/10 hover:border-vlyck-lime/50 hover:text-white'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {(filters.category.length > 0 || filters.brand.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 mt-2 animate-fade-in pb-2">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mr-1">Activos:</span>
                    {filters.category.map(cat => (
                        <button key={cat} onClick={() => handleFilterChange('category', cat)} className="group px-3 py-1.5 bg-vlyck-lime/10 border border-vlyck-lime/40 rounded-lg text-xs font-bold text-vlyck-lime flex items-center gap-2 hover:bg-vlyck-lime hover:text-black transition-all">
                            {cat} <span className="material-symbols-outlined text-sm opacity-70 group-hover:opacity-100">close</span>
                        </button>
                    ))}
                    {filters.brand.map(b => (
                        <button key={b} onClick={() => handleFilterChange('brand', b)} className="group px-3 py-1.5 bg-vlyck-cyan/10 border border-vlyck-cyan/40 rounded-lg text-xs font-bold text-vlyck-cyan flex items-center gap-2 hover:bg-vlyck-cyan hover:text-black transition-all">
                            {b} <span className="material-symbols-outlined text-sm opacity-70 group-hover:opacity-100">close</span>
                        </button>
                    ))}
                    <button onClick={clearFilters} className="px-3 py-1.5 text-xs text-red-500 font-bold hover:bg-red-500/10 rounded-lg transition-colors ml-1">Borrar todo</button>
                </div>
            )}
        </div>
      </div>

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full relative">
        {/* SIDEBAR */}
        <aside className="hidden lg:block w-72 p-6 border-r border-white/10 sticky top-[250px] h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-black uppercase mb-6 text-white tracking-tight">Filtros</h3>
            <FilterContent />
        </aside>

        {/* DRAWER MÓVIL */}
        <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${showMobileFilters ? 'visible' : 'invisible'}`}>
            <div className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${showMobileFilters ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowMobileFilters(false)}></div>
            <div className={`absolute right-0 top-0 bottom-0 w-[300px] bg-[#0a0a0a] border-l border-white/10 p-6 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${showMobileFilters ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <h3 className="text-xl font-black uppercase text-white">Filtros</h3>
                    <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar"><FilterContent /></div>
                <div className="pt-4 border-t border-white/10 mt-4">
                    <button onClick={() => setShowMobileFilters(false)} className="w-full py-3 bg-vlyck-lime text-black font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(167,255,45,0.4)] transition-all">Ver Resultados</button>
                </div>
            </div>
        </div>

        {/* GRID */}
        <main className="flex-1 p-4 md:p-8">
            
            {/* ✅ BANNER PERSONALIZACIÓN CORREGIDO */}
            {(filters.category.length === 0 || filters.category.includes('Personalizadas')) && (
                <div className="relative w-full rounded-2xl overflow-hidden mb-8 border border-white/10 group shadow-2xl h-56 md:h-64">
                    {/* Imagen bajada y escalada */}
                    <img src={personalizadasImg} alt="Personalizar" className="absolute inset-0 w-full h-full object-cover scale-110 translate-y-8 opacity-80 group-hover:scale-125 transition-transform duration-700" />
                    
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>

                    <div className="relative z-20 h-full flex flex-row items-center justify-between px-8 md:px-12">
                        <div className="flex flex-col items-start justify-center">
                            <span className="px-2 py-0.5 bg-vlyck-lime text-black text-[10px] font-black uppercase tracking-widest rounded mb-3 shadow-[0_0_15px_rgba(167,255,45,0.4)]">
                                Vlyck Studio
                            </span>
                            {/* ✅ Texto corregido: Sin cursiva, tipo oración */}
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2 leading-[0.9]">
                                Personaliza <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-vlyck-lime to-white">tu estilo</span>
                            </h2>
                            <p className="text-gray-300 text-sm font-medium mb-6 max-w-md">
                                La imagen que quieras en tu carcasa.
                            </p>
                            <Link to="/customizer" className="px-6 py-2.5 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-vlyck-lime transition-all hover:scale-105 shadow-lg flex items-center gap-2 text-xs md:text-sm">
                                <span className="material-symbols-outlined text-lg">edit</span> Empezar
                            </Link>
                        </div>
                        
                        <div className="hidden md:flex items-center justify-center opacity-30">
                             <span className="material-symbols-outlined text-[150px] text-white rotate-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">brush</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading / Empty / Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">{[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-80 bg-white/5 rounded-2xl animate-pulse"></div>)}</div>
            ) : finalItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 min-h-[400px]">
                    <span className="material-symbols-outlined text-6xl mb-4 opacity-20">search_off</span>
                    <p className="text-2xl font-black text-gray-300 mb-2">Sin resultados</p>
                    <p className="text-sm mb-6">No encontramos productos con esos filtros.</p>
                    <button onClick={clearFilters} className="px-6 py-2 bg-white/10 hover:bg-vlyck-lime hover:text-black rounded-full text-xs font-bold uppercase tracking-wider transition-all">Limpiar filtros</button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {finalItems.map((item) => (
                        <Link to={`/product/${item.slug}${item.isVariant ? `?variant=${item.color}` : ''}`} key={item._id} className="group flex flex-col bg-[#111] rounded-2xl border border-white/5 hover:border-vlyck-lime/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(167,255,45,0.1)] overflow-hidden relative h-full">
                            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
                                {item.stock === 0 ? (
                                    <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded shadow-md">Agotado</span>
                                ) : (
                                    <>
                                        <span className="px-2 py-1 bg-white/90 text-black text-[10px] font-bold uppercase tracking-wider rounded backdrop-blur-sm shadow-sm">{item.brand}</span>
                                        {item.isVariant && <span className="px-2 py-1 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-white/10 backdrop-blur-sm">{item.color}</span>}
                                    </>
                                )}
                            </div>
                            <div className="relative aspect-square bg-[#080808] p-6 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-radial from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <img src={getProductImage(item.imageUrl)} alt={item.name} className={`w-full h-full object-contain z-10 transition-transform duration-500 group-hover:scale-110 ${item.stock === 0 ? 'grayscale opacity-50' : ''}`} />
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                    <span className="px-4 py-2 bg-vlyck-lime text-black text-xs font-black uppercase tracking-widest rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:scale-105 shadow-lg">Ver Detalles</span>
                                </div>
                            </div>
                            <div className="p-4 flex flex-col flex-grow bg-[#111] group-hover:bg-[#141414] transition-colors">
                                <div className="flex justify-between items-start mb-1"><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{item.category}</span></div>
                                <h3 className="text-sm font-bold text-white leading-tight mb-3 line-clamp-2 group-hover:text-vlyck-lime transition-colors">{item.shortName}</h3>
                                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex flex-col"><span className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Precio</span><span className="text-lg font-mono font-black text-white">${item.basePrice.toLocaleString('es-CL')}</span></div>
                                    <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-vlyck-lime hover:text-black transition-all group-hover:scale-110"><span className="material-symbols-outlined text-sm">arrow_forward</span></button>
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