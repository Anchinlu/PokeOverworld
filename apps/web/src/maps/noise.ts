/**
 * Deterministic 2D PRNG (Murmur-style integer hash).
 * Returns a float in [0.0, 1.0) for any (x, y, seed) tuple.
 */
export function seededHash(x: number, y: number, seed: number): number {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 962458823)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
