import type { WildEntity, WildHitbox } from '../../model';
import { TILE_SIZE } from '@pokemon/game-data';

/**
 * A little smaller than a full tile so adjacent creatures can pass without
 * looking glued together, while two creatures can never occupy the same tile.
 */
export const DEFAULT_WILD_HITBOX: Readonly<WildHitbox> = {
  radiusX: 0.34,
  radiusY: 0.28,
  offsetX: 0,
  offsetY: 0,
};

export interface WildAabb {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Full rendered sprite bounds, expressed in tile units. */
export function getWildSpriteAabb(entity: Pick<WildEntity, 'x' | 'y'>): WildAabb {
  const left = entity.x / TILE_SIZE;
  const top = entity.y / 32;
  return { left, right: left + 2, top, bottom: top + 2 };
}

export function getWildHitbox(entity: Pick<WildEntity, 'hitbox'>): WildHitbox {
  const hitbox = entity.hitbox ?? DEFAULT_WILD_HITBOX;
  return {
    radiusX: Math.max(0.1, hitbox.radiusX),
    radiusY: Math.max(0.1, hitbox.radiusY),
    offsetX: hitbox.offsetX ?? 0,
    offsetY: hitbox.offsetY ?? 0,
  };
}

export function getWildAabb(entity: Pick<WildEntity, 'hitbox'>, gx: number, gy: number): WildAabb {
  const hitbox = getWildHitbox(entity);
  // Wild sprites are 64px while their grid anchor is a 32px tile. The
  // origin is offset by (-16,-32), so the visible sprite centre is the
  // centre of the logical tile: gx+0.5 / gy+0.5.
  const centerX = gx + 0.5 + (hitbox.offsetX ?? 0);
  const centerY = gy + 0.5 + (hitbox.offsetY ?? 0);
  return {
    left: centerX - hitbox.radiusX,
    right: centerX + hitbox.radiusX,
    top: centerY - hitbox.radiusY,
    bottom: centerY + hitbox.radiusY,
  };
}

export function hitboxesOverlap(first: WildAabb, second: WildAabb): boolean {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

/** Returns both the current and reserved destination footprint of a mover. */
export function getWildOccupiedAabbs(entity: WildEntity): WildAabb[] {
  const occupied = [getWildAabb(entity, entity.gx, entity.gy)];
  if (entity.isMoving) {
    occupied.push(getWildAabb(entity, entity.targetGX, entity.targetGY));
  }
  return occupied;
}
