import { fbm2 } from './noise';
import { seededHash } from '../noise';

/** Large world-space cells keep lakes sparse and prevent chunk-shaped ponds. */
export const V4_LAKE_CELL_SIZE = 192;
export const V4_RIVER_SPACING = 320;

const RIVER_PATH_SALT = 0x7b11;
const RIVER_EDGE_SALT = 0x7b12;
const RIVER_BRANCH_SALT = 0x7b13;
const RIVER_ORIENTATION_SALT = 0x7b14;
const LAKE_PLACEMENT_SALT = 0x7b21;
const LAKE_SHAPE_SALT = 0x7b22;
const LAKE_ISLAND_SALT = 0x7b23;

export interface V4LakePlacement {
  readonly cx: number;
  readonly cy: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly phase: number;
}

const LAKE_PLACEMENT_CACHE_LIMIT = 1024;
const lakePlacementCache = new Map<string, V4LakePlacement | null>();

function cacheLakePlacement(
  key: string,
  value: V4LakePlacement | null
): V4LakePlacement | null {
  if (lakePlacementCache.size >= LAKE_PLACEMENT_CACHE_LIMIT) {
    const oldestKey = lakePlacementCache.keys().next().value;
    if (oldestKey !== undefined) lakePlacementCache.delete(oldestKey);
  }
  lakePlacementCache.set(key, value);
  return value;
}

function getRiverCenterY(gx: number, band: number, seed: number): number {
  const bandBase =
    band * V4_RIVER_SPACING +
    V4_RIVER_SPACING / 2 +
    (seededHash(band, 17, seed + RIVER_PATH_SALT) - 0.5) * 104;
  const phase = seededHash(band, 29, seed + RIVER_PATH_SALT) * 1.7;
  const broadBend = (fbm2(gx / 220 + phase, band / 3, seed, RIVER_PATH_SALT, 3) - 0.5) * 118;
  const localBend = (fbm2(gx / 92 + phase * 0.7, band / 2, seed, RIVER_EDGE_SALT, 2) - 0.5) * 38;
  return bandBase + broadBend + localBend;
}

function getRiverCenterX(gy: number, band: number, seed: number): number {
  const bandBase =
    band * V4_RIVER_SPACING +
    V4_RIVER_SPACING / 2 +
    (seededHash(band, 71, seed + RIVER_PATH_SALT) - 0.5) * 104;
  const phase = seededHash(band, 83, seed + RIVER_PATH_SALT) * 1.7;
  const broadBend = (fbm2(gy / 220 + phase, band / 3, seed, RIVER_PATH_SALT + 17, 3) - 0.5) * 118;
  const localBend =
    (fbm2(gy / 92 + phase * 0.7, band / 2, seed, RIVER_EDGE_SALT + 17, 2) - 0.5) * 38;
  return bandBase + broadBend + localBend;
}

function getRiverWidth(gx: number, band: number, seed: number): number {
  const base = 2.8 + seededHash(band, 41, seed + RIVER_PATH_SALT) * 1.5;
  const variation = (fbm2(gx / 86, band / 2, seed, RIVER_EDGE_SALT + band, 3) - 0.5) * 1.9;
  const poolNoise = fbm2(gx / 180, band / 2, seed, RIVER_BRANCH_SALT, 2);
  const pool = poolNoise > 0.72 ? (poolNoise - 0.72) * 10 : 0;
  return base + variation + pool;
}

function isVerticalRiverBand(band: number, seed: number): boolean {
  return seededHash(band, 97, seed + RIVER_ORIENTATION_SALT) > 0.64;
}

