import { describe, it, expect } from 'vitest';
import { getEcologyZone } from '../src/maps/ecology/ecology-profile';
import {
  DENSE_FOREST_DENSITY_THRESHOLD,
  LIGHT_FOREST_DENSITY_THRESHOLD,
} from '../src/maps/ecology/ecology-config';
import { selectSpeciesTwoStep, getSpeciesCandidatesForTier } from '../src/wildlife/spawn/species-pool';
import { createWorldQueryAdapter } from '../src/wildlife/ports/world-query-adapter';
import type { TerrainField } from '../src/maps/terrain-field';

describe('Light Forest Ecology & Wildlife Spawning Integration', () => {
  it('1. Zone Classification: density 0.42–0.67 returns light_forest', () => {
    expect(LIGHT_FOREST_DENSITY_THRESHOLD).toBe(0.42);
    expect(DENSE_FOREST_DENSITY_THRESHOLD).toBe(0.68);

    const baseSample = {
      nearSand: false,
      nearWater: false,
      nearHill: false,
      moisture: 0.5,
      fertility: 0.5,
      elevation: 0,
    };

    // Range [0.42, 0.67] -> light_forest
    expect(getEcologyZone({ ...baseSample, density: 0.42 })).toBe('light_forest');
    expect(getEcologyZone({ ...baseSample, density: 0.55 })).toBe('light_forest');
    expect(getEcologyZone({ ...baseSample, density: 0.67 })).toBe('light_forest');

    // >= 0.68 -> dense_forest
    expect(getEcologyZone({ ...baseSample, density: 0.68 })).toBe('dense_forest');
    expect(getEcologyZone({ ...baseSample, density: 0.85 })).toBe('dense_forest');

    // < 0.42 -> meadow
    expect(getEcologyZone({ ...baseSample, density: 0.41 })).toBe('meadow');
    expect(getEcologyZone({ ...baseSample, density: 0.20 })).toBe('meadow');

    // Dryland override when arid/dry
    expect(getEcologyZone({ ...baseSample, density: 0.5, moisture: 0.25 })).toBe('dryland');
    expect(getEcologyZone({ ...baseSample, density: 0.5, fertility: 0.25 })).toBe('dryland');
  });

  it('2. Species Spawning: Pikachu, Pidgey, Caterpie, Weedle, and Scyther spawn in light_forest', () => {
    // Check candidates across tiers for light_forest with tall_grass
    const allLightForestTallGrassCandidates: string[] = [];
    for (let tier = 0; tier <= 4; tier++) {
      const candidates = getSpeciesCandidatesForTier('light_forest', 'tall_grass', tier as any);
      for (const c of candidates) {
        allLightForestTallGrassCandidates.push(c.speciesKey);
      }
    }

    expect(allLightForestTallGrassCandidates).toContain('PIKACHU');
    expect(allLightForestTallGrassCandidates).toContain('PIDGEY');
    expect(allLightForestTallGrassCandidates).toContain('CATERPIE');
    expect(allLightForestTallGrassCandidates).toContain('WEEDLE');
    expect(allLightForestTallGrassCandidates).toContain('SCYTHER');
    expect(allLightForestTallGrassCandidates).toContain('VENONAT');
    expect(allLightForestTallGrassCandidates).toContain('EXEGGCUTE');

    // Verify deterministic two-step selection succeeds in light_forest
    const selection = selectSpeciesTwoStep({
      biome: 'light_forest',
      context: 'tall_grass',
      timeBand: 'day',
      tierRoll01: 0.1,
      speciesRoll01: 0.1,
    });

    expect(selection).not.toBeNull();
    expect(allLightForestTallGrassCandidates).toContain(selection!.speciesKey);
  });

  it('3. Desert to Dryland Mapping: desert terrain maps to dryland and spawns dryland species', () => {
    const desertMockField: TerrainField = {
      version: 3,
      seed: 101,
      isOcean: () => false,
      isSand: () => false,
      isHill: () => false,
      isRoad: () => false,
      isBridge: () => false,
      isWater: () => false,
      isLake: () => false,
      isWaterOrBridge: () => false,
      isNearWater: () => false,
      isNearCliffEdge: () => false,
      getOceanTileId: () => 730,
      getSpawn: () => ({ gx: 0, gy: 0 }),
      getRoadCenterX: () => 0,
      isValidTreePos: () => true,
      isValidPalmTreePos: () => false,
      isDesert: () => true,
    };

    const adapter = createWorldQueryAdapter(desertMockField);
    expect(adapter.biomeAt(100, 100)).toBe('dryland');
    expect(adapter.contextAt(100, 100)).toBe('sand');

    // Check dryland sand species pool (Sandshrew, Diglett, Dugtrio, Sandslash)
    const allDrylandSandCandidates: string[] = [];
    for (let tier = 0; tier <= 4; tier++) {
      const candidates = getSpeciesCandidatesForTier('dryland', 'sand', tier as any);
      for (const c of candidates) {
        allDrylandSandCandidates.push(c.speciesKey);
      }
    }

    expect(allDrylandSandCandidates).toContain('SANDSHREW');
    expect(allDrylandSandCandidates).toContain('DIGLETT');
    expect(allDrylandSandCandidates).toContain('DUGTRIO');
    expect(allDrylandSandCandidates).toContain('SANDSLASH');
  });

  it('4. Preservation: preserves spawn pools of meadow and dense_forest', () => {
    // Meadow tall_grass pool
    const meadowCandidates: string[] = [];
    for (let tier = 0; tier <= 4; tier++) {
      const candidates = getSpeciesCandidatesForTier('meadow', 'tall_grass', tier as any);
      for (const c of candidates) {
        meadowCandidates.push(c.speciesKey);
      }
    }
    expect(meadowCandidates).toContain('RATTATA');
    expect(meadowCandidates).toContain('PIDGEY');
    expect(meadowCandidates).toContain('NIDORANmA');
    expect(meadowCandidates).toContain('NIDORANfE');
    expect(meadowCandidates).toContain('JIGGLYPUFF');

    // Dense Forest forest_floor pool
    const denseForestCandidates: string[] = [];
    for (let tier = 0; tier <= 4; tier++) {
      const candidates = getSpeciesCandidatesForTier('dense_forest', 'forest_floor', tier as any);
      for (const c of candidates) {
        denseForestCandidates.push(c.speciesKey);
      }
    }
    expect(denseForestCandidates).toContain('ODDISH');
    expect(denseForestCandidates).toContain('PARAS');
    expect(denseForestCandidates).toContain('PINSIR');
    expect(denseForestCandidates).toContain('VENONAT');
    expect(denseForestCandidates).toContain('PIKACHU');
  });
});
