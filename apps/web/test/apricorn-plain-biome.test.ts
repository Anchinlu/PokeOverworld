import { describe, expect, it } from 'vitest';
import { RUNTIME_BIOME_IDS, resolveWorldBiome } from '../src/maps/ecology';
import { getTreeVisualSpec } from '../src/maps/biome-entity-registry';
import { assessThreat } from '../src/wildlife/behavior/senses/threat-assessment';
import { calculateUtilityScores } from '../src/wildlife/behavior/brain/considerations';
import { getBehaviorProfile } from '../src/wildlife/behavior/profiles/profile-registry';
import type { TerrainField } from '../src/maps/terrain-field';
import { createTerrainField } from '../src/maps/terrain-field';
import type { WildEntity } from '../src/wildlife/model';
import speciesSpawnJson from '@pokemon/game-data/wildlife/species-spawn.json';

function createApricornPlainField(): TerrainField {
  return {
    version: 4,
    seed: 20261024,
    isOcean: () => false,
    isSand: () => false,
    isDesert: () => false,
    isDarkLand: () => false,
    isAutumn: () => false,
    isSnow: () => false,
    isRockyHighland: () => false,
    isApricornPlain: () => true,
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
  };
}

describe('Apricorn Plains Biome & Calm Wildlife', () => {
  it('includes apricorn_plain in RUNTIME_BIOME_IDS and resolves correctly', () => {
    expect(RUNTIME_BIOME_IDS).toContain('apricorn_plain');

    const field = createApricornPlainField();
    const resolved = resolveWorldBiome(field, 50, 50);
    expect(resolved).toBe('apricorn_plain');
  });

  it('generates Apricorn groves only on ordinary flat meadow cells', () => {
    const field = createTerrainField(5, 20261024);
    let groveTiles = 0;

    // Sample one point per chunk-sized stride. A full tile-by-tile scan would
    // instantiate thousands of deterministic plan-cache entries and adds no
    // extra coverage for this invariant.
    for (let gy = -256; gy <= 256; gy += 32) {
      for (let gx = -256; gx <= 256; gx += 32) {
        if (!field.isApricornPlain?.(gx, gy)) continue;
        groveTiles += 1;
        expect(field.isOcean(gx, gy)).toBe(false);
        expect(field.isSand(gx, gy)).toBe(false);
        expect(field.isWater(gx, gy)).toBe(false);
        expect(field.isHill(gx, gy)).toBe(false);
        expect(field.isDesert?.(gx, gy)).toBe(false);
        expect(field.isDarkLand?.(gx, gy)).toBe(false);
        expect(field.isAutumn?.(gx, gy)).toBe(false);
        expect(field.isSnow?.(gx, gy)).toBe(false);
        expect(field.isRockyHighland?.(gx, gy)).toBe(false);
      }
    }

    expect(groveTiles).toBeGreaterThan(0);
  }, 120000);

  it('correctly indexes all 10 Apricorn trees with proportional 76x140 dimensions and ySort anchor', () => {
    const colors = ['blue', 'red', 'yellow', 'black', 'white', 'green', 'pink', 'orange', 'cyan', 'purple'];
    for (const color of colors) {
      const spec = getTreeVisualSpec(`tree_apricorn_${color}`);
      expect(spec.width).toBe(76);
      expect(spec.height).toBe(140);
      expect(spec.ySortOffset).toBe(132);
      expect(spec.assetKey).toBe(`tree_apricorn_${color}`);
    }
  });

  it('verifies Bug Pokémon habitats include apricorn_plain', () => {
    const bugSpecies = ['BEEDRILL', 'SCYTHER', 'PINSIR', 'CATERPIE', 'WEEDLE', 'BUTTERFREE', 'PARAS', 'VENONAT'];
    const spawnData = speciesSpawnJson as Record<string, { habitats?: Array<{ biome: string }> }>;

    for (const species of bugSpecies) {
      const entry = spawnData[species];
      expect(entry).toBeDefined();
      const hasApricornPlain = entry?.habitats?.some((h) => h.biome === 'apricorn_plain');
      expect(hasApricornPlain).toBe(true);
    }
  });

  it('uses a passive herd profile that never chases the player', () => {
    const passiveProfile = getBehaviorProfile('herd_grazer');
    expect(passiveProfile.temperament).toBe('passive');

    const dummyEntity: WildEntity = {
      id: 'wild:test:1',
      speciesKey: 'BEEDRILL',
      level: 15,
      gx: 10,
      gy: 10,
      x: 320,
      y: 320,
      homeGX: 10,
      homeGY: 10,
      wanderRadius: 4,
      role: 'solo',
      rarityTier: 1,
      activeTime: ['day'],
      behavior: 'herd_grazer',
      dir: 0,
      state: 'idle',
      isMoving: false,
      fromX: 320,
      fromY: 320,
      targetGX: 10,
      targetGY: 10,
      targetX: 320,
      targetY: 320,
      stepProgress: 0,
      moveSpeed: 1.0,
      isWaterDweller: false,
      isSwimming: false,
      canJumpHills: true,
    };

    // A weak Apricorn Plains Pokémon may still flee, but it never challenges the player.
    const threat = assessThreat(dummyEntity, 100, passiveProfile);
    expect(threat.reaction).toBe('flee');
    expect(threat.reaction).not.toBe('warn');

    // When player is 3 tiles away, aggressive creature activates chase
    const worldMock = {
      isWalkable: () => true,
      isElevated: () => false,
      contextAt: () => 'tall_grass' as const,
      biomeAt: () => 'apricorn_plain' as const,
      difficultyAt: () => 0.5,
      timeBand: () => 'day' as const,
      weather: () => 'clear' as const,
    };

    const playerMock = {
      position: () => ({ gx: 13, gy: 10 }), // 3 tiles away
      isRunning: () => false,
      inTallGrass: () => false,
      referenceLevel: () => 100,
    };

    const scores = calculateUtilityScores(
      dummyEntity,
      passiveProfile,
      worldMock,
      playerMock
    );

    expect(scores.chase).toBeLessThan(0.1);
    expect(scores.territorial).toBeLessThan(0.1);
  });
});
