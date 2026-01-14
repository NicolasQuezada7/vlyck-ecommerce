import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import MercadoPagoButton from '../components/MercadoPagoButton';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalItems } = useCart(); 
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  // --- 1. RECUPERAR IMAGEN ---
  const getCartItemImage = (item) => {
    if (item.image) return item.image; 
    if (item.selectedVariant && item.selectedVariant.images?.length > 0) return item.selectedVariant.images[0];
    if (item.images && item.images.length > 0) return item.images[0];
    if (item.imageUrl) return item.imageUrl;
    return "https://via.placeholder.com/150?text=Sin+Foto";
  };

  // --- 2. RECUPERAR PRECIO INTELIGENTE ---
  const getPrice = (item) => {
    const val = item.price || item.basePrice;
    return val ? Number(val) : 0;
  };

  // --- 3. RECUPERAR COLOR ---
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
      <div className="min-h-screen bg-background-dark text-white pt-40 flex flex-col items-center justify-center px-4">
        <span className="material-symbols-outlined text-8xl text-gray-700 mb-6">shopping_cart_off</span>
        <h2 className="text-4xl font-bold mb-4">Tu carrito está vacío</h2>
        <p className="text-gray-400 mb-8 max-w-md text-center">
          Parece que aún no has agregado nada. Explora nuestro catálogo y encuentra lo mejor para tu setup.
        </p>
        <Link 
          to="/all" 
          className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all hover:scale-105"
        >
          Ir a la Tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background-dark text-white font-sans antialiased min-h-screen flex flex-col pt-32">
      
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
        
        {/* HEADER DE PROGRESO */}
        <div className="w-full py-6 flex justify-center items-center gap-3 md:gap-6 text-sm font-medium mb-10">
          <div className="flex items-center gap-2 text-vlyck-lime">
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
                Los productos en tu carrito no se reservan hasta finalizar el pago. 
                <span className="text-yellow-500 font-bold ml-1 tracking-wide">¡Finaliza tu compra antes de que se agoten!</span>
            </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* COLUMNA IZQUIERDA: LISTA DE PRODUCTOS */}
          <div className="w-full lg:w-[65%] flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Tu Carrito <span className="text-gray-500 text-2xl font-normal ml-2">({totalItems} productos)</span>
            </h1>
            
            <div className="space-y-4">
              {cart.map((item) => {
                // Verificamos si llegamos al tope de stock para este item
                const isMaxStockReached = item.quantity >= (item.countInStock || 999);

                return (
                  <div key={item.cartItemId || item._id} className="group flex flex-col sm:flex-row items-center gap-6 p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 transition-all hover:bg-white/[0.08] hover:border-white/20 hover:shadow-lg hover:shadow-vlyck-lime/5">
                    
                    {/* IMAGEN */}
                    <div className="w-full sm:w-28 h-28 bg-[#151515] rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative group-hover:border-vlyck-lime/30 transition-colors flex items-center justify-center">
                      <img 
                        className="w-full h-full object-contain p-2" 
                        src={getCartItemImage(item)}
                        alt={item.name} 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>

                    {/* INFO & CONTROLES */}
                    <div className="flex flex-col flex-grow w-full text-center sm:text-left">
                      <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                      
                      {/* ETIQUETA DE CATEGORÍA + COLOR */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-vlyck-lime/10 text-vlyck-lime border border-vlyck-lime/20 shadow-[0_0_10px_rgba(167,255,45,0.1)]">
                              {item.category || 'Accesorio'}
                          </span>
                          <span className="text-white/20 text-[10px]">•</span>
                          <p className="text-sm text-gray-400 font-medium">
                            {getColorName(item)}
                          </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        {/* Selector Cantidad */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-white/5 mx-auto sm:mx-0">
                                <button 
                                onClick={() => updateQuantity(item.cartItemId || item._id, item.quantity - 1)}
                                className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-white hover:bg-white/20 transition-colors hover:text-vlyck-lime"
                                >
                                <span className="material-symbols-outlined text-sm">remove</span>
                                </button>
                                
                                <span className="w-10 text-center text-white font-bold text-sm">{item.quantity}</span>
                                
                                {/* BOTÓN DE SUMAR PROTEGIDO POR STOCK */}
                                <button 
                                onClick={() => {
                                    if (!isMaxStockReached) {
                                        updateQuantity(item.cartItemId || item._id, item.quantity + 1);
                                    }
                                }}
                                disabled={isMaxStockReached}
                                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                                    isMaxStockReached 
                                    ? 'bg-red-500/20 text-red-500 cursor-not-allowed border border-red-500/30' 
                                    : 'bg-white/5 text-white hover:bg-white/20 hover:text-vlyck-lime'
                                }`}
                                >
                                <span className="material-symbols-outlined text-sm">
                                    {isMaxStockReached ? 'block' : 'add'}
                                </span>
                                </button>
                            </div>
                            
                            {/* Mensaje pequeño de Máximo Stock */}
                            {isMaxStockReached && (
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider animate-pulse">
                                    Máx.
                                </span>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* PRECIO Y ELIMINAR */}
                    <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto sm:items-end gap-4 sm:gap-10 border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0">
                      <span className="text-xl font-bold text-white tracking-wide">
                        ${(getPrice(item) * item.quantity).toLocaleString('es-CL')}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.cartItemId || item._id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" 
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: RESUMEN (Sticky) */}
          <aside className="w-full lg:w-[35%] flex flex-col relative h-full">
            <div className="lg:sticky lg:top-32 p-6 md:p-8 bg-[#111111]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
              <h2 className="text-2xl font-bold text-white mb-6">Resumen de Orden</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400 text-sm md:text-base">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">${calculatedTotal.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm md:text-base">
                  <span>Envío</span>
                  <span className="text-white font-medium">Calculado al final</span>
                </div>
                <div className="flex justify-between items-center text-white pt-6 mt-4 border-t border-white/10">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-3xl font-extrabold tracking-tight text-vlyck-lime">
                    ${calculatedTotal.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              {/* ZONA DE PAGO / CHECKOUT */}
              {userInfo ? (
                 <MercadoPagoButton cartItems={cart} />
              ) : (
                 <button 
                   onClick={() => navigate('/login')}
                   className="w-full py-4 rounded-xl bg-vlyck-gradient text-black font-extrabold text-lg uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(167,255,45,0.3)] transition-all duration-300 relative overflow-hidden group flex items-center justify-center"
                 >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      INICIA SESIÓN PARA PAGAR <span className="material-symbols-outlined font-bold">login</span>
                    </span>
                 </button>
              )}

              {/* Trust Badges */}
              <div className="flex justify-center items-center gap-6 mt-8 opacity-30 grayscale hover:grayscale-0 hover:opacity-70 transition-all duration-500">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-2xl">lock</span>
                  <span className="text-xs font-semibold">SSL SECURE</span>
                </div>
                <div className="h-4 w-px bg-white/50"></div>
                <div className="flex gap-2">
                  <span className="material-symbols-outlined text-2xl">credit_card</span>
                  <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                </div>
              </div>

            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}