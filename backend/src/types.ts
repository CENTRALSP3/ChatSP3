// Types shared between frontend and backend

export interface Character {
  emoji: string;
  name: string;
  id: string;
}

export interface Message {
  id: string;
  text: string;
  emoji?: string;
  characterId: string;
  characterName: string;
  characterEmoji: string;
  color: string;
  rotation: number;
  xOffset: number;
  timestamp: number;
}

export interface SessionState {
  code: string;
  status: 'waiting' | 'active' | 'ended';
  participants: Participant[];
  messages: Message[];
  startedAt: number | null;
}

export interface Participant {
  characterId: string;
  characterName: string;
  characterEmoji: string;
  joinedAt: number;
}

export interface ServerToClientEvents {
  sessionState: (state: SessionState) => void;
  message: (msg: Message) => void;
  participantJoined: (p: Participant) => void;
  participantLeft: (characterId: string) => void;
  characterList: (chars: Character[]) => void;
  sessionCleared: () => void;
  sessionStatus: (status: SessionState['status']) => void;
  charactersReset: () => void;
  comboEvent: (emoji: string, count: number) => void;
}

export interface ClientToServerEvents {
  createRoom: (callback: (code: string) => void) => void;
  joinRoom: (code: string, characterId: string, callback: (ok: boolean, reason?: string) => void) => void;
  adminLogin: (code: string, password: string, callback: (ok: boolean) => void) => void;
  sendMessage: (text: string, emoji?: string) => void;
  clearScreen: () => void;
  startSession: () => void;
  endSession: () => void;
  resetCharacters: () => void;
  newRound: () => void;
  kickParticipant: (characterId: string) => void;
}
