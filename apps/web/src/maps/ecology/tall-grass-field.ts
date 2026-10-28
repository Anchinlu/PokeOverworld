import type { TerrainField } from '../terrain-field';
import { seededHash } from '../noise';
import { calculateTallGrassDensity, sampleEcologicalNoise, sampleEcology } from './ecology-field';

/**
 * Tall grass is evaluated in world space instead of being regenerated from
 * each chunk's local coordinates. This prevents the artificial one-tile seam
 * that appeared at every chunk boundary.
 */
export const TALL_GRASS_PATCH_CELL_SIZE = 14;

const TALL_GRASS_PATCH_SALT = 0x5a11;
const TALL_GRASS_VARIATION_SALT = 0x5a12;
const TALL_GRASS_SHAPE_SALT = 0x5a13;
const TALL_GRASS_MIN_PATCH_DENSITY = 0.2;
const TALL_GRASS_BASE_PATCH_CHANCE = 0.18;
const TALL_GRASS_DENSITY_PATCH_CHANCE = 0.32;
const PATCH_CACHE_LIMIT = 512;
const HIGHLAND_GRASS_PATCH_CELL_SIZE = 12;
const HIGHLAND_GRASS_PATCH_SALT = 0x6a11;
const HIGHLAND_GRASS_SHAPE_SALT = 0x6a12;
const HIGHLAND_GRASS_PATCH_CACHE_LIMIT = 512;

const patchCache = new Map<string, GrassPatch>();
const highlandPatchCache = new Map<string, HighlandGrassPatch>();

interface GrassPatch {
  gx: number;
  gy: number;
  radiusX: number;
  radiusY: number;
  density: number;
  active: boolean;
  shapeSalt: number;
  shapePhase: number;
  bendX: number;
  bendY: number;
}

interface HighlandGrassPatch {
  gx: number;
  gy: number;
  radiusX: number;
  radiusY: number;
  active: boolean;
  shapeSalt: number;
  shapePhase: number;
  bendX: number;
  bendY: number;
}

function getPatch(cellX: number, cellY: number, field: TerrainField): GrassPatch {
  const cacheKey = `${field.version}:${field.seed}:${cellX}:${cellY}`;
  const cached = patchCache.get(cacheKey);
  if (cached) return cached;

  const cellStartX = cellX * TALL_GRASS_PATCH_CELL_SIZE;
  const cellStartY = cellY * TALL_GRASS_PATCH_CELL_SIZE;
  const anchorX =
    cellStartX + 2 + Math.floor(seededHash(cellX, cellY, field.seed + TALL_GRASS_PATCH_SALT) * 8);
  const anchorY =
    cellStartY +
    2 +
    Math.floor(seededHash(cellX + 19, cellY - 7, field.seed + TALL_GRASS_PATCH_SALT) * 8);
  const ecology = sampleEcology(anchorX, anchorY, field);
  const density = calculateTallGrassDensity(ecology);
  const radiusVariation = seededHash(cellX - 11, cellY + 23, field.seed + TALL_GRASS_PATCH_SALT);
  const activationRoll = seededHash(cellX + 41, cellY - 37, field.seed + TALL_GRASS_PATCH_SALT);
  const activationChance = TALL_GRASS_BASE_PATCH_CHANCE + density * TALL_GRASS_DENSITY_PATCH_CHANCE;
  const shapeRoll = seededHash(cellX + 61, cellY + 13, field.seed + TALL_GRASS_SHAPE_SALT);
  const shapeSalt = Math.floor(
    seededHash(cellX - 47, cellY + 71, field.seed + TALL_GRASS_SHAPE_SALT) * 100000
  );

  const patch = {
    gx: anchorX,
    gy: anchorY,
    // Larger patches make the grass read as a field and allow it to cross
    // chunk boundaries. The density field still controls whether the patch
    // exists and how large it becomes.
    radiusX: 3 + density * 2 + radiusVariation * 0.6,
    radiusY: 3 + density * 2 + (1 - radiusVariation) * 0.6,
    density,
    active: density >= TALL_GRASS_MIN_PATCH_DENSITY && activationRoll < activationChance,
    shapeSalt,
    shapePhase: shapeRoll * Math.PI * 2,
    bendX: (seededHash(cellX + 83, cellY - 19, field.seed + TALL_GRASS_SHAPE_SALT) - 0.5) * 0.24,
    bendY: (seededHash(cellX - 23, cellY + 89, field.seed + TALL_GRASS_SHAPE_SALT) - 0.5) * 0.24,
  };

  if (patchCache.size >= PATCH_CACHE_LIMIT) {
    const oldestKey = patchCache.keys().next().value;
    if (oldestKey !== undefined) patchCache.delete(oldestKey);
  }
  patchCache.set(cacheKey, patch);
  return patch;
}

