import type { PlayerAppearance, PlayerInput, PlayerSnapshot } from '../types/player.js';
import type { Vector3 } from '../types/vector.js';
import type { EmoteId } from '../types/emote.js';
import type { RoomListItem } from '../types/room.js';

// ═══════════════════════════════════════════════════════════════════
//  Client → Server events
// ═══════════════════════════════════════════════════════════════════

export interface JoinRoom {
  type: 'JoinRoom';
  roomId: string;
  displayName: string;
  appearance: PlayerAppearance;
}

export interface LeaveRoom {
  type: 'LeaveRoom';
}

export interface PlayerInputEvent {
  type: 'PlayerInput';
  input: PlayerInput;
}

export interface ChatMessage {
  type: 'ChatMessage';
  content: string;
}

export interface Emote {
  type: 'Emote';
  emoteId: EmoteId;
}

export interface CancelEmote {
  type: 'CancelEmote';
}

export interface ListRooms {
  type: 'ListRooms';
}

export interface Ping {
  type: 'Ping';
  clientTime: number;
}

/** Discriminated union of all client→server events. */
export type ClientEvent =
  | JoinRoom
  | LeaveRoom
  | PlayerInputEvent
  | ChatMessage
  | Emote
  | CancelEmote
  | ListRooms
  | Ping;

// ═══════════════════════════════════════════════════════════════════
//  Server → Client events
// ═══════════════════════════════════════════════════════════════════

export interface RoomJoined {
  type: 'RoomJoined';
  playerId: string;
  room: RoomListItem;
  players: PlayerSnapshot[];
}

export interface Snapshot {
  type: 'Snapshot';
  players: PlayerSnapshot[];
  tick: number;
}

export interface Correction {
  type: 'Correction';
  playerId: string;
  position: Vector3;
  velocity: Vector3;
  lastInputSeq: number;
}

export interface PlayerJoined {
  type: 'PlayerJoined';
  player: PlayerSnapshot;
}

export interface PlayerLeft {
  type: 'PlayerLeft';
  playerId: string;
  displayName: string;
}

export interface ChatBroadcast {
  type: 'ChatBroadcast';
  playerId: string;
  displayName: string;
  content: string;
  timestamp: number;
}

export interface EmoteBroadcast {
  type: 'EmoteBroadcast';
  playerId: string;
  emoteId: EmoteId;
}

export interface EmoteCancelled {
  type: 'EmoteCancelled';
  playerId: string;
}

export interface RoomList {
  type: 'RoomList';
  rooms: RoomListItem[];
}

export interface Pong {
  type: 'Pong';
  clientTime: number;
  serverTime: number;
}

export interface ErrorEvent {
  type: 'Error';
  code: string;
  message: string;
}

/** Discriminated union of all server→client events. */
export type ServerEvent =
  | RoomJoined
  | Snapshot
  | Correction
  | PlayerJoined
  | PlayerLeft
  | ChatBroadcast
  | EmoteBroadcast
  | EmoteCancelled
  | RoomList
  | Pong
  | ErrorEvent;
