import type { Collider, TerrainId } from '@pokemon/shared-types';
import { CHUNK_SIZE, TILE_SIZE, TERRAIN, TILE_IDS } from '@pokemon/game-data';
import { seededHash } from './noise';
import {
  isSandTile,
  isRoadTile,
  isHillTile,
  isValidTreePosGlobal,
  isValidPalmTreePosGlobal,
  isNearWater,
  isNearCliffEdge,
  isBridgeTile,
  isOceanTile,
  isWaterTile,
} from './terrain-rules';
import {
  isVillageArea,
  isVillageBuildingTile,
  isBuildingRoofOrFootprint,
  getVillageBuildingsForChunk,
  getVillageGardenPlantsForChunk,
} from './village-rules';
import { pickBerryForEcology } from './berry-data';
import {
  sampleEcology,
  getEcologyZone,
  getTreeTypeForEcology,
  getFlowerTypeForCluster,
  getNaturalShrubForZone,
  calculateTallGrassDensity,
  TREE_MIN_CANDIDATES,
  TREE_MAX_CANDIDATES,
} from './ecology';

export interface TreeEntity {
  gx: number;
  gy: number;
  x: number;
  y: number;
  type: string;
}

export interface PlantEntity {
  gx: number;
  gy: number;
  x: number;
  y: number;
  type: string;
  phase: number;
}

export interface TallGrassEntity {
  gx: number;
  gy: number;
  x: number;
  y: number;
  phase: number;
}

export interface BerryBushEntity {
  gx: number;
  gy: number;
  x: number;
  y: number;
  type: string;
  name: string;
  viName: string;
  color: string;
  desc: string;
  stage: 0 | 1 | 2 | 3;
  plantedAt: number;
  phase: number;
}

export interface BuildingEntity {
  id: string;
  type: string;
  gx: number;
  gy: number;
  renderX: number;
  renderY: number;
  spriteWidth: number;
  spriteHeight: number;
  ySort: number;
  doorGX: number;
  doorGY: number;
  doorWidthTiles?: number;
}

/**
 * Checks if a 32x64 berry bush sprite overlaps a 64x118 big tree sprite.
 * Adds an 8px safety padding around the tree's complete canopy and trunk.
 */
export function isBerryOverlappingTree(bpx: number, bpy: number, tx: number, ty: number): boolean {
  const treeLeft = tx - 8;
  const treeRight = tx + 64 + 8;
  const treeTop = ty - 8;
  const treeBottom = ty + 118 + 8;

  const berryLeft = bpx;
  const berryRight = bpx + 32;
  const berryTop = bpy;
  const berryBottom = bpy + 64;

  return (
    berryRight > treeLeft && berryLeft < treeRight && berryBottom > treeTop && berryTop < treeBottom
  );
}

/**
 * Checks if two 64x118 big tree sprites overlap or are placed too close to each other.
 * Enforces strict clearance so canopies and trunks never merge or stack awkwardly:
 * - Trees in the same vertical column (dx === 0) must have at least 120px clearance.
 * - Trees within 2 tiles horizontally (dx < 70) must have at least 100px vertical clearance.
 */
export function isTreeOverlappingTree(t1x: number, t1y: number, t2x: number, t2y: number): boolean {
  const dx = Math.abs(t1x - t2x);
  const dy = Math.abs(t1y - t2y);
  return (dx === 0 && dy < 120) || (dx < 70 && dy < 100);
}

const chunkTreeLocsCache = new Map<string, Array<{ x: number; y: number }>>();

export function getChunkTreeLocations(
  cx: number,
  cy: number,
  seed: number
): Array<{ x: number; y: number }> {
  const key = `${cx},${cy},${seed}`;
  const cached = chunkTreeLocsCache.get(key);
  if (cached) return cached;

  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const centerGX = startGX + 8;
  const centerGY = startGY + 8;
  const chunkEcology = sampleEcology(centerGX, centerGY, seed);
  const numCandidates = Math.round(
    TREE_MIN_CANDIDATES + chunkEcology.density * (TREE_MAX_CANDIDATES - TREE_MIN_CANDIDATES)
  );
  const list: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numCandidates; i++) {
    const randX = seededHash(cx * 100 + i, cy * 100 + i, seed + 2);
    const randY = seededHash(cx * 100 + i, cy * 100 + i, seed + 3);

    const lx = Math.floor(randX * (CHUNK_SIZE - 2)) + 1;
    const ly = Math.floor(randY * (CHUNK_SIZE - 2)) + 1;
    const gx = startGX + lx;
    const gy = startGY + ly;

    const tx = gx * TILE_SIZE - 16;
    const ty = gy * TILE_SIZE - 86;

    if (isValidTreePosGlobal(tx, ty, seed)) {
      const overlaps = list.some((t) => isTreeOverlappingTree(tx, ty, t.x, t.y));
      if (!overlaps) {
        list.push({ x: tx, y: ty });
      }
    }
  }

  // 2. Beach Palm Trees (candidates along the sandy coastline)
  for (let pi = 0; pi < 3; pi++) {
    const prandX = seededHash(cx * 88 + pi, cy * 88 + pi, seed + 9010);
    const prandY = seededHash(cx * 88 + pi, cy * 88 + pi, seed + 9020);
    const plx = Math.floor(prandX * CHUNK_SIZE);
    const ply = Math.floor(prandY * CHUNK_SIZE);
    const pgx = startGX + plx;
    const pgy = startGY + ply;

    if (isValidPalmTreePosGlobal(pgx, pgy, seed)) {
      const ptx = pgx * TILE_SIZE - 48;
      const pty = pgy * TILE_SIZE - 119;

      const overlaps = list.some((t) => isTreeOverlappingTree(ptx, pty, t.x, t.y));
      if (!overlaps) {
        list.push({ x: ptx, y: pty });
      }
    }
  }

  chunkTreeLocsCache.set(key, list);
  return list;
}

