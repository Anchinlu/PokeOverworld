import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  TILE_IDS,
  TERRAIN,
  isRockyHighlandTile,
  isRockyCliffTile,
  isHighCliffTile,
} from '@pokemon/game-data';
import type { TerrainField } from '../src/maps/terrain-field';
import { createTerrainField } from '../src/maps/terrain-field';
import { createWorldQueryAdapter } from '../src/wildlife/ports/world-query-adapter';
import { getSpeciesCandidatesForTier } from '../src/wildlife/spawn/species-pool';
import { spawnConfigData } from '../src/wildlife/data/data-loader';
import {
  getRockyGroundTileKey,
  getRockyCliffTileKey,
  getHighCliffRockTileKey,
  getWaterTileKey,
} from '../src/maps/autotile';
import {
  generateChunkTrees,
  generateChunkFoliage,
  generateChunkWaterFlora,
} from '../src/maps/chunk-objects';
import { generateChunkTerrain } from '../src/maps/chunk-terrain';
import { WorldChunk } from '../src/maps/chunk';

function createRockyHighlandField(): TerrainField {
  return {
    version: 5,
    seed: 20261023,
    isOcean: () => false,
    isSand: () => false,
    isDesert: () => false,
    isDarkLand: () => false,
    isAutumn: () => false,
    isSnow: () => false,
    isRockyHighland: () => true,
    isHighCliff: () => false,
    isHighCliffPlateau: () => false,
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

describe('Rocky Highland & High Cliff Biome integration', () => {
  it('generates rocky_highland regions, 1-tier rocky hills, and 2-tier High Cliffs in World V5', () => {
    const field = createTerrainField(5, 101);
    let rockyGroundSamples = 0;
    let rockyOneTierHillSamples = 0;
    let highCliffSamples = 0;
    let highCliffPlateauSamples = 0;

    // 1. Coarse scan (step 48) to locate Rocky Highland biome chunks quickly
    const rockyCenters: Array<{ gx: number; gy: number }> = [];
    for (let gy = -960; gy <= 960; gy += 48) {
      for (let gx = -960; gx <= 960; gx += 48) {
        if (field.isOcean(gx, gy)) continue;
        if (field.isRockyHighland?.(gx, gy)) {
          rockyCenters.push({ gx, gy });
          if (rockyCenters.length >= 4) break;
        }
      }
      if (rockyCenters.length >= 4) break;
    }

    // 2. Fine scan inside discovered Rocky Highland chunks
    for (const center of rockyCenters) {
      for (let dy = -32; dy <= 32; dy += 2) {
        for (let dx = -32; dx <= 32; dx += 2) {
          const gx = center.gx + dx;
          const gy = center.gy + dy;
          if (!field.isRockyHighland?.(gx, gy)) continue;
          rockyGroundSamples += 1;
          if (field.isHighCliff?.(gx, gy)) {
            highCliffSamples += 1;
            if (field.isHighCliffPlateau?.(gx, gy)) {
              highCliffPlateauSamples += 1;
            }
          } else if (field.isHill(gx, gy)) {
            rockyOneTierHillSamples += 1;
          }
        }
      }
    }

    expect(rockyGroundSamples).toBeGreaterThan(0);
    expect(rockyOneTierHillSamples).toBeGreaterThan(0);
    expect(highCliffSamples).toBeGreaterThan(0);
    expect(highCliffPlateauSamples).toBeGreaterThan(0);
  }, 120000);

  it('validates all 71 rocky_highland assets in manifest.json and on disk', () => {
    const manifestPath = path.resolve(__dirname, '../public/assets/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const requiredKeys = [
      'ground_rock_pure',
      'ground_rock_top',
      'ground_rock_bot',
      'ground_rock_left',
      'ground_rock_right',
      'ground_rock_tl',
      'ground_rock_tr',
      'ground_rock_bl',
      'ground_rock_br',
      'ground_rock_in_tl',
      'ground_rock_in_tr',
      'ground_rock_in_bl',
      'ground_rock_in_br',
      'cliff_rock_pure',
      'cliff_rock_top',
      'cliff_rock_bot',
      'cliff_rock_left',
      'cliff_rock_right',
      'cliff_rock_tl',
      'cliff_rock_tr',
      'cliff_rock_bl',
      'cliff_rock_br',
      'cliff_rock_in_tl',
      'cliff_rock_in_tr',
      'cliff_rock_in_bl',
      'cliff_rock_in_br',
      'high_cliff_rock_pure',
      'high_cliff_rock_top',
      'high_cliff_rock_bot',
      'high_cliff_rock_left',
      'high_cliff_rock_right',
      'high_cliff_rock_tl',
      'high_cliff_rock_tr',
      'high_cliff_rock_bl',
      'high_cliff_rock_br',
      'high_cliff_rock_bot_upper',
      'high_cliff_rock_bl_upper',
      'high_cliff_rock_br_upper',
      'high_cliff_rock_in_tl',
      'high_cliff_rock_in_tr',
      'high_cliff_rock_in_bl',
      'high_cliff_rock_in_br',
      'high_cliff_rock_in_bl_upper',
      'high_cliff_rock_in_br_upper',
      'water_rock_pure',
      'water_rock_top',
      'water_rock_bot',
      'water_rock_left',
      'water_rock_right',
      'water_rock_tl',
      'water_rock_tr',
      'water_rock_bl',
      'water_rock_br',
      'water_rock_in_tl',
      'water_rock_in_tr',
      'water_rock_in_bl',
      'water_rock_in_br',
      'water_rock_curve',
      'rock_highland_boulder',
      'rock_highland_1',
      'rock_highland_2',
      'rock_highland_small',
      'decor_rock_pebbles',
      'decor_rock_puddle_cluster',
      'decor_rock_puddle_1',
      'decor_rock_puddle_2',
      'decor_rock_puddle_3',
      'decor_rock_puddle_4',
      'rock_wet_wide',
      'rock_wet_tall',
      'rock_wet_small',
    ];

    for (const key of requiredKeys) {
      expect(manifest).toHaveProperty(key);
      expect(manifest[key]).toBe(`/assets/biomes/rocky_highland/${key}.png`);
      const fullPath = path.resolve(__dirname, `../public${manifest[key]}`);
      expect(fs.existsSync(fullPath)).toBe(true);
    }

    expect(isRockyHighlandTile(TILE_IDS.ground_rock_pure)).toBe(true);
    expect(isRockyCliffTile(TILE_IDS.cliff_rock_pure)).toBe(true);
    expect(isHighCliffTile(TILE_IDS.high_cliff_rock_pure)).toBe(true);
    expect(isHighCliffTile(TILE_IDS.high_cliff_rock_bot_upper)).toBe(true);
    expect(isRockyHighlandTile(TILE_IDS.water_rock_pure)).toBe(true);
  });

  it('autotiles rocky ground, 1-tier rocky cliffs, 2-tier High Cliffs, and rocky water', () => {
    const field = createRockyHighlandField();
    expect(getRockyGroundTileKey(10, 10, field)).toEqual({
      key: 'pure',
      tileId: TILE_IDS.ground_rock_pure,
    });

    const oneTierHillField: TerrainField = { ...field, isHill: () => true };
    expect(getRockyCliffTileKey(10, 10, oneTierHillField)).toEqual({
      key: 'pure',
      tileId: TILE_IDS.cliff_rock_pure,
    });

    // 4-row High Cliff block at gy = 10..13, gx = 10..12
    const highCliffField: TerrainField = {
      ...field,
      isHill: (gx, gy) => gx >= 10 && gx <= 12 && gy >= 10 && gy <= 13,
      isHighCliff: (gx, gy) => gx >= 10 && gx <= 12 && gy >= 10 && gy <= 13,
      isHighCliffPlateau: (gx, gy) => gx >= 10 && gx <= 12 && gy >= 10 && gy <= 11,
    };

    // Row 10: northern rim (tl, top, tr)
    expect(getHighCliffRockTileKey(10, 10, highCliffField).tileId).toBe(
      TILE_IDS.high_cliff_rock_tl
    );
    expect(getHighCliffRockTileKey(11, 10, highCliffField).tileId).toBe(
      TILE_IDS.high_cliff_rock_top
    );
    expect(getHighCliffRockTileKey(12, 10, highCliffField).tileId).toBe(
      TILE_IDS.high_cliff_rock_tr
    );
    // Row 11: plateau interior (left, pure, right)
    expect(getHighCliffRockTileKey(11, 11, highCliffField).tileId).toBe(
      TILE_IDS.high_cliff_rock_pure
    );
    // Row 12: upper half of 2-tile vertical southern cliff wall (bl_upper, bot_upper, br_upper)
    expect(getHighCliffRockTileKey(10, 12, highCliffField).tileId).toBe(
      TILE_IDS.high_cliff_rock_bl_upper
    );
    expect(getHighCliffRockTileKey(11, 12, highCliffField).tileId).toBe(
      TILE_IDS.high_cliff_rock_bot_upper
    );
    expect(getHighCliffRockTileKey(12, 12, highCliffField).tileId).toBe(
      TILE_IDS.high_cliff_rock_br_upper
    );
    // Row 13: lower base of 2-tile vertical southern cliff wall (bl, bot, br)
    expect(getHighCliffRockTileKey(10, 13, highCliffField).tileId).toBe(
      TILE_IDS.high_cliff_rock_bl
    );
    expect(getHighCliffRockTileKey(11, 13, highCliffField).tileId).toBe(
      TILE_IDS.high_cliff_rock_bot
    );
    expect(getHighCliffRockTileKey(12, 13, highCliffField).tileId).toBe(
      TILE_IDS.high_cliff_rock_br
    );

    // Rocky water
    const rockyWaterField: TerrainField = {
      ...field,
      isWater: () => true,
      isWaterOrBridge: () => true,
    };
    expect(getWaterTileKey(10, 10, rockyWaterField)).toEqual({
      key: 'rock_pure',
      tileId: TILE_IDS.water_rock_pure,
    });
  });

  it('resolves wildlife habitat to hill_edge and supports wildlife on 2-tier High Cliff plateaus', () => {
    expect(spawnConfigData.groupsPerChunk.hill_edge).toEqual([2, 4]);

    // High Cliff at gy = 10..13 (plateau at gy = 10..11, wall face at gy = 12..13)
    const field: TerrainField = {
      ...createRockyHighlandField(),
      isHill: (gx, gy) => gx >= 10 && gx <= 14 && gy >= 10 && gy <= 13,
      isHighCliff: (gx, gy) => gx >= 10 && gx <= 14 && gy >= 10 && gy <= 13,
      isHighCliffPlateau: (gx, gy) => gx >= 10 && gx <= 14 && gy >= 10 && gy <= 11,
    };
    const adapter = createWorldQueryAdapter(field);

    // Biome is hill_edge, context is rock on cliffs and walkable_ground on flat rocky ground
    expect(adapter.biomeAt(11, 11)).toBe('hill_edge');
    expect(adapter.contextAt(11, 11)).toBe('rock');
    expect(adapter.biomeAt(5, 5)).toBe('hill_edge');
    expect(adapter.contextAt(5, 5)).toBe('walkable_ground');

    // Wildlife can spawn & roam on the High Cliff plateau (gy = 10..11)
    expect(adapter.isWalkable(11, 11)).toBe(true);
    expect(adapter.isWalkable(12, 11, 11, 11)).toBe(true);

    // Wildlife cannot spawn or walk onto the 2-tile vertical southern wall face (gy = 12..13)
    expect(adapter.isWalkable(11, 12)).toBe(false);
    expect(adapter.isWalkable(11, 13)).toBe(false);
    expect(adapter.isWalkable(11, 12, 11, 11)).toBe(false);

    // Wildlife cannot walk off the sheer High Cliff onto lower ground or vice versa
    expect(adapter.isWalkable(9, 11, 10, 11)).toBe(false);
    expect(adapter.isWalkable(10, 11, 9, 11)).toBe(false);

    // Species pool has mountain/rock candidates for hill_edge
    expect(getSpeciesCandidatesForTier('hill_edge', 'rock', 0).length).toBeGreaterThan(0);
    expect(getSpeciesCandidatesForTier('hill_edge', 'walkable_ground', 0).length).toBeGreaterThan(
      0
    );
  });

  it('generates rocky boulders, pebbles, puddles, and wet rocks in Rocky Highland chunks', () => {
    const field = createRockyHighlandField();
    const trees = generateChunkTrees(2, 2, field);
    expect(trees.length).toBeGreaterThan(0);
    expect(trees.every((t) => t.type === 'rock_highland_boulder')).toBe(true);

    const allPlants: { type: string }[] = [];
    for (let cx = 0; cx < 4; cx++) {
      for (let cy = 0; cy < 4; cy++) {
        const terrain = generateChunkTerrain(cx, cy, field);
        expect(terrain.terrainGrid[0][0]).toBe(TERRAIN.ROCKY_HIGHLAND);
        const chunkPlants = generateChunkFoliage(
          cx,
          cy,
          field,
          terrain.terrainGrid,
          terrain.tileIdGrid,
          [],
          [],
          []
        );
        allPlants.push(...chunkPlants);
      }
    }
    expect(allPlants.length).toBeGreaterThan(0);
    expect(
      allPlants.some(
        (p) =>
          p.type.startsWith('rock_highland_') ||
          p.type.startsWith('decor_rock_') ||
          p.type.startsWith('rock_wet_')
      )
    ).toBe(true);

    // Water chunk in rocky highland indexes water_rock_* tiles and has no lily pads
    const waterField: TerrainField = {
      ...field,
      isWater: () => true,
      isWaterOrBridge: () => true,
    };
    const chunk = new WorldChunk(0, 0, waterField);
    expect(chunk.waterTiles.length).toBeGreaterThan(0);
    expect(chunk.waterTiles.every(({ tileId }) => tileId >= 785 && tileId <= 798)).toBe(true);
    expect(generateChunkWaterFlora(0, 0, waterField)).toHaveLength(0);
  });
});
