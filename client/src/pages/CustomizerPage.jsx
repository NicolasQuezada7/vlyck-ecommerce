import { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

// Tu molde local
import mockup_iphone from '../assets/iphone13-frame.png';
const MOCKUP_FRAME = mockup_iphone; 

export default function CustomizerPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // --- ESTADOS ---
  const [layers, setLayers] = useState([]); 
  const [selectedId, setSelectedId] = useState(null); 

  // Drag & Drop (Mouse + Touch)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Pinch Zoom (Touch)
  const [initialPinchDist, setInitialPinchDist] = useState(null);
  const [initialScale, setInitialScale] = useState(1);

  const [instructions, setInstructions] = useState('');
  const [adding, setAdding] = useState(false);

  const canvasRef = useRef(null); 

  // 1. SUBIR IMAGEN
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      const newId = Date.now(); 

      const newLayer = {
        id: newId,
        url: imgUrl,
        x: 0, 
        y: 0, 
        scale: 0.5 
      };

      setLayers(prev => [...prev, newLayer]); 
      setSelectedId(newId); 
    }
    e.target.value = null; 
  };

  // 2. ELIMINAR CAPA
  const handleDeleteLayer = (idToDelete) => {
    setLayers(prev => prev.filter(layer => layer.id !== idToDelete));
    if (selectedId === idToDelete) {
        setSelectedId(null);
    }
  };

  // 3. ACTUALIZAR ZOOM (Barra manual)
  const handleScaleChange = (e) => {
    const newScale = parseFloat(e.target.value);
    setLayers(prev => prev.map(layer => 
      layer.id === selectedId ? { ...layer, scale: newScale } : layer
    ));
  };

  // --- 4. LÓGICA UNIFICADA (MOUSE & TOUCH) ---

  const handleLayerStart = (e, id, currentScale) => {
    e.stopPropagation(); 
    setSelectedId(id);
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (e.touches && e.touches.length === 2) {
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        setInitialPinchDist(dist);
        setInitialScale(currentScale);
        setIsDragging(false);
    } else {
        setIsDragging(true);
        setDragStart({ x: clientX, y: clientY });
    }
  };

  const handleMove = (e) => {
    if (!selectedId) return;

    if (e.touches && e.touches.length === 2 && initialPinchDist) {
        e.preventDefault(); 
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        
        const scaleFactor = dist / initialPinchDist;
        const newScale = Math.min(Math.max(initialScale * scaleFactor, 0.1), 3);

        setLayers(prev => prev.map(layer => 
            layer.id === selectedId ? { ...layer, scale: newScale } : layer
        ));
        return;
    }

    if (isDragging) {
        if(e.touches) e.preventDefault(); 

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - dragStart.x;
        const deltaY = clientY - dragStart.y;

        setLayers(prev => prev.map(layer => {
            if (layer.id === selectedId) {
                return { ...layer, x: layer.x + deltaX, y: layer.y + deltaY };
            }
            return layer;
        }));

        setDragStart({ x: clientX, y: clientY });
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setInitialPinchDist(null);
  };

  // 5. GUARDAR
  const handleAddToCart = async () => {
    if (layers.length === 0) return alert("El diseño está vacío. Sube al menos una foto.");
    setSelectedId(null); 
    
    setTimeout(async () => {
        setAdding(true);
        try {
          const canvas = await html2canvas(canvasRef.current, {
            useCORS: true,
            backgroundColor: null,
            scale: 2 
          });
          const designPreview = canvas.toDataURL('image/png');
    
          const customItem = {
            _id: `custom-${Date.now()}`, 
            product: 'custom-service-id', 
            name: "Carcasa Personalizada - iPhone 13",
            image: designPreview, 
            price: 8990, 
            countInStock: 999,
            category: "Personalizadas",
            brand: "Vlyck Custom",
            variantColor: "Diseño Propio",
            quantity: 1,
            customInstructions: instructions,
            originalLayers: layers 
          };
    
          addToCart(customItem);
          setAdding(false);
          navigate('/cart');
    
        } catch (error) {
          console.error(error);
          setAdding(false);
          alert("Hubo un error guardando tu diseño.");
        }
    }, 100);
  };

  const activeLayer = layers.find(l => l.id === selectedId);

  return (
    <div 
        // ✅ CORRECCIÓN 1: pt-48 para bajar todo el contenido debajo de la navbar
        className="min-h-screen bg-[#050505] text-white pt-48 pb-12 px-4 selection:bg-none"
        onMouseUp={handleEnd}
        onTouchEnd={handleEnd}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
    >
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* --- COLUMNA DERECHA (LIENZO) --- */}
        {/* ✅ CORRECCIÓN 2: top-48 para el sticky */}
        <div className="order-1 lg:order-2 flex flex-col items-center relative lg:sticky lg:top-48 z-10">
          <div className="relative group">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur px-4 py-1 rounded-full border border-white/10 text-xs font-bold uppercase tracking-wider text-vlyck-cyan whitespace-nowrap">
                {selectedId ? "Pellizca para Zoom / Arrastra" : "Toca una foto para editar"}
            </div>

            <div 
                ref={canvasRef} 
                className="relative w-[300px] h-[600px] bg-gray-900 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-[#222]"
                style={{ touchAction: 'none' }} 
            >
                {layers.length > 0 ? (
                    layers.map((layer) => (
                        <img 
                            key={layer.id}
                            src={layer.url} 
                            alt="layer"
                            onMouseDown={(e) => handleLayerStart(e, layer.id, layer.scale)}
                            onTouchStart={(e) => handleLayerStart(e, layer.id, layer.scale)}
                            className={`absolute max-w-none origin-center cursor-grab active:cursor-grabbing transition-shadow ${selectedId === layer.id ? 'z-20 drop-shadow-[0_0_10px_rgba(167,255,45,0.8)]' : 'z-0'}`}
                            style={{
                                left: '50%', top: '50%',
                                transform: `translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) scale(${layer.scale})`,
                                border: selectedId === layer.id ? '2px dashed #a7ff2d' : 'none'
                            }}
                            draggable="false" 
                        />
                    ))
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 pointer-events-none">
                        <span className="material-symbols-outlined text-6xl mb-4">collage</span>
                        <p className="text-sm px-8 text-center">Tu diseño aparecerá aquí</p>
                    </div>
                )}
                <img src={MOCKUP_FRAME} alt="Phone Frame" className="absolute inset-0 w-full h-full object-cover pointer-events-none z-30" />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-40 rounded-[2.5rem]"></div>
            </div>
            
            <div className="mt-6 text-center text-gray-500 text-xs">
                <p className="md:hidden text-vlyck-lime">Gestos Activados: Usa 2 dedos para Zoom</p>
                <p className="hidden md:block">👆 Usa el mouse para arrastrar y la barra para zoom</p>
            </div>
          </div>
        </div>

        {/* --- COLUMNA IZQUIERDA (CONTROLES) --- */}
        <div className="flex flex-col gap-6 order-2 lg:order-1 z-20 relative">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 uppercase tracking-tight">Personaliza tu carcasa</h1>
            <p className="text-gray-400 text-sm">Sube tus fotos, tócalas para seleccionarlas y usa dos dedos para ajustar el tamaño.</p>
          </div>

          <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">1. Modelo</label>
            <select className="w-full bg-black border border-white/20 rounded-xl p-3 text-white outline-none focus:border-vlyck-lime text-sm">
              <option>iPhone 13</option>
              <option disabled>iPhone 14 (Pronto)</option>
            </select>
          </div>

          <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">2. Tus Imágenes</label>
            
            <label className="flex flex-col items-center justify-center w-full h-14 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-vlyck-lime/50 hover:bg-white/5 transition-all mb-4 bg-[#080808]">
              <div className="flex flex-row items-center gap-2 text-gray-400">
                <span className="material-symbols-outlined">add_photo_alternate</span>
                <span className="text-sm font-bold">Subir Foto</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>

            {layers.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {layers.map((layer, idx) => (
                        <div 
                            key={layer.id} 
                            onClick={() => setSelectedId(layer.id)}
                            className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${selectedId === layer.id ? 'border-vlyck-lime ring-2 ring-vlyck-lime/20' : 'border-white/10 opacity-70 hover:opacity-100'}`}
                        >
                            <img src={layer.url} className="w-full h-full object-cover" alt={`layer-${idx}`} />
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleDeleteLayer(layer.id);
                                }}
                                className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <div className={`bg-[#111] p-5 rounded-2xl border transition-all ${selectedId ? 'border-vlyck-lime shadow-[0_0_15px_rgba(167,255,45,0.1)]' : 'border-white/10 opacity-50 pointer-events-none'}`}>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">3. Ajustes Manuales</label>
                {selectedId && <span className="text-[10px] text-vlyck-lime font-bold animate-pulse">EDITANDO</span>}
              </div>
              <div>
                  <label className="text-[10px] text-gray-400 mb-1 block">Zoom (O usa dos dedos)</label>
                  <input type="range" min="0.1" max="3" step="0.05" value={activeLayer?.scale || 0.5} onChange={handleScaleChange} className="w-full accent-vlyck-lime h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" disabled={!selectedId} />
              </div>
          </div>

          <div className="pt-4 pb-20 lg:pb-0">
            <div className="flex justify-between items-end mb-4">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="text-3xl font-black text-vlyck-lime">$8.990</span>
            </div>
            <button onClick={handleAddToCart} disabled={adding || layers.length === 0} className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${layers.length === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-vlyck-gradient text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(167,255,45,0.4)]'}`}>
              {adding ? 'Creando...' : <><span className="material-symbols-outlined">shopping_cart</span> Agregar al Carrito</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}