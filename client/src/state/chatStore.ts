import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  playerId: string;
  displayName: string;
  content: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  addMessage: (msg: ChatMessage) => void;
  toggleChat: () => void;
  setOpen: (open: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isOpen: false,
  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages.slice(-99), msg],
    })),
  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),
  clearMessages: () => set({ messages: [] }),
}));
