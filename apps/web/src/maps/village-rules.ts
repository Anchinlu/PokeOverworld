import { seededHash } from './noise';
import {
  getRoadCenterX,
  isRiverTile,
  isLakeTile,
  isHillTile,
  isSandTile,
  isOceanTile,
  isNearWater,
} from './terrain-rules';

export type BuildingType =
  | 'house_red'
  | 'pokecenter'
  | 'house_cottage'
  | 'house_flowers'
  | 'pokemart'
  | 'signpost';

export interface BuildingSpec {
  widthTiles: number;
  heightTiles: number;
  spriteWidth: number;
  spriteHeight: number;
  renderOffsetX: number;
  renderOffsetY: number;
  doorRelX: number;
  doorRelY: number;
  doorWidthTiles?: number;
}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpec> = {
  house_red: {
    widthTiles: 6,
    heightTiles: 3,
    spriteWidth: 256,
    spriteHeight: 337,
    renderOffsetX: 14,
    renderOffsetY: 157,
    doorRelX: 3,
    doorRelY: 2,
    doorWidthTiles: 2,
  },
  pokecenter: {
    widthTiles: 7,
    heightTiles: 3,
    spriteWidth: 256,
    spriteHeight: 311,
    renderOffsetX: 0,
    renderOffsetY: 164,
    doorRelX: 3,
    doorRelY: 2,
  },
  house_cottage: {
    widthTiles: 6,
    heightTiles: 2,
    spriteWidth: 192,
    spriteHeight: 243,
    renderOffsetX: 0,
    renderOffsetY: 120,
    doorRelX: 1,
    doorRelY: 1,
  },
  house_flowers: {
    widthTiles: 6,
    heightTiles: 2,
    spriteWidth: 192,
    spriteHeight: 319,
    renderOffsetX: 0,
    renderOffsetY: 185,
    doorRelX: 3,
    doorRelY: 1,
  },
  pokemart: {
    widthTiles: 4,
    heightTiles: 2,
    spriteWidth: 129,
    spriteHeight: 133,
    renderOffsetX: 0,
    renderOffsetY: 60,
    doorRelX: 1,
    doorRelY: 1,
  },
  signpost: {
    widthTiles: 1,
    heightTiles: 1,
    spriteWidth: 68,
    spriteHeight: 124,
    renderOffsetX: 18,
    renderOffsetY: 78,
    doorRelX: -1,
    doorRelY: -1,
  },
};

export interface BuildingPlacement {
  id: string;
  type: BuildingType;
  gx: number;
  gy: number;
  widthTiles: number;
  heightTiles: number;
  renderX: number;
  renderY: number;
  spriteWidth: number;
  spriteHeight: number;
  ySort: number;
  doorGX: number;
  doorGY: number;
  doorWidthTiles: number;
}

export interface VillagePlantPlacement {
  gx: number;
  gy: number;
  type: string;
}

export interface VillagePlacement {
  k: number;
  name: string;
  tier: 0 | 1 | 2; // 0=small hamlet, 1=medium town, 2=grand city
  centerGX: number;
  centerGY: number;
  bounds: {
    minGX: number;
    maxGX: number;
    minGY: number;
    maxGY: number;
  };
  buildings: BuildingPlacement[];
  pathTileKeys: Set<string>;
  gardenPlants: VillagePlantPlacement[];
}

export const VILLAGE_CYCLE_HEIGHT = 96;

let isResolvingVillage = false;

const villageCache = new Map<string, VillagePlacement | null>();

/**
 * Checks if a proposed building footprint collides with any water, cliff, sand, or existing building.
 */
