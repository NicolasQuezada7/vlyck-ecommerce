import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  // Si el carrito está vacío, mostramos mensaje y botón volver
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
    <div className="bg-background-dark text-white font-sans antialiased min-h-screen flex flex-col pt-24"> {/* pt-24 para compensar navbar fijo */}
      
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
        
        {/* Progress Header */}
        <div className="w-full py-6 flex justify-center items-center gap-3 md:gap-6 text-sm font-medium mb-10">
          <div className="flex items-center gap-2 text-primary">
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

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Product List */}
          <div className="w-full lg:w-[65%] flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Tu Carrito <span className="text-gray-500 text-2xl font-normal ml-2">({totalItems} productos)</span>
            </h1>
            
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.cartItemId} className="group flex flex-col sm:flex-row items-center gap-6 p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 transition-all hover:bg-white/[0.08] hover:border-white/20 hover:shadow-lg hover:shadow-primary/5">
                  
                  {/* IMAGEN */}
                  <div className="w-full sm:w-28 h-28 bg-[#151515] rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative group-hover:border-primary/30 transition-colors flex items-center justify-center">
                     {item.imageUrl ? (
                       <img className="w-full h-full object-contain p-2" src={item.imageUrl} alt={item.name} />
                     ) : (
                       <span className="text-gray-600 text-xs">Sin img</span>
                     )}
                  </div>

                  {/* INFO & CONTROLES */}
                  <div className="flex flex-col flex-grow w-full text-center sm:text-left">
                    <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {item.selectedVariant 
                        ? `${item.selectedVariant.model} / ${item.selectedVariant.color}` 
                        : 'Estándar'}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      {/* Selector Cantidad */}
                      <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-white/5 mx-auto sm:mx-0">
                        <button 
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-white hover:bg-white/20 transition-colors hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="w-10 text-center text-white font-bold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-white hover:bg-white/20 transition-colors hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PRECIO Y ELIMINAR */}
                  <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto sm:items-end gap-4 sm:gap-10 border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0">
                    <span className="text-xl font-bold text-white tracking-wide">
                      ${(item.basePrice * item.quantity).toLocaleString('es-CL')}
                    </span>
                    <button 
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" 
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <aside className="w-full lg:w-[35%] flex flex-col relative h-full">
            <div className="lg:sticky lg:top-32 p-6 md:p-8 bg-[#111111]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
              <h2 className="text-2xl font-bold text-white mb-6">Resumen de Orden</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400 text-sm md:text-base">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">${totalPrice.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm md:text-base">
                  <span>Envío</span>
                  <span className="text-white font-medium">Calculado al final</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm md:text-base">
                  <span>Descuento</span>
                  <span className="text-primary font-medium">-$0</span>
                </div>
                <div className="flex justify-between items-center text-white pt-6 mt-4 border-t border-white/10">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-3xl font-extrabold tracking-tight text-vlyck-cyan">
                    ${totalPrice.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              {/* Coupon */}
              <div className="relative mb-8 group">
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-4 pr-20 text-white placeholder-gray-600 focus:border-vlyck-cyan focus:ring-1 focus:ring-vlyck-cyan/50 outline-none transition-all" 
                  placeholder="Código de descuento" 
                  type="text"
                />
                <button className="absolute right-2 top-2 bottom-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white uppercase tracking-wider transition-colors">
                   Aplicar
                </button>
              </div>

              {/* Checkout CTA */}
           {/* Asegúrate de tener esto arriba: import { Link } from 'react-router-dom'; */}

                <Link 
                to="/checkout" 
                className="w-full py-4 rounded-xl bg-vlyck-gradient text-black font-extrabold text-lg uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(45,255,255,0.3)] transition-all duration-300 relative overflow-hidden group flex items-center justify-center"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                    Pagar Ahora <span className="material-symbols-outlined font-bold">arrow_forward</span>
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                </Link>

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