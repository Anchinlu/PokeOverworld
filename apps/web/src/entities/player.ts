import type { Direction, PlayerState } from '@pokemon/shared-types';
import { TILE_SIZE } from '@pokemon/game-data';

export type SpeedMode = 'classic' | 'brisk' | 'run';

/**
 * Calculates step animation frame for authentic GBA Pokémon walk cycle:
 * Step 1 (Odd/Left foot):  0 (Idle) -> 1 (Foot forward) -> 2 (Plant)
 * Step 2 (Even/Right foot): 2 (Plant) -> 3 (Foot forward) -> 0 (Idle)
 */
export function getStepFrame(stepCount: number, progress: number): number {
  if (stepCount % 2 === 1) {
    if (progress < 0.2) return 0;
    if (progress < 0.8) return 1;
    return 2;
  } else {
    if (progress < 0.2) return 2;
    if (progress < 0.8) return 3;
    return 0;
  }
}

export class Player {
  public gx = 0;
  public gy = 0;
  public x = 0;
  public y = 0;
  public direction: Direction = 0;
  public frame = 0;
  public stepCount = 0;

  public isMoving = false;
  public isBlocked = false;

  public fromX = 0;
  public fromY = 0;
  public fromGX = 0;
  public fromGY = 0;
  public targetX = 0;
  public targetY = 0;
  public targetGX = 0;
  public targetGY = 0;
  public stepProgress = 0;

  public speedMode: SpeedMode = 'classic';

  constructor(initialGX = 0, initialGY = 0, initialDir: Direction = 0) {
    this.snapTo(initialGX, initialGY, initialDir);
  }

  /**
   * Instantly snaps the player to grid coordinate.
   */
  public snapTo(gx: number, gy: number, dir?: Direction): void {
    this.gx = gx;
    this.gy = gy;
    this.x = gx * TILE_SIZE - 16;
    this.y = gy * TILE_SIZE - 32;
    this.fromX = this.x;
    this.fromY = this.y;
    this.fromGX = gx;
    this.fromGY = gy;
    this.targetX = this.x;
    this.targetY = this.y;
    this.targetGX = gx;
    this.targetGY = gy;
    this.stepProgress = 0;
    this.isMoving = false;
    this.frame = 0;
    if (dir !== undefined) {
      this.direction = dir;
    }
  }

  /**
   * Begins stepping into the target tile.
   */
  public startStep(targetGX: number, targetGY: number, dir: Direction): void {
    this.direction = dir;
    this.stepCount++;
    this.isMoving = true;
    this.isBlocked = false;

    this.fromGX = this.gx;
    this.fromGY = this.gy;
    this.fromX = this.gx * TILE_SIZE - 16;
    this.fromY = this.gy * TILE_SIZE - 32;

    this.targetGX = targetGX;
    this.targetGY = targetGY;
    this.targetX = targetGX * TILE_SIZE - 16;
    this.targetY = targetGY * TILE_SIZE - 32;

    this.stepProgress = 0;
  }

  /**
   * Sets player in blocked/bumping state facing direction.
   */
  public setBlocked(dir: Direction): void {
    this.direction = dir;
    this.isBlocked = true;
    this.frame = 0;
  }

  /**
   * Clears movement or blocked state to idle standing.
   */
  public setIdle(): void {
    this.isBlocked = false;
    this.frame = 0;
  }

  /**
   * Updates player position interpolation with delta time.
   * Returns true if step was completed this tick.
   */
  public update(dtScale = 1.0, isRunning = false): boolean {
    if (!this.isMoving) {
      return false;
    }

    // Base speed in pixels per 60FPS frame:
    // Classic: 2.0px/f (16 frames / 32px tile)
    // Brisk:   2.67px/f (12 frames / 32px tile)
    // Run:     4.0px/f  (8 frames / 32px tile)
    let basePx = 2.0;
    if (this.speedMode === 'brisk') basePx = 2.67;
    else if (this.speedMode === 'run') basePx = 4.0;

    const stepPx = isRunning ? Math.min(basePx * 1.8, 5.33) : basePx;
    this.stepProgress += (stepPx / TILE_SIZE) * dtScale;

    if (this.stepProgress >= 1.0) {
      this.stepProgress = 1.0;
      this.gx = this.targetGX;
      this.gy = this.targetGY;
      this.x = this.targetX;
      this.y = this.targetY;
      this.isMoving = false;
      this.frame = 0;
      return true;
    }

    // Smooth position interpolation
    this.x = this.fromX + (this.targetX - this.fromX) * this.stepProgress;
    this.y = this.fromY + (this.targetY - this.fromY) * this.stepProgress;
    this.frame = getStepFrame(this.stepCount, this.stepProgress);

    return false;
  }

  /**
   * Converts current state to serializable PlayerState schema.
   */
  public toState(): PlayerState {
    return {
      gx: this.gx,
      gy: this.gy,
      x: this.x,
      y: this.y,
      direction: this.direction,
      frame: this.frame,
      moving: this.isMoving,
      targetGX: this.targetGX,
      targetGY: this.targetGY,
      stepProgress: this.stepProgress,
    };
  }
}
