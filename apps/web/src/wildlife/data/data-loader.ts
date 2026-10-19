import speciesSpawnJson from '@pokemon/game-data/wildlife/species-spawn.json';
import spawnConfigJson from '@pokemon/game-data/wildlife/spawn-config.json';
import pokemonDbJson from '@pokemon/game-data/pokemon-db.json';
import type { SocialType } from '../model';

export interface HabitatEntry {
  biome: string;
  context: string;
  affinity: number;
}

export interface SpeciesSpawnDefinition {
  stage: number;
  flags: string[];
  rarityDelta: number;
  social: SocialType;
  habitats: HabitatEntry[];
  activeTime: string[];
  apexSpecies?: string;
  weather?: Record<string, number>;
}

export interface SpawnConfigDefinition {
  tierProbability: number[];
  stagePenalty: number[];
  shinyOdds: number;
  maxEntitiesPerChunk: number;
  groupsPerChunk: Record<string, [number, number]>;
  social: Record<string, [number, number]>;
  leaderBonus: [number, number];
  apex: {
    p0: number;
    pMax: number;
    levelBonus: [number, number];
    minDifficulty: number;
  };
  level: {
    l0: number;
    step: number;
    min: number;
    max: number;
    startZoneCap: number;
    startZoneRadius?: number;
  };
}

export interface SpeciesDbEntry {
  id: number;
  name: string;
  speciesKey: string;
  catchRate: number;
  types: string[];
  growthRate: string;
}

export const speciesSpawnData: Record<string, SpeciesSpawnDefinition> =
  speciesSpawnJson as unknown as Record<string, SpeciesSpawnDefinition>;

export const spawnConfigData: SpawnConfigDefinition =
  spawnConfigJson as unknown as SpawnConfigDefinition;

export const pokemonDbData = (pokemonDbJson as { pokemon: Record<string, SpeciesDbEntry> }).pokemon;

export function getSpeciesCatchRate(speciesKey: string): number {
  for (const entry of Object.values(pokemonDbData)) {
    if (entry.speciesKey === speciesKey) {
      return entry.catchRate;
    }
  }
  return 45;
}
