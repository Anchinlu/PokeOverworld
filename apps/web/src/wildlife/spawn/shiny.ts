import { spawnConfigData } from '../data/data-loader';

/**
 * 5-tuple deterministic integer hash without transcendental functions.
 * Computes reproducible values in [0.0, 1.0).
 */
export function hashWildlife(
  seed: number,
  cx: number,
  cy: number,
  slot: number,
  salt: number
): number {
  let n = (Math.imul(cx, 374761393) + Math.imul(cy, 668265263) + Math.imul(seed, 962458823)) >>> 0;
  n = (Math.imul(n, 1274126177) + Math.imul(slot, 1013904223) + Math.imul(salt, 672804213)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/**
 * Determines whether an entity in a given chunk and slot is Shiny.
 * Deterministic across all multiplayer clients and chunk reloads.
 * Default odds: 1/4096 (replaces old 5% rate per Section 2.4).
 */
export function isEntityShiny(
  seed: number,
  cx: number,
  cy: number,
  slot: number,
  shinyOdds?: number
): boolean {
  const odds = shinyOdds ?? spawnConfigData.shinyOdds ?? 4096;
  const roll = hashWildlife(seed, cx, cy, slot, 9999);
  return roll < 1.0 / odds;
}
