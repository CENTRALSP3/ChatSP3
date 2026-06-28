import { createContext, useContext, ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SessionState, Character, Message } from './types';

interface SocketCtx {
  socket: Socket | null;
  connected: boolean;
  session: SessionState | null;
  characters: Character[];
  comboEvent: { emoji: string; count: number } | null;
  createRoom: (cb: (code: string) => void) => void;
  adminLogin: (code: string, pwd: string, cb: (ok: boolean) => void) => void;
  joinRoom: (code: string, charId: string, cb: (ok: boolean, r?: string) => void) => void;
  sendMessage: (text: string, emoji?: string) => void;
  clearScreen: () => void;
  startSession: () => void;
  endSession: () => void;
  resetCharacters: () => void;
  newRound: () => void;
}

const Ctx = createContext<SocketCtx | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const s = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [comboEvent, setComboEvent] = useState<{ emoji: string; count: number } | null>(null);

  useEffect(() => {
    const sock = io(import.meta.env.VITE_BACKEND_URL || 'https://backend-5xftxzs46-price3.vercel.app');
    s.current = sock;

    sock.on('connect', () => setConnected(true));
    sock.on('disconnect', () => setConnected(false));
    sock.on('sessionState', (st: SessionState) => setSession(st));
    sock.on('characterList', (chars: Character[]) => setCharacters(chars));
    sock.on('message', (msg: Message) => {
      setSession(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
    });
    sock.on('comboEvent', (ev: { emoji: string; count: number }) => {
      setComboEvent(ev);
      setTimeout(() => setComboEvent(null), 3000);
    });
    sock.on('sessionCleared', () => {
      setSession(prev => prev ? { ...prev, messages: [] } : prev);
    });
    sock.on('sessionStatus', ({ status }: { status: string }) => {
      setSession(prev => prev ? { ...prev, status: status as SessionState['status'] } : prev);
    });
    sock.on('charactersReset', (chars: Character[]) => {
      setCharacters(chars);
      setSession(prev => prev ? { ...prev, participants: [] } : prev);
    });
    sock.on('participantJoined', (p: { characterId: string; characterName: string; characterEmoji: string }) => {
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: [...prev.participants, { ...p, joinedAt: Date.now() }],
        };
      });
    });
    sock.on('participantLeft', ({ characterId }: { characterId: string }) => {
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.filter(p => p.characterId !== characterId),
        };
      });
    });

    return () => { sock.disconnect(); };
  }, []);

  const call = useCallback((ev: string, ...args: any[]) => s.current?.emit(ev, ...args), []);

  const createRoom = useCallback((cb: (code: string) => void) => call('createRoom', cb), [call]);
  const adminLogin = useCallback((code: string, pwd: string, cb: (ok: boolean) => void) => call('adminLogin', code, pwd, cb), [call]);
  const joinRoom = useCallback((code: string, charId: string, cb: (ok: boolean, r?: string) => void) => call('joinRoom', code, charId, cb), [call]);
  const sendMessage = useCallback((text: string, emoji?: string) => call('sendMessage', text, emoji), [call]);
  const clearScreen = useCallback(() => call('clearScreen'), [call]);
  const startSession = useCallback(() => call('startSession'), [call]);
  const endSession = useCallback(() => call('endSession'), [call]);
  const resetCharacters = useCallback(() => call('resetCharacters'), [call]);
  const newRound = useCallback(() => call('newRound'), [call]);

  return (
    <Ctx.Provider value={{
      socket: s.current,
      connected,
      session,
      characters,
      comboEvent,
      createRoom,
      adminLogin,
      joinRoom,
      sendMessage,
      clearScreen,
      startSession,
      endSession,
      resetCharacters,
      newRound,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSocket = () => useContext(Ctx)!;