export function generateChunkTrees(
  cx: number,
  cy: number,
  seed: number,
  colliders: Collider[]
): TreeEntity[] {
  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const centerGX = startGX + 8;
  const centerGY = startGY + 8;
  const chunkEcology = sampleEcology(centerGX, centerGY, seed);
  const numCandidates = Math.round(
    TREE_MIN_CANDIDATES + chunkEcology.density * (TREE_MAX_CANDIDATES - TREE_MIN_CANDIDATES)
  );
  const trees: TreeEntity[] = [];

  // 1. Inland Forest, Meadow & Mountain Trees
  for (let i = 0; i < numCandidates; i++) {
    const randX = seededHash(cx * 100 + i, cy * 100 + i, seed + 2);
    const randY = seededHash(cx * 100 + i, cy * 100 + i, seed + 3);

    const lx = Math.floor(randX * (CHUNK_SIZE - 2)) + 1;
    const ly = Math.floor(randY * (CHUNK_SIZE - 2)) + 1;
    const gx = startGX + lx;
    const gy = startGY + ly;

    const tx = gx * TILE_SIZE - 16;
    const ty = gy * TILE_SIZE - 86;

    if (isValidTreePosGlobal(tx, ty, seed)) {
      // Prevent overlap with already placed trees in THIS chunk
      const overlapsInChunk = trees.some((t) => isTreeOverlappingTree(tx, ty, t.x, t.y));
      if (overlapsInChunk) continue;

      // Prevent overlap with trees in neighbor chunks
      let overlapsNeighbor = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (dy > 0 || (dy === 0 && dx > 0)) continue;
          const nTrees = getChunkTreeLocations(cx + dx, cy + dy, seed);
          if (nTrees.some((nt) => isTreeOverlappingTree(tx, ty, nt.x, nt.y))) {
            overlapsNeighbor = true;
            break;
          }
        }
        if (overlapsNeighbor) break;
      }
      if (overlapsNeighbor) continue;

      const sample = sampleEcology(gx, gy, seed);
      const zone = getEcologyZone(sample);
      const tType = getTreeTypeForEcology(sample, zone);

      trees.push({ gx, gy, x: tx, y: ty, type: tType });
      colliders.push({ x: tx + 14, y: ty + 90, w: 36, h: 26, type: 'tree' });
    }
  }

  // 2. Beach Palm Trees (1-2 candidates per chunk along coast)
  for (let pi = 0; pi < 3; pi++) {
    const prandX = seededHash(cx * 88 + pi, cy * 88 + pi, seed + 9010);
    const prandY = seededHash(cx * 88 + pi, cy * 88 + pi, seed + 9020);
    const plx = Math.floor(prandX * CHUNK_SIZE);
    const ply = Math.floor(prandY * CHUNK_SIZE);
    const pgx = startGX + plx;
    const pgy = startGY + ply;

    if (isValidPalmTreePosGlobal(pgx, pgy, seed)) {
      const ptx = pgx * TILE_SIZE - 48;
      const pty = pgy * TILE_SIZE - 119;

      // Prevent overlap in this chunk
      const overlapsInChunk = trees.some((t) => isTreeOverlappingTree(ptx, pty, t.x, t.y));
      if (overlapsInChunk) continue;

      // Prevent overlap with trees in neighbor chunks
      let overlapsNeighbor = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (dy > 0 || (dy === 0 && dx > 0)) continue;
          const nTrees = getChunkTreeLocations(cx + dx, cy + dy, seed);
          if (nTrees.some((nt) => isTreeOverlappingTree(ptx, pty, nt.x, nt.y))) {
            overlapsNeighbor = true;
            break;
          }
        }
        if (overlapsNeighbor) break;
      }
      if (overlapsNeighbor) continue;

      trees.push({ gx: pgx, gy: pgy, x: ptx, y: pty, type: 'palm' });
      colliders.push({ x: pgx * TILE_SIZE, y: pgy * TILE_SIZE + 6, w: 32, h: 26, type: 'tree' });
    }
  }

  return trees;
}

export { isNearCliffEdge } from './terrain-rules';

