import type { ActivityRhythm } from '../../model';
import type { TimeBand } from '../../ports/world-query';

/**
 * Evaluates whether a creature should naturally be sleeping based on its circadian rhythm.
 * Section 6.5:
 * - Loài đêm ngủ ban ngày tại điểm neo (hiện dấu "z"), thức dậy nếu người chơi lại gần dưới 2 ô.
 * - Phụ thuộc cổng clock (timeBand); không dùng Date.now() trong luật hành vi.
 */
export function isCreatureNaturallySleeping(
  activity: ActivityRhythm,
  timeBand: TimeBand
): boolean {
  switch (activity) {
    case 'nocturnal':
      // Nocturnal creatures sleep during day and dawn
      return timeBand === 'day' || timeBand === 'dawn';
    case 'diurnal':
      // Diurnal creatures sleep at night
      return timeBand === 'night';
    case 'crepuscular':
      // Active primarily at twilight (dawn & dusk)
      return timeBand === 'day' || timeBand === 'night';
    case 'all_day':
    default:
      return false;
  }
}

/**
 * Checks if a sleeping creature is startled awake by a nearby player.
 * Section 6.5: thức dậy nếu người chơi lại gần dưới 2 ô.
 */
export function isStartledAwake(distToPlayerTiles: number): boolean {
  return distToPlayerTiles <= 2.0;
}
