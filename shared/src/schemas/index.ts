import type { PlayerInput } from '../types/player.js';
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  CHAT_MAX_LENGTH,
} from '../constants/index.js';

// ── String sanitisation ─────────────────────────────────────────────

const HTML_TAG_RE = /<[^>]*>/g;

/** Strip HTML tags, trim whitespace, and clamp to `CHAT_MAX_LENGTH`. */
export function sanitizeString(s: string): string {
  return s.replace(HTML_TAG_RE, '').trim().slice(0, CHAT_MAX_LENGTH);
}

// ── Display name ────────────────────────────────────────────────────

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < DISPLAY_NAME_MIN_LENGTH) {
    return `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} character.`;
  }
  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Display name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters.`;
  }
  if (/<[^>]*>/.test(trimmed)) {
    return 'Display name may not contain HTML tags.';
  }
  return null;
}

// ── Chat message ────────────────────────────────────────────────────

export function validateChatMessage(msg: string): string | null {
  const trimmed = msg.trim();
  if (trimmed.length === 0) {
    return 'Message cannot be empty.';
  }
  if (trimmed.length > CHAT_MAX_LENGTH) {
    return `Message must be at most ${CHAT_MAX_LENGTH} characters.`;
  }
  return null;
}

// ── Player input ────────────────────────────────────────────────────

export function validatePlayerInput(input: unknown): PlayerInput | null {
  if (input == null || typeof input !== 'object') return null;
  const obj = input as Record<string, unknown>;
  if (typeof obj.seq !== 'number' || !Number.isFinite(obj.seq)) return null;
  if (typeof obj.timestamp !== 'number' || !Number.isFinite(obj.timestamp)) return null;
  if (typeof obj.moveX !== 'number' || !Number.isFinite(obj.moveX)) return null;
  if (typeof obj.moveZ !== 'number' || !Number.isFinite(obj.moveZ)) return null;
  if (typeof obj.jump !== 'boolean') return null;
  if (typeof obj.run !== 'boolean') return null;
  if (typeof obj.cameraYaw !== 'number' || !Number.isFinite(obj.cameraYaw)) return null;
  return {
    seq: obj.seq,
    timestamp: obj.timestamp,
    moveX: obj.moveX,
    moveZ: obj.moveZ,
    jump: obj.jump,
    run: obj.run,
    cameraYaw: obj.cameraYaw,
  };
}
