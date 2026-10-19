import archetypesJson from '@pokemon/game-data/wildlife/behavior-archetypes.json';
import type { BehaviorProfile } from '../../model';
import { DEFAULT_BEHAVIOR_PROFILE } from './default-profile';

const archetypes = archetypesJson as unknown as Record<string, BehaviorProfile>;

/**
 * Looks up behavior profile by archetype ID or species behavior key.
 * Falls back to curious_rodent default profile if unrecognized.
 */
export function getBehaviorProfile(id: string): BehaviorProfile {
  return archetypes[id] ?? DEFAULT_BEHAVIOR_PROFILE;
}

export function getAllBehaviorArchetypes(): Record<string, BehaviorProfile> {
  return archetypes;
}
