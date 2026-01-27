import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Edición
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', isAdmin: false });
  const [processing, setProcessing] = useState(false); // Para deshabilitar botones mientras carga

  // Estado para Notificaciones (Toasts)
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const { userInfo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      fetchUsers();
    } else {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  // --- HELPER NOTIFICACIONES ---
  const showToastMsg = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchUsers = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get(`/api/users`, config);
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const deleteHandler = async (id) => {
    if (window.confirm('¿Estás seguro? Esta acción es irreversible.')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`/api/users/${id}`, config);
        showToastMsg('Usuario eliminado correctamente');
        fetchUsers();
      } catch (error) { 
        showToastMsg('Error al eliminar usuario', 'error');
      }
    }
  };

  // --- LÓGICA EDICIÓN ---
  const handleEditClick = (user) => {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email, isAdmin: user.isAdmin });
      setShowModal(true);
  };

  const handleUpdate = async (e) => {
      e.preventDefault();
      setProcessing(true);
      try {
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          await axios.put(`/api/users/${editingUser._id}`, formData, config);
          
          showToastMsg('Usuario actualizado con éxito');
          setShowModal(false);
          setEditingUser(null);
          fetchUsers(); 
      } catch (error) {
          showToastMsg(error.response?.data?.message || 'Error al actualizar', 'error');
      }
      setProcessing(false);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-vlyck-lime pt-20 text-center animate-pulse">Cargando usuarios...</div>;

  return (
    <div className="pt-4 pb-20 px-4 max-w-[1440px] mx-auto font-sans relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Gestión de Clientes</h2>
          <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-widest">
            {filteredUsers.length} Usuarios Registrados
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">search</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-vlyck-lime outline-none transition-colors" 
          />
        </div>
      </div>

      {/* --- LISTA --- */}
      <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        
        {/* VISTA MÓVIL (Cards) */}
        <div className="md:hidden divide-y divide-white/5">
            {filteredUsers.map(user => (
                <div key={user._id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${user.isAdmin ? 'bg-vlyck-lime text-black shadow-vlyck-lime/20' : 'bg-white/10 text-white'}`}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <h4 className="text-white font-bold text-sm truncate">{user.name}</h4>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1 pl-13">
                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${user.isAdmin ? 'border-vlyck-lime/30 text-vlyck-lime bg-vlyck-lime/10' : 'border-white/10 text-gray-500 bg-white/5'}`}>
                            {user.isAdmin ? 'Administrador' : 'Cliente'}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => handleEditClick(user)} className="p-2 bg-white/5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"><span className="material-symbols-outlined text-sm">edit</span></button>
                            {!user.isAdmin && (
                                <button onClick={() => deleteHandler(user._id)} className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500 hover:text-white"><span className="material-symbols-outlined text-sm">delete</span></button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* VISTA DESKTOP (Tabla) */}
        <table className="hidden md:table w-full text-left border-collapse">
            <thead className="bg-white/5 text-gray-500 text-[10px] uppercase tracking-widest font-semibold border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.isAdmin ? 'bg-vlyck-lime text-black' : 'bg-white/10 text-white'}`}>
                              {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-white">{user.name}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.isAdmin ? (
                        <span className="px-2 py-1 rounded bg-vlyck-lime/10 text-vlyck-lime text-[10px] font-black uppercase border border-vlyck-lime/20 shadow-[0_0_10px_rgba(167,255,45,0.1)]">Admin</span>
                    ) : (
                        <span className="px-2 py-1 rounded bg-white/5 text-gray-500 text-[10px] font-bold uppercase border border-white/10">Cliente</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(user)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all" title="Editar"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                    {!user.isAdmin && (
                        <button onClick={() => deleteHandler(user._id)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all" title="Eliminar"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-20 text-gray-500 bg-[#111] mt-4 rounded-2xl border border-white/10 border-dashed">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-30">person_off</span>
            <p>No se encontraron usuarios.</p>
        </div>
      )}

      {/* --- MODAL EDICIÓN --- */}
      {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#111] border border-white/20 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative">
                  <div className="flex justify-between items-start mb-6">
                      <h3 className="text-xl font-bold text-white">Editar Usuario</h3>
                      <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  
                  <form onSubmit={handleUpdate} className="space-y-5">
                      <div>
                          <label className="text-xs text-gray-500 font-bold uppercase block mb-1.5 ml-1">Nombre Completo</label>
                          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white focus:border-vlyck-lime outline-none transition-colors" />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 font-bold uppercase block mb-1.5 ml-1">Email</label>
                          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-white focus:border-vlyck-lime outline-none transition-colors" />
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                          <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                id="isAdmin"
                                checked={formData.isAdmin} 
                                onChange={e => setFormData({...formData, isAdmin: e.target.checked})} 
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/20 bg-black checked:border-vlyck-lime checked:bg-vlyck-lime transition-all"
                            />
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100 pointer-events-none material-symbols-outlined text-sm font-bold">check</span>
                          </div>
                          <label htmlFor="isAdmin" className="text-sm font-bold text-white cursor-pointer select-none flex-1">
                              Otorgar Rol de Administrador
                              <p className="text-[10px] text-gray-500 font-normal mt-0.5">Acceso total al panel de control y finanzas.</p>
                          </label>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                          <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
                          <button type="submit" disabled={processing} className="px-6 py-2.5 bg-vlyck-lime text-black font-black rounded-xl text-sm hover:scale-105 transition-transform shadow-lg shadow-vlyck-lime/20 disabled:opacity-50 disabled:scale-100">
                              {processing ? 'Guardando...' : 'Guardar Cambios'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* --- NOTIFICACIÓN TOAST --- */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
            <div className={`px-6 py-3 rounded-full border flex items-center gap-3 backdrop-blur-md shadow-2xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-vlyck-lime/10 border-vlyck-lime text-vlyck-lime'}`}>
                <span className="material-symbols-outlined">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                <span className="font-bold text-sm uppercase">{toast.msg}</span>
            </div>
        </div>
      )}

    </div>
  );
}