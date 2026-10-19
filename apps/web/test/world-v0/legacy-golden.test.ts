import { describe, it, expect } from 'vitest';
import { WorldChunk } from '../../src/maps/chunk';

/**
 * Golden hash for the legacy strip world (worldGenVersion = 1).
 * S1 of WORLD_GEN_V0_DEV_GUIDE: refactoring terrain access behind TerrainField
 * must not change a single generated value for the legacy world.
 */
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function hashChunk(chunk: WorldChunk): string {
  const normalizedBerryBushes = chunk.berryBushes.map(({ plantedAt: _plantedAt, ...rest }) => rest);
  const normalizedWildPokemon = chunk.wildPokemon.map(
    ({ lastMoveTime: _lastMoveTime, peckStartTime: _peckStartTime, ...rest }) => rest
  );
  const normalizedColliders = chunk.colliders.map((c) => {
    if (c.berryRef) {
      const { plantedAt: _plantedAt, ...restRef } = c.berryRef;
      return { ...c, berryRef: restRef };
    }
    return c;
  });

  return fnv1a(
    JSON.stringify([
      chunk.terrainGrid,
      chunk.tileIdGrid,
      chunk.trees,
      chunk.buildings,
      chunk.plants,
      chunk.tallGrass,
      normalizedBerryBushes,
      normalizedWildPokemon,
      chunk.waterFlora,
      normalizedColliders,
    ])
  );
}

export function hashWorld(seed: number, radius: number): string {
  const parts: string[] = [];
  for (let cy = -radius; cy < radius; cy++) {
    for (let cx = -radius; cx < radius; cx++) {
      parts.push(hashChunk(new WorldChunk(cx, cy, seed)));
    }
  }
  return fnv1a(parts.join(','));
}

const GOLDEN_SEED_101 = '867984b3';

describe('legacy world golden hash (S1)', () => {
  it('generates identical content for 400 chunks at seed 101', () => {
    const run1 = hashWorld(101, 10);
    expect(run1).toBe(GOLDEN_SEED_101);
  }, 30000);
});
