import { describe, expect, it } from 'vitest';
import { createTerrainField } from '../src/maps/terrain-field';
import { isTallGrassTile } from '../src/maps/ecology/tall-grass-field';

describe('Tall grass density balance', () => {
  it('keeps the global field below full meadow coverage', () => {
    const field = createTerrainField(1, 20261019);
    let occupied = 0;
    const width = 96;
    const height = 96;

    for (let gy = 0; gy < height; gy++) {
      for (let gx = 0; gx < width; gx++) {
        if (isTallGrassTile(gx, gy, field)) occupied++;
      }
    }

    const coverage = occupied / (width * height);
    expect(coverage).toBeGreaterThan(0.03);
    expect(coverage).toBeLessThan(0.45);
  });
});
