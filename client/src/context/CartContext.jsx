import { createContext, useState, useContext, useEffect } from 'react';

// 1. Creamos el contexto
const CartContext = createContext();

// 2. Creamos el componente "Proveedor"
export function CartProvider({ children }) {
  // Estado del carrito
  const [cart, setCart] = useState(() => {
    try {
      const storedCart = localStorage.getItem('vlyck_cart');
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      // Si falla, retornamos array vacío y logueamos el error para que el linter no se queje
      console.error("Error cargando carrito:", e);
      return [];
    }
  });

  // Guardar en localStorage al cambiar
  useEffect(() => {
    localStorage.setItem('vlyck_cart', JSON.stringify(cart));
  }, [cart]);

  // Agregar al carrito
  const addToCart = (product, quantity = 1, variant = null) => {
    setCart(prevCart => {
      const cartItemId = variant 
        ? `${product._id}-${variant.model}-${variant.color}` 
        : product._id;

      const existingItemIndex = prevCart.findIndex(item => item.cartItemId === cartItemId);

      if (existingItemIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      } else {
        return [...prevCart, {
          ...product,
          cartItemId,
          quantity,
          selectedVariant: variant
        }];
      }
    });
  };

  // Eliminar
  const removeFromCart = (cartItemId) => {
    setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
  };

  // Actualizar cantidad
  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prevCart => 
      prevCart.map(item => 
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Limpiar
  const clearCart = () => setCart([]);

  // Totales
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.basePrice * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

// 3. Hook personalizado (Con la línea mágica para evitar el error de Fast Refresh)
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}