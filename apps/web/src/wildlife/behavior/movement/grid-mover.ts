import type { WildEntity } from '../../model';
import type { WorldQuery } from '../../ports/world-query';
import { TILE_SIZE } from '@pokemon/game-data';

export const DX_MAP = [0, -1, 1, 0];
export const DY_MAP = [1, 0, 0, -1];

export interface GridMoveResult {
  reachedTarget: boolean;
}

/**
 * Checks if a target grid tile is valid and unobstructed for a wild entity.
 */
export function canWildEntityEnter(
  targetGX: number,
  targetGY: number,
  world: WorldQuery,
  occupiedTiles?: Set<string>,
  isWaterDweller?: boolean,
  fromGX?: number,
  fromGY?: number,
  canJumpHills = false
): boolean {
  if (isWaterDweller) {
    const ctx = world.contextAt(targetGX, targetGY);
    if (ctx !== 'water_surface' && ctx !== 'shore') {
      return false;
    }
  } else {
    if (!world.isWalkable(targetGX, targetGY, fromGX, fromGY, canJumpHills)) {
      return false;
    }
  }
  if (occupiedTiles && occupiedTiles.has(`${targetGX},${targetGY}`)) {
    return false;
  }
  return true;
}

/**
 * Initiates an interpolated 32px grid step movement in a given direction.
 */
export function startWildStep(
  entity: WildEntity,
  dir: number,
  jumpType?: 'jump_up' | 'drop_down'
): void {
  entity.currentDir = dir;
  entity.dir = dir;
  // Use the same 64px sprite anchor as Player/Follower: the logical grid
  // coordinate points to the character's feet tile, not the sprite's corner.
  entity.fromX = entity.gx * TILE_SIZE - 16;
  entity.fromY = entity.gy * TILE_SIZE - 32;
  entity.targetGX = entity.gx + DX_MAP[dir];
  entity.targetGY = entity.gy + DY_MAP[dir];
  entity.targetX = entity.targetGX * TILE_SIZE - 16;
  entity.targetY = entity.targetGY * TILE_SIZE - 32;
  entity.isMoving = true;
  entity.stepProgress = 0;
  entity.isJumping = jumpType !== undefined;
  entity.jumpType = jumpType ?? null;
  entity.jumpY = 0;
}

/**
 * Updates grid movement interpolation frame-by-frame.
 * Returns reachedTarget: true when the 32px step finishes.
 */
export function updateGridMovement(entity: WildEntity, dtScale = 1.0): GridMoveResult {
  if (!entity.isMoving) {
    return { reachedTarget: false };
  }

  entity.stepProgress += entity.moveSpeed * dtScale;
  const t = Math.min(entity.stepProgress / TILE_SIZE, 1.0);

  entity.x = entity.fromX + (entity.targetX - entity.fromX) * t;
  entity.y = entity.fromY + (entity.targetY - entity.fromY) * t;

  if (entity.isJumping) {
    // Match the parabolic jump used by Player/Follower.
    entity.bobY = 0;
    if (entity.jumpType === 'jump_up') {
      entity.jumpY = -Math.sin(t * Math.PI) * 22;
    } else {
      entity.jumpY = -14 * Math.sin(Math.pow(t, 0.6) * Math.PI);
    }
    entity.frame = 1;
  } else {
    entity.bobY = -Math.sin(t * Math.PI) * 2;
    entity.jumpY = 0;
    entity.frame = Math.floor(t * 4) % 4;
  }

  if (t >= 1.0) {
    entity.gx = entity.targetGX;
    entity.gy = entity.targetGY;
    entity.x = entity.targetX;
    entity.y = entity.targetY;
    entity.isMoving = false;
    entity.frame = 0;
    entity.stepProgress = 0;
    entity.bobY = 0;
    entity.isJumping = false;
    entity.jumpType = null;
    entity.jumpY = 0;
    return { reachedTarget: true };
  }

  return { reachedTarget: false };
}
