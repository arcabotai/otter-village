import {
  validateChatMessage,
  sanitizeString,
  CHAT_RATE_LIMIT,
} from '@otter-village/shared';
import type { ServerPlayer } from '../state/PlayerState.js';

export function validateChat(
  player: ServerPlayer,
  content: string,
): { valid: boolean; error?: string; sanitized?: string } {
  // Check rate limit first
  if (isChatRateLimited(player)) {
    return { valid: false, error: 'Rate limited. Please slow down.' };
  }

  // Validate message content
  const error = validateChatMessage(content);
  if (error) {
    return { valid: false, error };
  }

  const sanitized = sanitizeString(content);
  if (sanitized.length === 0) {
    return { valid: false, error: 'Message cannot be empty after sanitization.' };
  }

  return { valid: true, sanitized };
}

export function isChatRateLimited(player: ServerPlayer): boolean {
  const now = Date.now();
  const elapsed = (now - player.lastInputTime) / 1000;
  // Refill tokens: CHAT_RATE_LIMIT per second
  player.chatRateTokens = Math.min(
    CHAT_RATE_LIMIT,
    player.chatRateTokens + elapsed * CHAT_RATE_LIMIT,
  );

  if (player.chatRateTokens < 1) {
    return true;
  }

  player.chatRateTokens -= 1;
  return false;
}
