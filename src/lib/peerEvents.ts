import type { PeerMessage, User } from '@/types';
import type { DataConnection } from 'peerjs';

export type PeerEventMap = {
  'peer:message': PeerMessage;
  'peer:user-join': User;
  'peer:user-leave': string;
  'peer:connected': { peerId: string; isHost: boolean };
  'peer:disconnected': void;
  'peer:error': Error;
  'peer:request-sync': DataConnection;
};

type EventCallback<T> = (data: T) => void;

class PeerEventEmitter {
  private listeners: Map<keyof PeerEventMap, Set<EventCallback<any>>> = new Map();

  on<K extends keyof PeerEventMap>(event: K, callback: EventCallback<PeerEventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    return () => this.off(event, callback);
  }

  off<K extends keyof PeerEventMap>(event: K, callback: EventCallback<PeerEventMap[K]>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit<K extends keyof PeerEventMap>(event: K, data: PeerEventMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: keyof PeerEventMap): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const peerEvents = new PeerEventEmitter();
