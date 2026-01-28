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
      const status = queryParams.get('status');
      const paymentId = queryParams.get('payment_id');
      const orderId = queryParams.get('external_reference'); // Recibimos el ID

      if (status === 'approved' && orderId) {
        try {
          // Si hay usuario, enviamos token. Si es invitado, no pasa nada (el backend debe permitirlo o manejarlo)
          const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
          
          await axios.put(`/api/orders/${orderId}/pay`, {
            id: paymentId,
            status: status,
            update_time: new Date().toISOString(),
            email_address: userInfo?.email || 'guest@vlyck.cl'
          }, config);

          navigate(`/order/${orderId}`); // Al recibo
        } catch (error) {
          console.error("Error confirmando:", error);
          navigate(`/order/${orderId}`);
        }
      } else {
        navigate('/');
      }
    };

    confirmPayment();
  }, [location, navigate, userInfo]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <h2 className="text-xl animate-pulse">Confirmando pago...</h2>
    </div>
  );
}