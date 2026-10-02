import { describe, it, expect } from 'vitest';
import { sampleEcology, sampleEcologicalNoise } from '../src/maps/ecology/ecology-field';
import { getEcologyZone } from '../src/maps/ecology/ecology-profile';
import {
  ECOLOGY_FERTILITY_SALT,
  ECOLOGY_MOISTURE_SALT,
  ECOLOGY_DENSITY_SALT,
} from '../src/maps/ecology/ecology-config';

describe('Ecological Field & Regional Distribution (Step 1)', () => {
  it('produces identical EcologySample for the same global coordinates and seed', () => {
    const seed = 12345;
    const sampleA = sampleEcology(10, 25, seed);
    const sampleB = sampleEcology(10, 25, seed);

    expect(sampleA).toEqual(sampleB);
    expect(sampleA.fertility).toBeGreaterThanOrEqual(0);
    expect(sampleA.fertility).toBeLessThanOrEqual(1);
    expect(sampleA.moisture).toBeGreaterThanOrEqual(0);
    expect(sampleA.moisture).toBeLessThanOrEqual(1);
    expect(sampleA.density).toBeGreaterThanOrEqual(0);
    expect(sampleA.density).toBeLessThanOrEqual(1);
  });

  it('produces different samples when seed changes', () => {
    const sample1 = sampleEcology(15, 30, 111);
    const sample2 = sampleEcology(15, 30, 999);

    expect(sample1.fertility).not.toBe(sample2.fertility);
    expect(sample1.moisture).not.toBe(sample2.moisture);
    expect(sample1.density).not.toBe(sample2.density);
  });

  it('guarantees seamless continuity across chunk boundaries (global coordinate continuity)', () => {
    const seed = 777;
    // Tile 15 in chunk 0 vs tile 16 in chunk 1 (boundary is between gx=15 and gx=16)
    const s15 = sampleEcologicalNoise(15, 20, seed, ECOLOGY_MOISTURE_SALT);
    const s16 = sampleEcologicalNoise(16, 20, seed, ECOLOGY_MOISTURE_SALT);

    // Delta across 1 tile with freq=0.055 should be smooth (< 0.2), no jump discontinuities
    const delta = Math.abs(s16 - s15);
    expect(delta).toBeLessThan(0.2);
  });

  it('correctly maps samples to valid ecological zones', () => {
    const seed = 42;
    const validZones = new Set([
      'coast',
      'wetland',
      'meadow',
      'dryland',
      'dense_forest',
      'hill_edge',
    ]);

    for (let gy = -50; gy <= 50; gy += 5) {
      for (let gx = -20; gx <= 20; gx += 5) {
        const sample = sampleEcology(gx, gy, seed);
        const zone = getEcologyZone(sample);
        expect(validZones.has(zone)).toBe(true);
      }
    }
  });
});