function canPlaceBuilding(
  gx: number,
  gy: number,
  widthTiles: number,
  heightTiles: number,
  seed: number,
  existingBuildings: BuildingPlacement[]
): boolean {
  for (let dy = 0; dy < heightTiles; dy++) {
    for (let dx = 0; dx < widthTiles; dx++) {
      const tx = gx + dx;
      const ty = gy + dy;
      if (
        isRiverTile(tx, ty, seed) ||
        isLakeTile(tx, ty, seed) ||
        isHillTile(tx, ty, seed) ||
        isSandTile(tx, ty, seed) ||
        isOceanTile(tx, ty, seed) ||
        isNearWater(tx, ty, seed, 2)
      ) {
        return false;
      }
    }
  }

  // Check overlap with existing buildings (including 1-tile gap)
  for (const b of existingBuildings) {
    if (
      !(
        gx + widthTiles <= b.gx ||
        gx >= b.gx + b.widthTiles ||
        gy + heightTiles <= b.gy ||
        gy >= b.gy + b.heightTiles
      )
    ) {
      return false;
    }
  }

  return true;
}

function createBuildingPlacement(
  id: string,
  type: BuildingType,
  gx: number,
  gy: number
): BuildingPlacement {
  const spec = BUILDING_SPECS[type];
  const renderX = gx * 32 - spec.renderOffsetX;
  const renderY = gy * 32 - spec.renderOffsetY;
  // ySort placed at the front wall base where sprite touches ground
  const ySort = gy * 32 + spec.heightTiles * 32;

  return {
    id,
    type,
    gx,
    gy,
    widthTiles: spec.widthTiles,
    heightTiles: spec.heightTiles,
    renderX,
    renderY,
    spriteWidth: spec.spriteWidth,
    spriteHeight: spec.spriteHeight,
    ySort,
    doorGX: gx + spec.doorRelX,
    doorGY: gy + spec.doorRelY,
    doorWidthTiles: spec.doorWidthTiles ?? 1,
  };
}

/**
 * Computes deterministic village placement for cycle k along the continuous highway.
 */
export function getVillagePlacement(k: number, seed: number): VillagePlacement | null {
  const cacheKey = `${k}_${seed}`;
  if (villageCache.has(cacheKey)) {
    return villageCache.get(cacheKey)!;
  }

  if (isResolvingVillage) {
    return null;
  }

  isResolvingVillage = true;
  try {
    return computeVillagePlacement(k, seed, cacheKey);
  } finally {
    isResolvingVillage = false;
  }
}

