import archetypesJson from '@pokemon/game-data/wildlife/behavior-archetypes.json';
import speciesBehaviorJson from '@pokemon/game-data/wildlife/species-behavior.json';
import type { BehaviorProfile } from '../../model';
import { DEFAULT_BEHAVIOR_PROFILE } from './default-profile';

const archetypes = archetypesJson as unknown as Record<string, BehaviorProfile>;
type SpeciesBehaviorGroup = {
  id: string;
  profile: string;
  species: string[];
  activity?: BehaviorProfile['activity'];
  temperament?: BehaviorProfile['temperament'];
  tags?: string[];
  weather?: Record<string, number>;
};

const speciesBehaviorGroups = (speciesBehaviorJson as unknown as { groups: SpeciesBehaviorGroup[] })
  .groups;
const defaultProfileId = (speciesBehaviorJson as unknown as { defaultProfile: string })
  .defaultProfile;
const speciesBehaviorIndex = new Map<string, SpeciesBehaviorGroup>();

for (const group of speciesBehaviorGroups) {
  for (const speciesKey of group.species) {
    speciesBehaviorIndex.set(speciesKey, group);
  }
}

/**
 * Looks up behavior profile by archetype ID or species behavior key.
 * Falls back to curious_rodent default profile if unrecognized.
 */
export function getBehaviorProfile(id: string): BehaviorProfile {
  return archetypes[id] ?? DEFAULT_BEHAVIOR_PROFILE;
}

/** Resolves the complete runtime profile for one species. */
export function getBehaviorProfileForSpecies(speciesKey: string): BehaviorProfile {
  const group = speciesBehaviorIndex.get(speciesKey.toUpperCase());
  const base = getBehaviorProfile(group?.profile ?? defaultProfileId);

  return {
    ...base,
    id: group?.id ?? base.id,
    activity: group?.activity ?? base.activity,
    temperament: group?.temperament ?? base.temperament,
    tags: group?.tags ?? base.tags,
    weather: group?.weather ?? base.weather,
  };
}

export function getSpeciesBehaviorId(speciesKey: string): string {
  return speciesBehaviorIndex.get(speciesKey.toUpperCase())?.profile ?? defaultProfileId;
}

export function getSpeciesBehaviorDefinition(speciesKey: string): SpeciesBehaviorGroup | undefined {
  return speciesBehaviorIndex.get(speciesKey.toUpperCase());
}

export function getSpeciesBehaviorCoverage(): readonly string[] {
  return [...speciesBehaviorIndex.keys()];
}

export function getAllBehaviorArchetypes(): Record<string, BehaviorProfile> {
  return archetypes;
}
