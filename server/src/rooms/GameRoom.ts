import type { Socket } from 'socket.io';
import type {
  Vector3,
  PlayerAppearance,
  PlayerSnapshot,
  ServerEvent,
  EmoteId,
} from '@otter-village/shared';
import {
  mulberry32,
  EMOTE_DEFS,
  MAX_PLAYERS_PER_ROOM,
  WORLD_BOUNDS_MIN,
  WORLD_BOUNDS_MAX,
} from '@otter-village/shared';
import type { ServerPlayer } from '../state/PlayerState.js';
import { createServerPlayer, playerToSnapshot } from '../state/PlayerState.js';
import { simulatePlayer } from '../simulation/PlayerSimulation.js';

const TICK_INTERVAL_MS = 1000 / 20;
const SNAPSHOT_EVERY = 1; // send snapshot every tick (20 Hz)

export class GameRoom {
  readonly id: string;
  readonly name: string;
  readonly maxPlayers: number;
  readonly players: Map<string, ServerPlayer> = new Map();

  private sockets: Map<string, Socket> = new Map();
  private seed: number;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private tickCount: number = 0;
  private playerIndex: number = 0;

  private pendingInputs: Map<string, Array<{ seq: number; dt: number; input: import('@otter-village/shared').PlayerInput }>> = new Map();

  constructor(id: string, name: string, maxPlayers = MAX_PLAYERS_PER_ROOM) {
    this.id = id;
    this.name = name;
    this.maxPlayers = maxPlayers;
    this.seed = hashString(id);
  }

  addPlayer(socket: Socket, displayName: string, appearance: PlayerAppearance): ServerPlayer {
    const spawnPos = this.getSpawnPosition();
    const player = createServerPlayer(socket.id, displayName, appearance, spawnPos);
    this.players.set(player.id, player);
    this.sockets.set(socket.id, socket);
    this.pendingInputs.set(player.id, []);
    this.playerIndex++;

    // Start ticking if first player
    if (this.players.size === 1) {
      this.startTicking();
    }

    return player;
  }

  removePlayer(socketId: string): void {
    // Find player by socketId
    let playerId: string | null = null;
    for (const [id, p] of this.players) {
      if (p.socketId === socketId) {
        playerId = id;
        break;
      }
    }
    if (playerId) {
      this.players.delete(playerId);
      this.pendingInputs.delete(playerId);
    }
    this.sockets.delete(socketId);

    // Stop ticking if no players
    if (this.players.size === 0) {
      this.stopTicking();
    }
  }

  findPlayerBySocket(socketId: string): ServerPlayer | undefined {
    for (const p of this.players.values()) {
      if (p.socketId === socketId) return p;
    }
    return undefined;
  }

  getSnapshot(): PlayerSnapshot[] {
    const snapshots: PlayerSnapshot[] = [];
    for (const player of this.players.values()) {
      snapshots.push(playerToSnapshot(player));
    }
    return snapshots;
  }

  broadcast(event: ServerEvent, excludeSocketId?: string): void {
    for (const [sid, socket] of this.sockets) {
      if (sid !== excludeSocketId) {
        socket.emit('event', event);
      }
    }
  }

  broadcastChat(playerId: string, displayName: string, content: string): void {
    const event: ServerEvent = {
      type: 'ChatBroadcast',
      playerId,
      displayName,
      content,
      timestamp: Date.now(),
    };
    this.broadcast(event);
  }

  broadcastEmote(playerId: string, emoteId: EmoteId): void {
    const event: ServerEvent = {
      type: 'EmoteBroadcast',
      playerId,
      emoteId,
    };
    this.broadcast(event);
  }

  startTicking(): void {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  stopTicking(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  queueInput(playerId: string, input: import('@otter-village/shared').PlayerInput): void {
    const queue = this.pendingInputs.get(playerId);
    if (!queue) return;
    queue.push({ seq: input.seq, dt: TICK_INTERVAL_MS / 1000, input });
  }

  private tick(): void {
    const dt = TICK_INTERVAL_MS / 1000;
    this.tickCount++;

    // Process inputs for each player
    for (const player of this.players.values()) {
      const queue = this.pendingInputs.get(player.id);
      if (queue && queue.length > 0) {
        // Process the latest input (drop older queued ones for simplicity)
        const latest = queue[queue.length - 1];
        queue.length = 0;

        // Validate seq is newer
        if (latest.input.seq > player.lastInputSeq) {
          simulatePlayer(player, latest.input, dt);
        }
      } else {
        // No input: still simulate gravity/physics
        simulateIdle(player, dt);
      }
    }

    // Broadcast snapshot every tick (20 Hz)
    if (this.tickCount % SNAPSHOT_EVERY === 0) {
      const snapshot: ServerEvent = {
        type: 'Snapshot',
        players: this.getSnapshot(),
        tick: this.tickCount,
      };
      this.broadcast(snapshot);
    }
  }

  getSpawnPosition(): Vector3 {
    const rng = mulberry32(this.seed + this.playerIndex);
    const spread = 5;
    return {
      x: (rng() - 0.5) * spread * 2,
      y: 0,
      z: (rng() - 0.5) * spread * 2,
    };
  }
}

function simulateIdle(player: ServerPlayer, dt: number): void {
  // Apply gravity when in air
  if (!player.grounded) {
    player.velocity.y += -20 * dt;
    player.position.y += player.velocity.y * dt;

    if (player.position.y <= 0) {
      player.position.y = 0;
      player.velocity.y = 0;
      player.grounded = true;
      player.jumping = false;
      player.falling = false;
    }

    // Respawn if fallen
    if (player.position.y < -10) {
      player.position = { x: 0, y: 0, z: 0 };
      player.velocity = { x: 0, y: 0, z: 0 };
      player.grounded = true;
      player.jumping = false;
      player.falling = false;
    }
  }

  // Decay horizontal velocity
  player.velocity.x *= 0.9;
  player.velocity.z *= 0.9;
  player.moving = false;
  player.running = false;

  // Emote timer decay
  if (player.emoteTimer !== null) {
    player.emoteTimer -= dt;
    if (player.emoteTimer <= 0) {
      player.emoteId = null;
      player.emoteTimer = null;
    }
  }
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs(hash);
}
