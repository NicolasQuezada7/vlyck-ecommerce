import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    const confirmPayment = async () => {
      if (processedRef.current) return;
      processedRef.current = true;

      const queryParams = new URLSearchParams(location.search);
      const status = queryParams.get('status'); // approved
      const paymentId = queryParams.get('payment_id');
      const orderId = queryParams.get('external_reference'); // <--- EL ID DE LA ORDEN

      if (status === 'approved' && orderId) {
        try {
          const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
          
          // Llamamos al endpoint de "Pagar Orden" que ya tienes en el backend
          await axios.put(`/api/orders/${orderId}/pay`, {
            id: paymentId,
            status: status,
            update_time: new Date().toISOString(),
            email_address: userInfo?.email || 'guest@vlyck.cl'
          }, config);

          // Redirigir al recibo final
          navigate(`/order/${orderId}`);

        } catch (error) {
          console.error("Error confirmando pago:", error);
          alert("Error al confirmar el pago en el sistema. Guarda tu comprobante.");
          // Aún así vamos a la orden para que vea el estado
          navigate(`/order/${orderId}`);
        }
      } else {
        // Si falló o canceló, volver al carrito o home
        navigate('/');
      }
    };

    confirmPayment();
  }, [location, navigate, userInfo]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
      <span className="material-symbols-outlined text-6xl animate-spin text-vlyck-lime mb-6">autorenew</span>
      <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Confirmando Pago...</h2>
      <p className="text-gray-400 font-mono text-sm">No cierres esta ventana.</p>
    </div>
  );
}