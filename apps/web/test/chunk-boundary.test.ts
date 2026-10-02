import { describe, it, expect } from 'vitest';
import { ChunkManager } from '../src/maps/chunk-manager';
import { CHUNK_SIZE } from '@pokemon/game-data';

describe('Chunk Boundary and Spatial Querying', () => {
  it('correctly queries across chunk boundaries', () => {
    const manager = new ChunkManager(101);
    manager.update(0, 0);

    // Query tile at chunk boundary (local x = 15 of chunk 0 vs local x = 0 of chunk 1)
    const tileLeft = manager.getTileData(CHUNK_SIZE - 1, 0);
    const tileRight = manager.getTileData(CHUNK_SIZE, 0);

    expect(tileLeft.cx).toBe(0);
    expect(tileLeft.lx).toBe(15);

    expect(tileRight.cx).toBe(1);
    expect(tileRight.lx).toBe(0);
  });

  it('evicts distant chunks beyond the active radius via LRU cache', () => {
    const manager = new ChunkManager(101);
    // Center at (0, 0)
    manager.update(0, 0);
    const initialCount = manager.activeChunks.length;
    expect(initialCount).toBeGreaterThan(0);

    // Teleport far away to (1000, 1000)
    manager.update(1000 * 32, 1000 * 32);
    expect(manager.activeChunks.some((c) => c.cx === 0 && c.cy === 0)).toBe(false);
  });
});