/**
 * Generates highland grass patches in world space. Unlike the old chunk-local
 * alpine pass, the patch center and shape are derived from global coordinates,
 * so a single patch can continue across a chunk boundary without a seam.
 */
function getHighlandPatch(cellX: number, cellY: number, field: TerrainField): HighlandGrassPatch {
  const cacheKey = `${field.version}:${field.seed}:${cellX}:${cellY}`;
  const cached = highlandPatchCache.get(cacheKey);
  if (cached) return cached;

  const cellStartX = cellX * HIGHLAND_GRASS_PATCH_CELL_SIZE;
  const cellStartY = cellY * HIGHLAND_GRASS_PATCH_CELL_SIZE;
  const anchorX =
    cellStartX +
    2 +
    Math.floor(seededHash(cellX, cellY, field.seed + HIGHLAND_GRASS_PATCH_SALT) * 8);
  const anchorY =
    cellStartY +
    2 +
    Math.floor(seededHash(cellX + 17, cellY - 13, field.seed + HIGHLAND_GRASS_PATCH_SALT) * 8);
  const ecology = sampleEcology(anchorX, anchorY, field);
  const density = calculateTallGrassDensity(ecology);
  const variation = seededHash(cellX - 9, cellY + 21, field.seed + HIGHLAND_GRASS_SHAPE_SALT);
  const activationRoll = seededHash(cellX + 31, cellY - 29, field.seed + HIGHLAND_GRASS_PATCH_SALT);
  // Highland meadows should read as a real habitat, not isolated decorative
  // tufts. Keep a small uncovered margin around cliffs, but cover most of a
  // healthy plateau with overlapping world-space patches.
  const activationChance = Math.min(0.95, 0.56 + density * 0.38);
  const shapeRoll = seededHash(cellX + 53, cellY + 11, field.seed + HIGHLAND_GRASS_SHAPE_SALT);
  const shapeSalt = Math.floor(
    seededHash(cellX - 41, cellY + 67, field.seed + HIGHLAND_GRASS_SHAPE_SALT) * 100000
  );

  const patch: HighlandGrassPatch = {
    gx: anchorX,
    gy: anchorY,
    radiusX: 3.2 + density * 1.8 + variation * 0.7,
    radiusY: 3.0 + density * 1.7 + (1 - variation) * 0.7,
    active: activationRoll < activationChance,
    shapeSalt,
    shapePhase: shapeRoll * Math.PI * 2,
    bendX: (seededHash(cellX + 71, cellY - 23, field.seed + HIGHLAND_GRASS_SHAPE_SALT) - 0.5) * 0.3,
    bendY: (seededHash(cellX - 19, cellY + 79, field.seed + HIGHLAND_GRASS_SHAPE_SALT) - 0.5) * 0.3,
  };

  if (highlandPatchCache.size >= HIGHLAND_GRASS_PATCH_CACHE_LIMIT) {
    const oldestKey = highlandPatchCache.keys().next().value;
    if (oldestKey !== undefined) highlandPatchCache.delete(oldestKey);
  }
  highlandPatchCache.set(cacheKey, patch);
  return patch;
}

/**
 * Returns whether a world tile belongs to a deterministic tall-grass patch.
 * Terrain and collider restrictions remain the responsibility of the chunk
 * object generator because it owns the concrete tile and collider grids.
 */
