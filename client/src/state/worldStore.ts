import { create } from 'zustand';
import type { PlayerSnapshot } from '@otter-village/shared';

interface WorldStore {
  remotePlayers: Map<string, PlayerSnapshot>;
  updateSnapshot: (id: string, snapshot: PlayerSnapshot) => void;
  addPlayer: (snapshot: PlayerSnapshot) => void;
  removePlayer: (id: string) => void;
  clearAll: () => void;
}

export const useWorldStore = create<WorldStore>((set) => ({
  remotePlayers: new Map(),
  updateSnapshot: (id, snapshot) =>
    set((state) => {
      const next = new Map(state.remotePlayers);
      next.set(id, snapshot);
      return { remotePlayers: next };
    }),
  addPlayer: (snapshot) =>
    set((state) => {
      const next = new Map(state.remotePlayers);
      next.set(snapshot.id, snapshot);
      return { remotePlayers: next };
    }),
  removePlayer: (id) =>
    set((state) => {
      const next = new Map(state.remotePlayers);
      next.delete(id);
      return { remotePlayers: next };
    }),
  clearAll: () => set({ remotePlayers: new Map() }),
}));
