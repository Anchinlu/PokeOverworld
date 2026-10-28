import {
  type BuildingPlacement,
  type VillagePlantPlacement,
  type VillagePlacement,
  type VillageNPCEntity,
  createBuildingPlacement,
  type BuildingType,
} from '../village-rules';
import { seededHash } from '../noise';
import { V0_CONFIG } from './v0-config';

let cachedStartVillage: VillagePlacement | null = null;
let cachedSeed: number | null = null;

export type TownArchetype =
  | 'classic_pallet'
  | 'sunrise_ranch'
  | 'crossroads_shire'
  | 'courtyard_valley';

export type StarterScaleTier = 0 | 1 | 2;

export interface StarterVillageArchetypeInfo {
  index: number;
  id: TownArchetype;
  name: string;
}

export const ARCHETYPES: StarterVillageArchetypeInfo[] = [
  { index: 0, id: 'classic_pallet', name: 'Pallet Town' },
  { index: 1, id: 'sunrise_ranch', name: 'Sunrise Hamlet' },
  { index: 2, id: 'crossroads_shire', name: 'Crossroads Village' },
  { index: 3, id: 'courtyard_valley', name: 'Courtyard Hollow' },
];

export function getStarterTownArchetype(seed: number): StarterVillageArchetypeInfo {
  const idx = Math.floor(seededHash(seed, 7771, seed) * 4) % 4;
  return ARCHETYPES[idx];
}

/**
 * Deterministically selects the Starter Village scale tier (0 = Cozy, 1 = Bustling, 2 = Sprawling)
 * from the world seed so starter villages vary naturally in size, house count, and ranch extent.
 */
export function getStarterTownScaleTier(seed: number): StarterScaleTier {
  const roll = seededHash(seed, 8881, seed + 19);
  if (roll < 0.3) return 0;
  if (roll < 0.72) return 1;
  return 2;
}

interface BoundsTracker {
  minGX: number;
  maxGX: number;
  minGY: number;
  maxGY: number;
}

function updateBounds(bounds: BoundsTracker, gx: number, gy: number): void {
  if (gx < bounds.minGX) bounds.minGX = gx;
  if (gx > bounds.maxGX) bounds.maxGX = gx;
  if (gy < bounds.minGY) bounds.minGY = gy;
  if (gy > bounds.maxGY) bounds.maxGY = gy;
}

function addRoadTile(pathKeys: Set<string>, gx: number, gy: number, bounds: BoundsTracker): void {
  pathKeys.add(`${gx},${gy}`);
  updateBounds(bounds, gx, gy);
}

function addRoadRect(
  pathKeys: Set<string>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bounds: BoundsTracker
): void {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      addRoadTile(pathKeys, x, y, bounds);
    }
  }
}

/**
 * Constructs a clean, grand entrance for a village house:
 * - Extends continuously 3 tiles wide from under the doorstep (doorGY) down to the road.
 * - Zero grass gap between house facade and walkway (eliminates top grass fringes).
 * - Uniform 3-tile width throughout, eliminating awkward T-shape cutouts and notches.
 */
function addHouseEntrancePath(
  pathKeys: Set<string>,
  house: BuildingPlacement,
  roadY: number,
  bounds: BoundsTracker
): void {
  const is4Tile = house.widthTiles <= 4;
  const walkX1 = is4Tile ? house.gx + 1 : house.doorGX - 1;
  const walkX2 = is4Tile ? house.gx + 3 : house.doorGX + 1;

  const y1 = Math.min(house.doorGY, roadY);
  const y2 = Math.max(house.doorGY + 1, roadY);
  addRoadRect(pathKeys, walkX1, y1, walkX2, y2, bounds);
}

/**
 * Adds a wide 3-tile horizontal entrance connecting a house doorway to a road on its east or west.
 */
function addHorizontalHouseEntrancePath(
  pathKeys: Set<string>,
  house: BuildingPlacement,
  roadX: number,
  bounds: BoundsTracker
): void {
  const is4Tile = house.widthTiles <= 4;
  const walkX1 = is4Tile ? house.gx + 1 : house.doorGX - 1;
  const walkX2 = is4Tile ? house.gx + 3 : house.doorGX + 1;

  addRoadRect(pathKeys, walkX1, house.doorGY, walkX2, house.doorGY + 1, bounds);

  const x1 = Math.min(walkX1, roadX);
  const x2 = Math.max(walkX2, roadX);
  const hy1 = house.doorGY;
  const hy2 = house.doorGY + 2;
  addRoadRect(pathKeys, x1, hy1, x2, hy2, bounds);
}

function addBuilding(
  buildings: BuildingPlacement[],
  id: string,
  type: BuildingType,
  gx: number,
  gy: number,
  bounds: BoundsTracker
): BuildingPlacement {
  const b = createBuildingPlacement(id, type, gx, gy);
  buildings.push(b);
  updateBounds(bounds, b.gx, b.gy);
  updateBounds(bounds, b.gx + b.widthTiles, b.gy + b.heightTiles);
  return b;
}

function addGardenPlant(
  plants: VillagePlantPlacement[],
  pathKeys: Set<string>,
  gx: number,
  gy: number,
  type: string
): void {
  if (!pathKeys.has(`${gx},${gy}`)) {
    plants.push({ gx, gy, type });
  }
}

function pickVillagerHouseType(seed: number, salt: number): BuildingType {
  return seededHash(seed, salt, seed + salt) < 0.5 ? 'house_villager_3' : 'house_villager_4';
}

/**
 * Builds Archetype 0: Classic Pallet (Cổ Điển)
 * Dynamically scales from Cozy (Tier 0) -> Bustling (Tier 1) -> Sprawling (Tier 2).
 */
