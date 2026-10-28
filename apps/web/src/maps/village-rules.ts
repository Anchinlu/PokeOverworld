import { seededHash } from './noise';
import {
  createTerrainField,
  type TerrainField,
  isV0VillageArea,
  getNearbySettlements,
} from './terrain-field';

export type BuildingType =
  | 'house_red'
  | 'pokecenter'
  | 'house_cottage'
  | 'house_flowers'
  | 'pokemart'
  | 'signpost'
  | 'lab_okido'
  | 'house_player'
  | 'house_rival'
  | 'house_villager_3'
  | 'house_villager_4'
  | 'ranch_barn'
  | 'feed_crops'
  | 'hay_bale'
  | 'hay_stack_1'
  | 'hay_stack_2'
  | 'water_trough'
  | 'fence_horizontal'
  | 'fence_vertical'
  | 'bench_stone_large'
  | 'bench_stone_small'
  | 'plant_potted_tall'
  | 'plant_potted_low'
  | 'city_pokecenter'
  | 'city_pokemart'
  | 'city_police_station'
  | 'city_house_default'
  | 'city_house_1'
  | 'city_house_2'
  | 'city_house_3'
  | 'city_house_4'
  | 'city_house_5'
  | 'city_house_6'
  | 'city_house_7'
  | 'city_house_8'
  | 'city_utility_pole'
  | 'city_guide_sign'
  | 'city_hill_stairs';

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
  isSolid?: boolean;
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
  lab_okido: {
    widthTiles: 7,
    heightTiles: 4,
    spriteWidth: 256,
    spriteHeight: 256,
    renderOffsetX: 0,
    renderOffsetY: 128,
    doorRelX: 3,
    doorRelY: 3,
    doorWidthTiles: 2,
  },
  house_player: {
    widthTiles: 5,
    heightTiles: 3,
    spriteWidth: 160,
    spriteHeight: 192,
    renderOffsetX: 0,
    renderOffsetY: 96,
    doorRelX: 2,
    doorRelY: 2,
    doorWidthTiles: 1,
  },
  house_rival: {
    widthTiles: 5,
    heightTiles: 3,
    spriteWidth: 160,
    spriteHeight: 192,
    renderOffsetX: 0,
    renderOffsetY: 96,
    doorRelX: 2,
    doorRelY: 2,
    doorWidthTiles: 1,
  },
  house_villager_3: {
    widthTiles: 4,
    heightTiles: 2,
    spriteWidth: 128,
    spriteHeight: 160,
    renderOffsetX: 0,
    renderOffsetY: 96,
    doorRelX: 1,
    doorRelY: 1,
    doorWidthTiles: 1,
  },
  house_villager_4: {
    widthTiles: 4,
    heightTiles: 2,
    spriteWidth: 128,
    spriteHeight: 160,
    renderOffsetX: 0,
    renderOffsetY: 96,
    doorRelX: 1,
    doorRelY: 1,
    doorWidthTiles: 1,
  },
  ranch_barn: {
    widthTiles: 7,
    heightTiles: 3,
    spriteWidth: 256,
    spriteHeight: 288,
    renderOffsetX: 0,
    renderOffsetY: 96,
    doorRelX: 2,
    doorRelY: 2,
    doorWidthTiles: 2,
  },
  feed_crops: {
    widthTiles: 3,
    heightTiles: 4,
    spriteWidth: 96,
    spriteHeight: 128,
    renderOffsetX: 0,
    renderOffsetY: 0,
    doorRelX: -1,
    doorRelY: -1,
    isSolid: false,
  },
  hay_bale: {
    widthTiles: 3,
    heightTiles: 2,
    spriteWidth: 96,
    spriteHeight: 96,
    renderOffsetX: 0,
    renderOffsetY: 32,
    doorRelX: -1,
    doorRelY: -1,
  },
  hay_stack_1: {
    widthTiles: 2,
    heightTiles: 1,
    spriteWidth: 64,
    spriteHeight: 64,
    renderOffsetX: 0,
    renderOffsetY: 32,
    doorRelX: -1,
    doorRelY: -1,
  },
  hay_stack_2: {
    widthTiles: 2,
    heightTiles: 1,
    spriteWidth: 64,
    spriteHeight: 64,
    renderOffsetX: 0,
    renderOffsetY: 32,
    doorRelX: -1,
    doorRelY: -1,
  },
  water_trough: {
    widthTiles: 1,
    heightTiles: 2,
    spriteWidth: 32,
    spriteHeight: 96,
    renderOffsetX: 0,
    renderOffsetY: 32,
    doorRelX: -1,
    doorRelY: -1,
  },
  fence_horizontal: {
    widthTiles: 3,
    heightTiles: 1,
    spriteWidth: 96,
    spriteHeight: 64,
    renderOffsetX: 0,
    renderOffsetY: 32,
    doorRelX: -1,
    doorRelY: -1,
  },
  fence_vertical: {
    widthTiles: 1,
    heightTiles: 5,
    spriteWidth: 32,
    spriteHeight: 160,
    renderOffsetX: 0,
    renderOffsetY: 0,
    doorRelX: -1,
    doorRelY: -1,
  },
  bench_stone_large: {
    widthTiles: 3,
    heightTiles: 1,
    spriteWidth: 96,
    spriteHeight: 64,
    renderOffsetX: 0,
    renderOffsetY: 32,
    doorRelX: -1,
    doorRelY: -1,
  },
  bench_stone_small: {
    widthTiles: 2,
    heightTiles: 1,
    spriteWidth: 64,
    spriteHeight: 64,
    renderOffsetX: 0,
    renderOffsetY: 32,
    doorRelX: -1,
    doorRelY: -1,
  },
  plant_potted_tall: {
    widthTiles: 1,
    heightTiles: 1,
    spriteWidth: 32,
    spriteHeight: 64,
    renderOffsetX: 0,
    renderOffsetY: 32,
    doorRelX: -1,
    doorRelY: -1,
  },
  plant_potted_low: {
    widthTiles: 2,
    heightTiles: 1,
    spriteWidth: 64,
    spriteHeight: 64,
    renderOffsetX: 0,
    renderOffsetY: 32,
    doorRelX: -1,
    doorRelY: -1,
  },
  city_pokecenter: {
    widthTiles: 8,
    heightTiles: 4,
    spriteWidth: 256,
    spriteHeight: 256,
    renderOffsetX: 0,
    renderOffsetY: 128,
    doorRelX: 3,
    doorRelY: 3,
    doorWidthTiles: 2,
    isSolid: true,
  },
  city_pokemart: {
    widthTiles: 4,
    heightTiles: 2,
    spriteWidth: 128,
    spriteHeight: 128,
    renderOffsetX: 0,
    renderOffsetY: 64,
    doorRelX: 1,
    doorRelY: 1,
    doorWidthTiles: 1,
    isSolid: true,
  },
  city_police_station: {
    widthTiles: 5,
    heightTiles: 3,
    spriteWidth: 160,
    spriteHeight: 224,
    renderOffsetX: 0,
    renderOffsetY: 128,
    doorRelX: 2,
    doorRelY: 2,
    doorWidthTiles: 1,
    isSolid: true,
  },
  city_house_default: {
    widthTiles: 7,
    heightTiles: 3,
    spriteWidth: 224,
    spriteHeight: 256,
    renderOffsetX: 0,
    renderOffsetY: 160,
    doorRelX: 3,
    doorRelY: 2,
    doorWidthTiles: 1,
    isSolid: true,
  },
  city_house_1: {
    widthTiles: 4,
    heightTiles: 3,
    spriteWidth: 128,
    spriteHeight: 224,
    renderOffsetX: 0,
    renderOffsetY: 128,
    doorRelX: 1,
    doorRelY: 2,
    doorWidthTiles: 1,
    isSolid: true,
  },
  city_house_2: {
    widthTiles: 4,
    heightTiles: 3,
    spriteWidth: 128,
    spriteHeight: 224,
    renderOffsetX: 0,
    renderOffsetY: 128,
    doorRelX: 1,
    doorRelY: 2,
    doorWidthTiles: 1,
    isSolid: true,
  },
  city_house_3: {
    widthTiles: 5,
    heightTiles: 3,
    spriteWidth: 160,
    spriteHeight: 224,
    renderOffsetX: 0,
    renderOffsetY: 128,
    doorRelX: 2,
    doorRelY: 2,
    doorWidthTiles: 1,
    isSolid: true,
  },
  city_house_4: {
    widthTiles: 4,
    heightTiles: 3,
    spriteWidth: 128,
    spriteHeight: 224,
    renderOffsetX: 0,
    renderOffsetY: 128,
    doorRelX: 1,
    doorRelY: 2,
    doorWidthTiles: 1,
    isSolid: true,
  },
  city_house_5: {
    widthTiles: 5,
    heightTiles: 3,
    spriteWidth: 160,
    spriteHeight: 224,
    renderOffsetX: 0,
    renderOffsetY: 128,
    doorRelX: 2,
    doorRelY: 2,
    doorWidthTiles: 1,
    isSolid: true,
  },
  city_house_6: {
    widthTiles: 7,
    heightTiles: 3,
    spriteWidth: 224,
    spriteHeight: 224,
    renderOffsetX: 0,
    renderOffsetY: 128,
    doorRelX: 3,
    doorRelY: 2,
    doorWidthTiles: 1,
    isSolid: true,
  },
  city_house_7: {
    widthTiles: 7,
    heightTiles: 3,
    spriteWidth: 224,
    spriteHeight: 224,
    renderOffsetX: 0,
    renderOffsetY: 128,
    doorRelX: 3,
    doorRelY: 2,
    doorWidthTiles: 1,
    isSolid: true,
  },
  city_house_8: {
    widthTiles: 5,
    heightTiles: 3,
    spriteWidth: 160,
    spriteHeight: 224,
    renderOffsetX: 0,
    renderOffsetY: 128,
    doorRelX: 2,
    doorRelY: 2,
    doorWidthTiles: 1,
    isSolid: true,
  },
  city_utility_pole: {
    widthTiles: 2,
    heightTiles: 1,
    spriteWidth: 64,
    spriteHeight: 96,
    renderOffsetX: 0,
    renderOffsetY: 64,
    doorRelX: -1,
    doorRelY: -1,
    isSolid: true,
  },
  city_guide_sign: {
    widthTiles: 1,
    heightTiles: 1,
    spriteWidth: 32,
    spriteHeight: 64,
    renderOffsetX: 0,
    renderOffsetY: 32,
    doorRelX: -1,
    doorRelY: -1,
    isSolid: true,
  },
  city_hill_stairs: {
    widthTiles: 3,
    heightTiles: 3,
    spriteWidth: 96,
    spriteHeight: 96,
    renderOffsetX: 0,
    renderOffsetY: 0,
    doorRelX: -1,
    doorRelY: -1,
    isSolid: false,
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
  isSolid?: boolean;
}

