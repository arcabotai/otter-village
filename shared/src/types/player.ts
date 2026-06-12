import type { Vector3 } from './vector.js';

// ── Species ─────────────────────────────────────────────────────────

export type Species =
  | 'otter'
  | 'cat'
  | 'dog'
  | 'bunny'
  | 'bear'
  | 'fox'
  | 'penguin'
  | 'deer';

// ── Appearance ──────────────────────────────────────────────────────

export interface PlayerAppearance {
  species: Species;
  bodyColor: string;
  hatId?: string;
  faceId?: string;
  backId?: string;
}

// ── Input (client → server) ─────────────────────────────────────────

export interface PlayerInput {
  seq: number;
  timestamp: number;
  moveX: number;
  moveZ: number;
  jump: boolean;
  run: boolean;
  cameraYaw: number;
}

// ── Full authoritative state (server-side) ──────────────────────────

export interface PlayerState {
  id: string;
  displayName: string;
  position: Vector3;
  velocity: Vector3;
  rotation: number;
  grounded: boolean;
  moving: boolean;
  running: boolean;
  jumping: boolean;
  falling: boolean;
  emoteId: string | null;
  appearance: PlayerAppearance;
  lastInputSeq: number;
}

// ── Lightweight wire-format snapshot ────────────────────────────────

export type PlayerSnapshot = PlayerState;
