import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../useSocket';

export default function Admin() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    connected, session, characters, comboEvent,
    adminLogin, clearScreen, startSession, endSession,
    resetCharacters, newRound,
  } = useSocket();

  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [roomInfo, setRoomInfo] = useState<{ code: string } | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  // Auto-login if code and pwd in URL
  useEffect(() => {
    if (!code || !connected || authenticated) return;
    const pwd = searchParams.get('pwd');
    if (pwd) {
      adminLogin(code, pwd, (ok: boolean) => {
        if (ok) {
          setAuthenticated(true);
          setRoomInfo({ code });
        } else {
          setLoginError('Senha incorreta ou sala não encontrada.');
        }
      });
    }
  }, [code, connected, authenticated, searchParams, adminLogin]);

  const handleLogin = (pwd: string) => {
    if (!code) return;
    setLoginError('');
    adminLogin(code, pwd, (ok: boolean) => {
      if (ok) {
        setAuthenticated(true);
        setRoomInfo({ code });
      } else {
        setLoginError('Senha incorreta ou sala não encontrada.');
      }
    });
  };

  if (!code) {
    return <div className="p-4 text-white">Código inválido.</div>;
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center text-white space-y-4">
          <p className="text-2xl font-bold">Admin — Sala {code}</p>
          <p className="text-yellow-300">Conectando ao servidor...</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-400 rounded-xl transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-purple-300 hover:text-white mb-2 block"
            >
              &larr; Voltar
            </button>
            <h1 className="text-3xl font-black">Admin</h1>
            <p className="text-purple-200">Sala {code}</p>
          </div>

          {loginError && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-3 text-center text-sm">
              {loginError}
            </div>
          )}

          <AdminLoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  const participantCount = session?.participants.length || 0;
  const statusColors: Record<string, string> = {
    waiting: 'text-yellow-300',
    active: 'text-green-300',
    ended: 'text-red-300',
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/20">
        <div>
          <h1 className="text-lg font-bold">Admin — Sala {code}</h1>
          <p className="text-xs text-purple-300">
            <span className={statusColors[session?.status || 'waiting']}>
              {session?.status === 'waiting' ? 'Aguardando' : session?.status === 'active' ? 'Ativa' : 'Encerrada'}
            </span>
            {' | '}
            {participantCount} participante(s)
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-sm rounded-xl transition-all"
        >
          Sair
        </button>
      </div>

      {/* Combo notification */}
      {comboEvent && (
        <div className="bg-yellow-400 text-purple-900 font-bold text-center py-2 text-lg animate-bounce">
          Combo x{comboEvent.count} {comboEvent.emoji}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Participants panel */}
        <div className="lg:w-64 bg-black/10 p-4 overflow-y-auto">
          <h2 className="font-bold text-sm mb-3 text-purple-200">Participantes</h2>
          {participantCount === 0 ? (
            <p className="text-purple-300 text-xs">Nenhum participante ainda.</p>
          ) : (
            <div className="space-y-2">
              {(session?.participants || []).map((p) => (
                <div key={p.characterId} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                  <span className="text-xl">{p.characterEmoji}</span>
                  <span className="text-sm truncate">{p.characterName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h2 className="font-bold text-sm text-purple-200 mb-2">Mensagens</h2>
          {(session?.messages || []).length === 0 ? (
            <p className="text-purple-300 text-xs">Nenhuma mensagem ainda.</p>
          ) : (
            (session?.messages || []).map((msg) => (
              <div key={msg.id} className="flex items-start gap-2">
                <span className="text-lg">{msg.characterEmoji}</span>
                <div
                  className="rounded-xl px-3 py-1.5 max-w-[80%] text-sm"
                  style={{ backgroundColor: msg.color || '#6d28d9' }}
                >
                  <span className="font-bold text-xs opacity-80">{msg.characterName}: </span>
                  {msg.text}
                  {msg.emoji && <span className="ml-1">{msg.emoji}</span>}
                </div>
              </div>
            ))
          )}
          <div ref={msgEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/30 p-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <ControlButton onClick={startSession} disabled={session?.status === 'active'} color="green">
            Iniciar sessão
          </ControlButton>
          <ControlButton onClick={endSession} disabled={session?.status !== 'active'} color="red">
            Encerrar
          </ControlButton>
          <ControlButton onClick={clearScreen} color="yellow">
            Limpar tela
          </ControlButton>
          <ControlButton onClick={resetCharacters} color="purple">
            Resetar personagens
          </ControlButton>
          <ControlButton onClick={newRound} color="blue">
            Nova rodada
          </ControlButton>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  onClick,
  disabled,
  color,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  color: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-600 hover:bg-green-500',
    red: 'bg-red-600 hover:bg-red-500',
    yellow: 'bg-yellow-500 hover:bg-yellow-400 text-purple-900',
    purple: 'bg-purple-600 hover:bg-purple-500',
    blue: 'bg-blue-600 hover:bg-blue-500',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
        colorMap[color] || 'bg-purple-600 hover:bg-purple-500'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function AdminLoginForm({ onLogin }: { onLogin: (pwd: string) => void }) {
  const [pwd, setPwd] = useState('');

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-purple-200">
        Digite a senha de administrador:
      </label>
      <input
        type="password"
        placeholder="Senha"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onLogin(pwd)}
        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
        autoFocus
      />
      <button
        onClick={() => onLogin(pwd)}
        disabled={!pwd.trim()}
        className="w-full py-3 bg-pink-500 hover:bg-pink-400 disabled:opacity-50 font-bold rounded-xl transition-all"
      >
        Entrar como admin
      </button>
      <p className="text-xs text-purple-300 text-center">
        A senha padrão é <strong>admin</strong> (configurável no servidor).
      </p>
    </div>
  );
}
