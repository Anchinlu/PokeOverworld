import { seededHash } from './noise';
import { TILE_IDS } from '@pokemon/game-data';
import {
  isVillagePathTile,
  isVillageBuildingTile,
  isTreeClippingBuilding,
} from './village-rules';

/**
 * Continuous World Generation Mathematics
 * Computes coastlines, highway curvature, hill plateau shapes, and macro clearance.
 */

export const BEACH_WIDTH = 5;
export const COAST_SEGMENT_HEIGHT = 24;

export function getCoastSegmentCol(k: number, seed: number): number {
  const s = (seed % 1000) * 0.1;
  return Math.round(20 + Math.sin(k * 0.15 + s) * 4 + Math.cos(k * 0.08) * 2);
}

export function getCoastBoundary(gy: number, seed: number): number {
  const H = COAST_SEGMENT_HEIGHT;
  const k = Math.floor(gy / H);
  const yloc = gy - k * H;
  const xk = getCoastSegmentCol(k, seed);
  const xkNext = getCoastSegmentCol(k + 1, seed);

  if (yloc < H - 1 || xkNext === xk) {
    return xk;
  } else if (xkNext === xk - 1) {
    return xk - 1;
  } else {
    return xk;
  }
}

export function getOceanBoundary(gy: number, seed: number): number {
  return getCoastBoundary(gy, seed) + BEACH_WIDTH;
}

export function isSandTile(gx: number, gy: number, seed: number, hasBeach = true): boolean {
  if (!hasBeach) return false;
  const H = COAST_SEGMENT_HEIGHT;
  const k = Math.floor(gy / H);
  const yloc = gy - k * H;
  const xk = getCoastSegmentCol(k, seed);
  const xkNext = getCoastSegmentCol(k + 1, seed);
  const ocean = xk + BEACH_WIDTH;
  const nextOcean = xkNext + BEACH_WIDTH;

  if (yloc < H - 1 || nextOcean === ocean) {
    return gx >= xk && gx < ocean;
  } else if (nextOcean === ocean - 1) {
    return gx >= xk - 1 && gx < ocean - 1;
  } else {
    return gx >= xk && gx < ocean;
  }
}

export function isOceanTile(gx: number, gy: number, seed: number, hasBeach = true): boolean {
  if (!hasBeach) return false;
  const H = COAST_SEGMENT_HEIGHT;
  const k = Math.floor(gy / H);
  const yloc = gy - k * H;
  const xk = getCoastSegmentCol(k, seed);
  const xkNext = getCoastSegmentCol(k + 1, seed);
  const ocean = xk + BEACH_WIDTH;
  const nextOcean = xkNext + BEACH_WIDTH;

  if (yloc < H - 1 || nextOcean === ocean) {
    return gx >= ocean;
  } else if (nextOcean === ocean - 1) {
    return gx >= ocean - 1;
  } else {
    return gx >= ocean;
  }
}

export function getOceanTileId(gx: number, gy: number, seed: number, hasBeach = true): number {
  if (!hasBeach) return TILE_IDS.grass_01;
  const H = COAST_SEGMENT_HEIGHT;
  const k = Math.floor(gy / H);
  const yloc = gy - k * H;
  const xk = getCoastSegmentCol(k, seed);
  const xkNext = getCoastSegmentCol(k + 1, seed);
  const ocean = xk + BEACH_WIDTH;
  const nextOcean = xkNext + BEACH_WIDTH;

  if (yloc < H - 1 || nextOcean === ocean) {
    if (gx === ocean) return TILE_IDS.shore_v;
    if (gx > ocean) return TILE_IDS.ocean_water;
  } else if (nextOcean === ocean - 1) {
    // Step West: smooth 2-tile corner pair
    if (gx === ocean - 1) return TILE_IDS.shore_corner_in;
    if (gx === ocean) return TILE_IDS.shore_corner_out;
    if (gx > ocean) return TILE_IDS.ocean_water;
  } else {
    // Step East: smooth 2-tile corner pair
    if (gx === ocean) return TILE_IDS.shore_corner_in_flip;
    if (gx === ocean + 1) return TILE_IDS.shore_corner_out_flip;
    if (gx > ocean + 1) return TILE_IDS.ocean_water;
  }

  return TILE_IDS.ocean_water;
}

