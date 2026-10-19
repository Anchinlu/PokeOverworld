import type { Collider, TerrainId } from '@pokemon/shared-types';
import { CHUNK_SIZE, TILE_SIZE, TERRAIN, TILE_IDS } from '@pokemon/game-data';
import { seededHash } from './noise';
import {
  createTerrainField,
  type TerrainField,
  getV0VillageBuildingsForChunk,
  getV0VillageGardenPlantsForChunk,
} from './terrain-field';
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
} from './ecology';
import { isTallGrassTile } from './ecology/tall-grass-field';
import { getForestTreeCandidates } from './ecology/tree-field';

function toField(seedOrField: number | TerrainField = 101): TerrainField {
  return typeof seedOrField === 'number' ? createTerrainField(1, seedOrField) : seedOrField;
}

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
  heightScale: number;
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
  seedOrField: number | TerrainField = 101
): Array<{ x: number; y: number }> {
  const field = toField(seedOrField);
  const seed = field.seed;
  const key = `${cx},${cy},${seed},${field.version}`;
  const cached = chunkTreeLocsCache.get(key);
  if (cached) return cached;

  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const list: Array<{ x: number; y: number }> = [];

  for (const candidate of getForestTreeCandidates(cx, cy, field)) {
    const overlaps = list.some((tree) =>
      isTreeOverlappingTree(candidate.x, candidate.y, tree.x, tree.y)
    );
    if (!overlaps) {
      list.push({ x: candidate.x, y: candidate.y });
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

    if (field.isValidPalmTreePos(pgx, pgy)) {
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
  seedOrField: number | TerrainField = 101,
  colliders: Collider[] = []
): TreeEntity[] {
  const field = toField(seedOrField);
  const seed = field.seed;
  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const trees: TreeEntity[] = [];

  // 1. Inland Forest, Meadow & Mountain Trees
  for (const candidate of getForestTreeCandidates(cx, cy, field)) {
    const { gx, gy, x: tx, y: ty } = candidate;
    // Prevent overlap with already placed trees in THIS chunk
    const overlapsInChunk = trees.some((t) => isTreeOverlappingTree(tx, ty, t.x, t.y));
    if (overlapsInChunk) continue;

    // Prevent overlap with trees in neighbor chunks
    let overlapsNeighbor = false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (dy > 0 || (dy === 0 && dx > 0)) continue;
        const nTrees = getChunkTreeLocations(cx + dx, cy + dy, field);
        if (nTrees.some((nt) => isTreeOverlappingTree(tx, ty, nt.x, nt.y))) {
          overlapsNeighbor = true;
          break;
        }
      }
      if (overlapsNeighbor) break;
    }
    if (overlapsNeighbor) continue;

    const isDesert = Boolean(field.isDesert && field.isDesert(gx, gy));
    const isDark = Boolean(field.isDarkLand && field.isDarkLand(gx, gy));
    if (isDesert) {
      const roll = seededHash(gx, gy, seed + 919);
      if (roll < 0.35) {
        trees.push({ gx, gy, x: tx, y: ty + 56, type: 'dead_1' });
        colliders.push({ x: tx + 16, y: ty + 88, w: 32, h: 24, type: 'tree' });
      } else if (roll < 0.65) {
        trees.push({ gx, gy, x: tx, y: ty + 56, type: 'dead_2' });
        colliders.push({ x: tx + 16, y: ty + 88, w: 32, h: 24, type: 'tree' });
      } else if (roll < 0.85) {
        trees.push({ gx, gy, x: tx, y: ty + 24, type: 'cactus_large' });
        colliders.push({ x: tx + 16, y: ty + 84, w: 32, h: 24, type: 'tree' });
      } else {
        trees.push({ gx, gy, x: tx, y: ty + 56, type: 'desert_boulder' });
        colliders.push({ x: tx + 8, y: ty + 84, w: 48, h: 26, type: 'tree' });
      }
    } else if (isDark) {
      const roll = seededHash(gx, gy, seed + 919);
      if (roll < 0.30) {
        trees.push({ gx, gy, x: tx - 32, y: ty, type: 'dark_large_1' });
        colliders.push({ x: tx, y: ty + 88, w: 64, h: 26, type: 'tree' });
      } else if (roll < 0.55) {
        trees.push({ gx, gy, x: tx - 32, y: ty, type: 'dark_large_2' });
        colliders.push({ x: tx, y: ty + 88, w: 64, h: 26, type: 'tree' });
      } else if (roll < 0.75) {
        trees.push({ gx, gy, x: tx - 32, y: ty, type: 'dark_dead' });
        colliders.push({ x: tx, y: ty + 88, w: 64, h: 26, type: 'tree' });
      } else {
        trees.push({ gx, gy, x: tx - 16, y: ty + 24, type: 'dark_forest' });
        colliders.push({ x: tx, y: ty + 84, w: 32, h: 24, type: 'tree' });
      }
    } else {
      const sample = sampleEcology(gx, gy, field);
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

    if (field.isValidPalmTreePos(pgx, pgy)) {
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
          const nTrees = getChunkTreeLocations(cx + dx, cy + dy, field);
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

export function generateChunkBuildings(
  cx: number,
  cy: number,
  seedOrField: number | TerrainField = 101,
  colliders: Collider[]
): BuildingEntity[] {
  const field = toField(seedOrField);
  const buildings =
    field.version >= 2
      ? getV0VillageBuildingsForChunk(cx, cy, field)
      : getVillageBuildingsForChunk(cx, cy, field.seed);
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

  // 2. Procedural Landmarks in Dark Land (Graveyard & Gothic Ruins)
  if (entities.length === 0 && field.isDarkLand) {
    const isDark = field.isDarkLand;
    const centerGX = chunkStartGX + 8;
    const centerGY = chunkStartGY + 8;
    if (
      isDark(centerGX, centerGY) &&
      !field.isOcean(centerGX, centerGY) &&
      !field.isHill(centerGX, centerGY) &&
      !field.isRoad(centerGX, centerGY)
    ) {
      const landmarkRoll = seededHash(cx, cy, field.seed + 6606);
      if (landmarkRoll < 0.35) {
        if (landmarkRoll < 0.18) {
          // 1. Ancient Graveyard
          const anchorGX = chunkStartGX + 3;
          const anchorGY = chunkStartGY + 4;
          entities.push({
            id: `graveyard_fence_${cx}_${cy}`,
            type: 'fence_cemetery',
            gx: anchorGX,
            gy: anchorGY,
            renderX: anchorGX * TILE_SIZE,
            renderY: anchorGY * TILE_SIZE,
            spriteWidth: 96,
            spriteHeight: 96,
            ySort: anchorGY * TILE_SIZE + 84,
            doorGX: anchorGX + 1,
            doorGY: anchorGY + 2,
          });
          colliders.push({ x: anchorGX * TILE_SIZE, y: anchorGY * TILE_SIZE, w: 96, h: 20, type: 'building' });
          colliders.push({ x: anchorGX * TILE_SIZE, y: anchorGY * TILE_SIZE, w: 16, h: 96, type: 'building' });
          colliders.push({ x: (anchorGX + 2) * TILE_SIZE + 16, y: anchorGY * TILE_SIZE, w: 16, h: 96, type: 'building' });
          colliders.push({ x: anchorGX * TILE_SIZE, y: (anchorGY + 2) * TILE_SIZE + 12, w: 32, h: 20, type: 'building' });
          colliders.push({ x: (anchorGX + 2) * TILE_SIZE, y: (anchorGY + 2) * TILE_SIZE + 12, w: 32, h: 20, type: 'building' });

          const scGX = anchorGX + 7;
          const scGY = anchorGY + 1;
          entities.push({
            id: `graveyard_sc_${cx}_${cy}`,
            type: 'scarecrow_dark',
            gx: scGX,
            gy: scGY,
            renderX: scGX * TILE_SIZE,
            renderY: scGY * TILE_SIZE,
            spriteWidth: 96,
            spriteHeight: 96,
            ySort: scGY * TILE_SIZE + 80,
            doorGX: scGX,
            doorGY: scGY,
          });
          colliders.push({ x: scGX * TILE_SIZE + 36, y: scGY * TILE_SIZE + 64, w: 24, h: 20, type: 'building' });

          const t1GX = anchorGX + 1;
          const t1GY = anchorGY + 1;
          entities.push({
            id: `tombstone_1_${cx}_${cy}`,
            type: 'tombstone_1',
            gx: t1GX,
            gy: t1GY,
            renderX: t1GX * TILE_SIZE,
            renderY: t1GY * TILE_SIZE,
            spriteWidth: 32,
            spriteHeight: 64,
            ySort: t1GY * TILE_SIZE + 56,
            doorGX: t1GX,
            doorGY: t1GY,
          });
          colliders.push({ x: t1GX * TILE_SIZE + 4, y: t1GY * TILE_SIZE + 36, w: 24, h: 20, type: 'building' });

          const t2GX = anchorGX + 4;
          const t2GY = anchorGY + 5;
          entities.push({
            id: `tombstone_2_${cx}_${cy}`,
            type: 'tombstone_2',
            gx: t2GX,
            gy: t2GY,
            renderX: t2GX * TILE_SIZE,
            renderY: t2GY * TILE_SIZE,
            spriteWidth: 32,
            spriteHeight: 64,
            ySort: t2GY * TILE_SIZE + 56,
            doorGX: t2GX,
            doorGY: t2GY,
          });
          colliders.push({ x: t2GX * TILE_SIZE + 4, y: t2GY * TILE_SIZE + 36, w: 24, h: 20, type: 'building' });

          const t3GX = anchorGX + 7;
          const t3GY = anchorGY + 6;
          entities.push({
            id: `tombstone_3_${cx}_${cy}`,
            type: 'tombstone_1',
            gx: t3GX,
            gy: t3GY,
            renderX: t3GX * TILE_SIZE,
            renderY: t3GY * TILE_SIZE,
            spriteWidth: 32,
            spriteHeight: 64,
            ySort: t3GY * TILE_SIZE + 56,
            doorGX: t3GX,
            doorGY: t3GY,
          });
          colliders.push({ x: t3GX * TILE_SIZE + 4, y: t3GY * TILE_SIZE + 36, w: 24, h: 20, type: 'building' });
        } else {
          // 2. Ruined Gothic Shrine
          const shrineGX = chunkStartGX + 5;
          const shrineGY = chunkStartGY + 2;
          entities.push({
            id: `ruin_temple_${cx}_${cy}`,
            type: 'ruin_temple',
            gx: shrineGX,
            gy: shrineGY,
            renderX: shrineGX * TILE_SIZE,
            renderY: shrineGY * TILE_SIZE,
            spriteWidth: 128,
            spriteHeight: 128,
            ySort: shrineGY * TILE_SIZE + 116,
            doorGX: shrineGX + 1,
            doorGY: shrineGY + 3,
            doorWidthTiles: 2,
          });
          colliders.push({ x: shrineGX * TILE_SIZE + 8, y: shrineGY * TILE_SIZE + 64, w: 112, h: 56, type: 'building' });

          const archGX = shrineGX;
          const archGY = shrineGY + 5;
          entities.push({
            id: `ruin_archway_${cx}_${cy}`,
            type: 'ruin_archway',
            gx: archGX,
            gy: archGY,
            renderX: archGX * TILE_SIZE + 16,
            renderY: archGY * TILE_SIZE,
            spriteWidth: 96,
            spriteHeight: 96,
            ySort: archGY * TILE_SIZE + 84,
            doorGX: archGX + 1,
            doorGY: archGY + 2,
          });
          colliders.push({ x: archGX * TILE_SIZE + 16, y: archGY * TILE_SIZE + 48, w: 24, h: 36, type: 'building' });
          colliders.push({ x: archGX * TILE_SIZE + 88, y: archGY * TILE_SIZE + 48, w: 24, h: 36, type: 'building' });

          const pil1GX = shrineGX - 3;
          const pil1GY = shrineGY + 3;
          entities.push({
            id: `ruin_pillar_1_${cx}_${cy}`,
            type: 'ruin_pillar_tall',
            gx: pil1GX,
            gy: pil1GY,
            renderX: pil1GX * TILE_SIZE,
            renderY: pil1GY * TILE_SIZE,
            spriteWidth: 32,
            spriteHeight: 128,
            ySort: pil1GY * TILE_SIZE + 120,
            doorGX: pil1GX,
            doorGY: pil1GY,
          });
          colliders.push({ x: pil1GX * TILE_SIZE + 4, y: pil1GY * TILE_SIZE + 96, w: 24, h: 24, type: 'building' });

          const pil2GX = shrineGX + 6;
          const pil2GY = shrineGY + 4;
          entities.push({
            id: `ruin_pillar_2_${cx}_${cy}`,
            type: 'ruin_pillar_broken',
            gx: pil2GX,
            gy: pil2GY,
            renderX: pil2GX * TILE_SIZE,
            renderY: pil2GY * TILE_SIZE,
            spriteWidth: 32,
            spriteHeight: 96,
            ySort: pil2GY * TILE_SIZE + 88,
            doorGX: pil2GX,
            doorGY: pil2GY,
          });
          colliders.push({ x: pil2GX * TILE_SIZE + 4, y: pil2GY * TILE_SIZE + 68, w: 24, h: 20, type: 'building' });

          const wallGX = shrineGX - 3;
          const wallGY = shrineGY + 8;
          entities.push({
            id: `ruin_wall_${cx}_${cy}`,
            type: 'ruin_wall_large',
            gx: wallGX,
            gy: wallGY,
            renderX: wallGX * TILE_SIZE,
            renderY: wallGY * TILE_SIZE,
            spriteWidth: 96,
            spriteHeight: 128,
            ySort: wallGY * TILE_SIZE + 120,
            doorGX: wallGX,
            doorGY: wallGY,
          });
          colliders.push({ x: wallGX * TILE_SIZE + 8, y: wallGY * TILE_SIZE + 92, w: 80, h: 28, type: 'building' });
        }
      }
    }
  }

  return entities;
}

export function generateChunkFoliage(
  cx: number,
  cy: number,
  seedOrField: number | TerrainField = 101,
  terrainGrid: TerrainId[][],
  tileIdGrid: number[][],
  tallGrass: TallGrassEntity[],
  berryBushes: BerryBushEntity[],
  colliders: Collider[]
): PlantEntity[] {
  const field = toField(seedOrField);
  const seed = field.seed;
  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const plants: PlantEntity[] = [];

  // 0. Curated Town Garden Landscaping
  const townGardenPlants =
    field.version >= 2
      ? getV0VillageGardenPlantsForChunk(cx, cy, field)
      : getVillageGardenPlantsForChunk(cx, cy, seed);
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
            field.isNearCliffEdge(gx, gy) ||
            field.isNearWater(gx, gy, 1) ||
            field.isRoad(gx, gy) ||
            isVillageBuildingTile(gx, gy, field, 1) ||
            isBuildingRoofOrFootprint(gx, gy, field, 1)
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

          const sample = sampleEcology(gx, gy, field);
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
            // Wildflowers only spawn on non-desert grassy cliff plateaus
            const isDesertHill = Boolean(field.isDesert && field.isDesert(gx, gy));
            if (isDesertHill || field.isNearCliffEdge(gx, gy) || tileIdGrid[ly]?.[lx] !== TILE_IDS.cliff_pure) {
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
              const sample = sampleEcology(gx, gy, field);
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
        terrainGrid[ly]?.[lx] === TERRAIN.HILL &&
        (tileIdGrid[ly]?.[lx] === TILE_IDS.cliff_pure ||
          tileIdGrid[ly]?.[lx] === TILE_IDS.dune_cliff_pure ||
          tileIdGrid[ly]?.[lx] === TILE_IDS.dark_cliff_pure);
      const isDesert =
        terrainGrid[ly]?.[lx] === TERRAIN.DESERT ||
        (terrainGrid[ly]?.[lx] === TERRAIN.HILL && Boolean(field.isDesert && field.isDesert(gx, gy)));
      const isDark =
        terrainGrid[ly]?.[lx] === TERRAIN.DARK_LAND ||
        (terrainGrid[ly]?.[lx] === TERRAIN.HILL && Boolean(field.isDarkLand && field.isDarkLand(gx, gy)));

      if (isGrass || isHillFlat || isDesert || isDark) {
        if (
          field.isNearCliffEdge(gx, gy) ||
          field.isNearWater(gx, gy, 1) ||
          field.isRoad(gx, gy) ||
          isVillageBuildingTile(gx, gy, field, 1) ||
          isBuildingRoofOrFootprint(gx, gy, field, 1) ||
          isVillageArea(gx, gy, field, 0)
        ) {
          continue;
        }
        if (tallGrass.some((tg) => tg.gx === gx && tg.gy === gy)) continue;
        if (berryBushes.some((b) => Math.abs(b.gx - gx) <= 1 && Math.abs(b.gy - gy) <= 1)) continue;
        if (plants.some((p) => Math.abs(p.gx - gx) <= 1 && Math.abs(p.gy - gy) <= 1)) continue;

        let type: string;
        if (isDesert) {
          const desertShrubRoll = seededHash(gx, gy, seed + 1505);
          if (desertShrubRoll < 0.3) {
            type = 'desert_dry_bush';
          } else if (desertShrubRoll < 0.6) {
            type = 'desert_succulent';
          } else if (desertShrubRoll < 0.8) {
            type = 'cactus_medium';
          } else {
            type = 'cactus_small';
          }
        } else if (isDark) {
          const darkShrubRoll = seededHash(gx, gy, seed + 1505);
          if (darkShrubRoll < 0.45) {
            const bIdx = Math.floor(seededHash(gx, gy, seed + 1507) * 6) + 1;
            type = `bush_dark_${bIdx}`;
          } else if (darkShrubRoll < 0.75) {
            const sIdx = Math.floor(seededHash(gx, gy, seed + 1509) * 3) + 1;
            type = `dark_sprout_${sIdx}`;
          } else {
            type = 'rock_dark_spires';
          }
        } else {
          const sample = sampleEcology(gx, gy, field);
          const zone = getEcologyZone(sample);
          const shrubRoll = seededHash(gx, gy, seed + 1505);
          type = getNaturalShrubForZone(zone, shrubRoll);
        }

        const isLog = type === 'nature_fallen_log';
        if (isLog && lx + 1 >= CHUNK_SIZE) {
          type = 'nature_tree_stump';
        }

        const isWhiteBush = type === 'bush_flowering_white';
        const isStump = type === 'nature_tree_stump';
        const isLogNow = type === 'nature_fallen_log';
        const isCactusSmall = type === 'cactus_small';
        const isRockSpires = type === 'rock_dark_spires';
        const isDarkBush = type.startsWith('bush_dark_');
        const isDarkSprout = type.startsWith('dark_sprout_');

        let px = gx * TILE_SIZE;
        let py = gy * TILE_SIZE - 32;

        if (isWhiteBush || isRockSpires) {
          px = gx * TILE_SIZE - 16;
          py = gy * TILE_SIZE - 32;
        } else if (isStump || isLogNow || isCactusSmall || isDarkSprout) {
          px = gx * TILE_SIZE;
          py = gy * TILE_SIZE;
        } else if (isDarkBush) {
          px = gx * TILE_SIZE;
          py = gy * TILE_SIZE - 32;
        }

        // Check collision clearance with trees or other solids
        const checkW = isLogNow ? 60 : isWhiteBush || isRockSpires ? 40 : 24;
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
        } else if (isCactusSmall) {
          colliders.push({ x: px + 6, y: py + 8, w: 20, h: 20, type: 'tree' });
        } else if (type === 'cactus_medium') {
          colliders.push({ x: px + 6, y: py + 40, w: 20, h: 20, type: 'tree' });
        } else if (type === 'desert_dry_bush' || type === 'desert_succulent') {
          colliders.push({ x: px + 4, y: py + 40, w: 24, h: 18, type: 'tree' });
        } else if (isRockSpires) {
          colliders.push({ x: px + 12, y: py + 48, w: 40, h: 20, type: 'tree' });
        } else if (isDarkBush) {
          colliders.push({ x: px + 4, y: py + 36, w: 24, h: 20, type: 'tree' });
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
export function isInteriorFreshwater(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101
): boolean {
  const field = toField(seedOrField);
  if (!field.isWater(gx, gy) || field.isOcean(gx, gy) || field.isBridge(gx, gy)) {
    return false;
  }
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = gx + dx;
      const ny = gy + dy;
      if (!field.isWater(nx, ny)) return false;
      if (field.isOcean(nx, ny)) return false;
      if (field.isBridge(nx, ny)) return false;
    }
  }
  return true;
}

/**
 * Helper to check if a tile is near a bridge structure.
 * Leaves a minimum 2-tile clearance buffer from bridges so flora never crowds around bridge piers.
 */
function isNearBridgeStructure(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  radius = 2
): boolean {
  const field = toField(seedOrField);
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      if (field.isBridge(gx + dx, gy + dy)) {
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
export function generateChunkWaterFlora(
  cx: number,
  cy: number,
  seedOrField: number | TerrainField = 101
): WaterFloraEntity[] {
  const field = toField(seedOrField);
  const seed = field.seed;
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
      if (isInteriorFreshwater(gx, gy, field) && !isNearBridgeStructure(gx, gy, field, 2)) {
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
  seedOrField: number | TerrainField = 101,
  terrainGrid: TerrainId[][],
  tileIdGrid: number[][],
  colliders: Collider[]
): TallGrassEntity[] {
  const field = toField(seedOrField);
  const seed = field.seed;
  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const tallGrass: TallGrassEntity[] = [];

  // Helper to validate and place a single tall grass tile
  const tryAddGrassTile = (lx: number, ly: number, isCliff = false): boolean => {
    // Border tiles are valid world tiles. The previous one-tile exclusion was
    // the direct cause of a visible empty seam between adjacent chunks.
    if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_SIZE) return false;
    const gx = startGX + lx;
    const gy = startGY + ly;

    if (tallGrass.some((tg) => tg.gx === gx && tg.gy === gy)) return false;

    if (isCliff) {
      if (terrainGrid[ly]?.[lx] !== TERRAIN.HILL || tileIdGrid[ly]?.[lx] !== TILE_IDS.cliff_pure) {
        return false;
      }
      if (field.isNearCliffEdge(gx, gy)) return false;
    } else {
      if (terrainGrid[ly]?.[lx] !== TERRAIN.GRASS) return false;
      if (
        field.isNearCliffEdge(gx, gy) ||
        field.isNearWater(gx, gy, 1) ||
        isVillageArea(gx, gy, field)
      )
        return false;
      if (field.isRoad(gx, gy) || field.isSand(gx, gy)) return false;
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
      heightScale: 0.98 + seededHash(gx, gy, 778) * 0.22,
    });

    if (!isCliff) {
      tileIdGrid[ly][lx] = TILE_IDS.tall_grass;
    }
    return true;
  };

  // 1. Lowland Meadow Tall Grass: evaluate one global field for every tile.
  // This is intentionally not chunk-local: a patch can continue through any
  // of the four chunk boundaries without a special stitching pass.
  for (let ly = 0; ly < CHUNK_SIZE; ly++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const gx = startGX + lx;
      const gy = startGY + ly;
      if (isTallGrassTile(gx, gy, field)) {
        tryAddGrassTile(lx, ly, false);
      }
    }
  }

  // 2. Cliff & Mountain Plateau Tall Grass Patches (Alpine wild grass on flat cliff plateau)
  const hasHills = terrainGrid.some((row) => row.includes(TERRAIN.HILL));
  if (hasHills) {
    const cliffGrassRoll = seededHash(cx, cy, seed + 1414);
    if (cliffGrassRoll < 0.75) {
      const plateauCandidates: Array<{ lx: number; ly: number; gx: number; gy: number }> = [];
      for (let ly = 0; ly < CHUNK_SIZE; ly++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          if (
            terrainGrid[ly]?.[lx] === TERRAIN.HILL &&
            tileIdGrid[ly]?.[lx] === TILE_IDS.cliff_pure
          ) {
            const gx = startGX + lx;
            const gy = startGY + ly;
            if (!field.isNearCliffEdge(gx, gy)) {
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

          const minLY = Math.max(0, center.ly - Math.ceil(ry));
          const maxLY = Math.min(CHUNK_SIZE - 1, center.ly + Math.ceil(ry));
          const minLX = Math.max(0, center.lx - Math.ceil(rx));
          const maxLX = Math.min(CHUNK_SIZE - 1, center.lx + Math.ceil(rx));

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
  seedOrField: number | TerrainField = 101,
  terrainGrid: TerrainId[][],
  tileIdGrid: number[][],
  tallGrass: TallGrassEntity[],
  trees: TreeEntity[],
  colliders: Collider[]
): BerryBushEntity[] {
  const field = toField(seedOrField);
  const seed = field.seed;
  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;
  const berryBushes: BerryBushEntity[] = [];

  // Collect all trees in current chunk AND 8 neighboring chunks
  const allNearbyTrees: Array<{ x: number; y: number }> = [...trees];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nTrees = getChunkTreeLocations(cx + dx, cy + dy, field);
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
          field.isRoad(bgx, bgy) ||
          field.isSand(bgx, bgy) ||
          field.isHill(bgx, bgy) ||
          field.isNearWater(bgx, bgy, 1) ||
          isVillageArea(bgx, bgy, field) ||
          field.isRoad(bgx, bgy - 1) ||
          field.isSand(bgx, bgy - 1) ||
          field.isHill(bgx, bgy - 1) ||
          field.isNearWater(bgx, bgy - 1, 1) ||
          isVillageArea(bgx, bgy - 1, field)
        ) {
          continue;
        }

        // STRICT: Berry bush must NEVER spawn near cliff edges (1-tile safety margin)
        let nearCliff = false;
        for (let dy = -2; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (field.isHill(bgx + dx, bgy + dy)) {
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
