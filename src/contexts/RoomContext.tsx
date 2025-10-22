import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, Room, Message, PeerMessage } from '@/types';
import { usePeerConnection } from '@/hooks/usePeerConnection';

interface SessionContextType {
  currentUser: User | null;
  session: Room | null;
  messages: Message[];
  isPeerReady: boolean;
  isConnected: boolean;
  connectionError: string | null;
  setCurrentUser: (user: User) => void;
  createSession: (user: User) => Promise<void>;
  joinSession: (user: User, sessionId: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  sendMessage: (message: Omit<PeerMessage, 'userId' | 'timestamp'>) => void;
  receiveMessages: (...lines: Message[]) => void;
  clearMessages: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const receiveMessages = (...message: Message[]) => {
    setMessages(prev => [...prev, ...message])
  }

  const clearMessages = () => {
    setMessages([])
  }

  const handleUserJoin = useCallback((user: User) => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.users.some(u => u.id === user.id)) return prev;

      return {
        ...prev,
        users: [...prev.users, user],
      };
    });
  }, []);

  const handleUserLeave = useCallback((userId: string) => {
    setSession((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        users: prev.users.filter(u => u.id !== userId),
        isTyping: {
          ...prev.isTyping,
          [userId]: false,
        },
      };
    });
  }, []);

  const handleMessage = useCallback((message: PeerMessage) => {
    const handlers: Record<string, () => void> = {
      roll: () => {
        const data = message.data as { command: string; result?: string; error?: string };

          receiveMessages({ type: 'command', content: data.command, userId: message.userId });

          if (data.error) {
            receiveMessages({ type: 'error', content: data.error, userId: message.userId });
          } else if (data.result) {
            receiveMessages({ type: 'result', content: data.result, userId: message.userId });
          }

          receiveMessages({ type: 'text', content: '' });
      },
      typing: () => {
        const data = message.data as { isTyping: boolean };
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            isTyping: {
              ...prev.isTyping,
              [message.userId]: data.isTyping,
            },
          };
        });
      },
    };

    handlers[message.type]?.();
  }, []);

  const {
    isPeerReady,
    isConnected,
    createSession: createPeerSession,
    joinSession: joinPeerSession,
    sendMessage: sendMessage,
    connectionError,
  } = usePeerConnection({
    currentUser,
    onMessage: handleMessage,
    onUserJoin: handleUserJoin,
    onUserLeave: handleUserLeave,
  });

  const createSession = useCallback(async (user: User) => {
    const sessionId = await createPeerSession();

    const newSession: Room = {
      id: sessionId,
      users: [user],
      isTyping: {},
    };

    setSession(newSession);
  }, [createPeerSession]);

  const joinSession = useCallback(
    async (user: User, sessionId: string) => {
      await joinPeerSession(user, sessionId);

      const newSession = {
        id: sessionId,
        users: [user],
        isTyping: {},
      };

      setSession(newSession);
    },
    [joinPeerSession]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!currentUser) return;

      sendMessage({
        type: 'typing',
        data: { isTyping },
      });

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isTyping: {
            ...prev.isTyping,
            [currentUser.id]: isTyping,
          },
        };
      });
    },
    [currentUser, sendMessage]
  );


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
        clearMessages
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