export function getSegmentCol(k: number, seed: number): number {
  const s = (seed % 1000) * 0.1;
  const val = Math.sin(k * 0.45 + s) * 4 + Math.sin(k * 0.15) * 2;
  return Math.round(val);
}

export function getRoadCenterX(gy: number, seed: number): number {
  const H = 24;
  const k = Math.floor(gy / H);
  const yloc = gy - k * H;
  const xk = getSegmentCol(k, seed);
  const xkNext = getSegmentCol(k + 1, seed);

  if (yloc < 18) {
    return xk;
  } else if (yloc < 21) {
    return Math.round((xk + xkNext) / 2);
  } else {
    return xkNext;
  }
}

export function isRoadTile(
  gx: number,
  gy: number,
  seed: number,
  hasRoad = true,
  hasBeach = true
): boolean {
  if (!hasRoad) return false;
  if (isSandTile(gx, gy, seed, hasBeach)) return false;

  const H = 24;
  const k = Math.floor(gy / H);
  const yloc = gy - k * H;
  const xk = getSegmentCol(k, seed);
  const xkNext = getSegmentCol(k + 1, seed);

  // Main highway with 90-degree transitions
  let onMain = false;
  if (yloc < 18) {
    onMain = Math.abs(gx - xk) <= 1;
  } else if (yloc < 21) {
    const minX = Math.min(xk, xkNext) - 1;
    const maxX = Math.max(xk, xkNext) + 1;
    onMain = gx >= minX && gx <= maxX;
  } else {
    onMain = Math.abs(gx - xkNext) <= 1;
  }
  if (onMain) return true;

  // Crossroad branches connecting to coast every 48 tiles
  const branchInterval = 48;
  const branchRow = Math.floor(gy / branchInterval) * branchInterval + 10;
  if (Math.abs(gy - branchRow) <= 1) {
    const branchStart = getRoadCenterX(branchRow, seed);
    const minCoast = Math.min(
      getCoastBoundary(branchRow - 1, seed),
      getCoastBoundary(branchRow, seed),
      getCoastBoundary(branchRow + 1, seed)
    );
    const branchEnd = minCoast - 2;
    if (gx >= branchStart && gx < branchEnd) return true;
  }

  // Village plaza and walkways
  if (isVillagePathTile(gx, gy, seed)) return true;

  return false;
}

export function isNearRoadOrSand(
  gx: number,
  gy: number,
  seed: number,
  dist = 2,
  hasRoad = true,
  hasBeach = true
): boolean {
  for (let dy = -dist; dy <= dist; dy++) {
    for (let dx = -dist; dx <= dist; dx++) {
      if (
        isRoadTile(gx + dx, gy + dy, seed, hasRoad, hasBeach) ||
        isSandTile(gx + dx, gy + dy, seed, hasBeach)
      ) {
        return true;
      }
    }
  }
  return false;
}

const eastHillCache = new Map<string, boolean>();

export function canSpawnEastHill(
  kE: number,
  seed: number,
  hasRoad = true,
  hasBeach = true
): boolean {
  const key = `${kE}_${seed}`;
  if (eastHillCache.has(key)) return eastHillCache.get(key)!;

  const gyStart = kE * 40 - 10 + 4;
  const gyEnd = kE * 40 - 10 + 28;
  for (let gy = gyStart; gy <= gyEnd; gy++) {
    for (let gx = 7; gx <= 16; gx++) {
      if (isNearRoadOrSand(gx, gy, seed, 2, hasRoad, hasBeach)) {
        eastHillCache.set(key, false);
        return false;
      }
    }
  }
  eastHillCache.set(key, true);
  return true;
}

const westMaxXCache = new Map<string, number>();

