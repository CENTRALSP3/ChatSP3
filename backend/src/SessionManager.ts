import { Character, Message, SessionState, Participant } from './types';

const DEFAULT_CHARACTERS: Character[] = [
  { id: '1', name: 'Dino Nervoso', emoji: '🦖' },
  { id: '2', name: 'Sapo Executivo', emoji: '🐸' },
  { id: '3', name: 'Unicórnio Fiscal', emoji: '🦄' },
  { id: '4', name: 'Bicho-Preguiça Turbo', emoji: '🦥' },
  { id: '5', name: 'Galinha Ninja', emoji: '🐔' },
  { id: '6', name: 'Cérebro Saltitante', emoji: '🧠' },
  { id: '7', name: 'Pizza Quântica', emoji: '🍕' },
  { id: '8', name: 'ET Organizado', emoji: '🛸' },
  { id: '9', name: 'Panda Fitness', emoji: '🐼' },
  { id: '10', name: 'Pinguim DJ', emoji: '🐧' },
  { id: '11', name: 'Caranguejo CEO', emoji: '🦀' },
  { id: '12', name: 'Polvo Hacker', emoji: '🐙' },
  { id: '13', name: 'Flamingo Rockeiro', emoji: '🦩' },
  { id: '14', name: 'Guaxinim Premium', emoji: '🦝' },
  { id: '15', name: 'Tubarão Vegano', emoji: '🦈' },
  { id: '16', name: 'Esquilo Astronauta', emoji: '🐿️' },
  { id: '17', name: 'Melancia Rebelde', emoji: '🍉' },
  { id: '18', name: 'Abacate Cósmico', emoji: '🥑' },
  { id: '19', name: 'Dinossauro Carismático', emoji: '🦕' },
  { id: '20', name: 'Dragão Estagiário', emoji: '🐲' },
];

interface Session {
  state: SessionState;
  allCharacters: Character[];
  // map socketId -> participant info (for mapping disconnects)
  sockets: Map<string, string>; // socketId -> characterId
}

let msgCounter = 0;

export class SessionManager {
  private sessions: Map<string, Session> = new Map();

  createSession(): string {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const sessionState: SessionState = {
      code,
      status: 'waiting',
      participants: [],
      messages: [],
      startedAt: null,
    };
    this.sessions.set(code, { state: sessionState, allCharacters: [...DEFAULT_CHARACTERS], sockets: new Map() });
    return code;
  }

  get(code: string): SessionState | undefined {
    return this.sessions.get(code)?.state;
  }

  getPublicState(code: string): SessionState {
    const s = this.sessions.get(code);
    if (!s) throw new Error('Session not found');
    return { ...s.state, messages: [...s.state.messages], participants: [...s.state.participants] };
  }

  getAvailableCharacters(code: string): Character[] {
    return this.sessions.get(code)?.allCharacters ?? [];
  }

  addParticipant(code: string, characterId: string, socketId?: string) {
    const s = this.sessions.get(code);
    if (!s) return { success: false, reason: 'Sessão não encontrada' } as const;
    if (s.state.status !== 'waiting' && s.state.status !== 'active')
      return { success: false, reason: 'Sessão encerrada' } as const;

    const char = s.allCharacters.find(c => c.id === characterId);
    if (!char) return { success: false, reason: 'Personagem inválido' } as const;

    if (s.state.participants.some(p => p.characterId === characterId))
      return { success: false, reason: 'Personagem já escolhido' } as const;

    if (socketId) {
      s.sockets.set(socketId, characterId);
    }

    const participant: Participant = {
      characterId,
      characterName: char.name,
      characterEmoji: char.emoji,
      joinedAt: Date.now(),
    };
    s.state.participants.push(participant);
    s.allCharacters = s.allCharacters.filter(c => c.id !== characterId);

    return { success: true, participant } as const;
  }

  getParticipant(code: string, socketId: string): Participant | null {
    const s = this.sessions.get(code);
    if (!s) return null;
    const charId = s.sockets.get(socketId);
    if (!charId) return null;
    return s.state.participants.find(p => p.characterId === charId) ?? null;
  }

  getParticipantBySocket(code: string, socketId: string): Participant | null {
    return this.getParticipant(code, socketId);
  }

  removeParticipant(code: string, characterId: string): boolean {
    const s = this.sessions.get(code);
    if (!s) return false;
    const idx = s.state.participants.findIndex(p => p.characterId === characterId);
    if (idx === -1) return false;
    s.state.participants.splice(idx, 1);
    // Return character to pool
    const char = DEFAULT_CHARACTERS.find(c => c.id === characterId);
    if (char) s.allCharacters.push(char);
    return true;
  }

  addMessage(code: string, text: string, emoji: string | undefined, participant: Participant): Message | null {
    const s = this.sessions.get(code);
    if (!s) return null;

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const msg: Message = {
      id: `msg_${++msgCounter}_${Date.now()}`,
      text,
      emoji,
      characterId: participant.characterId,
      characterName: participant.characterName,
      characterEmoji: participant.characterEmoji,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 20 - 10,
      xOffset: Math.random() * 100 - 50,
      timestamp: Date.now(),
    };
    s.state.messages.push(msg);
    return msg;
  }

  checkCombo(code: string, emoji?: string): { emoji: string; count: number } | null {
    if (!emoji) return null;
    // Simple combo: count consecutive same-emoji messages
    const s = this.sessions.get(code);
    if (!s) return null;
    const msgs = s.state.messages;
    if (msgs.length < 3) return null;
    const last = msgs.slice(-3);
    if (last.every(m => m.emoji === emoji)) {
      return { emoji, count: 3 };
    }
    return null;
  }

  clear(code: string): void {
    const s = this.sessions.get(code);
    if (s) s.state.messages = [];
  }

  setStatus(code: string, status: SessionState['status']): void {
    const s = this.sessions.get(code);
    if (s) {
      s.state.status = status;
      if (status === 'active' && !s.state.startedAt) {
        s.state.startedAt = Date.now();
      }
    }
  }

  resetCharacters(code: string): void {
    const s = this.sessions.get(code);
    if (s) {
      s.state.participants = [];
      s.allCharacters = [...DEFAULT_CHARACTERS];
      s.sockets.clear();
    }
  }
}
