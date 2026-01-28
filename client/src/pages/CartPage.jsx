import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalItems } = useCart(); 
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  // --- 1. RECUPERAR IMAGEN (Lógica Robusta) ---
  const getCartItemImage = (item) => {
    if (item.image) return item.image; 
    if (item.selectedVariant && item.selectedVariant.images?.length > 0) return item.selectedVariant.images[0];
    if (item.images && item.images.length > 0) return item.images[0];
    if (item.imageUrl) return item.imageUrl;
    return "https://via.placeholder.com/150?text=Sin+Foto";
  };

  // --- 2. RECUPERAR PRECIO INTELIGENTE (Evita NaN) ---
  const getPrice = (item) => {
    // Prioridad: price -> basePrice -> 0. Convertimos siempre a Número.
    const val = item.price !== undefined ? item.price : item.basePrice;
    return Number(val) || 0;
  };

  // --- 3. RECUPERAR COLOR/VARIANTE ---
  const getColorName = (item) => {
    let color = item.variantColor || item.selectedVariant?.color;
    if (color) {
        return color.charAt(0).toUpperCase() + color.slice(1);
    }
    return 'Estándar';
  };

  // --- 4. CALCULAR TOTAL LOCALMENTE ---
  const calculatedTotal = cart.reduce((acc, item) => {
      return acc + (getPrice(item) * (Number(item.quantity) || 0));
  }, 0);

  // Si el carrito está vacío
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pt-40 flex flex-col items-center justify-center px-4 font-sans">
        <span className="material-symbols-outlined text-8xl text-gray-800 mb-6">shopping_cart_off</span>
        <h2 className="text-4xl font-black mb-4 uppercase tracking-tight">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-8 max-w-md text-center text-sm font-medium">
          Parece que aún no has agregado nada. Explora nuestro catálogo y encuentra lo mejor para tu setup.
        </p>
        <Link 
          to="/all" 
          className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest transition-all hover:scale-105"
        >
          Ir a la Tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] text-white font-sans antialiased min-h-screen flex flex-col pt-32 pb-20">
      
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* HEADER DE PROGRESO */}
        <div className="w-full flex justify-center items-center gap-3 md:gap-6 text-sm font-medium mb-10">
          <div className="flex items-center gap-2 text-vlyck-lime font-bold">
            <span className="material-symbols-outlined text-lg">shopping_cart</span>
            <span>1. Carrito</span>
          </div>
          <div className="h-px w-8 md:w-16 bg-white/10"></div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="material-symbols-outlined text-lg">feed</span>
            <span>2. Datos</span>
          </div>
          <div className="h-px w-8 md:w-16 bg-white/10"></div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="material-symbols-outlined text-lg">credit_card</span>
            <span>3. Pago</span>
          </div>
        </div>

        {/* MENSAJE DE ADVERTENCIA DE STOCK (FOMO) */}
        <div className="w-full mb-10 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left shadow-[0_0_20px_rgba(234,179,8,0.05)]">
            <div className="bg-yellow-500/10 p-2 rounded-full text-yellow-500">
                <span className="material-symbols-outlined text-xl">avg_time</span>
            </div>
            <p className="text-gray-300 text-sm md:text-base">
                Los productos no se reservan. 
                <span className="text-yellow-500 font-bold ml-1 tracking-wide">¡Finaliza tu compra antes de que se agoten!</span>
            </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* COLUMNA IZQUIERDA: LISTA DE PRODUCTOS */}
          <div className="w-full lg:w-[65%] flex flex-col">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-8 uppercase tracking-tight">
              Tu Carrito <span className="text-gray-600 text-2xl font-bold ml-2">({totalItems})</span>
            </h1>
            
            <div className="space-y-4">
              {cart.map((item) => {
                const isMaxStockReached = item.quantity >= (item.countInStock || 999);
                const itemPrice = getPrice(item); // Usamos la función segura

                return (
                  <div key={item.cartItemId || item._id} className="group flex flex-col sm:flex-row items-center gap-6 p-5 bg-[#111] rounded-2xl border border-white/10 transition-all hover:border-white/20 relative overflow-hidden">
                    
                    {/* IMAGEN */}
                    <div className="w-full sm:w-28 h-28 bg-[#0a0a0a] rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative flex items-center justify-center">
                      <img 
                        className="w-full h-full object-contain p-2" 
                        src={getCartItemImage(item)}
                        alt={item.name} 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>

                    {/* INFO & CONTROLES */}
                    <div className="flex flex-col flex-grow w-full text-center sm:text-left">
                      <h3 className="text-lg font-bold text-white mb-2 leading-tight">{item.name}</h3>
                      
                      {/* ETIQUETAS */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-vlyck-lime/10 text-vlyck-lime border border-vlyck-lime/20">
                              {item.category || 'Producto'}
                          </span>
                          <span className="text-white/20 text-[10px]">•</span>
                          <p className="text-sm text-gray-400 font-medium">
                            {getColorName(item)}
                          </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        {/* Selector Cantidad */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5 mx-auto sm:mx-0">
                                <button 
                                onClick={() => updateQuantity(item.cartItemId || item._id, item.quantity - 1)}
                                className="w-8 h-8 rounded-md flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                                >
                                <span className="material-symbols-outlined text-sm">remove</span>
                                </button>
                                
                                <span className="w-8 text-center text-white font-bold text-sm">{item.quantity}</span>
                                
                                <button 
                                onClick={() => !isMaxStockReached && updateQuantity(item.cartItemId || item._id, item.quantity + 1)}
                                disabled={isMaxStockReached}
                                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${isMaxStockReached ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}
                                >
                                <span className="material-symbols-outlined text-sm">{isMaxStockReached ? 'block' : 'add'}</span>
                                </button>
                            </div>
                        </div>
                      </div>
                    </div>

                    {/* PRECIO Y ELIMINAR */}
                    <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto sm:items-end gap-4 sm:gap-10 border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0">
                      <span className="text-xl font-mono font-bold text-vlyck-lime tracking-tight">
                        ${(itemPrice * item.quantity).toLocaleString('es-CL')}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.cartItemId || item._id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" 
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: RESUMEN */}
          <aside className="w-full lg:w-[35%] flex flex-col relative h-full">
            <div className="lg:sticky lg:top-36 p-6 md:p-8 bg-[#111] rounded-2xl border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Resumen</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Subtotal</span>
                  <span className="text-white font-mono">${calculatedTotal.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Envío</span>
                  <span className="text-white font-medium">Calculado siguiente paso</span>
                </div>
                <div className="flex justify-between items-center text-white pt-6 mt-4 border-t border-white/10">
                  <span className="text-lg font-bold uppercase">Total Estimado</span>
                  <span className="text-3xl font-mono font-black text-vlyck-lime">
                    ${calculatedTotal.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              {/* 🔴 BOTÓN DE ACCIÓN CON GRADIENTE VLYCK */}
              <button 
                onClick={() => userInfo ? navigate('/checkout') : navigate('/login?redirect=checkout')}
                className="w-full py-4 rounded-xl bg-vlyck-gradient text-black font-black text-lg uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(167,255,45,0.4)] transition-all duration-300 relative overflow-hidden group flex items-center justify-center gap-2"
              >
                 {userInfo ? 'IR A PAGAR' : 'INICIAR SESIÓN PARA COMPRAR'} 
                 <span className="material-symbols-outlined font-bold">arrow_forward</span>
              </button>

              <div className="flex justify-center items-center gap-2 mt-6 text-[10px] text-gray-600 uppercase font-bold tracking-widest">
                <span className="material-symbols-outlined text-sm">lock</span>
                Checkout Seguro SSL
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}