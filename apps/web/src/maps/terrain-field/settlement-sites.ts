import {
  type BuildingPlacement,
  type VillagePlantPlacement,
  type VillagePlacement,
  type VillageNPCEntity,
  createBuildingPlacement,
  getVillagePlacement,
  VILLAGE_CYCLE_HEIGHT,
} from '../village-rules';
import type { TerrainField } from './terrain-field';
import { V0_CONFIG } from './v0-config';
import { hash2 } from './noise';
import { getStartVillagePlacement } from './start-village';
import type { ContinentPlan } from '../../continent';

const HAMLET_NAMES = [
  'Oakhaven Hamlet',
  'Riverside Hamlet',
  'Breeze Hamlet',
  'Sunlit Hamlet',
  'Pine Hamlet',
];
const TOWN_NAMES = [
  'Verdant Town',
  'Amber Town',
  'Mistveil Town',
  'Starlight Town',
  'Goldenrod Town',
];
const CITY_NAMES = [
  'Floaroma City',
  'Celadon City',
  'Rustboro City',
  'Lumiose City',
  'Jubilife City',
];

const SETTLEMENT_CACHE_LIMIT = 256;
const V4_SETTLEMENT_CACHE_LIMIT = 32;
const settlementCache = new Map<string, VillagePlacement | null>();
const v4SettlementCache = new Map<string, VillagePlacement[]>();

function cacheSettlement(
  key: string,
  value: VillagePlacement | null
): VillagePlacement | null {
  if (settlementCache.size >= SETTLEMENT_CACHE_LIMIT) {
    const first = settlementCache.keys().next().value;
    if (first !== undefined) settlementCache.delete(first);
  }
  settlementCache.set(key, value);
  return value;
}

type V4Field = TerrainField & { readonly continentPlan?: ContinentPlan };

function isSuitableSettlementArea(
  field: TerrainField,
  centerGX: number,
  centerGY: number,
  tier: 0 | 1 | 2
): boolean {
  const halfWidth = tier === 2 ? 16 : 12;
  const halfHeight = 10;
  if (field.isOcean(centerGX, centerGY) || field.isWater(centerGX, centerGY)) return false;
  if (field.isOcean(centerGX - halfWidth, centerGY - halfHeight) || field.isWater(centerGX - halfWidth, centerGY - halfHeight)) return false;
  if (field.isOcean(centerGX + halfWidth, centerGY - halfHeight) || field.isWater(centerGX + halfWidth, centerGY - halfHeight)) return false;
  if (field.isOcean(centerGX - halfWidth, centerGY + halfHeight) || field.isWater(centerGX - halfWidth, centerGY + halfHeight)) return false;
  if (field.isOcean(centerGX + halfWidth, centerGY + halfHeight) || field.isWater(centerGX + halfWidth, centerGY + halfHeight)) return false;
  return true;
}

const ANCHOR_OFFSETS: ReadonlyArray<[number, number]> = [
  [0, 0],
  [0, -8],
  [0, 8],
  [-8, 0],
  [8, 0],
  [-16, 0],
  [16, 0],
  [0, -16],
  [0, 16],
  [-16, -16],
  [16, -16],
  [-16, 16],
  [16, 16],
];

function findSettlementAnchor(
  field: TerrainField,
  prefGX: number,
  prefGY: number,
  tier: 0 | 1 | 2
): { gx: number; gy: number } | null {
  for (const [dx, dy] of ANCHOR_OFFSETS) {
    if (isSuitableSettlementArea(field, prefGX + dx, prefGY + dy, tier)) {
      return { gx: prefGX + dx, gy: prefGY + dy };
    }
  }
  return null;
}

