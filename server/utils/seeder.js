require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const connectDB = require('../config/db');

// Lista completa de marcas para láminas
const allBrands = ['Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Vivo', 'Redmi', 'Oppo', 'Huawei', 'ZTE'];

const products = [
    // 1. CARCASA MAGFRAME (Negro, Rosa, Burdeo, Naranjo)
    {
        name: "Carcasa Magframe",
        slug: "carcasa-magframe",
        category: "Carcasas",
        basePrice: 14990,
        description: "Bordes de color, trasera mate, compatible con MagSafe.",
        imageUrl: "https://via.placeholder.com/300?text=Magframe", // Cambiaremos esto luego
        hasVariants: true,
        variants: [
            { color: "Negro", model: "iPhone 11", stock: 10 },
            { color: "Negro", model: "iPhone 12", stock: 10 },
            { color: "Negro", model: "iPhone 13", stock: 10 },
            { color: "Rosa", model: "iPhone 13", stock: 5 },
            { color: "Burdeo", model: "iPhone 14", stock: 8 },
            { color: "Naranjo", model: "iPhone 15", stock: 10 }
        ]
    },
    // 2. MAGSAFE CLEAR (Rosa, Negro, Blanco - iPhone 13+)
    {
        name: "MagSafe Clear Case",
        slug: "magsafe-clear",
        category: "Carcasas",
        basePrice: 12990,
        description: "Transparente con círculo magnético.",
        imageUrl: "https://via.placeholder.com/300?text=ClearMag",
        hasVariants: true,
        variants: [
            { color: "Negro", model: "iPhone 13", stock: 10 },
            { color: "Blanco", model: "iPhone 14", stock: 10 },
            { color: "Rosa", model: "iPhone 15", stock: 10 }
        ]
    },
    // 3. CLEAR PROTECT (Full transparente iPhone 11+)
    {
        name: "Clear Protect Full",
        slug: "clear-protect",
        category: "Carcasas",
        basePrice: 9990,
        description: "Protección transparente completa.",
        imageUrl: "https://via.placeholder.com/300?text=ClearProtect",
        hasVariants: true,
        variants: [
            { color: "Transparente", model: "iPhone 11", stock: 20 },
            { color: "Transparente", model: "iPhone 12", stock: 20 },
            { color: "Transparente", model: "iPhone 13", stock: 20 }
        ]
    },
    // 4. LÁMINAS HIDROGEL (Para todas las marcas)
    {
        name: "Lámina Hidrogel Premium",
        slug: "lamina-hidrogel",
        category: "Láminas",
        basePrice: 9990,
        description: "Corte a medida para cualquier modelo.",
        imageUrl: "https://via.placeholder.com/300?text=Hidrogel",
        isConfigurable: true,
        configurableOptions: {
            brands: allBrands, // Aquí cargamos tus marcas
            allowedCustomImages: 0
        }
    },
    // 5. CARCASA PERSONALIZADA
    {
        name: "Carcasa Personalizada",
        slug: "carcasa-personalizada",
        category: "Personalizados",
        basePrice: 19990,
        description: "Sube tu imagen y creamos el diseño.",
        imageUrl: "https://via.placeholder.com/300?text=Custom",
        isConfigurable: true,
        configurableOptions: {
            brands: allBrands,
            allowedCustomImages: 5 // Permite subir hasta 5 fotos
        }
    }
];

const importData = async () => {
    try {
        await connectDB();
        await Product.deleteMany(); // BORRA TODO LO VIEJO
        await Product.insertMany(products);
        console.log('✅ Datos Importados Correctamente');
        process.exit();
    } catch (error) {
        console.error('❌ Error importando datos:', error);
        process.exit(1);
    }
};

importData();