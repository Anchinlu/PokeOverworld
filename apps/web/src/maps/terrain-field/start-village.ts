import {
  type BuildingPlacement,
  type VillagePlantPlacement,
  type VillagePlacement,
  createBuildingPlacement,
} from '../village-rules';
import { V0_CONFIG } from './v0-config';

let cachedStartVillage: VillagePlacement | null = null;
let cachedSeed: number | null = null;

/**
 * Returns the deterministic fixed starter village (Twinleaf Hamlet) centered at (0, 0).
 */
export function getStartVillagePlacement(seed = 101): VillagePlacement {
  if (cachedStartVillage && cachedSeed === seed) {
    return cachedStartVillage;
  }

  const anchorGX = V0_CONFIG.START_ANCHOR_GX;
  const anchorGY = V0_CONFIG.START_ANCHOR_GY;

  // 1. Buildings
  // North Residential: House Red (Player home) & House Cottage (Rival / Neighbor)
  const bRed = createBuildingPlacement('v0_start_red', 'house_red', anchorGX - 10, anchorGY - 8);
  const bCot = createBuildingPlacement('v0_start_cot', 'house_cottage', anchorGX - 1, anchorGY - 7);

  // South Commercial: PokéMart, Signpost, PokéCenter
  const bMart = createBuildingPlacement('v0_start_mart', 'pokemart', anchorGX - 10, anchorGY + 2);
  const bSign = createBuildingPlacement('v0_start_sign', 'signpost', anchorGX - 5, anchorGY + 3);
  const bCen = createBuildingPlacement('v0_start_cen', 'pokecenter', anchorGX - 2, anchorGY + 1);

  const buildings: BuildingPlacement[] = [bRed, bCot, bMart, bSign, bCen];

  // 2. Walkable Internal Dirt Roads & Paved Connections
  const pathKeys = new Set<string>();
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

  // Main East-West thoroughfare / Boulevard (2 tiles wide)
  for (let gx = anchorGX - 12; gx <= anchorGX + 8; gx++) {
    addPath(gx, anchorGY - 1);
    addPath(gx, anchorGY);
  }

  // Residential North Lane (2 tiles wide)
  for (let gx = anchorGX - 10; gx <= anchorGX + 7; gx++) {
    addPath(gx, anchorGY - 5);
    addPath(gx, anchorGY - 4);
  }

  // Vertical street connecting Boulevard to Residential Lane
  for (let gy = anchorGY - 3; gy <= anchorGY - 2; gy++) {
    addPath(anchorGX - 4, gy);
    addPath(anchorGX - 3, gy);
  }

  // Direct paths into house doors
  addPath(bRed.doorGX, anchorGY - 6);
  addPath(bRed.doorGX + 1, anchorGY - 6);
  addPath(bCot.doorGX, anchorGY - 6);

  // Commercial South Esplanade (2 tiles wide)
  for (let gx = anchorGX - 11; gx <= anchorGX + 7; gx++) {
    addPath(gx, anchorGY + 4);
    addPath(gx, anchorGY + 5);
  }

  // Vertical street connecting Boulevard to Commercial Esplanade
  for (let gy = anchorGY + 1; gy <= anchorGY + 3; gy++) {
    addPath(anchorGX - 4, gy);
    addPath(anchorGX - 3, gy);
  }

  // Direct paths into shop doors
  addPath(bMart.doorGX, anchorGY + 3);
  addPath(bCen.doorGX, anchorGY + 3);

  // Expand bounds to cover entire village footprint with padding
  for (const b of buildings) {
    if (b.gx < minGX) minGX = b.gx;
    if (b.gx + b.widthTiles > maxGX) maxGX = b.gx + b.widthTiles;
    if (b.gy < minGY) minGY = b.gy;
    if (b.gy + b.heightTiles > maxGY) maxGY = b.gy + b.heightTiles;
  }

  // 3. Decorative Garden Plants & Courtyard Flowers
  const gardenPlants: VillagePlantPlacement[] = [];
  const addPlant = (gx: number, gy: number, type: string) => {
    if (!pathKeys.has(`${gx},${gy}`)) {
      gardenPlants.push({ gx, gy, type });
    }
  };

  addPlant(anchorGX - 11, anchorGY - 4, 'flower_red');
  addPlant(anchorGX - 11, anchorGY - 5, 'flower_yellow');
  addPlant(anchorGX + 8, anchorGY - 4, 'flower_blue');
  addPlant(anchorGX + 8, anchorGY - 5, 'flower_red');
  addPlant(anchorGX - 1, anchorGY + 2, 'flower_yellow');
  addPlant(anchorGX + 6, anchorGY + 2, 'flower_blue');

  const startVillage: VillagePlacement = {
    k: 0,
    name: 'Twinleaf Hamlet',
    tier: 0,
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

  cachedStartVillage = startVillage;
  cachedSeed = seed;
  return startVillage;
}

/**
 * Returns player spawn position right in front of the starter home door.
 */
export function getStartSpawn(): { gx: number; gy: number } {
  const village = getStartVillagePlacement();
  const playerHouse = village.buildings.find((b) => b.type === 'house_red');
  if (playerHouse) {
    return { gx: playerHouse.doorGX, gy: playerHouse.doorGY + 1 };
  }
  return { gx: 0, gy: 0 };
}

/**
 * Checks if a global tile coordinate is inside the start village area.
 */
export function isStartVillageArea(gx: number, gy: number, buffer = 0, seed = 101): boolean {
  const v = getStartVillagePlacement(seed);
  return (
    gx >= v.bounds.minGX - buffer &&
    gx <= v.bounds.maxGX + buffer &&
    gy >= v.bounds.minGY - buffer &&
    gy <= v.bounds.maxGY + buffer
  );
}