function getV4VillagePlacements(field: TerrainField): VillagePlacement[] {
  const plan = (field as V4Field).continentPlan;
  if (!plan) return [];
  const cacheKey = `${field.version}:${field.seed}`;
  const cached = v4SettlementCache.get(cacheKey);
  if (cached) return cached;

  const placements: VillagePlacement[] = [];
  for (const settlement of plan.settlements) {
    // Keep 96-tile clearance around (0, 0) starter village
    if (Math.hypot(settlement.gx, settlement.gy) < 96) continue;
    const anchor = findSettlementAnchor(field, settlement.gx, settlement.gy, settlement.tier);
    if (!anchor) continue;
    placements.push(
      constructVillage(
        anchor.gx,
        anchor.gy,
        settlement.tier,
        settlement.id,
        field.seed,
        settlement.name,
        'v4'
      )
    );
  }
  if (v4SettlementCache.size >= V4_SETTLEMENT_CACHE_LIMIT) {
    const first = v4SettlementCache.keys().next().value;
    if (first !== undefined) v4SettlementCache.delete(first);
  }
  v4SettlementCache.set(cacheKey, placements);
  return placements;
}

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

  const calmR1 = field.version === 3 ? 144 : V0_CONFIG.CALM_R1;
  const minVillageDist = field.version === 3 ? 120 : V0_CONFIG.MIN_VILLAGE_DIST;

  // 1. Strict starter protection: no random village inside calm zone
  if (Math.hypot(regionCenterGX, regionCenterGY) < calmR1) {
    return cacheSettlement(key, null);
  }

  // 2. Probability check
  const probRoll = hash2(rx, ry, seed, V0_CONFIG.VILLAGE_SALT);
  if (probRoll >= V0_CONFIG.VILLAGE_PROB) {
    return cacheSettlement(key, null);
  }

  // 3. Deterministic candidate anchor offset within the region
  const offX = Math.floor(hash2(rx, ry, seed, V0_CONFIG.VILLAGE_SALT_X) * 48) + 24;
  const offY = Math.floor(hash2(rx, ry, seed, V0_CONFIG.VILLAGE_SALT_Y) * 48) + 24;
  const candGX = rx * regionSize + offX;
  const candGY = ry * regionSize + offY;

  // 4. Strict distance from (0, 0) starter village
  if (Math.hypot(candGX, candGY) < minVillageDist) {
    return cacheSettlement(key, null);
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
      if (Math.hypot(nCenterGX, nCenterGY) < calmR1) continue;

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
          return cacheSettlement(key, null);
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
        return cacheSettlement(key, null);
      }
    }
  }

  // 8. Construct valid village placement
  const village = constructVillage(candGX, candGY, tier, rx * 1000 + ry, seed);
  return cacheSettlement(key, village);
}

