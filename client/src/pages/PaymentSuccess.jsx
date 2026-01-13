import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, clearCart, totalPrice } = useCart();
  const { userInfo } = useAuth();

  useEffect(() => {
    const processOrder = async () => {
      const queryParams = new URLSearchParams(location.search);
      const status = queryParams.get('status');
      const paymentId = queryParams.get('payment_id');

      // Solo procesamos si hay status approved y items en el carrito
      if (status === 'approved' && cart.length > 0) {
        try {
          // 1. RECUPERAR DIRECCIÓN (Con datos de relleno por si falla el localStorage)
          const savedAddress = JSON.parse(localStorage.getItem('shippingAddress') || '{}');
          
          const finalAddress = {
            address: savedAddress.address || "Dirección no especificada",
            city: savedAddress.city || "Ciudad no especificada",
            region: savedAddress.region || "Región Metropolitana",
            postalCode: savedAddress.postalCode || "0000000",
            country: "Chile"
          };

          // 2. TRADUCIR EL CARRITO (Mapping)
          // Convertimos las variables de tu CartContext a las que pide Mongoose
          const finalOrderItems = cart.map(item => ({
            product: item.productId || item._id || item.id, // Intentamos varios nombres de ID
            name: item.name,
            image: item.imageUrl,   // Tu Context usa imageUrl, la BD quiere image
            price: item.basePrice,  // Tu Context usa basePrice, la BD quiere price
            qty: item.quantity,     // Tu Context usa quantity, la BD quiere qty
            variant: item.selectedVariant || {} // Pasamos la variante si existe
          }));

          // 3. ARMAR EL OBJETO FINAL
          const orderData = {
            orderItems: finalOrderItems,
            shippingAddress: finalAddress,
            paymentMethod: 'MercadoPago',
            paymentResult: {
              id: paymentId,
              status: status,
              email: queryParams.get('payer_email') || userInfo?.email || "email@desconocido.com",
            },
            itemsPrice: totalPrice,
            shippingPrice: 0,
            totalPrice: totalPrice,
            isPaid: true,
            paidAt: Date.now(),
            // IMPORTANTE: Mongoose pide guestInfo obligatoriamente (según tu error)
            // Así que rellenamos con los datos del usuario logueado
            guestInfo: {
                name: userInfo?.name || "Cliente",
                email: userInfo?.email || "cliente@email.com"
            }
          };

          const config = {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userInfo.token}`,
            },
          };

          console.log("Enviando orden al backend:", orderData); // Para depurar si falla

          // 4. ENVIAR AL BACKEND
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/orders`,
            orderData,
            config
          );

          // 5. ÉXITO
          clearCart();
          navigate(`/order/${data._id}`);

        } catch (error) {
          console.error("Error al guardar la orden:", error);
          console.error("Detalle del error:", error.response?.data); // Muestra qué campo falló
          alert("Hubo un problema guardando tu orden. Por favor contáctanos con tu comprobante de pago.");
          navigate('/');
        }
      } else if (status !== 'approved') {
         // Si Mercado Pago devolvió 'rejected' o 'pending'
         navigate('/cart');
      }
    };

    // Ejecutar lógica
    if (cart.length > 0) {
        processOrder();
    } else {
        // Si el carrito está vacío (recargó página), intentamos ver si era una prueba manual
        const queryParams = new URLSearchParams(location.search);
        if(!queryParams.get('status')) {
            navigate('/');
        }
    }
  }, [location, navigate, cart, clearCart, userInfo, totalPrice]);

  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center text-white">
      <span className="material-symbols-outlined text-6xl animate-spin text-vlyck-cyan mb-4">autorenew</span>
      <h2 className="text-2xl font-bold">Guardando tu pedido...</h2>
      <p className="text-gray-400">Por favor espera un momento.</p>
    </div>
  );
}