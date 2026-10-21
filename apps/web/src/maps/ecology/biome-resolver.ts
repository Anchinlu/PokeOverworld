import type { TerrainField } from '../terrain-field';
import { sampleEcology } from './ecology-field';
import { getEcologyZone, type EcologyZone } from './ecology-profile';

/**
 * Resolves the gameplay biome used by wildlife spawning.
 *
 * Dark Land and desert are terrain-owned overrides. All remaining walkable
 * tiles use the deterministic ecology sample, so every caller sees the same
 * biome at the same coordinate.
 */
export function resolveWorldBiome(field: TerrainField, gx: number, gy: number): string {
  if (field.isDarkLand?.(gx, gy)) return 'dark_land';
  if (field.isDesert?.(gx, gy)) return 'dryland';
  if (field.isOcean(gx, gy)) return 'coast';
  if (field.isWater(gx, gy) || field.isLake?.(gx, gy)) return 'wetland';
  return getEcologyZone(sampleEcology(gx, gy, field));
}

export type RuntimeEcologyBiome = EcologyZone | 'dark_land';
