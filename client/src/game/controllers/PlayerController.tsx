import { useRef, useEffect, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import {
  PLAYER_WALK_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_JUMP_FORCE,
  PLAYER_AIR_CONTROL,
  COYOTE_TIME,
  JUMP_BUFFER_TIME,
  RESPAWN_Y,
  SERVER_TICK_RATE,
  WORLD_SIZE,
  type PlayerInput,
} from '@otter-village/shared';
import { useInputStore } from '../../state/inputStore';
import { usePlayerStore } from '../../state/playerStore';
import { useConnectionStore } from '../../state/connectionStore';

interface PlayerControllerProps {
  rigidBodyRef: RefObject<RapierRigidBody | null>;
}

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();

export function PlayerController({ rigidBodyRef }: PlayerControllerProps) {
  const groundedRef = useRef(true);
  const coyoteTimerRef = useRef(0);
  const jumpBufferRef = useRef(0);
  const lastSendTimeRef = useRef(0);
  const inputSeqRef = useRef(0);
  const rotationRef = useRef(0);

  // Reset on mount
  useEffect(() => {
    groundedRef.current = true;
    coyoteTimerRef.current = 0;
    jumpBufferRef.current = 0;
    lastSendTimeRef.current = 0;
    inputSeqRef.current = 0;
    rotationRef.current = 0;
  }, []);

  useFrame((state, delta) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    const dt = Math.min(delta, 0.05);
    const input = useInputStore.getState().input;
    const cameraYaw = useInputStore.getState().input.cameraYaw;

    // Get camera-relative directions
    _forward.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
    _right.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);

    // Calculate movement direction
    _moveDir.set(0, 0, 0);
    _moveDir.addScaledVector(_forward, -input.moveZ);
    _moveDir.addScaledVector(_right, input.moveX);

    if (_moveDir.lengthSq() > 0.01) {
      _moveDir.normalize();
    }

    // Speed
    const speed = input.run ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
    const airControl = groundedRef.current ? 1.0 : PLAYER_AIR_CONTROL;

    // Get current velocity
    const vel = rb.linvel();
    const targetVelX = _moveDir.x * speed;
    const targetVelZ = _moveDir.z * speed;

    // Apply velocity with air control
    const newVelX = THREE.MathUtils.lerp(vel.x, targetVelX, airControl * 0.3);
    const newVelZ = THREE.MathUtils.lerp(vel.z, targetVelZ, airControl * 0.3);

    // Ground detection via velocity
    const wasGrounded = groundedRef.current;
    if (vel.y < -0.5 && !wasGrounded) {
      // Falling
    } else if (Math.abs(vel.y) < 0.1 && wasGrounded) {
      groundedRef.current = true;
      coyoteTimerRef.current = COYOTE_TIME;
    }

    // Simple ground check - assume grounded if y is near ground level
    const pos = rb.translation();
    if (pos.y < 0.8) {
      groundedRef.current = true;
      coyoteTimerRef.current = COYOTE_TIME;
    } else if (pos.y > 1.2) {
      groundedRef.current = false;
    }

    // Coyote time countdown
    if (!groundedRef.current) {
      coyoteTimerRef.current = Math.max(0, coyoteTimerRef.current - dt);
    }

    // Jump buffer
    if (input.jump) {
      jumpBufferRef.current = JUMP_BUFFER_TIME;
    } else {
      jumpBufferRef.current = Math.max(0, jumpBufferRef.current - dt);
    }

    // Jump execution
    let jumpVel = vel.y;
    if (jumpBufferRef.current > 0 && coyoteTimerRef.current > 0) {
      jumpVel = PLAYER_JUMP_FORCE;
      jumpBufferRef.current = 0;
      coyoteTimerRef.current = 0;
      groundedRef.current = false;
    }

    // Apply velocity
    rb.setLinvel({ x: newVelX, y: jumpVel, z: newVelZ }, true);

    // Rotation toward movement direction
    if (_moveDir.lengthSq() > 0.01) {
      const targetAngle = Math.atan2(_moveDir.x, _moveDir.z);
      // Smooth rotation
      let diff = targetAngle - rotationRef.current;
      // Normalize to [-PI, PI]
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      rotationRef.current += diff * 10 * dt;
    }

    // Apply rotation
    _euler.set(0, rotationRef.current, 0);
    _quat.setFromEuler(_euler);
    rb.setRotation({ x: _quat.x, y: _quat.y, z: _quat.z, w: _quat.w }, true);

    // Respawn if fallen
    if (pos.y < RESPAWN_Y) {
      rb.setTranslation({ x: 0, y: 3, z: 0 }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    // Clamp to world bounds
    const halfW = WORLD_SIZE / 2 - 1;
    const clampedX = THREE.MathUtils.clamp(pos.x, -halfW, halfW);
    const clampedZ = THREE.MathUtils.clamp(pos.z, -halfW, halfW);
    if (pos.x !== clampedX || pos.z !== clampedZ) {
      rb.setTranslation({ x: clampedX, y: pos.y, z: clampedZ }, true);
    }

    // Update player store (no React setState — just zustand)
    usePlayerStore.getState().updateLocalState({
      position: { x: pos.x, y: pos.y, z: pos.z },
      velocity: { x: vel.x, y: vel.y, z: vel.z },
      grounded: groundedRef.current,
      running: input.run,
      moving: _moveDir.lengthSq() > 0.01,
      rotation: rotationRef.current,
    });

    // Send input to server at tick rate
    const now = state.clock.elapsedTime;
    const tickInterval = 1 / SERVER_TICK_RATE;
    if (now - lastSendTimeRef.current >= tickInterval) {
      lastSendTimeRef.current = now;
      inputSeqRef.current++;

      const socket = useConnectionStore.getState().socket;
      if (socket) {
        const playerInput: PlayerInput = {
          seq: inputSeqRef.current,
          timestamp: Date.now(),
          moveX: input.moveX,
          moveZ: input.moveZ,
          jump: input.jump,
          run: input.run,
          cameraYaw: input.cameraYaw,
        };
        socket.emit('event', { type: 'PlayerInput', input: playerInput });
      }
    }
  });

  return null;
}
