import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ServerEvent,
  ClientEvent,
  PlayerSnapshot,
  ChatBroadcast,
  EmoteBroadcast,
  PlayerJoined,
  PlayerLeft,
  RoomJoined,
  Snapshot,
  Correction,
  ErrorEvent,
} from '@otter-village/shared';
import { useConnectionStore } from '../../state/connectionStore';
import { usePlayerStore } from '../../state/playerStore';
import { useWorldStore } from '../../state/worldStore';
import { useChatStore, type ChatMessage } from '../../state/chatStore';
import { useUIStore } from '../../state/uiStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function SocketManager() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const status = useConnectionStore.getState().status;
    if (status === 'connected' || status === 'connecting') return;

    useConnectionStore.getState().setStatus('connecting');

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    useConnectionStore.getState().setSocket(socket);

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      useConnectionStore.getState().setStatus('connected');

      // Send join room event
      const { displayName, appearance } = usePlayerStore.getState();
      const joinEvent: ClientEvent = {
        type: 'JoinRoom',
        roomId: 'default',
        displayName: displayName || 'Player',
        appearance,
      };
      socket.emit('event', joinEvent);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      useConnectionStore.getState().setStatus('disconnected');
      useWorldStore.getState().clearAll();
    });

    socket.on('reconnect_attempt', () => {
      useConnectionStore.getState().setStatus('reconnecting');
    });

    socket.on('reconnect', () => {
      useConnectionStore.getState().setStatus('connected');
    });

    // Handle server events
    socket.on('event', (event: ServerEvent) => {
      switch (event.type) {
        case 'RoomJoined': {
          const e = event as RoomJoined;
          usePlayerStore.getState().setLocalPlayerId(e.playerId);
          // Add all existing players
          for (const p of e.players) {
            useWorldStore.getState().addPlayer(p);
          }
          break;
        }
        case 'Snapshot': {
          const e = event as Snapshot;
          for (const p of e.players) {
            useWorldStore.getState().updateSnapshot(p.id, p);
          }
          break;
        }
        case 'Correction': {
          const e = event as Correction;
          // Apply server correction to local player
          usePlayerStore.getState().updateLocalState({
            position: e.position,
            velocity: e.velocity,
          });
          break;
        }
        case 'PlayerJoined': {
          const e = event as PlayerJoined;
          useWorldStore.getState().addPlayer(e.player);
          break;
        }
        case 'PlayerLeft': {
          const e = event as PlayerLeft;
          useWorldStore.getState().removePlayer(e.playerId);
          break;
        }
        case 'ChatBroadcast': {
          const e = event as ChatBroadcast;
          const msg: ChatMessage = {
            id: `${e.timestamp}-${e.playerId}`,
            playerId: e.playerId,
            displayName: e.displayName,
            content: e.content,
            timestamp: e.timestamp,
          };
          useChatStore.getState().addMessage(msg);
          break;
        }
        case 'EmoteBroadcast': {
          // Emote is shown via the snapshot's emoteId field
          break;
        }
        case 'EmoteCancelled': {
          break;
        }
        case 'Error': {
          const e = event as ErrorEvent;
          console.error('[Server Error]', e.code, e.message);
          useConnectionStore.getState().setError(e.message);
          break;
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      useConnectionStore.getState().setSocket(null);
      useConnectionStore.getState().setStatus('disconnected');
    };
  }, []);

  return null;
}
