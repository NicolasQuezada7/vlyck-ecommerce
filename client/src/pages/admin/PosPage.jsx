import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function PosPage() {
  const { userInfo } = useAuth();
  
  // 1. Estados de Datos
  const [originalProducts, setOriginalProducts] = useState([]);
  const [displayItems, setDisplayItems] = useState([]);
  
  // 2. Estados de Interfaz
  const [cart, setCart] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [viewMode, setViewMode] = useState('search'); 
  
  // NUEVO: Estado para alternar vistas en móvil (Productos <-> Carrito)
  const [mobileView, setMobileView] = useState('products'); 

  // --- CARGAR DATOS ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get('/api/products');
        setOriginalProducts(data);
      } catch (error) { console.error(error); }
    };
    fetchProducts();
  }, []);

  // --- PROCESAMIENTO ---
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
            name: `${product.name}`,
            variantName: variant.color, 
            basePrice: product.basePrice,
            imageUrl: variantImg,
            brand: product.brand,
            category: product.category,
            variant: { color: variant.color },
            stock: variant.stock,
            isVariant: true
          });
        });
      } else {
        processed.push({
          _id: product._id,
          originalId: product._id,
          name: product.name,
          variantName: 'Estándar',
          basePrice: product.basePrice,
          imageUrl: mainImg,
          brand: product.brand,
          category: product.category,
          variant: null,
          stock: product.countInStock,
          isVariant: false
        });
      }
    });
    setDisplayItems(processed);
  }, [originalProducts]);

  // --- LÓGICA CARRITO ---
  const addToCart = (item) => {
    if (item.stock <= 0) return alert("Producto sin stock");

    const existingItem = cart.find(x => x.key === item._id);

    if (existingItem) {
        if (existingItem.qty + 1 > item.stock) return alert('Stock insuficiente');
        setCart(cart.map(x => x.key === item._id ? { ...x, qty: x.qty + 1 } : x));
    } else {
        setCart([...cart, {
            key: item._id,
            product: item.originalId,
            name: item.name,
            variantName: item.variantName,
            image: item.imageUrl,
            price: item.basePrice,
            qty: 1,
            variant: item.variant
        }]);
    }
    setSearchTerm('');
    // En móvil NO enfocamos automáticamente para evitar que el teclado tape todo
    if(window.innerWidth > 768 && viewMode === 'search') {
        document.getElementById('pos-search-input')?.focus();
    }
  };

  const updateQty = (key, delta) => {
    setCart(cart.map(item => {
        if (item.key === key) {
            const newQty = item.qty + delta;
            if (newQty < 1) return item; 
            return { ...item, qty: newQty };
        }
        return item;
    }));
  };

  const removeFromCart = (key) => setCart(cart.filter(x => x.key !== key));

  const handleCheckout = async (paymentMethod) => {
    if (cart.length === 0) return alert("Ticket vacío");
    if (!window.confirm(`¿Cobrar en ${paymentMethod}?`)) return;

    setProcessing(true);
    try {
        const totalPrice = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
        await axios.post('/api/orders/pos', {
            orderItems: cart,
            totalPrice,
            paymentMethod
        }, config);

        alert("✅ Venta Exitosa");
        setCart([]);
        setMobileView('products'); // Volver al catálogo tras vender
    } catch (error) {
        alert(error.response?.data?.message || "Error");
    }
    setProcessing(false);
  };

  // --- FILTRADO ---
  const searchedProducts = searchTerm.length > 0 
    ? displayItems.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variantName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const categories = [...new Set(displayItems.map(p => p.category))];
  const subtotal = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
  const total = subtotal; 

  const getImage = (img) => (!img || img.includes('placehold.co')) ? 'https://via.placeholder.com/150' : img;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#050505] text-white font-sans overflow-hidden">
      
      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #a7ff2d; }
        * { scrollbar-width: thin; scrollbar-color: #333 transparent; }
      `}</style>

      {/* --- LEFT PANEL: CATALOG (VISIBLE SIEMPRE EN PC, SOLO EN 'PRODUCTS' EN MÓVIL) --- */}
      <main className={`flex-1 flex flex-col h-full border-r border-white/5 relative bg-[#050505] min-h-0 transition-all duration-300 ${mobileView === 'cart' ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header Fijo */}
        <header className="p-4 md:p-6 bg-[#0d0d0d] border-b border-white/10 z-20 shrink-0">
            <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                    <div className="size-8 md:size-10 bg-vlyck-lime/20 rounded-xl flex items-center justify-center text-vlyck-lime">
                        <span className="material-symbols-outlined text-xl md:text-2xl">point_of_sale</span>
                    </div>
                    <h1 className="font-mono text-xl md:text-2xl font-bold tracking-tight text-white"><span className="text-vlyck-lime">POS</span></h1>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Botón Ver Carrito (SOLO MÓVIL - HEADER) */}
                    <button 
                        onClick={() => setMobileView('cart')}
                        className="md:hidden relative p-2 bg-white/5 rounded-lg border border-white/10"
                    >
                        <span className="material-symbols-outlined text-vlyck-lime">shopping_cart</span>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                                {cart.reduce((acc, item) => acc + item.qty, 0)}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={() => setViewMode(viewMode === 'catalog' ? 'search' : 'catalog')}
                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider border transition-all ${viewMode === 'catalog' ? 'bg-vlyck-lime text-black border-vlyck-lime' : 'border-white/10 hover:bg-white/5'}`}
                    >
                        {viewMode === 'catalog' ? 'Buscar' : 'Catálogo'}
                    </button>
                </div>
            </div>

            <label className="flex w-full items-center relative group">
                <div className="absolute left-4 text-gray-500 group-focus-within:text-vlyck-lime transition-colors duration-200">
                    <span className="material-symbols-outlined">search</span>
                </div>
                <input 
                    id="pos-search-input"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-base md:text-lg text-white placeholder-gray-600 focus:border-vlyck-lime focus:ring-1 focus:ring-vlyck-lime outline-none transition-all duration-200 shadow-inner" 
                    placeholder="Buscar producto..." 
                    type="text"
                    value={searchTerm}
                    onChange={e => {
                        setSearchTerm(e.target.value);
                        if(e.target.value.length > 0) setViewMode('search');
                    }}
                />
            </label>
        </header>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth custom-scrollbar min-h-0">
            {viewMode === 'search' && (
                <>
                    {searchTerm.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-30">
                            <span className="material-symbols-outlined text-6xl md:text-8xl mb-4">barcode_reader</span>
                            <p className="text-lg md:text-xl font-bold">Listo para escanear...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-24 md:pb-20">
                            {searchedProducts.map(product => (
                                <ProductCard key={product._id} product={product} onClick={() => addToCart(product)} getImage={getImage} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {viewMode === 'catalog' && (
                <div className="space-y-8 md:space-y-12 pb-24 md:pb-20">
                    {categories.map(cat => {
                        const items = displayItems.filter(p => p.category === cat);
                        if(items.length === 0) return null;
                        return (
                            <div key={cat}>
                                <h3 className="text-lg md:text-xl font-bold text-vlyck-cyan mb-3 md:mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-vlyck-cyan rounded-full"></span> {cat}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                                    {items.map(product => (
                                        <ProductCard key={product._id} product={product} onClick={() => addToCart(product)} getImage={getImage} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>

        {/* --- BOTÓN FLOTANTE "IR AL TICKET" (SOLO MÓVIL) --- */}
        {cart.length > 0 && (
            <div className="md:hidden absolute bottom-6 left-0 right-0 px-4 flex justify-center z-50">
                <button 
                    onClick={() => setMobileView('cart')}
                    className="bg-vlyck-lime text-black font-black uppercase text-sm py-4 px-8 rounded-full shadow-[0_0_20px_rgba(167,255,45,0.4)] flex items-center gap-3 animate-bounce-in w-full justify-center max-w-sm"
                >
                    <span>Ver Ticket</span>
                    <span className="bg-black/20 px-2 py-0.5 rounded text-xs">{cart.length} items</span>
                    <span className="text-lg ml-auto">${total.toLocaleString()}</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        )}

      </main>

      {/* --- RIGHT PANEL: RECEIPT (VISIBLE SIEMPRE EN PC, SOLO EN 'CART' EN MÓVIL) --- */}
      <aside className={`w-full md:w-[400px] xl:w-[480px] bg-[#0d0d0d] border-l border-white/10 flex flex-col h-full shadow-2xl relative z-10 transition-all duration-300 ${mobileView === 'products' ? 'hidden md:flex' : 'flex'}`}>
        
        {/* HEADER TICKET */}
        <div className="p-4 md:p-6 border-b border-dashed border-white/10 flex justify-between items-center bg-[#0d0d0d] z-10 shadow-sm shrink-0">
            <div className="flex items-center gap-2">
                {/* Botón Volver (SOLO MÓVIL) */}
                <button onClick={() => setMobileView('products')} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-vlyck-lime hidden md:inline">receipt_long</span>
                    Ticket de Venta
                </h2>
            </div>
            <button onClick={() => setCart([])} className="p-2 hover:bg-white/10 rounded-lg text-red-500 transition-colors" title="Limpiar ticket">
                <span className="material-symbols-outlined text-xl">delete_sweep</span>
            </button>
        </div>

        {/* CUERPO TICKET */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-[#0d0d0d]/50 custom-scrollbar min-h-0 relative">
            {cart.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 pointer-events-none">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">shopping_bag</span>
                    <p>Ticket vacío</p>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.key} className="flex items-center gap-3 p-3 bg-[#161616] border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
                        <div className="size-12 rounded-lg bg-black shrink-0 border border-white/5 flex items-center justify-center overflow-hidden">
                            <img src={getImage(item.image)} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-grow min-w-0">
                            <p className="text-sm text-white font-medium truncate">{item.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{item.variantName}</p>
                            <p className="text-xs text-vlyck-lime font-mono mt-0.5">${item.price.toLocaleString()}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/5">
                            <button onClick={() => updateQty(item.key, -1)} className="size-6 rounded flex items-center justify-center bg-white/5 text-white hover:bg-white/20 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <span className="text-sm font-bold text-white font-mono w-4 text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item.key, 1)} className="size-6 rounded flex items-center justify-center bg-white/5 text-white hover:bg-white/20 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                        </div>

                        <button onClick={() => removeFromCart(item.key)} className="text-red-500/40 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-all">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                ))
            )}
        </div>

        {/* FOOTER PAGOS */}
        <div className="p-4 md:p-6 bg-[#111111] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 shrink-0 pb-8 md:pb-6">
            {/* Subtotals */}
            <div className="space-y-1 mb-4 pb-4 border-b border-white/5 text-xs text-gray-400 font-mono">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white">${subtotal.toLocaleString()}</span>
                </div>
            </div>
            
            {/* Total */}
            <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400 font-bold tracking-wide text-sm">TOTAL A PAGAR</span>
                <span className="text-3xl md:text-4xl font-mono font-black text-vlyck-lime tracking-tight">${total.toLocaleString()}</span>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
                <button 
                    onClick={() => handleCheckout('Efectivo')}
                    disabled={processing}
                    className="group flex flex-col items-center justify-center gap-1 md:gap-2 py-3 md:py-4 rounded-xl bg-white/5 border border-white/10 text-white text-[9px] md:text-xs font-bold uppercase tracking-wide transition-all duration-200 hover:bg-vlyck-lime hover:text-black hover:border-vlyck-lime active:scale-95"
                >
                    <span className="material-symbols-outlined text-xl md:text-2xl group-hover:text-black transition-colors">payments</span>
                    EFECTIVO
                </button>
                <button 
                    onClick={() => handleCheckout('Transferencia')}
                    disabled={processing}
                    className="group flex flex-col items-center justify-center gap-1 md:gap-2 py-3 md:py-4 rounded-xl bg-white/5 border border-white/10 text-white text-[9px] md:text-xs font-bold uppercase tracking-wide transition-all duration-200 hover:bg-vlyck-lime hover:text-black hover:border-vlyck-lime active:scale-95"
                >
                    <span className="material-symbols-outlined text-xl md:text-2xl group-hover:text-black transition-colors">account_balance</span>
                    TRANSF.
                </button>
                <button 
                    onClick={() => handleCheckout('Debito')}
                    disabled={processing}
                    className="group flex flex-col items-center justify-center gap-1 md:gap-2 py-3 md:py-4 rounded-xl bg-white/5 border border-white/10 text-white text-[9px] md:text-xs font-bold uppercase tracking-wide transition-all duration-200 hover:bg-vlyck-lime hover:text-black hover:border-vlyck-lime active:scale-95 relative overflow-hidden"
                >
                    <span className="material-symbols-outlined text-xl md:text-2xl group-hover:text-black transition-colors">credit_card</span>
                    TARJETA
                </button>
            </div>
        </div>
      </aside>

    </div>
  );
}

