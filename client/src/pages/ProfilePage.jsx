import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
    const { userInfo } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!userInfo) navigate('/login');
    }, [navigate, userInfo]);

    return (
        <div className="min-h-screen pt-24 px-4 bg-[#050505] text-white flex justify-center">
            <div className="max-w-2xl w-full bg-[#111] border border-white/10 rounded-3xl p-8">
                <h1 className="text-3xl font-black uppercase tracking-widest mb-6">Mi Perfil</h1>
                <div className="space-y-4">
                    <div>
                        <label className="text-gray-500 text-xs uppercase tracking-widest">Nombre</label>
                        <p className="text-xl font-bold">{userInfo?.name}</p>
                    </div>
                    <div>
                        <label className="text-gray-500 text-xs uppercase tracking-widest">Email</label>
                        <p className="text-xl font-bold">{userInfo?.email}</p>
                    </div>
                    {userInfo?.isAdmin && (
                        <div className="mt-8 p-4 bg-vlyck-lime/10 border border-vlyck-lime rounded-xl">
                            <p className="text-vlyck-lime font-bold mb-2">Eres Administrador</p>
                            <button onClick={() => navigate('/admin/dashboard')} className="bg-vlyck-lime text-black px-4 py-2 rounded-lg font-bold text-sm uppercase">Ir al Panel</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}