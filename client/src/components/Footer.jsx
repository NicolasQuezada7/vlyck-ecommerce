import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Footer() {
  return (
    <footer className="bg-background-dark text-white py-16 border-t border-white/10 mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          
          {/* Info de la Marca */}
          <div className="max-w-xs">
            <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={logo} alt="Vlyck" className="h-10 w-auto" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Diseñando el futuro de los accesorios tecnológicos. Calidad premium, estética moderna y exclusividad para tu setup.
            </p>
          </div>

          {/* Enlaces */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 w-full md:w-auto">
            <div>
              <h4 className="font-bold mb-4 text-primary uppercase tracking-wider text-sm">Tienda</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/" className="hover:text-white transition">Todo</Link></li>
                <li><Link to="/new" className="hover:text-white transition">Lanzamientos</Link></li>
                <li><Link to="/best-sellers" className="hover:text-white transition">Más vendidos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-primary uppercase tracking-wider text-sm">Soporte</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/faq" className="hover:text-white transition">Preguntas Frecuentes</Link></li>
                <li><Link to="/shipping" className="hover:text-white transition">Envíos</Link></li>
                <li><Link to="/returns" className="hover:text-white transition">Garantía</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-primary uppercase tracking-wider text-sm">Social</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition">TikTok</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© 2026 Vlyck Inc. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-white">Privacidad</Link>
            <Link to="/terms" className="hover:text-white">Términos</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}