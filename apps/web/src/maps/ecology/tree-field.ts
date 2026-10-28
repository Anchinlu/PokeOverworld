import { CHUNK_SIZE, TILE_SIZE } from '@pokemon/game-data';
import { type TerrainField, isRoute1ClearingArea } from '../terrain-field';
import { seededHash } from '../noise';
import { sampleEcology } from './ecology-field';

/**
 * World-space tree candidate field. A candidate belongs to a global cell, not
 * to the chunk that happens to render it, so chunk boundaries cannot reset the
 * forest pattern.
 */
export const TREE_CANDIDATE_CELL_SIZE = 6;

const TREE_FIELD_SALT = 0x6e31;
const TREE_FIELD_CACHE_LIMIT = 512;

export interface TreeFieldCandidate {
  gx: number;
  gy: number;
  x: number;
  y: number;
}

const candidateCache = new Map<string, TreeFieldCandidate[]>();

function floorDiv(value: number, divisor: number): number {
  return Math.floor(value / divisor);
}

function getCandidate(
  cellX: number,
  cellY: number,
  field: TerrainField
): TreeFieldCandidate | null {
  const anchorGX =
    cellX * TREE_CANDIDATE_CELL_SIZE +
    1 +
    Math.floor(
      seededHash(cellX, cellY, field.seed + TREE_FIELD_SALT) * (TREE_CANDIDATE_CELL_SIZE - 2)
    );
  const anchorGY =
    cellY * TREE_CANDIDATE_CELL_SIZE +
    1 +
    Math.floor(
      seededHash(cellX + 31, cellY - 17, field.seed + TREE_FIELD_SALT) *
        (TREE_CANDIDATE_CELL_SIZE - 2)
    );
  if (isRoute1ClearingArea(anchorGX, anchorGY, field)) return null;

  const ecology = sampleEcology(anchorGX, anchorGY, field);

  // The chance rises smoothly with the ecological density field. This keeps
  // meadow/dryland open while allowing dense forest zones to form broad groups.
  const spawnChance = 0.18 + ecology.density * 0.68;
  const roll = seededHash(cellX - 13, cellY + 29, field.seed + TREE_FIELD_SALT);
  if (roll >= spawnChance) return null;

  const tx = anchorGX * TILE_SIZE - 16;
  const ty = anchorGY * TILE_SIZE - 86;
  if (!field.isValidTreePos(tx, ty)) return null;

  return { gx: anchorGX, gy: anchorGY, x: tx, y: ty };
}

/**
 * Returns all inland tree candidates whose canonical root tile belongs to a
 * chunk. Neighboring chunks use the same global cell calculation and never
 * need to copy or stitch candidates after generation.
 */
export function getForestTreeCandidates(
  cx: number,
  cy: number,
  field: TerrainField
): TreeFieldCandidate[] {
  const cacheKey = `${cx},${cy},${field.seed},${field.version}`;
  const cached = candidateCache.get(cacheKey);
  if (cached) return cached;

  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const endGX = startGX + CHUNK_SIZE;
  const endGY = startGY + CHUNK_SIZE;
  const minCellX = floorDiv(startGX, TREE_CANDIDATE_CELL_SIZE) - 1;
  const maxCellX = floorDiv(endGX - 1, TREE_CANDIDATE_CELL_SIZE) + 1;
  const minCellY = floorDiv(startGY, TREE_CANDIDATE_CELL_SIZE) - 1;
  const maxCellY = floorDiv(endGY - 1, TREE_CANDIDATE_CELL_SIZE) + 1;
  const candidates: TreeFieldCandidate[] = [];

  for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      const candidate = getCandidate(cellX, cellY, field);
      if (!candidate) continue;
      if (
        candidate.gx >= startGX &&
        candidate.gx < endGX &&
        candidate.gy >= startGY &&
        candidate.gy < endGY
      ) {
        candidates.push(candidate);
      }
    }
  }

  if (candidateCache.size >= TREE_FIELD_CACHE_LIMIT) {
    const oldestKey = candidateCache.keys().next().value;
    if (oldestKey !== undefined) candidateCache.delete(oldestKey);
  }
  candidateCache.set(cacheKey, candidates);
  return candidates;
}
