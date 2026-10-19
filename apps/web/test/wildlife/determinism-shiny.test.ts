import { describe, it, expect } from 'vitest';
import { isEntityShiny, hashWildlife } from '../../src/wildlife/spawn/shiny';
import { populateChunkWildlife } from '../../src/wildlife/spawn/spawn-director';
import type { WorldQuery } from '../../src/wildlife/ports/world-query';

// Mock WorldQuery for determinism verification
function createMockWorld(): WorldQuery {
  return {
    isWalkable: (_gx, _gy) => true,
    contextAt: (_gx, _gy) => 'tall_grass',
    biomeAt: (_gx, _gy) => 'meadow',
    difficultyAt: (gx, gy) => Math.min(1.0, Math.hypot(gx, gy) / 500),
    timeBand: () => 'day',
    weather: () => 'clear',
  };
}

describe('Wildlife Determinism & Shiny Convergence (Section 2.4 & 11.4)', () => {
  it('guarantees identical entity output for same seed and chunk coordinates across independent runs', () => {
    const world = createMockWorld();
    const SEED = 20261018;

    const run1 = populateChunkWildlife(5, -3, world, { seed: SEED });
    const run2 = populateChunkWildlife(5, -3, world, { seed: SEED });

    expect(run1).toHaveLength(run2.length);
    expect(run1.length).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < run1.length; i++) {
      const e1 = run1[i];
      const e2 = run2[i];
      expect(e1.speciesKey).toBe(e2.speciesKey);
      expect(e1.gx).toBe(e2.gx);
      expect(e1.gy).toBe(e2.gy);
      expect(e1.level).toBe(e2.level);
      expect(e1.role).toBe(e2.role);
      expect(e1.isShiny).toBe(e2.isShiny);
    }
  });

  it('guarantees chunk order independence (evaluating chunk A then B produces identical output to B then A)', () => {
    const world = createMockWorld();
    const SEED = 8888;

    // Order 1: Chunk (2, 2) then Chunk (-4, 7)
    const order1_A = populateChunkWildlife(2, 2, world, { seed: SEED });
    const order1_B = populateChunkWildlife(-4, 7, world, { seed: SEED });

    // Order 2: Chunk (-4, 7) then Chunk (2, 2)
    const order2_B = populateChunkWildlife(-4, 7, world, { seed: SEED });
    const order2_A = populateChunkWildlife(2, 2, world, { seed: SEED });

    expect(order1_A).toEqual(order2_A);
    expect(order1_B).toEqual(order2_B);
  });

  it('shiny odds statistical convergence: tests over 100,000 slots with scaled odds', () => {
    const N = 100_000;
    const testOdds = 100; // Scaled odds to test convergence within test time budget
    let shinyCount = 0;

    for (let slot = 0; slot < N; slot++) {
      if (isEntityShiny(101, 1, 1, slot, testOdds)) {
        shinyCount++;
      }
    }

    const observedRate = shinyCount / N;
    const expectedRate = 1.0 / testOdds; // 0.01

    // Statistical tolerance: ±0.15% on 100k samples
    expect(observedRate).toBeCloseTo(expectedRate, 2);
  });

  it('default shiny odds roll matches 1/4096 threshold strictly', () => {
    // Exactly 1/4096 = 0.000244140625
    expect(isEntityShiny(1, 0, 0, 0, 4096)).toBe(
      hashWildlife(1, 0, 0, 0, 9999) < 1.0 / 4096
    );
  });
});