export function isTallGrassTile(gx: number, gy: number, field: TerrainField): boolean {
  if (field.isRockyHighland?.(gx, gy) || field.isHighCliff?.(gx, gy)) {
    return false;
  }

  const cellX = Math.floor(gx / TALL_GRASS_PATCH_CELL_SIZE);
  const cellY = Math.floor(gy / TALL_GRASS_PATCH_CELL_SIZE);

  for (let offsetY = -1; offsetY <= 1; offsetY++) {
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      const patch = getPatch(cellX + offsetX, cellY + offsetY, field);
      if (!patch.active) continue;

      const normalizedX = (gx - patch.gx) / patch.radiusX;
      const normalizedY = (gy - patch.gy) / patch.radiusY;
      const warpedX = normalizedX + Math.sin(normalizedY * 1.55 + patch.shapePhase) * patch.bendX;
      const warpedY = normalizedY + Math.cos(normalizedX * 1.35 - patch.shapePhase) * patch.bendY;
      const distance = warpedX * warpedX + warpedY * warpedY;
      if (distance > 1.3) continue;

      // Smooth low-frequency noise creates a natural irregular edge. A small
      // tile-level variation breaks the perfect contour without producing
      // isolated one-tile spikes.
      const shapeNoise = sampleEcologicalNoise(
        gx,
        gy,
        field.seed + patch.shapeSalt,
        TALL_GRASS_SHAPE_SALT,
        0.16
      );
      const edgeVariation =
        (shapeNoise - 0.5) * 0.34 +
        (seededHash(gx, gy, field.seed + TALL_GRASS_VARIATION_SALT) - 0.5) * 0.08;
      const naturalLobe =
        Math.sin(warpedX * 2.2 + patch.shapePhase) * 0.08 +
        Math.cos(warpedY * 1.8 - patch.shapePhase) * 0.06;

      if (distance <= 1 + edgeVariation + naturalLobe) return true;
    }
  }

  return false;
}

/**
 * Returns whether a tile belongs to a natural highland grass patch.
 * The patch lookup is world-coordinate based, allowing grass to cross chunk
 * boundaries while remaining deterministic and limited to plateau interiors.
 */
export function isHighlandTallGrassTile(gx: number, gy: number, field: TerrainField): boolean {
  if (
    !field.isHill(gx, gy) ||
    field.isNearCliffEdge(gx, gy) ||
    field.isDesert?.(gx, gy) ||
    field.isRockyHighland?.(gx, gy) ||
    field.isHighCliff?.(gx, gy)
  ) {
    return false;
  }

  const cellX = Math.floor(gx / HIGHLAND_GRASS_PATCH_CELL_SIZE);
  const cellY = Math.floor(gy / HIGHLAND_GRASS_PATCH_CELL_SIZE);

  for (let offsetY = -1; offsetY <= 1; offsetY++) {
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      const patch = getHighlandPatch(cellX + offsetX, cellY + offsetY, field);
      if (!patch.active) continue;

      const normalizedX = (gx - patch.gx) / patch.radiusX;
      const normalizedY = (gy - patch.gy) / patch.radiusY;
      const warpedX = normalizedX + Math.sin(normalizedY * 1.5 + patch.shapePhase) * patch.bendX;
      const warpedY = normalizedY + Math.cos(normalizedX * 1.3 - patch.shapePhase) * patch.bendY;
      const distance = warpedX * warpedX + warpedY * warpedY;
      if (distance > 1.3) continue;

      const shapeNoise = sampleEcologicalNoise(
        gx,
        gy,
        field.seed + patch.shapeSalt,
        HIGHLAND_GRASS_SHAPE_SALT,
        0.18
      );
      const edgeVariation =
        (shapeNoise - 0.5) * 0.38 +
        (seededHash(gx, gy, field.seed + HIGHLAND_GRASS_SHAPE_SALT) - 0.5) * 0.08;
      const naturalLobe =
        Math.sin(warpedX * 2.0 + patch.shapePhase) * 0.09 +
        Math.cos(warpedY * 1.7 - patch.shapePhase) * 0.07;

      if (distance <= 1 + edgeVariation + naturalLobe) return true;
    }
  }

  return false;
}