function constructCity(
  anchorGX: number,
  anchorGY: number,
  kId: number,
  _seed: number,
  name: string,
  idPrefix = 'v0'
): VillagePlacement {
  const buildings: BuildingPlacement[] = [];
  const pathKeys = new Set<string>();
  const gardenPlants: VillagePlantPlacement[] = [];
  const npcs: VillageNPCEntity[] = [];

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

  // 1. Core Civic & Public Buildings
  const bCen = createBuildingPlacement(
    `${idPrefix}_${kId}_cen`,
    'city_pokecenter',
    anchorGX - 13,
    anchorGY - 7
  );
  const bPol = createBuildingPlacement(
    `${idPrefix}_${kId}_pol`,
    'city_police_station',
    anchorGX + 4,
    anchorGY - 6
  );
  const bMart = createBuildingPlacement(
    `${idPrefix}_${kId}_mart`,
    'city_pokemart',
    anchorGX + 11,
    anchorGY - 5
  );

  // 2. Residential City Buildings
  const bH1 = createBuildingPlacement(
    `${idPrefix}_${kId}_h1`,
    'city_house_1',
    anchorGX - 14,
    anchorGY + 3
  );
  const bH3 = createBuildingPlacement(
    `${idPrefix}_${kId}_h3`,
    'city_house_3',
    anchorGX - 8,
    anchorGY + 3
  );
  const bH6 = createBuildingPlacement(
    `${idPrefix}_${kId}_h6`,
    'city_house_6',
    anchorGX + 4,
    anchorGY + 3
  );
  const bH7 = createBuildingPlacement(
    `${idPrefix}_${kId}_h7`,
    'city_house_7',
    anchorGX + 12,
    anchorGY + 3
  );

  // 3. Street Furniture & Utilities
  const bSign = createBuildingPlacement(
    `${idPrefix}_${kId}_sign`,
    'city_guide_sign',
    anchorGX - 18,
    anchorGY - 1
  );
  const bSignPlaza = createBuildingPlacement(
    `${idPrefix}_${kId}_sign2`,
    'city_guide_sign',
    anchorGX - 4,
    anchorGY - 4
  );
  const bBench1 = createBuildingPlacement(
    `${idPrefix}_${kId}_bench1`,
    'bench_stone_large',
    anchorGX - 4,
    anchorGY
  );
  const bBench2 = createBuildingPlacement(
    `${idPrefix}_${kId}_bench2`,
    'bench_stone_large',
    anchorGX + 3,
    anchorGY
  );
  const bPottedL1 = createBuildingPlacement(
    `${idPrefix}_${kId}_potl1`,
    'plant_potted_tall',
    anchorGX - 11,
    anchorGY - 3
  );
  const bPottedL2 = createBuildingPlacement(
    `${idPrefix}_${kId}_potl2`,
    'plant_potted_tall',
    anchorGX - 8,
    anchorGY - 3
  );

  const polePositions = [
    [-17, -3],
    [-5, -3],
    [2, -3],
    [16, -3],
    [-17, 2],
    [2, 2],
    [16, 2],
  ];
  const poles = polePositions.map(([dx, dy], idx) =>
    createBuildingPlacement(
      `${idPrefix}_${kId}_pole_${idx}`,
      'city_utility_pole',
      anchorGX + dx,
      anchorGY + dy
    )
  );

  buildings.push(
    bCen,
    bPol,
    bMart,
    bH1,
    bH3,
    bH6,
    bH7,
    bSign,
    bSignPlaza,
    bBench1,
    bBench2,
    bPottedL1,
    bPottedL2,
    ...poles
  );

  // 4. City Boulevard & Sidewalk Paving (Grand Avenue)
  // East-West Main Boulevard (4 tiles wide from -20 to +20)
  for (let gx = anchorGX - 20; gx <= anchorGX + 20; gx++) {
    for (let gy = anchorGY - 2; gy <= anchorGY + 1; gy++) {
      addPath(gx, gy);
    }
  }
  // North Avenue connecting to Civic Buildings (PokéCenter, Police, Mart)
  for (let gx = anchorGX - 14; gx <= anchorGX + 16; gx++) {
    for (let gy = anchorGY - 4; gy <= anchorGY - 3; gy++) {
      addPath(gx, gy);
    }
  }
  // North-South Central Crosswalk
  for (let gy = anchorGY - 10; gy <= anchorGY + 7; gy++) {
    for (let gx = anchorGX - 2; gx <= anchorGX + 1; gx++) {
      addPath(gx, gy);
    }
  }
  // South Sidewalk connecting Residential Doors
  for (let gx = anchorGX - 15; gx <= anchorGX + 19; gx++) {
    addPath(gx, anchorGY + 2);
  }

  // Connecting Paths to Every Door
  for (const b of buildings) {
    if (b.doorGX >= 0 && b.doorGY >= 0) {
      addPath(b.doorGX, b.doorGY);
      addPath(b.doorGX, b.doorGY + 1);
      if (b.doorWidthTiles && b.doorWidthTiles > 1) {
        addPath(b.doorGX + 1, b.doorGX);
        addPath(b.doorGX + 1, b.doorGY + 1);
      }
    }
  }

  // 5. Landscaping Flowers in Curated Spots
  addPlant(anchorGX - 3, anchorGY - 1, 'flower_blue');
  addPlant(anchorGX - 2, anchorGY - 1, 'flower_purple');
  addPlant(anchorGX + 1, anchorGY - 1, 'flower_red');
  addPlant(anchorGX + 2, anchorGY - 1, 'flower_yellow');
  addPlant(anchorGX - 6, anchorGY + 1, 'flower_blue_bell');
  addPlant(anchorGX + 8, anchorGY + 1, 'flower_purple_bell');

  // 6. City NPCs
  npcs.push(
    {
      id: `${idPrefix}_${kId}_jenny`,
      name: 'Officer Jenny',
      spriteKey: 'officer_jenny',
      gx: anchorGX + 6,
      gy: anchorGY - 3,
      direction: 0,
      initialDirection: 0,
      idleBehavior: 'stand',
      dialogue: [
        'Chào mừng đến với Thành phố! Tôi là Cảnh sát trưởng Jenny.',
        'Sở Cảnh sát luôn tuần tra 24/7 để giữ gìn trật tự an ninh cho mọi người và Pokémon.',
        'Gần đây có báo cáo về các thành viên khả nghi của Đội Hỏa Tiễn... Các huấn luyện viên hãy nâng cao cảnh giác nhé!',
      ],
    },
    {
      id: `${idPrefix}_${kId}_cop`,
      name: 'Policeman',
      spriteKey: 'policeman',
      gx: anchorGX - 17,
      gy: anchorGY - 1,
      direction: 2,
      initialDirection: 2,
      idleBehavior: 'turn_random',
      dialogue: [
        'Chào mừng bạn đến với Thành phố!',
        'Nếu Pokémon của bạn mệt mỏi sau chặng đường dài, Trung tâm Pokémon mái đỏ lớn ngay phía trước sẽ hồi phục toàn bộ thể lực hoàn toàn miễn phí!',
      ],
    },
    {
      id: `${idPrefix}_${kId}_nurse_asst`,
      name: 'Y tá Thành phố',
      spriteKey: 'nurse_joy',
      gx: anchorGX - 9,
      gy: anchorGY - 3,
      direction: 0,
      initialDirection: 0,
      idleBehavior: 'stand',
      dialogue: [
        'Chào cậu và chú Pikachu đáng yêu! Chuyến đi từ thị trấn Masara chắc hẳn vất vả lắm.',
        'Trung tâm Pokémon của thành phố hiện đại và đầy đủ trang thiết bị nhất vùng này đấy!',
      ],
    },
    {
      id: `${idPrefix}_${kId}_kid`,
      name: 'School Kid',
      spriteKey: 'school_kid_m',
      gx: anchorGX - 1,
      gy: anchorGY - 1,
      direction: 1,
      initialDirection: 1,
      idleBehavior: 'turn_random',
      dialogue: [
        'PokéMart ở phía đông bán đủ các loại bóng Pokéball, bình thuốc Potion và thuốc giải độc!',
        'Tớ đang tích tiền mua một chiếc xe đạp để chạy vòng quanh các con phố!',
      ],
    },
    {
      id: `${idPrefix}_${kId}_elder`,
      name: 'Bà Lão',
      spriteKey: 'old_woman',
      gx: anchorGX - 3,
      gy: anchorGY + 1,
      direction: 0,
      initialDirection: 0,
      idleBehavior: 'stand',
      dialogue: [
        'Thành phố hôm nay thật nhộn nhịp, hoa nở ngát hương khắp các bồn cây.',
        'Nhìn thấy các cháu huấn luyện viên trẻ tuổi nhiệt huyết, bà lại nhớ về thời thanh xuân phiêu lưu của mình.',
      ],
    },
    {
      id: `${idPrefix}_${kId}_lady`,
      name: 'Quý Cô Ô Xanh',
      spriteKey: 'parasol_lady',
      gx: anchorGX + 10,
      gy: anchorGY + 1,
      direction: 1,
      initialDirection: 1,
      idleBehavior: 'turn_cycle',
      turnCycle: [0, 1, 3, 2],
      turnIntervalMs: 3000,
      dialogue: [
        'Đại lộ thành phố lúc nào cũng mát mẻ nhờ gió từ đồng cỏ thổi về.',
        'Cậu có muốn cùng Pikachu ghé qua tiệm trà thư giãn một chút không?',
      ],
    }
  );

  for (const b of buildings) {
    if (b.gx < minGX) minGX = b.gx;
    if (b.gx + b.widthTiles > maxGX) maxGX = b.gx + b.widthTiles;
    if (b.gy < minGY) minGY = b.gy;
    if (b.gy + b.heightTiles > maxGY) maxGY = b.gy + b.heightTiles;
  }

  return {
    k: kId,
    name,
    tier: 2,
    centerGX: anchorGX,
    centerGY: anchorGY,
    bounds: {
      minGX: minGX - 3,
      maxGX: maxGX + 3,
      minGY: minGY - 3,
      maxGY: maxGY + 3,
    },
    entranceGX: anchorGX - 20,
    entranceGY: anchorGY,
    buildings,
    pathTileKeys: pathKeys,
    gardenPlants,
    npcs,
  };
}

