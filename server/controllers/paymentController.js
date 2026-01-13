import { MercadoPagoConfig, Preference } from 'mercadopago';
import asyncHandler from 'express-async-handler';

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

    // --- DETECCIÓN DE ENTORNO ---
    // Si existe la variable en Railway/Netlify, la usa. Si no, usa localhost.
    // IMPORTANTE: NO pongas una barra "/" al final de la URL en tu archivo .env
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    try {
        const preference = new Preference(client);
        
        const result = await preference.create({
            body: {
                items: items,
                payer: {
                    // Idealmente esto debería venir de req.user.email si está logueado,
                    // pero para sandbox este email de prueba fijo está bien.
                    email: "test_user_19283@testuser.com" 
                },
                back_urls: {
                    success: `${frontendUrl}/payment-success`,
                    failure: `${frontendUrl}/cart`,
                    pending: `${frontendUrl}/cart`
                },
                auto_return: "approved", // ACTIVADO (Funcionará bien en HTTPS/Producción)
                binary_mode: true
            }
        });

        res.json({ id: result.id });

    } catch (error) {
        console.error("Error Mercado Pago:", error);
        res.status(500);
        throw new Error('Error al crear la preferencia de pago');
    }
});

export { createPreference };