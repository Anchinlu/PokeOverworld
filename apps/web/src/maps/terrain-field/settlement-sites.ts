import {
  type BuildingPlacement,
  type VillagePlantPlacement,
  type VillagePlacement,
  createBuildingPlacement,
} from '../village-rules';
import type { TerrainField } from './terrain-field';
import { V0_CONFIG } from './v0-config';
import { hash2 } from './noise';
import { getStartVillagePlacement } from './start-village';

const HAMLET_NAMES = ['Oakhaven Hamlet', 'Riverside Hamlet', 'Breeze Hamlet', 'Sunlit Hamlet', 'Pine Hamlet'];
const TOWN_NAMES = ['Verdant Town', 'Amber Town', 'Mistveil Town', 'Starlight Town', 'Goldenrod Town'];
const CITY_NAMES = ['Floaroma City', 'Celadon City', 'Rustboro City', 'Lumiose City', 'Jubilife City'];

const settlementCache = new Map<string, VillagePlacement | null>();

/**
 * Deterministically computes or retrieves the settlement for region (rx, ry) if valid.
 */
export function getSettlementForRegion(
  rx: number,
  ry: number,
  field: TerrainField
): VillagePlacement | null {
  const seed = field.seed;
  const key = `${rx},${ry},${seed}`;
  if (settlementCache.has(key)) {
    return settlementCache.get(key)!;
  }

  const regionSize = V0_CONFIG.REGION_TILES; // 96
  const regionCenterGX = rx * regionSize + regionSize / 2;
  const regionCenterGY = ry * regionSize + regionSize / 2;

  // 1. Strict starter protection: no random village inside CALM_R1 (300 tiles)
  if (Math.hypot(regionCenterGX, regionCenterGY) < V0_CONFIG.CALM_R1) {
    settlementCache.set(key, null);
    return null;
  }

  // 2. Probability check
  const probRoll = hash2(rx, ry, seed, V0_CONFIG.VILLAGE_SALT);
  if (probRoll >= V0_CONFIG.VILLAGE_PROB) {
    settlementCache.set(key, null);
    return null;
  }

  // 3. Deterministic candidate anchor offset within the region
  const offX = Math.floor(hash2(rx, ry, seed, V0_CONFIG.VILLAGE_SALT_X) * 48) + 24;
  const offY = Math.floor(hash2(rx, ry, seed, V0_CONFIG.VILLAGE_SALT_Y) * 48) + 24;
  const candGX = rx * regionSize + offX;
  const candGY = ry * regionSize + offY;

  // 4. Strict distance from (0, 0) starter village
  if (Math.hypot(candGX, candGY) < V0_CONFIG.MIN_VILLAGE_DIST) {
    settlementCache.set(key, null);
    return null;
  }

  // 5. Poisson-disk pruning against neighbor regions in 2-region radius
  const prio = hash2(rx, ry, seed, 9999);
  for (let dry = -2; dry <= 2; dry++) {
    for (let drx = -2; drx <= 2; drx++) {
      if (drx === 0 && dry === 0) continue;
      const nrx = rx + drx;
      const nry = ry + dry;

      // Skip neighbors within calm start zone
      const nCenterGX = nrx * regionSize + regionSize / 2;
      const nCenterGY = nry * regionSize + regionSize / 2;
      if (Math.hypot(nCenterGX, nCenterGY) < V0_CONFIG.CALM_R1) continue;

      const nProbRoll = hash2(nrx, nry, seed, V0_CONFIG.VILLAGE_SALT);
      if (nProbRoll >= V0_CONFIG.VILLAGE_PROB) continue;

      const nOffX = Math.floor(hash2(nrx, nry, seed, V0_CONFIG.VILLAGE_SALT_X) * 48) + 24;
      const nOffY = Math.floor(hash2(nrx, nry, seed, V0_CONFIG.VILLAGE_SALT_Y) * 48) + 24;
      const nCandGX = nrx * regionSize + nOffX;
      const nCandGY = nry * regionSize + nOffY;

      if (Math.hypot(candGX - nCandGX, candGY - nCandGY) < V0_CONFIG.MIN_VILLAGE_DIST) {
        const nPrio = hash2(nrx, nry, seed, 9999);
        if (nPrio > prio) {
          // Yield to higher priority candidate
          settlementCache.set(key, null);
          return null;
        }
      }
    }
  }

  // 6. Tier determination
  const tierRoll = hash2(rx, ry, seed, V0_CONFIG.VILLAGE_SALT_TIER);
  const tier = (Math.floor(tierRoll * 100) % 3) as 0 | 1 | 2;

  // 7. Footprint bounds check
  const halfW = tier === 2 ? 15 : tier === 1 ? 13 : 11;
  const halfH = 10;
  const margin = V0_CONFIG.VILLAGE_MARGIN; // 6 tiles

  for (let ty = candGY - halfH - margin; ty <= candGY + halfH + margin; ty++) {
    for (let tx = candGX - halfW - margin; tx <= candGX + halfW + margin; tx++) {
      if (
        field.isOcean(tx, ty) ||
        field.isSand(tx, ty) ||
        field.isHill(tx, ty) ||
        field.isNearCliffEdge(tx, ty) ||
        field.isNearWater(tx, ty, V0_CONFIG.MIN_OCEAN_DIST)
      ) {
        settlementCache.set(key, null);
        return null;
      }
    }
  }

  // 8. Construct valid village placement
  const village = constructVillage(candGX, candGY, tier, rx * 1000 + ry, seed);

  // Keep cache bounded
  if (settlementCache.size >= 128) {
    const first = settlementCache.keys().next().value;
    if (first !== undefined) settlementCache.delete(first);
  }
  settlementCache.set(key, village);
  return village;
}