export function getWestMaxX(kW: number, seed: number, hasRoad = true): number {
  if (!hasRoad) return -8;
  const key = `${kW}_${seed}`;
  if (westMaxXCache.has(key)) return westMaxXCache.get(key)!;

  const gyStart = kW * 32 + 3;
  const gyEnd = kW * 32 + 28;
  let minRoadX = 999;
  for (let gy = gyStart; gy <= gyEnd; gy++) {
    const rx = getRoadCenterX(gy, seed) - 2;
    if (rx < minRoadX) minRoadX = rx;
  }
  const res = Math.min(-8, minRoadX - 3);
  westMaxXCache.set(key, res);
  return res;
}

const hillTileCache = new Map<string, boolean>();

export function isHillTile(
  gx: number,
  gy: number,
  seed: number,
  hasHills = true,
  hasRoad = true,
  hasBeach = true
): boolean {
  if (!hasHills) return false;
  // Fast-exit bounding box: West mountain at [-36..-8], East hills at [8..16].
  if (!((gx >= -36 && gx <= -8) || (gx >= 8 && gx <= 16))) return false;

  const cacheKey = `${gx},${gy}_${seed}`;
  if (hillTileCache.has(cacheKey)) return hillTileCache.get(cacheKey)!;

  let result = false;
  if (!isNearRoadOrSand(gx, gy, seed, 2, hasRoad, hasBeach)) {
    // 1. West Great Mountain Massif (32-tile cycle)
    const kW = Math.floor(gy / 32);
    const ylocW = gy - kW * 32;
    const varW = Math.floor(seededHash(kW, 101, seed) * 4) % 4;
    const maxReach = getWestMaxX(kW, seed, hasRoad);

    let inWest = false;
    if (varW === 0) {
      // Stepped Triple Plateau (width 20 -> 25 -> 28 tiles)
      const midX = Math.min(-11, maxReach - 2);
      const topX = Math.min(-15, midX - 4);
      if (ylocW >= 3 && ylocW <= 8) inWest = gx >= -36 && gx <= topX;
      else if (ylocW >= 9 && ylocW <= 18) inWest = gx >= -36 && gx <= midX;
      else if (ylocW >= 19 && ylocW <= 28) inWest = gx >= -36 && gx <= maxReach;
    } else if (varW === 1) {
      // Deep Canyon Alcove (indented by 8 tiles)
      const outerX = Math.min(-9, maxReach);
      const innerX = outerX - 8;
      if (ylocW >= 3 && ylocW <= 9) inWest = gx >= -36 && gx <= outerX;
      else if (ylocW >= 10 && ylocW <= 19) inWest = gx >= -36 && gx <= innerX;
      else if (ylocW >= 20 && ylocW <= 28) inWest = gx >= -36 && gx <= outerX;
    } else if (varW === 2) {
      // Twin Promontories
      const baseX = Math.min(-14, maxReach - 5);
      const hornX = maxReach;
      if (ylocW >= 3 && ylocW <= 4) inWest = gx >= -36 && gx <= baseX;
      else if (ylocW >= 5 && ylocW <= 11) inWest = gx >= -36 && gx <= hornX;
      else if (ylocW >= 12 && ylocW <= 17) inWest = gx >= -36 && gx <= baseX;
      else if (ylocW >= 18 && ylocW <= 24) inWest = gx >= -36 && gx <= hornX;
      else if (ylocW >= 25 && ylocW <= 28) inWest = gx >= -36 && gx <= baseX;
    } else {
      // Continental Massif with Pass
      const massifX = Math.min(-10, maxReach);
      if (ylocW >= 3 && ylocW <= 26) inWest = gx >= -36 && gx <= massifX;
    }

    if (inWest) {
      result = true;
    } else {
      // 2. East Hills (40-tile cycle)
      const kE = Math.floor((gy + 10) / 40);
      if (canSpawnEastHill(kE, seed, hasRoad, hasBeach)) {
        const ylocE = gy + 10 - kE * 40;
        const varE = Math.floor(seededHash(kE, 202, seed) * 3);
        if (varE === 0) {
          // Grand Stepped Mesa (9x17 tiles)
          if (ylocE >= 6 && ylocE <= 8) result = gx >= 9 && gx <= 13;
          else if (ylocE >= 9 && ylocE <= 19) result = gx >= 8 && gx <= 14;
          else if (ylocE >= 20 && ylocE <= 22) result = gx >= 9 && gx <= 13;
        } else if (varE === 1) {
          // L-Shaped Ridge (19 tiles)
          if (ylocE >= 6 && ylocE <= 14) result = gx >= 8 && gx <= 12;
          else if (ylocE >= 15 && ylocE <= 24) result = gx >= 8 && gx <= 14;
        } else if (varE === 2) {
          // Twin Hills
          if (ylocE >= 5 && ylocE <= 12) result = gx >= 8 && gx <= 13;
          else if (ylocE >= 17 && ylocE <= 26) result = gx >= 8 && gx <= 14;
        }
      }
    }
  }

  hillTileCache.set(cacheKey, result);
  return result;
}