function buildClassicPallet(
  seed: number,
  scaleTier: StarterScaleTier,
  anchorGX: number,
  anchorGY: number,
  buildings: BuildingPlacement[],
  pathKeys: Set<string>,
  plants: VillagePlantPlacement[],
  bounds: BoundsTracker
): void {
  const westExtent = scaleTier >= 1 ? anchorGX - 25 : anchorGX - 18;
  const eastExtent = scaleTier >= 2 ? anchorGX + 24 : anchorGX + 18;
  const southExtent = scaleTier >= 1 ? anchorGY + 18 : anchorGY + 14;

  // 1. Central Roads: East-West Boulevard & North-South Central Avenue
  addRoadRect(pathKeys, westExtent, anchorGY - 1, eastExtent, anchorGY + 1, bounds);
  addRoadRect(pathKeys, anchorGX - 1, anchorGY - 16, anchorGX + 1, southExtent, bounds);

  // 2. North: Professor Okido's Laboratory
  addBuilding(buildings, 'start_lab', 'lab_okido', anchorGX - 3, anchorGY - 15, bounds);
  addRoadRect(pathKeys, anchorGX - 3, anchorGY - 11, anchorGX + 3, anchorGY - 2, bounds);
  addBuilding(buildings, 'lab_c1', 'plant_potted_low', anchorGX - 8, anchorGY - 15, bounds);
  addBuilding(buildings, 'lab_c2', 'plant_potted_low', anchorGX + 5, anchorGY - 15, bounds);

  // 3. Residential Plots: Player & Rival Houses
  const swapPlayerRival = Math.floor(seededHash(seed, 2002, seed) * 2) === 1;
  const westType: BuildingType = swapPlayerRival ? 'house_rival' : 'house_player';
  const eastType: BuildingType = swapPlayerRival ? 'house_player' : 'house_rival';

  const bWest = addBuilding(
    buildings,
    'start_house_w',
    westType,
    anchorGX - 15,
    anchorGY - 8,
    bounds
  );
  addHouseEntrancePath(pathKeys, bWest, anchorGY - 1, bounds);
  addBuilding(buildings, 'w_pot', 'plant_potted_tall', anchorGX - 16, anchorGY - 6, bounds);

  const bEast = addBuilding(
    buildings,
    'start_house_e',
    eastType,
    anchorGX + 9,
    anchorGY - 8,
    bounds
  );
  addHouseEntrancePath(pathKeys, bEast, anchorGY - 1, bounds);
  addBuilding(buildings, 'e_pot', 'plant_potted_tall', anchorGX + 14, anchorGY - 6, bounds);

  // Inner Sub-residential Plots (scaled by tier & seed)
  const innerPlots = [
    { gx: anchorGX - 15, gy: anchorGY + 5, connectY1: anchorGY + 2, connectY2: anchorGY + 4 },
    { gx: anchorGX + 10, gy: anchorGY - 16, connectY1: anchorGY - 14, connectY2: anchorGY - 9 },
    ...(scaleTier >= 1
      ? [
          {
            gx: anchorGX - 15,
            gy: anchorGY + 14,
            connectY1: anchorGY + 7,
            connectY2: anchorGY + 13,
          },
        ]
      : []),
  ];

  innerPlots.forEach((plot, i) => {
    const roll = seededHash(seed + i, 3003 + i, seed);
    const threshold = scaleTier === 0 ? 0.65 : 0.85;
    if (roll < threshold || (scaleTier === 0 && i === 0)) {
      const type = pickVillagerHouseType(seed, 3100 + i);
      const h = addBuilding(buildings, `start_villager_${i + 1}`, type, plot.gx, plot.gy, bounds);
      const walkX1 = h.widthTiles <= 4 ? h.gx + 1 : h.doorGX - 1;
      const walkX2 = h.widthTiles <= 4 ? h.gx + 3 : h.doorGX + 1;
      addRoadRect(pathKeys, walkX1, plot.connectY1, walkX2, plot.connectY2, bounds);
      addHouseEntrancePath(pathKeys, h, plot.connectY1, bounds);
      addBuilding(buildings, `v_${i}_pot`, 'plant_potted_tall', plot.gx - 1, plot.gy + 1, bounds);
    } else {
      addBuilding(buildings, `park_bench_${i}`, 'bench_stone_large', plot.gx, plot.gy, bounds);
      addBuilding(buildings, `park_pot_${i}`, 'plant_potted_low', plot.gx + 3, plot.gy, bounds);
      addGardenPlant(plants, pathKeys, plot.gx + 1, plot.gy - 1, 'flower_red');
      addGardenPlant(plants, pathKeys, plot.gx + 2, plot.gy - 1, 'flower_yellow');
    }
  });

  // Outer Expansion District (Tier 1 & Tier 2)
  if (scaleTier >= 1) {
    const wOuterN = addBuilding(
      buildings,
      'start_villager_wn',
      pickVillagerHouseType(seed, 3201),
      anchorGX - 25,
      anchorGY - 8,
      bounds
    );
    addHouseEntrancePath(pathKeys, wOuterN, anchorGY - 1, bounds);
    addBuilding(buildings, 'wn_pot', 'plant_potted_tall', anchorGX - 26, anchorGY - 7, bounds);

    const wOuterS = addBuilding(
      buildings,
      'start_villager_ws',
      pickVillagerHouseType(seed, 3202),
      anchorGX - 25,
      anchorGY + 5,
      bounds
    );
    addHouseEntrancePath(pathKeys, wOuterS, anchorGY + 1, bounds);
  }

  if (scaleTier >= 2) {
    const eOuterN = addBuilding(
      buildings,
      'start_villager_en',
      pickVillagerHouseType(seed, 3203),
      anchorGX + 20,
      anchorGY - 8,
      bounds
    );
    addHouseEntrancePath(pathKeys, eOuterN, anchorGY - 1, bounds);
    addBuilding(buildings, 'en_pot', 'plant_potted_tall', anchorGX + 24, anchorGY - 7, bounds);

    if (seededHash(seed, 3204, seed) < 0.8) {
      const eOuterFN = addBuilding(
        buildings,
        'start_villager_efn',
        pickVillagerHouseType(seed, 3205),
        anchorGX + 20,
        anchorGY - 16,
        bounds
      );
      addHouseEntrancePath(pathKeys, eOuterFN, anchorGY - 9, bounds);
      addRoadRect(pathKeys, anchorGX + 21, anchorGY - 14, anchorGX + 23, anchorGY - 9, bounds);
    }

    if (seededHash(seed, 3206, seed) < 0.8) {
      const wOuterFS = addBuilding(
        buildings,
        'start_villager_wfs',
        pickVillagerHouseType(seed, 3207),
        anchorGX - 25,
        anchorGY + 14,
        bounds
      );
      addHouseEntrancePath(pathKeys, wOuterFS, anchorGY + 7, bounds);
      addRoadRect(pathKeys, anchorGX - 24, anchorGY + 7, anchorGX - 22, anchorGY + 13, bounds);
    }
  }

  // 4. South-East: Modular Livestock Ranch Compound (scales crops & pen depth with tier)
  addBuilding(buildings, 'start_barn', 'ranch_barn', anchorGX + 4, anchorGY + 6, bounds);
  addRoadRect(pathKeys, anchorGX + 2, anchorGY + 8, anchorGX + 6, anchorGY + 9, bounds);

  addBuilding(buildings, 'fence_n1', 'fence_horizontal', anchorGX + 12, anchorGY + 6, bounds);
  addBuilding(buildings, 'fence_n2', 'fence_horizontal', anchorGX + 15, anchorGY + 6, bounds);
  addBuilding(buildings, 'fence_e1', 'fence_vertical', anchorGX + 18, anchorGY + 6, bounds);

  addBuilding(buildings, 'crop_1', 'feed_crops', anchorGX + 12, anchorGY + 7, bounds);
  addBuilding(buildings, 'crop_2', 'feed_crops', anchorGX + 15, anchorGY + 7, bounds);

  if (scaleTier >= 1) {
    addBuilding(buildings, 'fence_e2', 'fence_vertical', anchorGX + 18, anchorGY + 11, bounds);
    addBuilding(buildings, 'crop_3', 'feed_crops', anchorGX + 12, anchorGY + 11, bounds);
    addBuilding(buildings, 'crop_4', 'feed_crops', anchorGX + 15, anchorGY + 11, bounds);
    addBuilding(buildings, 'fence_s1', 'fence_horizontal', anchorGX + 12, anchorGY + 15, bounds);
    addBuilding(buildings, 'fence_s2', 'fence_horizontal', anchorGX + 15, anchorGY + 15, bounds);
  } else {
    addBuilding(buildings, 'fence_s1', 'fence_horizontal', anchorGX + 12, anchorGY + 11, bounds);
    addBuilding(buildings, 'fence_s2', 'fence_horizontal', anchorGX + 15, anchorGY + 11, bounds);
  }

  addBuilding(buildings, 'water_tr', 'water_trough', anchorGX + 3, anchorGY + 7, bounds);
  addBuilding(buildings, 'hay_bale', 'hay_bale', anchorGX + 3, anchorGY + 11, bounds);
  addBuilding(buildings, 'hay_st1', 'hay_stack_1', anchorGX + 2, anchorGY + 9, bounds);
  addBuilding(buildings, 'hay_st2', 'hay_stack_2', anchorGX + 6, anchorGY + 11, bounds);

  // Plaza Benches
  addBuilding(buildings, 'plaza_b1', 'bench_stone_large', anchorGX - 5, anchorGY - 2, bounds);
  addBuilding(buildings, 'plaza_b2', 'bench_stone_large', anchorGX + 2, anchorGY - 2, bounds);
  addBuilding(buildings, 'plaza_b3', 'bench_stone_small', anchorGX - 4, anchorGY + 2, bounds);
  addBuilding(buildings, 'plaza_b4', 'bench_stone_small', anchorGX + 2, anchorGY + 2, bounds);
}