function computeVillagePlacement(k: number, seed: number, cacheKey: string): VillagePlacement | null {
  // Midpoint between rivers (rivers are at k * 96 + 48)
  const baseY = k * VILLAGE_CYCLE_HEIGHT;
  const roadX = getRoadCenterX(baseY, seed);

  // Cycle 0 always spawns (Starter Village: Twinleaf Town)
  // For other cycles, roll deterministic chance (approx 75% spawn rate)
  if (k !== 0) {
    const roll = seededHash(k, 888, seed);
    if (roll > 0.78) {
      villageCache.set(cacheKey, null);
      return null;
    }
  }

  // Tier of town: 0 = small hamlet, 1 = medium town, 2 = grand city
  const tier = (k === 0 ? 0 : Math.abs(k) % 3) as 0 | 1 | 2;
  const villageNames = [
    'Twinleaf Hamlet',
    'Verdant Town',
    'Floaroma City',
  ];
  const name = villageNames[tier];

  // Try East side first, then West side
  const sides: Array<'east' | 'west'> = (k % 2 === 0) ? ['east', 'west'] : ['west', 'east'];

  for (const side of sides) {
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
      // Only plant on grass, not on road or building
      if (!pathKeys.has(`${gx},${gy}`)) {
        gardenPlants.push({ gx, gy, type });
      }
    };

    if (side === 'east') {
      const startX = roadX + 3;

      // Every town ALWAYS has PokéCenter + PokéMart + PokéShop Signpost!
      // Layout Strategy:
      // - North Residential: Houses arranged horizontally with garden courtyards (NO vertical stacking!)
      // - South Commercial: PokéMart + Signpost + PokéCenter facing the street
      // - Main Boulevard: Wide street from highway through town center
      // - Every single building door connects directly to a walkable path tile
      const bMart = createBuildingPlacement('b_mart', 'pokemart', startX + 2, baseY + 2);
      // Signpost beside PokéMart (Asset 5 beside Asset 4)
      const bSign = createBuildingPlacement('b_sign', 'signpost', startX + 6, baseY + 3);
      const bCen = createBuildingPlacement('b_cen', 'pokecenter', startX + 9, baseY + 1);
      const bRed = createBuildingPlacement('b_red', 'house_red', startX + 1, baseY - 8);
      const bCot = createBuildingPlacement('b_cot', 'house_cottage', startX + 10, baseY - 7);

      const candidates: BuildingPlacement[] = [bMart, bSign, bCen, bRed, bCot];

      if (tier >= 1) {
        // Medium Town: Add House Flowers to the East
        const bFlow = createBuildingPlacement('b_flow', 'house_flowers', startX + 18, baseY - 7);
        candidates.push(bFlow);
      }
      if (tier >= 2) {
        // Grand City: Add Cottage 2 to the South-East
        const bCot2 = createBuildingPlacement('b_cot2', 'house_cottage', startX + 18, baseY + 2);
        candidates.push(bCot2);
      }

      let allFit = true;
      for (const b of candidates) {
        if (!canPlaceBuilding(b.gx, b.gy, b.widthTiles, b.heightTiles, seed, buildings)) {
          allFit = false;
          break;
        }
        buildings.push(b);
      }
      if (!allFit) continue;

      const maxStreetX = tier === 0 ? startX + 16 : startX + 24;

      // 1. Highway Avenue connecting into town (2 tiles wide)
      for (let gx = roadX + 1; gx <= startX + 2; gx++) {
        addPath(gx, baseY - 1);
        addPath(gx, baseY);
      }

      // 2. Main Central Boulevard (East-West thoroughfare)
      for (let gx = startX + 1; gx <= maxStreetX; gx++) {
        addPath(gx, baseY - 1);
        addPath(gx, baseY);
      }

      // 3. Residential North Lane & Door Connections
      const maxResX = tier >= 1 ? startX + 22 : startX + 14;
      for (let gx = startX + 4; gx <= maxResX; gx++) {
        addPath(gx, baseY - 5);
        addPath(gx, baseY - 4);
      }
      // Vertical street connecting Boulevard to Residential Lane
      for (let gy = baseY - 3; gy <= baseY - 2; gy++) {
        addPath(startX + 7, gy);
        addPath(startX + 8, gy);
      }
      // Direct path into House Red door (2 tiles wide)
      addPath(startX + 4, baseY - 6);
      addPath(startX + 5, baseY - 6);
      // Direct path into Cottage door
      addPath(startX + 11, baseY - 6);
      // Direct path into House Flowers door (if tier >= 1)
      if (tier >= 1) {
        addPath(startX + 21, baseY - 6);
      }

      // 4. Commercial South Esplanade & Door Connections
      const maxComX = tier >= 2 ? startX + 22 : startX + 16;
      for (let gx = startX + 1; gx <= maxComX; gx++) {
        addPath(gx, baseY + 4);
        addPath(gx, baseY + 5);
      }
      // Vertical connector from Boulevard to Commercial Esplanade
      for (let gy = baseY + 1; gy <= baseY + 3; gy++) {
        addPath(startX + 6, gy);
        addPath(startX + 7, gy);
      }
      // Paved entrance into PokéMart door
      addPath(startX + 3, baseY + 3);
      for (let gy = baseY + 1; gy <= baseY + 2; gy++) {
        addPath(startX + 2, gy);
        addPath(startX + 3, gy);
      }
      // Paved path in front of Signpost
      addPath(startX + 6, baseY + 4);
      // Direct path into PokéCenter sliding doors
      addPath(startX + 12, baseY + 3);
      // Direct path into Cottage 2 door (if tier >= 2)
      if (tier >= 2) {
        addPath(startX + 19, baseY + 3);
      }

      // 5. Town Landscaping & Garden Flowerbeds
      // Center Grass Island feature in town square
      addPlant(startX + 9, baseY - 3, 'flower_purple_bell');
      addPlant(startX + 10, baseY - 3, 'flower_blue');

      // Flowerbeds under House Red
      addPlant(startX + 1, baseY - 5, 'flower_red');
      addPlant(startX + 2, baseY - 5, 'flower_white');
      addPlant(startX + 3, baseY - 5, 'flower_red');

      // Courtyard garden between House Red and Cottage
      addPlant(startX + 7, baseY - 7, 'flower_purple_bell');
      addPlant(startX + 8, baseY - 7, 'flower_blue');
      addPlant(startX + 8, baseY - 6, 'flower_purple_bell');

      // Flowerbeds flanking Cottage
      addPlant(startX + 15, baseY - 5, 'flower_purple');
      addPlant(startX + 16, baseY - 5, 'flower_blue');

      // Flanking PokéCenter entrance
      addPlant(startX + 8, baseY + 4, 'flower_blue');
      addPlant(startX + 16, baseY + 4, 'flower_blue');

      // Corner flower beside PokéMart signpost
      addPlant(startX + 7, baseY + 4, 'flower_red');

      if (tier >= 1) {
        // Gardens around House Flowers
        addPlant(startX + 17, baseY - 7, 'flower_purple_bell');
        addPlant(startX + 23, baseY - 5, 'flower_blue');
      }
    } else {
      // West Side Layout (Organic mirrored layout)
      const startX = roadX - (tier === 0 ? 19 : 27);

      const bMart = createBuildingPlacement('b_mart', 'pokemart', startX + 13, baseY + 2);
      // Signpost beside PokéMart on the West side
      const bSign = createBuildingPlacement('b_sign', 'signpost', startX + 17, baseY + 3);
      const bCen = createBuildingPlacement('b_cen', 'pokecenter', startX + 5, baseY + 1);
      const bRed = createBuildingPlacement('b_red', 'house_red', startX + 11, baseY - 8);
      const bCot = createBuildingPlacement('b_cot', 'house_cottage', startX + 3, baseY - 7);

      const candidates: BuildingPlacement[] = [bMart, bSign, bCen, bRed, bCot];

      if (tier >= 1) {
        const bFlow = createBuildingPlacement('b_flow', 'house_flowers', startX - 4, baseY - 7);
        candidates.push(bFlow);
      }
      if (tier >= 2) {
        const bCot2 = createBuildingPlacement('b_cot2', 'house_cottage', startX - 4, baseY + 2);
        candidates.push(bCot2);
      }

      let allFit = true;
      for (const b of candidates) {
        if (!canPlaceBuilding(b.gx, b.gy, b.widthTiles, b.heightTiles, seed, buildings)) {
          allFit = false;
          break;
        }
        buildings.push(b);
      }
      if (!allFit) continue;

      const minStreetX = tier === 0 ? startX + 2 : startX - 4;

      // 1. Highway Avenue connecting into West town
      for (let gx = startX + 18; gx <= roadX - 1; gx++) {
        addPath(gx, baseY - 1);
        addPath(gx, baseY);
      }

      // 2. Main Central Boulevard
      for (let gx = minStreetX; gx <= startX + 18; gx++) {
        addPath(gx, baseY - 1);
        addPath(gx, baseY);
      }

      // 3. Residential North Lane & Door Connections
      const minResX = tier >= 1 ? startX - 3 : startX + 3;
      for (let gx = minResX; gx <= startX + 16; gx++) {
        addPath(gx, baseY - 5);
        addPath(gx, baseY - 4);
      }
      // Vertical street connecting Boulevard to Residential Lane
      for (let gy = baseY - 3; gy <= baseY - 2; gy++) {
        addPath(startX + 10, gy);
        addPath(startX + 11, gy);
      }
      // Direct path into House Red door (2 tiles wide)
      addPath(startX + 14, baseY - 6);
      addPath(startX + 15, baseY - 6);
      // Direct path into Cottage door
      addPath(startX + 4, baseY - 6);
      if (tier >= 1) {
        addPath(startX - 1, baseY - 6);
      }

      // 4. Commercial South Esplanade & Door Connections
      const minComX = tier >= 2 ? startX - 3 : startX + 4;
      for (let gx = minComX; gx <= startX + 18; gx++) {
        addPath(gx, baseY + 4);
        addPath(gx, baseY + 5);
      }
      // Vertical connector from Boulevard to Commercial Esplanade
      for (let gy = baseY + 1; gy <= baseY + 3; gy++) {
        addPath(startX + 11, gy);
        addPath(startX + 12, gy);
      }
      // Direct path into PokéMart door
      addPath(startX + 14, baseY + 3);
      for (let gy = baseY + 1; gy <= baseY + 2; gy++) {
        addPath(startX + 14, gy);
        addPath(startX + 15, gy);
      }
      // In front of Signpost
      addPath(startX + 17, baseY + 4);
      // Direct path into PokéCenter sliding doors
      addPath(startX + 8, baseY + 3);
      if (tier >= 2) {
        addPath(startX - 3, baseY + 3);
      }

      // 5. Landscaping
      addPlant(startX + 9, baseY - 3, 'flower_purple_bell');
      addPlant(startX + 8, baseY - 3, 'flower_blue');
      addPlant(startX + 11, baseY - 5, 'flower_red');
      addPlant(startX + 12, baseY - 5, 'flower_white');
      addPlant(startX + 13, baseY - 5, 'flower_red');
      addPlant(startX + 9, baseY - 7, 'flower_purple_bell');
      addPlant(startX + 2, baseY - 5, 'flower_purple');
      addPlant(startX + 4, baseY + 4, 'flower_blue');
      addPlant(startX + 12, baseY + 4, 'flower_blue');
      addPlant(startX + 18, baseY + 4, 'flower_red');
    }

    // Expand bounding box with all building footprints and paths
    for (const b of buildings) {
      if (b.gx < minGX) minGX = b.gx;
      if (b.gx + b.widthTiles > maxGX) maxGX = b.gx + b.widthTiles;
      if (b.gy < minGY) minGY = b.gy;
      if (b.gy + b.heightTiles > maxGY) maxGY = b.gy + b.heightTiles;
    }

    const placement: VillagePlacement = {
      k,
      name,
      tier,
      centerGX: Math.round((minGX + maxGX) / 2),
      centerGY: baseY,
      bounds: { minGX, maxGX, minGY, maxGY },
      buildings,
      pathTileKeys: pathKeys,
      gardenPlants,
    };

    villageCache.set(cacheKey, placement);
    return placement;
  }

  villageCache.set(cacheKey, null);
  return null;
}

