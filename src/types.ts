export interface DiceNotation {
  numDice: number;
  sides: number;
  modifier: number;
}

export interface DiceRollResult {
  notation: string;
  rolls: number[];
  modifier: number;
  sum: number;
  total: number;
  output?: string;
  modifiers?: string;
}

export type MessageType = 'text' | 'command' | 'result' | 'error';

export interface Message {
  type: MessageType;
  content: string;
  userId?: string;
}

export interface User {
  id: string;
  name: string;
  emoji: string;
}

export interface Room {
  id: string;
  users: User[];
  isTyping: Record<string, boolean>;
}

export type RoomMessageType =
  | 'user-join'
  | 'user-leave'
  | 'roll'
  | 'typing'
  | 'sync-users'
  | 'host-disconnected';

export interface PeerMessage {
  type: RoomMessageType;
  userId: string;
  timestamp: number;
  data: unknown;
}

export interface RollMessage {
  type: 'roll';
  userId: string;
  timestamp: number;
  data: {
    command: string;
    result?: string;
    error?: string;
  };
}

export interface TypingMessage {
  type: 'typing';
  userId: string;
  timestamp: number;
  data: {
    isTyping: boolean;
  };
}

export interface UserJoinMessage {
  type: 'user-join';
  userId: string;
  timestamp: number;
  data: {
    user: User;
  };
}

export interface UserLeaveMessage {
  type: 'user-leave';
  userId: string;
  timestamp: number;
  data: {
    userId: string;
  };
}

export interface SyncUsersMessage {
  type: 'sync-users';
  userId: string;
  timestamp: number;
  data: {
    users: User[];
  };
}

export interface HostDisconnectedMessage {
  type: 'host-disconnected';
  userId: string;
  timestamp: number;
  data: Record<string, never>;
}
