import type { Direction } from '@pokemon/shared-types';
import { TILE_SIZE } from '@pokemon/game-data';
import { getStepFrame } from './player';

export class Follower {
  public gx = 0;
  public gy = -1;
  public x = 0;
  public y = 0;
  public direction: Direction = 0;
  public frame = 0;
  public stepCount = 0;

  public isMoving = false;
  public isDodge = false;

  public fromX = 0;
  public fromY = 0;
  public fromGX = 0;
  public fromGY = -1;
  public targetX = 0;
  public targetY = 0;
  public targetGX = 0;
  public targetGY = 0;
  public stepProgress = 0;

  public speciesKey = 'PIKACHU';
  public isShiny = false;
  public nickname = 'Pikachu';
  public visible = true;

  constructor(
    initialGX = 0,
    initialGY = -1,
    initialDir: Direction = 0,
    speciesKey = 'PIKACHU',
    isShiny = false,
    nickname?: string
  ) {
    this.speciesKey = speciesKey.toUpperCase();
    this.isShiny = isShiny;
    this.nickname = nickname || speciesKey;
    this.snapTo(initialGX, initialGY, initialDir);
  }

  public setPokemon(speciesKey: string, isShiny = false, nickname?: string): void {
    this.speciesKey = speciesKey.toUpperCase();
    this.isShiny = isShiny;
    this.nickname = nickname || speciesKey;
    this.visible = true;
  }

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
    this.isDodge = false;
    this.frame = 0;
    if (dir !== undefined) {
      this.direction = dir;
    }
  }

  /**
   * Initiates follower movement into the tile the player is currently vacating.
   */
  public startFollow(
    playerCurrentGX: number,
    playerCurrentGY: number,
    playerNextGX: number,
    playerNextGY: number,
    playerStepCount: number
  ): void {
    // Only move if follower is not already on player's current tile
    if (this.gx === playerCurrentGX && this.gy === playerCurrentGY) {
      return;
    }

    this.stepCount = playerStepCount;
    this.isMoving = true;

    this.fromX = this.gx * TILE_SIZE - 16;
    this.fromY = this.gy * TILE_SIZE - 32;
    this.fromGX = this.gx;
    this.fromGY = this.gy;

    this.targetGX = playerCurrentGX;
    this.targetGY = playerCurrentGY;
    this.targetX = playerCurrentGX * TILE_SIZE - 16;
    this.targetY = playerCurrentGY * TILE_SIZE - 32;

    this.stepProgress = 0;

    // Detect if player makes a 180° turn stepping straight into Pikachu's tile
    this.isDodge = playerNextGX === this.gx && playerNextGY === this.gy;

    // Direction toward target tile
    const pdx = this.targetGX - this.gx;
    const pdy = this.targetGY - this.gy;
    if (pdx > 0)
      this.direction = 2; // RIGHT
    else if (pdx < 0)
      this.direction = 1; // LEFT
    else if (pdy > 0)
      this.direction = 0; // DOWN
    else if (pdy < 0) this.direction = 3; // UP
  }

  /**
   * Synchronously advances follower step progress with player step.
   */
  public updateSync(playerProgress: number): void {
    if (!this.isMoving) {
      return;
    }

    this.stepProgress = playerProgress;
    let px = this.fromX + (this.targetX - this.fromX) * this.stepProgress;
    let py = this.fromY + (this.targetY - this.fromY) * this.stepProgress;

    // 180° dodge: gentle lateral circular arc avoiding sprite overlap
    if (this.isDodge) {
      const arc = Math.sin(this.stepProgress * Math.PI) * 10;
      if (this.targetGY !== this.fromGY) {
        px += arc;
      } else {
        py -= arc;
      }
    }

    this.x = px;
    this.y = py;
    this.frame = getStepFrame(this.stepCount, this.stepProgress);
  }

  /**
   * Completes the current step.
   */
  public completeStep(): void {
    if (!this.isMoving) return;
    this.stepProgress = 1.0;
    this.gx = this.targetGX;
    this.gy = this.targetGY;
    this.x = this.targetX;
    this.y = this.targetY;
    this.isMoving = false;
    this.isDodge = false;
    this.frame = 0;
  }
}