function constructTown(
  anchorGX: number,
  anchorGY: number,
  kId: number,
  _seed: number,
  name: string,
  idPrefix = 'v0'
): VillagePlacement {
  const buildings: BuildingPlacement[] = [];
  const pathKeys = new Set<string>();
  const gardenPlants: VillagePlantPlacement[] = [];
  const npcs: VillageNPCEntity[] = [];

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

  const bCen = createBuildingPlacement(
    `${idPrefix}_${kId}_cen`,
    'city_pokecenter',
    anchorGX - 10,
    anchorGY - 6
  );
  const bMart = createBuildingPlacement(
    `${idPrefix}_${kId}_mart`,
    'city_pokemart',
    anchorGX + 2,
    anchorGY - 5
  );
  const bSign = createBuildingPlacement(
    `${idPrefix}_${kId}_sign`,
    'city_guide_sign',
    anchorGX - 14,
    anchorGY - 1
  );
  const bH1 = createBuildingPlacement(
    `${idPrefix}_${kId}_h1`,
    'city_house_1',
    anchorGX - 11,
    anchorGY + 3
  );
  const bH3 = createBuildingPlacement(
    `${idPrefix}_${kId}_h3`,
    'city_house_3',
    anchorGX - 5,
    anchorGY + 3
  );
  const bFlow = createBuildingPlacement(
    `${idPrefix}_${kId}_flow`,
    'house_flowers',
    anchorGX + 2,
    anchorGY + 2
  );

  const bPole1 = createBuildingPlacement(
    `${idPrefix}_${kId}_pole1`,
    'city_utility_pole',
    anchorGX - 12,
    anchorGY - 2
  );
  const bPole2 = createBuildingPlacement(
    `${idPrefix}_${kId}_pole2`,
    'city_utility_pole',
    anchorGX + 7,
    anchorGY - 2
  );

  buildings.push(bCen, bMart, bSign, bH1, bH3, bFlow, bPole1, bPole2);

  // Town Avenue
  for (let gx = anchorGX - 15; gx <= anchorGX + 12; gx++) {
    addPath(gx, anchorGY - 2);
    addPath(gx, anchorGY - 1);
    addPath(gx, anchorGY);
    addPath(gx, anchorGY + 1);
  }
  for (let gx = anchorGX - 11; gx <= anchorGX + 8; gx++) {
    addPath(gx, anchorGY - 4);
    addPath(gx, anchorGY - 3);
  }
  for (const b of buildings) {
    if (b.doorGX >= 0 && b.doorGY >= 0) {
      addPath(b.doorGX, b.doorGY);
      addPath(b.doorGX, b.doorGY + 1);
    }
  }

  addPlant(anchorGX - 2, anchorGY - 1, 'flower_blue');
  addPlant(anchorGX - 1, anchorGY - 1, 'flower_red');

  npcs.push({
    id: `${idPrefix}_${kId}_camper`,
    name: 'Camper',
    spriteKey: 'camper_m',
    gx: anchorGX - 1,
    gy: anchorGY,
    direction: 0,
    initialDirection: 0,
    idleBehavior: 'turn_random',
    dialogue: [
      `Chào bạn, đây là thị trấn ${name}!`,
      'Thị trấn của chúng tôi thanh bình và có đầy đủ dịch vụ hỗ trợ các nhà huấn luyện viên.',
    ],
  });

  for (const b of buildings) {
    if (b.gx < minGX) minGX = b.gx;
    if (b.gx + b.widthTiles > maxGX) maxGX = b.gx + b.widthTiles;
    if (b.gy < minGY) minGY = b.gy;
    if (b.gy + b.heightTiles > maxGY) maxGY = b.gy + b.heightTiles;
  }

  return {
    k: kId,
    name,
    tier: 1,
    centerGX: anchorGX,
    centerGY: anchorGY,
    bounds: {
      minGX: minGX - 2,
      maxGX: maxGX + 2,
      minGY: minGY - 2,
      maxGY: maxGY + 2,
    },
    entranceGX: anchorGX - 15,
    entranceGY: anchorGY,
    buildings,
    pathTileKeys: pathKeys,
    gardenPlants,
    npcs,
  };
}

