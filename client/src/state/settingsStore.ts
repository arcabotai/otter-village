import { create } from 'zustand';

type Quality = 'low' | 'medium' | 'high';

interface SettingsStore {
  quality: Quality;
  muteChat: boolean;
  dpr: number;
  setQuality: (quality: Quality) => void;
  toggleMute: () => void;
}

function dprForQuality(q: Quality): number {
  switch (q) {
    case 'low': return 1;
    case 'medium': return 1.25;
    case 'high': return 1.5;
  }
}

// Load persisted settings
function loadPersisted(): Partial<SettingsStore> {
  try {
    const raw = localStorage.getItem('otter-village-settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        quality: parsed.quality ?? 'medium',
        muteChat: parsed.muteChat ?? false,
        dpr: dprForQuality(parsed.quality ?? 'medium'),
      };
    }
  } catch { /* ignore */ }
  return {};
}

function persist(quality: Quality, muteChat: boolean) {
  try {
    localStorage.setItem(
      'otter-village-settings',
      JSON.stringify({ quality, muteChat }),
    );
  } catch { /* ignore */ }
}

const persisted = loadPersisted();

export const useSettingsStore = create<SettingsStore>((set) => ({
  quality: (persisted.quality as Quality) ?? 'medium',
  muteChat: persisted.muteChat ?? false,
  dpr: persisted.dpr ?? 1.25,
  setQuality: (quality) => {
    const dpr = dprForQuality(quality);
    set((s) => {
      persist(quality, s.muteChat);
      return { quality, dpr };
    });
  },
  toggleMute: () =>
    set((s) => {
      const muteChat = !s.muteChat;
      persist(s.quality, muteChat);
      return { muteChat };
    }),
}));