export function generateChunkBuildings(
  cx: number,
  cy: number,
  seed: number,
  colliders: Collider[]
): BuildingEntity[] {
  const buildings = getVillageBuildingsForChunk(cx, cy, seed);
  const entities: BuildingEntity[] = [];

  const chunkStartGX = cx * CHUNK_SIZE;
  const chunkEndGX = chunkStartGX + CHUNK_SIZE;
  const chunkStartGY = cy * CHUNK_SIZE;
  const chunkEndGY = chunkStartGY + CHUNK_SIZE;

  for (const b of buildings) {
    entities.push({
      id: b.id,
      type: b.type,
      gx: b.gx,
      gy: b.gy,
      renderX: b.renderX,
      renderY: b.renderY,
      spriteWidth: b.spriteWidth,
      spriteHeight: b.spriteHeight,
      ySort: b.ySort,
      doorGX: b.doorGX,
      doorGY: b.doorGY,
      doorWidthTiles: b.doorWidthTiles ?? 1,
    });

    const doorWidth = b.doorWidthTiles ?? 1;

    // Add solid colliders for building footprint tiles belonging to this chunk
    for (let dy = 0; dy < b.heightTiles; dy++) {
      for (let dx = 0; dx < b.widthTiles; dx++) {
        const tx = b.gx + dx;
        const ty = b.gy + dy;

        // Leave door tile(s) open for smooth player approach (signposts have no door)
        if (
          b.type !== 'signpost' &&
          ty === b.doorGY &&
          tx >= b.doorGX &&
          tx < b.doorGX + doorWidth
        ) {
          continue;
        }

        if (tx >= chunkStartGX && tx < chunkEndGX && ty >= chunkStartGY && ty < chunkEndGY) {
          if (b.type === 'signpost') {
            colliders.push({
              x: tx * TILE_SIZE + 6,
              y: ty * TILE_SIZE + 10,
              w: 20,
              h: 18,
              type: 'building',
            });
          } else {
            colliders.push({
              x: tx * TILE_SIZE,
              y: ty * TILE_SIZE,
              w: TILE_SIZE,
              h: TILE_SIZE,
              type: 'building',
            });
          }
        }
      }
    }
  }

  return entities;
}