function constructHamlet(
  anchorGX: number,
  anchorGY: number,
  kId: number,
  _seed: number,
  name: string,
  idPrefix = 'v0'
): VillagePlacement {
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

  const bMart = createBuildingPlacement(
    `${idPrefix}_${kId}_mart`,
    'pokemart',
    anchorGX - 10,
    anchorGY + 2
  );
  const bSign = createBuildingPlacement(
    `${idPrefix}_${kId}_sign`,
    'signpost',
    anchorGX - 5,
    anchorGY + 3
  );
  const bCen = createBuildingPlacement(
    `${idPrefix}_${kId}_cen`,
    'pokecenter',
    anchorGX - 2,
    anchorGY + 1
  );
  const bRed = createBuildingPlacement(
    `${idPrefix}_${kId}_red`,
    'house_red',
    anchorGX - 10,
    anchorGY - 8
  );
  const bCot = createBuildingPlacement(
    `${idPrefix}_${kId}_cot`,
    'house_cottage',
    anchorGX - 1,
    anchorGY - 7
  );

  buildings.push(bMart, bSign, bCen, bRed, bCot);

  const maxStreetX = anchorGX + 8;
  for (let gx = anchorGX - 12; gx <= maxStreetX; gx++) {
    addPath(gx, anchorGY - 1);
    addPath(gx, anchorGY);
  }
  for (let gx = anchorGX - 10; gx <= maxStreetX; gx++) {
    addPath(gx, anchorGY - 5);
    addPath(gx, anchorGY - 4);
  }
  for (let gy = anchorGY - 3; gy <= anchorGY - 2; gy++) {
    addPath(anchorGX - 4, gy);
    addPath(anchorGX - 3, gy);
  }

  addPath(bRed.doorGX, anchorGY - 6);
  addPath(bRed.doorGX + 1, anchorGY - 6);
  addPath(bCot.doorGX, anchorGY - 6);
  addPath(bMart.doorGX, anchorGY + 3);
  addPath(bCen.doorGX, anchorGY + 3);

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
    tier: 0,
    centerGX: anchorGX,
    centerGY: anchorGY,
    bounds: {
      minGX: minGX - 2,
      maxGX: maxGX + 2,
      minGY: minGY - 2,
      maxGY: maxGY + 2,
    },
    entranceGX: anchorGX - 12,
    entranceGY: anchorGY - 1,
    buildings,
    pathTileKeys: pathKeys,
    gardenPlants,
  };
}

