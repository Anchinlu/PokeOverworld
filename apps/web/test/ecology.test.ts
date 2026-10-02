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

  it('determines tree types according to ecological rules and biomes.json defaults', async () => {
    const { getTreeTypeForEcology, BIOME_DEFAULT_TREES } = await import(
      '../src/maps/ecology/ecology-profile'
    );

    // Near sand or water -> coastal
    const coastTree = getTreeTypeForEcology(
      { nearSand: true, nearWater: false, nearHill: false, density: 0.5, moisture: 0.5, fertility: 0.5, elevation: 0 },
      'coast'
    );
    expect(coastTree).toBe(BIOME_DEFAULT_TREES.coastal);

    // Dense forest -> deep
    const forestTree = getTreeTypeForEcology(
      { nearSand: false, nearWater: false, nearHill: false, density: 0.85, moisture: 0.5, fertility: 0.5, elevation: 0 },
      'dense_forest'
    );
    expect(forestTree).toBe(BIOME_DEFAULT_TREES.forest);

    // Dryland -> autumn
    const dryTree = getTreeTypeForEcology(
      { nearSand: false, nearWater: false, nearHill: false, density: 0.3, moisture: 0.2, fertility: 0.2, elevation: 0 },
      'dryland'
    );
    expect(dryTree).toBe(BIOME_DEFAULT_TREES.autumn);

    // Neutral meadow -> vibrant
    const meadowTree = getTreeTypeForEcology(
      { nearSand: false, nearWater: false, nearHill: false, density: 0.5, moisture: 0.5, fertility: 0.5, elevation: 0 },
      'meadow'
    );
    expect(meadowTree).toBe(BIOME_DEFAULT_TREES.neutral);
  });

  it('clusters flowers by ecological zone palettes', async () => {
    const { getFlowerTypeForCluster, ZONE_FLOWER_PALETTES } = await import(
      '../src/maps/ecology/ecology-profile'
    );

    expect(ZONE_FLOWER_PALETTES.wetland.primary).toEqual(['flower_white', 'flower_blue']);
    expect(ZONE_FLOWER_PALETTES.dryland.primary).toEqual(['flower_red', 'flower_purple']);
    expect(ZONE_FLOWER_PALETTES.dense_forest.primary).toEqual(['flower_blue', 'flower_purple']);
    expect(ZONE_FLOWER_PALETTES.meadow.primary).toEqual(['flower_red', 'flower_white']);

    // Samples in wetland cluster should roll white or blue predominantly
    const wetlandFlowers = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const flower = getFlowerTypeForCluster('wetland', 0, 0, i / 25, 42);
      wetlandFlowers.add(flower);
    }
    // At least one of primary flowers must be present
    expect(wetlandFlowers.has('flower_white') || wetlandFlowers.has('flower_blue')).toBe(true);
  });
});
