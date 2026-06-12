import { create } from 'zustand';

interface UIStore {
  showPlayerList: boolean;
  showEmoteMenu: boolean;
  showSettings: boolean;
  showLogin: boolean;
  togglePlayerList: () => void;
  toggleEmoteMenu: () => void;
  toggleSettings: () => void;
  setShowLogin: (show: boolean) => void;
  closeAll: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  showPlayerList: false,
  showEmoteMenu: false,
  showSettings: false,
  showLogin: true,
  togglePlayerList: () =>
    set((s) => ({ showPlayerList: !s.showPlayerList, showEmoteMenu: false, showSettings: false })),
  toggleEmoteMenu: () =>
    set((s) => ({ showEmoteMenu: !s.showEmoteMenu, showPlayerList: false, showSettings: false })),
  toggleSettings: () =>
    set((s) => ({ showSettings: !s.showSettings, showPlayerList: false, showEmoteMenu: false })),
  setShowLogin: (show) => set({ showLogin: show }),
  closeAll: () =>
    set({ showPlayerList: false, showEmoteMenu: false, showSettings: false }),
}));