function constructVillage(
  anchorGX: number,
  anchorGY: number,
  tier: 0 | 1 | 2,
  kId: number,
  seed: number,
  nameOverride?: string,
  idPrefix = 'v0'
): VillagePlacement {
  const nameList = tier === 2 ? CITY_NAMES : tier === 1 ? TOWN_NAMES : HAMLET_NAMES;
  const nameIdx =
    Math.floor(hash2(anchorGX, anchorGY, seed, 444) * nameList.length) % nameList.length;
  const name = nameOverride ?? nameList[nameIdx];

  if (tier === 2) {
    return constructCity(anchorGX, anchorGY, kId, seed, name, idPrefix);
  }
  if (tier === 1) {
    return constructTown(anchorGX, anchorGY, kId, seed, name, idPrefix);
  }
  return constructHamlet(anchorGX, anchorGY, kId, seed, name, idPrefix);
}

/**
 * Returns all settlements that can affect the area around (gx, gy).
 */
export function getNearbySettlements(
  gx: number,
  gy: number,
  field: TerrainField
): VillagePlacement[] {
  const results: VillagePlacement[] = [];

  if (field.version >= 4) {
    const v4Results = getV4VillagePlacements(field).filter(
      (v) => Math.abs(v.centerGX - gx) <= 640 && Math.abs(v.centerGY - gy) <= 640
    );
    results.push(...v4Results);
  } else {
    const regionSize = V0_CONFIG.REGION_TILES;
    const rx = Math.floor(gx / regionSize);
    const ry = Math.floor(gy / regionSize);

    // Check 3x3 surrounding regions
    for (let dry = -1; dry <= 1; dry++) {
      for (let drx = -1; drx <= 1; drx++) {
        const v = getSettlementForRegion(rx + drx, ry + dry, field);
        if (v) results.push(v);
      }
    }
  }

  // Always check starter village if within range of origin
  if (Math.hypot(gx, gy) <= 160) {
    const startVillage = getStartVillagePlacement(field.seed);
    if (!results.some((s) => s.name === startVillage.name)) {
      results.push(startVillage);
    }
  }

  // Continuous highway settlements (used only in legacy v0/v1/v2/v3)
  if (field.version < 4) {
    const kCenter = Math.round(gy / VILLAGE_CYCLE_HEIGHT);
    for (let dk = -1; dk <= 1; dk++) {
      const k = kCenter + dk;
      if (k === 0) continue; // k = 0 is Pallet Town handled by getStartVillagePlacement
      const v = getVillagePlacement(k, field.seed);
      if (v && Math.abs(v.centerGX - gx) <= 64 && Math.abs(v.centerGY - gy) <= 64) {
        if (!results.some((existing) => existing.k === v.k && existing.name === v.name)) {
          results.push(v);
        }
      }
    }
  }

  return results;
}

