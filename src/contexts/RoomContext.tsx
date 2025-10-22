import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { User, Room, Message, PeerMessage } from '@/types';
import { useRoomStore } from '@/stores/useRoomStore';
import { usePeerStore } from '@/stores/usePeerStore';

interface SessionContextType {
  currentUser: User | null;
  session: Room | null;
  messages: Message[];
  isPeerReady: boolean;
  isConnected: boolean;
  connectionError: string | null;
  setCurrentUser: (user: User | null) => void;
  createSession: (user: User) => Promise<void>;
  joinSession: (user: User, sessionId: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  sendMessage: (message: Omit<PeerMessage, 'userId' | 'timestamp'>) => void;
  receiveMessages: (...lines: Message[]) => void;
  clearMessages: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const currentUser = useRoomStore((state) => state.currentUser);
  const session = useRoomStore((state) => state.session);
  const messages = useRoomStore((state) => state.messages);
  const isPeerReady = usePeerStore((state) => state.isPeerReady);
  const isConnected = usePeerStore((state) => state.isConnected);
  const connectionError = usePeerStore((state) => state.connectionError);

  const setCurrentUser = useRoomStore((state) => state.setCurrentUser);
  const createSession = useRoomStore((state) => state.createSession);
  const joinSession = useRoomStore((state) => state.joinSession);
  const setTyping = useRoomStore((state) => state.setTyping);
  const sendMessage = useRoomStore((state) => state.sendMessage);
  const receiveMessages = useRoomStore((state) => state.receiveMessages);
  const clearMessages = useRoomStore((state) => state.clearMessages);

  useEffect(() => {
    return () => {
      const peerStore = usePeerStore.getState();
      peerStore.destroy();
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        currentUser,
        session,
        isPeerReady,
        isConnected,
        connectionError,
        messages,
        setCurrentUser,
        createSession,
        joinSession,
        setTyping,
        sendMessage,
        receiveMessages,
        clearMessages,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
