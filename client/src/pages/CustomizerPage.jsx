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

  // Drag & Drop
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
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

  // 3. ACTUALIZAR ZOOM
  const handleScaleChange = (e) => {
    const newScale = parseFloat(e.target.value);
    setLayers(prev => prev.map(layer => 
      layer.id === selectedId ? { ...layer, scale: newScale } : layer
    ));
  };

  // 4. LÓGICA MOUSE
  const handleMouseDown = (e, id) => {
    e.stopPropagation(); 
    setSelectedId(id);   
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !selectedId) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setLayers(prev => prev.map(layer => {
      if (layer.id === selectedId) {
        return {
          ...layer,
          x: layer.x + deltaX,
          y: layer.y + deltaY
        };
      }
      return layer;
    }));

    setDragStart({ x: e.clientX, y: e.clientY }); 
  };

  const handleMouseUp = () => {
    setDragging(false);
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
    // ✅ CAMBIO 1: Aumentamos pt-32 a pt-44 para bajar todo el bloque
    <div className="min-h-screen bg-[#050505] text-white pt-44 pb-12 px-4" onMouseUp={handleMouseUp}>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* --- COLUMNA DERECHA (LIENZO) --- */}
        {/* ✅ CAMBIO 2: Aumentamos lg:top-32 a lg:top-44 para que el sticky respete la bajada */}
        <div className="order-1 lg:order-2 flex flex-col items-center relative lg:sticky lg:top-44 z-10">
          <div className="relative group">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur px-4 py-1 rounded-full border border-white/10 text-xs font-bold uppercase tracking-wider text-vlyck-cyan">Lienzo Interactivo</div>

            <div ref={canvasRef} className="relative w-[300px] h-[600px] bg-gray-900 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-[#222]" onMouseMove={handleMouseMove}>
                {layers.length > 0 ? (
                    layers.map((layer) => (
                        <img 
                            key={layer.id}
                            src={layer.url} 
                            alt="layer"
                            onMouseDown={(e) => handleMouseDown(e, layer.id)}
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
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-4 bg-black/50 blur-xl rounded-[100%]"></div>
            
            <div className="mt-6 text-center text-gray-500 text-xs">
                <p>👆 Toca una imagen para moverla</p>
                <p>Usa la lista de abajo para borrar capas</p>
            </div>
          </div>
        </div>

        {/* --- COLUMNA IZQUIERDA (CONTROLES) --- */}
        <div className="flex flex-col gap-8 order-2 lg:order-1 z-20 relative">
          <div>
            <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Personaliza tu carcasa</h1>
            <p className="text-gray-400">Agrega múltiples fotos, muévelas y diseña libremente.</p>
          </div>

          <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">1. Modelo</label>
            <select className="w-full bg-black border border-white/20 rounded-xl p-3 text-white outline-none focus:border-vlyck-lime">
              <option>iPhone 13</option>
              <option disabled>iPhone 14 (Pronto)</option>
            </select>
          </div>

          {/* 2. GESTOR DE CAPAS */}
          <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">2. Tus Imágenes (Capas)</label>
            
            <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-vlyck-lime/50 hover:bg-white/5 transition-all mb-4">
              <div className="flex flex-row items-center gap-2 text-gray-400">
                <span className="material-symbols-outlined">add_photo_alternate</span>
                <span className="text-sm font-bold">Agregar Nueva Foto</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>

            {layers.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {layers.map((layer, idx) => (
                        <div 
                            key={layer.id} 
                            onClick={() => setSelectedId(layer.id)}
                            className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${selectedId === layer.id ? 'border-vlyck-lime ring-2 ring-vlyck-lime/20' : 'border-white/10 opacity-70 hover:opacity-100'}`}
                        >
                            <img src={layer.url} className="w-full h-full object-cover" alt={`layer-${idx}`} />
                            <div className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-white px-1.5 rounded font-bold backdrop-blur-sm">
                                {idx + 1}
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleDeleteLayer(layer.id);
                                }}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                title="Eliminar capa"
                            >
                                <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-500 text-center py-2">No hay fotos en el lienzo.</p>
            )}
          </div>

          {/* 3. Controles */}
          <div className={`bg-[#111] p-6 rounded-2xl border transition-all ${selectedId ? 'border-vlyck-lime shadow-[0_0_15px_rgba(167,255,45,0.1)]' : 'border-white/10 opacity-50 pointer-events-none'}`}>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">3. Editar Seleccionada</label>
                {selectedId && <span className="text-[10px] text-vlyck-lime font-bold animate-pulse">CAPA ACTIVA</span>}
              </div>
              <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 mb-1 block">Zoom</label>
                    <input type="range" min="0.1" max="3" step="0.05" value={activeLayer?.scale || 0.5} onChange={handleScaleChange} className="w-full accent-vlyck-lime h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" disabled={!selectedId} />
                  </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Selecciona una miniatura arriba o toca la foto en el teléfono.</p>
          </div>

          <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">4. Instrucciones</label>
            <textarea rows="2" placeholder="Detalles extra..." value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full bg-black border border-white/20 rounded-xl p-3 text-white text-sm outline-none focus:border-vlyck-lime resize-none"></textarea>
          </div>

          <div className="pt-4">
            <div className="flex justify-between items-end mb-4">
                <span className="text-gray-400">Total</span>
                <span className="text-3xl font-black text-vlyck-lime">$8.990</span>
            </div>
            <button onClick={handleAddToCart} disabled={adding || layers.length === 0} className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${layers.length === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-vlyck-gradient text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(167,255,45,0.4)]'}`}>
              {adding ? 'Procesando...' : <><span className="material-symbols-outlined">shopping_cart</span> Agregar Diseño</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}