/**
 * Checks if (gx, gy) is a walkable internal village path.
 */
export function isV0RoadTile(gx: number, gy: number, field: TerrainField): boolean {
  if (field.version >= 4) {
    const plan = (field as V4Field).continentPlan;
    if (plan) {
      const localX = gx - plan.bounds.gx0 * plan.cellSize;
      const localY = gy - plan.bounds.gy0 * plan.cellSize;
      const width = plan.bounds.cols * plan.cellSize;
      const height = plan.bounds.rows * plan.cellSize;
      if (
        localX >= 0 &&
        localY >= 0 &&
        localX < width &&
        localY < height &&
        plan.roadMask[localY * width + localX] === 1
      ) {
        return true;
      }
    }
  }

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
 * Retrieves all village NPCs located within chunk (cx, cy) in World Gen v0.
 */
export function getV0VillageNPCsForChunk(
  cx: number,
  cy: number,
  field: TerrainField
): VillageNPCEntity[] {
  const chunkStartGX = cx * 16;
  const chunkEndGX = chunkStartGX + 16;
  const chunkStartGY = cy * 16;
  const chunkEndGY = chunkStartGY + 16;

  const settlements = getNearbySettlements(chunkStartGX + 8, chunkStartGY + 8, field);
  const result: VillageNPCEntity[] = [];

  for (const v of settlements) {
    if (!v.npcs) continue;
    for (const npc of v.npcs) {
      if (
        npc.gx >= chunkStartGX &&
        npc.gx < chunkEndGX &&
        npc.gy >= chunkStartGY &&
        npc.gy < chunkEndGY
      ) {
        result.push(npc);
      }
    }
  }

  return result;
}

/**
 * Checks if (gx, gy) is within the bounds of any settlement in World Gen v0.
 */
export function isV0VillageArea(gx: number, gy: number, field: TerrainField, buffer = 0): boolean {
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
