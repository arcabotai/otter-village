// ── Constants ────────────────────────────────────────────────────────
export {
  SERVER_TICK_RATE,
  SNAPSHOT_RATE,
  MAX_PLAYERS_PER_ROOM,
  INPUT_RATE_LIMIT,
  CHAT_RATE_LIMIT,
  CHAT_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  WORLD_SIZE,
  WORLD_BOUNDS_MIN,
  WORLD_BOUNDS_MAX,
  RESPAWN_Y,
  GRAVITY,
  PLAYER_WALK_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_JUMP_FORCE,
  PLAYER_AIR_CONTROL,
  PLAYER_GROUND_FRICTION,
  PLAYER_AIR_FRICTION,
  COYOTE_TIME,
  JUMP_BUFFER_TIME,
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  CAMERA_MIN_PITCH,
  CAMERA_MAX_PITCH,
  SNAPSHOT_INTERPOLATION_MS,
  EMOTE_DURATION,
  PROTOCOL_VERSION,
} from './constants/index.js';

// ── Types ────────────────────────────────────────────────────────────
export type { Vector3, Quaternion } from './types/vector.js';
export {
  vec3,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3Normalize,
  vec3Distance,
  vec3Lerp,
  quatFromEuler,
  clamp,
  lerp,
  smoothDamp,
} from './types/vector.js';

export type {
  Species,
  PlayerAppearance,
  PlayerInput,
  PlayerState,
  PlayerSnapshot,
} from './types/player.js';

export type {
  RoomVisibility,
  RoomConfig,
  RoomState,
  RoomListItem,
} from './types/room.js';

export type { EmoteId, EmoteDef } from './types/emote.js';
export { EMOTE_DEFS } from './types/emote.js';

// ── Protocol ─────────────────────────────────────────────────────────
export type {
  JoinRoom,
  LeaveRoom,
  PlayerInputEvent,
  ChatMessage,
  Emote,
  CancelEmote,
  ListRooms,
  Ping,
  ClientEvent,
  RoomJoined,
  Snapshot,
  Correction,
  PlayerJoined,
  PlayerLeft,
  ChatBroadcast,
  EmoteBroadcast,
  EmoteCancelled,
  RoomList,
  Pong,
  ErrorEvent,
  ServerEvent,
} from './protocol/events.js';

// ── Math ─────────────────────────────────────────────────────────────
export { mulberry32, remap } from './math/index.js';

// ── Schemas / Validation ─────────────────────────────────────────────
export {
  sanitizeString,
  validateDisplayName,
  validateChatMessage,
  validatePlayerInput,
} from './schemas/index.js';
