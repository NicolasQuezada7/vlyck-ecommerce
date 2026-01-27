import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    // CAMBIO: Aumenté pt-20 a pt-36 (móvil) y pt-44 (PC) para que baje el contenido
    <div className="min-h-screen bg-[#050505] text-white font-sans pt-36 md:pt-44 pb-20">
      
      {/* --- HERO SECTION --- */}
      <div className="max-w-4xl mx-auto px-6 text-center mb-20">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6 animate-fade-in-up">
          Más que una carcasa, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-vlyck-lime to-emerald-400">
            es tu identidad.
          </span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto animate-fade-in-up delay-100">
          En <strong>Vlyck</strong> fusionamos ingeniería y diseño para crear protecciones únicas. 
          Nacimos en Coihueco con una misión clara: que tu dispositivo destaque tanto como tú.
        </p>
      </div>

      {/* --- BENTO GRID (CARACTERÍSTICAS) --- */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        
        {/* Card 1: Personalización */}
        <div className="md:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-vlyck-lime/50 transition-all duration-300">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-vlyck-lime rounded-xl flex items-center justify-center mb-6 text-black">
              <span className="material-symbols-outlined text-2xl">brush</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Personalización Total</h3>
            <p className="text-gray-400 max-w-md">
              No vendemos productos en masa. Cada diseño se ajusta, se imprime y se sublima con precisión milimétrica. ¿Tienes una idea? Nosotros la hacemos realidad.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity transform translate-x-10 translate-y-10">
            <span className="material-symbols-outlined text-9xl">palette</span>
          </div>
        </div>

        {/* Card 2: Tecnología */}
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-vlyck-cyan/50 transition-all duration-300">
          <div className="w-12 h-12 bg-vlyck-cyan rounded-xl flex items-center justify-center mb-6 text-black">
            <span className="material-symbols-outlined text-2xl">memory</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">Tech-Driven</h3>
          <p className="text-gray-400">
            Gestionamos nuestros procesos con software propio para asegurar velocidad y cero errores en tu pedido.
          </p>
        </div>

        {/* Card 3: Local */}
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-orange-500/50 transition-all duration-300">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-black">
            <span className="material-symbols-outlined text-2xl">location_on</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">Desde Ñuble</h3>
          <p className="text-gray-400">
            Operamos desde Coihueco y Chillán, conectando el talento local con envíos a todo Chile.
          </p>
        </div>

        {/* Card 4: Calidad (Larga) */}
        <div className="md:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
           <div className="flex-1 relative z-10">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-black">
                <span className="material-symbols-outlined text-2xl">shield</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Durabilidad Garantizada</h3>
              <p className="text-gray-400">
                Usamos materiales de alta resistencia y tintas que no se borran con el uso diario. Tu inversión está protegida.
              </p>
           </div>
           <div className="w-full md:w-1/3 aspect-square bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl border border-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-white/20">verified</span>
           </div>
        </div>

      </div>

      {/* --- CTA FINAL --- */}
      <div className="text-center px-6">
        <h2 className="text-3xl font-bold mb-6">¿Listo para renovar tu estilo?</h2>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/all" className="px-8 py-4 bg-vlyck-lime text-black font-black uppercase rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(167,255,45,0.4)]">
              Ver Catálogo
            </Link>
            {/* Si tienes página de contacto, usa /contact, si no, redirige a Instagram o WhatsApp */}
            <a href="https://wa.me/56971311775" target="_blank" rel="noreferrer" className="px-8 py-4 border border-white/20 text-white font-bold uppercase rounded-xl hover:bg-white/10 transition-colors">
              Hablar con Nosotros
            </a>
        </div>
      </div>

    </div>
  );
}