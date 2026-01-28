import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function MockupManager() {
  const { userInfo } = useAuth();
  
  // --- ESTADOS DE DATOS ---
  const [mockups, setMockups] = useState([]);
  const [filteredMockups, setFilteredMockups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE FILTRO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('Todas');

  // --- ESTADOS DE UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // --- ESTADO DEL FORMULARIO ---
  const [editingId, setEditingId] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    image: '',
    price: 8990,
    isActive: true
  });

  // 1. CARGAR MOLDES
  const fetchMockups = async () => {
    try {
      const { data } = await axios.get('/api/mockups');
      setMockups(data);
      setFilteredMockups(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMockups();
  }, []);

  // 2. FILTRADO INTELIGENTE
  useEffect(() => {
    let result = mockups;

    // A. Filtro por Marca
    if (filterBrand !== 'Todas') {
        result = result.filter(m => m.brand === filterBrand);
    }

    // B. Filtro por Buscador
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(m => 
            m.name.toLowerCase().includes(lowerTerm) || 
            m.brand.toLowerCase().includes(lowerTerm)
        );
    }

    setFilteredMockups(result);
  }, [mockups, searchTerm, filterBrand]);

  // 3. DRAG & DROP
  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileToUpload(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, image: '' }));
    }
  }, []);

  const handleUrlChange = (e) => {
      setFormData({ ...formData, image: e.target.value });
      setPreviewUrl(e.target.value);
      setFileToUpload(null);
  };

  // 4. CRUD
  const openModal = (mockup = null) => {
      if (mockup) {
          setEditingId(mockup._id);
          setFormData({
              name: mockup.name,
              brand: mockup.brand,
              image: mockup.image,
              price: mockup.price,
              isActive: mockup.isActive
          });
          setPreviewUrl(mockup.image);
          setFileToUpload(null);
      } else {
          setEditingId(null);
          setFormData({ name: '', brand: '', image: '', price: 8990, isActive: true });
          setPreviewUrl('');
          setFileToUpload(null);
      }
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setEditingId(null);
      setFileToUpload(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.brand) return alert("Completa nombre y marca");
    if (!fileToUpload && !formData.image) return alert("Sube imagen o URL");

    try {
      setUploading(true);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      let finalImageUrl = formData.image;

      if (fileToUpload) {
          const uploadData = new FormData();
          uploadData.append('image', fileToUpload);
          try {
              const { data: urlResponse } = await axios.post('/api/upload', uploadData, {
                  headers: { 'Content-Type': 'multipart/form-data', ...config.headers }
              });
              finalImageUrl = urlResponse;
          } catch (uploadErr) {
              setUploading(false);
              return alert("Error subiendo imagen");
          }
      }

      const mockupData = { ...formData, image: finalImageUrl };

      if (editingId) await axios.put(`/api/mockups/${editingId}`, mockupData, config);
      else await axios.post('/api/mockups', mockupData, config);
      
      setUploading(false);
      fetchMockups();
      closeModal();
    } catch (err) {
      setUploading(false);
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
      if (window.confirm("¿Eliminar molde?")) {
          try {
            await axios.delete(`/api/mockups/${id}`, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            fetchMockups();
          } catch (err) { alert("Error eliminando"); }
      }
  };

  // Obtener lista única de marcas para el filtro
  const brands = ['Todas', ...new Set(mockups.map(m => m.brand))];

  return (
    <div className="p-4 md:p-8 w-full max-w-[1600px] mx-auto min-h-screen pb-24">
      
      {/* --- HEADER RESPONSIVO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none">
                Gestor <span className="text-transparent bg-clip-text bg-vlyck-gradient">Moldes</span>
            </h1>
            <p className="text-gray-400 text-xs md:text-sm mt-2">Crea y edita los frames para personalización.</p>
        </div>

        <button 
            onClick={() => openModal()}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-vlyck-gradient text-black font-black uppercase tracking-widest hover:scale-105 shadow-lg shadow-vlyck-lime/20 transition-all flex items-center justify-center gap-2"
        >
            <span className="material-symbols-outlined font-bold">add</span>
            Crear Molde
        </button>
      </div>

      {/* --- BARRA DE HERRAMIENTAS (Buscador + Filtros) --- */}
      <div className="flex flex-col gap-4 mb-8">
          
          {/* Buscador */}
          <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
              <input 
                type="text" 
                placeholder="Buscar por nombre o marca..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-vlyck-lime outline-none transition-all placeholder-gray-600 shadow-sm"
              />
          </div>

          {/* Filtro de Marcas (Horizontal Scroll) */}
          <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
              <div className="flex gap-2 w-max">
                  {brands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => setFilterBrand(brand)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-all border ${
                            filterBrand === brand 
                            ? 'bg-vlyck-lime text-black border-vlyck-lime shadow-[0_0_10px_rgba(167,255,45,0.3)]' 
                            : 'bg-[#111] text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                        }`}
                      >
                          {brand}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* --- GRID DE RESULTADOS RESPONSIVO --- */}
      {loading ? (
          <div className="text-center py-20 text-vlyck-lime animate-pulse font-mono">CARGANDO DATOS...</div>
      ) : filteredMockups.length === 0 ? (
          <div className="text-center py-12 md:py-20 bg-[#111] rounded-2xl border border-white/5 border-dashed">
              <span className="material-symbols-outlined text-5xl text-gray-700 mb-4">filter_list_off</span>
              <p className="text-gray-500">No hay moldes con estos filtros.</p>
              <button onClick={() => {setSearchTerm(''); setFilterBrand('Todas')}} className="mt-4 text-vlyck-lime hover:underline text-sm">Limpiar filtros</button>
          </div>
      ) : (
          // Grid: 1 col móvil, 2 col tablet, 3 col laptop, 4 col desktop grande
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredMockups.map((mockup) => (
                  <div key={mockup._id} className="group bg-[#111] rounded-2xl border border-white/10 overflow-hidden hover:border-vlyck-lime/50 transition-all shadow-lg hover:shadow-vlyck-lime/5 flex flex-col">
                      
                      {/* Imagen con acciones on-hover (o tap en móvil) */}
                      <div className="h-48 md:h-56 bg-[#080808] relative p-6 flex items-center justify-center overflow-hidden">
                          <img src={mockup.image} alt={mockup.name} className="h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl" />
                          
                          {/* Botones Flotantes */}
                          <div className="absolute top-3 right-3 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openModal(mockup)} className="w-8 h-8 rounded-lg bg-white/90 text-black flex items-center justify-center hover:bg-vlyck-lime shadow-lg">
                                  <span className="material-symbols-outlined text-sm font-bold">edit</span>
                              </button>
                              <button onClick={() => handleDelete(mockup._id)} className="w-8 h-8 rounded-lg bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 shadow-lg">
                                  <span className="material-symbols-outlined text-sm font-bold">delete</span>
                              </button>
                          </div>

                          {!mockup.isActive && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                  <span className="text-red-500 font-black uppercase tracking-widest border-2 border-red-500 px-3 py-1 rounded-lg transform -rotate-12 text-xs">Oculto</span>
                              </div>
                          )}
                      </div>

                      {/* Info Card */}
                      <div className="p-4 md:p-5 flex-grow flex flex-col justify-between bg-gradient-to-b from-[#111] to-[#0a0a0a]">
                          <div>
                              <p className="text-[10px] font-black text-vlyck-lime uppercase tracking-widest mb-1">{mockup.brand}</p>
                              <h3 className="text-white font-bold text-base md:text-lg leading-tight line-clamp-2">{mockup.name}</h3>
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                              <span className="text-gray-500 text-[10px] font-mono tracking-wider">REF: {mockup._id.slice(-4)}</span>
                              <span className="text-white font-mono font-bold text-sm md:text-base">${mockup.price.toLocaleString('es-CL')}</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* --- MODAL RESPONSIVO (FULL SCREEN EN MOVIL) --- */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#111] w-full md:max-w-3xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-3xl border border-white/10 shadow-2xl flex flex-col relative animate-slide-up">
                  
                  {/* Header Modal */}
                  <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-[#161616] shrink-0 rounded-t-3xl">
                      <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                          <span className="text-vlyck-lime material-symbols-outlined text-2xl md:text-3xl">
                              {editingId ? 'edit_square' : 'add_photo_alternate'}
                          </span>
                          {editingId ? 'Editar' : 'Crear Nuevo'}
                      </h2>
                      <button onClick={closeModal} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10">
                          <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                  </div>

                  {/* Body Scrollable */}
                  <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-grow">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Zona de Carga */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Imagen</label>
                            
                            {/* Drag & Drop con soporte Touch */}
                            <div 
                                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                className={`relative h-56 w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all bg-[#080808] overflow-hidden group ${
                                    isDragActive ? 'border-vlyck-lime bg-vlyck-lime/10' : 'border-white/10'
                                }`}
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-contain p-4" />
                                        <button 
                                            type="button"
                                            onClick={() => {setPreviewUrl(''); setFileToUpload(null); setFormData(p => ({...p, image:''}))}}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 shadow-lg"
                                        >
                                            <span className="material-symbols-outlined text-xs font-bold">close</span>
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <span className="material-symbols-outlined text-4xl text-gray-600 mb-2">cloud_upload</span>
                                        <p className="text-gray-300 text-sm font-bold">Toca o arrastra aquí</p>
                                        <p className="text-gray-600 text-[10px] mt-1 uppercase">Solo PNG Transparente</p>
                                        {/* Input file invisible pero clickeable en toda el área */}
                                        <input 
                                            type="file" 
                                            accept="image/png" 
                                            onChange={(e) => {
                                                if(e.target.files[0]) {
                                                    setFileToUpload(e.target.files[0]);
                                                    setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                                                    setFormData(p => ({...p, image: ''}));
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Fallback URL */}
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-1 block">O pega URL externa</label>
                                <input 
                                    type="text" 
                                    name="image"
                                    placeholder="https://cloudinary..." 
                                    value={formData.image} 
                                    onChange={handleUrlChange}
                                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-3 text-white text-xs font-mono focus:border-vlyck-lime outline-none"
                                />
                            </div>
                        </div>

                        {/* Campos de Texto */}
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Marca</label>
                                <select 
                                    name="brand" 
                                    value={formData.brand} 
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-vlyck-lime text-sm appearance-none"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Apple">Apple</option>
                                    <option value="Samsung">Samsung</option>
                                    <option value="Xiaomi">Xiaomi</option>
                                    <option value="Motorola">Motorola</option>
                                    <option value="Huawei">Huawei</option>
                                    <option value="Google">Google</option>
                                    <option value="Honor">Honor</option>
                                    <option value="Oppo">Oppo</option>
                                    <option value="Vivo">Vivo</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Modelo</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    placeholder="Ej: iPhone 15 Pro Max"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-vlyck-lime text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Precio</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <input 
                                            type="number" 
                                            name="price" 
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full bg-[#050505] border border-white/10 rounded-xl py-4 pl-8 pr-4 text-white outline-none focus:border-vlyck-lime font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end pt-6">
                                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                                        <span className="text-xs font-bold text-gray-400 group-hover:text-white uppercase">Visible</span>
                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.isActive ? 'bg-vlyck-lime' : 'bg-gray-700'}`}>
                                            <div className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </form>
                  </div>

                  {/* Footer Modal (Sticky Bottom en móvil) */}
                  <div className="px-6 py-5 bg-[#161616] border-t border-white/10 flex flex-col-reverse md:flex-row justify-end gap-3 shrink-0 rounded-b-none md:rounded-b-3xl">
                      <button 
                        onClick={closeModal}
                        className="w-full md:w-auto px-6 py-3 rounded-xl text-gray-400 hover:text-white font-bold transition-colors bg-white/5 md:bg-transparent"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={handleSubmit} 
                        disabled={uploading}
                        className="w-full md:w-auto px-8 py-3 rounded-xl bg-vlyck-gradient text-black font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-vlyck-lime/20"
                      >
                          {uploading ? (
                              <><span className="material-symbols-outlined animate-spin">progress_activity</span> Guardando...</>
                          ) : (
                              editingId ? 'Guardar Cambios' : 'Crear Molde'
                          )}
                      </button>
                  </div>

              </div>
          </div>
      )}

    </div>
  );
}