export interface VillagePlantPlacement {
  gx: number;
  gy: number;
  type: string;
}

import type {
  NPCEmoteType,
  NPCEventAction,
  NPCMovementMode,
  NPCRuntimeState,
  NPCScheduleRule,
} from '../npc/npc-types';

export interface VillageNPCEntity {
  id: string;
  name: string;
  spriteKey: string;
  gx: number;
  gy: number;
  direction: 0 | 1 | 2 | 3; // 0=down, 1=left, 2=right, 3=up
  initialDirection: 0 | 1 | 2 | 3;
  idleBehavior?: 'stand' | 'turn_random' | 'turn_cycle';
  movementMode?: NPCMovementMode;
  turnCycle?: Array<0 | 1 | 2 | 3>;
  turnIntervalMs?: number;
  wanderRadius?: number;
  patrolPath?: Array<{ gx: number; gy: number }>;
  lookAtPlayerRadius?: number;
  ambientEmotePool?: NPCEmoteType[];
  schedule?: NPCScheduleRule[];
  scriptId?: string;
  trainerId?: string;
  actionsOnComplete?: NPCEventAction[];
  runtime?: NPCRuntimeState;
  dialogue: string[];
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
  npcs?: VillageNPCEntity[];
  entranceGX?: number;
  entranceGY?: number;
}