function isV4TributaryTile(gx: number, gy: number, seed: number): boolean {
  const approximateBand = Math.floor((gy + V4_RIVER_SPACING / 2) / V4_RIVER_SPACING);
  const segment = Math.floor(gx / V4_RIVER_SPACING);

  for (let band = approximateBand - 1; band <= approximateBand + 1; band++) {
    for (let segmentOffset = -1; segmentOffset <= 1; segmentOffset++) {
      const segmentX = segment + segmentOffset;
      const branchRoll = seededHash(segmentX, band, seed + RIVER_BRANCH_SALT);
      if (branchRoll > 0.6) continue;

      const anchorX =
        segmentX * V4_RIVER_SPACING +
        40 +
        seededHash(segmentX + 7, band - 11, seed + RIVER_BRANCH_SALT) * 240;
      const anchorY = getRiverCenterY(anchorX, band, seed);
      const direction =
        seededHash(segmentX - 13, band + 5, seed + RIVER_BRANCH_SALT) < 0.5 ? -1 : 1;
      const length = 58 + seededHash(segmentX + 19, band + 23, seed + RIVER_BRANCH_SALT) * 112;
      const distanceY = (gy - anchorY) * direction;
      if (distanceY < -4 || distanceY > length) continue;

      const progress = Math.max(0, Math.min(1, distanceY / length));
      const drift = (seededHash(segmentX + 31, band - 17, seed + RIVER_BRANCH_SALT) - 0.5) * 100;
      const bend = (fbm2(gy / 48, segmentX / 3, seed, RIVER_BRANCH_SALT + band, 2) - 0.5) * 22;
      const centerX = anchorX + drift * progress + bend * progress;
      const width = 1.25 + (1 - progress) * 0.9;
      const edge = (fbm2(gx / 38, gy / 38, seed, RIVER_EDGE_SALT + segmentX, 2) - 0.5) * 0.8;
      if (Math.abs(gx - centerX) <= width + edge) return true;
    }
  }
  return false;
}

/** Natural V4 river mask based on continuous, gently meandering world paths. */
export function isV4RiverTile(gx: number, gy: number, seed: number): boolean {
  const horizontalBand = Math.floor((gy + V4_RIVER_SPACING / 2) / V4_RIVER_SPACING);
  for (let band = horizontalBand - 1; band <= horizontalBand + 1; band++) {
    if (isVerticalRiverBand(band, seed)) continue;
    const centerY = getRiverCenterY(gx, band, seed);
    const edgeNoise = (fbm2(gx / 48, gy / 48, seed, RIVER_EDGE_SALT + band, 2) - 0.5) * 1.25;
    if (Math.abs(gy - centerY) <= getRiverWidth(gx, band, seed) + edgeNoise) return true;
  }

  const verticalBand = Math.floor((gx + V4_RIVER_SPACING / 2) / V4_RIVER_SPACING);
  for (let band = verticalBand - 1; band <= verticalBand + 1; band++) {
    if (!isVerticalRiverBand(band, seed)) continue;
    const centerX = getRiverCenterX(gy, band, seed);
    const edgeNoise = (fbm2(gx / 48, gy / 48, seed, RIVER_EDGE_SALT + band + 31, 2) - 0.5) * 1.25;
    if (Math.abs(gx - centerX) <= getRiverWidth(gy, band, seed + 31) + edgeNoise) return true;
  }
  return isV4TributaryTile(gx, gy, seed);
}

