import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BRANDS = ["Apple", "Samsung", "Huawei", "Redmi", "Xiaomi", "Motorola", "Vivo", "Oppo", "Honor", "Genericos"];
const CATEGORIES = ["MagFrame", "MagSafe Clear", "Clear Protect", "Personalizadas", "Accesorios"];
const PRESET_COLORS = ["Negro", "Blanco", "Rosado", "Naranja", "Burdeo", "Azul", "Verde", "Transparente", "Rojo", "Lila"];

export default function ProductEditPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useAuth();

  // --- ESTADOS DEL PRODUCTO ---
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState(0);
  const [images, setImages] = useState([]); // Galería Principal
  const [brand, setBrand] = useState('Genericos');
  const [category, setCategory] = useState('Accesorios');
  const [description, setDescription] = useState('');

  // --- ESTADOS DE VARIANTES ---
  const [variants, setVariants] = useState([]);
  const [newColor, setNewColor] = useState('');
  const [newColorStock, setNewColorStock] = useState(0);
  const [newColorImages, setNewColorImages] = useState([]); // Galería temporal para variante

  // --- ESTADOS DE CARGA ---
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isCreating = name.includes('Producto Nuevo');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get(`/api/products/id/${productId}`, config);

        setName(data.name);
        setSlug(data.slug);
        setPrice(data.basePrice);

        // Manejo inteligente de imágenes (si es string o array)
        if (data.images && Array.isArray(data.images)) {
          setImages(data.images);
        } else if (data.imageUrl) {
          setImages([data.imageUrl]);
        } else {
          setImages([]);
        }

        setBrand(data.brand || 'Genericos');
        setCategory(data.category || 'Accesorios');
        setDescription(data.description);
        setVariants(data.variants || []);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar datos.');
        setLoading(false);
      }
    };
    if (userInfo && userInfo.isAdmin) fetchProduct();
    else navigate('/admin');
  }, [productId, userInfo, navigate]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    const autoSlug = val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setSlug(autoSlug);
  };

  // --- SUBIDA DE IMÁGENES ---
  const uploadFileHandler = async (e, isVariant = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const { data } = await axios.post(`/api/upload`, formData, config);

      if (isVariant) {
        setNewColorImages(prev => [...prev, data]);
      } else {
        setImages(prev => [...prev, data]);
      }
      setUploading(false);
    } catch (error) {
      setUploading(false);
      alert('Error al subir imagen');
    }
  };

  const removeImage = (index, isVariant = false) => {
    if (isVariant) setNewColorImages(prev => prev.filter((_, i) => i !== index));
    else setImages(prev => prev.filter((_, i) => i !== index));
  };

  // --- GESTIÓN DE VARIANTES ---
  const addVariant = () => {
    if (!newColor) return alert("Selecciona o escribe un color");

    // Limpiamos espacios y estandarizamos
    const colorClean = newColor.trim();

    // Verificamos si existe (ignorando mayúsculas/minúsculas)
    const exists = variants.find(v => v.color.toLowerCase() === colorClean.toLowerCase());

    if (exists) {
      return alert(`El color "${colorClean}" ya existe en la lista. Bórralo primero si quieres editarlo.`);
    }

    const updatedVariants = [...variants, {
      color: colorClean, // Usamos el nombre limpio
      stock: parseInt(newColorStock),
      images: newColorImages
    }];
    setVariants(updatedVariants);

    // Resetear inputs
    setNewColor('');
    setNewColorStock(0);
    setNewColorImages([]);
  };

  const removeVariant = (colorToRemove) => {
    setVariants(variants.filter(v => v.color !== colorToRemove));
  };

  const totalStock = variants.reduce((acc, curr) => acc + curr.stock, 0);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(
        `/api/products/${productId}`,
        {
          name, slug, basePrice: price, images, brand, category, description,
          variants,
          countInStock: variants.length > 0 ? totalStock : 0
        },
        config
      );
      navigate('/admin/productlist');
    } catch (error) { alert('Error guardando'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-vlyck-lime">Cargando editor...</div>;

  return (
    <div className="mx-auto max-w-6xl pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Link to="/admin/productlist" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-2 text-sm">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Cancelar y Volver
          </Link>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            {isCreating ? 'Nuevo Producto' : 'Editar Producto'}
          </h1>
        </div>
        <button onClick={submitHandler} className="px-8 py-4 bg-vlyck-gradient text-black font-black rounded-xl uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(167,255,45,0.3)] flex items-center gap-2">
          <span className="material-symbols-outlined">save</span>
          Guardar Todo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA: DATOS GENERALES */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Tarjeta Información Básica */}
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-vlyck-cyan">info</span> Información Básica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Nombre del Producto</label>
                <input type="text" value={name} onChange={handleNameChange} className="input-cyber" placeholder="Ej. MagFrame iPhone 15 Pro" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Precio Base</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input-cyber pl-8" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Slug (URL)</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="input-cyber text-gray-500" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Marca</label>
                <select value={brand} onChange={(e) => setBrand(e.target.value)} className="input-cyber appearance-none cursor-pointer">
                  {BRANDS.map(b => <option key={b} value={b} className="bg-[#111]">{b}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Categoría</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-cyber appearance-none cursor-pointer">
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-cyber h-32 resize-none leading-relaxed"></textarea>
              </div>
            </div>
          </div>

          {/* Tarjeta Variantes (Colores) */}
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[150px] text-vlyck-lime">palette</span>
            </div>

            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-vlyck-lime">palette</span> Variantes y Stock
              </h3>
              <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <span className="text-xs text-gray-400 uppercase tracking-wider mr-2">Stock Total</span>
                <span className="text-xl font-bold text-white">{totalStock}</span>
              </div>
            </div>

            {/* AREA DE CREAR VARIANTE */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6 mb-6 relative z-10">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Agregar Nueva Variante</h4>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* 1. Elegir Color y Stock */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Color</label>
                    <div className="flex gap-2">
                      <select value={newColor} onChange={(e) => setNewColor(e.target.value)} className="input-cyber w-full">
                        <option value="">Seleccionar...</option>
                        {PRESET_COLORS.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                      </select>
                      <input type="text" placeholder="Otro..." value={newColor} onChange={(e) => setNewColor(e.target.value)} className="input-cyber w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Cantidad (Stock)</label>
                    <input type="number" value={newColorStock} onChange={(e) => setNewColorStock(e.target.value)} className="input-cyber" />
                  </div>
                </div>

                {/* 2. Subir Fotos */}
                <div className="md:col-span-7 flex flex-col">
                  <label className="text-xs text-gray-500 mb-2 block">Galería del Color (Máx 3 rec.)</label>

                  <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
                    {/* Botón Subir */}
                    <label className="w-20 h-20 shrink-0 cursor-pointer bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center hover:bg-white/10 hover:border-vlyck-lime/50 transition-all text-gray-400 hover:text-white">
                      <span className="material-symbols-outlined">{uploading ? 'hourglass_top' : 'add_photo_alternate'}</span>
                      <input type="file" className="hidden" onChange={(e) => uploadFileHandler(e, true)} disabled={uploading} />
                    </label>

                    {/* Previews */}
                    {newColorImages.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 shrink-0 group">
                        <img src={img} className="w-full h-full object-cover rounded-xl border border-white/10" />
                        <button onClick={() => removeImage(idx, true)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <span className="material-symbols-outlined text-[14px] block">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-600">Sube fotos específicas para este color (Frontal, Trasera, Detalle)</p>
                </div>
              </div>

              <button type="button" onClick={addVariant} className="w-full mt-4 py-3 bg-white/10 hover:bg-vlyck-lime hover:text-black rounded-xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">add_circle</span> Agregar Variante
              </button>
            </div>

            {/* LISTA DE VARIANTES CREADAS */}
            <div className="space-y-3 relative z-10">
              {variants.length === 0 && <div className="text-center text-gray-600 py-4 italic">No hay variantes creadas. El producto se mostrará sin opciones de color.</div>}

              {variants.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 hover:border-white/20 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 shadow-lg" style={{ backgroundColor: getColorHex(v.color) }}></div>
                    <div>
                      <p className="font-bold text-white text-lg">{v.color}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">inventory_2</span> {v.stock} unid.</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">photo_library</span> {v.images?.length || 0} fotos</span>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeVariant(v.color)} className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: IMÁGENES GLOBALES */}
        <div className="flex flex-col gap-8">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-xl sticky top-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-vlyck-cyan">image</span> Galería General
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Estas fotos se mostrarán si el cliente no selecciona ningún color específico.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square group">
                  <img src={img} className="w-full h-full object-cover rounded-xl border border-white/10" />
                  <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-lg p-1 backdrop-blur-sm transition-colors">
                    <span className="material-symbols-outlined text-[16px] block">delete</span>
                  </button>
                </div>
              ))}

              <label className="aspect-square cursor-pointer bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 hover:border-vlyck-lime/50 transition-all text-gray-500 hover:text-white">
                <span className="material-symbols-outlined text-3xl">{uploading ? 'hourglass_top' : 'add_a_photo'}</span>
                <span className="text-xs font-bold">Subir</span>
                <input type="file" className="hidden" onChange={(e) => uploadFileHandler(e, false)} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .input-cyber {
            width: 100%;
            background-color: #000; /* Fondo negro absoluto para contraste */
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 0.75rem; /* rounded-xl */
            padding: 0.75rem 1rem;
            color: white;
            outline: none;
            transition: all 0.2s;
        }
        .input-cyber:focus {
            border-color: #a7ff2d; /* Vlyck Lime */
            box-shadow: 0 0 0 1px #a7ff2d;
        }
        .input-cyber::placeholder {
            color: #444;
        }
        /* Color del icono de select */
        select.input-cyber {
             background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
             background-position: right 0.5rem center;
             background-repeat: no-repeat;
             background-size: 1.5em 1.5em;
             padding-right: 2.5rem;
        }
      `}</style>
    </div>
  );
}

function getColorHex(colorName) {
  const map = { 'Negro': '#111', 'Blanco': '#eee', 'Rosado': '#ffc0cb', 'Naranja': '#ffa500', 'Burdeo': '#800020', 'Azul': '#0000ff', 'Verde': '#008000', 'Rojo': '#ff0000', 'Lila': '#c8a2c8' };
  return map[colorName] || '#333';
}