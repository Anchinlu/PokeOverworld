import { describe, expect, it } from 'vitest';
import { getHighestOwnedPokemonLevel } from '../../src/domain/player/owned-pokemon-level';
import { calculateEntityLevel } from '../../src/wildlife/spawn/level-model';

describe('owned roster level scaling', () => {
  it('uses the highest level from PC when it exceeds the active party', () => {
    const party = [{ level: 12 }, { level: 8 }];
    const boxes = [{ slots: [null, { level: 42 }, null] }];

    expect(getHighestOwnedPokemonLevel(party, boxes)).toBe(42);
  });

  it('scales common encounters above the strongest owned Pokémon until its cap', () => {
    const result = calculateEntityLevel({
      baseLevel: 3,
      role: 'solo',
      distance: 20,
      rarityTier: 0,
      playerMaxOwnedLevel: 20,
      roll01: 0,
    });

    expect(result.level).toBe(21);
  });

  it('keeps scaled levels within the valid level range', () => {
    const result = calculateEntityLevel({
      baseLevel: 60,
      role: 'apex',
      distance: 1000,
      rarityTier: 4,
      playerMaxOwnedLevel: 100,
      roll01: 0.99,
    });

    expect(result.level).toBe(100);
  });

  it('applies a separate maximum level for each rarity tier', () => {
    const caps = [40, 55, 70, 85, 100];

    for (let tier = 0; tier < caps.length; tier++) {
      const result = calculateEntityLevel({
        baseLevel: 100,
        role: 'solo',
        distance: 1000,
        rarityTier: tier as 0 | 1 | 2 | 3 | 4,
        playerMaxOwnedLevel: 100,
        roll01: 0.99,
      });

      expect(result.level).toBe(caps[tier]);
    }
  });
});
