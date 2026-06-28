export interface Character {
  id: string;
  name: string;
  emoji: string;
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

export interface Participant {
  characterId: string;
  characterName: string;
  characterEmoji: string;
  joinedAt: number;
}

export interface SessionState {
  code: string;
  status: 'waiting' | 'active' | 'ended';
  participants: Participant[];
  messages: Message[];
  startedAt: number | null;
}
