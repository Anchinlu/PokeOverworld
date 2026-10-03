import biomesData from '@pokemon/game-data/biomes.json';
import { seededHash } from '../noise';
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

export type EcologyZone = 'coast' | 'wetland' | 'meadow' | 'dryland' | 'dense_forest' | 'hill_edge';

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

export interface FlowerClusterPalette {
  primary: string[];
  secondary: string[];
}

export const ZONE_FLOWER_PALETTES: Record<EcologyZone, FlowerClusterPalette> = {
  wetland: {
    primary: ['flower_white', 'flower_blue'],
    secondary: ['flower_purple', 'plant_sprout'],
  },
  coast: {
    primary: ['flower_white', 'flower_blue'],
    secondary: ['plant_sprout'],
  },
  dryland: {
    primary: ['flower_red', 'flower_purple'],
    secondary: ['plant_sprout'],
  },
  dense_forest: {
    primary: ['flower_blue', 'flower_purple'],
    secondary: ['plant_sprout', 'flower_white'],
  },
  meadow: {
    primary: ['flower_red', 'flower_white'],
    secondary: ['flower_blue', 'plant_sprout'],
  },
  hill_edge: {
    primary: ['flower_white', 'plant_sprout'],
    secondary: ['flower_purple', 'flower_blue'],
  },
};

/**
 * Returns a flower/plant sprite type using cluster-based selection.
 * Flowers form color clusters with 1-2 primary dominant colors and 0-2 secondary colors.
 */
export function getFlowerTypeForCluster(
  zone: EcologyZone,
  clusterX: number,
  clusterY: number,
  tileRoll: number,
  seed: number
): string {
  const palette = ZONE_FLOWER_PALETTES[zone] || ZONE_FLOWER_PALETTES.meadow;
  const clusterRoll = seededHash(clusterX, clusterY, seed + 0x3341);
  const dominantFlower = palette.primary[Math.floor(clusterRoll * palette.primary.length)];

  // 75% use dominant color in cluster, 25% secondary
  if (tileRoll < 0.75 || palette.secondary.length === 0) {
    return dominantFlower;
  }
  const secIndex = Math.floor(((tileRoll - 0.75) / 0.25) * palette.secondary.length);
  return palette.secondary[Math.min(secIndex, palette.secondary.length - 1)];
}

/**
 * Natural Shrubs, Flowering Bushes & Conical Accent Flora Taxonomy
 */
export const ZONE_NATURAL_SHRUBS: Record<EcologyZone, string[]> = {
  meadow: ['bush_flowering_white', 'flower_purple_bell'],
  dense_forest: ['bush_cone_forest', 'bush_flowering_white'],
  wetland: ['flower_purple_bell', 'bush_cone_forest'],
  dryland: ['bush_cone_autumn'],
  hill_edge: ['bush_cone_autumn', 'bush_flowering_white'],
  coast: ['flower_purple_bell'],
};

export function getNaturalShrubForZone(zone: EcologyZone, roll: number): string {
  const pool = ZONE_NATURAL_SHRUBS[zone] || ZONE_NATURAL_SHRUBS.meadow;
  return pool[Math.floor(roll * pool.length)];
}
