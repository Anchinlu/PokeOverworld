import { describe, it, expect } from 'vitest';
import { TERRAIN, TILE_IDS, CHUNK_SIZE } from '@pokemon/game-data';
import {
  BEACH_WIDTH,
  getCoastBoundary,
  getOceanBoundary,
  isSandTile,
  isOceanTile,
  getOceanTileId,
} from '../src/maps/terrain-rules';
import { generateChunkTerrain } from '../src/maps/chunk-terrain';
import { ChunkManager } from '../src/maps/chunk-manager';

describe('Ocean & Beach System', () => {
  const seed = 12345;

  it('maintains a 5-tile sandy beach buffer before the ocean shoreline', () => {
    expect(BEACH_WIDTH).toBe(5);

    for (let gy = -20; gy <= 20; gy++) {
      const coast = getCoastBoundary(gy, seed);
      const ocean = getOceanBoundary(gy, seed);
      expect(ocean).toBe(coast + 5);

      // Grassland before coast
      expect(isSandTile(coast - 1, gy, seed)).toBe(false);
      expect(isOceanTile(coast - 1, gy, seed)).toBe(false);

      // Exactly 5 sand tiles
      for (let i = 0; i < 5; i++) {
        expect(isSandTile(coast + i, gy, seed)).toBe(true);
        expect(isOceanTile(coast + i, gy, seed)).toBe(false);
      }

      // Shoreline & deep ocean at and beyond coast + 5
      expect(isSandTile(coast + 5, gy, seed)).toBe(false);
      expect(isOceanTile(coast + 5, gy, seed)).toBe(true);
      expect(isOceanTile(coast + 10, gy, seed)).toBe(true);
    }
  });

  it('assigns shoreline crashing wave tiles at the coast edge and deep ocean beyond', () => {
    for (let gy = 0; gy < 16; gy++) {
      const oceanX = getOceanBoundary(gy, seed);

      // At shoreline edge (gx === oceanX): crashing wave animation tile (731..735)
      const shoreTileId = getOceanTileId(oceanX, gy, seed);
      expect(shoreTileId).toBeGreaterThanOrEqual(731);
      expect(shoreTileId).toBeLessThanOrEqual(735);

      // Beyond shoreline (gx > oceanX): open ocean caustic surface (730)
      const deepOceanTileId = getOceanTileId(oceanX + 1, gy, seed);
      expect(deepOceanTileId).toBe(TILE_IDS.ocean_water);
    }
  });

  it('generates correct terrain IDs and pure sand without grass fringes facing the ocean', () => {
    // Generate chunk where beach and ocean meet (typically cx around 1 or 2)
    const gySample = 8;
    const coast = getCoastBoundary(gySample, seed);
    const cx = Math.floor(coast / CHUNK_SIZE);
    const cy = 0;

    const chunk = generateChunkTerrain(cx, cy, seed);
    const startGX = cx * CHUNK_SIZE;

    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      const gy = ly;
      const c = getCoastBoundary(gy, seed);
      const o = getOceanBoundary(gy, seed);

      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const gx = startGX + lx;
        const terrain = chunk.terrainGrid[ly][lx];
        const tileId = chunk.tileIdGrid[ly][lx];

        if (gx >= c && gx < o) {
          expect(terrain).toBe(TERRAIN.BEACH_SAND);
          // Sand right at the ocean's edge (gx === o - 1) should be pure sand, never sand_right (which has green grass)
          if (gx === o - 1) {
            expect(tileId).toBe(TILE_IDS.sand_pure);
          }
        } else if (gx >= o) {
          expect(terrain).toBe(TERRAIN.OCEAN_WATER);
          if (gx === o) {
            expect(tileId).toBeGreaterThanOrEqual(731);
            expect(tileId).toBeLessThanOrEqual(735);
          } else {
            expect(tileId).toBe(TILE_IDS.ocean_water);
          }
        }
      }
    }
  });

  it('enforces collision: beach sand is walkable, ocean water and shoreline block the player', () => {
    const chunkManager = new ChunkManager(seed);

    for (let gy = 0; gy < 16; gy++) {
      const coast = getCoastBoundary(gy, seed);
      const ocean = getOceanBoundary(gy, seed);

      // Walkable on sand (e.g. at coast + 2)
      const isSandWalkable = chunkManager.isWalkable(coast + 2, gy);
      expect(isSandWalkable).toBe(true);

      // Impassable at shoreline wave tile (ocean) and deep ocean
      const isShoreWalkable = chunkManager.isWalkable(ocean, gy);
      expect(isShoreWalkable).toBe(false);

      const isDeepOceanWalkable = chunkManager.isWalkable(ocean + 3, gy);
      expect(isDeepOceanWalkable).toBe(false);
    }
  });
});