/**
 * Validates global tree positioning against roads, sand, and hill boundaries.
 * Prevents trees from spawning onto highways or cliff edges.
 */
export function isValidTreePosGlobal(tx: number, ty: number, seed: number): boolean {
  if (isTreeClippingBuilding(tx, ty, seed)) {
    return false;
  }

  const ts = 32;
  const cStart = Math.floor((tx + 6) / ts);
  const cEnd = Math.floor((tx + 58) / ts);
  const rStart = Math.floor((ty + 50) / ts);
  const rEnd = Math.floor((ty + 118) / ts);

  let firstHill: boolean | null = null;
  for (let r = rStart; r <= rEnd; r++) {
    for (let c = cStart; c <= cEnd; c++) {
      if (isRoadTile(c, r, seed) || isSandTile(c, r, seed) || isVillageBuildingTile(c, r, seed, 1)) {
        return false;
      }
      const h = isHillTile(c, r, seed);
      if (firstHill === null) {
        firstHill = h;
      } else if (h !== firstHill) {
        return false;
      }
      if (h) {
        const n = isHillTile(c, r - 1, seed);
        const s = isHillTile(c, r + 1, seed);
        const w = isHillTile(c - 1, r, seed);
        const e = isHillTile(c + 1, r, seed);
        if (!n || !s || !w || !e) {
          return false;
        }
      }
    }
  }

  const rootR = Math.floor((ty + 112) / ts);
  const rootC1 = Math.floor((tx + 18) / ts);
  const rootC2 = Math.floor((tx + 46) / ts);

  if (isRoadTile(rootC1, rootR, seed) || isSandTile(rootC1, rootR, seed)) return false;
  if (isRoadTile(rootC2, rootR, seed) || isSandTile(rootC2, rootR, seed)) return false;
  if (isWaterOrBridge(rootC1, rootR, seed) || isWaterOrBridge(rootC2, rootR, seed)) return false;

  return true;
}

/**
 * Validates palm tree positioning on beach sand.
 * - The trunk base tile (gx, gy) must be strictly on sand.
 * - Must not be on water, ocean, road, bridge, or cliff.
 */
export function isValidPalmTreePosGlobal(gx: number, gy: number, seed: number): boolean {
  if (!isSandTile(gx, gy, seed)) return false;
  if (isOceanTile(gx, gy, seed)) return false;
  if (isWaterOrBridge(gx, gy, seed)) return false;
  if (isRoadTile(gx, gy, seed)) return false;
  if (isHillTile(gx, gy, seed)) return false;
  if (isNearWater(gx, gy, seed, 0)) return false;

  const coastX = getCoastBoundary(gy, seed);
  if (gx < coastX + 1 || gx > coastX + 3) return false;

  return true;
}

/**
 * Water, River, Lake & Bridge Generation Rules
 */
export function getRiverBaseY(gy: number): number {
  const H = 96;
  const k = Math.floor(gy / H);
  return k * H + 48;
}

