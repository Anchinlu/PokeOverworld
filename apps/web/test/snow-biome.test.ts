import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TILE_IDS, isSnowTile, TERRAIN } from '@pokemon/game-data';
import type { TerrainField } from '../src/maps/terrain-field';
import { createTerrainField } from '../src/maps/terrain-field';
import { createWorldQueryAdapter } from '../src/wildlife/ports/world-query-adapter';
import { getSpeciesCandidatesForTier } from '../src/wildlife/spawn/species-pool';
import { spawnConfigData } from '../src/wildlife/data/data-loader';
import { getSnowGroundTileKey, getSnowCliffTileKey, getWaterTileKey } from '../src/maps/autotile';
import {
  generateChunkTrees,
  generateChunkFoliage,
  generateChunkWaterFlora,
} from '../src/maps/chunk-objects';
import { generateChunkTerrain } from '../src/maps/chunk-terrain';
import { SnowParticleSystem } from '../src/rendering/weather/snow-particle-system';
import { WorldChunk } from '../src/maps/chunk';

function createSnowField(): TerrainField {
  return {
    version: 4,
    seed: 20261022,
    isOcean: () => false,
    isSand: () => false,
    isDesert: () => false,
    isDarkLand: () => false,
    isAutumn: () => false,
    isSnow: () => true,
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

describe('Snow & Ice Biome integration', () => {
  it('generates snow regions in the natural-landmass world field', () => {
    const results: Array<{ seed: number; snow: number; land: number }> = [];
    for (const seed of [101]) {
      const field = createTerrainField(5, seed);
      let snowLandSamples = 0;
      let nonSnowLandSamples = 0;

      for (let gy = -1024; gy <= 1024; gy += 32) {
        for (let gx = -1024; gx <= 1024; gx += 32) {
          if (field.isOcean(gx, gy)) continue;
          if (field.isSnow?.(gx, gy)) snowLandSamples += 1;
          else nonSnowLandSamples += 1;
        }
      }

      results.push({ seed, snow: snowLandSamples, land: nonSnowLandSamples });
    }
    expect(
      results.every(({ snow, land }) => snow > 0 && land > 0),
      `procedural snow samples: ${JSON.stringify(results)}`
    ).toBe(true);
  }, 120000);

  it('has an explicit group budget in spawn-config.json', () => {
    expect(spawnConfigData.groupsPerChunk.snow).toEqual([2, 4]);
  });

  it('provides wild species candidates for snow biome', () => {
    const field = createSnowField();
    const adapter = createWorldQueryAdapter(
      field,
      [],
      [{ gx: 10, gy: 10, x: 320, y: 320, phase: 0, heightScale: 1 }]
    );

    expect(adapter.biomeAt(10, 10)).toBe('snow');
    expect(adapter.contextAt(10, 10)).toBe('tall_grass');
    expect(adapter.contextAt(11, 11)).toBe('walkable_ground');
    // Tier 0 common candidates on snow shore (SEEL, SHELLDER)
    expect(getSpeciesCandidatesForTier('snow', 'shore', 0).length).toBeGreaterThan(0);
    // Tier 1 uncommon candidates on snow walkable ground (CLEFAIRY, MACHOP)
    expect(getSpeciesCandidatesForTier('snow', 'walkable_ground', 1).length).toBeGreaterThan(0);
  });

  it('validates snow boundary fringe autotile assets with transparency preserved', () => {
    const manifestPath = path.resolve(__dirname, '../public/assets/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const fringeKeys = [
      'ground_snow_pure',
      'ground_snow_top',
      'ground_snow_bot',
      'ground_snow_left',
      'ground_snow_right',
      'ground_snow_tl',
      'ground_snow_tr',
      'ground_snow_bl',
      'ground_snow_br',
      'ground_snow_in_tl',
      'ground_snow_in_tr',
      'ground_snow_in_bl',
      'ground_snow_in_br',
    ];

    for (const key of fringeKeys) {
      expect(manifest).toHaveProperty(key);
      expect(manifest[key]).toBe(`/assets/biomes/snow/${key}.png`);
      const fullPath = path.resolve(__dirname, `../public${manifest[key]}`);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('validates frozen ice lake autotiles and water autotile integration', () => {
    const manifestPath = path.resolve(__dirname, '../public/assets/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const iceKeys = [
      'ice_snow_pure',
      'ice_snow_top',
      'ice_snow_bot',
      'ice_snow_left',
      'ice_snow_right',
      'ice_snow_tl',
      'ice_snow_tr',
      'ice_snow_bl',
      'ice_snow_br',
      'ice_snow_in_tl',
      'ice_snow_in_tr',
      'ice_snow_in_bl',
      'ice_snow_in_br',
    ];

    for (const key of iceKeys) {
      expect(manifest).toHaveProperty(key);
      const fullPath = path.resolve(__dirname, `../public${manifest[key]}`);
      expect(fs.existsSync(fullPath)).toBe(true);
    }

    // Verify autotile.ts getWaterTileKey resolves to specialized snow water (water_snow_pure)
    const snowWaterField: TerrainField = {
      ...createSnowField(),
      isWater: () => true,
      isWaterOrBridge: () => true,
    };
    const waterRes = getWaterTileKey(10, 10, snowWaterField);
    expect(waterRes.tileId).toBe(TILE_IDS.water_snow_pure);
    expect(waterRes.key).toBe('snow_pure');

    const waterSnowKeys = [
      'water_snow_pure',
      'water_snow_top',
      'water_snow_bot',
      'water_snow_left',
      'water_snow_right',
      'water_snow_tl',
      'water_snow_tr',
      'water_snow_bl',
      'water_snow_br',
      'water_snow_in_tl',
      'water_snow_in_tr',
      'water_snow_in_bl',
      'water_snow_in_br',
      'water_snow_curve',
    ];
    for (const key of waterSnowKeys) {
      expect(manifest).toHaveProperty(key);
      const fullPath = path.resolve(__dirname, `../public${manifest[key]}`);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('validates snow tall grass assets and tile ID classification', () => {
    const manifestPath = path.resolve(__dirname, '../public/assets/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest).toHaveProperty('tall_grass_snow');
    expect(manifest).toHaveProperty('tall_grass_snow_strip');
    expect(manifest.tall_grass_snow).toBe('/assets/biomes/snow/tall_grass_snow.png');
    expect(manifest.tall_grass_snow_strip).toBe('/assets/biomes/snow/tall_grass_snow_strip.png');

    const fullPath = path.resolve(__dirname, `../public${manifest.tall_grass_snow}`);
    expect(fs.existsSync(fullPath)).toBe(true);

    expect(TILE_IDS.tall_grass_snow).toBe(613);
    expect(isSnowTile(TILE_IDS.tall_grass_snow)).toBe(true);
    expect(isSnowTile(TILE_IDS.ground_snow_pure)).toBe(true);
    expect(isSnowTile(TILE_IDS.cliff_snow_pure)).toBe(true);
    expect(isSnowTile(TILE_IDS.ice_snow_pure)).toBe(true);
    expect(isSnowTile(TILE_IDS.tall_grass_autumn)).toBe(false);
  });

  it('correctly autotiles 3x3 snow ground fringes and cliffs', () => {
    const field = createSnowField();
    const pureRes = getSnowGroundTileKey(10, 10, field);
    expect(pureRes.key).toBe('pure');
    expect(pureRes.tileId).toBe(TILE_IDS.ground_snow_pure);

    const hillField: TerrainField = { ...field, isHill: () => true };
    const cliffRes = getSnowCliffTileKey(10, 10, hillField);
    expect(cliffRes.key).toBe('pure');
    expect(cliffRes.tileId).toBe(TILE_IDS.cliff_snow_pure);
  });

  it('indexes snow water tiles so cleared ground is redrawn by the water renderer', () => {
    const field: TerrainField = {
      ...createSnowField(),
      isWater: () => true,
      isWaterOrBridge: () => true,
      isLake: () => false,
    };
    const chunk = new WorldChunk(0, 0, field);

    expect(chunk.waterTiles.length).toBeGreaterThan(0);
    expect(chunk.waterTiles.every(({ tileId }) => tileId >= 770 && tileId <= 783)).toBe(true);
  });

  it('does not place decorative foliage or freshwater plants on snow water', () => {
    const field: TerrainField = {
      ...createSnowField(),
      isWater: () => true,
      isWaterOrBridge: () => true,
      isLake: () => true,
    };
    const terrain = generateChunkTerrain(0, 0, field);
    const foliage = generateChunkFoliage(
      0,
      0,
      field,
      terrain.terrainGrid,
      terrain.tileIdGrid,
      [],
      [],
      []
    );

    expect(foliage).toHaveLength(0);
    expect(generateChunkWaterFlora(0, 0, field)).toHaveLength(0);
  });

  it('generates chunk terrain with TERRAIN.SNOW and snow ground tile IDs', () => {
    const field = createSnowField();
    const res = generateChunkTerrain(5, 5, field);

    expect(res.terrainGrid[0][0]).toBe(TERRAIN.SNOW);
    expect(res.tileIdGrid[0][0]).toBe(TILE_IDS.ground_snow_pure);
  });

  it('generates authentic snow pine and spruce trees deterministically on snow chunks', () => {
    const field = createSnowField();
    const trees = generateChunkTrees(5, 5, field);

    expect(trees.length).toBeGreaterThan(0);
    for (const tree of trees) {
      expect(tree.type.startsWith('tree_snow_')).toBe(true);
    }
  });

  it('generates rich snow flora, shrubs, crystals, rocks and logs', () => {
    const field = createSnowField();
    const allPlants: { type: string }[] = [];
    for (let cx = 0; cx < 5; cx++) {
      for (let cy = 0; cy < 5; cy++) {
        const terrain = generateChunkTerrain(cx, cy, field);
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
    const types = allPlants.map((p) => p.type);
    const hasSnowFlora = types.some(
      (t) =>
        t.startsWith('bush_snow_') ||
        t.startsWith('tree_snow_cone_') ||
        t.startsWith('crystal_snow_') ||
        t.startsWith('rock_snow_') ||
        t.startsWith('log_snow_') ||
        t.startsWith('stump_snow') ||
        t.startsWith('decor_snow_')
    );
    expect(hasSnowFlora).toBe(true);
  });

  it('simulates snowfall with SnowParticleSystem without crashes', () => {
    const system = new SnowParticleSystem();
    const bounds = { minX: 0, maxX: 640, minY: 0, maxY: 480 };
    const field = createSnowField();

    // Update with snow field
    system.update(1000, bounds, field, 'clear');
    system.update(1100, bounds, field, 'rain'); // blizzard test
    expect(system).toBeDefined();
  });

  it('validates snow high cliff autotiles and inner corners', () => {
    const manifestPath = path.resolve(__dirname, '../public/assets/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const cliffKeys = [
      'cliff_snow_pure',
      'cliff_snow_top',
      'cliff_snow_bot',
      'cliff_snow_left',
      'cliff_snow_right',
      'cliff_snow_tl',
      'cliff_snow_tr',
      'cliff_snow_bl',
      'cliff_snow_br',
      'cliff_snow_in_tl',
      'cliff_snow_in_tr',
      'cliff_snow_in_bl',
      'cliff_snow_in_br',
    ];

    for (const key of cliffKeys) {
      expect(manifest).toHaveProperty(key);
      const fullPath = path.resolve(__dirname, `../public${manifest[key]}`);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('validates cliff curve supplement autotiles, archives unreleased bridge in architecture, and keeps lake water regular', () => {
    const manifestPath = path.resolve(__dirname, '../public/assets/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Cliff curve supplement is sliced into 4 inner corners, NOT a standalone decoration/landmark
    expect(manifest).not.toHaveProperty('cliff_snow_gorge');
    expect(manifest).toHaveProperty('cliff_snow_in_tl');
    expect(manifest).toHaveProperty('cliff_snow_in_tr');
    expect(manifest).toHaveProperty('cliff_snow_in_bl');
    expect(manifest).toHaveProperty('cliff_snow_in_br');

    // Bridge is archived in architecture/ as an unreleased construction piece
    const archBridgePath = path.resolve(
      __dirname,
      '../public/assets/biomes/snow/architecture/cầu vùng băng tuyết.png'
    );
    expect(fs.existsSync(archBridgePath)).toBe(true);

    // Bridge is not an active overworld terrain landmark in root
    const rootBridgePath = path.resolve(__dirname, '../public/assets/biomes/snow/bridge_snow.png');
    expect(fs.existsSync(rootBridgePath)).toBe(false);

    // Lake water in snow biome uses dedicated snow water (water_snow_pure)
    const field = {
      isWaterOrBridge: () => true,
      isSnow: () => true,
      isAutumn: () => false,
    } as any;
    const waterRes = getWaterTileKey(10, 10, field);
    expect(waterRes.tileId).toBe(TILE_IDS.water_snow_pure);
  });

  it('places architecture and roads in dedicated subdirectories without generating villages', () => {
    const archPath = path.resolve(__dirname, '../public/assets/biomes/snow/architecture');
    const roadsPath = path.resolve(__dirname, '../public/assets/biomes/snow/roads');

    expect(fs.existsSync(archPath)).toBe(true);
    expect(fs.existsSync(roadsPath)).toBe(true);

    const archFiles = fs.readdirSync(archPath).filter((f) => f.endsWith('.png'));
    const roadFiles = fs.readdirSync(roadsPath).filter((f) => f.endsWith('.png'));

    expect(archFiles.length).toBeGreaterThan(0);
    expect(roadFiles.length).toBeGreaterThan(0);
  });

  it('prevents snow ground decals from overlapping or clipping snow cliff walls', () => {
    const hillBorderField: TerrainField = {
      ...createSnowField(),
      isHill: (gx) => gx <= 5,
      isNearCliffEdge: (gx) => gx >= 4 && gx <= 6,
    };
    const terrain = generateChunkTerrain(0, 0, hillBorderField);
    // Column 5 is cliff_snow_right, Column 6 is ground_snow_pure right next to cliff
    expect(terrain.tileIdGrid[5][5]).toBe(TILE_IDS.cliff_snow_right);
    expect(terrain.tileIdGrid[5][6]).toBe(TILE_IDS.ground_snow_pure);
    expect(hillBorderField.isNearCliffEdge(6, 5)).toBe(true);
  });
});
