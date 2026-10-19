import { speciesSpawnData, type SpeciesSpawnDefinition } from '../data/data-loader';
import { calculateSpeciesTier, rollRarityTier, type RarityTier } from './rarity';
import type { TimeBand, TileContext } from '../ports/world-query';

export interface SpawnCandidate {
  speciesKey: string;
  tier: RarityTier;
  affinity: number;
  definition: SpeciesSpawnDefinition;
}

// In-memory cache of valid species per [biome:context][tier]
const poolCache = new Map<string, SpawnCandidate[]>();

function getCacheKey(biome: string, context: string, tier: RarityTier): string {
  return `${biome}:${context}:${tier}`;
}

/**
 * Builds or queries candidates for a given biome, context, and tier.
 */
export function getSpeciesCandidatesForTier(
  biome: string,
  context: TileContext | string,
  tier: RarityTier
): SpawnCandidate[] {
  const key = getCacheKey(biome, context, tier);
  const cached = poolCache.get(key);
  if (cached) return cached;

  const candidates: SpawnCandidate[] = [];

  for (const [speciesKey, def] of Object.entries(speciesSpawnData)) {
    const speciesTier = calculateSpeciesTier(speciesKey, def);
    if (speciesTier === null || speciesTier !== tier) continue;

    // Check habitat match
    const habitat = def.habitats?.find((h) => h.biome === biome && h.context === context);
    if (!habitat) continue;

    candidates.push({
      speciesKey,
      tier: speciesTier,
      affinity: habitat.affinity,
      definition: def,
    });
  }

  poolCache.set(key, candidates);
  return candidates;
}

/**
 * Finds all candidates in a biome and context across all tiers with fallback.
 */
export function getSpeciesWithTierFallback(
  biome: string,
  context: TileContext | string,
  targetTier: RarityTier
): { tier: RarityTier; candidates: SpawnCandidate[] } {
  // 1. Try target tier
  const primary = getSpeciesCandidatesForTier(biome, context, targetTier);
  if (primary.length > 0) {
    return { tier: targetTier, candidates: primary };
  }

  // 2. Fallback: try progressively more common tiers (downwards to 0)
  for (let t = targetTier - 1; t >= 0; t--) {
    const down = getSpeciesCandidatesForTier(biome, context, t as RarityTier);
    if (down.length > 0) {
      return { tier: t as RarityTier, candidates: down };
    }
  }

  // 3. Fallback: try rarer tiers (upwards to 4)
  for (let t = targetTier + 1; t <= 4; t++) {
    const up = getSpeciesCandidatesForTier(biome, context, t as RarityTier);
    if (up.length > 0) {
      return { tier: t as RarityTier, candidates: up };
    }
  }

  // Do not cross biome/context boundaries. A beach, water edge, rock field,
  // or ordinary ground must never receive a meadow tall-grass species merely
  // because its local habitat pool is empty.
  return { tier: 0, candidates: [] };
}

/**
 * Two-Step Species Selection (Section 2.3).
 * Pure deterministic roll.
 */
export function selectSpeciesTwoStep(params: {
  biome: string;
  context: TileContext | string;
  timeBand?: TimeBand;
  weather?: string;
  tierRoll01: number;
  speciesRoll01: number;
}): { speciesKey: string; tier: RarityTier; definition: SpeciesSpawnDefinition } | null {
  const { biome, context, timeBand = 'day', weather = 'clear', tierRoll01, speciesRoll01 } = params;

  // Step 1: Select Rarity Tier
  const initialTier = rollRarityTier(tierRoll01);

  // Step 2: Query candidates with fallback
  const { tier, candidates } = getSpeciesWithTierFallback(biome, context, initialTier);
  if (!candidates || candidates.length === 0) {
    return null;
  }

  // Time is an eligibility rule, not only a visual preference. If a habitat
  // has no active species in the current band, the group does not spawn there.
  const activeCandidates = candidates.filter(
    (candidate) =>
      !candidate.definition.activeTime || candidate.definition.activeTime.includes(timeBand)
  );
  if (activeCandidates.length === 0) {
    return null;
  }

  // Calculate weighted affinities considering weather after time eligibility.
  const weighted = activeCandidates.map((c) => {
    let weight = c.affinity;

    // Weather factor
    if (c.definition.weather && c.definition.weather[weather] !== undefined) {
      weight *= c.definition.weather[weather];
    }

    return { candidate: c, weight: Math.max(0.01, weight) };
  });

  const totalWeight = weighted.reduce((acc, w) => acc + w.weight, 0);
  const targetWeight = speciesRoll01 * totalWeight;

  let acc = 0;
  for (const item of weighted) {
    acc += item.weight;
    if (targetWeight <= acc) {
      return {
        speciesKey: item.candidate.speciesKey,
        tier,
        definition: item.candidate.definition,
      };
    }
  }

  const last = weighted[weighted.length - 1];
  return {
    speciesKey: last.candidate.speciesKey,
    tier,
    definition: last.candidate.definition,
  };
}
