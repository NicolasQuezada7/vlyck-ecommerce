import { MercadoPagoConfig, Preference } from 'mercadopago';
import asyncHandler from 'express-async-handler';

// Asegúrate de que esta variable esté en Railway con tu Token de Producción (APP_USR-...)
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

const createPreference = asyncHandler(async (req, res) => {
    const { orderItems } = req.body;

    if (!orderItems || orderItems.length === 0) {
        res.status(400);
        throw new Error('No hay ítems en la orden');
    }

    const items = orderItems.map(item => ({
        title: item.name,
        unit_price: Number(item.basePrice || item.price),
        currency_id: 'CLP',
        quantity: Number(item.quantity || item.qty),
    }));

    // --- LÓGICA DE URL ---
    // En Railway debes poner la variable FRONTEND_URL = https://vlyck.cl
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    try {
        const preference = new Preference(client);
        
        const result = await preference.create({
            body: {
                items: items,
                payer: {
                    // Si el usuario está logueado usamos su mail, si no, uno genérico para que MP no reclame
                    email: req.user ? req.user.email : "cliente@vlyck.cl" 
                },
                back_urls: {
                    success: `${frontendUrl}/payment-success`,
                    failure: `${frontendUrl}/cart`,
                    pending: `${frontendUrl}/cart`
                },
                auto_return: "approved",
                binary_mode: true // Solo acepta pagos aprobados o rechazados
            }
        });

        res.json({ id: result.id });

    } catch (error) {
        console.error("Error Mercado Pago:", error);
        res.status(500);
        throw new Error('Error al crear el pago');
    }
});

export { createPreference };