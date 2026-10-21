import biomesData from '@pokemon/game-data/biomes.json';

/** Runtime-facing metadata for the visual biomes registered by game-data. */
export interface BiomeConfig {
  name: string;
  hasBeach: boolean;
  hasRoad: boolean;
  defaultTree: string;
}

const registry = biomesData.biomes as Record<string, BiomeConfig>;

/** Single source of truth for visual biome metadata in the web client. */
export const BIOME_REGISTRY: Readonly<Record<string, BiomeConfig>> = Object.freeze({
  ...registry,
});

export const REGISTERED_BIOME_IDS = Object.freeze(Object.keys(BIOME_REGISTRY));

export function getBiomeConfig(biomeId: string): BiomeConfig | undefined {
  return BIOME_REGISTRY[biomeId];
}
