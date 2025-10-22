import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { PeerMessage, User } from '@/types';

export interface UsePeerConnectionProps {
  currentUser: User | null;
  onMessage: (message: PeerMessage) => void;
  onUserJoin: (user: User) => void;
  onUserLeave: (userId: string) => void;
}

export interface UsePeerConnectionReturn {
  peerId: string | null;
  isPeerReady: boolean;
  isConnected: boolean;
  isHost: boolean;
  createSession: () => Promise<string>;
  joinSession: (user: User, sessionId: string) => Promise<void>;
  sendMessage: (message: Omit<PeerMessage, 'userId' | 'timestamp'>) => void;
  disconnect: () => void;
  connectionError: string | null;
}

export function usePeerConnection({
  currentUser,
  onMessage,
  onUserJoin,
  onUserLeave,
}: UsePeerConnectionProps): UsePeerConnectionReturn {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isPeerReady, setIsPeerReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const handleIncomingConnectionRef = useRef<((conn: DataConnection) => void) | null>(null);

  const processMessage = useCallback((message: PeerMessage) => {
    const messageHandlers: Record<string, () => void> = {
      'user-join': () => {
        const msgData = message.data as { user: User };
        onUserJoin(msgData.user);
      },
      'user-leave': () => {
        const msgData = message.data as { userId: string };
        onUserLeave(msgData.userId);
      },
    };

    messageHandlers[message.type]?.();
    onMessage(message);
  }, [onMessage, onUserJoin, onUserLeave]);

  const handleIncomingConnection = useCallback(
    (conn: DataConnection) => {
      conn.on('open', () => {
        connectionsRef.current.set(conn.peer, conn);
        setIsConnected(true);

        const userToSend = currentUser;
        if (userToSend) {
          conn.send({
            type: 'user-join',
            userId: userToSend.id,
            timestamp: Date.now(),
            data: { user: userToSend },
          } as PeerMessage);
        }
      });

      conn.on('data', (data) => {
        const message = data as PeerMessage;
        processMessage(message);

        if (isHost && message.userId !== currentUser?.id) {
          broadcastToOthers(message, conn.peer);
        }
      });

      conn.on('close', () => {
        connectionsRef.current.delete(conn.peer);
        if (connectionsRef.current.size === 0) {
          setIsConnected(false);
        }
      });

      conn.on('error', (error) => {
        console.error('Connection error:', error);
      });
    },
    [currentUser, isHost, processMessage]
  );

  useEffect(() => {
    handleIncomingConnectionRef.current = handleIncomingConnection;
  }, [handleIncomingConnection]);

  useEffect(() => {
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
      setPeerId(id);
      setIsPeerReady(true);
      setConnectionError(null);
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
      setConnectionError(error.message);
    });

    peer.on('connection', (conn) => {
      if (handleIncomingConnectionRef.current) {
        handleIncomingConnectionRef.current(conn);
      }
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
      connectionsRef.current.clear();
    };
  }, []);

  const createSession = useCallback(async (): Promise<string> => {
    let attempts = 0;
    while (!peerRef.current?.id && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    const id = peerRef.current?.id;

    if (!id) {
      throw new Error('Peer not initialized - timeout');
    }

    setIsHost(true);
    setIsConnected(true);
    return id;
  }, []);

  const joinSession = useCallback(
    async (user: User, sessionId: string): Promise<void> => {
      let attempts = 0;
      while (!peerRef.current?.id && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!peerRef.current) {
        throw new Error('Peer not initialized');
      }

      return new Promise((resolve, reject) => {
        const conn = peerRef.current!.connect(sessionId, {
          reliable: true,
        });

        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - could not connect to session'));
        }, 30000);

        conn.on('open', () => {
          clearTimeout(timeout);
          connectionsRef.current.set(sessionId, conn);
          setIsConnected(true);
          setIsHost(false);

          conn.send({
            type: 'user-join',
            userId: user.id,
            timestamp: Date.now(),
            data: { user: user },
          } as PeerMessage);

          resolve();
        });

        conn.on('data', (data) => {
          const message = data as PeerMessage;
          processMessage(message);
        });

        conn.on('close', () => {
          connectionsRef.current.delete(sessionId);
          setIsConnected(false);
        });

        conn.on('error', (error) => {
          clearTimeout(timeout);
          console.error('Connection error:', error);
          setConnectionError(error.message);
          reject(error);
        });
      });
    },
    [processMessage]
  );

  const broadcastToOthers = useCallback(
    (message: PeerMessage, excludePeer?: string) => {
      connectionsRef.current.forEach((conn, peerId) => {
        if (peerId !== excludePeer && conn.open) {
          conn.send(message);
        }
      });
    },
    []
  );

  const sendMessage = useCallback(
    (message: Omit<PeerMessage, 'userId' | 'timestamp'>) => {
      if (!currentUser) return;

      const fullMessage: PeerMessage = {
        ...message,
        userId: currentUser.id,
        timestamp: Date.now(),
      };

      connectionsRef.current.forEach((conn) => {
        if (conn.open) {
          conn.send(fullMessage);
        }
      });
    },
    [currentUser]
  );

  const disconnect = useCallback(() => {
    if (currentUser) {
      sendMessage({
        type: 'user-leave',
        data: { userId: currentUser.id },
      });
    }

    connectionsRef.current.forEach((conn) => {
      conn.close();
    });
    connectionsRef.current.clear();
    setIsConnected(false);
  }, [currentUser, sendMessage]);

  return {
    peerId,
    isPeerReady,
    isConnected,
    isHost,
    createSession,
    joinSession,
    sendMessage: sendMessage,
    disconnect,
    connectionError,
  };
}
