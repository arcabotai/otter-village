import type { Vector3, PlayerAppearance, PlayerSnapshot } from '@otter-village/shared';
import { v4 as uuidv4 } from 'uuid';

export interface ServerPlayer {
  id: string;
  socketId: string;
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
  emoteTimer: number | null;
  appearance: PlayerAppearance;
  lastInputSeq: number;
  lastInputTime: number;
  chatRateTokens: number;
  inputRateTokens: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  lastJumpTime: number;
}

export function createServerPlayer(
  socketId: string,
  displayName: string,
  appearance: PlayerAppearance,
  spawnPos: Vector3,
): ServerPlayer {
  return {
    id: uuidv4(),
    socketId,
    displayName,
    position: { ...spawnPos },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: 0,
    grounded: true,
    moving: false,
    running: false,
    jumping: false,
    falling: false,
    emoteId: null,
    emoteTimer: null,
    appearance,
    lastInputSeq: 0,
    lastInputTime: Date.now(),
    chatRateTokens: 5,
    inputRateTokens: 60,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    lastJumpTime: 0,
  };
}

export function resetPlayer(player: ServerPlayer, spawnPos: Vector3): void {
  player.position = { ...spawnPos };
  player.velocity = { x: 0, y: 0, z: 0 };
  player.rotation = 0;
  player.grounded = true;
  player.moving = false;
  player.running = false;
  player.jumping = false;
  player.falling = false;
  player.emoteId = null;
  player.emoteTimer = null;
  player.coyoteTimer = 0;
  player.jumpBufferTimer = 0;
}

export function playerToSnapshot(player: ServerPlayer): PlayerSnapshot {
  return {
    id: player.id,
    displayName: player.displayName,
    position: { ...player.position },
    velocity: { ...player.velocity },
    rotation: player.rotation,
    grounded: player.grounded,
    moving: player.moving,
    running: player.running,
    jumping: player.jumping,
    falling: player.falling,
    emoteId: player.emoteId,
    appearance: player.appearance,
    lastInputSeq: player.lastInputSeq,
  };
}
