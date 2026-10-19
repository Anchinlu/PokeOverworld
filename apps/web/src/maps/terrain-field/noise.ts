/**
 * Deterministic 2D Noise Engine (v0 World Architecture)
 *
 * Implements pure 32-bit integer hashing and smoothstep/quintic value noise / FBM.
 * STRICT INVARIANT I3: No transcendent functions (Math.sin/cos/tan/exp/log/pow/atan2).
 * STRICT INVARIANT I4: Full 32-bit seed entropy (no seed % 1000).
 */

/**
 * High-entropy 32-bit integer coordinate hash returning float in [0, 1).
 */
export function hash2(
  ix: number,
  iy: number,
  seed: number,
  salt: number
): number {
  let h =
    Math.imul(ix | 0, 0x27d4eb2d) ^
    Math.imul(iy | 0, 0x165667b1) ^
    Math.imul((seed ^ salt) | 0, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296; // [0, 1)
}

/**
 * Quintic fade curve (Ken Perlin): 6t^5 - 15t^4 + 10t^3.
 * Has zero first and second derivatives at t = 0 and t = 1, ensuring seamless C2 continuity.
 */
export function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * 2D Value Noise with quintic smooth interpolation.
 */
export function valueNoise2(
  x: number,
  y: number,
  seed: number,
  salt: number
): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);

  const a = hash2(x0, y0, seed, salt);
  const b = hash2(x0 + 1, y0, seed, salt);
  const c = hash2(x0, y0 + 1, seed, salt);
  const d = hash2(x0 + 1, y0 + 1, seed, salt);

  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/**
 * Fractional Brownian Motion (FBM) combining multiple octaves of value noise.
 * Returns normalized value in approximately [0, 1].
 */
export function fbm2(
  x: number,
  y: number,
  seed: number,
  salt: number,
  octaves = 4
): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2(x * freq, y * freq, seed, salt + i * 101);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }

  return norm > 0 ? sum / norm : 0;
}
