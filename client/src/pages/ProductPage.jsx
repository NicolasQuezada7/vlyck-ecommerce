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

  const normalize = (str) => String(str || '').trim().toLowerCase();

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
    
    const uniqueCartId = selectedVariant ? `${targetId}-${targetColor}` : targetId;

    const currentQtyInCart = cart.reduce((acc, item) => {
        let itemOriginalId = item.product;
        if (typeof itemOriginalId === 'object') itemOriginalId = itemOriginalId._id;
        if (!itemOriginalId) itemOriginalId = item._id.split('-')[0];

        if (String(itemOriginalId) !== targetId) return acc;

        let itemColorRaw = item.variantColor || item.selectedVariant?.color;
        const itemColor = itemColorRaw ? normalize(itemColorRaw) : "sin-color";

        if (itemColor === targetColor) {
            return acc + (Number(item.quantity) || Number(item.qty) || 0);
        }
        return acc;
    }, 0);

    if (currentQtyInCart + 1 > maxStock) {
        setToastMessage(`¡Stock máximo alcanzado! (${maxStock})`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return; 
    }

    setIsAdding(true);

    const itemToAdd = {
        _id: uniqueCartId,       
        product: product._id,    
        name: product.name,
        image: activeImage,
        price: product.basePrice,
        countInStock: maxStock,
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
    <div className="flex flex-col min-h-screen bg-[#050505] text-white pt-24 relative font-sans">
      
      {/* TOAST FLOTANTE */}
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

      {/* BREADCRUMB (MIGAS DE PAN) */}
      {/* ✅ CORRECCIÓN 1: Eliminado border-b y ajustado padding/top */}
      <div className="bg-[#050505] py-4 px-4 md:px-10 sticky top-24 z-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          <div className="text-xs md:text-sm text-gray-500 flex items-center flex-wrap font-medium">
            <Link to="/" className="hover:text-vlyck-lime transition-colors">Inicio</Link>
            <span className="mx-2 text-white/10">/</span>
            <Link to="/all" className="hover:text-vlyck-lime transition-colors">Catálogo</Link>
            <span className="mx-2 text-white/10">/</span>
            <span className="text-white truncate">{product.name}</span>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 py-4 px-4 md:px-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          
          {/* COLUMNA IZQUIERDA: GALERÍA */}
          {/* ✅ CORRECCIÓN 2: 'sticky' cambiado a 'lg:sticky'. EN MÓVIL AHORA ES STATIC Y NO FLOTA */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-36 relative z-0">
            <div className="w-full bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative group aspect-square flex items-center justify-center">
              <img src={activeImage} alt={product.name} className="w-full h-full object-contain p-6 hover:scale-105 transition-transform duration-500" />
            </div>
            {currentGallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {currentGallery.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImage(img)} className={`w-20 h-20 shrink-0 rounded-xl border-2 overflow-hidden transition-all bg-[#111] ${activeImage === img ? 'border-vlyck-lime opacity-100 ring-2 ring-vlyck-lime/20' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: INFO & COMPRA */}
          <div className="flex flex-col justify-start">
            
            {/* Header Producto */}
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-vlyck-cyan uppercase tracking-wider border border-white/10">{product.brand}</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-white/5">{product.category}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight uppercase tracking-tight">{product.name}</h1>
            <p className="text-4xl text-vlyck-lime font-mono font-bold mb-6 tracking-tight">${product.basePrice.toLocaleString('es-CL')}</p>

            {/* Selector de Variantes */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Color Seleccionado: <span className="text-white">{selectedVariant?.color}</span></label>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => (
                    <button key={variant.color} onClick={() => handleVariantChange(variant)} className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-bold ${selectedVariant?.color === variant.color ? 'border-vlyck-lime bg-vlyck-lime text-black shadow-[0_0_15px_rgba(167,255,45,0.3)]' : 'border-white/10 bg-[#161616] text-gray-400 hover:border-white/30'} ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed decoration-slice' : ''}`} disabled={variant.stock === 0}>
                      <span>{variant.color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CAJA DE COMPRA */}
            <div className="bg-[#111] p-6 rounded-2xl border border-white/10 mb-8 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    {currentStock > 0 ? (
                        <div className="flex items-center gap-2 text-green-400">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            <span className="font-bold text-sm uppercase tracking-wide">Stock Disponible</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-500">
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            <span className="font-bold text-sm uppercase tracking-wide">Agotado</span>
                        </div>
                    )}
                    {currentStock > 0 && currentStock <= 5 && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20 font-bold animate-pulse">¡Últimas {currentStock} unidades!</span>}
                </div>

                <button 
                    onClick={handleAddToCart} 
                    disabled={currentStock === 0 || isAdding} 
                    className={`w-full py-4 font-black uppercase tracking-[0.15em] rounded-xl transition-all flex items-center justify-center gap-3 text-sm md:text-base ${isAdding ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-vlyck-gradient text-black hover:shadow-[0_0_30px_rgba(167,255,45,0.4)] hover:scale-[1.02] active:scale-95'}`}
                >
                    {isAdding ? (
                        <span className="animate-pulse">Agregando...</span>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">shopping_cart</span>
                            {currentStock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </>
                    )}
                </button>
                <p className="text-center text-[10px] text-gray-500 mt-3 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-xs">local_shipping</span> Envío calculado al finalizar compra
                </p>
            </div>

            {/* Descripción */}
            <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wide">Descripción</h3>
                <p className="text-gray-400 leading-relaxed text-base font-light whitespace-pre-line">
                    {product.description || 'Sin descripción disponible.'}
                </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}