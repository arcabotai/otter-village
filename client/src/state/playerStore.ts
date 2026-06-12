import { create } from 'zustand';
import type { PlayerAppearance, PlayerState, Species } from '@otter-village/shared';

interface PlayerStore {
  localPlayerId: string | null;
  displayName: string;
  appearance: PlayerAppearance;
  localState: Partial<PlayerState>;
  setLocalPlayerId: (id: string | null) => void;
  setDisplayName: (name: string) => void;
  setAppearance: (appearance: Partial<PlayerAppearance>) => void;
  setSpecies: (species: Species) => void;
  setBodyColor: (color: string) => void;
  updateLocalState: (state: Partial<PlayerState>) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  localPlayerId: null,
  displayName: '',
  appearance: {
    species: 'otter',
    bodyColor: '#8B6914',
  },
  localState: {},
  setLocalPlayerId: (id) => set({ localPlayerId: id }),
  setDisplayName: (displayName) => set({ displayName }),
  setAppearance: (partial) =>
    set((s) => ({ appearance: { ...s.appearance, ...partial } })),
  setSpecies: (species) =>
    set((s) => ({ appearance: { ...s.appearance, species } })),
  setBodyColor: (bodyColor) =>
    set((s) => ({ appearance: { ...s.appearance, bodyColor } })),
  updateLocalState: (partial) =>
    set((s) => ({ localState: { ...s.localState, ...partial } })),
}));
