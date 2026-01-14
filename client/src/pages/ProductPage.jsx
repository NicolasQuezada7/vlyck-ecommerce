import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';

export default function ProductPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const urlVariant = searchParams.get('variant');
  const navigate = useNavigate();
  
  const { addToCart, cart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('¡Agregado!');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/products/${slug}`);
        setProduct(data);

        let preSelected = null;
        if (data.variants && data.variants.length > 0) {
          if (urlVariant) preSelected = data.variants.find(v => v.color.toLowerCase() === urlVariant.toLowerCase());
          if (!preSelected) preSelected = data.variants.find(v => v.stock > 0);
          if (!preSelected) preSelected = data.variants[0];
          setSelectedVariant(preSelected);
        }

        if (preSelected && preSelected.images && preSelected.images.length > 0) {
          setActiveImage(preSelected.images[0]);
        } else if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0]);
        } else {
          setActiveImage(data.imageUrl || 'https://via.placeholder.com/600x400?text=Vlyck');
        }
        setLoading(false);
      } catch (err) {
        setError('Producto no encontrado');
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, urlVariant]);

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    if (variant.images && variant.images.length > 0) setActiveImage(variant.images[0]);
    else if (product.images && product.images.length > 0) setActiveImage(product.images[0]);
  };

  // Función para limpiar strings
  const normalize = (str) => String(str || '').trim().toLowerCase();

  // --- FUNCIÓN AGREGAR ROBUSTA ---
  const handleAddToCart = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (isAdding) return;

    if (product.variants && product.variants.length > 0 && !selectedVariant) {
        alert("Por favor selecciona un color.");
        return;
    } 

    const maxStock = Number(selectedVariant ? selectedVariant.stock : product.countInStock);
    const targetId = String(product._id);
    const targetColor = selectedVariant ? normalize(selectedVariant.color) : "sin-color";
    
    // Generar ID único para el carrito
    const uniqueCartId = selectedVariant 
        ? `${targetId}-${targetColor}` 
        : targetId;

    // --- 1. CÁLCULO DE CANTIDAD ---
    const currentQtyInCart = cart.reduce((acc, item) => {
        // Validar ID Original
        let itemOriginalId = item.product;
        if (typeof itemOriginalId === 'object') itemOriginalId = itemOriginalId._id;
        if (!itemOriginalId) itemOriginalId = item._id.split('-')[0]; // Fallback

        if (String(itemOriginalId) !== targetId) return acc;

        // Validar Color
        let itemColorRaw = item.variantColor || item.selectedVariant?.color;
        const itemColor = itemColorRaw ? normalize(itemColorRaw) : "sin-color";

        if (itemColor === targetColor) {
            return acc + (Number(item.quantity) || Number(item.qty) || 0);
        }
        
        return acc;
    }, 0);

    // --- 2. VALIDACIÓN ---
    if (currentQtyInCart + 1 > maxStock) {
        setToastMessage(`¡Stock máximo alcanzado! (${maxStock})`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return; 
    }

    // --- 3. PREPARAR OBJETO COMPLETO ---
    setIsAdding(true);

    const itemToAdd = {
        _id: uniqueCartId,       
        product: product._id,    
        
        name: product.name,
        image: activeImage,
        price: product.basePrice,
        countInStock: maxStock,
        
        // 🔥 AQUÍ AGREGAMOS LO QUE FALTABA:
        category: product.category, 
        brand: product.brand,

        variantColor: selectedVariant ? selectedVariant.color : null,
        selectedVariant: selectedVariant, 
        
        quantity: 1, 
        qty: 1
    };

    addToCart(itemToAdd);
    
    setToastMessage('¡Agregado al Carrito!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    setTimeout(() => { setIsAdding(false); }, 500);
  };

  if (loading) return <div className="min-h-screen pt-40 text-center text-vlyck-lime">Cargando...</div>;
  if (!product) return null;

  const currentStock = selectedVariant ? selectedVariant.stock : product.countInStock;
  const currentGallery = (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0)
    ? selectedVariant.images : (product.images && product.images.length > 0) ? product.images : [product.imageUrl];

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white pt-20 relative">
      
      {showToast && (
        <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-[100] animate-bounce-in px-4 w-full max-w-sm">
            <div className={`bg-black/90 border px-6 py-4 rounded-full shadow-[0_0_20px_rgba(167,255,45,0.6)] flex items-center justify-center gap-3 backdrop-blur-xl ${toastMessage.includes('máximo') ? 'border-red-500 shadow-red-500/50' : 'border-[#a7ff2d] shadow-[#a7ff2d]/50'}`}>
                <span className={`material-symbols-outlined text-2xl ${toastMessage.includes('máximo') ? 'text-red-500' : 'text-[#a7ff2d]'}`}>
                    {toastMessage.includes('máximo') ? 'error' : 'check_circle'}
                </span>
                <div>
                    <p className={`font-black uppercase tracking-widest text-sm ${toastMessage.includes('máximo') ? 'text-red-500' : 'text-[#a7ff2d]'}`}>
                        {toastMessage}
                    </p>
                </div>
            </div>
        </div>
      )}

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
          
          {/* GALERÍA */}
          <div className="flex flex-col gap-4">
            <div className="w-full bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative group aspect-square flex items-center justify-center">
              <img src={activeImage} alt={product.name} className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-500" />
            </div>
            {currentGallery.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {currentGallery.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImage(img)} className={`w-20 h-20 shrink-0 rounded-xl border-2 overflow-hidden transition-all ${activeImage === img ? 'border-vlyck-lime opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO & CONTROLES */}
          <div className="flex flex-col justify-center sticky top-28">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-vlyck-cyan uppercase tracking-wider border border-white/10">{product.brand}</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-400 uppercase tracking-wider border border-white/5">{product.category}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight font-sans">{product.name}</h1>
            <p className="text-4xl text-vlyck-lime font-mono font-bold mb-8">${product.basePrice.toLocaleString('es-CL')}</p>

            {product.variants && product.variants.length > 0 && (
              <div className="mb-8">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 block">Color</label>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => (
                    <button key={variant.color} onClick={() => handleVariantChange(variant)} className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${selectedVariant?.color === variant.color ? 'border-vlyck-lime bg-vlyck-lime/10 text-white shadow-[0_0_15px_rgba(167,255,45,0.2)]' : 'border-white/10 bg-[#111] text-gray-400 hover:border-white/30'} ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={variant.stock === 0}>
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
                  <div className="flex items-center gap-2 text-green-400 mb-1"><span className="material-symbols-outlined text-sm">check_circle</span><span className="font-bold text-sm">Disponible ({currentStock})</span></div>
                  {currentStock <= 3 && <p className="text-yellow-500 text-sm font-bold animate-pulse mt-1">⚠️ ¡Solo quedan {currentStock} unidades!</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500"><span className="material-symbols-outlined text-sm">cancel</span><span className="font-bold text-sm">Agotado en este color</span></div>
              )}
              
              <button 
                onClick={handleAddToCart} 
                disabled={currentStock === 0 || isAdding} 
                className={`w-full py-4 font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-3 ${isAdding ? 'bg-gray-600 text-gray-400 cursor-wait' : 'bg-vlyck-gradient text-black hover:shadow-[0_0_30px_rgba(167,255,45,0.4)] hover:scale-[1.02] active:scale-95'}`}
              >
                {isAdding ? 'Agregando...' : <><span className="material-symbols-outlined">shopping_cart</span> Agregar al Carrito</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}