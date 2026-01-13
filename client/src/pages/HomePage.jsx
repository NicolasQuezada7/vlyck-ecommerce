import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import heroBg from '../assets/hero-bg.jpg'; // Asegúrate de tener esta imagen en assets

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`/api/products`);
        setProducts(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="bg-background-dark min-h-screen text-white font-sans">
      
      {/* --- HERO SECTION --- */}
      <div className="relative w-full h-[750px] overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          {/* Imagen de fondo dinámica */}
          <img src={heroBg} alt="Background" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/60 to-[#050505]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center max-w-5xl mx-auto pb-20">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[0.9]">
            Descubre la Próxima<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
              Generación.
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-2xl mb-10 max-w-2xl font-light">
            Accesorios premium para el setup moderno. Donde la tecnología encuentra la exclusividad.
          </p>
        <Link 
    to="/all" 
    className="group relative px-10 py-4 rounded-full bg-vlyck-gradient text-black font-bold text-lg transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(167,255,45,0.6),_0_0_40px_rgba(45,255,255,0.4)] inline-block"
  >
    <span className="relative z-10 flex items-center gap-2">
      Ver Catálogo <span className="material-symbols-outlined text-xl">arrow_forward</span>
    </span>
  </Link>
        </div>
      </div>

      {/* --- SMART SEARCH (Flotante) --- */}
      <div className="relative z-30 px-4 -mt-24 mb-16">
        <div className="max-w-4xl mx-auto p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col lg:flex-row items-center gap-6">
          <div className="relative w-full lg:flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input 
              className="w-full h-14 pl-12 pr-4 bg-white/10 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vlyck-cyan transition-all" 
              placeholder="Buscar carcasas, láminas..." 
              type="text" 
            />
          </div>
          {/* Filtros rápidos visuales */}
          <div className="flex gap-4 items-center">
            <span className="text-gray-500 text-sm">Filtrar por:</span>
            <button className="text-2xl text-gray-400 hover:text-white transition"><span className="material-symbols-outlined">phone_iphone</span></button>
            <button className="text-2xl text-gray-400 hover:text-white transition"><span className="material-symbols-outlined">tablet_mac</span></button>
            <button className="text-2xl text-gray-400 hover:text-white transition"><span className="material-symbols-outlined">watch</span></button>
          </div>
        </div>
      </div>

      {/* --- NUEVOS LANZAMIENTOS (Tus productos reales) --- */}
      <section className="py-20 relative max-w-[1440px] mx-auto px-4">
        <div className="flex items-center justify-between mb-10 px-2">
          <h2 className="text-3xl md:text-4xl font-bold">Nuevos Lanzamientos</h2>
          <Link to="/all" className="flex items-center gap-1 text-primary hover:text-white transition-colors font-medium">
             Ver todo <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {/* CARRUSEL DE PRODUCTOS */}
        {loading ? (
           <div className="text-center text-vlyck-lime">Cargando inventario...</div>
        ) : (
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-10 px-2 snap-x">
            {products.map((product) => (
              <div key={product._id} className="group relative flex-none w-[300px] snap-center">
                <div className="gradient-border-mask bg-card-dark h-full overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-2">
                  
                  {/* Badge condicional */}
                  {product.category === 'Carcasas' && (
                    <span className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-xs font-black text-black bg-vlyck-gradient">
                      PREMIUM
                    </span>
                  )}

                  {/* Imagen */}
                  <div className="h-[220px] bg-[#1a1a1a] flex items-center justify-center p-6 relative overflow-hidden">
                     {product.imageUrl ? (
                       <img src={product.imageUrl} alt={product.name} className="object-contain h-full w-full mix-blend-screen group-hover:scale-110 transition-transform duration-500" />
                     ) : (
                       <div className="text-gray-600">Sin Imagen</div>
                     )}
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1 truncate">{product.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-1">{product.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-lg">${product.basePrice.toLocaleString('es-CL')}</span>
                      <Link to={`/product/${product.slug}`} className="size-10 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary">
                        <span className="material-symbols-outlined">add</span>
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- SECCIÓN COLECCIONES (Bento Grid) --- */}
      <section className="py-24 bg-white text-black">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Destacados</h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">Colecciones curadas para los usuarios más exigentes.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-auto md:h-[600px]">
                
                {/* Item 1: Vertical */}
                <div className="group relative overflow-hidden rounded-3xl cursor-pointer h-[300px] md:h-full">
                    <img src="https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=1000&auto=format&fit=crop" alt="iPhone" className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300"></div>
                    <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                        <h3 className="text-3xl font-bold mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Apple Gear</h3>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            <span className="text-vlyck-lime font-bold flex items-center gap-2">Ver Colección <span className="material-symbols-outlined text-sm">arrow_forward</span></span>
                        </div>
                    </div>
                </div>

                {/* Columna derecha con 2 items apilados */}
                <div className="flex flex-col gap-6 h-full lg:col-span-2">
                    
                    {/* Item 2: Horizontal Grande */}
                    <div className="group relative overflow-hidden rounded-3xl cursor-pointer h-[300px] flex-1">
                        <img src="https://images.unsplash.com/photo-1592434134753-a70baf7979d5?q=80&w=1000&auto=format&fit=crop" alt="Gaming" className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300"></div>
                        <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                            <h3 className="text-3xl font-bold mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Setup & Gaming</h3>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                <span className="text-vlyck-cyan font-bold flex items-center gap-2">Explorar <span className="material-symbols-outlined text-sm">arrow_forward</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Item 3: Horizontal Pequeño */}
                    <div className="group relative overflow-hidden rounded-3xl cursor-pointer h-[250px] flex-1">
                        <img src="https://images.unsplash.com/photo-1572569028738-411a39a74cc3?q=80&w=1000&auto=format&fit=crop" alt="Protection" className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300"></div>
                        <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                            <h3 className="text-3xl font-bold mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Protección Hidrogel</h3>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                <span className="text-white font-bold flex items-center gap-2">Configurar ahora <span className="material-symbols-outlined text-sm">arrow_forward</span></span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </section>

    </div>
  );
}