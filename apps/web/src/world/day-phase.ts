import type { DayPhase } from '@pokemon/shared-types';

/**
 * Standard Day Phase time boundaries (in minutes from midnight 00:00).
 */
export const PHASE_BOUNDS = {
  DAWN_START: 300,  // 05:00
  DAY_START: 420,   // 07:00
  DUSK_START: 1020, // 17:00
  NIGHT_START: 1140 // 19:00
} as const;

/**
 * Resolves the active DayPhase for any given in-game minute (0..1439).
 *
 * Rules:
 * - 05:00..06:59 -> 'dawn'
 * - 07:00..16:59 -> 'day'
 * - 17:00..18:59 -> 'dusk'
 * - 19:00..04:59 -> 'night'
 */
export function getDayPhase(minutes: number): DayPhase {
  const m = ((Math.floor(minutes) % 1440) + 1440) % 1440;

  if (m >= PHASE_BOUNDS.DAWN_START && m < PHASE_BOUNDS.DAY_START) {
    return 'dawn';
  }
  if (m >= PHASE_BOUNDS.DAY_START && m < PHASE_BOUNDS.DUSK_START) {
    return 'day';
  }
  if (m >= PHASE_BOUNDS.DUSK_START && m < PHASE_BOUNDS.NIGHT_START) {
    return 'dusk';
  }
  return 'night';
}

export function isDaytime(minutes: number): boolean {
  const phase = getDayPhase(minutes);
  return phase === 'day' || phase === 'dawn';
}

export function isNighttime(minutes: number): boolean {
  return getDayPhase(minutes) === 'night';
}
