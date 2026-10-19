import { describe, expect, it } from 'vitest';
import { ChunkManager } from '../src/maps/chunk-manager';

describe('Progressive chunk loading', () => {
  it('loads the critical neighborhood first and queues the outer ring', () => {
    const manager = new ChunkManager(101);

    manager.update(0, 0, { progressive: true });

    expect(manager.activeChunks).toHaveLength(9);
    expect(manager.getPendingChunkCount()).toBe(16);
  });

  it('fills one queued chunk per update without losing the center chunk', () => {
    const manager = new ChunkManager(101);

    manager.update(0, 0, { progressive: true });
    manager.update(0, 0, { progressive: true });

    expect(manager.activeChunks).toHaveLength(10);
    expect(manager.activeChunks.some((chunk) => chunk.cx === 0 && chunk.cy === 0)).toBe(true);
    expect(manager.getPendingChunkCount()).toBe(15);
  });

  it('keeps the new critical neighborhood available after crossing a chunk boundary', () => {
    const manager = new ChunkManager(101);

    manager.update(0, 0, { progressive: true });
    manager.update(16 * 32, 0, { progressive: true });

    expect(manager.activeChunks.some((chunk) => chunk.cx === 1 && chunk.cy === 0)).toBe(true);
    expect(manager.activeChunks.some((chunk) => chunk.cx === 2 && chunk.cy === 0)).toBe(true);
    expect(manager.activeChunks.some((chunk) => chunk.cx === 0 && chunk.cy === 0)).toBe(true);
  });
});