/**
 * Builds Archetype 1: Sunrise Ranch (Thảo Nguyên Đón Nắng)
 * Dynamically scales from Cozy (Tier 0) -> Bustling (Tier 1) -> Sprawling (Tier 2).
 */
function buildSunriseRanch(
  seed: number,
  scaleTier: StarterScaleTier,
  anchorGX: number,
  anchorGY: number,
  buildings: BuildingPlacement[],
  pathKeys: Set<string>,
  plants: VillagePlantPlacement[],
  bounds: BoundsTracker
): void {
  const westRoadX = scaleTier >= 2 ? anchorGX - 25 : anchorGX - 18;
  const eastRoadX = scaleTier >= 2 ? anchorGX + 21 : anchorGX + 14;

  // 1. Roads: North Boulevard & North-South Connecting Thoroughfare
  addRoadRect(pathKeys, westRoadX, anchorGY - 9, eastRoadX, anchorGY - 7, bounds);
  addRoadRect(pathKeys, anchorGX - 8, anchorGY - 7, anchorGX - 6, anchorGY + 9, bounds);
  addRoadRect(pathKeys, anchorGX - 6, anchorGY - 1, anchorGX + 6, anchorGY + 1, bounds);

  // 2. West: Okido Academic Campus
  addBuilding(buildings, 'start_lab', 'lab_okido', anchorGX - 18, anchorGY - 4, bounds);
  addRoadRect(pathKeys, anchorGX - 15, anchorGY - 1, anchorGX - 8, anchorGY + 1, bounds);

  // 3. North: Residential Row along Boulevard
  const swap = Math.floor(seededHash(seed, 2002, seed) * 2) === 1;
  const h1Type: BuildingType = swap ? 'house_rival' : 'house_player';
  const h2Type: BuildingType = swap ? 'house_player' : 'house_rival';

  const h1 = addBuilding(buildings, 'res_1', h1Type, anchorGX - 17, anchorGY - 15, bounds);
  addHouseEntrancePath(pathKeys, h1, anchorGY - 9, bounds);
  addBuilding(buildings, 'res1_pot', 'plant_potted_tall', anchorGX - 18, anchorGY - 13, bounds);

  const h2 = addBuilding(buildings, 'res_2', h2Type, anchorGX - 8, anchorGY - 15, bounds);
  addHouseEntrancePath(pathKeys, h2, anchorGY - 9, bounds);
  addBuilding(buildings, 'res2_pot', 'plant_potted_tall', anchorGX - 9, anchorGY - 13, bounds);

  const h3 = addBuilding(
    buildings,
    'res_3',
    pickVillagerHouseType(seed, 4101),
    anchorGX + 1,
    anchorGY - 15,
    bounds
  );
  addHouseEntrancePath(pathKeys, h3, anchorGY - 9, bounds);

  if (scaleTier >= 1 || seededHash(seed, 4102, seed) < 0.5) {
    const h4 = addBuilding(
      buildings,
      'res_4',
      pickVillagerHouseType(seed, 4103),
      anchorGX + 9,
      anchorGY - 15,
      bounds
    );
    addHouseEntrancePath(pathKeys, h4, anchorGY - 9, bounds);
  } else {
    addBuilding(buildings, 'sr_park_b', 'bench_stone_large', anchorGX + 9, anchorGY - 12, bounds);
    addBuilding(buildings, 'sr_park_p', 'plant_potted_low', anchorGX + 12, anchorGY - 12, bounds);
  }

  // Tier 1+: South Residential Lane
  if (scaleTier >= 1) {
    const southWestX = scaleTier >= 2 ? anchorGX - 25 : anchorGX - 18;
    addRoadRect(pathKeys, southWestX, anchorGY + 8, anchorGX, anchorGY + 9, bounds);

    const h5 = addBuilding(
      buildings,
      'res_5',
      pickVillagerHouseType(seed, 4104),
      anchorGX - 17,
      anchorGY + 11,
      bounds
    );
    addHouseEntrancePath(pathKeys, h5, anchorGY + 9, bounds);

    const h6 = addBuilding(
      buildings,
      'res_6',
      pickVillagerHouseType(seed, 4105),
      anchorGX - 5,
      anchorGY + 11,
      bounds
    );
    addHouseEntrancePath(pathKeys, h6, anchorGY + 9, bounds);
  }

  // Tier 2: East & West Boulevard Wings
  if (scaleTier >= 2) {
    const h7 = addBuilding(
      buildings,
      'res_7',
      pickVillagerHouseType(seed, 4106),
      anchorGX - 25,
      anchorGY - 15,
      bounds
    );
    addHouseEntrancePath(pathKeys, h7, anchorGY - 9, bounds);

    const h8 = addBuilding(
      buildings,
      'res_8',
      pickVillagerHouseType(seed, 4107),
      anchorGX + 17,
      anchorGY - 15,
      bounds
    );
    addHouseEntrancePath(pathKeys, h8, anchorGY - 9, bounds);

    if (seededHash(seed, 4108, seed) < 0.8) {
      const h9 = addBuilding(
        buildings,
        'res_9',
        pickVillagerHouseType(seed, 4109),
        anchorGX - 25,
        anchorGY + 11,
        bounds
      );
      addHouseEntrancePath(pathKeys, h9, anchorGY + 9, bounds);
    }
  }

  // 4. East: Sprawling Ranch & Pastures
  addBuilding(buildings, 'start_barn', 'ranch_barn', anchorGX + 6, anchorGY - 1, bounds);
  addBuilding(buildings, 'fence_n1', 'fence_horizontal', anchorGX + 14, anchorGY - 2, bounds);
  addBuilding(buildings, 'fence_n2', 'fence_horizontal', anchorGX + 17, anchorGY - 2, bounds);
  addBuilding(buildings, 'fence_e1', 'fence_vertical', anchorGX + 20, anchorGY - 2, bounds);

  addBuilding(buildings, 'crop_1', 'feed_crops', anchorGX + 14, anchorGY - 1, bounds);
  addBuilding(buildings, 'crop_2', 'feed_crops', anchorGX + 17, anchorGY - 1, bounds);

  if (scaleTier >= 1) {
    addBuilding(buildings, 'fence_e2', 'fence_vertical', anchorGX + 20, anchorGY + 3, bounds);
    addBuilding(buildings, 'crop_3', 'feed_crops', anchorGX + 14, anchorGY + 3, bounds);
    addBuilding(buildings, 'crop_4', 'feed_crops', anchorGX + 17, anchorGY + 3, bounds);
    addBuilding(buildings, 'fence_s1', 'fence_horizontal', anchorGX + 14, anchorGY + 7, bounds);
    addBuilding(buildings, 'fence_s2', 'fence_horizontal', anchorGX + 17, anchorGY + 7, bounds);
  } else {
    addBuilding(buildings, 'fence_s1', 'fence_horizontal', anchorGX + 14, anchorGY + 3, bounds);
    addBuilding(buildings, 'fence_s2', 'fence_horizontal', anchorGX + 17, anchorGY + 3, bounds);
  }

  addBuilding(buildings, 'water_tr', 'water_trough', anchorGX + 5, anchorGY, bounds);
  addBuilding(buildings, 'hay_bale', 'hay_bale', anchorGX + 6, anchorGY + 4, bounds);
  addBuilding(buildings, 'hay_st1', 'hay_stack_1', anchorGX + 10, anchorGY + 4, bounds);
  addBuilding(buildings, 'hay_st2', 'hay_stack_2', anchorGX + 12, anchorGY + 4, bounds);

  // Boulevard Benches & Garden Flowers
  addBuilding(buildings, 'sr_b1', 'bench_stone_large', anchorGX - 5, anchorGY - 6, bounds);
  addBuilding(buildings, 'sr_b2', 'bench_stone_large', anchorGX + 3, anchorGY - 6, bounds);
  addGardenPlant(plants, pathKeys, anchorGX - 17, anchorGY - 8, 'flower_red');
  addGardenPlant(plants, pathKeys, anchorGX - 9, anchorGY - 8, 'flower_yellow');
  addGardenPlant(plants, pathKeys, anchorGX + 5, anchorGY - 8, 'flower_blue');
}

