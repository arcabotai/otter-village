// ── Emote IDs ───────────────────────────────────────────────────────

export type EmoteId =
  | 'wave'
  | 'dance'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'love'
  | 'laugh'
  | 'thumbsup'
  | 'thinking'
  | 'cool';

// ── Definitions ─────────────────────────────────────────────────────

export interface EmoteDef {
  emoji: string;
  label: string;
  duration: number;
}

const DURATION = 3; // EMOTE_DURATION – kept inline to avoid cross-module dep

export const EMOTE_DEFS: Record<EmoteId, EmoteDef> = {
  wave:     { emoji: '👋', label: 'Wave',      duration: DURATION },
  dance:    { emoji: '💃', label: 'Dance',     duration: DURATION },
  happy:    { emoji: '😊', label: 'Happy',     duration: DURATION },
  sad:      { emoji: '😢', label: 'Sad',       duration: DURATION },
  angry:    { emoji: '😠', label: 'Angry',     duration: DURATION },
  love:     { emoji: '❤️',  label: 'Love',      duration: DURATION },
  laugh:    { emoji: '😂', label: 'Laugh',     duration: DURATION },
  thumbsup: { emoji: '👍', label: 'Thumbs Up', duration: DURATION },
  thinking: { emoji: '🤔', label: 'Thinking',  duration: DURATION },
  cool:     { emoji: '😎', label: 'Cool',      duration: DURATION },
};
