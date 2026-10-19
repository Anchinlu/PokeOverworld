import { spawnConfigData, type SpeciesSpawnDefinition } from '../data/data-loader';
import type { WildRole } from '../model';
import { calculateEntityLevel } from './level-model';

export interface ComposedIndividual {
  speciesKey: string;
  role: WildRole;
  level: number;
}

export interface HerdComposition {
  speciesKey: string;
  individuals: ComposedIndividual[];
}

/**
 * Determines group size from species social configuration.
 */
export function getGroupSize(social: string, roll01: number): number {
  if (social === 'solitary') return 1;
  const bounds = spawnConfigData.social[social];
  if (!bounds) return 1;
  const [min, max] = bounds;
  return min + Math.floor(roll01 * (max - min + 1));
}

/**
 * Evaluates whether an apex predator should appear for this group.
 * Section 4.2b: pApex = clamp(P0 + K * (difficulty - D0), 0, PMAX)
 */
export function shouldSpawnApex(params: {
  speciesDef: SpeciesSpawnDefinition;
  difficulty: number;
  isStartZone: boolean;
  apexRoll01: number;
}): boolean {
  const { speciesDef, difficulty, isStartZone, apexRoll01 } = params;
  if (!speciesDef.apexSpecies || isStartZone) return false;

  const minDiff = spawnConfigData.apex.minDifficulty ?? 0.35;
  if (difficulty < minDiff) return false;

  const p0 = spawnConfigData.apex.p0 ?? 0.03;
  const pMax = spawnConfigData.apex.pMax ?? 0.10;
  // Scaled probability with difficulty above threshold
  const k = (pMax - p0) / Math.max(0.01, 1.0 - minDiff);
  const pApex = Math.min(pMax, Math.max(0, p0 + k * (difficulty - minDiff)));

  return apexRoll01 < pApex;
}

/**
 * Composes a full wild herd with leader, members, and optional apex according to Section 4.
 */
export function composeHerd(params: {
  speciesKey: string;
  speciesDef: SpeciesSpawnDefinition;
  baseLevel: number;
  difficulty: number;
  distance: number;
  sizeRoll01: number;
  apexRoll01: number;
  levelRolls: number[];
}): HerdComposition {
  const {
    speciesKey,
    speciesDef,
    baseLevel,
    difficulty,
    distance,
    sizeRoll01,
    apexRoll01,
    levelRolls,
  } = params;

  const startRadius = spawnConfigData.level.startZoneRadius ?? 100;
  const isStartZone = distance <= startRadius;

  const social = speciesDef.social || 'solitary';
  const groupSize = isStartZone && social !== 'solitary'
    ? Math.min(2, getGroupSize(social, sizeRoll01))
    : getGroupSize(social, sizeRoll01);

  const hasApex = shouldSpawnApex({
    speciesDef,
    difficulty,
    isStartZone,
    apexRoll01,
  });

  const individuals: ComposedIndividual[] = [];

  if (groupSize === 1) {
    const roll = levelRolls[0] ?? 0.5;
    const { level, role } = calculateEntityLevel({
      baseLevel,
      role: 'solo',
      distance,
      stage: speciesDef.stage ?? 1,
      roll01: roll,
    });
    individuals.push({ speciesKey, role, level });
    return { speciesKey, individuals };
  }

  // Multi-entity group (pair, herd, flock)
  let leaderAssigned = false;

  for (let i = 0; i < groupSize; i++) {
    const roll = levelRolls[i] ?? 0.5;

    if (i === 0) {
      // First slot is Apex if rolled, otherwise Leader
      if (hasApex && speciesDef.apexSpecies) {
        const { level, role } = calculateEntityLevel({
          baseLevel,
          role: 'apex',
          distance,
          stage: 3, // Apex is final stage
          roll01: roll,
        });
        individuals.push({
          speciesKey: role === 'apex' ? speciesDef.apexSpecies : speciesKey,
          role,
          level,
        });
        leaderAssigned = true;
      } else {
        const { level, role } = calculateEntityLevel({
          baseLevel,
          role: 'leader',
          distance,
          stage: speciesDef.stage ?? 1,
          roll01: roll,
        });
        individuals.push({ speciesKey, role, level });
        leaderAssigned = true;
      }
    } else {
      // Members of the herd
      const { level, role } = calculateEntityLevel({
        baseLevel,
        role: 'member',
        distance,
        stage: speciesDef.stage ?? 1,
        roll01: roll,
      });
      individuals.push({ speciesKey, role, level });
    }
  }

  // Safety invariant: Ensure at least one leader or apex in non-solo groups
  if (!leaderAssigned && individuals.length > 0) {
    individuals[0].role = 'leader';
  }

  return { speciesKey, individuals };
}