/**
 * Builds Archetype 2: Crossroads Shire (Ngã Tư Làng Quê)
 * Dynamically scales from Cozy (Tier 0) -> Bustling (Tier 1) -> Sprawling (Tier 2).
 */
function buildCrossroadsShire(
  seed: number,
  scaleTier: StarterScaleTier,
  anchorGX: number,
  anchorGY: number,
  buildings: BuildingPlacement[],
  pathKeys: Set<string>,
  plants: VillagePlantPlacement[],
  bounds: BoundsTracker
): void {
  const roadRadius = scaleTier >= 2 ? 22 : 18;
  // 1. Crossroad Thoroughfares
  addRoadRect(pathKeys, anchorGX - roadRadius, anchorGY - 1, anchorGX + roadRadius, anchorGY + 1, bounds);
  addRoadRect(pathKeys, anchorGX - 1, anchorGY - roadRadius, anchorGX + 1, anchorGY + roadRadius, bounds);

  // 2. Central Plaza Benches & Planters
  addBuilding(buildings, 'cb_nw', 'bench_stone_small', anchorGX - 3, anchorGY - 3, bounds);
  addBuilding(buildings, 'cb_ne', 'bench_stone_small', anchorGX + 2, anchorGY - 3, bounds);
  addBuilding(buildings, 'cb_sw', 'bench_stone_small', anchorGX - 3, anchorGY + 2, bounds);
  addBuilding(buildings, 'cb_se', 'bench_stone_small', anchorGX + 2, anchorGY + 2, bounds);

  // 3. North-West: Primary Residences
  const swap = Math.floor(seededHash(seed, 2002, seed) * 2) === 1;
  const h1Type: BuildingType = swap ? 'house_rival' : 'house_player';
  const h2Type: BuildingType = swap ? 'house_player' : 'house_rival';

  const h1 = addBuilding(buildings, 'cr_res1', h1Type, anchorGX - 16, anchorGY - 11, bounds);
  addHouseEntrancePath(pathKeys, h1, anchorGY - 2, bounds);
  addBuilding(buildings, 'cr_p1', 'plant_potted_tall', anchorGX - 17, anchorGY - 9, bounds);

  const h2 = addBuilding(buildings, 'cr_res2', h2Type, anchorGX - 6, anchorGY - 11, bounds);
  addHouseEntrancePath(pathKeys, h2, anchorGY - 2, bounds);
  addBuilding(buildings, 'cr_p2', 'plant_potted_tall', anchorGX - 7, anchorGY - 9, bounds);

  // 4. North-East: Okido Lab Campus
  addBuilding(buildings, 'start_lab', 'lab_okido', anchorGX + 5, anchorGY - 14, bounds);
  addRoadRect(pathKeys, anchorGX + 7, anchorGY - 10, anchorGX + 9, anchorGY - 2, bounds);

  // 5. South-West: Secondary Residential
  addRoadRect(pathKeys, anchorGX - 16, anchorGY + 8, anchorGX - 2, anchorGY + 9, bounds);
  const h3 = addBuilding(
    buildings,
    'cr_v3',
    pickVillagerHouseType(seed, 5101),
    anchorGX - 16,
    anchorGY + 5,
    bounds
  );
  addHouseEntrancePath(pathKeys, h3, anchorGY + 8, bounds);

  if (scaleTier >= 1 || seededHash(seed, 5102, seed) < 0.6) {
    const h4 = addBuilding(
      buildings,
      'cr_v4',
      pickVillagerHouseType(seed, 5103),
      anchorGX - 7,
      anchorGY + 5,
      bounds
    );
    addHouseEntrancePath(pathKeys, h4, anchorGY + 8, bounds);
  }

  // Tier 1+: North-West Upper Lane
  if (scaleTier >= 1) {
    addRoadRect(pathKeys, anchorGX - 16, anchorGY - 16, anchorGX - 2, anchorGY - 15, bounds);
    const h5 = addBuilding(
      buildings,
      'cr_v5',
      pickVillagerHouseType(seed, 5104),
      anchorGX - 16,
      anchorGY - 19,
      bounds
    );
    addHouseEntrancePath(pathKeys, h5, anchorGY - 16, bounds);

    const h6 = addBuilding(
      buildings,
      'cr_v6',
      pickVillagerHouseType(seed, 5105),
      anchorGX - 7,
      anchorGY - 19,
      bounds
    );
    addHouseEntrancePath(pathKeys, h6, anchorGY - 16, bounds);
  }

  // Tier 2: South-West Lower Lane & North-East Annex
  if (scaleTier >= 2) {
    const h7 = addBuilding(
      buildings,
      'cr_v7',
      pickVillagerHouseType(seed, 5106),
      anchorGX - 16,
      anchorGY + 14,
      bounds
    );
    addHouseEntrancePath(pathKeys, h7, anchorGY + 9, bounds);

    const h8 = addBuilding(
      buildings,
      'cr_v8',
      pickVillagerHouseType(seed, 5107),
      anchorGX - 7,
      anchorGY + 14,
      bounds
    );
    addHouseEntrancePath(pathKeys, h8, anchorGY + 9, bounds);

    const h9 = addBuilding(
      buildings,
      'cr_v9',
      pickVillagerHouseType(seed, 5108),
      anchorGX + 16,
      anchorGY - 13,
      bounds
    );
    addHouseEntrancePath(pathKeys, h9, anchorGY - 1, bounds);
  }

  // 6. South-East: Ranch Compound
  addBuilding(buildings, 'start_barn', 'ranch_barn', anchorGX + 5, anchorGY + 5, bounds);
  addRoadRect(pathKeys, anchorGX + 2, anchorGY + 7, anchorGX + 5, anchorGY + 8, bounds);

  addBuilding(buildings, 'fence_n1', 'fence_horizontal', anchorGX + 13, anchorGY + 5, bounds);
  addBuilding(buildings, 'fence_n2', 'fence_horizontal', anchorGX + 16, anchorGY + 5, bounds);
  addBuilding(buildings, 'fence_e1', 'fence_vertical', anchorGX + 19, anchorGY + 5, bounds);

  addBuilding(buildings, 'crop_1', 'feed_crops', anchorGX + 13, anchorGY + 6, bounds);
  addBuilding(buildings, 'crop_2', 'feed_crops', anchorGX + 16, anchorGY + 6, bounds);

  if (scaleTier >= 1) {
    addBuilding(buildings, 'fence_e2', 'fence_vertical', anchorGX + 19, anchorGY + 10, bounds);
    addBuilding(buildings, 'crop_3', 'feed_crops', anchorGX + 13, anchorGY + 10, bounds);
    addBuilding(buildings, 'crop_4', 'feed_crops', anchorGX + 16, anchorGY + 10, bounds);
    addBuilding(buildings, 'fence_s1', 'fence_horizontal', anchorGX + 13, anchorGY + 14, bounds);
    addBuilding(buildings, 'fence_s2', 'fence_horizontal', anchorGX + 16, anchorGY + 14, bounds);
  } else {
    addBuilding(buildings, 'fence_s1', 'fence_horizontal', anchorGX + 13, anchorGY + 10, bounds);
    addBuilding(buildings, 'fence_s2', 'fence_horizontal', anchorGX + 16, anchorGY + 10, bounds);
  }

  addBuilding(buildings, 'water_tr', 'water_trough', anchorGX + 4, anchorGY + 6, bounds);
  addBuilding(buildings, 'hay_bale', 'hay_bale', anchorGX + 4, anchorGY + 10, bounds);
  addBuilding(buildings, 'hay_st1', 'hay_stack_1', anchorGX + 8, anchorGY + 10, bounds);
  addBuilding(buildings, 'hay_st2', 'hay_stack_2', anchorGX + 11, anchorGY + 10, bounds);

  addGardenPlant(plants, pathKeys, anchorGX - 2, anchorGY - 2, 'flower_red');
  addGardenPlant(plants, pathKeys, anchorGX + 2, anchorGY - 2, 'flower_yellow');
  addGardenPlant(plants, pathKeys, anchorGX - 2, anchorGY + 2, 'flower_blue');
  addGardenPlant(plants, pathKeys, anchorGX + 2, anchorGY + 2, 'flower_white');
}

