/**
 * World Time & Day Phase Definitions
 * Single Source of Truth for game time, lighting profiles, and clock configuration.
 */

export interface WorldClockState {
  /** In-game minutes of the current day: 0..1439 (0 = 00:00 midnight, 720 = 12:00 noon, 1439 = 23:59). */
  minutes: number;
  /** In-game day count: 1, 2, 3... */
  day: number;
  /** Whether the world clock is currently paused. */
  isPaused: boolean;
}

export interface WorldClockConfig {
  /** How many in-game minutes elapse per real-world second (default: 1.0 -> 24 real minutes = 1 game day). */
  minutesPerRealSecond: number;
  /** Starting in-game minutes on a new game (default: 480 = 08:00 AM morning). */
  startMinutes: number;
  /** Whether to pause world time progression during battle sequences. */
  pauseDuringBattle: boolean;
  /** Whether to pause world time progression when the world map modal is open. */
  pauseDuringWorldMap: boolean;
}

export const DEFAULT_WORLD_CLOCK_CONFIG: WorldClockConfig = {
  minutesPerRealSecond: 1.0,
  startMinutes: 480, // 08:00 AM
  pauseDuringBattle: true,
  pauseDuringWorldMap: true,
};

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface AmbientLightProfile {
  /** Formatted CSS rgba color string: e.g. "rgba(24, 35, 90, 0.38)". */
  color: string;
  r: number;
  g: number;
  b: number;
  /** Alpha value clamped strictly in [0.0, 1.0]. */
  alpha: number;
  /** Canvas global composite operation for overlay blending. */
  blendMode: GlobalCompositeOperation;
}
