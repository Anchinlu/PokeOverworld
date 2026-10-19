import type { WorldQuery } from '../ports/world-query';

export interface TileCoord {
  gx: number;
  gy: number;
}

/**
 * Finds anchor tiles for groups inside a chunk (16x16 tiles).
 */
export function findGroupAnchors(params: {
  cx: number;
  cy: number;
  world: WorldQuery;
  count: number;
  seed: number;
  minDist?: number;
}): TileCoord[] {
  const { cx, cy, world, count, seed, minDist = 3 } = params;
  const chunkOriginX = cx * 16;
  const chunkOriginY = cy * 16;

  const validTiles: TileCoord[] = [];
  // Scan chunk tiles (leaving a 1-tile border for movement margin)
  for (let ly = 1; ly < 15; ly++) {
    for (let lx = 1; lx < 15; lx++) {
      const gx = chunkOriginX + lx;
      const gy = chunkOriginY + ly;
      if (world.isWalkable(gx, gy)) {
        validTiles.push({ gx, gy });
      }
    }
  }

  if (validTiles.length === 0) return [];

  const anchors: TileCoord[] = [];
  // Deterministic shuffle using seed
  for (let i = validTiles.length - 1; i > 0; i--) {
    const j = Math.abs(Math.imul(seed + i, 1664525) + 1013904223) % (i + 1);
    const temp = validTiles[i];
    validTiles[i] = validTiles[j];
    validTiles[j] = temp;
  }

  for (const candidate of validTiles) {
    if (anchors.length >= count) break;

    // Check separation from existing anchors
    const tooClose = anchors.some((a) => {
      const dx = a.gx - candidate.gx;
      const dy = a.gy - candidate.gy;
      return dx * dx + dy * dy < minDist * minDist;
    });

    if (!tooClose) {
      anchors.push(candidate);
    }
  }

  return anchors;
}

/**
 * Places members of a herd around the leader within cohesion radius (max 3 tiles).
 */
export function placeHerdMembers(params: {
  anchor: TileCoord;
  count: number;
  world: WorldQuery;
  seed: number;
  radius?: number;
}): TileCoord[] {
  const { anchor, count, world, seed, radius = 3 } = params;
  const coords: TileCoord[] = [anchor];
  if (count <= 1) return coords;

  // Search candidate tiles in concentric rings around anchor
  const candidates: TileCoord[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radius * radius) {
        const gx = anchor.gx + dx;
        const gy = anchor.gy + dy;
        if (world.isWalkable(gx, gy)) {
          candidates.push({ gx, gy });
        }
      }
    }
  }

  // Pick deterministic candidates for remaining members
  for (let i = 1; i < count; i++) {
    if (candidates.length === 0) {
      coords.push(anchor);
      continue;
    }
    const idx = Math.abs(Math.imul(seed + i * 37, 22695477) + 1) % candidates.length;
    coords.push(candidates.splice(idx, 1)[0]);
  }

  return coords;
}
