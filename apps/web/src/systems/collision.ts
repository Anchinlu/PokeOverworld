import type { Collider } from '@pokemon/shared-types';
import { TILE_SIZE } from '@pokemon/game-data';

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Axis-Aligned Bounding Box (AABB) intersection check.
 */
export function checkAABB(a: BoundingBox, b: BoundingBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Computes the character foot collision box in world pixel coordinates.
 * Hitbox [22..42] x [48..62] matches feet position within 64x64 sprite.
 */
export function getCharacterHitbox(pixelX: number, pixelY: number): BoundingBox {
  return {
    x: pixelX + 22,
    y: pixelY + 48,
    w: 20,
    h: 14,
  };
}

/**
 * Checks if a target grid tile (targetGX, targetGY) is free of physical obstacles.
 * Validates against both terrain walkability and solid colliders (trees, rocks, cliffs).
 */
export function isTileWalkable(
  targetGX: number,
  targetGY: number,
  isTerrainWalkableFn: (gx: number, gy: number) => boolean,
  colliders: Collider[]
): boolean {
  // 1. Check basic terrain walkability
  if (!isTerrainWalkableFn(targetGX, targetGY)) {
    return false;
  }

  // 2. Check collision with tree / rock colliders at the target tile
  const targetX = targetGX * TILE_SIZE - 16;
  const targetY = targetGY * TILE_SIZE - 32;
  const candidateBox = getCharacterHitbox(targetX, targetY);

  for (const c of colliders) {
    if (checkAABB(candidateBox, c)) {
      return false;
    }
  }

  return true;
}