/**
 * Builds Archetype 3: Courtyard Valley (Thung Lũng Quây Quần)
 * Dynamically scales from Cozy (Tier 0) -> Bustling (Tier 1) -> Sprawling (Tier 2).
 */
function buildCourtyardValley(
  seed: number,
  scaleTier: StarterScaleTier,
  anchorGX: number,
  anchorGY: number,
  buildings: BuildingPlacement[],
  pathKeys: Set<string>,
  plants: VillagePlantPlacement[],
  bounds: BoundsTracker
): void {
  const ringWestX = scaleTier >= 1 ? anchorGX - 24 : anchorGX - 16;
  const ringEastX = scaleTier >= 2 ? anchorGX + 23 : anchorGX + 16;

  // 1. Ring Road Surrounding Central Courtyard
  addRoadRect(pathKeys, ringWestX, anchorGY - 6, ringEastX, anchorGY - 5, bounds);
  addRoadRect(pathKeys, ringWestX, anchorGY + 5, ringEastX, anchorGY + 6, bounds);
  addRoadRect(pathKeys, anchorGX - 8, anchorGY - 5, anchorGX - 7, anchorGY + 5, bounds);
  addRoadRect(pathKeys, anchorGX + 7, anchorGY - 5, anchorGX + 8, anchorGY + 5, bounds);

  // Central Courtyard Decor (Park Benches & Planters in open green)
  addBuilding(buildings, 'court_b1', 'bench_stone_large', anchorGX - 4, anchorGY, bounds);
  addBuilding(buildings, 'court_b2', 'bench_stone_large', anchorGX + 2, anchorGY, bounds);
  addBuilding(buildings, 'court_p1', 'plant_potted_low', anchorGX - 1, anchorGY - 2, bounds);
  addBuilding(buildings, 'court_p2', 'plant_potted_low', anchorGX - 1, anchorGY + 2, bounds);

  addGardenPlant(plants, pathKeys, anchorGX - 3, anchorGY - 2, 'flower_red');
  addGardenPlant(plants, pathKeys, anchorGX + 3, anchorGY - 2, 'flower_yellow');
  addGardenPlant(plants, pathKeys, anchorGX - 3, anchorGY + 2, 'flower_blue');
  addGardenPlant(plants, pathKeys, anchorGX + 3, anchorGY + 2, 'flower_white');

  // 2. North of Courtyard: Okido Lab
  addBuilding(buildings, 'start_lab', 'lab_okido', anchorGX - 3, anchorGY - 15, bounds);
  addRoadRect(pathKeys, anchorGX - 1, anchorGY - 11, anchorGX + 1, anchorGY - 7, bounds);

  // 3. West & East: Player & Rival Houses
  const swap = Math.floor(seededHash(seed, 2002, seed) * 2) === 1;
  const westType: BuildingType = swap ? 'house_rival' : 'house_player';
  const eastType: BuildingType = swap ? 'house_player' : 'house_rival';

  const bWest = addBuilding(
    buildings,
    'court_res_w',
    westType,
    anchorGX - 15,
    anchorGY - 3,
    bounds
  );
  addHorizontalHouseEntrancePath(pathKeys, bWest, anchorGX - 8, bounds);
  addBuilding(buildings, 'w_pot', 'plant_potted_tall', anchorGX - 16, anchorGY - 1, bounds);

  const bEast = addBuilding(
    buildings,
    'court_res_e',
    eastType,
    anchorGX + 9,
    anchorGY - 3,
    bounds
  );
  addHorizontalHouseEntrancePath(pathKeys, bEast, anchorGX + 7, bounds);
  addBuilding(buildings, 'e_pot', 'plant_potted_tall', anchorGX + 14, anchorGY - 1, bounds);

  // North-West & North-East Residential Plots
  const hNW = addBuilding(
    buildings,
    'court_v_nw',
    pickVillagerHouseType(seed, 6101),
    anchorGX - 15,
    anchorGY - 14,
    bounds
  );
  addHouseEntrancePath(pathKeys, hNW, anchorGY - 6, bounds);

  if (scaleTier >= 1 || seededHash(seed, 6102, seed) < 0.6) {
    const hNE = addBuilding(
      buildings,
      'court_v_ne',
      pickVillagerHouseType(seed, 6103),
      anchorGX + 9,
      anchorGY - 14,
      bounds
    );
    addHouseEntrancePath(pathKeys, hNE, anchorGY - 6, bounds);
  }

  // Tier 1+: South-West Wing & Outer West House
  if (scaleTier >= 1) {
    const hSW = addBuilding(
      buildings,
      'court_v_sw',
      pickVillagerHouseType(seed, 6104),
      anchorGX - 15,
      anchorGY + 9,
      bounds
    );
    addHouseEntrancePath(pathKeys, hSW, anchorGY + 6, bounds);

    const hW2 = addBuilding(
      buildings,
      'court_v_w2',
      pickVillagerHouseType(seed, 6105),
      anchorGX - 24,
      anchorGY - 3,
      bounds
    );
    addHouseEntrancePath(pathKeys, hW2, anchorGY - 5, bounds);
  }

  // Tier 2: Outer Valley Terrace Houses
  if (scaleTier >= 2) {
    const hNW2 = addBuilding(
      buildings,
      'court_v_nw2',
      pickVillagerHouseType(seed, 6106),
      anchorGX - 24,
      anchorGY - 14,
      bounds
    );
    addHouseEntrancePath(pathKeys, hNW2, anchorGY - 6, bounds);

    const hNE2 = addBuilding(
      buildings,
      'court_v_ne2',
      pickVillagerHouseType(seed, 6107),
      anchorGX + 19,
      anchorGY - 14,
      bounds
    );
    addHouseEntrancePath(pathKeys, hNE2, anchorGY - 6, bounds);

    const hE2 = addBuilding(
      buildings,
      'court_v_e2',
      pickVillagerHouseType(seed, 6108),
      anchorGX + 19,
      anchorGY - 3,
      bounds
    );
    addHouseEntrancePath(pathKeys, hE2, anchorGY - 5, bounds);

    const hSW2 = addBuilding(
      buildings,
      'court_v_sw2',
      pickVillagerHouseType(seed, 6109),
      anchorGX - 24,
      anchorGY + 9,
      bounds
    );
    addHouseEntrancePath(pathKeys, hSW2, anchorGY + 6, bounds);
  }

  // 4. South: Ranch Compound
  addRoadRect(pathKeys, anchorGX + 2, anchorGY + 7, anchorGX + 4, anchorGY + 9, bounds);
  addBuilding(buildings, 'start_barn', 'ranch_barn', anchorGX + 1, anchorGY + 9, bounds);

  addBuilding(buildings, 'fence_n1', 'fence_horizontal', anchorGX + 9, anchorGY + 9, bounds);
  addBuilding(buildings, 'fence_n2', 'fence_horizontal', anchorGX + 12, anchorGY + 9, bounds);

  addBuilding(buildings, 'crop_1', 'feed_crops', anchorGX + 9, anchorGY + 10, bounds);
  addBuilding(buildings, 'crop_2', 'feed_crops', anchorGX + 12, anchorGY + 10, bounds);

  if (scaleTier >= 1) {
    addBuilding(buildings, 'fence_n3', 'fence_horizontal', anchorGX + 15, anchorGY + 9, bounds);
    addBuilding(buildings, 'fence_e1', 'fence_vertical', anchorGX + 18, anchorGY + 9, bounds);
    addBuilding(buildings, 'crop_3', 'feed_crops', anchorGX + 15, anchorGY + 10, bounds);
    addBuilding(buildings, 'fence_s1', 'fence_horizontal', anchorGX + 9, anchorGY + 14, bounds);
    addBuilding(buildings, 'fence_s2', 'fence_horizontal', anchorGX + 12, anchorGY + 14, bounds);
    addBuilding(buildings, 'fence_s3', 'fence_horizontal', anchorGX + 15, anchorGY + 14, bounds);
  } else {
    addBuilding(buildings, 'fence_e1', 'fence_vertical', anchorGX + 15, anchorGY + 9, bounds);
    addBuilding(buildings, 'fence_s1', 'fence_horizontal', anchorGX + 9, anchorGY + 14, bounds);
    addBuilding(buildings, 'fence_s2', 'fence_horizontal', anchorGX + 12, anchorGY + 14, bounds);
  }

  addBuilding(buildings, 'water_tr', 'water_trough', anchorGX, anchorGY + 10, bounds);
  addBuilding(buildings, 'hay_bale', 'hay_bale', anchorGX, anchorGY + 14, bounds);
  addBuilding(buildings, 'hay_st1', 'hay_stack_1', anchorGX + 4, anchorGY + 14, bounds);
  addBuilding(buildings, 'hay_st2', 'hay_stack_2', anchorGX + 7, anchorGY + 14, bounds);
}

