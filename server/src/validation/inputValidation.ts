import type { PlayerInput } from '@otter-village/shared';
import { validatePlayerInput, INPUT_RATE_LIMIT } from '@otter-village/shared';
import type { ServerPlayer } from '../state/PlayerState.js';

export function validateInput(data: unknown): PlayerInput | null {
  return validatePlayerInput(data);
}

export function isInputRateLimited(player: ServerPlayer): boolean {
  const now = Date.now();
  const elapsed = (now - player.lastInputTime) / 1000;
  // Refill tokens: one token per (1 / INPUT_RATE_LIMIT) seconds
  player.inputRateTokens = Math.min(
    INPUT_RATE_LIMIT,
    player.inputRateTokens + elapsed * INPUT_RATE_LIMIT,
  );

  if (player.inputRateTokens < 1) {
    return true;
  }

  player.inputRateTokens -= 1;
  player.lastInputTime = now;
  return false;
}

export function isMovementReasonable(_player: ServerPlayer, input: PlayerInput): boolean {
  // Check that movement axes are in valid range
  if (Math.abs(input.moveX) > 1.01 || Math.abs(input.moveZ) > 1.01) {
    return false;
  }
  // Check camera yaw is finite
  if (!Number.isFinite(input.cameraYaw)) {
    return false;
  }
  return true;
}