export function generateChunkFoliage(
  cx: number,
  cy: number,
  seed: number,
  terrainGrid: TerrainId[][],
  tileIdGrid: number[][],
  tallGrass: TallGrassEntity[],
  berryBushes: BerryBushEntity[],
  colliders: Collider[]
): PlantEntity[] {
  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const plants: PlantEntity[] = [];

  // 0. Curated Town Garden Landscaping
  const townGardenPlants = getVillageGardenPlantsForChunk(cx, cy, seed);
  for (const gp of townGardenPlants) {
    plants.push({
      gx: gp.gx,
      gy: gp.gy,
      x: gp.gx * TILE_SIZE,
      y: gp.gy * TILE_SIZE,
      type: gp.type,
      phase: Math.floor(seededHash(gp.gx, gp.gy, seed + 888) * 5),
    });
  }

  // 1. Lowland Meadow & Grassland Flora
  for (let qy = 0; qy < 2; qy++) {
    for (let qx = 0; qx < 2; qx++) {
      const roll = seededHash(cx * 2 + qx, cy * 2 + qy, seed + 505);
      if (roll < 0.85) {
        const lx = qx * 8 + Math.floor(seededHash(cx * 4 + qx, cy * 4 + qy, seed + 606) * 7);
        const ly = qy * 8 + Math.floor(seededHash(cx * 4 + qy, cy * 4 + qx, seed + 707) * 7);

        if (terrainGrid[ly]?.[lx] === TERRAIN.GRASS) {
          const gx = startGX + lx;
          const gy = startGY + ly;

          // STRICT: Prevent flowers/sprouts from spawning right at cliff base/rim, water edge, roads, or building footprints
          if (
            isNearCliffEdge(gx, gy, seed) ||
            isNearWater(gx, gy, seed, 1) ||
            isRoadTile(gx, gy, seed) ||
            isVillageBuildingTile(gx, gy, seed, 1) ||
            isBuildingRoofOrFootprint(gx, gy, seed, 1)
          ) {
            continue;
          }

          // STRICT: Cannot spawn on tall grass encounter tiles
          if (
            tileIdGrid[ly]?.[lx] === TILE_IDS.tall_grass ||
            tallGrass.some((tg) => tg.gx === gx && tg.gy === gy)
          ) {
            continue;
          }

          const px = gx * TILE_SIZE;
          const py = gy * TILE_SIZE;

          // STRICT: Cannot spawn on or under any berry bush (bush footprint covers gy and gy - 1)
          const overlapsBerry = berryBushes.some(
            (b) => b.gx === gx && (b.gy === gy || b.gy - 1 === gy)
          );
          if (overlapsBerry) {
            continue;
          }

          const blocked = colliders.some(
            (c) => px + 24 > c.x && px + 8 < c.x + c.w && py + 24 > c.y && py + 8 < c.y + c.h
          );
          if (blocked) {
            continue;
          }

          const alreadyHasPlant = plants.some((p) => p.gx === gx && p.gy === gy);
          if (alreadyHasPlant) {
            continue;
          }

          const sample = sampleEcology(gx, gy, seed);
          const zone = getEcologyZone(sample);
          const tileRoll = seededHash(gx, gy, seed + 808);
          const type = getFlowerTypeForCluster(zone, cx * 2 + qx, cy * 2 + qy, tileRoll, seed);
          const phase = Math.floor(seededHash(gx, gy, seed + 888) * 5);
          plants.push({ gx, gy, x: px, y: py, type, phase });
        }
      }
    }
  }

  // 2. Cliff & Hill Flora (Grass sprouts & Alpine wildflowers on flat interior cliff plateaus)
  for (let qy = 0; qy < 2; qy++) {
    for (let qx = 0; qx < 2; qx++) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const roll = seededHash(cx * 10 + qx * 2 + attempt, cy * 10 + qy * 2 + attempt, seed + 550);
        if (roll < 0.85) {
          const lx =
            qx * 8 +
            Math.floor(seededHash(cx * 8 + qx * 3 + attempt, cy * 8 + qy * 3, seed + 660) * 8);
          const ly =
            qy * 8 +
            Math.floor(seededHash(cx * 8 + qy * 3, cy * 8 + qx * 3 + attempt, seed + 770) * 8);

          if (terrainGrid[ly]?.[lx] === TERRAIN.HILL) {
            const gx = startGX + lx;
            const gy = startGY + ly;

            // STRICT: Must only spawn on the flat interior plateau, NEVER on the cliff edge/rim/wall!
            if (isNearCliffEdge(gx, gy, seed) || tileIdGrid[ly]?.[lx] !== TILE_IDS.cliff_pure) {
              continue;
            }

            // Cannot spawn on tall grass
            if (tallGrass.some((tg) => tg.gx === gx && tg.gy === gy)) {
              continue;
            }

            const px = gx * TILE_SIZE;
            const py = gy * TILE_SIZE;

            // Cannot spawn on or under any berry bush
            const overlapsBerry = berryBushes.some(
              (b) => b.gx === gx && (b.gy === gy || b.gy - 1 === gy)
            );
            if (overlapsBerry) {
              continue;
            }

            const blocked = colliders.some(
              (c) => px + 24 > c.x && px + 8 < c.x + c.w && py + 24 > c.y && py + 8 < c.y + c.h
            );
            const alreadyHasPlant = plants.some((p) => p.gx === gx && p.gy === gy);

            if (!blocked && !alreadyHasPlant) {
              const sample = sampleEcology(gx, gy, seed);
              const zone = getEcologyZone(sample);
              const tileRoll = seededHash(gx, gy, seed + 818);
              const type = getFlowerTypeForCluster(zone, cx * 2 + qx, cy * 2 + qy, tileRoll, seed);
              const phase = Math.floor(seededHash(gx, gy, seed + 899) * 5);
              plants.push({ gx, gy, x: px, y: py, type, phase });
            }
          }
        }
      }
    }
  }

  // 3. Natural Shrubs, Flowering Bushes & Conical Accent Flora (0-2 prominent plants per chunk)
  for (let attempt = 0; attempt < 2; attempt++) {
    const roll = seededHash(cx * 15 + attempt, cy * 15 + attempt, seed + 1205);
    if (roll < 0.7) {
      const lx =
        Math.floor(
          seededHash(cx * 17 + attempt, cy * 17 + attempt, seed + 1305) * (CHUNK_SIZE - 2)
        ) + 1;
      const ly =
        Math.floor(
          seededHash(cx * 19 + attempt, cy * 19 + attempt, seed + 1405) * (CHUNK_SIZE - 2)
        ) + 1;
      const gx = startGX + lx;
      const gy = startGY + ly;

      const isGrass = terrainGrid[ly]?.[lx] === TERRAIN.GRASS;
      const isHillFlat =
        terrainGrid[ly]?.[lx] === TERRAIN.HILL && tileIdGrid[ly]?.[lx] === TILE_IDS.cliff_pure;

      if (isGrass || isHillFlat) {
        if (
          isNearCliffEdge(gx, gy, seed) ||
          isNearWater(gx, gy, seed, 1) ||
          isRoadTile(gx, gy, seed) ||
          isVillageBuildingTile(gx, gy, seed, 1) ||
          isBuildingRoofOrFootprint(gx, gy, seed, 1) ||
          isVillageArea(gx, gy, seed, 0)
        ) {
          continue;
        }
        if (tallGrass.some((tg) => tg.gx === gx && tg.gy === gy)) continue;
        if (berryBushes.some((b) => Math.abs(b.gx - gx) <= 1 && Math.abs(b.gy - gy) <= 1)) continue;
        if (plants.some((p) => Math.abs(p.gx - gx) <= 1 && Math.abs(p.gy - gy) <= 1)) continue;

        const sample = sampleEcology(gx, gy, seed);
        const zone = getEcologyZone(sample);
        const shrubRoll = seededHash(gx, gy, seed + 1505);
        let type = getNaturalShrubForZone(zone, shrubRoll);

        const isLog = type === 'nature_fallen_log';
        if (isLog && lx + 1 >= CHUNK_SIZE) {
          type = 'nature_tree_stump';
        }

        const isWhiteBush = type === 'bush_flowering_white';
        const isStump = type === 'nature_tree_stump';
        const isLogNow = type === 'nature_fallen_log';

        let px = gx * TILE_SIZE;
        let py = gy * TILE_SIZE - 32;

        if (isWhiteBush) {
          px = gx * TILE_SIZE - 16;
          py = gy * TILE_SIZE - 32;
        } else if (isStump || isLogNow) {
          px = gx * TILE_SIZE;
          py = gy * TILE_SIZE;
        }

        // Check collision clearance with trees or other solids
        const checkW = isLogNow ? 60 : isWhiteBush ? 40 : 24;
        const blocked = colliders.some(
          (c) => px + checkW > c.x && px + 4 < c.x + c.w && py + 28 > c.y && py + 4 < c.y + c.h
        );
        if (blocked) continue;

        plants.push({ gx, gy, x: px, y: py, type, phase: attempt });

        // Add solid colliders / hitboxes
        if (isWhiteBush) {
          colliders.push({ x: px + 18, y: py + 40, w: 28, h: 20, type: 'tree' });
        } else if (type === 'bush_cone_autumn' || type === 'bush_cone_forest') {
          colliders.push({ x: px + 6, y: py + 44, w: 20, h: 18, type: 'tree' });
        } else if (isStump) {
          colliders.push({ x: px + 4, y: py + 8, w: 24, h: 22, type: 'tree' });
        } else if (isLogNow) {
          colliders.push({ x: px + 4, y: py + 8, w: 56, h: 22, type: 'tree' });
        }
      }
    }
  }

  return plants;
}

