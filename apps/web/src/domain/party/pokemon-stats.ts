/**
 * Pokémon Core Stats & Nature Calculation Engine
 * Implements authentic Gen 3-7 stat formulas, EV/IV limits, and Nature modifiers.
 */

import type {
  PokemonStats,
  PokemonStatValues,
  StatKey,
  StatKeyWithoutHp,
  NatureName,
  NatureData,
} from '@pokemon/shared-types';
import { NATURES_TABLE } from '@pokemon/shared-types';
import type { RandomService } from '../../core/rng';

export const MAX_EV_PER_STAT = 252;
export const MAX_TOTAL_EV = 510;
export const MAX_IV_PER_STAT = 31;

export const ALL_NATURES: NatureName[] = Object.keys(NATURES_TABLE) as NatureName[];

/**
 * Gets Nature metadata including Vietnamese name and boosted/hindered stats.
 */
export function getNatureData(nature: NatureName): NatureData {
  return NATURES_TABLE[nature] ?? NATURES_TABLE.Hardy;
}

/**
 * Returns the 1.1, 0.9, or 1.0 multiplier for a given stat based on Nature.
 * HP is never affected by Nature.
 */
export function getNatureMultiplier(nature: NatureName, stat: StatKey): number {
  if (stat === 'hp') return 1.0;
  const data = getNatureData(nature);
  if (data.increasedStat === stat && data.decreasedStat === stat) return 1.0;
  if (data.increasedStat === stat) return 1.1;
  if (data.decreasedStat === stat) return 0.9;
  return 1.0;
}

/**
 * Creates default IVs (default 31 for all stats).
 */
export function createDefaultIvs(val = 31): PokemonStatValues {
  return {
    hp: val,
    attack: val,
    defense: val,
    spAtk: val,
    spDef: val,
    speed: val,
  };
}

/**
 * Generates randomized IVs (0..31) for all 6 stats using the provided RNG.
 */
export function createRandomIvs(rng: RandomService): PokemonStatValues {
  return {
    hp: rng.nextInt(0, MAX_IV_PER_STAT),
    attack: rng.nextInt(0, MAX_IV_PER_STAT),
    defense: rng.nextInt(0, MAX_IV_PER_STAT),
    spAtk: rng.nextInt(0, MAX_IV_PER_STAT),
    spDef: rng.nextInt(0, MAX_IV_PER_STAT),
    speed: rng.nextInt(0, MAX_IV_PER_STAT),
  };
}

/**
 * Creates empty EVs (0 for all stats).
 */
export function createDefaultEvs(): PokemonStatValues {
  return {
    hp: 0,
    attack: 0,
    defense: 0,
    spAtk: 0,
    spDef: 0,
    speed: 0,
  };
}

/**
 * Adds Effort Values (EV) to a specific stat respecting individual (252) and total (510) limits.
 * Returns the actual amount of EV added.
 */
export function addEffortValues(
  currentEvs: PokemonStatValues,
  stat: StatKey,
  amount: number,
  maxStat = MAX_EV_PER_STAT,
  maxTotal = MAX_TOTAL_EV
): number {
  if (amount <= 0) return 0;

  const currentTotal =
    currentEvs.hp +
    currentEvs.attack +
    currentEvs.defense +
    currentEvs.spAtk +
    currentEvs.spDef +
    currentEvs.speed;

  const remainingTotalCapacity = Math.max(0, maxTotal - currentTotal);
  if (remainingTotalCapacity <= 0) return 0;

  const currentStatVal = currentEvs[stat];
  const remainingStatCapacity = Math.max(0, maxStat - currentStatVal);
  if (remainingStatCapacity <= 0) return 0;

  const actualAdd = Math.min(amount, remainingStatCapacity, remainingTotalCapacity);
  currentEvs[stat] += actualAdd;
  return actualAdd;
}

/**
 * Standard Gen 3-7 Core Stat Formula:
 * HP = floor(((2 * Base + IV + floor(EV / 4)) * Level) / 100) + Level + 10  (Shedinja always 1)
 * Other = floor((floor(((2 * Base + IV + floor(EV / 4)) * Level) / 100) + 5) * NatureMultiplier)
 */
export function calculatePokemonStats(
  base: PokemonStats,
  level: number,
  ivs: PokemonStatValues,
  evs: PokemonStatValues,
  nature: NatureName
): PokemonStats {
  const safeLevel = Math.max(1, Math.min(100, Math.floor(level)));

  // HP stat (Shedinja base HP == 1 stays at 1)
  const hp =
    base.hp === 1
      ? 1
      : Math.floor(((2 * base.hp + ivs.hp + Math.floor(evs.hp / 4)) * safeLevel) / 100) +
        safeLevel +
        10;

  const calcOther = (key: StatKeyWithoutHp): number => {
    const raw =
      Math.floor(((2 * base[key] + ivs[key] + Math.floor(evs[key] / 4)) * safeLevel) / 100) + 5;
    const mult = getNatureMultiplier(nature, key);
    return Math.floor(raw * mult);
  };

  const attack = calcOther('attack');
  const defense = calcOther('defense');
  const spAtk = calcOther('spAtk');
  const spDef = calcOther('spDef');
  const speed = calcOther('speed');
  const total = hp + attack + defense + spAtk + spDef + speed;

  return {
    hp,
    attack,
    defense,
    spAtk,
    spDef,
    speed,
    total,
  };
}
