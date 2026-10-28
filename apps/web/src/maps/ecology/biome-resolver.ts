import type { TerrainField } from '../terrain-field';
import { sampleEcology } from './ecology-field';
import { getEcologyZone } from './ecology-profile';
import type { RuntimeBiomeId } from './biome-types';

/**
 * Resolves the gameplay biome used by wildlife spawning.
 *
 * Dark Land and desert are terrain-owned overrides. All remaining walkable
 * tiles use the deterministic ecology sample, so every caller sees the same
 * biome at the same coordinate.
 */
export function resolveWorldBiome(field: TerrainField, gx: number, gy: number): RuntimeBiomeId {
  if (!field) return 'meadow';
  if (field.isSnow?.(gx, gy)) return 'snow';
  if (field.isAutumn?.(gx, gy)) return 'autumn';
  if (field.isApricornPlain?.(gx, gy)) return 'apricorn_plain';
  if (field.isDarkLand?.(gx, gy)) return 'dark_land';
  if (field.isDesert?.(gx, gy)) return 'dryland';
  if (field.isOcean(gx, gy)) return 'coast';
  if (field.isWater(gx, gy) || field.isLake?.(gx, gy)) return 'wetland';
  if (field.isRockyHighland?.(gx, gy)) return 'hill_edge';
  const zone = getEcologyZone(sampleEcology(gx, gy, field));
  // `desert` and `hill_edge` are legacy ecology labels. V4 exposes desert as
  // dryland and keeps hills as terrain features over the underlying ecology.
  if (zone === 'desert') return 'dryland';
  if (zone === 'hill_edge') return 'meadow';
  return zone;
}
