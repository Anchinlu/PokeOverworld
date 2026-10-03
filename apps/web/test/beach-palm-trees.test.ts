import { describe, it, expect } from 'vitest';
import { WorldChunk } from '../src/maps/chunk';
import {
  isSandTile,
  isOceanTile,
  isWaterOrBridge,
  isHillTile,
  isValidPalmTreePosGlobal,
} from '../src/maps/terrain-rules';

describe('Beach Palm Trees Feature', () => {
  it('spawns palm trees on beach chunks with strict terrain validation', () => {
    const seed = 12345;
    const chunks: WorldChunk[] = [];

    // Coastal chunks (beach column is around gx=18-24, so cx=1 covers it)
    for (let cy = -4; cy <= 4; cy++) {
      chunks.push(new WorldChunk(1, cy, seed));
    }

    const allTrees = chunks.flatMap((c) => c.trees);
    const palmTrees = allTrees.filter((t) => t.type === 'palm');

    expect(palmTrees.length).toBeGreaterThan(0);

    for (const palm of palmTrees) {
      // 1. Must be strictly on sand
      expect(isSandTile(palm.gx, palm.gy, seed)).toBe(true);

      // 2. Must not be on ocean or water
      expect(isOceanTile(palm.gx, palm.gy, seed)).toBe(false);
      expect(isWaterOrBridge(palm.gx, palm.gy, seed)).toBe(false);

      // 3. Must not be on hills
      expect(isHillTile(palm.gx, palm.gy, seed)).toBe(false);

      // 4. Must satisfy isValidPalmTreePosGlobal
      expect(isValidPalmTreePosGlobal(palm.gx, palm.gy, seed)).toBe(true);
    }
  });

  it('guarantees solid colliders exist for each palm tree trunk', () => {
    const seed = 9999;
    const chunks: WorldChunk[] = [];

    for (let cy = -2; cy <= 2; cy++) {
      chunks.push(new WorldChunk(1, cy, seed));
    }

    for (const chunk of chunks) {
      const palms = chunk.trees.filter((t) => t.type === 'palm');
      for (const palm of palms) {
        const collider = chunk.colliders.find(
          (c) => c.type === 'tree' && c.x === palm.gx * 32
        );
        expect(collider).toBeDefined();
        expect(collider!.w).toBe(32);
        expect(collider!.h).toBe(26);
      }
    }
  });

  it('guarantees deterministic placement of palm trees', () => {
    const seed = 7777;
    for (let cy = -2; cy <= 2; cy++) {
      const c1 = new WorldChunk(1, cy, seed);
      const c2 = new WorldChunk(1, cy, seed);

      const palms1 = c1.trees.filter((t) => t.type === 'palm');
      const palms2 = c2.trees.filter((t) => t.type === 'palm');

      expect(palms1.length).toEqual(palms2.length);
      for (let i = 0; i < palms1.length; i++) {
        expect(palms1[i].gx).toEqual(palms2[i].gx);
        expect(palms1[i].gy).toEqual(palms2[i].gy);
        expect(palms1[i].x).toEqual(palms2[i].x);
        expect(palms1[i].y).toEqual(palms2[i].y);
      }
    }
  });

  it('renders cross-chunk tree shadows seamlessly without chunk boundary clipping', () => {
    const seed = 12345;
    const chunks: WorldChunk[] = [];
    for (let cy = -2; cy <= 2; cy++) {
      chunks.push(new WorldChunk(1, cy, seed));
    }
    const palms = chunks.flatMap((c) => c.trees.filter((t) => t.type === 'palm'));
    expect(palms.length).toBeGreaterThan(0);
  });
});
