import { describe, it, expect } from 'vitest';
import { TERRAIN, TILE_IDS } from '@pokemon/game-data';
import {
  ChunkManager,
  isBerryOverlappingTree,
  isTreeOverlappingTree,
  isNearCliffEdge,
} from '../src/maps';

describe('Tree and Berry Bush Overlap Prevention', () => {
  it('ensures no berry bush ever overlaps any big tree canopy or trunk across chunks', () => {
    const seeds = [101, 202, 9999, 45678];

    for (const seed of seeds) {
      const manager = new ChunkManager(seed);
      // Spawn 5x5 chunks = 25 chunks
      manager.update(0, 0);

      const allTrees = manager.activeChunks.flatMap((c) => c.trees);
      const allBerries = manager.activeChunks.flatMap((c) => c.berryBushes);

      expect(allTrees.length).toBeGreaterThan(0);
      expect(allBerries.length).toBeGreaterThan(0);

      // Verify no berry overlaps any tree
      for (const berry of allBerries) {
        for (const tree of allTrees) {
          const overlaps = isBerryOverlappingTree(berry.x, berry.y, tree.x, tree.y);
          expect(overlaps).toBe(false);
        }
      }
    }
  });

  it('ensures no two big trees overlap each other within or across chunks', () => {
    const seeds = [101, 777, 12345];

    for (const seed of seeds) {
      const manager = new ChunkManager(seed);
      manager.update(0, 0);

      const allTrees = manager.activeChunks.flatMap((c) => c.trees);

      for (let i = 0; i < allTrees.length; i++) {
        for (let j = i + 1; j < allTrees.length; j++) {
          const t1 = allTrees[i];
          const t2 = allTrees[j];
          const tooClose = isTreeOverlappingTree(t1.x, t1.y, t2.x, t2.y);
          expect(tooClose).toBe(false);
        }
      }
    }
  });

  it('ensures no two berry bushes overlap each other within or across chunks', () => {
    const seeds = [101, 777, 12345];

    for (const seed of seeds) {
      const manager = new ChunkManager(seed);
      manager.update(0, 0);

      const allBerries = manager.activeChunks.flatMap((c) => c.berryBushes);

      for (let i = 0; i < allBerries.length; i++) {
        for (let j = i + 1; j < allBerries.length; j++) {
          const b1 = allBerries[i];
          const b2 = allBerries[j];
          const dx = Math.abs(b1.x - b2.x);
          const dy = Math.abs(b1.y - b2.y);
          const tooClose = dx < 32 && dy < 48;
          expect(tooClose).toBe(false);
        }
      }
    }
  });

  it('ensures cliff plateaus spawn flora and tall grass strictly away from cliff edges', () => {
    const seeds = [101, 777, 45678];

    for (const seed of seeds) {
      const manager = new ChunkManager(seed);
      manager.update(0, 0);

      const hillChunks = manager.activeChunks.filter((c) =>
        c.terrainGrid.some((row) => row.includes(TERRAIN.HILL))
      );
      expect(hillChunks.length).toBeGreaterThan(0);

      let totalCliffPlants = 0;
      let totalCliffTallGrass = 0;

      for (const chunk of hillChunks) {
        // Verify plants on cliff
        for (const plant of chunk.plants) {
          const lx = ((plant.gx % 16) + 16) % 16;
          const ly = ((plant.gy % 16) + 16) % 16;
          if (chunk.terrainGrid[ly]?.[lx] === TERRAIN.HILL) {
            totalCliffPlants++;
            // Must strictly be on pure plateau, NEVER on an edge/rim
            expect(chunk.tileIdGrid[ly]?.[lx]).toBe(TILE_IDS.cliff_pure);
            expect(isNearCliffEdge(plant.gx, plant.gy, seed)).toBe(false);
          }
        }

        // Verify tall grass on cliff
        for (const tg of chunk.tallGrass) {
          const lx = ((tg.gx % 16) + 16) % 16;
          const ly = ((tg.gy % 16) + 16) % 16;
          if (chunk.terrainGrid[ly]?.[lx] === TERRAIN.HILL) {
            totalCliffTallGrass++;
            expect(chunk.tileIdGrid[ly]?.[lx]).toBe(TILE_IDS.cliff_pure);
            expect(isNearCliffEdge(tg.gx, tg.gy, seed)).toBe(false);
          }
        }

        // Verify berry bushes are never near cliff edges
        for (const berry of chunk.berryBushes) {
          expect(isNearCliffEdge(berry.gx, berry.gy, seed)).toBe(false);
          expect(isNearCliffEdge(berry.gx, berry.gy - 1, seed)).toBe(false);
        }
      }

      expect(totalCliffPlants).toBeGreaterThan(0);
      expect(totalCliffTallGrass).toBeGreaterThan(0);
    }
  });

  it('ensures no berry bush ever overlaps tall grass or flowers', () => {
    const seeds = [101, 777, 12345, 99999];

    for (const seed of seeds) {
      const manager = new ChunkManager(seed);
      manager.update(0, 0);

      for (const chunk of manager.activeChunks) {
        for (const berry of chunk.berryBushes) {
          const blx = ((berry.gx % 16) + 16) % 16;
          const bly = ((berry.gy % 16) + 16) % 16;

          // Neither base tile nor canopy tile can be tall grass
          expect(chunk.tileIdGrid[bly]?.[blx]).not.toBe(610);
          expect(chunk.tileIdGrid[bly - 1]?.[blx]).not.toBe(610);

          // No tall grass entity on berry tiles
          const tgOnBerry = chunk.tallGrass.some(
            (tg) => tg.gx === berry.gx && (tg.gy === berry.gy || tg.gy === berry.gy - 1)
          );
          expect(tgOnBerry).toBe(false);

          // No flower or sprout entity on berry tiles
          const plantOnBerry = chunk.plants.some(
            (p) => p.gx === berry.gx && (p.gy === berry.gy || p.gy === berry.gy - 1)
          );
          expect(plantOnBerry).toBe(false);
        }
      }
    }
  });

  it('ensures no flower or plant sprout ever overlaps tall grass encounter tiles', () => {
    const seeds = [101, 777, 12345, 99999];

    for (const seed of seeds) {
      const manager = new ChunkManager(seed);
      manager.update(0, 0);

      for (const chunk of manager.activeChunks) {
        for (const plant of chunk.plants) {
          const lx = ((plant.gx % 16) + 16) % 16;
          const ly = ((plant.gy % 16) + 16) % 16;

          // Tile cannot be tall grass
          expect(chunk.tileIdGrid[ly]?.[lx]).not.toBe(610);

          // No tall grass entity on this tile
          const tgOnPlant = chunk.tallGrass.some((tg) => tg.gx === plant.gx && tg.gy === plant.gy);
          expect(tgOnPlant).toBe(false);
        }
      }
    }
  });

  it('ensures all plants/flowers in a chunk have unique tile positions', () => {
    const seeds = [101, 777, 12345, 99999];

    for (const seed of seeds) {
      const manager = new ChunkManager(seed);
      manager.update(0, 0);

      for (const chunk of manager.activeChunks) {
        const seenTiles = new Set<string>();
        for (const plant of chunk.plants) {
          const key = `${plant.gx},${plant.gy}`;
          expect(seenTiles.has(key)).toBe(false);
          seenTiles.add(key);
        }
      }
    }
  });
});
