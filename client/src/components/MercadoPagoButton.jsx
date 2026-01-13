import { useEffect, useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function MercadoPagoButton({ cartItems }) {
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { userInfo } = useAuth();

  useEffect(() => {
    // Inicializamos con tu Public Key
    initMercadoPago(import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY, {
        locale: 'es-CL'
    });
  }, []);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`, // Enviamos el token para seguridad
        },
      };

      // Petición al Backend
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/payment/create-order`,
        { orderItems: cartItems },
        config
      );

      // Si todo sale bien, guardamos el ID que nos dio Mercado Pago
      if (data.id) {
        setPreferenceId(data.id);
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con Mercado Pago. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-4">
      {preferenceId ? (
         // SI YA TENEMOS ID -> Muestra el botón oficial (Wallet)
         <Wallet initialization={{ preferenceId: preferenceId }} customization={{ texts:{ valueProp: 'smart_option'}}} />
      ) : (
        // SI NO TENEMOS ID -> Muestra nuestro botón para generar la orden
        <button 
            onClick={handleBuy} 
            disabled={loading}
            className="w-full bg-[#009EE3] hover:bg-[#007eb5] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,158,227,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
                <>
                    <span className="material-symbols-outlined">payments</span>
                    Pagar con Mercado Pago
                </>
            )}
        </button>
      )}
    </div>
  );
}