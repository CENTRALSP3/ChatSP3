import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../useSocket';
import type { Character } from '../types';

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { connected, session, characters, comboEvent, joinRoom, sendMessage } = useSocket();
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleJoin = () => {
    if (!selectedChar || !code) return;
    joinRoom(code, selectedChar.id, (ok: boolean, reason?: string) => {
      if (ok) {
        setJoined(true);
        setError('');
      } else {
        setError(reason || 'Não foi possível entrar na sala.');
      }
    });
  };

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(message.trim());
    setMessage('');
  };

  if (!code) {
    return <div className="p-4 text-white">Código inválido.</div>;
  }

  if (!session && connected) {
    // Auto-join: we need to get session by reconnecting; for now show character picker
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center text-white space-y-4">
          <p className="text-2xl font-bold">Sala {code}</p>
          <p className="text-purple-200">Conectado. Aguardando informações da sala...</p>
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

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center text-white space-y-4">
          <p className="text-2xl font-bold">Sala {code}</p>
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

  // Character selection (not yet joined)
  if (!joined) {
    const availableChars = characters.filter(
      c => !session?.participants.some(p => p.characterId === c.id)
    );

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-purple-300 hover:text-white mb-2 block"
            >
              &larr; Voltar
            </button>
            <h1 className="text-3xl font-black">Sala {code}</h1>
            <p className="text-purple-200 text-sm">
              {session?.participants.length || 0} participante(s) na sala
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-3 text-center text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-purple-200">
              Escolha seu personagem:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {availableChars.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChar(c)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedChar?.id === c.id
                      ? 'bg-pink-500 scale-105 ring-2 ring-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <span className="text-2xl block">{c.emoji}</span>
                  <span className="text-xs mt-1 block leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleJoin}
            disabled={!selectedChar}
            className="w-full py-4 bg-pink-500 hover:bg-pink-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg rounded-2xl transition-all"
          >
            Entrar na sala
          </button>
        </div>
      </div>
    );
  }

  // Joined — chat interface
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/20">
        <div>
          <h1 className="text-lg font-bold">Sala {code}</h1>
          <p className="text-xs text-purple-300">
            {session?.participants.length || 0} participante(s)
            {session?.status === 'active' && (
              <span className="ml-2 text-green-300">| Sessão ativa</span>
            )}
            {session?.status === 'ended' && (
              <span className="ml-2 text-yellow-300">| Encerrada</span>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-sm rounded-xl transition-all"
        >
          Sair
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {session?.messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-purple-300 text-center">
            <p>Nenhuma mensagem ainda.<br />Seja o primeiro a escrever!</p>
          </div>
        )}
        {(session?.messages || []).map((msg) => (
          <div
            key={msg.id}
            className="flex items-start gap-3"
            style={{ transform: `rotate(${msg.rotation || 0}deg)`, marginLeft: `${msg.xOffset || 0}px` }}
          >
            <span className="text-2xl flex-shrink-0">{msg.characterEmoji}</span>
            <div
              className="rounded-2xl px-4 py-2 max-w-[80%] shadow-md"
              style={{ backgroundColor: msg.color || '#6d28d9' }}
            >
              <div className="text-xs font-bold opacity-80 mb-0.5">{msg.characterName}</div>
              <div className="text-sm break-words">
                {msg.text}
                {msg.emoji && <span className="ml-1">{msg.emoji}</span>}
              </div>
            </div>
          </div>
        ))}
        <div ref={msgEndRef} />
      </div>

      {/* Combo notification */}
      {comboEvent && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-400 text-purple-900 font-bold px-6 py-2 rounded-full text-lg animate-bounce z-10 shadow-lg">
          Combo x{comboEvent.count} {comboEvent.emoji}
        </div>
      )}

      {/* Input */}
      {session?.status !== 'ended' && (
        <div className="p-4 bg-black/20">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              maxLength={280}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="px-6 py-3 bg-pink-500 hover:bg-pink-400 disabled:opacity-50 font-bold rounded-xl transition-all"
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      {/* Ended overlay */}
      {session?.status === 'ended' && (
        <div className="p-4 bg-black/30 text-center">
          <p className="text-yellow-300 font-bold">Sessão encerrada pelo administrador.</p>
        </div>
      )}
    </div>
  );
}
