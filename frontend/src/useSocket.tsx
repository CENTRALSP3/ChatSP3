import { createContext, useContext, ReactNode, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SessionState, Character, Message } from './types';

interface SocketCtx {
  socket: Socket | null;
  connected: boolean;
  session: SessionState | null;
  characters: Character[];
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

  useEffect(() => {
    const sock = io(import.meta.env.VITE_BACKEND_URL || 'https://backend-5xftxzs46-price3.vercel.app');
    s.current = sock;

    sock.on('connect', () => setConnected(true));
    sock.on('disconnect', () => setConnected(false));
    sock.on('sessionState', (st: SessionState) => setSession(st));
    sock.on('characterList', (chars: Character[]) => setCharacters(chars));

    return () => { sock.disconnect(); };
  }, []);

  const call = (ev: string, ...args: any[]) => s.current?.emit(ev, ...args);

  const createRoom = (cb: (code: string) => void) => call('createRoom', cb);
  const adminLogin = (code: string, pwd: string, cb: (ok: boolean) => void) => call('adminLogin', code, pwd, cb);
  const joinRoom = (code: string, charId: string, cb: (ok: boolean, r?: string) => void) => call('joinRoom', code, charId, cb);
  const sendMessage = (text: string, emoji?: string) => call('sendMessage', text, emoji);
  const clearScreen = () => call('clearScreen');
  const startSession = () => call('startSession');
  const endSession = () => call('endSession');
  const resetCharacters = () => call('resetCharacters');
  const newRound = () => call('newRound');

  return (
    <Ctx.Provider value={{
      socket: s.current,
      connected,
      session,
      characters,
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
