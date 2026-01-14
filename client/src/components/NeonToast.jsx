import { useEffect } from 'react';

export default function NeonToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // Se va a los 3 segundos
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
      <div className="bg-black/90 border border-[#a7ff2d] text-white px-8 py-4 rounded-full shadow-[0_0_20px_rgba(167,255,45,0.5)] flex items-center gap-3 backdrop-blur-md">
        <span className="material-symbols-outlined text-[#a7ff2d]">check_circle</span>
        <span className="font-bold uppercase tracking-widest text-sm">{message}</span>
      </div>
    </div>
  );
}