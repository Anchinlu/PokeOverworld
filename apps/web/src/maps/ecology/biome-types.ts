/**
 * Biomes that can be returned by the runtime world resolver.
 *
 * Keep terrain features such as hills, rivers and lakes outside this union:
 * they describe the shape of the map, not the ecological identity of a tile.
 */
export const RUNTIME_BIOME_IDS = [
  'meadow',
  'wetland',
  'coast',
  'dryland',
  'light_forest',
  'dense_forest',
  'dark_land',
  'autumn',
  'snow',
] as const;

export type RuntimeBiomeId = (typeof RUNTIME_BIOME_IDS)[number];

/** Terrain features are orthogonal to RuntimeBiomeId. */
export type TerrainFeature = 'ocean' | 'sand' | 'hill' | 'river' | 'lake' | 'road' | 'bridge';
