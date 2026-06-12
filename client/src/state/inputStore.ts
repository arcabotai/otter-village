import { create } from 'zustand';

export interface InputState {
  moveX: number;
  moveZ: number;
  jump: boolean;
  run: boolean;
  cameraYaw: number;
  chatFocused: boolean;
}

interface InputStore {
  input: InputState;
  setInput: (partial: Partial<InputState>) => void;
  resetJump: () => void;
  setChatFocused: (focused: boolean) => void;
}

export const useInputStore = create<InputStore>((set) => ({
  input: {
    moveX: 0,
    moveZ: 0,
    jump: false,
    run: false,
    cameraYaw: 0,
    chatFocused: false,
  },
  setInput: (partial) =>
    set((s) => ({ input: { ...s.input, ...partial } })),
  resetJump: () =>
    set((s) => ({ input: { ...s.input, jump: false } })),
  setChatFocused: (chatFocused) =>
    set((s) => ({ input: { ...s.input, chatFocused } })),
}));
