/**
 * Configuration and Tuning Constants for World Gen v0
 *
 * All parameters are calibrated for infinite 2D procedural generation.
 */

export const V0_CONFIG = {
  // Continentality (Continent / Ocean Macro Structure)
  CONT_SCALE: 400,
  CONT_SALT: 101,
  SEA_LEVEL: 0.48,

  // Start Village Forced Land Anchor
  START_ANCHOR_GX: 0,
  START_ANCHOR_GY: 0,
  LAND_R0: 330, // Strict 100% solid land radius
  LAND_R1: 500, // Smooth transition back to natural continentality
  LAND_BOOST: 0.15,

  // Coastal Beach Sand
  BEACH_WIDTH: 5, // Width of sand fringe facing ocean

  // Elevation & Mountain Plateaus
  ELEV_SCALE: 160,
  ELEV_SALT: 202,
  HILL_T: 0.58,
  CALM_R0: 120, // Zero hills within this radius from start anchor
  CALM_R1: 300, // Smooth ramp-up of hill probability

  // Spatial Partitioning and Plan Caching
  CHUNK_TILES: 16,
  PLAN_MARGIN: 16, // Extra boundary margin tiles for exact morphology
  MAX_CACHED_PLANS: 128,

  // 2D Settlements & Village Layouts (S6)
  REGION_TILES: 96,
  MIN_VILLAGE_DIST: 160,
  MIN_OCEAN_DIST: 12,
  VILLAGE_PROB: 0.70,
  VILLAGE_MARGIN: 6,
  VILLAGE_SALT: 777,
  VILLAGE_SALT_X: 778,
  VILLAGE_SALT_Y: 779,
  VILLAGE_SALT_TIER: 780,
} as const;

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
