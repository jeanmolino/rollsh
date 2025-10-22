import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Room, Message, PeerMessage } from '@/types';
import { usePeerStore } from './usePeerStore';

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
  handleUserJoin: (user: User) => void;
  handleUserLeave: (userId: string) => void;
  handleMessage: (message: PeerMessage) => void;
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
          await peerStore.initialize({
            onMessage: get().handleMessage,
            onUserJoin: get().handleUserJoin,
            onUserLeave: get().handleUserLeave,
            getCurrentUsers: () => get().session?.users || [],
          });
        }

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
          await peerStore.initialize({
            onMessage: get().handleMessage,
            onUserJoin: get().handleUserJoin,
            onUserLeave: get().handleUserLeave,
            getCurrentUsers: () => get().session?.users || [],
          });
        }

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

      handleUserJoin: (user: User) => {
        set((state) => {
          if (!state.session) return state;

          if (state.session.users.some((u) => u.id === user.id)) {
            return state;
          }

          return {
            session: {
              ...state.session,
              users: [...state.session.users, user],
            },
          };
        });
      },

      handleUserLeave: (userId: string) => {
        set((state) => {
          if (!state.session) return state;

          return {
            session: {
              ...state.session,
              users: state.session.users.filter((u) => u.id !== userId),
              isTyping: {
                ...state.session.isTyping,
                [userId]: false,
              },
            },
          };
        });
      },

      handleMessage: (message: PeerMessage) => {
        const handlers: Record<string, () => void> = {
          roll: () => {
            const data = message.data as { command: string; result?: string; error?: string };

            get().receiveMessages({ type: 'command', content: data.command, userId: message.userId });

            if (data.error) {
              get().receiveMessages({ type: 'error', content: data.error, userId: message.userId });
            } else if (data.result) {
              get().receiveMessages({ type: 'result', content: data.result, userId: message.userId });
            }

            get().receiveMessages({ type: 'text', content: '' });
          },
          typing: () => {
            const data = message.data as { isTyping: boolean };
            set((state) => {
              if (!state.session) return state;

              return {
                session: {
                  ...state.session,
                  isTyping: {
                    ...state.session.isTyping,
                    [message.userId]: data.isTyping,
                  },
                },
              };
            });
          },
          'sync-users': () => {
            const data = message.data as { users: User[] };
            set((state) => {
              if (!state.session) return state;

              const currentUser = state.currentUser;
              const allUsers = currentUser
                ? [...data.users.filter(u => u.id !== currentUser.id), currentUser]
                : data.users;

              return {
                session: {
                  ...state.session,
                  users: allUsers,
                },
              };
            });
          },
          'host-disconnected': () => {
            const peerStore = usePeerStore.getState();
            peerStore.disconnect(get().currentUser);

            set({
              session: null,
              messages: [],
            });

            get().receiveMessages({
              type: 'error',
              content: 'Host disconnected. Session ended.',
            });
          },
        };

        handlers[message.type]?.();
      },
    }),
    { name: 'RoomStore' }
  )
);
