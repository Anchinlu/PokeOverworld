import { describe, it, expect } from 'vitest';
import { V0Field } from '../../src/maps/terrain-field/v0-field';

describe('World Gen v0 - 8.4 Seed Diversity & Invariant I4 (200 Seeds)', () => {
  it('I4: seed difference is not modulo 1000; seed 101 and seed 1101 produce distinct terrain', () => {
    const field1 = new V0Field(101);
    const field2 = new V0Field(1101);

    let diffCount = 0;
    const totalSample = 100;
    for (let i = 0; i < totalSample; i++) {
      const gx = 400 + (i % 10) * 32;
      const gy = 400 + Math.floor(i / 10) * 32;
      if (
        field1.isOcean(gx, gy) !== field2.isOcean(gx, gy) ||
        field1.isHill(gx, gy) !== field2.isHill(gx, gy)
      ) {
        diffCount++;
      }
    }

    // Different seed must have significantly different terrain layout (> 25% difference)
    expect(diffCount / totalSample).toBeGreaterThan(0.25);
  });

  it(
    'evaluates land/ocean distribution across 60 representative seeds',
    { timeout: 45000 },
    () => {
      let validDistributionCount = 0;
      const ratios: number[] = [];

      // Test across 60 varied seeds
      for (let s = 1; s <= 60; s++) {
        const seed = s * 7919;
        const field = new V0Field(seed);

        let landCount = 0;
        let totalCount = 0;

        // Sample across varied coordinates far from start anchor to test natural continentality
        for (let gy = 500; gy <= 1300; gy += 200) {
          for (let gx = 500; gx <= 1300; gx += 200) {
            totalCount++;
            if (!field.isOcean(gx, gy)) {
              landCount++;
            }
          }
        }

        const landRatio = landCount / totalCount;
        ratios.push(landRatio);

        // Land ratio should fall within natural variance (not 0% and not 100%)
        if (landRatio >= 0.10 && landRatio <= 0.90) {
          validDistributionCount++;
        }
      }

      // >= 95% of seeds must have a balanced natural distribution
      expect(validDistributionCount / 60).toBeGreaterThanOrEqual(0.95);

      // Ratios must not all be identical (genuine non-uniform noise distribution across seeds)
      const minRatio = Math.min(...ratios);
      const maxRatio = Math.max(...ratios);
      expect(maxRatio - minRatio).toBeGreaterThan(0.2);
    }
  );
});
