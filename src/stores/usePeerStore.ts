import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { PeerMessage, User } from '@/types';
import { peerEvents } from '@/lib/peerEvents';

interface PeerState {
  peerId: string | null;
  isPeerReady: boolean;
  isConnected: boolean;
  isHost: boolean;
  connectionError: string | null;
  peer: Peer | null;
  connections: Map<string, DataConnection>;
  initialize: () => Promise<void>;
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

      initialize: () => {
        const state = get();

        console.log('[PeerStore] initialize called, peer exists:', !!state.peer);

        if (state.peer) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
          console.log('[PeerStore] Creating new Peer instance...');
          const peerHost = import.meta.env.VITE_PEER_HOST || '0.peerjs.com';
          const peerPort = import.meta.env.VITE_PEER_PORT ? parseInt(import.meta.env.VITE_PEER_PORT) : 443;
          const peerPath = import.meta.env.VITE_PEER_PATH || '/';
          const peerSecure = import.meta.env.VITE_PEER_SECURE !== 'false';

          console.log('[PeerStore] Peer config:', { host: peerHost, port: peerPort, path: peerPath, secure: peerSecure });

          const peer = new Peer({
            host: peerHost,
            port: peerPort,
            path: peerPath,
            secure: peerSecure,
            debug: 3,
            config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
              ],
            },
          });

          peer.on('open', (id) => {
            console.log('[PeerStore] Peer opened with ID:', id);
            set({
              peer,
              peerId: id,
              isPeerReady: true,
              connectionError: null,
            });
            resolve();
          });

          peer.on('disconnected', () => {
            console.warn('[PeerStore] Peer disconnected');
          });

          peer.on('close', () => {
            console.warn('[PeerStore] Peer closed');
          });

          peer.on('error', (error) => {
            console.error('[PeerStore] Peer error:', error);
            console.error('[PeerStore] Error type:', error.type);
            set({ connectionError: error.message });
            peerEvents.emit('peer:error', error);
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

                if (currentState.isHost) {
                  peerEvents.emit('peer:request-sync', connection);
                }
              });

              connection.on('data', (data) => {
                const message = data as PeerMessage;
                const currentState = get();

                peerEvents.emit('peer:message', message);

                if (message.type === 'user-join') {
                  const msgData = message.data as { user: User };
                  peerEvents.emit('peer:user-join', msgData.user);
                } else if (message.type === 'user-leave') {
                  const msgData = message.data as { userId: string };
                  peerEvents.emit('peer:user-leave', msgData.userId);
                }

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

                if (newConnections.size === 0) {
                  peerEvents.emit('peer:disconnected', undefined);
                }
              });

              connection.on('error', (error) => {
                console.error('Connection error:', error);
                peerEvents.emit('peer:error', error);
              });
            };

            handleIncomingConnection(conn);
          });
        });
      },

      createSession: async (): Promise<string> => {
        console.log('[PeerStore] createSession called');
        const id = get().peer?.id;

        if (!id) {
          console.error('[PeerStore] Peer not initialized!');
          throw new Error('Peer not initialized');
        }

        console.log('[PeerStore] Setting host mode, peerId:', id);
        set({
          isHost: true,
          isConnected: true,
        });

        peerEvents.emit('peer:connected', { peerId: id, isHost: true });

        console.log('[PeerStore] createSession completed');
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

            peerEvents.emit('peer:connected', { peerId: sessionId, isHost: false });

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

            peerEvents.emit('peer:message', message);

            if (message.type === 'user-join') {
              const msgData = message.data as { user: User };
              peerEvents.emit('peer:user-join', msgData.user);
            } else if (message.type === 'user-leave') {
              const msgData = message.data as { userId: string };
              peerEvents.emit('peer:user-leave', msgData.userId);
            }
          });

          conn.on('close', () => {
            const currentState = get();
            const newConnections = new Map(currentState.connections);
            newConnections.delete(sessionId);

            set({
              connections: newConnections,
              isConnected: false,
            });

            peerEvents.emit('peer:disconnected', undefined);
          });

          conn.on('error', (error) => {
            clearTimeout(timeout);
            console.error('Connection error:', error);
            set({ connectionError: error.message });
            peerEvents.emit('peer:error', error);
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

        peerEvents.emit('peer:disconnected', undefined);
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
        });

        peerEvents.removeAllListeners();
      },
    }),
    { name: 'PeerStore' }
  )
);
