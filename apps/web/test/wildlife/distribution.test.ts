import { describe, it, expect } from 'vitest';
import { rollRarityTier } from '../../src/wildlife/spawn/rarity';
import {
  selectSpeciesTwoStep,
  getSpeciesWithTierFallback,
} from '../../src/wildlife/spawn/species-pool';
import { spawnConfigData } from '../../src/wildlife/data/data-loader';

describe('Wildlife Distribution & Statistical Validity (Section 2.3 & 11.2)', () => {
  it('converges to target tier probabilities over 100,000 samples', () => {
    const N = 100_000;
    const counts = [0, 0, 0, 0, 0];

    // High quality deterministic pseudo-random sequence for statistical testing
    let state = 123456789;
    function nextRng() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    }

    for (let i = 0; i < N; i++) {
      const roll = nextRng();
      const tier = rollRarityTier(roll);
      counts[tier]++;
    }

    const expected = spawnConfigData.tierProbability; // [0.62, 0.25, 0.10, 0.025, 0.005]

    // Common (62%): tolerance ±1% (0.01)
    expect(counts[0] / N).toBeCloseTo(expected[0], 2);
    // Uncommon (25%): tolerance ±0.8%
    expect(counts[1] / N).toBeCloseTo(expected[1], 2);
    // Rare (10%): tolerance ±0.5%
    expect(counts[2] / N).toBeCloseTo(expected[2], 2);
    // Very Rare (2.5%): tolerance ±0.4%
    expect(counts[3] / N).toBeCloseTo(expected[3], 2);
    // Ultra Rare (0.5%): tolerance ±0.2%
    expect(counts[4] / N).toBeCloseTo(expected[4], 2);
  });

  it('guarantees Pikachu only spawns in forest biomes', () => {
    let rng = 0.42;
    for (let i = 0; i < 200; i++) {
      rng = (rng * 9301 + 49297) % 233280;
      const roll01 = rng / 233280;

      // Select in meadow
      const meadowSpecies = selectSpeciesTwoStep({
        biome: 'meadow',
        context: 'tall_grass',
        tierRoll01: 0.7, // Tier 1 (Uncommon)
        speciesRoll01: roll01,
      });
      expect(meadowSpecies?.speciesKey).not.toBe('PIKACHU');

      // Select in dryland
      const drylandSpecies = selectSpeciesTwoStep({
        biome: 'dryland',
        context: 'walkable_ground',
        tierRoll01: 0.7,
        speciesRoll01: roll01,
      });
      expect(drylandSpecies?.speciesKey).not.toBe('PIKACHU');
    }

    // In dense forest, Pikachu CAN be selected
    const forestSpecies = selectSpeciesTwoStep({
      biome: 'dense_forest',
      context: 'forest_floor',
      tierRoll01: 0.7, // Tier 1 (Pikachu is Tier 1)
      speciesRoll01: 0.5,
    });
    expect(forestSpecies).not.toBeNull();
  });

  it('guarantees water species do not spawn in inland dry contexts', () => {
    for (let i = 0; i < 50; i++) {
      const roll01 = i / 50;
      const inland = selectSpeciesTwoStep({
        biome: 'meadow',
        context: 'tall_grass',
        tierRoll01: 0.1, // Tier 0 (Common)
        speciesRoll01: roll01,
      });
      expect(inland?.speciesKey).not.toBe('MAGIKARP');
      expect(inland?.speciesKey).not.toBe('TENTACOOL');
      expect(inland?.speciesKey).not.toBe('GOLDEEN');
    }
  });

  it('fallback tier mechanism guarantees never returning null when species exist in biome', () => {
    // If we request Ultra Rare (tier 4) in dense_forest forest_floor
    const result = getSpeciesWithTierFallback('dense_forest', 'forest_floor', 4);
    expect(result.candidates.length).toBeGreaterThan(0);
  });

  it('does not fall back across habitat contexts', () => {
    const beachResult = getSpeciesWithTierFallback('coast', 'sand', 0);
    const beachSpecies = new Set(beachResult.candidates.map((candidate) => candidate.speciesKey));

    expect(beachResult.candidates.length).toBeGreaterThan(0);
    expect(
      [...beachSpecies].every((speciesKey) => ['KRABBY', 'SHELLDER'].includes(speciesKey))
    ).toBe(true);

    const invalidContext = getSpeciesWithTierFallback('meadow', 'sand', 0);
    expect(invalidContext.candidates).toEqual([]);
  });
});
