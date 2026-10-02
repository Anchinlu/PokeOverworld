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

    const val = sampleEcologicalNoise(10, 20, 12345, 0x2401);
    expect(val).toBeCloseTo(0.676996, 5);
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
    const { getTreeTypeForEcology, BIOME_DEFAULT_TREES } =
      await import('../src/maps/ecology/ecology-profile');

    // Near sand or water -> coastal
    const coastTree = getTreeTypeForEcology(
      {
        nearSand: true,
        nearWater: false,
        nearHill: false,
        density: 0.5,
        moisture: 0.5,
        fertility: 0.5,
        elevation: 0,
      },
      'coast'
    );
    expect(coastTree).toBe(BIOME_DEFAULT_TREES.coastal);

    // Dense forest -> deep
    const forestTree = getTreeTypeForEcology(
      {
        nearSand: false,
        nearWater: false,
        nearHill: false,
        density: 0.85,
        moisture: 0.5,
        fertility: 0.5,
        elevation: 0,
      },
      'dense_forest'
    );
    expect(forestTree).toBe(BIOME_DEFAULT_TREES.forest);

    // Dryland -> autumn
    const dryTree = getTreeTypeForEcology(
      {
        nearSand: false,
        nearWater: false,
        nearHill: false,
        density: 0.3,
        moisture: 0.2,
        fertility: 0.2,
        elevation: 0,
      },
      'dryland'
    );
    expect(dryTree).toBe(BIOME_DEFAULT_TREES.autumn);

    // Neutral meadow -> vibrant
    const meadowTree = getTreeTypeForEcology(
      {
        nearSand: false,
        nearWater: false,
        nearHill: false,
        density: 0.5,
        moisture: 0.5,
        fertility: 0.5,
        elevation: 0,
      },
      'meadow'
    );
    expect(meadowTree).toBe(BIOME_DEFAULT_TREES.neutral);
  });

  it('clusters flowers by ecological zone palettes', async () => {
    const { getFlowerTypeForCluster, ZONE_FLOWER_PALETTES } =
      await import('../src/maps/ecology/ecology-profile');

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

  it('selects berries adhering to rarity weights and habitat preferences', async () => {
    const { pickBerryForEcology, BERRY_ROSTER } = await import('../src/maps/berry-data');

    // All berries must have valid spawn metadata
    for (const b of BERRY_ROSTER) {
      expect(b.spawnProfile).toBeDefined();
      expect(b.spawnProfile.weight).toBeGreaterThan(0);
      expect(['common', 'uncommon', 'rare']).toContain(b.spawnProfile.rarity);
      expect(['wet', 'dry', 'neutral']).toContain(b.spawnProfile.habitat);
    }

    // Over 1000 simulated rolls:
    let rareCount = 0;
    let wetCountInWetland = 0;
    let dryCountInDryland = 0;
    const trials = 1000;

    for (let i = 0; i < trials; i++) {
      const roll = i / trials;
      const bMeadow = pickBerryForEcology('meadow', roll);
      if (bMeadow.spawnProfile.rarity === 'rare') rareCount++;

      const bWet = pickBerryForEcology('wetland', roll);
      if (bWet.spawnProfile.habitat === 'wet') wetCountInWetland++;

      const bDry = pickBerryForEcology('dryland', roll);
      if (bDry.spawnProfile.habitat === 'dry') dryCountInDryland++;
    }

    // Rare berries should be < 10% of total spawns
    expect(rareCount / trials).toBeLessThan(0.1);

    // Wet berries in wetland should exceed 50%
    expect(wetCountInWetland / trials).toBeGreaterThan(0.5);

    // Dry berries in dryland should exceed 50%
    expect(dryCountInDryland / trials).toBeGreaterThan(0.5);
  });

  it('calculates tall grass density according to Section 8.1 formula and clamps [0, 1]', async () => {
    const { calculateTallGrassDensity } = await import('../src/maps/ecology/ecology-field');

    const drySample = {
      fertility: 0.1,
      moisture: 0.1,
      density: 0.1,
      elevation: 0,
      nearWater: false,
      nearHill: false,
      nearSand: false,
    };
    const lushSample = {
      fertility: 0.9,
      moisture: 0.9,
      density: 0.9,
      elevation: 0,
      nearWater: false,
      nearHill: false,
      nearSand: false,
    };

    const dDry = calculateTallGrassDensity(drySample);
    const dLush = calculateTallGrassDensity(lushSample);

    expect(dDry).toBeGreaterThanOrEqual(0);
    expect(dLush).toBeLessThanOrEqual(1);
    expect(dLush).toBeGreaterThan(dDry);
  });

  it('selects encounter roster based on EncounterContext', async () => {
    const { getRosterForContext } = await import('../src/maps/chunk-encounters');

    const forestRoster = getRosterForContext({
      zone: 'dense_forest',
      onTallGrass: true,
      nearWater: false,
      nearTree: true,
      nearHill: false,
      timeOfDay: 'day',
    });
    expect(forestRoster.some((r) => r.speciesKey === 'KAKUNA' || r.speciesKey === 'CATERPIE')).toBe(
      true
    );

    const hillRoster = getRosterForContext({
      zone: 'hill_edge',
      onTallGrass: true,
      nearWater: false,
      nearTree: false,
      nearHill: true,
      timeOfDay: 'day',
    });
    expect(hillRoster.some((r) => r.speciesKey === 'SPEAROW' || r.speciesKey === 'RATTATA')).toBe(
      true
    );

    const meadowRoster = getRosterForContext({
      zone: 'meadow',
      onTallGrass: true,
      nearWater: false,
      nearTree: false,
      nearHill: false,
      timeOfDay: 'day',
    });
    expect(meadowRoster.some((r) => r.speciesKey === 'PIDGEY')).toBe(true);
  });

  it('generates deterministic levels strictly within [minLevel, maxLevel]', async () => {
    const { generateChunkWildPokemon } = await import('../src/maps/chunk-encounters');

    const mockTallGrass = [
      { gx: 10, gy: 10, x: 320, y: 320, phase: 0 },
      { gx: 11, gy: 10, x: 352, y: 320, phase: 0 },
      { gx: 10, gy: 11, x: 320, y: 352, phase: 0 },
      { gx: 11, gy: 11, x: 352, y: 352, phase: 0 },
    ];

    const monsA = generateChunkWildPokemon(0, 0, 555, [], [], mockTallGrass, []);
    const monsB = generateChunkWildPokemon(0, 0, 555, [], [], mockTallGrass, []);

    // Deterministic repeatability
    expect(monsA.length).toBe(monsB.length);
    for (let i = 0; i < monsA.length; i++) {
      expect(monsA[i].level).toBe(monsB[i].level);
      expect(monsA[i].speciesKey).toBe(monsB[i].speciesKey);
      // Route 1/22/Forest levels are all within [2, 7]
      expect(monsA[i].level).toBeGreaterThanOrEqual(2);
      expect(monsA[i].level).toBeLessThanOrEqual(7);
    }

    // Strictly no encounters when tall grass is absent
    const emptyMons = generateChunkWildPokemon(0, 0, 555, [], [], [], []);
    expect(emptyMons).toEqual([]);
  });
});