export function getV4LakePlacement(
  cellX: number,
  cellY: number,
  seed: number
): V4LakePlacement | null {
  const key = `${cellX},${cellY},${seed}`;
  const cached = lakePlacementCache.get(key);
  if (cached !== undefined || lakePlacementCache.has(key)) return cached ?? null;

  const isHomeLake = cellX === 0 && cellY === 0;
  const spawnRoll = seededHash(cellX, cellY, seed + LAKE_PLACEMENT_SALT);
  if (!isHomeLake && spawnRoll >= 0.5) {
    return cacheLakePlacement(key, null);
  }

  const jitterX = (seededHash(cellX + 11, cellY - 7, seed + LAKE_PLACEMENT_SALT) - 0.5) * 82;
  const jitterY = (seededHash(cellX - 13, cellY + 5, seed + LAKE_PLACEMENT_SALT) - 0.5) * 66;
  const baseRadiusX = 15 + seededHash(cellX, cellY + 23, seed + LAKE_SHAPE_SALT) * 10;
  const baseRadiusY = 11 + seededHash(cellX + 31, cellY, seed + LAKE_SHAPE_SALT) * 9;
  const sizeRoll = seededHash(cellX + 47, cellY - 37, seed + LAKE_SHAPE_SALT);
  const sizeScale = sizeRoll < 0.16 ? 1.7 : sizeRoll < 0.52 ? 1.2 : 0.72;
  const radiusX = baseRadiusX * sizeScale;
  const radiusY = baseRadiusY * sizeScale;
  const placement: V4LakePlacement = {
    cx: cellX * V4_LAKE_CELL_SIZE + V4_LAKE_CELL_SIZE / 2 + jitterX,
    cy: cellY * V4_LAKE_CELL_SIZE + V4_LAKE_CELL_SIZE / 2 + jitterY,
    radiusX,
    radiusY,
    phase: seededHash(cellX + 43, cellY - 19, seed + LAKE_SHAPE_SALT) * 1.7,
  };
  return cacheLakePlacement(key, placement);
}

function isV4LakeShapeTile(gx: number, gy: number, lake: V4LakePlacement): boolean {
  const nx = (gx - lake.cx) / lake.radiusX;
  const ny = (gy - lake.cy) / lake.radiusY;
  const lobe =
    (fbm2(nx * 1.35 + lake.phase, ny * 1.35, Math.round(lake.cx + lake.cy), LAKE_SHAPE_SALT, 3) -
      0.5) *
    0.42;
  const edgeNoise =
    (fbm2(gx / 28, gy / 28, Math.round(lake.cx + lake.cy), LAKE_SHAPE_SALT, 3) - 0.5) * 0.24;
  if (nx * nx + ny * ny > 1 + lobe + edgeNoise) return false;

  // A few larger lakes get a tiny deterministic island. It breaks up the
  // perfect water blob without creating a second terrain generator.
  if (isV4LakeIslandTile(gx, gy, lake)) return false;
  return true;
}

function isV4LakeIslandTile(gx: number, gy: number, lake: V4LakePlacement): boolean {
  const lakeSeed = Math.round(lake.cx * 13 + lake.cy * 17);
  if (seededHash(lakeSeed, 3, LAKE_ISLAND_SALT) > 0.58) return false;

  const islandCX =
    lake.cx + (seededHash(lakeSeed + 11, 7, LAKE_ISLAND_SALT) - 0.5) * lake.radiusX * 0.8;
  const islandCY =
    lake.cy + (seededHash(lakeSeed - 5, 13, LAKE_ISLAND_SALT) - 0.5) * lake.radiusY * 0.8;
  const islandRadiusX = 1.8 + seededHash(lakeSeed + 19, 17, LAKE_ISLAND_SALT) * 2.6;
  const islandRadiusY = 1.4 + seededHash(lakeSeed - 23, 29, LAKE_ISLAND_SALT) * 2.2;
  const nx = (gx - islandCX) / islandRadiusX;
  const ny = (gy - islandCY) / islandRadiusY;
  const edge = (fbm2(gx / 13, gy / 13, lakeSeed, LAKE_ISLAND_SALT, 2) - 0.5) * 0.35;
  return nx * nx + ny * ny <= 1 + edge;
}

/** Checks neighboring placement cells so lake silhouettes remain continuous. */
export function isV4LakeTile(gx: number, gy: number, seed: number): boolean {
  const cellX = Math.floor(gx / V4_LAKE_CELL_SIZE);
  const cellY = Math.floor(gy / V4_LAKE_CELL_SIZE);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const lake = getV4LakePlacement(cellX + dx, cellY + dy, seed);
      if (lake && isV4LakeShapeTile(gx, gy, lake)) return true;
    }
  }
  return false;
}
