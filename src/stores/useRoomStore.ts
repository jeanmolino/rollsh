import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Room, Message, PeerMessage } from '@/types';
import { usePeerStore } from './usePeerStore';
import { peerEvents } from '@/lib/peerEvents';

interface RoomState {
  currentUser: User | null;
  session: Room | null;
  messages: Message[];
  setCurrentUser: (user: User | null) => void;
  createSession: (user: User) => Promise<void>;
  joinSession: (user: User, sessionId: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  sendMessage: (message: Omit<PeerMessage, 'userId' | 'timestamp'>) => void;
  receiveMessages: (...messages: Message[]) => void;
  clearMessages: () => void;
}

export const useRoomStore = create<RoomState>()(
  devtools(
    (set, get) => ({
      currentUser: null,
      session: null,
      messages: [],

      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      createSession: async (user: User) => {
        const peerStore = usePeerStore.getState();

        if (!peerStore.peer) {
          await peerStore.initialize();
        }

        const unsubscribes = [
          peerEvents.on('peer:message', (message: PeerMessage) => {
            handleMessage(message);
          }),
          peerEvents.on('peer:user-join', (joinedUser: User) => {
            handleUserJoin(joinedUser);
          }),
          peerEvents.on('peer:user-leave', (userId: string) => {
            handleUserLeave(userId);
          }),
          peerEvents.on('peer:request-sync', (connection) => {
            const currentState = get();
            if (currentState.session) {
              connection.send({
                type: 'sync-users',
                userId: 'host',
                timestamp: Date.now(),
                data: { users: currentState.session.users },
              });
            }
          }),
        ];

        const cleanup = () => {
          unsubscribes.forEach(unsub => unsub());
        };

        (window as any).__roomCleanup = cleanup;

        const sessionId = await peerStore.createSession();

        const newSession: Room = {
          id: sessionId,
          users: [user],
          isTyping: {},
        };

        set({
          currentUser: user,
          session: newSession,
        });
      },

      joinSession: async (user: User, sessionId: string) => {

        const peerStore = usePeerStore.getState();

        if (!peerStore.peer) {
          await peerStore.initialize();
        }

        const unsubscribes = [
          peerEvents.on('peer:message', (message: PeerMessage) => {
            handleMessage(message);
          }),
          peerEvents.on('peer:user-join', (joinedUser: User) => {
            handleUserJoin(joinedUser);
          }),
          peerEvents.on('peer:user-leave', (userId: string) => {
            handleUserLeave(userId);
          }),
        ];

        const cleanup = () => {
          unsubscribes.forEach(unsub => unsub());
        };

        (window as any).__roomCleanup = cleanup;

        await peerStore.joinSession(user, sessionId);

        const newSession: Room = {
          id: sessionId,
          users: [user],
          isTyping: {},
        };

        set({
          currentUser: user,
          session: newSession,
        });
      },

      setTyping: (isTyping: boolean) => {
        const state = get();
        if (!state.currentUser) return;

        const peerStore = usePeerStore.getState();
        peerStore.sendMessage(
          {
            type: 'typing',
            data: { isTyping },
          },
          state.currentUser
        );

        set((state) => {
          if (!state.session || !state.currentUser) return state;

          return {
            session: {
              ...state.session,
              isTyping: {
                ...state.session.isTyping,
                [state.currentUser.id]: isTyping,
              },
            },
          };
        });
      },

      sendMessage: (message: Omit<PeerMessage, 'userId' | 'timestamp'>) => {
        const state = get();
        if (!state.currentUser) return;

        const peerStore = usePeerStore.getState();
        peerStore.sendMessage(message, state.currentUser);
      },

      receiveMessages: (...newMessages: Message[]) => {
        set((state) => ({
          messages: [...state.messages, ...newMessages],
        }));
      },

      clearMessages: () => {
        set({ messages: [] });
      },
    }),
    { name: 'RoomStore' }
  )
);

function handleUserJoin(user: User) {
  const state = useRoomStore.getState();

  if (!state.session) return;

  if (state.session.users.some((u) => u.id === user.id)) {
    return;
  }

  useRoomStore.setState({
    session: {
      ...state.session,
      users: [...state.session.users, user],
    },
  });
}

function handleUserLeave(userId: string) {
  const state = useRoomStore.getState();

  if (!state.session) return;

  useRoomStore.setState({
    session: {
      ...state.session,
      users: state.session.users.filter((u) => u.id !== userId),
      isTyping: {
        ...state.session.isTyping,
        [userId]: false,
      },
    },
  });
}

function handleMessage(message: PeerMessage) {
  const state = useRoomStore.getState();

  const handlers: Record<string, () => void> = {
    roll: () => {
      const data = message.data as { command: string; result?: string; error?: string };

      state.receiveMessages({ type: 'command', content: data.command, userId: message.userId });

      if (data.error) {
        state.receiveMessages({ type: 'error', content: data.error, userId: message.userId });
      } else if (data.result) {
        state.receiveMessages({ type: 'result', content: data.result, userId: message.userId });
      }

      state.receiveMessages({ type: 'text', content: '' });
    },
    typing: () => {
      const data = message.data as { isTyping: boolean };

      if (!state.session) return;

      useRoomStore.setState({
        session: {
          ...state.session,
          isTyping: {
            ...state.session.isTyping,
            [message.userId]: data.isTyping,
          },
        },
      });
    },
    'sync-users': () => {
      const data = message.data as { users: User[] };

      if (!state.session) return;

      const currentUser = state.currentUser;
      const allUsers = currentUser
        ? [...data.users.filter(u => u.id !== currentUser.id), currentUser]
        : data.users;

      useRoomStore.setState({
        session: {
          ...state.session,
          users: allUsers,
        },
      });
    },
    'host-disconnected': () => {
      const peerStore = usePeerStore.getState();
      peerStore.disconnect(state.currentUser);

      useRoomStore.setState({
        session: null,
        messages: [],
      });

      state.receiveMessages({
        type: 'error',
        content: 'Host disconnected. Session ended.',
      });
    },
  };

  handlers[message.type]?.();
}
