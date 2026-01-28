import { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import axios from 'axios';

export default function CustomizerPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // --- ESTADOS DE MOLDES ---
  const [mockups, setMockups] = useState([]); 
  const [activeMockup, setActiveMockup] = useState(null); 
  const [loadingMockups, setLoadingMockups] = useState(true);

  // --- ESTADOS DEL DISEÑADOR ---
  const [layers, setLayers] = useState([]); 
  const [selectedId, setSelectedId] = useState(null); 
  
  // Gestos
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPinchDist, setInitialPinchDist] = useState(null);
  const [initialScale, setInitialScale] = useState(1);

  // Datos finales
  const [instructions, setInstructions] = useState(''); // <--- Aquí guardamos el texto
  const [adding, setAdding] = useState(false);

  const canvasRef = useRef(null); 

  // 0. CARGAR MOLDES
  useEffect(() => {
    const fetchMockups = async () => {
        try {
            const { data } = await axios.get('/api/mockups');
            setMockups(data);
            if (data.length > 0) setActiveMockup(data[0]);
            setLoadingMockups(false);
        } catch (error) {
            console.error("Error cargando moldes:", error);
            setLoadingMockups(false);
        }
    };
    fetchMockups();
  }, []);

  // 1. CAMBIAR MODELO
  const handleModelChange = (e) => {
      const selectedId = e.target.value;
      const found = mockups.find(m => m._id === selectedId);
      if (found) setActiveMockup(found);
  };

  // 2. SUBIR IMAGEN
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      const newId = Date.now(); 
      // Capa nueva al centro
      const newLayer = { id: newId, url: imgUrl, x: 0, y: 0, scale: 0.5 };
      setLayers(prev => [...prev, newLayer]); 
      setSelectedId(newId); 
    }
    e.target.value = null; 
  };

  // 3. ELIMINAR CAPA
  const handleDeleteLayer = (idToDelete) => {
    setLayers(prev => prev.filter(layer => layer.id !== idToDelete));
    if (selectedId === idToDelete) setSelectedId(null);
  };

  // 4. ZOOM MANUAL
  const handleScaleChange = (e) => {
    const newScale = parseFloat(e.target.value);
    setLayers(prev => prev.map(layer => layer.id === selectedId ? { ...layer, scale: newScale } : layer));
  };

  // --- 5. MOTOR DE GESTOS (TOUCH & MOUSE) ---
  const handleLayerStart = (e, id, currentScale) => {
    e.stopPropagation(); // Evita burbujeo
    setSelectedId(id); // Selecciona la capa tocada
    
    // Unificar coordenadas
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (e.touches && e.touches.length === 2) {
        // Inicio de Pinch Zoom
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        setInitialPinchDist(dist);
        setInitialScale(currentScale);
        setIsDragging(false);
    } else {
        // Inicio de Arrastre
        setIsDragging(true);
        setDragStart({ x: clientX, y: clientY });
    }
  };

  const handleMove = (e) => {
    if (!selectedId) return;

    // Lógica Pinch Zoom (2 dedos)
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

    // Lógica Arrastre (1 dedo / mouse)
    if (isDragging) {
        if(e.touches) e.preventDefault(); // Evita scroll de pantalla
        
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

  // 6. GUARDAR Y AL CARRITO
  const handleAddToCart = async () => {
    if (layers.length === 0) return alert("El diseño está vacío. Sube al menos una foto.");
    setSelectedId(null); // Deseleccionar para la captura limpia
    
    setTimeout(async () => {
        setAdding(true);
        try {
          // Generar imagen final del canvas
          const canvas = await html2canvas(canvasRef.current, { useCORS: true, backgroundColor: null, scale: 2 });
          const designPreview = canvas.toDataURL('image/png');
    
          const customItem = {
            _id: `custom-${Date.now()}`, 
            product: 'custom-service-id', // ID genérico para el backend
            name: `Carcasa Personalizada - ${activeMockup.name}`,
            image: designPreview, // La imagen generada
            price: activeMockup.price || 8990, 
            countInStock: 999,
            category: "Personalizadas",
            brand: activeMockup.brand,
            variantColor: "Diseño Propio",
            quantity: 1,
            customInstructions: instructions, // ✅ Enviamos las instrucciones
            originalLayers: layers // Guardamos capas por si queremos reeditar en el futuro (avanzado)
          };
    
          addToCart(customItem);
          setAdding(false);
          navigate('/cart');
    
        } catch (error) {
          console.error(error);
          setAdding(false);
          alert("Hubo un error guardando tu diseño. Intenta de nuevo.");
        }
    }, 100);
  };

  const activeLayer = layers.find(l => l.id === selectedId);

  if (loadingMockups) return <div className="min-h-screen bg-[#050505] text-white pt-48 text-center animate-pulse">Cargando estudio de diseño...</div>;

  return (
    <div 
        className="min-h-screen bg-[#050505] text-white pt-32 pb-12 px-4 selection:bg-none font-sans"
        onMouseUp={handleEnd}
        onTouchEnd={handleEnd}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
    >
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        
        {/* --- COLUMNA DERECHA: LIENZO (Primero en móvil para verlo) --- */}
        <div className="order-1 lg:order-2 flex flex-col items-center relative lg:sticky lg:top-36 z-10">
          
          <div className="relative group perspective-1000">
            {/* Tooltip flotante */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-wider text-vlyck-lime whitespace-nowrap shadow-xl z-50">
                {selectedId ? "💡 Arrastra para mover • Pellizca para Zoom" : "👆 Toca una foto para editarla"}
            </div>

            {/* AREA DEL CANVAS */}
            <div 
                ref={canvasRef} 
                className="relative w-[300px] h-[600px] bg-gray-900 rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-[6px] border-[#1a1a1a]"
                style={{ touchAction: 'none' }} // Deshabilita scroll nativo dentro del canvas
            >
                {/* 1. Capas de Usuario */}
                {layers.length > 0 ? (
                    layers.map((layer) => (
                        <img 
                            key={layer.id}
                            src={layer.url} 
                            alt="layer"
                            // Eventos de inicio
                            onMouseDown={(e) => handleLayerStart(e, layer.id, layer.scale)}
                            onTouchStart={(e) => handleLayerStart(e, layer.id, layer.scale)}
                            
                            className={`absolute max-w-none origin-center cursor-grab active:cursor-grabbing transition-shadow ${selectedId === layer.id ? 'z-20 drop-shadow-[0_0_15px_rgba(167,255,45,0.6)]' : 'z-10'}`}
                            style={{
                                left: '50%', top: '50%',
                                // La magia matemática de posición y escala
                                transform: `translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) scale(${layer.scale})`,
                                // Borde visual solo al editar
                                border: selectedId === layer.id ? '2px dashed #a7ff2d' : 'none'
                            }}
                            draggable="false" 
                        />
                    ))
                ) : (
                    // Placeholder vacío
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 pointer-events-none">
                        <span className="material-symbols-outlined text-7xl mb-4 opacity-50">add_photo_alternate</span>
                        <p className="text-xs px-8 text-center font-bold uppercase tracking-widest opacity-50">Sube tus fotos</p>
                    </div>
                )}
                
                {/* 2. Imagen del Molde (Overlay Transparente) */}
                {activeMockup && (
                    <img 
                        src={activeMockup.image} 
                        alt={activeMockup.name} 
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-30" 
                        crossOrigin="anonymous" 
                    />
                )}
                
                {/* 3. Brillo estético */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none z-40 rounded-[2.5rem]"></div>
            </div>
            
            <div className="mt-6 text-center text-gray-500 text-xs font-medium">
                <span className="md:hidden">Gestos Multi-táctiles Activados ✨</span>
                <span className="hidden md:block">Usa el mouse para arrastrar y la rueda/barra para zoom</span>
            </div>
          </div>
        </div>

        {/* --- COLUMNA IZQUIERDA: CONTROLES --- */}
        <div className="flex flex-col gap-5 order-2 lg:order-1 z-20 relative pb-20">
          
          <div className="mb-2">
            <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter text-white">Diseña tu <span className="text-vlyck-lime">Estilo</span></h1>
            <p className="text-gray-400 text-sm">Crea una carcasa única en segundos.</p>
          </div>

          {/* 1. SELECCIONAR MODELO */}
          <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">1. Selecciona tu Equipo</label>
            {mockups.length > 0 ? (
                <div className="relative">
                    <select 
                        onChange={handleModelChange} 
                        value={activeMockup?._id}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-vlyck-lime focus:ring-1 focus:ring-vlyck-lime text-sm cursor-pointer appearance-none font-bold"
                    >
                        {mockups.map(m => (
                            <option key={m._id} value={m._id}>{m.brand} - {m.name}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
                </div>
            ) : (
                <p className="text-red-500 text-xs">Cargando modelos...</p>
            )}
          </div>

          {/* 2. SUBIR FOTOS */}
          <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">2. Sube tus Fotos</label>
            
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-vlyck-lime/50 hover:bg-white/5 transition-all mb-4 bg-[#080808] group">
              <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-vlyck-lime transition-colors">
                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                <span className="text-[10px] font-bold uppercase tracking-wide">Toca para subir</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>

            {/* Miniaturas de Capas */}
            {layers.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {layers.map((layer, idx) => (
                        <div 
                            key={layer.id} 
                            onClick={() => setSelectedId(layer.id)}
                            className={`relative w-14 h-14 shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedId === layer.id ? 'border-vlyck-lime scale-105 shadow-lg shadow-vlyck-lime/20' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                        >
                            <img src={layer.url} className="w-full h-full object-cover" alt={`layer-${idx}`} />
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleDeleteLayer(layer.id);
                                }}
                                className="absolute top-0 right-0 w-full h-full bg-black/60 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm"
                            >
                                <span className="material-symbols-outlined text-sm font-bold text-red-500">delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          {/* 3. AJUSTES (Solo visible al seleccionar) */}
          <div className={`bg-[#111] p-5 rounded-2xl border transition-all duration-300 ${selectedId ? 'border-vlyck-lime/50 shadow-[0_0_20px_rgba(167,255,45,0.05)]' : 'border-white/10 opacity-50 pointer-events-none grayscale'}`}>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">3. Ajustes de Imagen</label>
                {selectedId && <span className="text-[10px] text-vlyck-lime font-black uppercase tracking-widest animate-pulse">Editando</span>}
              </div>
              <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>Alejar</span>
                      <span>Acercar</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="3" 
                    step="0.05" 
                    value={activeLayer?.scale || 0.5} 
                    onChange={handleScaleChange} 
                    className="w-full accent-vlyck-lime h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                    disabled={!selectedId} 
                  />
              </div>
          </div>

          {/* 4. INDICACIONES (NUEVO) */}
          <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">4. Indicaciones Adicionales</label>
            <textarea 
                rows="3"
                placeholder="Ej: Centrar la cara del perro, poner la fecha 2024 abajo, etc..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-vlyck-lime transition-all resize-none placeholder-gray-700 font-medium"
            />
          </div>

          {/* RESUMEN Y BOTÓN */}
          <div className="pt-2">
            <div className="flex justify-between items-end mb-4 px-2">
                <span className="text-gray-400 text-sm font-bold uppercase tracking-wide">Total Estimado</span>
                <span className="text-3xl font-black text-vlyck-lime tracking-tighter">${activeMockup?.price.toLocaleString('es-CL') || '0'}</span>
            </div>
            
            <button 
                onClick={handleAddToCart} 
                disabled={adding || layers.length === 0} 
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 text-sm md:text-base ${
                    layers.length === 0 
                    ? 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed border border-white/5' 
                    : 'bg-vlyck-gradient text-black hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(167,255,45,0.3)] shadow-lg'
                }`}
            >
              {adding ? (
                  <>Guardando Diseño <span className="material-symbols-outlined animate-spin">progress_activity</span></>
              ) : (
                  <>Agregar al Carrito <span className="material-symbols-outlined font-bold">shopping_cart</span></>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}