function buildVillageNPCs(
  _seed: number,
  archetypeId: TownArchetype,
  anchorGX: number,
  anchorGY: number,
  buildings: BuildingPlacement[],
  _pathKeys: Set<string>,
  plants: VillagePlantPlacement[]
): VillageNPCEntity[] {
  let techGX: number;
  let techGY: number;
  let techDir: 0 | 1 | 2 | 3;

  let flowerGX: number;
  let flowerGY: number;
  let flowerDir: 0 | 1 | 2 | 3;

  let farmerGX: number;
  let farmerGY: number;
  let farmerDir: 0 | 1 | 2 | 3;

  let seaGX: number;
  let seaGY: number;
  let seaDir: 0 | 1 | 2 | 3;

  let oldManGX: number;
  let oldManGY: number;
  let oldManDir: 0 | 1 | 2 | 3;

  let oldWomanGX: number;
  let oldWomanGY: number;
  let oldWomanDir: 0 | 1 | 2 | 3;

  let bugGX: number;
  let bugGY: number;
  let bugDir: 0 | 1 | 2 | 3;

  let kidGX: number;
  let kidGY: number;
  let kidDir: 0 | 1 | 2 | 3;

  if (archetypeId === 'classic_pallet') {
    techGX = anchorGX + 2;
    techGY = anchorGY - 3;
    techDir = 1;

    flowerGX = anchorGX - 5;
    flowerGY = anchorGY - 3;
    flowerDir = 2;

    farmerGX = anchorGX + 10;
    farmerGY = anchorGY + 7;
    farmerDir = 0;

    seaGX = anchorGX + 2;
    seaGY = anchorGY + 15;
    seaDir = 0;

    oldManGX = anchorGX - 6;
    oldManGY = anchorGY + 4;
    oldManDir = 2;

    oldWomanGX = anchorGX + 6;
    oldWomanGY = anchorGY - 6;
    oldWomanDir = 0;

    bugGX = anchorGX - 8;
    bugGY = anchorGY + 10;
    bugDir = 1;

    kidGX = anchorGX + 4;
    kidGY = anchorGY + 2;
    kidDir = 3;
  } else if (archetypeId === 'sunrise_ranch') {
    techGX = anchorGX - 7;
    techGY = anchorGY - 2;
    techDir = 2;

    flowerGX = anchorGX + 4;
    flowerGY = anchorGY - 8;
    flowerDir = 0;

    farmerGX = anchorGX + 12;
    farmerGY = anchorGY + 7;
    farmerDir = 1;

    seaGX = anchorGX;
    seaGY = anchorGY + 14;
    seaDir = 0;

    oldManGX = anchorGX - 4;
    oldManGY = anchorGY + 5;
    oldManDir = 2;

    oldWomanGX = anchorGX + 2;
    oldWomanGY = anchorGY - 4;
    oldWomanDir = 0;

    bugGX = anchorGX + 8;
    bugGY = anchorGY + 12;
    bugDir = 3;

    kidGX = anchorGX - 2;
    kidGY = anchorGY + 2;
    kidDir = 1;
  } else if (archetypeId === 'crossroads_shire') {
    techGX = anchorGX + 3;
    techGY = anchorGY - 2;
    techDir = 1;

    flowerGX = anchorGX - 3;
    flowerGY = anchorGY + 3;
    flowerDir = 2;

    farmerGX = anchorGX + 12;
    farmerGY = anchorGY + 7;
    farmerDir = 0;

    seaGX = anchorGX + 2;
    seaGY = anchorGY + 15;
    seaDir = 0;

    oldManGX = anchorGX - 5;
    oldManGY = anchorGY - 6;
    oldManDir = 0;

    oldWomanGX = anchorGX + 5;
    oldWomanGY = anchorGY - 6;
    oldWomanDir = 0;

    bugGX = anchorGX - 6;
    bugGY = anchorGY + 8;
    bugDir = 2;

    kidGX = anchorGX + 6;
    kidGY = anchorGY + 8;
    kidDir = 1;
  } else {
    // courtyard_valley
    techGX = anchorGX + 2;
    techGY = anchorGY - 5;
    techDir = 3;

    flowerGX = anchorGX - 2;
    flowerGY = anchorGY - 1;
    flowerDir = 0;

    farmerGX = anchorGX + 9;
    farmerGY = anchorGY + 10;
    farmerDir = 1;

    seaGX = anchorGX;
    seaGY = anchorGY + 18;
    seaDir = 0;

    oldManGX = anchorGX - 5;
    oldManGY = anchorGY + 4;
    oldManDir = 2;

    oldWomanGX = anchorGX + 5;
    oldWomanGY = anchorGY + 4;
    oldWomanDir = 1;

    bugGX = anchorGX - 4;
    bugGY = anchorGY + 12;
    bugDir = 0;

    kidGX = anchorGX + 4;
    kidGY = anchorGY + 12;
    kidDir = 0;
  }

  const occupiedPositions = new Set<string>();

  function ensureFree(gx: number, gy: number): { gx: number; gy: number } {
    const isOccupied = (x: number, y: number) => {
      const posKey = `${x},${y}`;
      if (occupiedPositions.has(posKey)) return true;
      return (
        buildings.some(
          (b) => x >= b.gx && x < b.gx + b.widthTiles && y >= b.gy && y < b.gy + b.heightTiles
        ) ||
        plants.some((p) => p.gx === x && p.gy === y)
      );
    };
    if (!isOccupied(gx, gy)) {
      occupiedPositions.add(`${gx},${gy}`);
      return { gx, gy };
    }
    for (let radius = 1; radius <= 4; radius++) {
      for (const [dx, dy] of [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [-1, -1], [1, -1], [-1, 1],
      ]) {
        const nx = gx + dx * radius;
        const ny = gy + dy * radius;
        if (!isOccupied(nx, ny)) {
          occupiedPositions.add(`${nx},${ny}`);
          return { gx: nx, gy: ny };
        }
      }
    }
    occupiedPositions.add(`${gx},${gy}`);
    return { gx, gy };
  }

  const techPos = ensureFree(techGX, techGY);
  const flowerPos = ensureFree(flowerGX, flowerGY);
  const farmerPos = ensureFree(farmerGX, farmerGY);
  const seaPos = ensureFree(seaGX, seaGY);
  const oldManPos = ensureFree(oldManGX, oldManGY);
  const oldWomanPos = ensureFree(oldWomanGX, oldWomanGY);
  const bugPos = ensureFree(bugGX, bugGY);
  const kidPos = ensureFree(kidGX, kidGY);

  return [
    {
      id: 'npc_tech_guy',
      name: 'Bác Mê Công Nghệ',
      spriteKey: 'char_tech_guy',
      gx: techPos.gx,
      gy: techPos.gy,
      direction: techDir,
      initialDirection: techDir,
      idleBehavior: 'turn_cycle',
      movementMode: 'wander_box',
      wanderRadius: 2,
      lookAtPlayerRadius: 2.2,
      ambientEmotePool: ['sparkle', 'question', 'chat'],
      turnCycle: [techDir, (techDir + 1) % 4, techDir, (techDir + 3) % 4] as Array<0 | 1 | 2 | 3>,
      turnIntervalMs: 2600,
      dialogue: [
        'Công nghệ ngày nay thật phi thường!',
        'Giờ đây, bạn có thể lưu trữ và rút Pokémon bất cứ lúc nào thông qua hệ thống máy tính PC!',
        'Thậm chí ngay trong phòng ngủ của bạn ở tầng 2 cũng có một chiếc PC đấy!',
      ],
    },
    {
      id: 'npc_flower_girl',
      name: 'Cô Gái Yêu Hoa',
      spriteKey: 'char_flower_girl',
      gx: flowerPos.gx,
      gy: flowerPos.gy,
      direction: flowerDir,
      initialDirection: flowerDir,
      idleBehavior: 'turn_cycle',
      movementMode: 'wander_box',
      wanderRadius: 2,
      lookAtPlayerRadius: 2.2,
      ambientEmotePool: ['heart', 'music', 'sparkle'],
      turnCycle: [flowerDir, (flowerDir + 2) % 4, flowerDir, (flowerDir + 1) % 4] as Array<0 | 1 | 2 | 3>,
      turnIntervalMs: 3000,
      dialogue: [
        'Chào cậu! Những bông hoa quanh làng nở rộ quanh năm nhờ sự chăm sóc của mọi người đấy.',
        'Mỗi loài hoa dại trên bãi cỏ đều thu hút những chú Pokémon hệ Côn trùng và Thực vật dễ thương.',
        'Nếu cậu nhẹ nhàng bước đi trên cỏ, cậu sẽ thấy thế giới này tràn đầy sức sống!',
      ],
    },
    {
      id: 'npc_farmer',
      name: 'Bác Nông Dân',
      spriteKey: 'char_farmer',
      gx: farmerPos.gx,
      gy: farmerPos.gy,
      direction: farmerDir,
      initialDirection: farmerDir,
      idleBehavior: 'turn_cycle',
      movementMode: 'wander_box',
      wanderRadius: 2,
      lookAtPlayerRadius: 2.2,
      ambientEmotePool: ['music', 'chat'],
      turnCycle: [farmerDir, (farmerDir + 1) % 4, farmerDir, (farmerDir + 2) % 4] as Array<0 | 1 | 2 | 3>,
      turnIntervalMs: 2800,
      dialogue: [
        'Chào nhóc! Bác đang chăm sóc đàn gia súc và lúa mì trong trang trại này.',
        'Pokémon cũng giống như cây cỏ vậy, nếu được yêu thương và cho ăn uống no đủ, chúng sẽ lớn nhanh như thổi!',
        'Hãy luôn đối xử tốt với những người bạn Pokémon đồng hành của cháu nhé!',
      ],
    },
    {
      id: 'npc_sea_boy',
      name: 'Cậu Bé Ngắm Biển',
      spriteKey: 'char_sea_boy',
      gx: seaPos.gx,
      gy: seaPos.gy,
      direction: seaDir,
      initialDirection: seaDir,
      idleBehavior: 'turn_cycle',
      movementMode: 'wander_box',
      wanderRadius: 1,
      lookAtPlayerRadius: 2.2,
      ambientEmotePool: ['music', 'question', 'sparkle'],
      turnCycle: [seaDir, seaDir, (seaDir + 1) % 4, seaDir] as Array<0 | 1 | 2 | 3>,
      turnIntervalMs: 3500,
      dialogue: [
        'Phía nam này là biển cả mênh mông... Sóng vỗ rì rào nghe êm tai thật đấy!',
        'Người ta đồn rằng bên kia đại dương là Đảo Cinnabar với ngọn núi lửa kỳ bí.',
        'Ước gì tớ có một chú Pokémon biết bơi (Surf) để cùng lướt sóng ra khơi khám phá thế giới!',
      ],
    },
    {
      id: 'npc_old_man',
      name: 'Cụ Ông Kể Chuyện',
      spriteKey: 'char_old_man',
      gx: oldManPos.gx,
      gy: oldManPos.gy,
      direction: oldManDir,
      initialDirection: oldManDir,
      idleBehavior: 'turn_cycle',
      movementMode: 'wander_box',
      wanderRadius: 2,
      lookAtPlayerRadius: 2.2,
      ambientEmotePool: ['chat', 'sparkle'],
      turnCycle: [oldManDir, (oldManDir + 1) % 4, oldManDir, (oldManDir + 3) % 4] as Array<0 | 1 | 2 | 3>,
      turnIntervalMs: 3200,
      dialogue: [
        'Khụ khụ... Thị trấn Pallet của chúng ta tuy nhỏ nhưng là cái nôi của biết bao nhà huấn luyện tài ba đấy cháu à.',
        'Ngày xưa, Giáo sư Okido cũng từng chu du khắp các đại lục để ghi chép dữ liệu Pokédex như các cháu bây giờ.',
        'Tuổi trẻ thật đáng quý, hãy vững bước trên con đường cháu đã chọn nhé!',
      ],
    },
    {
      id: 'npc_old_woman',
      name: 'Cụ Bà Hiền Từ',
      spriteKey: 'char_old_woman',
      gx: oldWomanPos.gx,
      gy: oldWomanPos.gy,
      direction: oldWomanDir,
      initialDirection: oldWomanDir,
      idleBehavior: 'turn_cycle',
      movementMode: 'wander_box',
      wanderRadius: 1,
      lookAtPlayerRadius: 2.2,
      ambientEmotePool: ['heart', 'music'],
      turnCycle: [oldWomanDir, oldWomanDir, (oldWomanDir + 2) % 4, oldWomanDir] as Array<0 | 1 | 2 | 3>,
      turnIntervalMs: 3400,
      dialogue: [
        'Ôi cháu yêu, đi đâu mà vội vã thế? Ra bãi cỏ Route 1 nhớ cẩn thận nhé.',
        'Nếu Pokémon của cháu mệt mỏi, đừng ngần ngại quay về nhà nằm ngủ nghỉ ngơi lấy lại sức.',
        'Mẹ của cháu lúc nào cũng chuẩn bị sẵn chăn ấm nệm êm chờ cháu về đấy!',
      ],
    },
    {
      id: 'npc_bug_catcher',
      name: 'Cậu Bé Bắt Bọ',
      spriteKey: 'char_bug_catcher',
      gx: bugPos.gx,
      gy: bugPos.gy,
      direction: bugDir,
      initialDirection: bugDir,
      idleBehavior: 'turn_cycle',
      movementMode: 'wander_box',
      wanderRadius: 2,
      lookAtPlayerRadius: 2.2,
      ambientEmotePool: ['exclamation', 'music'],
      turnCycle: [bugDir, (bugDir + 1) % 4, (bugDir + 2) % 4, bugDir] as Array<0 | 1 | 2 | 3>,
      turnIntervalMs: 2400,
      dialogue: [
        'Tớ vừa nhìn thấy một chú Caterpie bò lổm ngổm trên hàng rào phía sau đấy!',
        'Vợt bắt bọ của tớ đã sẵn sàng rồi! Khi lớn lên, tớ sẽ trở thành Huấn luyện viên hệ Côn trùng số một!',
        'Cậu cũng thích Pokémon hệ Côn trùng chứ?!',
      ],
    },
    {
      id: 'npc_school_kid',
      name: 'Bạn Nhỏ Học Việc',
      spriteKey: 'char_school_kid_m',
      gx: kidPos.gx,
      gy: kidPos.gy,
      direction: kidDir,
      initialDirection: kidDir,
      idleBehavior: 'turn_cycle',
      movementMode: 'wander_box',
      wanderRadius: 2,
      lookAtPlayerRadius: 2.2,
      ambientEmotePool: ['question', 'sparkle'],
      turnCycle: [kidDir, (kidDir + 3) % 4, kidDir, (kidDir + 1) % 4] as Array<0 | 1 | 2 | 3>,
      turnIntervalMs: 2700,
      dialogue: [
        'Tớ đang đọc cuốn cẩm nang về các hệ Pokémon: Nước dập Lửa, Lửa đốt Cỏ, Cỏ hút Nước!',
        'Nắm vững tương khắc hệ là chìa khóa để giành chiến thắng trong mọi trận so tài đấy.',
        'Cậu có nhận được Pokédex từ Giáo sư Okido chưa? Thật đáng ghen tị quá đi!',
      ],
    },
  ];
}

