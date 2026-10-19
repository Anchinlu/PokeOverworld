import type { TimeBand } from './world-query';

export interface WildlifeClock {
  getTimeBand(): TimeBand;
  getGameMinutes(): number;
}
