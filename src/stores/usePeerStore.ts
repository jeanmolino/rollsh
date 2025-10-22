import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { PeerMessage, User } from '@/types';

interface PeerState {
  peerId: string | null;
  isPeerReady: boolean;
  isConnected: boolean;
  isHost: boolean;
  connectionError: string | null;
  peer: Peer | null;
  connections: Map<string, DataConnection>;
  onMessage: ((message: PeerMessage) => void) | null;
  onUserJoin: ((user: User) => void) | null;
  onUserLeave: ((userId: string) => void) | null;
  getCurrentUsers: (() => User[]) | null;
  initialize: (callbacks: {
    onMessage: (message: PeerMessage) => void;
    onUserJoin: (user: User) => void;
    onUserLeave: (userId: string) => void;
    getCurrentUsers: () => User[];
  }) => Promise<void>;
  createSession: () => Promise<string>;
  joinSession: (user: User, sessionId: string) => Promise<void>;
  sendMessage: (message: Omit<PeerMessage, 'userId' | 'timestamp'>, currentUser: User) => void;
  disconnect: (currentUser: User | null) => void;
  destroy: () => void;
}

export const usePeerStore = create<PeerState>()(
  devtools(
    (set, get) => ({
      peerId: null,
      isPeerReady: false,
      isConnected: false,
      isHost: false,
      connectionError: null,
      peer: null,
      connections: new Map(),
      onMessage: null,
      onUserJoin: null,
      onUserLeave: null,
      getCurrentUsers: null,

      initialize: (callbacks) => {
        const state = get();

        if (state.peer) {
          set({ ...callbacks });
          return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
          const peerHost = import.meta.env.VITE_PEER_HOST || '0.peerjs.com';
          const peerPort = import.meta.env.VITE_PEER_PORT ? parseInt(import.meta.env.VITE_PEER_PORT) : 443;
          const peerPath = import.meta.env.VITE_PEER_PATH || '/';
          const peerSecure = import.meta.env.VITE_PEER_SECURE !== 'false';

          const peer = new Peer({
            host: peerHost,
            port: peerPort,
            path: peerPath,
            secure: peerSecure,
            debug: 2,
            config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
              ],
            },
          });

          peer.on('open', (id) => {
            set({
              peerId: id,
              isPeerReady: true,
              connectionError: null,
            });
            resolve();
          });

          peer.on('error', (error) => {
            console.error('Peer error:', error);
            set({ connectionError: error.message });
            reject(error);
          });

          peer.on('connection', (conn) => {
            const handleIncomingConnection = (connection: DataConnection) => {
              connection.on('open', () => {
                const currentState = get();
                const newConnections = new Map(currentState.connections);
                newConnections.set(connection.peer, connection);

                set({
                  connections: newConnections,
                  isConnected: true,
                });

                if (currentState.isHost && currentState.getCurrentUsers) {
                  const users = currentState.getCurrentUsers();
                  connection.send({
                    type: 'sync-users',
                    userId: 'host',
                    timestamp: Date.now(),
                    data: { users },
                  } as PeerMessage);
                }
              });

              connection.on('data', (data) => {
                const message = data as PeerMessage;
                const currentState = get();

                if (message.type === 'user-join') {
                  const msgData = message.data as { user: User };
                  currentState.onUserJoin?.(msgData.user);
                } else if (message.type === 'user-leave') {
                  const msgData = message.data as { userId: string };
                  currentState.onUserLeave?.(msgData.userId);
                }

                currentState.onMessage?.(message);

                if (currentState.isHost) {
                  currentState.connections.forEach((conn, peerId) => {
                    if (peerId !== connection.peer && conn.open) {
                      conn.send(message);
                    }
                  });
                }
              });

              connection.on('close', () => {
                const currentState = get();
                const newConnections = new Map(currentState.connections);
                newConnections.delete(connection.peer);

                set({
                  connections: newConnections,
                  isConnected: newConnections.size > 0,
                });
              });

              connection.on('error', (error) => {
                console.error('Connection error:', error);
              });
            };

            handleIncomingConnection(conn);
          });

          set({
            peer,
            ...callbacks,
          });
        });
      },

      createSession: async (): Promise<string> => {
        const id = get().peer?.id;

        if (!id) {
          throw new Error('Peer not initialized');
        }

        set({
          isHost: true,
          isConnected: true,
        });

        return id;
      },

      joinSession: async (user: User, sessionId: string): Promise<void> => {
        const peer = get().peer;

        if (!peer) {
          throw new Error('Peer not initialized');
        }

        return new Promise((resolve, reject) => {
          const conn = peer.connect(sessionId, {
            reliable: true,
          });

          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout - could not connect to session'));
          }, 30000);

          conn.on('open', () => {
            clearTimeout(timeout);
            const currentState = get();
            const newConnections = new Map(currentState.connections);
            newConnections.set(sessionId, conn);

            set({
              connections: newConnections,
              isConnected: true,
              isHost: false,
            });

            conn.send({
              type: 'user-join',
              userId: user.id,
              timestamp: Date.now(),
              data: { user },
            } as PeerMessage);

            resolve();
          });

          conn.on('data', (data) => {
            const message = data as PeerMessage;
            const currentState = get();

            if (message.type === 'user-join') {
              const msgData = message.data as { user: User };
              currentState.onUserJoin?.(msgData.user);
            } else if (message.type === 'user-leave') {
              const msgData = message.data as { userId: string };
              currentState.onUserLeave?.(msgData.userId);
            }

            currentState.onMessage?.(message);
          });

          conn.on('close', () => {
            const currentState = get();
            const newConnections = new Map(currentState.connections);
            newConnections.delete(sessionId);

            set({
              connections: newConnections,
              isConnected: false,
            });
          });

          conn.on('error', (error) => {
            clearTimeout(timeout);
            console.error('Connection error:', error);
            set({ connectionError: error.message });
            reject(error);
          });
        });
      },

      sendMessage: (message: Omit<PeerMessage, 'userId' | 'timestamp'>, currentUser: User) => {
        const state = get();

        const fullMessage: PeerMessage = {
          ...message,
          userId: currentUser.id,
          timestamp: Date.now(),
        };

        state.connections.forEach((conn) => {
          if (conn.open) {
            conn.send(fullMessage);
          }
        });
      },

      disconnect: (currentUser: User | null) => {
        const state = get();

        if (currentUser) {
          if (state.isHost) {
            const hostDisconnectedMessage: PeerMessage = {
              type: 'host-disconnected',
              userId: currentUser.id,
              timestamp: Date.now(),
              data: {},
            };

            state.connections.forEach((conn) => {
              if (conn.open) {
                conn.send(hostDisconnectedMessage);
              }
            });
          } else {
            const leaveMessage: PeerMessage = {
              type: 'user-leave',
              userId: currentUser.id,
              timestamp: Date.now(),
              data: { userId: currentUser.id },
            };

            state.connections.forEach((conn) => {
              if (conn.open) {
                conn.send(leaveMessage);
              }
            });
          }
        }

        state.connections.forEach((conn) => {
          conn.close();
        });

        set({
          connections: new Map(),
          isConnected: false,
        });
      },

      destroy: () => {
        const state = get();

        state.connections.forEach((conn) => {
          conn.close();
        });

        state.peer?.destroy();

        set({
          peerId: null,
          isPeerReady: false,
          isConnected: false,
          isHost: false,
          connectionError: null,
          peer: null,
          connections: new Map(),
          onMessage: null,
          onUserJoin: null,
          onUserLeave: null,
          getCurrentUsers: null,
        });
      },
    }),
    { name: 'PeerStore' }
  )
);
