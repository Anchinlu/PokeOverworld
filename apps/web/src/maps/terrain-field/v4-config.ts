/**
 * World Gen v4 configuration.
 *
 * V4 replaces the radial V3 valley with a multi-scale continental field. The
 * macro plan selects a deterministic home continent; tile queries then add
 * local detail without forcing terrain to be circular around the spawn.
 */

import { fbm2 } from './noise';

export const V4_CONFIG = {
  VERSION: 4,
  CELL_SIZE: 32,
  PLAN_MARGIN: 16,
  CHUNK_TILES: 16,
  MAX_CACHED_PLANS: 128,

  // Macro geography. Values are world tiles, not chunks.
  MACRO_SCALE: 1450,
  DETAIL_SCALE: 420,
  WARP_SCALE: 900,
  WARP_AMPLITUDE: 600,
  SEA_LEVEL: 0.52,
  MACRO_WEIGHT: 0.62,
  DETAIL_WEIGHT: 0.38,
  MACRO_SALT: 4101,
  WARP_X_SALT: 4102,
  WARP_Y_SALT: 4103,
  DETAIL_SALT: 4104,

  // The scan is deliberately finite and coarse. The runtime world remains
  // infinite; this window is only used to choose and center the home landmass.
  HOME_SCAN_MIN_MX: -64,
  HOME_SCAN_MAX_MX: 63,
  HOME_SCAN_MIN_MY: -48,
  HOME_SCAN_MAX_MY: 47,
  HOME_AREA_MIN_CELLS: 900,
  HOME_AREA_MAX_CELLS: 3600,

  // Only the starter settlement gets a local safety guarantee. This is not a
  // world-shaped land mask and therefore cannot create a giant circular map.
  START_CORE_RADIUS: 24,

  BEACH_WIDTH: 5,
  HILL_SCALE: 160,
  HILL_SALT: 4201,
  HILL_THRESHOLD: 0.64,
  DESERT_SCALE: 180,
  DESERT_SALT: 4202,
  DESERT_THRESHOLD: 0.68,
  DARK_SCALE: 180,
  DARK_SALT: 4203,
  DARK_THRESHOLD: 0.69,
} as const;

export interface V4SourceOffset {
  readonly gx: number;
  readonly gy: number;
}

/** Samples the continuous macro/detail continental field in source space. */
export function sampleV4ContinentalValue(sourceGX: number, sourceGY: number, seed: number): number {
  const macro = fbm2(
    sourceGX / V4_CONFIG.MACRO_SCALE,
    sourceGY / V4_CONFIG.MACRO_SCALE,
    seed,
    V4_CONFIG.MACRO_SALT,
    3
  );

  const warpX =
    (fbm2(
      sourceGX / V4_CONFIG.WARP_SCALE,
      sourceGY / V4_CONFIG.WARP_SCALE,
      seed,
      V4_CONFIG.WARP_X_SALT,
      3
    ) -
      0.5) *
    V4_CONFIG.WARP_AMPLITUDE;
  const warpY =
    (fbm2(
      sourceGX / V4_CONFIG.WARP_SCALE,
      sourceGY / V4_CONFIG.WARP_SCALE,
      seed,
      V4_CONFIG.WARP_Y_SALT,
      3
    ) -
      0.5) *
    V4_CONFIG.WARP_AMPLITUDE;

  const detail = fbm2(
    (sourceGX + warpX) / V4_CONFIG.DETAIL_SCALE,
    (sourceGY + warpY) / V4_CONFIG.DETAIL_SCALE,
    seed,
    V4_CONFIG.DETAIL_SALT,
    5
  );

  return V4_CONFIG.MACRO_WEIGHT * macro + V4_CONFIG.DETAIL_WEIGHT * detail;
}

export function isV4SourceLand(sourceGX: number, sourceGY: number, seed: number): boolean {
  return sampleV4ContinentalValue(sourceGX, sourceGY, seed) >= V4_CONFIG.SEA_LEVEL;
}
