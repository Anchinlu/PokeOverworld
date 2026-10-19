import type { TerrainId } from '@pokemon/shared-types';
import { CHUNK_SIZE, TERRAIN, TILE_IDS } from '@pokemon/game-data';
import { createTerrainField, type TerrainField } from './terrain-field';
import {
  getSandTileKey,
  getRoadTileKey,
  getCliffTileKey,
  getWaterTileKey,
  getGrassTileId,
} from './autotile';

export interface ChunkTerrainResult {
  terrainGrid: TerrainId[][];
  tileIdGrid: number[][];
}

export function generateChunkTerrain(
  cx: number,
  cy: number,
  seedOrField: number | TerrainField = 101,
  hasRoad = true,
  hasBeach = true,
  hasHills = true,
  hasWater = true
): ChunkTerrainResult {
  const field =
    typeof seedOrField === 'number'
      ? createTerrainField(1, seedOrField)
      : seedOrField;
  const seed = field.seed;
  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;

  const terrainGrid: TerrainId[][] = [];
  const tileIdGrid: number[][] = [];

  for (let ly = 0; ly < CHUNK_SIZE; ly++) {
    const rowTerrain: TerrainId[] = [];
    const rowTileId: number[] = [];
    const gy = startGY + ly;

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const gx = startGX + lx;

      let terrain: TerrainId = TERRAIN.GRASS;
      let tileId = getGrassTileId(gx, gy, seed);

      if (field.isHill(gx, gy, hasHills, hasRoad, hasBeach)) {
        terrain = TERRAIN.HILL;
        tileId = getCliffTileKey(gx, gy, field, hasHills, hasRoad, hasBeach).tileId;
      } else if (field.isSand(gx, gy, hasBeach)) {
        terrain = TERRAIN.BEACH_SAND;
        tileId = getSandTileKey(gx, gy, field, hasBeach).tileId;
      } else if (field.isOcean(gx, gy, hasBeach)) {
        terrain = TERRAIN.OCEAN_WATER;
        tileId = field.getOceanTileId(gx, gy, hasBeach);
      } else if (field.isBridge(gx, gy, hasRoad)) {
        terrain = TERRAIN.ROAD;
        tileId = TILE_IDS.bridge_wood_v;
      } else if (field.isRoad(gx, gy, hasRoad, hasBeach)) {
        terrain = TERRAIN.ROAD;
        tileId = getRoadTileKey(gx, gy, field, hasRoad, hasBeach).tileId;
      } else if (field.isWater(gx, gy, hasWater, hasRoad, hasBeach, hasHills)) {
        terrain = TERRAIN.OCEAN_WATER;
        tileId = getWaterTileKey(gx, gy, field, hasWater, hasRoad, hasBeach, hasHills).tileId;
      }

      rowTerrain.push(terrain);
      rowTileId.push(tileId);
    }

    terrainGrid.push(rowTerrain);
    tileIdGrid.push(rowTileId);
  }

  return { terrainGrid, tileIdGrid };
}
