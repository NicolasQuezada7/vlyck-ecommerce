import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, clearCart, totalPrice } = useCart();
  const { userInfo } = useAuth();
  
  // Ref para evitar que React ejecute esto 2 veces (común en modo estricto)
  const processedRef = useRef(false);

  useEffect(() => {
    const processOrder = async () => {
      // Si ya procesamos o no hay usuario, detenemos
      if (processedRef.current || !userInfo) return;

      const queryParams = new URLSearchParams(location.search);
      const status = queryParams.get('status');
      const paymentId = queryParams.get('payment_id');

      // 1. Validaciones
      if (status !== 'approved') {
          navigate('/cart'); 
          return;
      }
      if (cart.length === 0) {
          // Si llega aquí con carrito vacío, probablemente recargó la página
          // Redirigir a "Mis Pedidos" o Home para evitar errores
          navigate('/profile'); 
          return;
      }

      // Marcar como procesando para evitar duplicados
      processedRef.current = true;

      try {
        // 2. Recuperar Dirección (con Fallback por seguridad)
        const savedAddress = JSON.parse(localStorage.getItem('shippingAddress') || '{}');
        const finalAddress = {
          address: savedAddress.address || "Dirección Web",
          city: savedAddress.city || "Chillán",
          region: savedAddress.region || "Ñuble",
          postalCode: savedAddress.postalCode || "0000000",
          country: "Chile"
        };

        // 3. Formatear Items para el Backend
        const finalOrderItems = cart.map(item => ({
          product: item.productId || item._id || item.id,
          name: item.name,
          image: item.imageUrl,
          price: Number(item.basePrice),
          qty: Number(item.quantity),
          variant: item.selectedVariant || {}
        }));

        const orderData = {
          orderItems: finalOrderItems,
          shippingAddress: finalAddress,
          paymentMethod: 'MercadoPago',
          paymentResult: {
            id: paymentId,
            status: status,
            email: queryParams.get('payer_email') || userInfo.email,
            update_time: new Date().toISOString()
          },
          itemsPrice: totalPrice,
          shippingPrice: 0,
          totalPrice: totalPrice,
          isPaid: true,
          paidAt: Date.now(),
          // Rellenar guestInfo aunque sea usuario registrado para cumplir con el Modelo
          guestInfo: {
              name: userInfo.name,
              email: userInfo.email
          }
        };

        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        // 4. Guardar en Base de Datos
        const { data } = await axios.post('/api/orders', orderData, config);

        // 5. Limpiar y Redirigir
        clearCart();
        navigate(`/order/${data._id}`);

      } catch (error) {
        console.error("Error procesando orden:", error);
        alert("Hubo un error guardando tu pedido. Contáctanos con tu comprobante.");
        // No limpiamos el carrito por si quiere reintentar
      }
    };

    processOrder();
  }, [location, navigate, cart, clearCart, userInfo, totalPrice]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
      <span className="material-symbols-outlined text-6xl animate-spin text-vlyck-lime mb-6">autorenew</span>
      <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Procesando Pago...</h2>
      <p className="text-gray-400 font-mono text-sm">Estamos confirmando tu transacción con Mercado Pago.</p>
    </div>
  );
}