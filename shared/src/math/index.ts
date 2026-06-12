// Re-export everything from vector types
export type { Vector3, Quaternion } from '../types/vector.js';
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
} from '../types/vector.js';

// ── Additional math utilities ───────────────────────────────────────

/**
 * Mulberry32 seeded PRNG.
 * Returns a function that produces uniformly-distributed floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Remap `value` from `[inMin, inMax]` to `[outMin, outMax]`. */
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}