/**
 * Returns the deterministic starter village placement according to the world seed.
 * Implements a Minecraft-style Procedural Jigsaw & District Plot System across 4 archetypes
 * and 3 dynamic scale tiers (0 = Cozy Hamlet, 1 = Bustling Village, 2 = Sprawling Country Town).
 */
export function getStartVillagePlacement(seed = 101): VillagePlacement {
  if (cachedStartVillage && cachedSeed === seed) {
    return cachedStartVillage;
  }

  const anchorGX = V0_CONFIG.START_ANCHOR_GX;
  const anchorGY = V0_CONFIG.START_ANCHOR_GY;

  const buildings: BuildingPlacement[] = [];
  const pathKeys = new Set<string>();
  const gardenPlants: VillagePlantPlacement[] = [];
  const bounds: BoundsTracker = { minGX: 9999, maxGX: -9999, minGY: 9999, maxGY: -9999 };

  const archetypeInfo = getStarterTownArchetype(seed);
  const scaleTier = getStarterTownScaleTier(seed);

  switch (archetypeInfo.index) {
    case 0:
      buildClassicPallet(
        seed,
        scaleTier,
        anchorGX,
        anchorGY,
        buildings,
        pathKeys,
        gardenPlants,
        bounds
      );
      break;
    case 1:
      buildSunriseRanch(
        seed,
        scaleTier,
        anchorGX,
        anchorGY,
        buildings,
        pathKeys,
        gardenPlants,
        bounds
      );
      break;
    case 2:
      buildCrossroadsShire(
        seed,
        scaleTier,
        anchorGX,
        anchorGY,
        buildings,
        pathKeys,
        gardenPlants,
        bounds
      );
      break;
    case 3:
      buildCourtyardValley(
        seed,
        scaleTier,
        anchorGX,
        anchorGY,
        buildings,
        pathKeys,
        gardenPlants,
        bounds
      );
      break;
  }

  // Ensure door front tiles are cleanly added to paths so player never spawns on wild grass
  const playerHouse = buildings.find((b) => b.type === 'house_player');
  if (playerHouse) {
    addRoadTile(pathKeys, playerHouse.doorGX, playerHouse.doorGY, bounds);
    addRoadTile(pathKeys, playerHouse.doorGX, playerHouse.doorGY + 1, bounds);
    addRoadTile(pathKeys, playerHouse.doorGX + 1, playerHouse.doorGY + 1, bounds);
  }

  const npcs = buildVillageNPCs(
    seed,
    archetypeInfo.id,
    anchorGX,
    anchorGY,
    buildings,
    pathKeys,
    gardenPlants
  );

  const startVillage: VillagePlacement = {
    k: 0,
    name: archetypeInfo.name,
    tier: scaleTier,
    centerGX: anchorGX,
    centerGY: anchorGY,
    bounds: {
      minGX: bounds.minGX - 3,
      maxGX: bounds.maxGX + 3,
      minGY: bounds.minGY - 3,
      maxGY: bounds.maxGY + 3,
    },
    buildings,
    pathTileKeys: pathKeys,
    gardenPlants,
    npcs,
  };

  cachedStartVillage = startVillage;
  cachedSeed = seed;
  return startVillage;
}

