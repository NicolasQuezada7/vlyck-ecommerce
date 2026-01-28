import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

// 1. IMPORTS DE IMÁGENES (Ajusta los nombres si cambian)
import heroBg from '../assets/hero-bg.jpg'; 
import magSafeLocal from '../assets/MagSafe3.png';   
import magFrameLocal from '../assets/MagFrame.png';
import personalizadasLocal from '../assets/Personalizadas.png';
import laminas from '../assets/laminas.png';
import clearProtect from '../assets/clearprotect.png';
// 2. CONSTANTES DE IMÁGENES
const magSafeBannerImg = magSafeLocal; 
const magFrameBannerImg = magFrameLocal; 

// Fallbacks para las que no tienes local aún
const customBannerImg = personalizadasLocal; 
const clearProtectBannerImg = clearProtect; 
const laminasBannerImg = laminas;
const accesoriosBannerImg = "https://images.unsplash.com/photo-1625246733230-e25f69ce997e?q=80&w=1200&auto=format&fit=crop"; 

// --- COMPONENTE BOTÓN DE SCROLL (REUTILIZABLE) ---
// Lo sacamos aquí para que lo usen TODAS las secciones por igual
const ScrollButton = ({ direction, onClick }) => (
    <button 
        onClick={onClick} 
        className={`absolute top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-sm
        ${direction === 'left' ? '-left-4 md:-left-6' : '-right-4 md:-right-6'}
        bg-black/50 text-white hover:bg-vlyck-lime hover:text-black hover:scale-110 hover:shadow-[0_0_20px_rgba(167,255,45,0.5)]`}
    >
        <span className="material-symbols-outlined text-2xl">
            {direction === 'left' ? 'chevron_left' : 'chevron_right'}
        </span>
    </button>
);

