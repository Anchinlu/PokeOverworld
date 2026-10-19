import {
  speciesSpawnData,
  spawnConfigData,
  getSpeciesCatchRate,
  type SpeciesSpawnDefinition,
} from '../data/data-loader';

export type RarityTier = 0 | 1 | 2 | 3 | 4;

export const RARITY_TIER_NAMES: Record<RarityTier, string> = {
  0: 'Common', // Thường
  1: 'Uncommon', // Ít gặp
  2: 'Rare', // Hiếm
  3: 'Very Rare', // Rất hiếm
  4: 'Ultra Rare', // Cực hiếm
};

export const EXCLUDED_SPAWN_FLAGS = new Set([
  'legendary',
  'mythical',
  'starter',
  'fossil',
  'static',
  'no_wild',
]);

/**
 * Calculates raw catchRate band 0..4 according to Section 2.1 & 2.2.
 */
export function bandOfCatchRate(catchRate: number): RarityTier {
  if (catchRate >= 190) return 0;
  if (catchRate >= 120) return 1;
  if (catchRate >= 60) return 2;
  if (catchRate >= 25) return 3;
  return 4;
}

/**
 * Calculates final spawn rarity tier (0..4) combining catch rate, evolution stage,
 * and deliberate manual overrides. Returns null for special-flagged species.
 */
export function calculateSpeciesTier(
  speciesKey: string,
  spawnDef?: SpeciesSpawnDefinition
): RarityTier | null {
  const def = spawnDef ?? speciesSpawnData[speciesKey];
  if (!def) return null;

  // Check if excluded by special flag
  if (def.flags && def.flags.some((flag) => EXCLUDED_SPAWN_FLAGS.has(flag))) {
    return null;
  }

  const catchRate = getSpeciesCatchRate(speciesKey);
  const tierBase = bandOfCatchRate(catchRate);

  const stagePenalties = spawnConfigData.stagePenalty || [0, 1, 2];
  const stageIdx = Math.max(0, Math.min(stagePenalties.length - 1, (def.stage ?? 1) - 1));
  const stagePenalty = stagePenalties[stageIdx] ?? 0;

  const overrideDelta = def.rarityDelta ?? 0;
  const rawTier = tierBase + stagePenalty + overrideDelta;

  return Math.max(0, Math.min(4, rawTier)) as RarityTier;
}

/**
 * Selects a rarity tier using two-step probability weights from spawn-config.json.
 * Pure deterministic roll.
 */
export function rollRarityTier(roll01: number, probabilities?: number[]): RarityTier {
  const probs = probabilities ?? spawnConfigData.tierProbability;
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (roll01 < cumulative || i === probs.length - 1) {
      return i as RarityTier;
    }
  }
  return 0;
}
