import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../useSocket';

export default function Home() {
  const navigate = useNavigate();
  const { createRoom } = useSocket();
  const [joinCode, setJoinCode] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [adminPwd, setAdminPwd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = () => {
    setLoading(true);
    setError('');
    createRoom((code: string) => {
      setLoading(false);
      navigate(`/admin/${code}`);
    });
  };

  const handleJoinRoom = () => {
    if (joinCode.trim().length < 4) {
      setError('Digite um código de sala válido.');
      return;
    }
    navigate(`/room/${joinCode.trim().toUpperCase()}`);
  };

  const handleAdminAccess = () => {
    if (adminCode.trim().length < 4) {
      setError('Digite um código de sala válido.');
      return;
    }
    if (!adminPwd.trim()) {
      setError('Digite a senha de administrador.');
      return;
    }
    navigate(`/admin/${adminCode.trim().toUpperCase()}?pwd=${encodeURIComponent(adminPwd)}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black tracking-tight">Vamos Interagir</h1>
          <p className="text-purple-200 text-lg">
            Crie ou entre em uma sala para começar.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-3 text-center text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full py-4 bg-pink-500 hover:bg-pink-400 disabled:opacity-50 font-bold text-lg rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
          >
            {loading ? 'Criando...' : 'Criar nova sala'}
          </button>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-purple-200">
              Entrar em uma sala
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-400 uppercase tracking-widest"
              />
              <button
                onClick={handleJoinRoom}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-400 font-bold rounded-xl transition-all"
              >
                Entrar
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2">
            <label className="block text-sm font-semibold text-purple-200">
              Acesso do administrador
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código"
                maxLength={6}
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-400 uppercase tracking-widest"
              />
              <input
                type="password"
                placeholder="Senha"
                value={adminPwd}
                onChange={(e) => setAdminPwd(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
                className="w-28 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <button
                onClick={handleAdminAccess}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-bold rounded-xl transition-all"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
