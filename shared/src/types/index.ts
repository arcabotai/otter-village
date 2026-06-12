export type { Vector3, Quaternion } from './vector.js';
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
} from './vector.js';

export type {
  Species,
  PlayerAppearance,
  PlayerInput,
  PlayerState,
  PlayerSnapshot,
} from './player.js';

export type {
  RoomVisibility,
  RoomConfig,
  RoomState,
  RoomListItem,
} from './room.js';

export type { EmoteId, EmoteDef } from './emote.js';
export { EMOTE_DEFS } from './emote.js';