export const VILLAGE_CYCLE_HEIGHT = 96;

let isResolvingVillage = false;

const villageCache = new Map<string, VillagePlacement | null>();

/**
 * Checks if a proposed building footprint collides with any water, cliff, sand, or existing building.
 */
export function canPlaceBuilding(
  gx: number,
  gy: number,
  widthTiles: number,
  heightTiles: number,
  field: TerrainField,
  existingBuildings: BuildingPlacement[]
): boolean {
  for (let dy = 0; dy < heightTiles; dy++) {
    for (let dx = 0; dx < widthTiles; dx++) {
      const tx = gx + dx;
      const ty = gy + dy;
      if (
        field.isWater(tx, ty) ||
        field.isHill(tx, ty) ||
        field.isSand(tx, ty) ||
        field.isOcean(tx, ty) ||
        field.isNearWater(tx, ty, 2)
      ) {
        return false;
      }
    }
  }

  // Check overlap with existing buildings (including 1-tile gap)
  for (const b of existingBuildings) {
    if (!(
      gx + widthTiles <= b.gx ||
      gx >= b.gx + b.widthTiles ||
      gy + heightTiles <= b.gy ||
      gy >= b.gy + b.heightTiles
    )) {
      return false;
    }
  }

  return true;
}

export function createBuildingPlacement(
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
    isSolid: spec.isSolid !== false,
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

function computeVillagePlacement(
  k: number,
  seed: number,
  cacheKey: string
): VillagePlacement | null {
  const field = createTerrainField(1, seed);

  // Cycle 0 always spawns (Starter Village: Twinleaf Town)
  // Cycle -1 always spawns (First Milestone: Verdant Town / Viridian City)
  if (k !== 0 && k !== -1) {
    const roll = seededHash(k, 888, seed);
    if (roll > 0.78) {
      villageCache.set(cacheKey, null);
      return null;
    }
  }

  // Tier of town: 0 = small hamlet, 1 = medium town, 2 = grand city
  const tier = (k === 0 ? 0 : Math.abs(k) % 3) as 0 | 1 | 2;
  const villageNames = ['Twinleaf Hamlet', 'Verdant Town', 'Floaroma City'];
  const name = villageNames[tier];

  // Try East side first, then West side
  const sides: Array<'east' | 'west'> = k % 2 === 0 ? ['east', 'west'] : ['west', 'east'];
  const yOffsets = [0, 8, 12, 16, 20, 24, -8, -12, -16];

  for (const yOffset of yOffsets) {
    const baseY = k * VILLAGE_CYCLE_HEIGHT + yOffset;
    const roadX = field.getRoadCenterX(baseY);

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

        // 1. Highway Avenue connecting into town (2 tiles wide)
        for (let gx = roadX + 1; gx <= startX + 2; gx++) {
          addPath(gx, baseY - 1);
          addPath(gx, baseY);
        }

        if (tier >= 1) {
          // ==========================================
          // CITY LAYOUT (Tier >= 1: Verdant City / Floaroma City)
          // ==========================================
          const bCen = createBuildingPlacement('b_cen', 'city_pokecenter', startX + 1, baseY + 1);
          const bSign = createBuildingPlacement('b_sign', 'city_guide_sign', startX + 10, baseY + 3);
          const bMart = createBuildingPlacement('b_mart', 'city_pokemart', startX + 12, baseY + 2);

          const coreCandidates = [bCen, bSign, bMart];
          let allFit = true;
          for (const b of coreCandidates) {
            if (!canPlaceBuilding(b.gx, b.gy, b.widthTiles, b.heightTiles, field, buildings)) {
              allFit = false;
              break;
            }
            buildings.push(b);
          }
          if (!allFit) continue;

          // Optional City Public & Residential Extensions
          const cityOptionals = [
            createBuildingPlacement('b_pol', 'city_police_station', startX + 17, baseY + 1),
            createBuildingPlacement('b_h1', 'city_house_1', startX + 1, baseY - 8),
            createBuildingPlacement('b_h2', 'city_house_3', startX + 6, baseY - 8),
            createBuildingPlacement('b_h3', 'city_house_6', startX + 12, baseY - 8),
            createBuildingPlacement('b_pole1', 'city_utility_pole', startX + 1, baseY - 2),
            createBuildingPlacement('b_pole2', 'city_utility_pole', startX + 10, baseY - 2),
          ];

          for (const opt of cityOptionals) {
            if (canPlaceBuilding(opt.gx, opt.gy, opt.widthTiles, opt.heightTiles, field, buildings)) {
              buildings.push(opt);
            }
          }

          const maxStreetX = startX + 22;
          // Main Boulevard
          for (let gx = startX + 1; gx <= maxStreetX; gx++) {
            addPath(gx, baseY - 1);
            addPath(gx, baseY);
          }

          // Residential North Lane & Door Connections
          for (let gx = startX + 1; gx <= maxStreetX - 2; gx++) {
            addPath(gx, baseY - 5);
            addPath(gx, baseY - 4);
          }
          for (let gy = baseY - 3; gy <= baseY - 2; gy++) {
            addPath(startX + 6, gy);
            addPath(startX + 7, gy);
          }

          // Direct path into each placed building door
          for (const b of buildings) {
            if (b.doorGX >= 0 && b.doorGY >= 0) {
              addPath(b.doorGX, b.doorGY);
              addPath(b.doorGX, b.doorGY + 1);
              if (b.doorWidthTiles && b.doorWidthTiles > 1) {
                addPath(b.doorGX + 1, b.doorGY);
                addPath(b.doorGX + 1, b.doorGY + 1);
              }
            }
          }

          // Urban Landscaping
          addPlant(startX + 9, baseY - 3, 'flower_purple_bell');
          addPlant(startX + 10, baseY - 3, 'flower_blue');
          addPlant(startX + 11, baseY + 4, 'flower_blue');
        } else {
          // ==========================================
          // RURAL VILLAGE LAYOUT (Tier 0: Hamlet)
          // ==========================================
          const bMart = createBuildingPlacement('b_mart', 'pokemart', startX + 2, baseY + 2);
          const bSign = createBuildingPlacement('b_sign', 'signpost', startX + 6, baseY + 3);
          const bCen = createBuildingPlacement('b_cen', 'pokecenter', startX + 9, baseY + 1);
          const bRed = createBuildingPlacement('b_red', 'house_red', startX + 1, baseY - 8);
          const bCot = createBuildingPlacement('b_cot', 'house_cottage', startX + 10, baseY - 7);

          const coreCandidates = [bMart, bSign, bCen, bRed, bCot];
          let allFit = true;
          for (const b of coreCandidates) {
            if (!canPlaceBuilding(b.gx, b.gy, b.widthTiles, b.heightTiles, field, buildings)) {
              allFit = false;
              break;
            }
            buildings.push(b);
          }
          if (!allFit) continue;

          const maxStreetX = startX + 16;
          for (let gx = startX + 1; gx <= maxStreetX; gx++) {
            addPath(gx, baseY - 1);
            addPath(gx, baseY);
          }
          for (let gx = startX + 4; gx <= startX + 14; gx++) {
            addPath(gx, baseY - 5);
            addPath(gx, baseY - 4);
          }
          for (let gy = baseY - 3; gy <= baseY - 2; gy++) {
            addPath(startX + 7, gy);
            addPath(startX + 8, gy);
          }
          addPath(startX + 4, baseY - 6);
          addPath(startX + 5, baseY - 6);
          addPath(startX + 11, baseY - 6);

          for (let gx = startX + 1; gx <= startX + 16; gx++) {
            addPath(gx, baseY + 4);
            addPath(gx, baseY + 5);
          }
          for (let gy = baseY + 1; gy <= baseY + 3; gy++) {
            addPath(startX + 6, gy);
            addPath(startX + 7, gy);
          }
          addPath(startX + 3, baseY + 3);
          addPath(startX + 6, baseY + 4);
          addPath(startX + 12, baseY + 3);

          addPlant(startX + 9, baseY - 3, 'flower_purple_bell');
          addPlant(startX + 10, baseY - 3, 'flower_blue');
          addPlant(startX + 1, baseY - 5, 'flower_red');
        }
      } else {
        // West Side Layout (Organic mirrored layout)
        const startX = roadX - (tier === 0 ? 19 : 25);

        // 1. Highway Avenue connecting into West town
        for (let gx = startX + 18; gx <= roadX - 1; gx++) {
          addPath(gx, baseY - 1);
          addPath(gx, baseY);
        }

        if (tier >= 1) {
          // ==========================================
          // CITY LAYOUT (West Side)
          // ==========================================
          const bCen = createBuildingPlacement('b_cen', 'city_pokecenter', startX + 1, baseY + 1);
          const bSign = createBuildingPlacement('b_sign', 'city_guide_sign', startX + 10, baseY + 3);
          const bMart = createBuildingPlacement('b_mart', 'city_pokemart', startX + 12, baseY + 2);

          const coreCandidates = [bCen, bSign, bMart];
          let allFit = true;
          for (const b of coreCandidates) {
            if (!canPlaceBuilding(b.gx, b.gy, b.widthTiles, b.heightTiles, field, buildings)) {
              allFit = false;
              break;
            }
            buildings.push(b);
          }
          if (!allFit) continue;

          const cityOptionals = [
            createBuildingPlacement('b_pol', 'city_police_station', startX + 17, baseY + 1),
            createBuildingPlacement('b_h1', 'city_house_1', startX + 1, baseY - 8),
            createBuildingPlacement('b_h2', 'city_house_3', startX + 6, baseY - 8),
            createBuildingPlacement('b_h3', 'city_house_6', startX + 12, baseY - 8),
            createBuildingPlacement('b_pole1', 'city_utility_pole', startX + 1, baseY - 2),
          ];
          for (const opt of cityOptionals) {
            if (canPlaceBuilding(opt.gx, opt.gy, opt.widthTiles, opt.heightTiles, field, buildings)) {
              buildings.push(opt);
            }
          }

          const minStreetX = startX + 1;
          for (let gx = minStreetX; gx <= startX + 18; gx++) {
            addPath(gx, baseY - 1);
            addPath(gx, baseY);
          }

          for (const b of buildings) {
            if (b.doorGX >= 0 && b.doorGY >= 0) {
              addPath(b.doorGX, b.doorGY);
              addPath(b.doorGX, b.doorGY + 1);
              if (b.doorWidthTiles && b.doorWidthTiles > 1) {
                addPath(b.doorGX + 1, b.doorGY);
                addPath(b.doorGX + 1, b.doorGY + 1);
              }
            }
          }
        } else {
          // Rural West Layout
          const bMart = createBuildingPlacement('b_mart', 'pokemart', startX + 13, baseY + 2);
          const bSign = createBuildingPlacement('b_sign', 'signpost', startX + 17, baseY + 3);
          const bCen = createBuildingPlacement('b_cen', 'pokecenter', startX + 5, baseY + 1);
          const bRed = createBuildingPlacement('b_red', 'house_red', startX + 11, baseY - 8);
          const bCot = createBuildingPlacement('b_cot', 'house_cottage', startX + 3, baseY - 7);

          const coreCandidates = [bMart, bSign, bCen, bRed, bCot];
          let allFit = true;
          for (const b of coreCandidates) {
            if (!canPlaceBuilding(b.gx, b.gy, b.widthTiles, b.heightTiles, field, buildings)) {
              allFit = false;
              break;
            }
            buildings.push(b);
          }
          if (!allFit) continue;

          const minStreetX = startX + 2;
          for (let gx = minStreetX; gx <= startX + 18; gx++) {
            addPath(gx, baseY - 1);
            addPath(gx, baseY);
          }
          for (let gx = startX + 3; gx <= startX + 16; gx++) {
            addPath(gx, baseY - 5);
            addPath(gx, baseY - 4);
          }
          for (let gy = baseY - 3; gy <= baseY - 2; gy++) {
            addPath(startX + 10, gy);
            addPath(startX + 11, gy);
          }
          addPath(startX + 14, baseY - 6);
          addPath(startX + 15, baseY - 6);
          addPath(startX + 4, baseY - 6);

          for (let gx = startX + 4; gx <= startX + 18; gx++) {
            addPath(gx, baseY + 4);
            addPath(gx, baseY + 5);
          }
          for (let gy = baseY + 1; gy <= baseY + 3; gy++) {
            addPath(startX + 11, gy);
            addPath(startX + 12, gy);
          }
          addPath(startX + 14, baseY + 3);
          addPath(startX + 17, baseY + 4);
          addPath(startX + 8, baseY + 3);

          addPlant(startX + 9, baseY - 3, 'flower_purple_bell');
          addPlant(startX + 8, baseY - 3, 'flower_blue');
        }
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
        entranceGX: side === 'east' ? roadX + 2 : roadX - 2,
        entranceGY: baseY,
      };

      villageCache.set(cacheKey, placement);
      return placement;
    }
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
export function isVillageBuildingTile(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  buffer = 0
): boolean {
  if (isResolvingVillage) return false;
  const field = typeof seedOrField === 'number' ? createTerrainField(1, seedOrField) : seedOrField;
  const villages = field.version >= 2
    ? getNearbySettlements(gx, gy, field)
    : [
        getVillagePlacement(Math.round(gy / VILLAGE_CYCLE_HEIGHT) - 1, field.seed),
        getVillagePlacement(Math.round(gy / VILLAGE_CYCLE_HEIGHT), field.seed),
        getVillagePlacement(Math.round(gy / VILLAGE_CYCLE_HEIGHT) + 1, field.seed),
      ].filter(Boolean) as VillagePlacement[];

  for (const v of villages) {
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
export function isBuildingRoofOrFootprint(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  buffer = 0
): boolean {
  if (isResolvingVillage) return false;
  const field = typeof seedOrField === 'number' ? createTerrainField(1, seedOrField) : seedOrField;
  const villages = field.version >= 2
    ? getNearbySettlements(gx, gy, field)
    : [
        getVillagePlacement(Math.round(gy / VILLAGE_CYCLE_HEIGHT) - 1, field.seed),
        getVillagePlacement(Math.round(gy / VILLAGE_CYCLE_HEIGHT), field.seed),
        getVillagePlacement(Math.round(gy / VILLAGE_CYCLE_HEIGHT) + 1, field.seed),
      ].filter(Boolean) as VillagePlacement[];

  for (const v of villages) {
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
export function isTreeClippingBuilding(
  tx: number,
  ty: number,
  seedOrField: number | TerrainField = 101
): boolean {
  const treeLeft = tx - 4;
  const treeRight = tx + 64 + 4;
  const treeTop = ty + 10;
  const treeBottom = ty + 120 + 4;

  const centerGY = Math.floor((ty + 60) / 32);
  const field = typeof seedOrField === 'number' ? createTerrainField(1, seedOrField) : seedOrField;

  const villages = field.version >= 2
    ? getNearbySettlements(Math.floor((tx + 32) / 32), centerGY, field)
    : [
        getVillagePlacement(Math.round(centerGY / VILLAGE_CYCLE_HEIGHT) - 1, field.seed),
        getVillagePlacement(Math.round(centerGY / VILLAGE_CYCLE_HEIGHT), field.seed),
        getVillagePlacement(Math.round(centerGY / VILLAGE_CYCLE_HEIGHT) + 1, field.seed),
      ].filter(Boolean) as VillagePlacement[];

  for (const v of villages) {
    if (!v) continue;
    for (const b of v.buildings) {
      const bLeft = b.gx * 32 - 16;
      const bRight = (b.gx + b.widthTiles) * 32 + 16;
      const bTop = b.renderY - 16;
      const bBottom = (b.gy + b.heightTiles) * 32 + 32;

      const overlap = !(
        treeRight <= bLeft ||
        treeLeft >= bRight ||
        treeBottom <= bTop ||
        treeTop >= bBottom
      );
      if (overlap) return true;
    }
  }

  return false;
}

/**
 * Checks if a global tile is within a village boundary (plus buffer)
 * used exclusively to clear wild tall grass so encounters do not spawn in town.
 */
export function isVillageArea(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  buffer = 1
): boolean {
  if (isResolvingVillage) return false;
  const field = typeof seedOrField === 'number' ? createTerrainField(1, seedOrField) : seedOrField;
  if (field.version >= 2) {
    return isV0VillageArea(gx, gy, field, buffer);
  }
  const seed = field.seed;
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
