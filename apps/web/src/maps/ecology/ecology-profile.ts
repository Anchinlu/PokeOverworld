import biomesData from '@pokemon/game-data/biomes.json';
import type { EcologySample } from './ecology-field';
import {
  DENSE_FOREST_DENSITY_THRESHOLD,
  DRYLAND_MOISTURE_THRESHOLD,
  DRYLAND_FERTILITY_THRESHOLD,
} from './ecology-config';

export const BIOME_DEFAULT_TREES = {
  coastal: biomesData.biomes.coastal.defaultTree,
  forest: biomesData.biomes.forest.defaultTree,
  autumn: biomesData.biomes.autumn.defaultTree,
  neutral: biomesData.biomes.route.defaultTree,
};

export type EcologyZone =
  | 'coast'
  | 'wetland'
  | 'meadow'
  | 'dryland'
  | 'dense_forest'
  | 'hill_edge';

/**
 * Classifies an ecology sample into an ecological zone.
 * Order:
 * 1. Coast (near sand) / Wetland (near water)
 * 2. Hill Edge (near cliffs/hills)
 * 3. Dense Forest (density >= threshold)
 * 4. Dryland (moisture <= threshold or fertility <= threshold)
 * 5. Meadow (neutral default)
 */
export function getEcologyZone(sample: EcologySample): EcologyZone {
  if (sample.nearSand) {
    return 'coast';
  }
  if (sample.nearWater) {
    return 'wetland';
  }
  if (sample.nearHill) {
    return 'hill_edge';
  }
  if (sample.density >= DENSE_FOREST_DENSITY_THRESHOLD) {
    return 'dense_forest';
  }
  if (
    sample.moisture <= DRYLAND_MOISTURE_THRESHOLD ||
    sample.fertility <= DRYLAND_FERTILITY_THRESHOLD
  ) {
    return 'dryland';
  }
  return 'meadow';
}

/**
  * Determines the tree type based on ecological sample and zone.
  * Rules per Section 5:
  * - Near sand/water -> 'coastal'
  * - density >= 0.68 -> 'deep'
  * - moisture <= 0.30 or fertility <= 0.30 -> 'autumn'
  * - Neutral meadow -> 'vibrant'
  */
export function getTreeTypeForEcology(sample: EcologySample, zone: EcologyZone): string {
  if (sample.nearSand || sample.nearWater || zone === 'coast') {
    return BIOME_DEFAULT_TREES.coastal;
  }
  if (sample.density >= DENSE_FOREST_DENSITY_THRESHOLD || zone === 'dense_forest') {
    return BIOME_DEFAULT_TREES.forest;
  }
  if (
    sample.moisture <= DRYLAND_MOISTURE_THRESHOLD ||
    sample.fertility <= DRYLAND_FERTILITY_THRESHOLD ||
    zone === 'dryland'
  ) {
    return BIOME_DEFAULT_TREES.autumn;
  }
  return BIOME_DEFAULT_TREES.neutral;
}
