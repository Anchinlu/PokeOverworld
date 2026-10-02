import { describe, it, expect } from 'vitest';
import { sampleEcology, calculateTallGrassDensity } from '../src/maps/ecology/ecology-field';
import {
  getEcologyZone,
  getTreeTypeForEcology,
  getFlowerTypeForCluster,
} from '../src/maps/ecology/ecology-profile';
import { pickBerryForEcology } from '../src/maps/berry-data';
import { getRosterForContext } from '../src/maps/chunk-encounters';
import { TREE_MIN_CANDIDATES, TREE_MAX_CANDIDATES } from '../src/maps/ecology/ecology-config';

describe('Ecological Statistical Distribution Verification (Section 11)', () => {
  it('tree density in dense_forest is strictly higher than dryland', () => {
    let forestCandidates = 0;
    let drylandCandidates = 0;
    let forestChunks = 0;
    let drylandChunks = 0;

    // Scan across 50 seeds and grid of chunks
    for (let seed = 100; seed < 150; seed++) {
      for (let cy = -4; cy <= 4; cy++) {
        for (let cx = -4; cx <= 4; cx++) {
          const gx = cx * 16 + 8;
          const gy = cy * 16 + 8;
          const sample = sampleEcology(gx, gy, seed);
          const zone = getEcologyZone(sample);
          const candidates = Math.round(
            TREE_MIN_CANDIDATES + sample.density * (TREE_MAX_CANDIDATES - TREE_MIN_CANDIDATES)
          );

          if (zone === 'dense_forest') {
            forestCandidates += candidates;
            forestChunks++;
          } else if (zone === 'dryland') {
            drylandCandidates += candidates;
            drylandChunks++;
          }
        }
      }
    }

    expect(forestChunks).toBeGreaterThan(0);
    expect(drylandChunks).toBeGreaterThan(0);

    const avgForest = forestCandidates / forestChunks;
    const avgDryland = drylandCandidates / drylandChunks;

    // dense_forest must have significantly more trees than dryland
    expect(avgForest).toBeGreaterThan(avgDryland);
    expect(avgForest).toBeGreaterThanOrEqual(6.0);
    expect(avgDryland).toBeLessThanOrEqual(4.5);
  });

  it('wetland has a significantly higher ratio of blue/white flowers than red/purple', () => {
    let wetBlueWhite = 0;
    let wetRedPurple = 0;
    let dryRedPurple = 0;
    let dryBlueWhite = 0;

    const trials = 500;
    for (let i = 0; i < trials; i++) {
      const tileRoll = i / trials;
      const flowerWet = getFlowerTypeForCluster(
        'wetland',
        i % 10,
        Math.floor(i / 10),
        tileRoll,
        1234
      );
      if (flowerWet === 'flower_white' || flowerWet === 'flower_blue') {
        wetBlueWhite++;
      } else if (flowerWet === 'flower_red' || flowerWet === 'flower_purple') {
        wetRedPurple++;
      }

      const flowerDry = getFlowerTypeForCluster(
        'dryland',
        i % 10,
        Math.floor(i / 10),
        tileRoll,
        1234
      );
      if (flowerDry === 'flower_red' || flowerDry === 'flower_purple') {
        dryRedPurple++;
      } else if (flowerDry === 'flower_white' || flowerDry === 'flower_blue') {
        dryBlueWhite++;
      }
    }

    // Wetland favors white/blue
    expect(wetBlueWhite).toBeGreaterThan(wetRedPurple);
    // Dryland favors red/purple
    expect(dryRedPurple).toBeGreaterThan(dryBlueWhite);
  });

  it('rare berries are significantly less frequent than common berries across 2000 samples', () => {
    let commonCount = 0;
    let rareCount = 0;
    const total = 2000;

    for (let i = 0; i < total; i++) {
      const roll = (i * 0.6180339887) % 1;
      const berry = pickBerryForEcology('meadow', roll);
      if (berry.spawnProfile.rarity === 'common') {
        commonCount++;
      } else if (berry.spawnProfile.rarity === 'rare') {
        rareCount++;
      }
    }

    expect(rareCount).toBeGreaterThan(0);
    // Rare berries should be < 10% of total
    expect(rareCount / total).toBeLessThan(0.1);
    // Common berries should make up majority (> 50%)
    expect(commonCount / total).toBeGreaterThan(0.5);
    // Ratio of common to rare should be at least 8:1
    expect(commonCount / rareCount).toBeGreaterThan(8);
  });

  it('wild pokemon rosters differ according to ecological zone context', () => {
    const forestRoster = getRosterForContext({
      zone: 'dense_forest',
      onTallGrass: true,
      nearWater: false,
      nearTree: true,
      nearHill: false,
      timeOfDay: 'day',
    });
    const meadowRoster = getRosterForContext({
      zone: 'meadow',
      onTallGrass: true,
      nearWater: false,
      nearTree: false,
      nearHill: false,
      timeOfDay: 'day',
    });
    const hillRoster = getRosterForContext({
      zone: 'hill_edge',
      onTallGrass: true,
      nearWater: false,
      nearTree: false,
      nearHill: true,
      timeOfDay: 'day',
    });

    const forestKeys = new Set(forestRoster.map((r) => r.speciesKey));
    const meadowKeys = new Set(meadowRoster.map((r) => r.speciesKey));
    const hillKeys = new Set(hillRoster.map((r) => r.speciesKey));

    expect(forestKeys.has('KAKUNA')).toBe(true);
    expect(meadowKeys.has('KAKUNA')).toBe(false);

    expect(hillKeys.has('SPEAROW')).toBe(true);
    expect(meadowKeys.has('SPEAROW')).toBe(false);
  });
});