function constructVillage(
  anchorGX: number,
  anchorGY: number,
  tier: 0 | 1 | 2,
  kId: number,
  seed: number
): VillagePlacement {
  const nameList = tier === 2 ? CITY_NAMES : tier === 1 ? TOWN_NAMES : HAMLET_NAMES;
  const nameIdx = Math.floor(hash2(anchorGX, anchorGY, seed, 444) * nameList.length) % nameList.length;
  const name = nameList[nameIdx];

  const buildings: BuildingPlacement[] = [];
  const pathKeys = new Set<string>();
  const gardenPlants: VillagePlantPlacement[] = [];

  let minGX = 9999;
  let maxGX = -9999;
  let minGY = 9999;
  let maxGY = -9999;

  const addPath = (gx: number, gy: number) => {
    pathKeys.add(`${gx},${gy}`);
    if (gx < minGX) minGX = gx;
    if (gx > maxGX) maxGX = gx;
    if (gy < minGY) minGY = gy;
    if (gy > maxGY) maxGY = gy;
  };

  const addPlant = (gx: number, gy: number, type: string) => {
    if (!pathKeys.has(`${gx},${gy}`)) {
      gardenPlants.push({ gx, gy, type });
    }
  };

  // Standard town building layout
  const bMart = createBuildingPlacement(`v0_${kId}_mart`, 'pokemart', anchorGX - 10, anchorGY + 2);
  const bSign = createBuildingPlacement(`v0_${kId}_sign`, 'signpost', anchorGX - 5, anchorGY + 3);
  const bCen = createBuildingPlacement(`v0_${kId}_cen`, 'pokecenter', anchorGX - 2, anchorGY + 1);
  const bRed = createBuildingPlacement(`v0_${kId}_red`, 'house_red', anchorGX - 10, anchorGY - 8);
  const bCot = createBuildingPlacement(`v0_${kId}_cot`, 'house_cottage', anchorGX - 1, anchorGY - 7);

  buildings.push(bMart, bSign, bCen, bRed, bCot);

  if (tier >= 1) {
    const bFlow = createBuildingPlacement(`v0_${kId}_flow`, 'house_flowers', anchorGX + 7, anchorGY - 7);
    buildings.push(bFlow);
  }
  if (tier >= 2) {
    const bCot2 = createBuildingPlacement(`v0_${kId}_cot2`, 'house_cottage', anchorGX + 7, anchorGY + 2);
    buildings.push(bCot2);
  }

  const maxStreetX = tier >= 1 ? anchorGX + 14 : anchorGX + 8;

  // Main East-West thoroughfare / Boulevard (2 tiles wide)
  for (let gx = anchorGX - 12; gx <= maxStreetX; gx++) {
    addPath(gx, anchorGY - 1);
    addPath(gx, anchorGY);
  }

  // Residential North Lane (2 tiles wide)
  for (let gx = anchorGX - 10; gx <= maxStreetX; gx++) {
    addPath(gx, anchorGY - 5);
    addPath(gx, anchorGY - 4);
  }

  // Vertical connector street between Boulevard and Residential Lane
  for (let gy = anchorGY - 3; gy <= anchorGY - 2; gy++) {
    addPath(anchorGX - 4, gy);
    addPath(anchorGX - 3, gy);
  }

  // Door connectors
  addPath(bRed.doorGX, anchorGY - 6);
  addPath(bRed.doorGX + 1, anchorGY - 6);
  addPath(bCot.doorGX, anchorGY - 6);
  if (tier >= 1) {
    addPath(anchorGX + 10, anchorGY - 6);
  }

  // Commercial South Esplanade (2 tiles wide)
  const maxComX = tier >= 2 ? anchorGX + 14 : anchorGX + 7;
  for (let gx = anchorGX - 11; gx <= maxComX; gx++) {
    addPath(gx, anchorGY + 4);
    addPath(gx, anchorGY + 5);
  }

  // Vertical street connecting Boulevard to Commercial Esplanade
  for (let gy = anchorGY + 1; gy <= anchorGY + 3; gy++) {
    addPath(anchorGX - 4, gy);
    addPath(anchorGX - 3, gy);
  }

  // Door connectors
  addPath(bMart.doorGX, anchorGY + 3);
  addPath(bCen.doorGX, anchorGY + 3);
  if (tier >= 2) {
    addPath(anchorGX + 8, anchorGY + 3);
  }

  // Decorative courtyard plants
  addPlant(anchorGX - 11, anchorGY - 4, 'flower_red');
  addPlant(anchorGX - 11, anchorGY - 5, 'flower_yellow');
  addPlant(anchorGX + 6, anchorGY - 4, 'flower_blue');
  addPlant(anchorGX - 1, anchorGY + 2, 'flower_yellow');

  for (const b of buildings) {
    if (b.gx < minGX) minGX = b.gx;
    if (b.gx + b.widthTiles > maxGX) maxGX = b.gx + b.widthTiles;
    if (b.gy < minGY) minGY = b.gy;
    if (b.gy + b.heightTiles > maxGY) maxGY = b.gy + b.heightTiles;
  }

  return {
    k: kId,
    name,
    tier,
    centerGX: anchorGX,
    centerGY: anchorGY,
    bounds: {
      minGX: minGX - 2,
      maxGX: maxGX + 2,
      minGY: minGY - 2,
      maxGY: maxGY + 2,
    },
    buildings,
    pathTileKeys: pathKeys,
    gardenPlants,
  };
}

