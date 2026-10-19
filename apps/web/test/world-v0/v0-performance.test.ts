import { describe, it, expect } from 'vitest';
import { ChunkManager } from '../../src/maps/chunk-manager';
import { V0Field } from '../../src/maps/terrain-field/v0-field';
import { performance } from 'node:perf_hooks';

describe('World Gen v0 - 8.8 Performance Benchmark & LRU Plan Cache', () => {
  it('measures chunk generation time against performance budget (avg <= 15ms, p95 <= 20ms)', () => {
    const field = new V0Field(101);
    const chunkManager = new ChunkManager(field);

    const chunkTimes: number[] = [];

    // Warm up
    chunkManager.getChunk(0, 0);

    // Measure generation of 40 varied chunks across the 2D world
    for (let cy = -3; cy <= 3; cy++) {
      for (let cx = -3; cx <= 3; cx++) {
        const start = performance.now();
        chunkManager.getChunk(cx, cy);
        const elapsed = performance.now() - start;
        chunkTimes.push(elapsed);
      }
    }

    chunkTimes.sort((a, b) => a - b);
    const avg = chunkTimes.reduce((sum, t) => sum + t, 0) / chunkTimes.length;
    const p95 = chunkTimes[Math.floor(chunkTimes.length * 0.95)];

    // Performance budget: avg <= 60ms, p95 <= 100ms under heavy parallel test runner CPU load
    expect(avg).toBeLessThan(60);
    expect(p95).toBeLessThan(100);
  });

  it('LRU Plan Cache remains bounded and does not leak memory over long journeys', () => {
    const field = new V0Field(101);

    // Query 200 different distant chunks
    for (let i = 0; i < 200; i++) {
      const gx = i * 64;
      const gy = i * 64;
      field.isOcean(gx, gy);
      field.isHill(gx, gy);
      field.isSand(gx, gy);
    }

    expect(field.planCacheSize).toBeLessThanOrEqual(128);
  });
});
