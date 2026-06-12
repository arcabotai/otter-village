import type { PlayerInput, Vector3 } from '@otter-village/shared';
import {
  GRAVITY,
  PLAYER_WALK_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_JUMP_FORCE,
  PLAYER_AIR_CONTROL,
  COYOTE_TIME,
  WORLD_BOUNDS_MIN,
  WORLD_BOUNDS_MAX,
  RESPAWN_Y,
  clamp,
} from '@otter-village/shared';
import type { ServerPlayer } from '../state/PlayerState.js';
import { resetPlayer } from '../state/PlayerState.js';

export function simulatePlayer(
  player: ServerPlayer,
  input: PlayerInput,
  dt: number,
): void {
  // 1. Direction from input (camera-relative)
  const moveX = clamp(input.moveX, -1, 1);
  const moveZ = clamp(input.moveZ, -1, 1);

  // Rotate movement vector by camera yaw
  const cos = Math.cos(input.cameraYaw);
  const sin = Math.sin(input.cameraYaw);
  const dirX = moveX * cos - moveZ * sin;
  const dirZ = moveX * sin + moveZ * cos;

  // Normalize direction
  const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
  const nx = len > 0.001 ? dirX / len : 0;
  const nz = len > 0.001 ? dirZ / len : 0;

  // 2. Determine speed
  const speed = input.run ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
  const controlFactor = player.grounded ? 1.0 : PLAYER_AIR_CONTROL;

  // 3. Apply horizontal velocity
  player.velocity.x = nx * speed * controlFactor;
  player.velocity.z = nz * speed * controlFactor;

  // 4. Gravity
  player.velocity.y += GRAVITY * dt;

  // 5. Handle jump
  // Update coyote timer
  if (player.grounded) {
    player.coyoteTimer = COYOTE_TIME;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  // Jump buffer
  if (input.jump) {
    player.jumpBufferTimer = COYOTE_TIME;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }

  // Execute jump if buffered and can jump (grounded or coyote time)
  if (player.jumpBufferTimer > 0 && (player.grounded || player.coyoteTimer > 0)) {
    player.velocity.y = PLAYER_JUMP_FORCE;
    player.grounded = false;
    player.jumping = true;
    player.jumpBufferTimer = 0;
    player.coyoteTimer = 0;
    player.lastJumpTime = Date.now();
  }

  // 6. Update position
  player.position.x += player.velocity.x * dt;
  player.position.y += player.velocity.y * dt;
  player.position.z += player.velocity.z * dt;

  // 7. Ground collision
  if (player.position.y <= 0) {
    player.position.y = 0;
    player.velocity.y = 0;
    player.grounded = true;
    player.jumping = false;
    player.falling = false;
  } else {
    player.grounded = false;
  }

  // 8. World bounds clamping
  player.position.x = clamp(player.position.x, WORLD_BOUNDS_MIN.x, WORLD_BOUNDS_MAX.x);
  player.position.z = clamp(player.position.z, WORLD_BOUNDS_MIN.z, WORLD_BOUNDS_MAX.z);

  // 9. Respawn if fallen off the world
  if (player.position.y < RESPAWN_Y) {
    const spawn = { x: 0, y: 0, z: 0 };
    resetPlayer(player, spawn);
    return;
  }

  // 10. Update state flags
  player.moving = len > 0.001;
  player.running = player.moving && input.run;
  player.falling = !player.grounded && player.velocity.y < 0;

  // Update rotation to face movement direction
  if (player.moving) {
    player.rotation = Math.atan2(nx, nz);
  }

  // Emote timer decay
  if (player.emoteTimer !== null) {
    player.emoteTimer -= dt;
    if (player.emoteTimer <= 0) {
      player.emoteId = null;
      player.emoteTimer = null;
    }
  }

  // Track last input
  player.lastInputSeq = input.seq;
  player.lastInputTime = Date.now();
}
