import type { PlayerState } from './player.js';

// ── Visibility ──────────────────────────────────────────────────────

export type RoomVisibility = 'public' | 'private';

// ── Config ──────────────────────────────────────────────────────────

export interface RoomConfig {
  id: string;
  name: string;
  maxPlayers: number;
  visibility: RoomVisibility;
}

// ── Full room state (server-side) ───────────────────────────────────

export interface RoomState {
  config: RoomConfig;
  players: Map<string, PlayerState>;
}

// ── Lightweight list item (for room browser) ────────────────────────

export interface RoomListItem {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  visibility: RoomVisibility;
}
