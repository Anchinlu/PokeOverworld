import type { WildEntity } from '../../model';
import type { WorldQuery } from '../../ports/world-query';
import { canWildEntityEnter, DX_MAP, DY_MAP } from './grid-mover';
import { getWildAabb, getWildOccupiedAabbs, hitboxesOverlap } from './wild-hitbox';

// Direction order is down, left, right, up. These maps preserve visual
// left/right turns instead of relying on numeric +/- 1, which is not valid for
// this direction encoding.
const LEFT_TURN = [1, 3, 0, 2];
const RIGHT_TURN = [2, 0, 3, 1];
const REVERSE = [3, 2, 1, 0];

export interface WildMoveCollisionContext {
  occupiedTiles: Set<string>;
  nearbyEntities: readonly WildEntity[];
}

export interface WildMoveChoice {
  dir: number;
  targetGX: number;
  targetGY: number;
  jumpType?: 'jump_up' | 'drop_down';
}

function hasHitboxCollision(
  entity: WildEntity,
  targetGX: number,
  targetGY: number,
  nearbyEntities: readonly WildEntity[]
): boolean {
  const candidate = getWildAabb(entity, targetGX, targetGY);
  for (const other of nearbyEntities) {
    if (other === entity) continue;
    for (const occupiedAabb of getWildOccupiedAabbs(other)) {
      if (hitboxesOverlap(candidate, occupiedAabb)) return true;
    }
  }
  return false;
}

function canUseDirection(
  entity: WildEntity,
  dir: number,
  world: WorldQuery,
  context: WildMoveCollisionContext,
  isWaterDweller: boolean,
  canJumpHills: boolean
): WildMoveChoice | undefined {
  const targetGX = entity.gx + DX_MAP[dir];
  const targetGY = entity.gy + DY_MAP[dir];
  if (
    !canWildEntityEnter(
      targetGX,
      targetGY,
      world,
      context.occupiedTiles,
      isWaterDweller,
      entity.gx,
      entity.gy,
      canJumpHills
    )
  ) {
    return undefined;
  }
  if (hasHitboxCollision(entity, targetGX, targetGY, context.nearbyEntities)) {
    return undefined;
  }
  const fromElevated = world.isElevated?.(entity.gx, entity.gy) ?? false;
  const targetElevated = world.isElevated?.(targetGX, targetGY) ?? false;
  const jumpType =
    !isWaterDweller && !fromElevated && targetElevated
      ? 'jump_up'
      : !isWaterDweller && fromElevated && !targetElevated
        ? 'drop_down'
        : undefined;

  return { dir, targetGX, targetGY, jumpType };
}

/**
 * Picks a short-range detour around an obstacle or another Pokémon.
 * It never searches the whole map: four deterministic candidates keep the
 * simulation cheap and prevent wild Pokémon from teleporting or pathfinding
 * through unloaded chunks.
 */
export function chooseAvoidanceMove(
  entity: WildEntity,
  preferredDir: number,
  world: WorldQuery,
  context: WildMoveCollisionContext,
  isWaterDweller: boolean,
  preferLeft: boolean,
  canJumpHills = false
): WildMoveChoice | undefined {
  const sideFirst = preferLeft ? LEFT_TURN[preferredDir] : RIGHT_TURN[preferredDir];
  const sideSecond = preferLeft ? RIGHT_TURN[preferredDir] : LEFT_TURN[preferredDir];
  const candidates = [preferredDir, sideFirst, sideSecond, REVERSE[preferredDir]];
  for (const dir of candidates) {
    const choice = canUseDirection(entity, dir, world, context, isWaterDweller, canJumpHills);
    if (choice) return choice;
  }
  return undefined;
}
