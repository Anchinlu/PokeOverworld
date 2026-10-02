import { describe, it, expect } from 'vitest';
import { WorldChunk } from '../src/maps/chunk';

describe('WorldChunk Deterministic Generation', () => {
  it('generates identical terrain and tile grids for the same coordinates and seed', () => {
    const chunkA = new WorldChunk(2, 3, 101);
    const chunkB = new WorldChunk(2, 3, 101);

    expect(chunkA.terrainGrid).toEqual(chunkB.terrainGrid);
    expect(chunkA.tileIdGrid).toEqual(chunkB.tileIdGrid);
    expect(chunkA.trees).toEqual(chunkB.trees);
    expect(chunkA.plants).toEqual(chunkB.plants);
    expect(chunkA.tallGrass).toEqual(chunkB.tallGrass);
  });

  it('generates different layouts for different seeds', () => {
    const chunkA = new WorldChunk(0, 0, 101);
    const chunkB = new WorldChunk(0, 0, 9999);

    // Tree placement or plants should vary with different seeds
    const treesMatch = JSON.stringify(chunkA.trees) === JSON.stringify(chunkB.trees);
    const plantsMatch = JSON.stringify(chunkA.plants) === JSON.stringify(chunkB.plants);

    expect(treesMatch && plantsMatch).toBe(false);
  });
});