/**
 * Returns the active village placement containing or near global tile (gx, gy).
 */
export function getActiveVillage(gx: number, gy: number, seed: number): VillagePlacement | null {
  const k = Math.round(gy / VILLAGE_CYCLE_HEIGHT);
  for (let dk = -1; dk <= 1; dk++) {
    const v = getVillagePlacement(k + dk, seed);
    if (!v) continue;
    if (
      gx >= v.bounds.minGX - 2 &&
      gx <= v.bounds.maxGX + 2 &&
      gy >= v.bounds.minGY - 2 &&
      gy <= v.bounds.maxGY + 2
    ) {
      return v;
    }
  }
  return null;
}

/**
 * Checks if a global tile is a village walkway or street path tile.
 */
export function isVillagePathTile(gx: number, gy: number, seed: number): boolean {
  if (isResolvingVillage) return false;
  const k = Math.round(gy / VILLAGE_CYCLE_HEIGHT);
  for (let dk = -1; dk <= 1; dk++) {
    const v = getVillagePlacement(k + dk, seed);
    if (v && v.pathTileKeys.has(`${gx},${gy}`)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a global tile is occupied by a building solid footprint (with optional margin).
 */
export function isVillageBuildingTile(gx: number, gy: number, seed: number, buffer = 0): boolean {
  if (isResolvingVillage) return false;
  const k = Math.round(gy / VILLAGE_CYCLE_HEIGHT);
  for (let dk = -1; dk <= 1; dk++) {
    const v = getVillagePlacement(k + dk, seed);
    if (!v) continue;
    for (const b of v.buildings) {
      if (
        gx >= b.gx - buffer &&
        gx < b.gx + b.widthTiles + buffer &&
        gy >= b.gy - buffer &&
        gy < b.gy + b.heightTiles + buffer
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if a tile is covered by any building's roof or solid footprint.
 */
export function isBuildingRoofOrFootprint(gx: number, gy: number, seed: number, buffer = 0): boolean {
  if (isResolvingVillage) return false;
  const k = Math.round(gy / VILLAGE_CYCLE_HEIGHT);
  for (let dk = -1; dk <= 1; dk++) {
    const v = getVillagePlacement(k + dk, seed);
    if (!v) continue;
    for (const b of v.buildings) {
      const roofTopGY = Math.floor(b.renderY / 32);
      if (
        gx >= b.gx - buffer &&
        gx < b.gx + b.widthTiles + buffer &&
        gy >= roofTopGY - buffer &&
        gy < b.gy + b.heightTiles + buffer
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if a tree at top-left pixel (tx, ty) overlaps any building roof, wall, or door approach.
 * Used by tree generator to allow handsome garden trees while avoiding building clipping.
 */
export function isTreeClippingBuilding(tx: number, ty: number, seed: number): boolean {
  const treeLeft = tx - 4;
  const treeRight = tx + 64 + 4;
  const treeTop = ty + 10;
  const treeBottom = ty + 120 + 4;

  const centerGY = Math.floor((ty + 60) / 32);
  const k = Math.round(centerGY / VILLAGE_CYCLE_HEIGHT);

  for (let dk = -1; dk <= 1; dk++) {
    const v = getVillagePlacement(k + dk, seed);
    if (!v) continue;
    for (const b of v.buildings) {
      const bLeft = b.gx * 32 - 16;
      const bRight = (b.gx + b.widthTiles) * 32 + 16;
      const bTop = b.renderY - 16;
      const bBottom = (b.gy + b.heightTiles) * 32 + 32;

      const overlap = !(treeRight <= bLeft || treeLeft >= bRight || treeBottom <= bTop || treeTop >= bBottom);
      if (overlap) return true;
    }
  }

  return false;
}

/**
 * Checks if a global tile is within a village boundary (plus buffer)
 * used exclusively to clear wild tall grass so encounters do not spawn in town.
 */
export function isVillageArea(gx: number, gy: number, seed: number, buffer = 1): boolean {
  if (isResolvingVillage) return false;
  const k = Math.round(gy / VILLAGE_CYCLE_HEIGHT);
  for (let dk = -1; dk <= 1; dk++) {
    const v = getVillagePlacement(k + dk, seed);
    if (!v) continue;
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

/**
 * Retrieves all buildings that intersect a chunk (cx, cy).
 */
export function getVillageBuildingsForChunk(
  cx: number,
  cy: number,
  seed: number
): BuildingPlacement[] {
  const chunkStartGX = cx * 16;
  const chunkEndGX = chunkStartGX + 16;
  const chunkStartGY = cy * 16;
  const chunkEndGY = chunkStartGY + 16;

  const result: BuildingPlacement[] = [];
  const k = Math.round((chunkStartGY + 8) / VILLAGE_CYCLE_HEIGHT);

  for (let dk = -1; dk <= 1; dk++) {
    const v = getVillagePlacement(k + dk, seed);
    if (!v) continue;

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
 * Retrieves all curated town garden plants for a chunk (cx, cy).
 */
export function getVillageGardenPlantsForChunk(
  cx: number,
  cy: number,
  seed: number
): VillagePlantPlacement[] {
  const chunkStartGX = cx * 16;
  const chunkEndGX = chunkStartGX + 16;
  const chunkStartGY = cy * 16;
  const chunkEndGY = chunkStartGY + 16;

  const result: VillagePlantPlacement[] = [];
  const k = Math.round((chunkStartGY + 8) / VILLAGE_CYCLE_HEIGHT);

  for (let dk = -1; dk <= 1; dk++) {
    const v = getVillagePlacement(k + dk, seed);
    if (!v) continue;

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
