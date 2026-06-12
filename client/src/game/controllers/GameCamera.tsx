import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  CAMERA_MIN_PITCH,
  CAMERA_MAX_PITCH,
  clamp,
} from '@otter-village/shared';
import { usePlayerStore } from '../../state/playerStore';
import { useInputStore } from '../../state/inputStore';

const _cameraPos = new THREE.Vector3();
const _lookAt = new THREE.Vector3();
const DEG2RAD = Math.PI / 180;

export function GameCamera() {
  const { camera, gl } = useThree();
  const yawRef = useRef(Math.PI);
  const pitchRef = useRef(25 * DEG2RAD);
  const distanceRef = useRef(CAMERA_DISTANCE);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const isTouchDevice = useRef(false);

  // Detect touch device
  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window;
  }, []);

  // Pointer events for camera rotation
  const onPointerDown = useCallback((e: PointerEvent) => {
    // On touch: only right half of screen rotates camera
    if (isTouchDevice.current) {
      const halfWidth = window.innerWidth / 2;
      if (e.clientX < halfWidth) return;
    }
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    yawRef.current -= dx * 0.005;
    pitchRef.current = clamp(
      pitchRef.current + dy * 0.005,
      CAMERA_MIN_PITCH * DEG2RAD,
      CAMERA_MAX_PITCH * DEG2RAD,
    );
  }, []);

  const onPointerUp = useCallback((e: PointerEvent) => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [gl, onPointerDown, onPointerMove, onPointerUp]);

  useFrame(() => {
    // Update input store with camera yaw
    useInputStore.getState().setInput({ cameraYaw: yawRef.current });

    // Get player position
    const localState = usePlayerStore.getState().localState;
    const px = localState.position?.x ?? 0;
    const py = localState.position?.y ?? 1;
    const pz = localState.position?.z ?? 0;

    // Target look-at point (player + height offset)
    _lookAt.set(px, py + CAMERA_HEIGHT * 0.5, pz);

    // Calculate camera position from yaw + pitch
    const dist = distanceRef.current;
    const pitch = pitchRef.current;
    const yaw = yawRef.current;

    const offsetX = Math.sin(yaw) * Math.cos(pitch) * dist;
    const offsetY = Math.sin(pitch) * dist;
    const offsetZ = Math.cos(yaw) * Math.cos(pitch) * dist;

    _cameraPos.set(
      _lookAt.x + offsetX,
      _lookAt.y + offsetY,
      _lookAt.z + offsetZ,
    );

    // Smooth camera movement
    camera.position.lerp(_cameraPos, 0.1);
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    camera.lookAt(
      THREE.MathUtils.lerp(camera.position.x + currentLookAt.x * 10, _lookAt.x, 0.15),
      THREE.MathUtils.lerp(camera.position.y + currentLookAt.y * 10, _lookAt.y, 0.15),
      THREE.MathUtils.lerp(camera.position.z + currentLookAt.z * 10, _lookAt.z, 0.15),
    );
  });

  return null;
}