/**
 * Returns all settlements that can affect the area around (gx, gy).
 */
export function getNearbySettlements(
  gx: number,
  gy: number,
  field: TerrainField
): VillagePlacement[] {
  const regionSize = V0_CONFIG.REGION_TILES;
  const rx = Math.floor(gx / regionSize);
  const ry = Math.floor(gy / regionSize);

  const results: VillagePlacement[] = [];

  // Check 3x3 surrounding regions
  for (let dry = -1; dry <= 1; dry++) {
    for (let drx = -1; drx <= 1; drx++) {
      const v = getSettlementForRegion(rx + drx, ry + dry, field);
      if (v) results.push(v);
    }
  }

  // Always check starter village if within range of origin
  if (Math.hypot(gx, gy) <= 160) {
    results.push(getStartVillagePlacement(field.seed));
  }

  return results;
}

/**
 * Checks if (gx, gy) is a walkable internal village path.
 */
export function isV0RoadTile(gx: number, gy: number, field: TerrainField): boolean {
  const settlements = getNearbySettlements(gx, gy, field);
  const key = `${gx},${gy}`;
  for (const v of settlements) {
    if (v.pathTileKeys.has(key)) {
      return true;
    }
  }
  return false;
}

/**
 * Retrieves all buildings that intersect a chunk (cx, cy) in World Gen v0.
 */
export function getV0VillageBuildingsForChunk(
  cx: number,
  cy: number,
  field: TerrainField
): BuildingPlacement[] {
  const chunkStartGX = cx * 16;
  const chunkEndGX = chunkStartGX + 16;
  const chunkStartGY = cy * 16;
  const chunkEndGY = chunkStartGY + 16;

  const settlements = getNearbySettlements(chunkStartGX + 8, chunkStartGY + 8, field);
  const result: BuildingPlacement[] = [];

  for (const v of settlements) {
    for (const b of v.buildings) {
      const bMinGX = b.gx;
      const bMaxGX = b.gx + b.widthTiles;
      const bMinGY = b.gy - Math.ceil(b.spriteHeight / 32);
      const bMaxGY = b.gy + b.heightTiles;

      if (
        bMaxGX >= chunkStartGX &&
        bMinGX < chunkEndGX &&
        bMaxGY >= chunkStartGY &&
        bMinGY < chunkEndGY
      ) {
        result.push(b);
      }
    }
  }

  return result;
}

/**
 * Retrieves all curated town garden plants for a chunk (cx, cy) in World Gen v0.
 */
export function getV0VillageGardenPlantsForChunk(
  cx: number,
  cy: number,
  field: TerrainField
): VillagePlantPlacement[] {
  const chunkStartGX = cx * 16;
  const chunkEndGX = chunkStartGX + 16;
  const chunkStartGY = cy * 16;
  const chunkEndGY = chunkStartGY + 16;

  const settlements = getNearbySettlements(chunkStartGX + 8, chunkStartGY + 8, field);
  const result: VillagePlantPlacement[] = [];

  for (const v of settlements) {
    for (const gp of v.gardenPlants) {
      if (
        gp.gx >= chunkStartGX &&
        gp.gx < chunkEndGX &&
        gp.gy >= chunkStartGY &&
        gp.gy < chunkEndGY
      ) {
        result.push(gp);
      }
    }
  }

  return result;
}

/**
 * Checks if (gx, gy) is within the bounds of any settlement in World Gen v0.
 */
export function isV0VillageArea(
  gx: number,
  gy: number,
  field: TerrainField,
  buffer = 0
): boolean {
  const settlements = getNearbySettlements(gx, gy, field);
  for (const v of settlements) {
    if (
      gx >= v.bounds.minGX - buffer &&
      gx <= v.bounds.maxGX + buffer &&
      gy >= v.bounds.minGY - buffer &&
      gy <= v.bounds.maxGY + buffer
    ) {
      return true;
    }
  }
  return false;
}
