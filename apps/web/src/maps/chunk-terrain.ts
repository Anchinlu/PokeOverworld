import type { TerrainId } from '@pokemon/shared-types';
import { CHUNK_SIZE, TERRAIN, TILE_IDS } from '@pokemon/game-data';
import { isSandTile, isRoadTile, isHillTile, isBridgeTile, isWaterTile } from './terrain-rules';
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
  seed: number,
  hasRoad = true,
  hasBeach = true,
  hasHills = true,
  hasWater = true
): ChunkTerrainResult {
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

      if (isHillTile(gx, gy, seed, hasHills, hasRoad, hasBeach)) {
        terrain = TERRAIN.HILL;
        tileId = getCliffTileKey(gx, gy, seed, hasHills, hasRoad, hasBeach).tileId;
      } else if (isSandTile(gx, gy, seed, hasBeach)) {
        terrain = TERRAIN.BEACH_SAND;
        tileId = getSandTileKey(gx, gy, seed, hasBeach).tileId;
      } else if (isBridgeTile(gx, gy, seed, hasRoad)) {
        terrain = TERRAIN.ROAD;
        tileId = TILE_IDS.bridge_wood_v;
      } else if (isRoadTile(gx, gy, seed, hasRoad, hasBeach)) {
        terrain = TERRAIN.ROAD;
        tileId = getRoadTileKey(gx, gy, seed, hasRoad, hasBeach).tileId;
      } else if (isWaterTile(gx, gy, seed, hasWater, hasRoad, hasBeach, hasHills)) {
        terrain = TERRAIN.OCEAN_WATER;
        tileId = getWaterTileKey(gx, gy, seed, hasWater, hasRoad, hasBeach, hasHills).tileId;
      }

      rowTerrain.push(terrain);
      rowTileId.push(tileId);
    }

    terrainGrid.push(rowTerrain);
    tileIdGrid.push(rowTileId);
  }

  return { terrainGrid, tileIdGrid };
}