export interface WaterFloraEntity {
  gx: number;
  gy: number;
  x: number;
  y: number;
  type: string;
  phase: number;
}

/**
 * Checks if a tile is interior freshwater (at least 1 tile away from shorelines, river banks, and bridges).
 * Guarantees that water flora never clips into river bank cliffs or touches bridge structures.
 */
export function isInteriorFreshwater(gx: number, gy: number, seed: number): boolean {
  if (!isWaterTile(gx, gy, seed) || isOceanTile(gx, gy, seed) || isBridgeTile(gx, gy, seed)) {
    return false;
  }
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = gx + dx;
      const ny = gy + dy;
      if (!isWaterTile(nx, ny, seed)) return false;
      if (isOceanTile(nx, ny, seed)) return false;
      if (isBridgeTile(nx, ny, seed)) return false;
    }
  }
  return true;
}

/**
 * Helper to check if a tile is near a bridge structure.
 * Leaves a minimum 2-tile clearance buffer from bridges so flora never crowds around bridge piers.
 */
function isNearBridgeStructure(gx: number, gy: number, seed: number, radius = 2): boolean {
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      if (isBridgeTile(gx + dx, gy + dy, seed)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Generates freshwater lake and river surface ecosystem (Water lilies, floating lotus pads).
 * Strictly spawns only on interior river and lake water tiles with at least 1 tile buffer from shores and 2 tiles from bridges.
 * Employs a global Poisson-cell grid (4x4 tiles) to ensure natural, well-spaced placement with zero overcrowding.
 */
export function generateChunkWaterFlora(cx: number, cy: number, seed: number): WaterFloraEntity[] {
  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const waterFlora: WaterFloraEntity[] = [];

  // 1. Gather all candidate interior freshwater tiles strictly within this chunk,
  // excluding tiles too close to bridge structures (minimum 2-tile buffer)
  const candidates: { gx: number; gy: number }[] = [];
  for (let ly = 0; ly < CHUNK_SIZE; ly++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const gx = startGX + lx;
      const gy = startGY + ly;
      if (isInteriorFreshwater(gx, gy, seed) && !isNearBridgeStructure(gx, gy, seed, 2)) {
        candidates.push({ gx, gy });
      }
    }
  }

  if (candidates.length === 0) {
    return waterFlora;
  }

  // 2. Partition candidates into 4x4 spatial cells.
  // Each 4x4 cell can host at most ONE flora entity, preventing clumping and chaining.
  const cellMap = new Map<string, { gx: number; gy: number }[]>();
  for (const c of candidates) {
    const cellX = Math.floor(c.gx / 4);
    const cellY = Math.floor(c.gy / 4);
    const cellKey = `${cellX},${cellY}`;
    let list = cellMap.get(cellKey);
    if (!list) {
      list = [];
      cellMap.set(cellKey, list);
    }
    list.push(c);
  }

  const placed: { gx: number; gy: number }[] = [];

  // Sort cell keys deterministically
  const sortedCellKeys = Array.from(cellMap.keys()).sort();

  for (const cellKey of sortedCellKeys) {
    const [cellXStr, cellYStr] = cellKey.split(',');
    const cellX = parseInt(cellXStr, 10);
    const cellY = parseInt(cellYStr, 10);
    const cellCandidates = cellMap.get(cellKey)!;

    // 40% spawn rate per eligible 4x4 water cell (tasteful, serene distribution)
    const roll = seededHash(cellX, cellY, seed + 8001);
    if (roll < 0.4 && cellCandidates.length > 0) {
      // Pick candidate inside this cell
      const pickIdx = Math.floor(seededHash(cellX, cellY, seed + 8101) * cellCandidates.length);
      const chosen = cellCandidates[pickIdx];

      // Minimum distance check: ensure at least 2 tiles clearance from any other placed flora
      const tooClose = placed.some(
        (p) => Math.abs(p.gx - chosen.gx) < 2 && Math.abs(p.gy - chosen.gy) < 2
      );
      if (tooClose) continue;

      placed.push(chosen);

      // Determine flower type (40% plain green pad, 60% colorful blooming lotuses/lilies)
      const lilyRoll = seededHash(chosen.gx, chosen.gy, seed + 2301);
      let lilyType = 'water_lily_pad';
      if (lilyRoll > 0.4) {
        if (lilyRoll < 0.65) lilyType = 'water_lily_pink';
        else if (lilyRoll < 0.85) lilyType = 'water_lily_purple';
        else lilyType = 'water_lily_white';
      }

      const px = chosen.gx * TILE_SIZE;
      const py = chosen.gy * TILE_SIZE;
      const phase = seededHash(chosen.gx, chosen.gy, seed + 2401) * Math.PI * 2;
      waterFlora.push({
        gx: chosen.gx,
        gy: chosen.gy,
        x: px,
        y: py,
        type: lilyType,
        phase,
      });
    }
  }

  // 3. Guarantee at least 1 flora if chunk contains substantial water body (>= 4 interior tiles)
  // and no flora was rolled by chance
  if (waterFlora.length === 0 && candidates.length >= 4) {
    let bestCandidate = candidates[0];
    let bestScore = 1;
    for (const c of candidates) {
      const score = seededHash(c.gx, c.gy, seed + 8001);
      if (score < bestScore) {
        bestScore = score;
        bestCandidate = c;
      }
    }

    const lilyRoll = seededHash(bestCandidate.gx, bestCandidate.gy, seed + 2301);
    let lilyType = 'water_lily_pad';
    if (lilyRoll > 0.4) {
      if (lilyRoll < 0.65) lilyType = 'water_lily_pink';
      else if (lilyRoll < 0.85) lilyType = 'water_lily_purple';
      else lilyType = 'water_lily_white';
    }

    const px = bestCandidate.gx * TILE_SIZE;
    const py = bestCandidate.gy * TILE_SIZE;
    const phase = seededHash(bestCandidate.gx, bestCandidate.gy, seed + 2401) * Math.PI * 2;
    waterFlora.push({
      gx: bestCandidate.gx,
      gy: bestCandidate.gy,
      x: px,
      y: py,
      type: lilyType,
      phase,
    });
  }

  return waterFlora;
}

export function generateChunkTallGrass(
  cx: number,
  cy: number,
  seed: number,
  terrainGrid: TerrainId[][],
  tileIdGrid: number[][],
  colliders: Collider[]
): TallGrassEntity[] {
  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const tallGrass: TallGrassEntity[] = [];

  // Helper to validate and place a single tall grass tile
  const tryAddGrassTile = (lx: number, ly: number, isCliff = false): boolean => {
    if (lx < 1 || lx >= CHUNK_SIZE - 1 || ly < 1 || ly >= CHUNK_SIZE - 1) return false;
    const gx = startGX + lx;
    const gy = startGY + ly;

    if (tallGrass.some((tg) => tg.gx === gx && tg.gy === gy)) return false;

    if (isCliff) {
      if (terrainGrid[ly]?.[lx] !== TERRAIN.HILL || tileIdGrid[ly]?.[lx] !== TILE_IDS.cliff_pure) {
        return false;
      }
      if (isNearCliffEdge(gx, gy, seed)) return false;
    } else {
      if (terrainGrid[ly]?.[lx] !== TERRAIN.GRASS) return false;
      if (
        isNearCliffEdge(gx, gy, seed) ||
        isNearWater(gx, gy, seed, 1) ||
        isVillageArea(gx, gy, seed)
      )
        return false;
      if (isRoadTile(gx, gy, seed) || isSandTile(gx, gy, seed)) return false;
    }

    const px = gx * TILE_SIZE;
    const py = gy * TILE_SIZE;

    const isCollider = colliders.some(
      (c) => px + 24 > c.x && px + 8 < c.x + c.w && py + 24 > c.y && py + 8 < c.y + c.h
    );
    if (isCollider) return false;

    tallGrass.push({
      gx,
      gy,
      x: px,
      y: py,
      phase: seededHash(gx, gy, 777) * Math.PI * 2,
    });

    if (!isCliff) {
      tileIdGrid[ly][lx] = TILE_IDS.tall_grass;
    }
    return true;
  };

  // 1. Lowland Meadow Tall Grass: Density-modulated organic patches per Section 8.1
  const centerGX = startGX + 8;
  const centerGY = startGY + 8;
  const chunkEcology = sampleEcology(centerGX, centerGY, seed);
  const tallGrassDensity = calculateTallGrassDensity(chunkEcology);

  const qRoll = seededHash(cx, cy, seed + 909);
  const effectiveDensity = tallGrassDensity * 0.7 + qRoll * 0.3;
  let numPatches = 0;
  if (effectiveDensity < 0.25) {
    numPatches = 0;
  } else if (effectiveDensity < 0.55) {
    numPatches = 1;
  } else if (effectiveDensity < 0.8) {
    numPatches = 2;
  } else {
    numPatches = 3;
  }

  for (let p = 0; p < numPatches; p++) {
    const pSeed = seed + 1010 + p * 137;
    const ax = 2 + Math.floor(seededHash(cx * 7 + p, cy * 7 + p, pSeed + 1) * 11);
    const ay = 2 + Math.floor(seededHash(cx * 11 + p, cy * 11 + p, pSeed + 2) * 11);
    const pw = 3 + Math.floor(seededHash(cx * 13 + p, cy * 13 + p, pSeed + 3) * 5); // 3..7
    const ph = 2 + Math.floor(seededHash(cx * 17 + p, cy * 17 + p, pSeed + 4) * 4); // 2..5
    const style = Math.floor(seededHash(cx * 19 + p, cy * 19 + p, pSeed + 5) * 4);

    const rx = Math.max(1.0, pw / 2.0);
    const ry = Math.max(1.0, ph / 2.0);
    const minLX = Math.max(1, ax - Math.ceil(rx));
    const maxLX = Math.min(CHUNK_SIZE - 2, ax + Math.ceil(rx));
    const minLY = Math.max(1, ay - Math.ceil(ry));
    const maxLY = Math.min(CHUNK_SIZE - 2, ay + Math.ceil(ry));

    for (let ly = minLY; ly <= maxLY; ly++) {
      for (let lx = minLX; lx <= maxLX; lx++) {
        const gx = startGX + lx;
        const gy = startGY + ly;

        let include = false;
        if (style === 0) {
          // Style 0: Organic Blob with boundary noise modulation
          const d = Math.pow((lx - ax) / rx, 2) + Math.pow((ly - ay) / ry, 2);
          const noise = (seededHash(gx, gy, pSeed + 9) - 0.5) * 0.6;
          include = d <= 1.0 + noise;
        } else if (style === 1) {
          // Style 1: Stepped GBA Route Field (irregular stepped corners)
          const isEdge = lx === minLX || lx === maxLX || ly === minLY || ly === maxLY;
          const isCorner = (lx === minLX || lx === maxLX) && (ly === minLY || ly === maxLY);
          if (isCorner) {
            include = seededHash(gx, gy, pSeed + 11) < 0.25;
          } else if (isEdge) {
            include = seededHash(gx, gy, pSeed + 11) < 0.75;
          } else {
            include = true;
          }
        } else if (style === 2) {
          // Style 2: Elongated Trailside Strip
          if (pw >= ph) {
            include = Math.abs(ly - ay) <= 1;
          } else {
            include = Math.abs(lx - ax) <= 1;
          }
        } else {
          // Style 3: Irregular L-Shaped / Stepped Elbow Meadow
          const inH = lx >= minLX && lx <= maxLX && ly >= ay && ly <= maxLY;
          const inV = lx >= minLX && lx <= ax && ly >= minLY && ly <= maxLY;
          include = (inH || inV) && seededHash(gx, gy, pSeed + 13) < 0.85;
        }

        if (include) {
          tryAddGrassTile(lx, ly, false);
        }
      }
    }
  }

  // 2. Cliff & Mountain Plateau Tall Grass Patches (Alpine wild grass on flat cliff plateau)
  const hasHills = terrainGrid.some((row) => row.includes(TERRAIN.HILL));
  if (hasHills) {
    const cliffGrassRoll = seededHash(cx, cy, seed + 1414);
    if (cliffGrassRoll < 0.75) {
      const plateauCandidates: Array<{ lx: number; ly: number; gx: number; gy: number }> = [];
      for (let ly = 1; ly < CHUNK_SIZE - 1; ly++) {
        for (let lx = 1; lx < CHUNK_SIZE - 1; lx++) {
          if (
            terrainGrid[ly]?.[lx] === TERRAIN.HILL &&
            tileIdGrid[ly]?.[lx] === TILE_IDS.cliff_pure
          ) {
            const gx = startGX + lx;
            const gy = startGY + ly;
            if (!isNearCliffEdge(gx, gy, seed)) {
              plateauCandidates.push({ lx, ly, gx, gy });
            }
          }
        }
      }

      if (plateauCandidates.length >= 4) {
        const numAlpinePatches = cliffGrassRoll < 0.35 ? 2 : 1;
        for (let ap = 0; ap < numAlpinePatches; ap++) {
          const cIdx = Math.floor(
            seededHash(cx * 9 + ap, cy * 9 + ap, seed + 1515 + ap * 43) * plateauCandidates.length
          );
          const center = plateauCandidates[cIdx];
          const rx = 1.5 + seededHash(cx * 3 + ap, cy * 3 + ap, seed + 1616) * 1.5;
          const ry = 1.2 + seededHash(cx * 5 + ap, cy * 5 + ap, seed + 1717) * 1.5;

          const minLY = Math.max(1, center.ly - Math.ceil(ry));
          const maxLY = Math.min(CHUNK_SIZE - 2, center.ly + Math.ceil(ry));
          const minLX = Math.max(1, center.lx - Math.ceil(rx));
          const maxLX = Math.min(CHUNK_SIZE - 2, center.lx + Math.ceil(rx));

          for (let ly = minLY; ly <= maxLY; ly++) {
            for (let lx = minLX; lx <= maxLX; lx++) {
              const d = Math.pow((lx - center.lx) / rx, 2) + Math.pow((ly - center.ly) / ry, 2);
              const noise = (seededHash(startGX + lx, startGY + ly, seed + 1818) - 0.5) * 0.5;
              if (d <= 1.0 + noise) {
                tryAddGrassTile(lx, ly, true);
              }
            }
          }
        }
      }
    }
  }

  return tallGrass;
}

export function generateChunkBerryBushes(
  cx: number,
  cy: number,
  seed: number,
  terrainGrid: TerrainId[][],
  tileIdGrid: number[][],
  tallGrass: TallGrassEntity[],
  trees: TreeEntity[],
  colliders: Collider[]
): BerryBushEntity[] {
  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const berryBushes: BerryBushEntity[] = [];

  // Collect all trees in current chunk AND 8 neighboring chunks
  const allNearbyTrees: Array<{ x: number; y: number }> = [...trees];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nTrees = getChunkTreeLocations(cx + dx, cy + dy, seed);
      allNearbyTrees.push(...nTrees);
    }
  }

  const quotaRoll = seededHash(cx, cy, seed + 999);
  const quota = quotaRoll >= 0.9 ? 3 : quotaRoll >= 0.5 ? 2 : 1;

  const quadOrder = [0, 1, 2, 3];
  for (let i = quadOrder.length - 1; i > 0; i--) {
    const j = Math.floor(seededHash(cx * 10 + i, cy * 10 + i, seed + 888) * (i + 1));
    const tmp = quadOrder[i];
    quadOrder[i] = quadOrder[j];
    quadOrder[j] = tmp;
  }

  let spawned = 0;
  for (let qi = 0; qi < 4 && spawned < quota; qi++) {
    const q = quadOrder[qi];
    const qlx = (q % 2) * 8;
    const qly = Math.floor(q / 2) * 8;

    let placedInQuad = false;
    for (let attempt = 0; attempt < 4 && !placedInQuad; attempt++) {
      const ox =
        1 + Math.floor(seededHash(cx * 8 + q * 4 + attempt, cy * 8 + q * 4, seed + 234) * 6);
      const oy =
        2 + Math.floor(seededHash(cx * 8 + q * 4, cy * 8 + q * 4 + attempt, seed + 345) * 5);
      const bLX = qlx + ox;
      const bLY = qly + oy;

      if (
        terrainGrid[bLY]?.[bLX] === TERRAIN.GRASS &&
        terrainGrid[bLY - 1]?.[bLX] === TERRAIN.GRASS
      ) {
        const bgx = startGX + bLX;
        const bgy = startGY + bLY;

        if (
          isRoadTile(bgx, bgy, seed) ||
          isSandTile(bgx, bgy, seed) ||
          isHillTile(bgx, bgy, seed) ||
          isNearWater(bgx, bgy, seed, 1) ||
          isVillageArea(bgx, bgy, seed) ||
          isRoadTile(bgx, bgy - 1, seed) ||
          isSandTile(bgx, bgy - 1, seed) ||
          isHillTile(bgx, bgy - 1, seed) ||
          isNearWater(bgx, bgy - 1, seed, 1) ||
          isVillageArea(bgx, bgy - 1, seed)
        ) {
          continue;
        }

        // STRICT: Berry bush must NEVER spawn near cliff edges (1-tile safety margin)
        let nearCliff = false;
        for (let dy = -2; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (isHillTile(bgx + dx, bgy + dy, seed)) {
              nearCliff = true;
              break;
            }
          }
          if (nearCliff) break;
        }
        if (nearCliff) continue;

        // STRICT: Berry bush cannot overlap tall grass (neither base nor canopy tile)
        if (
          tileIdGrid[bLY]?.[bLX] === TILE_IDS.tall_grass ||
          tileIdGrid[bLY - 1]?.[bLX] === TILE_IDS.tall_grass ||
          tallGrass.some((tg) => tg.gx === bgx && (tg.gy === bgy || tg.gy === bgy - 1))
        ) {
          continue;
        }

        const bpx = bgx * TILE_SIZE;
        const bpy = bgy * TILE_SIZE - 32;

        let collidesWithTree = false;
        for (const t of allNearbyTrees) {
          if (isBerryOverlappingTree(bpx, bpy, t.x, t.y)) {
            collidesWithTree = true;
            break;
          }
        }
        if (collidesWithTree) continue;

        const collidesWithBerry = berryBushes.some(
          (other) => Math.abs(bpx - other.x) < 48 && Math.abs(bpy - other.y) < 64
        );
        if (collidesWithBerry) continue;

        const collidesWithCollider = colliders.some(
          (c) => bpx + 30 > c.x && bpx + 2 < c.x + c.w && bpy + 62 > c.y && bpy + 10 < c.y + c.h
        );
        if (collidesWithCollider) continue;

        const sample = sampleEcology(bgx, bgy, seed);
        const zone = getEcologyZone(sample);
        const roll = seededHash(bgx, bgy, seed + 123);
        const berry = pickBerryForEcology(zone, roll);
        const timeOffsetSec = seededHash(bgx, bgy, seed + 888) * 60;
        const phase = seededHash(bgx, bgy, 777) * 4;

        const bush: BerryBushEntity = {
          gx: bgx,
          gy: bgy,
          x: bpx,
          y: bpy,
          type: berry.id,
          name: berry.name,
          viName: berry.viName,
          color: berry.color,
          desc: berry.desc,
          stage: 0,
          plantedAt: Date.now() - timeOffsetSec * 1000,
          phase,
        };

        berryBushes.push(bush);
        colliders.push({
          x: bpx + 6,
          y: bgy * TILE_SIZE + 10,
          w: 20,
          h: 18,
          type: 'berry',
          isBerry: true,
          berryRef: bush,
        });

        spawned++;
        placedInQuad = true;
      }
    }
  }

  return berryBushes;
}