export function isRiverTile(gx: number, gy: number, seed: number): boolean {
  const H = 96;
  const k = Math.floor(gy / H);
  const baseY = k * H + 48;
  if (Math.abs(gy - baseY) > 10) return false;

  const roadX = getRoadCenterX(baseY, seed);

  // Stepped 90-degree offsets for West and East segments
  const rW = Math.floor(seededHash(k, 401, seed) * 3);
  const offW = rW === 0 ? -2 : rW === 1 ? 2 : 0;

  const rE = Math.floor(seededHash(k, 402, seed) * 3);
  const offE = rE === 0 ? 2 : rE === 1 ? -2 : 0;

  const turnW = roadX - 10;
  const turnE = roadX + 9;

  // 1. Center crossing: width 5 from baseY to baseY + 4
  if (gx >= turnW + 3 && gx <= turnE - 3) {
    return gy >= baseY && gy <= baseY + 4;
  }

  // 2. West segment
  if (gx <= turnW) {
    const yW = baseY + offW;
    return gy >= yW && gy <= yW + 4;
  }

  // 3. West 90-degree step transition
  if (gx > turnW && gx < turnW + 3) {
    const minY = Math.min(baseY, baseY + offW);
    const maxY = Math.max(baseY + 4, baseY + offW + 4);
    return gy >= minY && gy <= maxY;
  }

  // 4. East segment
  if (gx >= turnE) {
    const yE = baseY + offE;
    return gy >= yE && gy <= yE + 4;
  }

  // 5. East 90-degree step transition
  if (gx > turnE - 3 && gx < turnE) {
    const minY = Math.min(baseY, baseY + offE);
    const maxY = Math.max(baseY + 4, baseY + offE + 4);
    return gy >= minY && gy <= maxY;
  }

  return false;
}

export function isBridgeTile(gx: number, gy: number, seed: number, hasRoad = true): boolean {
  if (!hasRoad) return false;
  if (!isRiverTile(gx, gy, seed)) return false;
  const roadX = getRoadCenterX(gy, seed);
  return Math.abs(gx - roadX) <= 1;
}

export function isLakeTileVariant(
  gx: number,
  gy: number,
  centerGX: number,
  centerGY: number,
  variant: number
): boolean {
  const dx = gx - centerGX;
  const dy = gy - centerGY;

  if (variant === 0) {
    // Variant 0: Compact Meadow Pond (4x4 with shaved corners)
    if (dx >= -2 && dx <= 1 && dy >= -2 && dy <= 1) {
      if ((dx === -2 || dx === 1) && (dy === -2 || dy === 1)) {
        return false;
      }
      return true;
    }
  } else if (variant === 1) {
    // Variant 1: L-Shaped Lagoon (7x8 with clean 90-degree bend)
    const inH = dx >= -3 && dx <= 3 && dy >= 0 && dy <= 3;
    const inV = dx >= -3 && dx <= 0 && dy >= -4 && dy <= 3;
    return inH || inV;
  } else if (variant === 2) {
    // Variant 2: Grand Stepped Lake (8x11 expansive open water)
    if (dx >= -4 && dx <= 3 && dy >= -5 && dy <= 5) {
      if ((dx <= -3 || dx >= 2) && (dy === -5 || dy === 5)) {
        return false;
      }
      return true;
    }
  } else if (variant === 3) {
    // Variant 3: Twin / Elongated Lake (5x9 oval lake)
    if (dx >= -2 && dx <= 2 && dy >= -4 && dy <= 4) {
      if ((dx === -2 || dx === 2) && (dy === -4 || dy === 4)) {
        return false;
      }
      return true;
    }
  }

  return false;
}

export interface LakePlacement {
  cx: number;
  cy: number;
  variant: number;
}

const lakeCache = new Map<string, LakePlacement | null>();

