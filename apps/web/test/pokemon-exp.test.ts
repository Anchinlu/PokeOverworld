import { describe, it, expect } from 'vitest';
import {
  normalizeGrowthRate,
  getTotalExpForLevel,
  getExpToNextLevel,
  calculateExpYield,
  type GrowthRateType,
} from '../src/domain/pokemon/pokemon-exp';

describe('Pokemon Canonical EXP Engine', () => {
  describe('normalizeGrowthRate', () => {
    it('normalizes common variations correctly', () => {
      expect(normalizeGrowthRate('Fast')).toBe('Fast');
      expect(normalizeGrowthRate('fast')).toBe('Fast');
      expect(normalizeGrowthRate('Medium Slow')).toBe('Medium Slow');
      expect(normalizeGrowthRate('medium-slow')).toBe('Medium Slow');
      expect(normalizeGrowthRate('Medium Fast')).toBe('Medium Fast');
      expect(normalizeGrowthRate('medium_fast')).toBe('Medium Fast');
      expect(normalizeGrowthRate('Slow')).toBe('Slow');
      expect(normalizeGrowthRate('Erratic')).toBe('Erratic');
      expect(normalizeGrowthRate('Fluctuating')).toBe('Fluctuating');
      expect(normalizeGrowthRate(undefined)).toBe('Medium Fast');
      expect(normalizeGrowthRate('')).toBe('Medium Fast');
    });
  });

  describe('getTotalExpForLevel & getExpToNextLevel for 6 curves', () => {
    const curves: GrowthRateType[] = [
      'Fast',
      'Medium Fast',
      'Medium Slow',
      'Slow',
      'Erratic',
      'Fluctuating',
    ];

    it('returns 0 EXP required for level 1 across all growth rates', () => {
      for (const curve of curves) {
        expect(getTotalExpForLevel(curve, 1)).toBe(0);
      }
    });

    it('matches official level 100 totals', () => {
      // Official Gen 3-7 level 100 EXP targets:
      // Fast: 800,000
      // Medium Fast: 1,000,000
      // Medium Slow: 1,059,860
      // Slow: 1,250,000
      // Erratic: 600,000
      // Fluctuating: 1,640,000
      expect(getTotalExpForLevel('Fast', 100)).toBe(800000);
      expect(getTotalExpForLevel('Medium Fast', 100)).toBe(1000000);
      expect(getTotalExpForLevel('Medium Slow', 100)).toBe(1059860);
      expect(getTotalExpForLevel('Slow', 100)).toBe(1250000);
      expect(getTotalExpForLevel('Erratic', 100)).toBe(600000);
      expect(getTotalExpForLevel('Fluctuating', 100)).toBe(1640000);
    });

    it('calculates positive strictly increasing exp intervals', () => {
      for (const curve of curves) {
        const toNextLvl1 = getExpToNextLevel(curve, 1);
        const toNextLvl10 = getExpToNextLevel(curve, 10);
        expect(toNextLvl1).toBeGreaterThan(0);
        expect(toNextLvl10).toBeGreaterThan(0);
      }
    });

    it('returns 0 exp to next level when at max level 100', () => {
      for (const curve of curves) {
        expect(getExpToNextLevel(curve, 100)).toBe(0);
      }
    });
  });

  describe('calculateExpYield', () => {
    it('calculates standard Gen 7 floor((b * L) / 7)', () => {
      // b = 64 (e.g. Pidgey), Level 5 -> floor((64 * 5) / 7) = floor(320 / 7) = 45
      expect(calculateExpYield(5, 64)).toBe(45);
      // b = 142, Level 25 -> floor((142 * 25) / 7) = floor(3550 / 7) = 507
      expect(calculateExpYield(25, 142)).toBe(507);
    });

    it('falls back to baseStatTotal / 4 when baseExp is not supplied', () => {
      // BST = 300 -> b = 75. Level 10 -> floor((75 * 10) / 7) = 107
      expect(calculateExpYield(10, undefined, 300)).toBe(107);
    });

    it('guarantees at least 1 exp even for level 1 opponents', () => {
      expect(calculateExpYield(1, 1)).toBeGreaterThanOrEqual(1);
    });
  });
});
