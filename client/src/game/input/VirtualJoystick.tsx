import { useRef, useEffect, useState } from 'react';
import { useInputStore } from '../../state/inputStore';

const JOYSTICK_SIZE = 120;
const THUMB_SIZE = 50;
const MAX_DISTANCE = (JOYSTICK_SIZE - THUMB_SIZE) / 2;

export function VirtualJoystick() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [thumbPos, setThumbPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);
  const originRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsTouch('ontouchstart' in window);
  }, []);

  useEffect(() => {
    if (!isTouch) return;

    const container = containerRef.current;
    if (!container) return;

    function handleTouchStart(e: TouchEvent) {
      // Only left half of screen
      const touch = e.changedTouches[0];
      if (touch.clientX > window.innerWidth / 2) return;
      if (touchIdRef.current !== null) return;

      touchIdRef.current = touch.identifier;
      originRef.current = { x: touch.clientX, y: touch.clientY };
      setActive(true);
      setThumbPos({ x: 0, y: 0 });
      e.preventDefault();
    }

    function handleTouchMove(e: TouchEvent) {
      if (touchIdRef.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchIdRef.current) {
          let dx = touch.clientX - originRef.current.x;
          let dy = touch.clientY - originRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > MAX_DISTANCE) {
            dx = (dx / dist) * MAX_DISTANCE;
            dy = (dy / dist) * MAX_DISTANCE;
          }
          setThumbPos({ x: dx, y: dy });

          // Normalize to -1..1
          const normX = dx / MAX_DISTANCE;
          const normZ = dy / MAX_DISTANCE;
          useInputStore.getState().setInput({ moveX: normX, moveZ: normZ });
          e.preventDefault();
          break;
        }
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (touchIdRef.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          setActive(false);
          setThumbPos({ x: 0, y: 0 });
          useInputStore.getState().setInput({ moveX: 0, moveZ: 0 });
          break;
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isTouch]);

  if (!isTouch) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        bottom: 40,
        left: 40,
        width: JOYSTICK_SIZE,
        height: JOYSTICK_SIZE,
        borderRadius: '50%',
        background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        touchAction: 'none',
        zIndex: 20,
      }}
    >
      <div
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.3)',
          transform: `translate(${thumbPos.x}px, ${thumbPos.y}px)`,
          transition: active ? 'none' : 'transform 0.15s ease-out',
        }}
      />
    </div>
  );
}
