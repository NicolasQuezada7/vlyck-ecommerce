import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';

export default function ProductPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const urlVariant = searchParams.get('variant');
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // --- GALERÍA DE IMÁGENES ---
  const [activeImage, setActiveImage] = useState(''); // La imagen grande que se ve actualmente

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/products/${slug}`);
        setProduct(data);

        let preSelected = null;
        if (data.variants && data.variants.length > 0) {
          if (urlVariant) preSelected = data.variants.find(v => v.color.toLowerCase() === urlVariant.toLowerCase());
          if (!preSelected) preSelected = data.variants.find(v => v.stock > 0);
          if (!preSelected) preSelected = data.variants[0];

          setSelectedVariant(preSelected);
        }

        // --- INICIALIZAR GALERÍA ---
        // Decidimos qué foto mostrar primero
        if (preSelected && preSelected.images && preSelected.images.length > 0) {
          setActiveImage(preSelected.images[0]);
        } else if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0]);
        } else {
          // Fallback (o legacy imageUrl)
          setActiveImage(data.imageUrl || 'https://placehold.co/600x400?text=Vlyck');
        }

        setLoading(false);
      } catch (err) {
        setError('Producto no encontrado');
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, urlVariant]);

  // --- CAMBIO DE VARIANTE (Actualiza la galería) ---
  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    // Si la variante tiene fotos, ponemos la primera como activa
    if (variant.images && variant.images.length > 0) {
      setActiveImage(variant.images[0]);
    } else if (product.images && product.images.length > 0) {
      // Si no tiene, volvemos a la general
      setActiveImage(product.images[0]);
    }
  };

  const handleAddToCart = () => {
    if (product.variants && product.variants.length > 0 && !selectedVariant) return alert("Por favor selecciona un color.");
    addToCart(product);
    alert(`¡Agregado al carrito!`);
  };

  if (loading) return <div className="min-h-screen pt-40 text-center text-vlyck-lime">Cargando...</div>;
  if (!product) return null;

  const currentStock = selectedVariant ? selectedVariant.stock : product.countInStock;

  // --- OBTENER ARRAY DE IMÁGENES ACTUAL ---
  // ¿Qué lista de miniaturas mostramos? ¿Las del color o las generales?
  const currentGallery = (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0)
    ? selectedVariant.images
    : (product.images && product.images.length > 0) ? product.images : [product.imageUrl];

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white pt-20">
      <div className="bg-[#050505] py-6 px-4 md:px-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          <div className="text-sm text-gray-400 flex items-center flex-wrap">
            <Link to="/" className="cursor-pointer hover:text-vlyck-lime">Inicio</Link>
            <span className="mx-2 text-white/20">{'>'}</span>
            <Link to="/all" className="cursor-pointer hover:text-vlyck-lime">Catálogo</Link>
            <span className="mx-2 text-white/20">{'>'}</span>
            <span className="text-vlyck-lime font-medium truncate">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 py-10 px-4 md:px-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* --- SECCIÓN GALERÍA --- */}
          <div className="flex flex-col gap-4">
            {/* Imagen Grande */}
            <div className="w-full bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative group aspect-square flex items-center justify-center">
              <img src={activeImage} alt={product.name} className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-500" />
            </div>

            {/* Carrusel de Miniaturas */}
            {currentGallery.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {currentGallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 shrink-0 rounded-xl border-2 overflow-hidden transition-all ${activeImage === img ? 'border-vlyck-lime opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="flex flex-col justify-center sticky top-28">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-vlyck-cyan uppercase tracking-wider border border-white/10">{product.brand}</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-400 uppercase tracking-wider border border-white/5">{product.category}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight font-sans">{product.name}</h1>
            <p className="text-4xl text-vlyck-lime font-mono font-bold mb-8">${product.basePrice.toLocaleString('es-CL')}</p>

            {/* --- SELECTOR DE COLOR --- */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-8">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 block">Color</label>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.color}
                      onClick={() => handleVariantChange(variant)}
                      className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${selectedVariant?.color === variant.color
                          ? 'border-vlyck-lime bg-vlyck-lime/10 text-white shadow-[0_0_15px_rgba(167,255,45,0.2)]'
                          : 'border-white/10 bg-[#111] text-gray-400 hover:border-white/30'
                        } ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={variant.stock === 0}
                    >
                      <span>{variant.color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent mb-8"></div>
            <p className="text-gray-300 leading-relaxed mb-8 text-lg font-light">{product.description || 'Sin descripción disponible.'}</p>

            <div className="flex flex-col gap-6 p-6 bg-[#111] rounded-2xl border border-white/10">
              {currentStock > 0 ? (
                <div>
                  <div className="flex items-center gap-2 text-green-400 mb-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span className="font-bold text-sm">Disponible</span>
                  </div>
                  {currentStock <= 3 && <p className="text-yellow-500 text-sm font-bold animate-pulse mt-1">⚠️ ¡Solo quedan {currentStock} unidades!</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500">
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  <span className="font-bold text-sm">Agotado en este color</span>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={currentStock === 0}
                className="w-full py-4 bg-vlyck-gradient text-black font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_30px_rgba(167,255,45,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}