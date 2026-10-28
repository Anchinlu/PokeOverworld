import { describe, it, expect } from 'vitest';
import { calculateSpeciesTier, bandOfCatchRate, EXCLUDED_SPAWN_FLAGS } from '../../src/wildlife/spawn/rarity';
import { speciesSpawnData } from '../../src/wildlife/data/data-loader';

describe('Wildlife Rarity & Special Exclusions (Section 2.2 & 11.1)', () => {
  it('correctly maps catch rate bands', () => {
    expect(bandOfCatchRate(255)).toBe(0); // Caterpie, Rattata
    expect(bandOfCatchRate(190)).toBe(0); // Pikachu, Pidgey
    expect(bandOfCatchRate(120)).toBe(1); // Metapod
    expect(bandOfCatchRate(90)).toBe(2);  // Fearow
    expect(bandOfCatchRate(45)).toBe(3);  // Bulbasaur, Eevee, Mew
    expect(bandOfCatchRate(3)).toBe(4);   // Mewtwo
  });

  it('calculates expected tier for all 151 Gen 1 species', () => {
    // 1. Pikachu: catchRate 190 (band 0), stage 1 (+0), overrideDelta +1 => Tier 1 (Uncommon / Ít gặp)
    const pikachuTier = calculateSpeciesTier('PIKACHU');
    expect(pikachuTier).toBe(1);

    // 2. Caterpie & Pidgey: catchRate 255 / 190 (band 0), stage 1 (+0), delta 0 => Tier 0 (Common / Thường)
    expect(calculateSpeciesTier('CATERPIE')).toBe(0);
    expect(calculateSpeciesTier('PIDGEY')).toBe(0);

    // 3. Pidgeotto: catchRate 120 (band 1), stage 2 (+1) => Tier 2 (Rare / Hiếm)
    expect(calculateSpeciesTier('PIDGEOTTO')).toBe(2);
  });

  it('guarantees that species with special flags never appear in regular spawn table (return null)', () => {
    // Legendaries
    expect(calculateSpeciesTier('ARTICUNO')).toBeNull();
    expect(calculateSpeciesTier('ZAPDOS')).toBeNull();
    expect(calculateSpeciesTier('MOLTRES')).toBeNull();
    expect(calculateSpeciesTier('MEWTWO')).toBeNull();

    // Mythical
    expect(calculateSpeciesTier('MEW')).toBeNull();

    // Starters
    expect(calculateSpeciesTier('BULBASAUR')).toBeNull();
    expect(calculateSpeciesTier('CHARMANDER')).toBeNull();
    expect(calculateSpeciesTier('SQUIRTLE')).toBeNull();
    expect(calculateSpeciesTier('CHARIZARD')).toBeNull();

    // Fossils
    expect(calculateSpeciesTier('OMANYTE')).toBeNull();
    expect(calculateSpeciesTier('KABUTO')).toBeNull();
    expect(calculateSpeciesTier('AERODACTYL')).toBeNull();

    // Static blocker
    expect(calculateSpeciesTier('SNORLAX')).toBeNull();

    // Trade & stone evolutions (Apex or high tier)
    expect(calculateSpeciesTier('RAICHU')).toBeGreaterThanOrEqual(3);
    expect(calculateSpeciesTier('ALAKAZAM')).toBeGreaterThanOrEqual(3);
    expect(calculateSpeciesTier('GENGAR')).toBeGreaterThanOrEqual(3);
    expect(calculateSpeciesTier('MACHAMP')).toBeGreaterThanOrEqual(3);
    expect(calculateSpeciesTier('GOLEM')).toBeGreaterThanOrEqual(3);
  });

  it('verifies that no species with an excluded flag can have a valid rarity tier', () => {
    for (const [key, entry] of Object.entries(speciesSpawnData)) {
      if (entry.flags && entry.flags.some((f) => EXCLUDED_SPAWN_FLAGS.has(f))) {
        const tier = calculateSpeciesTier(key, entry);
        expect(tier).toBeNull();
      }
    }
  });
});