// --- SUBCOMPONENTE DE TARJETA ---
function ProductCard({ product, onClick, getImage }) {
    return (
        <article 
            onClick={onClick}
            className="bg-[#111111] p-3 md:p-4 rounded-2xl border border-white/10 cursor-pointer transition-all duration-200 hover:border-vlyck-lime/50 hover:bg-white/5 active:scale-95 group relative overflow-hidden flex flex-col h-full"
        >
            <div className="w-full h-28 md:h-36 bg-[#000] rounded-xl mb-3 overflow-hidden relative flex items-center justify-center p-2 shrink-0">
                <img 
                    src={getImage(product.imageUrl)} 
                    className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-500" 
                    alt={product.name} 
                />
                
                {product.stock < 5 && product.stock > 0 && (
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-orange-500/80 backdrop-blur-sm rounded text-[9px] text-white font-bold border border-white/20">
                        Quedan {product.stock}
                    </div>
                )}
                {product.stock === 0 && (
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-500/80 backdrop-blur-sm rounded text-[9px] text-white font-bold border border-white/20">
                        AGOTADO
                    </div>
                )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="text-xs md:text-sm font-bold text-white mb-0.5 leading-tight line-clamp-2">{product.name}</h3>
                    <p className="text-[10px] text-gray-500 mb-2">{product.variantName}</p>
                </div>
                
                <div className="flex justify-between items-end border-t border-white/5 pt-2">
                    <span className="font-mono text-sm md:text-lg font-bold text-vlyck-lime">${product.basePrice.toLocaleString()}</span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-tight font-medium">Stock: {product.stock}</span>
                </div>
            </div>
        </article>
    );
}