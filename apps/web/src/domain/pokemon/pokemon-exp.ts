/**
 * Canonical Pokémon Experience (EXP) & Growth Rate Curves
 * Implements the 6 authentic Pokémon Growth Rates (Fast, Medium Fast, Medium Slow,
 * Slow, Erratic, Fluctuating) and Gen 7 EXP Yield calculations.
 */

export type GrowthRateType =
  'Fast' | 'Medium Fast' | 'Medium Slow' | 'Slow' | 'Erratic' | 'Fluctuating';

/**
 * Normalizes species growth rate string from database to canonical type.
 */
export function normalizeGrowthRate(raw?: string): GrowthRateType {
  if (!raw) return 'Medium Fast';
  const clean = raw.trim().toLowerCase().replace(/[-_]/g, ' ');
  if (clean.includes('medium slow') || clean.includes('medium-slow')) return 'Medium Slow';
  if (clean.includes('medium fast') || clean.includes('medium-fast')) return 'Medium Fast';
  if (clean.includes('erratic')) return 'Erratic';
  if (clean.includes('fluctuating')) return 'Fluctuating';
  if (clean.includes('slow')) return 'Slow';
  if (clean.includes('fast')) return 'Fast';
  return 'Medium Fast';
}

/**
 * Returns total cumulative experience points required to reach the given level (1..100).
 */
export function getTotalExpForLevel(growthRate: GrowthRateType, level: number): number {
  const n = Math.max(1, Math.min(100, Math.floor(level)));
  if (n <= 1) return 0;

  switch (growthRate) {
    case 'Fast':
      return Math.floor((4 * n * n * n) / 5);

    case 'Medium Fast':
      return n * n * n;

    case 'Slow':
      return Math.floor((5 * n * n * n) / 4);

    case 'Medium Slow': {
      const val = 1.2 * n * n * n - 15 * n * n + 100 * n - 140;
      return Math.max(0, Math.floor(val));
    }

    case 'Erratic': {
      if (n < 50) {
        return Math.floor((n * n * n * (100 - n)) / 50);
      } else if (n < 68) {
        return Math.floor((n * n * n * (150 - n)) / 100);
      } else if (n < 98) {
        return Math.floor((n * n * n * Math.floor((1911 - 10 * n) / 3)) / 500);
      } else {
        return Math.floor((n * n * n * (160 - n)) / 100);
      }
    }

    case 'Fluctuating': {
      if (n < 15) {
        return Math.floor((n * n * n * (Math.floor((n + 1) / 3) + 24)) / 50);
      } else if (n < 36) {
        return Math.floor((n * n * n * (n + 14)) / 50);
      } else {
        return Math.floor((n * n * n * (Math.floor(n / 2) + 32)) / 50);
      }
    }
  }
}

/**
 * Returns the experience needed to advance from currentLevel to currentLevel + 1.
 * For level 100, returns 0.
 */
export function getExpToNextLevel(growthRate: GrowthRateType, currentLevel: number): number {
  if (currentLevel >= 100) return 0;
  const currentTotal = getTotalExpForLevel(growthRate, currentLevel);
  const nextTotal = getTotalExpForLevel(growthRate, currentLevel + 1);
  return Math.max(1, nextTotal - currentTotal);
}

/**
 * Calculates EXP points awarded from defeating an enemy Pokémon in battle.
 * Gen 7 standard formula: floor((b * L) / 7)
 * where b is base EXP yield and L is enemy level.
 * If baseExp is not in data, approximates b from baseStatTotal / 4.
 */
export function calculateExpYield(
  enemyLevel: number,
  baseExp?: number,
  baseStatTotal = 300
): number {
  const b = baseExp && baseExp > 0 ? baseExp : Math.max(40, Math.floor(baseStatTotal / 4));
  const safeLevel = Math.max(1, enemyLevel);
  return Math.max(1, Math.floor((b * safeLevel) / 7));
}
