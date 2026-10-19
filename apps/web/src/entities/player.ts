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

  // Cliff Jumping & Elevation Drop State
  public isJumping = false;
  public jumpType: 'jump_up' | 'drop_down' | null = null;
  public jumpY = 0;
  private landingSquashTimer = 0;

  // Idle Animation State (4-Frame Idle from char_red_idle.png)
  public isIdling = false;
  private idleTimer = 0; // Accumulated time standing still (seconds)
  private nextIdleDelay = 3.5; // Randomized delay before next idle chance (seconds)
  private idleAnimTimer = 0; // Elapsed time in current idle animation (seconds)
  private readonly idleFrameDuration = 0.16; // Duration per idle frame (seconds)
  private readonly totalIdleFrames = 4; // Frames 0, 1, 2, 3

  constructor(initialGX = 0, initialGY = 0, initialDir: Direction = 0) {
    this.nextIdleDelay = 3.0 + Math.random() * 3.5;
    this.snapTo(initialGX, initialGY, initialDir);
  }

  /**
   * Instantly snaps the player to grid coordinate.
   */
  public snapTo(gx: number, gy: number, dir?: Direction): void {
    this.cancelIdle();
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
    this.isJumping = false;
    this.jumpType = null;
    this.jumpY = 0;
    this.landingSquashTimer = 0;
    this.frame = 0;
    if (dir !== undefined) {
      this.direction = dir;
    }
  }

  /**
   * Begins stepping into the target tile.
   */
  public startStep(targetGX: number, targetGY: number, dir: Direction): void {
    this.cancelIdle();
    this.direction = dir;
    this.stepCount++;
    this.isMoving = true;
    this.isBlocked = false;
    this.isJumping = false;
    this.jumpType = null;
    this.jumpY = 0;

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
   * Initiates a dynamic jump up onto a cliff or drop down off a cliff.
   */
  public startJump(
    targetGX: number,
    targetGY: number,
    dir: Direction,
    type: 'jump_up' | 'drop_down'
  ): void {
    this.startStep(targetGX, targetGY, dir);
    this.isJumping = true;
    this.jumpType = type;
    this.jumpY = 0;
    this.landingSquashTimer = 0;
  }

  /**
   * Sets player in blocked/bumping state facing direction.
   */
  public setBlocked(dir: Direction): void {
    this.cancelIdle();
    this.direction = dir;
    this.isBlocked = true;
    this.frame = 0;
  }

  /**
   * Clears movement or blocked state to idle standing.
   */
  public setIdle(): void {
    this.isBlocked = false;
    if (!this.isIdling) {
      this.frame = 0;
    }
  }

  /**
   * Triggers the special idle animation (cycling through frames 0, 1, 2, 3 of char_red_idle).
   */
  public triggerIdleAnimation(): void {
    this.isIdling = true;
    this.idleAnimTimer = 0;
    this.frame = 0;
  }

  /**
   * Cancels any active idle animation and resets posture.
   */
  public cancelIdle(): void {
    this.isIdling = false;
    this.idleTimer = 0;
    this.idleAnimTimer = 0;
    this.frame = 0;
    this.nextIdleDelay = 3.0 + Math.random() * 4.0;
  }

  /**
   * Ticks idle timer and cycles through idle animation frames when stationary.
   */
  private updateIdle(dtScale: number): void {
    const dtSeconds = (1 / 60) * dtScale;

    if (!this.isIdling) {
      this.idleTimer += dtSeconds;
      if (this.idleTimer >= this.nextIdleDelay) {
        this.idleTimer = 0;
        // Probability check (50% chance to trigger idle animation, otherwise defer)
        if (Math.random() < 0.5) {
          this.triggerIdleAnimation();
        } else {
          this.nextIdleDelay = 2.5 + Math.random() * 3.5;
        }
      }
    } else {
      this.idleAnimTimer += dtSeconds;
      const totalDuration = this.idleFrameDuration * this.totalIdleFrames;

      if (this.idleAnimTimer < totalDuration) {
        const frameIndex = Math.floor(this.idleAnimTimer / this.idleFrameDuration);
        this.frame = Math.min(this.totalIdleFrames - 1, Math.max(0, frameIndex));
      } else {
        // Idle cycle completed, return to standing neutral
        this.cancelIdle();
      }
    }
  }

  /**
   * Updates player position interpolation with delta time.
   * Returns true if step was completed this tick.
   */
  public update(dtScale = 1.0, isRunning = false): boolean {
    if (!this.isMoving) {
      if (this.landingSquashTimer > 0) {
        const dtSeconds = (1 / 60) * dtScale;
        this.landingSquashTimer -= dtSeconds;
        if (this.landingSquashTimer <= 0) {
          this.landingSquashTimer = 0;
          this.jumpY = 0;
        } else {
          // Landing impact squash: brief 2.5px compression that rebounds
          this.jumpY = Math.sin((this.landingSquashTimer / 0.08) * Math.PI) * 2.5;
        }
      }
      this.updateIdle(dtScale);
      return false;
    }

    if (this.isIdling) {
      this.cancelIdle();
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
      if (this.isJumping) {
        if (this.jumpType === 'drop_down') {
          this.landingSquashTimer = 0.08;
        }
        this.isJumping = false;
        this.jumpType = null;
        this.jumpY = 0;
      }
      return true;
    }

    // Smooth position interpolation
    this.x = this.fromX + (this.targetX - this.fromX) * this.stepProgress;
    this.y = this.fromY + (this.targetY - this.fromY) * this.stepProgress;

    if (this.isJumping) {
      const t = this.stepProgress;
      if (this.jumpType === 'jump_up') {
        // High parabolic leap up onto cliff ledge (clearing 22px height)
        this.jumpY = -Math.sin(t * Math.PI) * 22;
      } else {
        // Drop down: forward hop lip followed by gravity fall down
        this.jumpY = -Math.sin(t * Math.PI) * 16;
      }
      this.frame = 1;
    } else {
      this.jumpY = 0;
      this.frame = getStepFrame(this.stepCount, this.stepProgress);
    }

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
