import { useEffect } from 'react';
import { useInputStore } from '../../state/inputStore';

const KEYS_DOWN = new Set<string>();

export function InputManager() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't capture if chat is focused
      if (useInputStore.getState().input.chatFocused) return;

      KEYS_DOWN.add(e.code);
      updateInput();

      if (e.code === 'Space') {
        useInputStore.getState().setInput({ jump: true });
        e.preventDefault();
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      KEYS_DOWN.delete(e.code);
      updateInput();

      if (e.code === 'Space') {
        useInputStore.getState().setInput({ jump: false });
      }
    }

    function updateInput() {
      let moveX = 0;
      let moveZ = 0;

      if (KEYS_DOWN.has('KeyW') || KEYS_DOWN.has('ArrowUp')) moveZ = -1;
      if (KEYS_DOWN.has('KeyS') || KEYS_DOWN.has('ArrowDown')) moveZ = 1;
      if (KEYS_DOWN.has('KeyA') || KEYS_DOWN.has('ArrowLeft')) moveX = -1;
      if (KEYS_DOWN.has('KeyD') || KEYS_DOWN.has('ArrowRight')) moveX = 1;

      const run = KEYS_DOWN.has('ShiftLeft') || KEYS_DOWN.has('ShiftRight');

      useInputStore.getState().setInput({ moveX, moveZ, run });
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      KEYS_DOWN.clear();
    };
  }, []);

  return null;
}
