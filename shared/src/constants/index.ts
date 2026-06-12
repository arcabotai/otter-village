// ── Server & Network ────────────────────────────────────────────────
export const SERVER_TICK_RATE = 20;
export const SNAPSHOT_RATE = 20;
export const MAX_PLAYERS_PER_ROOM = 50;
export const INPUT_RATE_LIMIT = 60;
export const CHAT_RATE_LIMIT = 5;
export const CHAT_MAX_LENGTH = 200;
export const DISPLAY_NAME_MAX_LENGTH = 16;
export const DISPLAY_NAME_MIN_LENGTH = 1;
export const PROTOCOL_VERSION = 1;

// ── World ───────────────────────────────────────────────────────────
export const WORLD_SIZE = 100;
export const WORLD_BOUNDS_MIN = { x: -100, y: -10, z: -100 } as const;
export const WORLD_BOUNDS_MAX = { x: 100, y: 50, z: 100 } as const;
export const RESPAWN_Y = -10;

// ── Physics ─────────────────────────────────────────────────────────
export const GRAVITY = -20;
export const PLAYER_WALK_SPEED = 4;
export const PLAYER_RUN_SPEED = 8;
export const PLAYER_JUMP_FORCE = 8;
export const PLAYER_AIR_CONTROL = 0.3;
export const PLAYER_GROUND_FRICTION = 0.9;
export const PLAYER_AIR_FRICTION = 0.98;
export const COYOTE_TIME = 0.1;
export const JUMP_BUFFER_TIME = 0.15;

// ── Camera ──────────────────────────────────────────────────────────
export const CAMERA_DISTANCE = 12;
export const CAMERA_HEIGHT = 8;
export const CAMERA_MIN_PITCH = -30;
export const CAMERA_MAX_PITCH = 60;

// ── Visual / Timing ─────────────────────────────────────────────────
export const SNAPSHOT_INTERPOLATION_MS = 100;
export const EMOTE_DURATION = 3;
