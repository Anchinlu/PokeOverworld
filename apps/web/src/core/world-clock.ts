import {
  type WorldClockState,
  type WorldClockConfig,
  DEFAULT_WORLD_CLOCK_CONFIG,
} from '@pokemon/shared-types';

/**
 * WorldClock - Single Source of Truth for Overworld Time Progression.
 *
 * Rules:
 * - Only manages time (minutes 0..1439, day count, pause stack).
 * - Never contains rendering, spawn logic, or battle calculation.
 * - advance() is only called from the world update loop, never from render loops.
 */
export class WorldClock {
  private minutes: number;
  private day: number;
  private readonly config: WorldClockConfig;
  private readonly pausedReasons = new Set<string>();
  private speedMultiplier = 1;

  constructor(
    initialMinutes?: number,
    initialDay = 1,
    config?: Partial<WorldClockConfig>
  ) {
    this.config = { ...DEFAULT_WORLD_CLOCK_CONFIG, ...config };
    this.minutes = initialMinutes !== undefined ? initialMinutes : this.config.startMinutes;
    this.day = Math.max(1, initialDay);

    // Normalize initial minutes
    if (this.minutes >= 1440 || this.minutes < 0) {
      const extraDays = Math.floor(this.minutes / 1440);
      this.day += extraDays;
      this.minutes = ((this.minutes % 1440) + 1440) % 1440;
    }
  }

  public getState(): WorldClockState {
    return {
      minutes: Math.floor(this.minutes),
      day: this.day,
      isPaused: this.isPaused(),
    };
  }

  public getMinutes(): number {
    return Math.floor(this.minutes);
  }

  public getExactMinutes(): number {
    return this.minutes;
  }

  public getDay(): number {
    return this.day;
  }

  public setMinutes(minutes: number): void {
    const total = Math.max(0, minutes);
    this.minutes = total % 1440;
  }

  public setDay(day: number): void {
    this.day = Math.max(1, day);
  }

  /**
   * Advances the world clock by real-world delta milliseconds.
   * Only advances when not paused.
   */
  public advance(dtMs: number): void {
    if (this.isPaused() || dtMs <= 0) {
      return;
    }

    const elapsedSeconds = dtMs / 1000;
    const deltaMinutes =
      elapsedSeconds * this.config.minutesPerRealSecond * this.speedMultiplier;
    this.minutes += deltaMinutes;

    while (this.minutes >= 1440) {
      this.minutes -= 1440;
      this.day += 1;
    }
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0.1, multiplier);
  }

  public pause(reason = 'default'): void {
    this.pausedReasons.add(reason);
  }

  public resume(reason = 'default'): void {
    this.pausedReasons.delete(reason);
  }

  public isPaused(): boolean {
    return this.pausedReasons.size > 0;
  }

  public getPausedReasons(): string[] {
    return Array.from(this.pausedReasons);
  }

  public formatTime(): string {
    const totalM = Math.floor(this.minutes);
    const hours = Math.floor(totalM / 60)
      .toString()
      .padStart(2, '0');
    const mins = (totalM % 60).toString().padStart(2, '0');
    return `${hours}:${mins}`;
  }

  public getConfig(): WorldClockConfig {
    return { ...this.config };
  }

  public reset(initialMinutes?: number, initialDay = 1): void {
    this.minutes = initialMinutes !== undefined ? initialMinutes : this.config.startMinutes;
    this.day = Math.max(1, initialDay);
    this.pausedReasons.clear();
  }
}