export function getLakePlacement(
  k: number,
  seed: number,
  hasRoad = true,
  hasBeach = true,
  hasHills = true
): LakePlacement | null {
  const key = `${k}_${seed}_${hasRoad}_${hasBeach}_${hasHills}`;
  if (lakeCache.has(key)) return lakeCache.get(key)!;

  const centerGY = k * 64 + 28;
  const roadX = getRoadCenterX(centerGY, seed);

  // Candidate centers on either side of the highway
  const candidateCXs = [roadX - 5, roadX - 6, roadX + 6, roadX + 5, roadX + 7, roadX - 7];

  const prefVar = Math.floor(seededHash(k, 303, seed) * 4);
  const variantPriority = [prefVar, (prefVar + 1) % 4, 3, 1, 0];

  for (const v of variantPriority) {
    for (const cx of candidateCXs) {
      let fits = true;
      for (let dy = -6; dy <= 6 && fits; dy++) {
        for (let dx = -5; dx <= 5 && fits; dx++) {
          if (isLakeTileVariant(cx + dx, centerGY + dy, cx, centerGY, v)) {
            const gx = cx + dx;
            const gy = centerGY + dy;
            if (
              isRiverTile(gx, gy, seed) ||
              isHillTile(gx, gy, seed, hasHills, hasRoad, hasBeach)
            ) {
              fits = false;
              break;
            }
            if (isNearRoadOrSand(gx, gy, seed, 1, hasRoad, hasBeach)) {
              fits = false;
              break;
            }
          }
        }
      }
      if (fits) {
        const placement = { cx, cy: centerGY, variant: v };
        lakeCache.set(key, placement);
        return placement;
      }
    }
  }

  lakeCache.set(key, null);
  return null;
}

export function isLakeTile(
  gx: number,
  gy: number,
  seed: number,
  hasRoad = true,
  hasBeach = true,
  hasHills = true
): boolean {
  const H = 64;
  const k = Math.floor(gy / H);
  const placement = getLakePlacement(k, seed, hasRoad, hasBeach, hasHills);
  if (!placement) return false;

  return isLakeTileVariant(gx, gy, placement.cx, placement.cy, placement.variant);
}

export function isWaterTile(
  gx: number,
  gy: number,
  seed: number,
  hasWater = true,
  hasRoad = true,
  hasBeach = true,
  hasHills = true
): boolean {
  if (!hasWater) return false;
  if (isBridgeTile(gx, gy, seed, hasRoad)) return false;
  if (isSandTile(gx, gy, seed, hasBeach)) return false;
  if (isHillTile(gx, gy, seed, hasHills, hasRoad, hasBeach)) return false;
  return (
    isOceanTile(gx, gy, seed, hasBeach) ||
    isRiverTile(gx, gy, seed) ||
    isLakeTile(gx, gy, seed, hasRoad, hasBeach, hasHills)
  );
}

export function isWaterOrBridge(
  gx: number,
  gy: number,
  seed: number,
  hasWater = true,
  hasRoad = true,
  hasBeach = true,
  hasHills = true
): boolean {
  if (!hasWater) return false;
  if (isSandTile(gx, gy, seed, hasBeach)) return false;
  if (isHillTile(gx, gy, seed, hasHills, hasRoad, hasBeach)) return false;
  return (
    isOceanTile(gx, gy, seed, hasBeach) ||
    isBridgeTile(gx, gy, seed, hasRoad) ||
    isRiverTile(gx, gy, seed) ||
    isLakeTile(gx, gy, seed, hasRoad, hasBeach, hasHills)
  );
}

export function isNearWater(
  gx: number,
  gy: number,
  seed: number,
  dist = 1,
  hasWater = true
): boolean {
  for (let dy = -dist; dy <= dist; dy++) {
    for (let dx = -dist; dx <= dist; dx++) {
      if (isWaterOrBridge(gx + dx, gy + dy, seed, hasWater)) {
        return true;
      }
    }
  }
  return false;
}

export function isNearCliffEdge(gx: number, gy: number, seed: number): boolean {
  const isSelfHill = isHillTile(gx, gy, seed);

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const isNeighborHill = isHillTile(gx + dx, gy + dy, seed);
      if (isSelfHill && !isNeighborHill) {
        return true;
      }
      if (!isSelfHill && isNeighborHill) {
        return true;
      }
    }
  }

  return false;
}
