import { create } from 'zustand';
import type { Socket } from 'socket.io-client';

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  error: string | null;
  socket: Socket | null;
  setStatus: (status: ConnectionState['status']) => void;
  setError: (error: string | null) => void;
  setSocket: (socket: Socket | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'disconnected',
  error: null,
  socket: null,
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setSocket: (socket) => set({ socket }),
}));