/**
 * Returns player spawn position right in front of the Player's house door.
 */
export function getStartSpawn(seed = 101): { gx: number; gy: number } {
  const village = getStartVillagePlacement(seed);
  const playerHouse =
    village.buildings.find((b) => b.type === 'house_player') ||
    village.buildings.find((b) => b.type === 'house_red');
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

/**
 * Returns structured layout info for the starting village for testing and queries.
 */
export function getStartVillageLayout(seed = 101): {
  archetype: TownArchetype;
  archetypeName: string;
  scaleTier: StarterScaleTier;
  village: VillagePlacement;
  buildings: BuildingPlacement[];
  npcs: VillageNPCEntity[];
} {
  const archetypeInfo = getStarterTownArchetype(seed);
  const scaleTier = getStarterTownScaleTier(seed);
  const village = getStartVillagePlacement(seed);
  return {
    archetype: archetypeInfo.id,
    archetypeName: archetypeInfo.name,
    scaleTier,
    village,
    buildings: village.buildings,
    npcs: village.npcs ?? [],
  };
}

export function getStartVillageNPCs(seed = 101): VillageNPCEntity[] {
  return getStartVillagePlacement(seed).npcs ?? [];
}

export function getStartVillageBuildings(seed = 101): BuildingPlacement[] {
  return getStartVillagePlacement(seed).buildings;
}

export function getStartVillageBuildingAt(
  gx: number,
  gy: number,
  seed = 101
): BuildingPlacement | undefined {
  const buildings = getStartVillageBuildings(seed);
  return buildings.find((b) => {
    return (
      gx >= b.gx &&
      gx < b.gx + b.widthTiles &&
      gy >= b.gy &&
      gy < b.gy + b.heightTiles
    );
  });
}

/**
 * Clears trees across a large open meadow on Route 1 around the Onisuzume story encounter.
 * Extends 37 tiles wide horizontally and from north of the encounter down to the Pallet Town border.
 */
export function isRoute1ClearingArea(
  gx: number,
  gy: number,
  seedOrField: number | { seed: number } = 101
): boolean {
  const seed = typeof seedOrField === 'number' ? seedOrField : seedOrField.seed;
  const villagePlacement = getStartVillagePlacement(seed);
  const centerGX = Math.round((villagePlacement.bounds.minGX + villagePlacement.bounds.maxGX) / 2);
  const targetGY = villagePlacement.bounds.minGY - 22;

  return (
    gx >= centerGX - 18 &&
    gx <= centerGX + 18 &&
    gy >= targetGY - 14 &&
    gy <= villagePlacement.bounds.minGY - 2
  );
}