// --- COMPONENTE DE SECCIÓN (REUTILIZABLE) ---
const CategorySection = ({ title, subtitle, bannerImg, bannerTitle, bannerSubtitle, products, bgColor = "bg-white", tagColor = "bg-black" }) => {
    const scrollRef = useRef(null);

    const scroll = (offset) => {
        if (scrollRef.current) scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    };

    return (
        <section className={`py-24 ${bgColor} text-black border-t border-gray-200`}>
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-16">
                
                {/* BANNER */}
                <div className="relative w-full h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl group">
                    <img src={bannerImg} alt={bannerTitle} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`px-4 py-1 ${tagColor === 'bg-vlyck-lime' ? 'bg-vlyck-lime text-black' : 'bg-vlyck-cyan text-black'} text-xs font-black uppercase tracking-widest rounded-full shadow-lg`}>
                                Disponible
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tight">
                            {bannerTitle} <br/><span className="text-white/80 text-3xl md:text-5xl font-light">{bannerSubtitle}</span>
                        </h2>
                    </div>
                </div>

                {/* CARRUSEL */}
                <div className="w-full relative">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div>
                            <h3 className="text-2xl font-bold mb-1">{title}</h3>
                            <p className="text-gray-500 text-sm">{subtitle}</p>
                        </div>
                    </div>

                    <div className="relative group/carousel">
                        {/* FLECHAS LATERALES */}
                        <ScrollButton direction="left" onClick={() => scroll(-350)} />
                        <ScrollButton direction="right" onClick={() => scroll(350)} />

                        {products.length > 0 ? (
                            <div ref={scrollRef} className="flex gap-6 overflow-x-auto scrollbar-hide pb-10 snap-x custom-scrollbar scroll-smooth">
                                {products.map((item) => (
                                    <Link key={item._id} to={`/product/${item.slug}${item.isVariant ? `?variant=${item.color}` : ''}`} className="group relative flex-none w-[280px] snap-start bg-white rounded-2xl border border-gray-100 hover:border-black/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                        {item.isVariant && <span className="absolute top-3 right-3 z-10 px-2 py-1 bg-gray-100/90 backdrop-blur text-[10px] font-bold uppercase tracking-wider rounded text-gray-600">{item.color}</span>}
                                        <div className="h-[220px] p-6 flex items-center justify-center bg-gray-50 rounded-t-2xl overflow-hidden relative">
                                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div> 
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 relative z-10" />
                                        </div>
                                        <div className="p-5">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{item.brand}</p>
                                            <h4 className="text-lg font-bold text-black mb-2 truncate">{item.name}</h4>
                                            <div className="flex items-center justify-between mt-4">
                                                <span className="text-xl font-black text-black">${item.basePrice.toLocaleString('es-CL')}</span>
                                                <span className={`w-10 h-10 rounded-full bg-black text-white flex items-center justify-center group-hover:${tagColor === 'bg-vlyck-lime' ? 'bg-vlyck-lime' : 'bg-vlyck-cyan'} group-hover:text-black transition-all shadow-lg`}>
                                                    <span className="material-symbols-outlined">add</span>
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50"><p>No hay productos disponibles en esta categoría.</p></div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- PÁGINA PRINCIPAL ---
export default function HomePage() {
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const newReleasesRef = useRef(null);

  // Estados buscador
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]); 
  const navigate = useNavigate();

  const handleSearch = (e) => {
    const text = e.target.value;
    setKeyword(text);
    if (text.trim() === '') { setSuggestions([]); } else {
      const filtered = products.filter((p) => p.name.toLowerCase().includes(text.toLowerCase()) || p.brand.toLowerCase().includes(text.toLowerCase()));
      setSuggestions(filtered.slice(0, 5)); 
    }
  };

  const handleSuggestionClick = () => { setKeyword(''); setSuggestions([]); };

  // Scroll function para la ref local
  const scrollMain = (offset) => { if (newReleasesRef.current) newReleasesRef.current.scrollBy({ left: offset, behavior: 'smooth' }); };

  useEffect(() => {
    const fetchAndProcessProducts = async () => {
      try {
        const { data } = await axios.get(`/api/products`);
        const rawProducts = data.reverse(); 
        let processed = [];

        rawProducts.forEach(product => {
          const mainImg = (Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : product.imageUrl;
          if (product.variants && product.variants.length > 0) {
            product.variants.forEach(variant => {
              const variantImg = (variant.images && variant.images.length > 0) ? variant.images[0] : mainImg;
              processed.push({
                _id: `${product._id}-${variant.color}`, originalId: product._id,
                name: `${product.name}`, displayName: `${product.name} - ${variant.color}`, 
                slug: product.slug, basePrice: product.basePrice, imageUrl: variantImg, 
                brand: product.brand, category: product.category, description: product.description,
                isVariant: true, color: variant.color, stock: variant.stock
              });
            });
          } else {
            processed.push({
              ...product, _id: product._id, displayName: product.name, imageUrl: mainImg,
              isVariant: false, stock: product.countInStock
            });
          }
        });
        setProducts(processed);
        setLoading(false);
      } catch (error) { setLoading(false); }
    };
    fetchAndProcessProducts();
  }, []);

  // FILTROS
  const magSafeProducts = products.filter(p => p.category === 'MagSafe Clear').slice(0, 10);
  const customProducts = products.filter(p => p.category === 'Personalizadas').slice(0, 10);
  const magFrameProducts = products.filter(p => p.category === 'MagFrame').slice(0, 10);
  const clearProtectProducts = products.filter(p => p.category === 'Clear Protect').slice(0, 10);
  const laminasProducts = products.filter(p => p.category === 'Láminas' || p.category === 'Laminas').slice(0, 10);
  const accesoriosProducts = products.filter(p => p.category === 'Accesorios').slice(0, 10);

  return (
    <div className="bg-background-dark min-h-screen text-white font-sans">
      
      {/* HERO SECTION */}
      <div className="relative w-full h-[750px] overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Background" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/60 to-[#050505]"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center max-w-5xl mx-auto pb-20">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[0.9]">
            Descubre la Próxima<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">Generación.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-2xl mb-10 max-w-2xl font-light">Accesorios premium para el setup moderno.</p>
          <Link to="/all" className="group relative px-10 py-4 rounded-full bg-vlyck-gradient text-black font-bold text-lg transition-transform duration-300 hover:scale-105 inline-block">
            <span className="relative z-10 flex items-center gap-2">Ver Catálogo <span className="material-symbols-outlined text-xl">arrow_forward</span></span>
          </Link>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative z-30 px-4 -mt-24 mb-16">
        <div className="max-w-4xl mx-auto relative"> 
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col lg:flex-row items-center gap-6">
            <div className="relative w-full lg:flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><span className="material-symbols-outlined">search</span></span>
              <input className="w-full h-14 pl-12 pr-4 bg-white/10 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vlyck-cyan transition-all" placeholder="Buscar carcasas, láminas..." type="text" value={keyword} onChange={handleSearch} />
            </div>
          </div>
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-4 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto custom-scrollbar">
              {suggestions.map((item) => (
                <Link key={item._id} to={`/product/${item.slug}${item.isVariant ? `?variant=${item.color}` : ''}`} onClick={handleSuggestionClick} className="flex items-center gap-4 p-4 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0">
                  <div className="w-12 h-12 bg-white/5 rounded-lg p-1 shrink-0 flex items-center justify-center"><img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" /></div>
                  <div className="flex-1"><h4 className="font-bold text-white text-sm">{item.displayName}</h4></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 0. NUEVOS LANZAMIENTOS (CORREGIDO: Flechas a los lados) */}
      <section className="py-20 relative max-w-[1440px] mx-auto px-4">
        <div className="flex items-center justify-between mb-10 px-2">
          <h2 className="text-3xl md:text-4xl font-bold">Nuevos Lanzamientos</h2>
          {/* Eliminados los botones de aquí */}
        </div>
        
        {loading ? <div className="text-center text-vlyck-lime animate-pulse">Cargando...</div> : (
          <div className="relative group/carousel"> {/* Wrapper para posicionar flechas */}
            
            {/* FLECHAS FLOTANTES AQUI TAMBIEN */}
            <ScrollButton direction="left" onClick={() => scrollMain(-400)} />
            <ScrollButton direction="right" onClick={() => scrollMain(400)} />

            <div ref={newReleasesRef} className="flex gap-6 overflow-x-auto scrollbar-hide pb-10 px-2 snap-x custom-scrollbar scroll-smooth">
                {products.slice(0, 15).map((item) => (
                // ✅ LINK COMPLETO PARA CLICKEAR TODA LA TARJETA
                <Link key={item._id} to={`/product/${item.slug}${item.isVariant ? `?variant=${item.color}` : ''}`} className="group relative flex-none w-[300px] snap-center block">
                    <div className="gradient-border-mask bg-card-dark h-full overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-2 border border-white/5 rounded-2xl">
                    <span className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-xs font-bold text-black bg-white/80 backdrop-blur-sm shadow-md">{item.category}</span>
                    {item.isVariant && <span className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-xs font-bold text-white bg-black/60 border border-white/20 backdrop-blur-sm">{item.color}</span>}
                    <div className="h-[280px] bg-[#1a1a1a] flex items-center justify-center p-6 relative overflow-hidden">
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" /> : <span className="text-xs text-gray-500">Sin Imagen</span>}
                    </div>
                    <div className="p-6">
                        <p className="text-xs text-vlyck-cyan font-bold uppercase tracking-wider mb-1">{item.brand}</p>
                        <h3 className="text-xl font-bold mb-1 truncate text-white">{item.name}</h3>
                        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
                        <span className="text-vlyck-lime font-bold text-xl">${item.basePrice.toLocaleString('es-CL')}</span>
                        <span className="size-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-vlyck-lime transition-colors shadow-lg"><span className="material-symbols-outlined">add_shopping_cart</span></span>
                        </div>
                    </div>
                    </div>
                </Link>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* SECCIONES APILADAS (Reordenadas) */}

      {/* 1. MAGSAFE CLEAR */}
      <CategorySection 
        title="Lo mejor de MagSafe Clear" 
        subtitle="Transparencia y protección magnética"
        bannerTitle="Colección MagSafe Clear"
        bannerSubtitle="Transparencia Total"
        bannerImg={magSafeBannerImg}
        products={magSafeProducts}
        bgColor="bg-white"
        tagColor="bg-vlyck-lime"
      />

      {/* 2. PERSONALIZADAS */}
      <CategorySection 
        title="Diseños Únicos y Exclusivos" 
        subtitle="Expresa tu estilo con nuestra serie personalizada"
        bannerTitle="Serie Personalizada"
        bannerSubtitle="Arte en tus manos"
        bannerImg={customBannerImg}
        products={customProducts}
        bgColor="bg-gray-50"
        tagColor="bg-vlyck-cyan"
      />

      {/* 3. MAGFRAME */}
      <CategorySection 
        title="Elegancia Metálica" 
        subtitle="Bordes reforzados y diseño minimalista"
        bannerTitle="Serie MagFrame™"
        bannerSubtitle="Protección Híbrida"
        bannerImg={magFrameBannerImg}
        products={magFrameProducts}
        bgColor="bg-white"
        tagColor="bg-vlyck-lime"
      />

      {/* 4. CLEAR PROTECT */}
      <CategorySection 
        title="Protección Cristalina" 
        subtitle="Resistencia superior sin ocultar tu equipo"
        bannerTitle="Clear Protect"
        bannerSubtitle="Anti-Amarilleo"
        bannerImg={clearProtectBannerImg}
        products={clearProtectProducts}
        bgColor="bg-gray-50"
        tagColor="bg-vlyck-cyan"
      />

      {/* 5. LÁMINAS */}
      <CategorySection 
        title="Protección de Pantalla" 
        subtitle="Hidrogel y vidrio templado de alta resistencia"
        bannerTitle="Screen Protection"
        bannerSubtitle="Escudo Invisible"
        bannerImg={laminasBannerImg}
        products={laminasProducts}
        bgColor="bg-white"
        tagColor="bg-vlyck-lime"
      />

      {/* 6. ACCESORIOS */}
      <CategorySection 
        title="Complementos Perfectos" 
        subtitle="Cargadores, cables y todo lo que necesitas"
        bannerTitle="Accesorios Tech"
        bannerSubtitle="Potencia tu Setup"
        bannerImg={accesoriosBannerImg}
        products={accesoriosProducts}
        bgColor="bg-gray-50"
        tagColor="bg-vlyck-cyan"
      />

      {/* FOOTER LINK */}
      <section className="py-24 bg-white text-black border-t border-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 text-center">
            <h2 className="text-4xl font-black mb-8">¿No encuentras lo que buscas?</h2>
            <Link to="/all" className="inline-block px-12 py-4 bg-black text-white font-bold rounded-full hover:bg-vlyck-lime hover:text-black transition-all">Ver Todo el Catálogo</Link>
        </div>
      </section>

    </div>
  );
}