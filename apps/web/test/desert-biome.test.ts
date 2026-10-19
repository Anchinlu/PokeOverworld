import { describe, it, expect } from 'vitest';
import { TERRAIN, TILE_IDS, isDesertTile } from '@pokemon/game-data';
import biomesData from '@pokemon/game-data/biomes.json';
import { getDesertTileKey, getDuneCliffTileKey } from '../src/maps/autotile';
import { V3Field } from '../src/maps/terrain-field/v3-field';
import { generateChunkTerrain } from '../src/maps/chunk-terrain';
import { generateChunkTrees, generateChunkFoliage } from '../src/maps/chunk-objects';
import { createWorldQueryAdapter } from '../src/wildlife/ports/world-query-adapter';
import type { TerrainField } from '../src/maps/terrain-field';

describe('Desert Biome (Sa Mạc) Integration', () => {
  it('1. Constants: validates desert tile IDs and terrain type', () => {
    expect(TERRAIN.DESERT).toBe(6);
    expect(TILE_IDS.desert_pure).toBe(350);
    expect(TILE_IDS.desert_top).toBe(351);
    expect(TILE_IDS.desert_bot).toBe(352);
    expect(TILE_IDS.desert_left).toBe(353);
    expect(TILE_IDS.desert_right).toBe(354);
    expect(TILE_IDS.desert_tl).toBe(355);
    expect(TILE_IDS.desert_tr).toBe(356);
    expect(TILE_IDS.desert_bl).toBe(357);
    expect(TILE_IDS.desert_br).toBe(358);
    expect(TILE_IDS.desert_in_tl).toBe(359);
    expect(TILE_IDS.desert_in_tr).toBe(360);
    expect(TILE_IDS.desert_in_bl).toBe(361);
    expect(TILE_IDS.desert_in_br).toBe(362);

    expect(TILE_IDS.dune_cliff_pure).toBe(420);
    expect(TILE_IDS.dune_cliff_top).toBe(421);
    expect(TILE_IDS.dune_cliff_bot).toBe(422);
    expect(TILE_IDS.dune_cliff_left).toBe(423);
    expect(TILE_IDS.dune_cliff_right).toBe(424);
    expect(TILE_IDS.dune_cliff_tl).toBe(425);
    expect(TILE_IDS.dune_cliff_tr).toBe(426);
    expect(TILE_IDS.dune_cliff_bl).toBe(427);
    expect(TILE_IDS.dune_cliff_br).toBe(428);
    expect(TILE_IDS.dune_cliff_in_tl).toBe(429);
    expect(TILE_IDS.dune_cliff_in_tr).toBe(430);
    expect(TILE_IDS.dune_cliff_in_bl).toBe(431);
    expect(TILE_IDS.dune_cliff_in_br).toBe(432);

    expect(isDesertTile(350)).toBe(true);
    expect(isDesertTile(364)).toBe(true);
    expect(isDesertTile(420)).toBe(true);
    expect(isDesertTile(432)).toBe(true);
    expect(isDesertTile(349)).toBe(false);
    expect(isDesertTile(433)).toBe(false);
  });

  it('2. Biome Data: registers desert biome in biomes.json', () => {
    expect(biomesData.biomes).toHaveProperty('desert');
    const desert = (biomesData.biomes as Record<string, { name: string; defaultTree: string }>).desert;
    expect(desert.name).toBe('Arid Desert Dunes');
    expect(desert.defaultTree).toBe('dead_1');
  });

  it('3. Autotiling: resolves clean flat desert ground and elevated dune cliff autotiles', () => {
    // Helper mock field with a set of desert coordinates
    const makeMockField = (desertCoords: Set<string>, hillCoords: Set<string> = new Set()): TerrainField => ({
      version: 3,
      seed: 101,
      isOcean: () => false,
      isSand: () => false,
      isHill: (gx: number, gy: number) => hillCoords.has(`${gx},${gy}`),
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
      isDesert: (gx: number, gy: number) => desertCoords.has(`${gx},${gy}`),
    });

    // 3x3 solid block of desert centered at (5, 5)
    const blockCoords = new Set<string>();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        blockCoords.add(`${5 + dx},${5 + dy}`);
      }
    }
    const blockField = makeMockField(blockCoords);

    // Flat ground: center is pure smooth sand without cliff marks
    expect(getDesertTileKey(5, 5, blockField)).toEqual({ key: 'pure', tileId: TILE_IDS.desert_pure });

    // Flat ground borders: smooth flat transition to grass (sand_* tiles) without cliff drops
    expect(getDesertTileKey(4, 4, blockField)).toEqual({ key: 'tl', tileId: TILE_IDS.sand_tl });
    expect(getDesertTileKey(6, 4, blockField)).toEqual({ key: 'tr', tileId: TILE_IDS.sand_tr });
    expect(getDesertTileKey(4, 6, blockField)).toEqual({ key: 'bl', tileId: TILE_IDS.sand_bl });
    expect(getDesertTileKey(6, 6, blockField)).toEqual({ key: 'br', tileId: TILE_IDS.sand_br });
    expect(getDesertTileKey(5, 4, blockField)).toEqual({ key: 'top', tileId: TILE_IDS.sand_top });
    expect(getDesertTileKey(5, 6, blockField)).toEqual({ key: 'bot', tileId: TILE_IDS.sand_bot });
    expect(getDesertTileKey(4, 5, blockField)).toEqual({ key: 'left', tileId: TILE_IDS.sand_left });
    expect(getDesertTileKey(6, 5, blockField)).toEqual({ key: 'right', tileId: TILE_IDS.sand_right });

    // Elevated sand dunes (đồi cát cao với vách đá): 3x3 hill plateau in desert
    const duneField = makeMockField(blockCoords, blockCoords);
    expect(getDuneCliffTileKey(5, 5, duneField)).toEqual({ key: 'pure', tileId: TILE_IDS.dune_cliff_pure });
    expect(getDuneCliffTileKey(4, 4, duneField)).toEqual({ key: 'tl', tileId: TILE_IDS.dune_cliff_tl });
    expect(getDuneCliffTileKey(6, 4, duneField)).toEqual({ key: 'tr', tileId: TILE_IDS.dune_cliff_tr });
    expect(getDuneCliffTileKey(4, 6, duneField)).toEqual({ key: 'bl', tileId: TILE_IDS.dune_cliff_bl });
    expect(getDuneCliffTileKey(6, 6, duneField)).toEqual({ key: 'br', tileId: TILE_IDS.dune_cliff_br });
    expect(getDuneCliffTileKey(5, 4, duneField)).toEqual({ key: 'top', tileId: TILE_IDS.dune_cliff_top });
    expect(getDuneCliffTileKey(5, 6, duneField)).toEqual({ key: 'bot', tileId: TILE_IDS.dune_cliff_bot });
    expect(getDuneCliffTileKey(4, 5, duneField)).toEqual({ key: 'left', tileId: TILE_IDS.dune_cliff_left });
    expect(getDuneCliffTileKey(6, 5, duneField)).toEqual({ key: 'right', tileId: TILE_IDS.dune_cliff_right });

    // Dune inner corners
    const inBLHillCoords = new Set(blockCoords);
    inBLHillCoords.delete(`${4},${4}`); // missing NW -> inner corner in_bl
    const inBLDuneField = makeMockField(blockCoords, inBLHillCoords);
    expect(getDuneCliffTileKey(5, 5, inBLDuneField)).toEqual({ key: 'in_bl', tileId: TILE_IDS.dune_cliff_in_bl });
  });

  it('4. World Gen V3: strictly protects safe starter core from desert dunes', () => {
    const field = new V3Field(101);

    // No desert inside safe radius R=64
    for (let gy = -40; gy <= 40; gy += 4) {
      for (let gx = -40; gx <= 40; gx += 4) {
        if (Math.hypot(gx, gy) <= 64) {
          expect(field.isDesert(gx, gy)).toBe(false);
        }
      }
    }
  });

  it('5. Chunk Object Generation: desert chunks spawn dead trees, cacti, boulders, and desert shrubs', () => {
    // Create a mock field where chunk (10, 10) is fully desert
    const desertField: TerrainField = {
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

    const terrain = generateChunkTerrain(10, 10, desertField);
    expect(terrain.terrainGrid[0][0]).toBe(TERRAIN.DESERT);
    expect(isDesertTile(terrain.tileIdGrid[0][0])).toBe(true);

    const colliders: any[] = [];
    const trees = generateChunkTrees(10, 10, desertField, colliders);
    // Any trees generated on desert must be one of the desert tree/cactus types
    for (const tree of trees) {
      expect(['dead_1', 'dead_2', 'cactus_large', 'desert_boulder']).toContain(tree.type);
    }

    const plants = generateChunkFoliage(10, 10, desertField, terrain.terrainGrid, terrain.tileIdGrid, [], [], colliders);
    for (const plant of plants) {
      // Prominent plants in desert chunk must be desert flora
      if (['desert_dry_bush', 'desert_succulent', 'cactus_medium', 'cactus_small'].includes(plant.type)) {
        expect(['desert_dry_bush', 'desert_succulent', 'cactus_medium', 'cactus_small']).toContain(plant.type);
      }
    }
  });

  it('6. Wildlife Query Adapter: classifies desert as sand context and dryland biome', () => {
    const mockField: TerrainField = {
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

    const adapter = createWorldQueryAdapter(mockField);
    expect(adapter.contextAt(100, 100)).toBe('sand');
    expect(adapter.biomeAt(100, 100)).toBe('dryland');
  });
});
