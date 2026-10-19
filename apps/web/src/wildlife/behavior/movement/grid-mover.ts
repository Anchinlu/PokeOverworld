import type { WildEntity } from '../../model';
import type { WorldQuery } from '../../ports/world-query';

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
  occupiedTiles?: Set<string>
): boolean {
  if (!world.isWalkable(targetGX, targetGY)) {
    return false;
  }
  if (occupiedTiles && occupiedTiles.has(`${targetGX},${targetGY}`)) {
    return false;
  }
  return true;
}

/**
 * Initiates an interpolated 32px grid step movement in a given direction.
 */
export function startWildStep(entity: WildEntity, dir: number): void {
  entity.currentDir = dir;
  entity.dir = dir;
  entity.fromX = entity.gx * 32;
  entity.fromY = entity.gy * 32;
  entity.targetGX = entity.gx + DX_MAP[dir];
  entity.targetGY = entity.gy + DY_MAP[dir];
  entity.targetX = entity.targetGX * 32;
  entity.targetY = entity.targetGY * 32;
  entity.isMoving = true;
  entity.stepProgress = 0;
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
  const t = Math.min(entity.stepProgress / 32, 1.0);

  entity.x = entity.fromX + (entity.targetX - entity.fromX) * t;
  entity.y = entity.fromY + (entity.targetY - entity.fromY) * t;

  // Natural subtle step bounce
  entity.bobY = -Math.sin(t * Math.PI) * 2;
  entity.frame = Math.floor(t * 4) % 4;

  if (t >= 1.0) {
    entity.gx = entity.targetGX;
    entity.gy = entity.targetGY;
    entity.x = entity.targetX;
    entity.y = entity.targetY;
    entity.isMoving = false;
    entity.frame = 0;
    entity.stepProgress = 0;
    entity.bobY = 0;
    return { reachedTarget: true };
  }

  return { reachedTarget: false };
}
