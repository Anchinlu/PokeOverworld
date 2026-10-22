/**
 * World Gen v4/v5 configuration.
 *
 * V4 replaces the radial V3 valley with a multi-scale continental field. The
 * macro plan selects a deterministic home continent; tile queries then add
 * local detail without forcing terrain to be circular around the spawn.
 */

import { fbm2 } from './noise';

export type V4LandmassProfile = 'classic' | 'natural-landmass';

/**
 * Landmass profiles are deliberately opt-in. The classic profile preserves
 * existing V4 saves; natural-landmass is used for preview/QA until its output
 * is promoted to a new save-compatible world generation version.
 */
export const V4_LANDMASS_PROFILES = {
  classic: {
    seaLevel: 0.52,
    coastEdgeScale: 96,
    coastEdgeWeight: 0.045,
    coastOpenRadius: 1,
    coastCloseRadius: 1,
  },
  'natural-landmass': {
    // Slightly raise sea level so v5 forms more separated continents and
    // islands instead of one oversized landmass filling the preview window.
    seaLevel: 0.56,
    coastEdgeScale: 72,
    coastEdgeWeight: 0.075,
    // Preserve narrow peninsulas and small bays while still closing isolated
    // one-tile holes in the land mask.
    coastOpenRadius: 0,
    coastCloseRadius: 1,
  },
} as const satisfies Record<
  V4LandmassProfile,
  {
    seaLevel: number;
    coastEdgeScale: number;
    coastEdgeWeight: number;
    coastOpenRadius: number;
    coastCloseRadius: number;
  }
>;

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
  COAST_EDGE_SCALE: 96,
  COAST_EDGE_WEIGHT: 0.045,
  BIOME_EDGE_SCALE: 110,
  BIOME_EDGE_WEIGHT: 0.075,
  BIOME_EDGE_SALT: 4210,

  // The scan is deliberately finite and coarse. The runtime world remains
  // infinite; this window is only used to choose and center the home landmass.
  // Keep a generous buffer around the playable origin so a selected
  // continent is not clipped by the finite macro scan window.
  HOME_SCAN_MIN_MX: -96,
  HOME_SCAN_MAX_MX: 95,
  HOME_SCAN_MIN_MY: -72,
  HOME_SCAN_MAX_MY: 71,
  HOME_AREA_MIN_CELLS: 900,
  HOME_AREA_MAX_CELLS: 3600,
  ISLAND_MIN_CELLS: 8,
  ISLAND_MAX_CELLS: 360,

  // The start location is selected from a genuinely flat area during macro
  // planning. Keep only a small local guard for the village footprint.
  START_CORE_RADIUS: 16,
  START_SEARCH_RADIUS: 20,
  START_LAND_THRESHOLD: 0.64,
  START_HILL_THRESHOLD: 0.58,

  BEACH_WIDTH: 5,
  HILL_SCALE: 160,
  HILL_SALT: 4201,
  HILL_THRESHOLD: 0.64,
  // Low-frequency region fields keep biomes in geographic basins instead of
  // producing isolated noise islands. Detail is mixed back in by V4TerrainPlan.
  DESERT_SCALE: 180,
  DESERT_SALT: 4202,
  DESERT_THRESHOLD: 0.68,
  DARK_SCALE: 180,
  DARK_SALT: 4203,
  DARK_THRESHOLD: 0.69,
  AUTUMN_SCALE: 180,
  AUTUMN_SALT: 4204,
  AUTUMN_THRESHOLD: 0.68,
  SNOW_SCALE: 180,
  SNOW_SALT: 4205,
  // Snow should be discoverable on the default/test seeds while remaining a
  // broad regional biome rather than isolated noise pixels.
  SNOW_THRESHOLD: 0.58,
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
