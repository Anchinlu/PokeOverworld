import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TILE_IDS, isAutumnTile, TERRAIN } from '@pokemon/game-data';
import type { TerrainField } from '../src/maps/terrain-field';
import { createWorldQueryAdapter } from '../src/wildlife/ports/world-query-adapter';
import { getSpeciesCandidatesForTier } from '../src/wildlife/spawn/species-pool';
import { spawnConfigData } from '../src/wildlife/data/data-loader';
import { getAutumnGroundTileKey, getWaterTileKey } from '../src/maps/autotile';
import { generateChunkTallGrass } from '../src/maps/chunk-objects';
import { generateChunkTerrain } from '../src/maps/chunk-terrain';

function createAutumnField(): TerrainField {
  return {
    version: 4,
    seed: 20261022,
    isOcean: () => false,
    isSand: () => false,
    isDesert: () => false,
    isDarkLand: () => false,
    isAutumn: () => true,
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

describe('Autumn Forest biome integration', () => {
  it('has an explicit group budget', () => {
    expect(spawnConfigData.groupsPerChunk.autumn).toEqual([2, 4]);
  });

  it('keeps the autumn encounter pool on walkable ground inside tall grass', () => {
    const field = createAutumnField();
    const adapter = createWorldQueryAdapter(field, [], [
      { gx: 10, gy: 10, x: 320, y: 320, phase: 0, heightScale: 1 },
    ]);

    expect(adapter.biomeAt(10, 10)).toBe('autumn');
    expect(adapter.contextAt(10, 10)).toBe('walkable_ground');
    expect(getSpeciesCandidatesForTier('autumn', 'walkable_ground', 0).length).toBeGreaterThan(0);
  });

  it('validates autumn boundary grass fringe autotile assets in manifest and on disk', () => {
    const manifestPath = path.resolve(__dirname, '../public/assets/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const fringeKeys = [
      'ground_autumn_pure',
      'ground_autumn_top',
      'ground_autumn_bot',
      'ground_autumn_left',
      'ground_autumn_right',
      'ground_autumn_tl',
      'ground_autumn_tr',
      'ground_autumn_bl',
      'ground_autumn_br',
      'ground_autumn_in_tl',
      'ground_autumn_in_tr',
      'ground_autumn_in_bl',
      'ground_autumn_in_br',
    ];

    for (const key of fringeKeys) {
      expect(manifest).toHaveProperty(key);
      expect(manifest[key]).toBe(`/assets/biomes/autumn/${key}.png`);
      const fullPath = path.resolve(__dirname, `../public${manifest[key]}`);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('validates autumn tall grass assets and tile ID', () => {
    const manifestPath = path.resolve(__dirname, '../public/assets/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest).toHaveProperty('tall_grass_autumn');
    expect(manifest).toHaveProperty('tall_grass_autumn_strip');
    expect(manifest.tall_grass_autumn).toBe('/assets/biomes/autumn/tall_grass_autumn.png');
    expect(manifest.tall_grass_autumn_strip).toBe('/assets/biomes/autumn/tall_grass_autumn_strip.png');

    const fullPath = path.resolve(__dirname, `../public${manifest.tall_grass_autumn}`);
    expect(fs.existsSync(fullPath)).toBe(true);

    expect(TILE_IDS.tall_grass_autumn).toBe(612);
    expect(isAutumnTile(TILE_IDS.tall_grass_autumn)).toBe(true);
    expect(isAutumnTile(TILE_IDS.ground_autumn_pure)).toBe(true);
    expect(isAutumnTile(TILE_IDS.ground_autumn_top)).toBe(true);
    expect(isAutumnTile(TILE_IDS.ground_autumn_in_br)).toBe(true);
    expect(isAutumnTile(TILE_IDS.tall_grass_dark)).toBe(false);
  });

  it('resolves 3x3 autumn ground autotile connectivity with directional fringes', () => {
    // Pure interior: all 8 neighbors are autumn
    const allAutumnField = createAutumnField();
    const pureRes = getAutumnGroundTileKey(10, 10, allAutumnField);
    expect(pureRes.key).toBe('pure');
    expect(pureRes.tileId).toBe(TILE_IDS.ground_autumn_pure);

    // North border: neighbor north is not autumn
    const northEdgeField: TerrainField = {
      ...createAutumnField(),
      isAutumn: (x, y) => (y < 10 ? false : true),
    };
    const topRes = getAutumnGroundTileKey(10, 10, northEdgeField);
    expect(topRes.key).toBe('top');
    expect(topRes.tileId).toBe(TILE_IDS.ground_autumn_top);

    // South border: neighbor south is not autumn
    const southEdgeField: TerrainField = {
      ...createAutumnField(),
      isAutumn: (x, y) => (y > 10 ? false : true),
    };
    const botRes = getAutumnGroundTileKey(10, 10, southEdgeField);
    expect(botRes.key).toBe('bot');
    expect(botRes.tileId).toBe(TILE_IDS.ground_autumn_bot);

    // West border: neighbor west is not autumn
    const westEdgeField: TerrainField = {
      ...createAutumnField(),
      isAutumn: (x, y) => (x < 10 ? false : true),
    };
    const leftRes = getAutumnGroundTileKey(10, 10, westEdgeField);
    expect(leftRes.key).toBe('left');
    expect(leftRes.tileId).toBe(TILE_IDS.ground_autumn_left);

    // East border: neighbor east is not autumn
    const eastEdgeField: TerrainField = {
      ...createAutumnField(),
      isAutumn: (x, y) => (x > 10 ? false : true),
    };
    const rightRes = getAutumnGroundTileKey(10, 10, eastEdgeField);
    expect(rightRes.key).toBe('right');
    expect(rightRes.tileId).toBe(TILE_IDS.ground_autumn_right);

    // Outer corner TL: north and west are not autumn
    const tlCornerField: TerrainField = {
      ...createAutumnField(),
      isAutumn: (x, y) => x >= 10 && y >= 10,
    };
    const tlRes = getAutumnGroundTileKey(10, 10, tlCornerField);
    expect(tlRes.key).toBe('tl');
    expect(tlRes.tileId).toBe(TILE_IDS.ground_autumn_tl);

    // Inner corner IN_TL: only NW diagonal is not autumn
    const inTlField: TerrainField = {
      ...createAutumnField(),
      isAutumn: (x, y) => !(x === 9 && y === 9),
    };
    const inTlRes = getAutumnGroundTileKey(10, 10, inTlField);
    expect(inTlRes.key).toBe('in_tl');
    expect(inTlRes.tileId).toBe(TILE_IDS.ground_autumn_in_tl);
  });

  it('spawns tall_grass_autumn tiles and entities deterministically in autumn chunks', () => {
    const field = createAutumnField();
    const terrain = generateChunkTerrain(0, 0, field, false, false, false, false);

    // Terrain grid should be TERRAIN.AUTUMN
    expect(terrain.terrainGrid[5][5]).toBe(TERRAIN.AUTUMN);

    const tallGrass = generateChunkTallGrass(
      0,
      0,
      field,
      terrain.terrainGrid,
      terrain.tileIdGrid,
      []
    );

    // Ensure tall grass entities can be generated and have isAutumn = true
    if (tallGrass.length > 0) {
      for (const tg of tallGrass) {
        expect(tg.isAutumn).toBe(true);
        expect(tg.isDark).toBe(false);
      }
      // Check that at least one tile was marked with TILE_IDS.tall_grass_autumn
      const hasAutumnGrassTile = terrain.tileIdGrid.some((row) =>
        row.some((tid) => tid === TILE_IDS.tall_grass_autumn)
      );
      expect(hasAutumnGrassTile).toBe(true);
    }
  });

  it('validates autumn river and lake water animated assets in manifest and on disk', () => {
    const manifestPath = path.resolve(__dirname, '../public/assets/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const waterKeys = [
      'water_autumn_pure',
      'water_autumn_top',
      'water_autumn_bot',
      'water_autumn_left',
      'water_autumn_right',
      'water_autumn_tl',
      'water_autumn_tr',
      'water_autumn_bl',
      'water_autumn_br',
      'water_autumn_in_tl',
      'water_autumn_in_tr',
      'water_autumn_in_bl',
      'water_autumn_in_br',
      'water_autumn_curve',
    ];

    for (const key of waterKeys) {
      expect(manifest).toHaveProperty(key);
      expect(manifest[key]).toBe(`/assets/biomes/autumn/${key}.png`);
      const fullPath = path.resolve(__dirname, `../public${manifest[key]}`);
      expect(fs.existsSync(fullPath)).toBe(true);
    }

    expect(TILE_IDS.water_autumn_pure).toBe(750);
    expect(TILE_IDS.water_autumn_top).toBe(751);
    expect(TILE_IDS.water_autumn_curve).toBe(763);
    expect(isAutumnTile(TILE_IDS.water_autumn_pure)).toBe(true);
    expect(isAutumnTile(TILE_IDS.water_autumn_top)).toBe(true);
    expect(isAutumnTile(TILE_IDS.water_autumn_curve)).toBe(true);
  });

  it('resolves autumn river and lake water autotiles with autumn banks', () => {
    // Water surrounded by water in autumn -> water_autumn_pure
    const lakeField: TerrainField = {
      ...createAutumnField(),
      isWater: () => true,
      isWaterOrBridge: () => true,
    };
    const pureWaterRes = getWaterTileKey(10, 10, lakeField);
    expect(pureWaterRes.tileId).toBe(TILE_IDS.water_autumn_pure);

    // Water bordering land to the North in autumn -> water_autumn_top
    const lakeTopField: TerrainField = {
      ...createAutumnField(),
      isWater: (x, y) => y >= 10,
      isWaterOrBridge: (x, y) => y >= 10,
    };
    const topWaterRes = getWaterTileKey(10, 10, lakeTopField);
    expect(topWaterRes.tileId).toBe(TILE_IDS.water_autumn_top);

    // Water bordering land to the West in autumn -> water_autumn_left
    const lakeLeftField: TerrainField = {
      ...createAutumnField(),
      isWater: (x, y) => x >= 10,
      isWaterOrBridge: (x, y) => x >= 10,
    };
    const leftWaterRes = getWaterTileKey(10, 10, lakeLeftField);
    expect(leftWaterRes.tileId).toBe(TILE_IDS.water_autumn_left);
  });
});
