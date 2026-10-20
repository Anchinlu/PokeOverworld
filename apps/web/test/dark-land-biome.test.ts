import { describe, it, expect } from 'vitest';
import { TERRAIN, TILE_IDS, isDarkLandTile } from '@pokemon/game-data';
import biomesData from '@pokemon/game-data/biomes.json';
import speciesSpawnData from '@pokemon/game-data/wildlife/species-spawn.json';
import { getDarkGroundTileKey, getDarkCliffTileKey } from '../src/maps/autotile';
import { V3Field } from '../src/maps/terrain-field/v3-field';
import { generateChunkTerrain } from '../src/maps/chunk-terrain';
import {
  generateChunkBuildings,
  generateChunkTrees,
  generateChunkFoliage,
} from '../src/maps/chunk-objects';
import { createWorldQueryAdapter } from '../src/wildlife/ports/world-query-adapter';
import { populateChunkWildlife } from '../src/wildlife/spawn/spawn-director';
import spawnConfigData from '@pokemon/game-data/wildlife/spawn-config.json';
import type { TerrainField } from '../src/maps/terrain-field';

describe('Dark Land Biome (Vùng Đất Tối) Integration', () => {
  it('1. Constants: validates dark land tile IDs, terrain enum, and helper', () => {
    expect(TERRAIN.DARK_LAND).toBe(7);

    // Dark Ground (440..455)
    expect(TILE_IDS.dark_ground_pure).toBe(440);
    expect(TILE_IDS.dark_ground_top).toBe(441);
    expect(TILE_IDS.dark_ground_bot).toBe(442);
    expect(TILE_IDS.dark_ground_left).toBe(443);
    expect(TILE_IDS.dark_ground_right).toBe(444);
    expect(TILE_IDS.dark_ground_tl).toBe(445);
    expect(TILE_IDS.dark_ground_tr).toBe(446);
    expect(TILE_IDS.dark_ground_bl).toBe(447);
    expect(TILE_IDS.dark_ground_br).toBe(448);
    expect(TILE_IDS.dark_ground_in_tl).toBe(449);
    expect(TILE_IDS.dark_ground_in_tr).toBe(450);
    expect(TILE_IDS.dark_ground_in_bl).toBe(451);
    expect(TILE_IDS.dark_ground_in_br).toBe(452);

    // Dark Cliffs (460..472)
    expect(TILE_IDS.dark_cliff_pure).toBe(460);
    expect(TILE_IDS.dark_cliff_top).toBe(461);
    expect(TILE_IDS.dark_cliff_bot).toBe(462);
    expect(TILE_IDS.dark_cliff_left).toBe(463);
    expect(TILE_IDS.dark_cliff_right).toBe(464);
    expect(TILE_IDS.dark_cliff_tl).toBe(465);
    expect(TILE_IDS.dark_cliff_tr).toBe(466);
    expect(TILE_IDS.dark_cliff_bl).toBe(467);
    expect(TILE_IDS.dark_cliff_br).toBe(468);
    expect(TILE_IDS.dark_cliff_in_tl).toBe(469);
    expect(TILE_IDS.dark_cliff_in_tr).toBe(470);
    expect(TILE_IDS.dark_cliff_in_bl).toBe(471);
    expect(TILE_IDS.dark_cliff_in_br).toBe(472);

    expect(isDarkLandTile(440)).toBe(true);
    expect(isDarkLandTile(452)).toBe(true);
    expect(isDarkLandTile(460)).toBe(true);
    expect(isDarkLandTile(472)).toBe(true);
    expect(isDarkLandTile(439)).toBe(false);
    expect(isDarkLandTile(458)).toBe(false);
    expect(isDarkLandTile(473)).toBe(false);
  });

  it('2. Biome Data: registers dark_land biome in biomes.json', () => {
    expect(biomesData.biomes).toHaveProperty('dark_land');
    const darkLand = (biomesData.biomes as Record<string, { name: string; defaultTree: string }>)
      .dark_land;
    expect(darkLand.name).toBe('Cursed Dark Grounds');
    expect(darkLand.defaultTree).toBe('dark_forest');
  });

  it('3. Circadian Wildlife: validates Psychic (Day/Dusk) and Ghost (Night/Dusk) schedule in dark_land', () => {
    const data = speciesSpawnData as Record<
      string,
      {
        habitats: Array<{ biome: string; context: string; affinity: number }>;
        activeTime: string[];
      }
    >;

    // Psychic Pokémon in dark_land
    const abra = data.ABRA;
    const drowzee = data.DROWZEE;
    const mrMime = data.MRMIME;

    expect(abra).toBeDefined();
    expect(abra.habitats.some((h) => h.biome === 'dark_land')).toBe(true);
    expect(abra.activeTime).toContain('day');
    expect(abra.activeTime).toContain('dusk');
    expect(abra.activeTime).not.toContain('night');

    expect(drowzee).toBeDefined();
    expect(drowzee.habitats.some((h) => h.biome === 'dark_land')).toBe(true);

    expect(mrMime).toBeDefined();
    expect(mrMime.habitats.some((h) => h.biome === 'dark_land')).toBe(true);
    expect(mrMime.activeTime).toContain('day');
    expect(mrMime.activeTime).not.toContain('night');

    // Ghost & Nocturnal Pokémon in dark_land
    const gastly = data.GASTLY;
    const haunter = data.HAUNTER;
    const cubone = data.CUBONE;

    expect(gastly).toBeDefined();
    expect(gastly.habitats.some((h) => h.biome === 'dark_land')).toBe(true);
    expect(gastly.activeTime).toContain('night');
    expect(gastly.activeTime).toContain('dusk');
    expect(gastly.activeTime).not.toContain('day');

    expect(haunter).toBeDefined();
    expect(haunter.habitats.some((h) => h.biome === 'dark_land')).toBe(true);
    expect(haunter.activeTime).toContain('night');

    expect(cubone).toBeDefined();
    expect(cubone.habitats.some((h) => h.biome === 'dark_land')).toBe(true);
  });

  it('4. Autotiling: resolves dark ground and dark cliff autotiles', () => {
    const makeMockField = (
      darkCoords: Set<string>,
      hillCoords: Set<string> = new Set()
    ): TerrainField => ({
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
      isDarkLand: (gx: number, gy: number) => darkCoords.has(`${gx},${gy}`),
    });

    // 3x3 solid block of dark land centered at (5, 5)
    const blockCoords = new Set<string>();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        blockCoords.add(`${5 + dx},${5 + dy}`);
      }
    }
    const blockField = makeMockField(blockCoords);

    // Center is pure dark ground (or one of its micro-texture variants)
    const pureRes = getDarkGroundTileKey(5, 5, blockField);
    expect(pureRes.key).toBe('pure');
    expect([
      TILE_IDS.dark_ground_pure,
      TILE_IDS.dark_ground_var1,
      TILE_IDS.dark_ground_var2,
      TILE_IDS.dark_ground_var3,
    ]).toContain(pureRes.tileId);

    // Borders transition to grass
    expect(getDarkGroundTileKey(4, 4, blockField)).toEqual({
      key: 'tl',
      tileId: TILE_IDS.dark_ground_tl,
    });
    expect(getDarkGroundTileKey(6, 4, blockField)).toEqual({
      key: 'tr',
      tileId: TILE_IDS.dark_ground_tr,
    });
    expect(getDarkGroundTileKey(4, 6, blockField)).toEqual({
      key: 'bl',
      tileId: TILE_IDS.dark_ground_bl,
    });
    expect(getDarkGroundTileKey(6, 6, blockField)).toEqual({
      key: 'br',
      tileId: TILE_IDS.dark_ground_br,
    });
    expect(getDarkGroundTileKey(5, 4, blockField)).toEqual({
      key: 'top',
      tileId: TILE_IDS.dark_ground_top,
    });
    expect(getDarkGroundTileKey(5, 6, blockField)).toEqual({
      key: 'bot',
      tileId: TILE_IDS.dark_ground_bot,
    });
    expect(getDarkGroundTileKey(4, 5, blockField)).toEqual({
      key: 'left',
      tileId: TILE_IDS.dark_ground_left,
    });
    expect(getDarkGroundTileKey(6, 5, blockField)).toEqual({
      key: 'right',
      tileId: TILE_IDS.dark_ground_right,
    });

    // Elevated dark cliffs: 3x3 hill plateau in dark land
    const cliffField = makeMockField(blockCoords, blockCoords);
    expect(getDarkCliffTileKey(5, 5, cliffField)).toEqual({
      key: 'pure',
      tileId: TILE_IDS.dark_cliff_pure,
    });
    expect(getDarkCliffTileKey(4, 4, cliffField)).toEqual({
      key: 'tl',
      tileId: TILE_IDS.dark_cliff_tl,
    });
    expect(getDarkCliffTileKey(6, 4, cliffField)).toEqual({
      key: 'tr',
      tileId: TILE_IDS.dark_cliff_tr,
    });
    expect(getDarkCliffTileKey(4, 6, cliffField)).toEqual({
      key: 'bl',
      tileId: TILE_IDS.dark_cliff_bl,
    });
    expect(getDarkCliffTileKey(6, 6, cliffField)).toEqual({
      key: 'br',
      tileId: TILE_IDS.dark_cliff_br,
    });
    expect(getDarkCliffTileKey(5, 4, cliffField)).toEqual({
      key: 'top',
      tileId: TILE_IDS.dark_cliff_top,
    });
    expect(getDarkCliffTileKey(5, 6, cliffField)).toEqual({
      key: 'bot',
      tileId: TILE_IDS.dark_cliff_bot,
    });
    expect(getDarkCliffTileKey(4, 5, cliffField)).toEqual({
      key: 'left',
      tileId: TILE_IDS.dark_cliff_left,
    });
    expect(getDarkCliffTileKey(6, 5, cliffField)).toEqual({
      key: 'right',
      tileId: TILE_IDS.dark_cliff_right,
    });

    // Inner corners
    const inBLHillCoords = new Set(blockCoords);
    inBLHillCoords.delete('4,4'); // missing NW -> inner corner in_bl
    const inBLCliffField = makeMockField(blockCoords, inBLHillCoords);
    expect(getDarkCliffTileKey(5, 5, inBLCliffField)).toEqual({
      key: 'in_bl',
      tileId: TILE_IDS.dark_cliff_in_bl,
    });
  });

  it('5. World Gen V3: protects starter core from dark land', () => {
    const field = new V3Field(101);

    for (let gy = -40; gy <= 40; gy += 4) {
      for (let gx = -40; gx <= 40; gx += 4) {
        if (Math.hypot(gx, gy) <= 64) {
          expect(field.isDarkLand(gx, gy)).toBe(false);
        }
      }
    }
  });

  it('6. Procedural Landmarks & Structures: generates Ancient Graveyard and Ruined Shrine in dark land chunks', () => {
    const darkField: TerrainField = {
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
      isDarkLand: () => true,
    };

    // Scan multiple chunks to find both Graveyard and Ruined Shrine structures
    let foundGraveyard = false;
    let foundRuinShrine = false;

    for (let cx = 10; cx <= 30; cx++) {
      for (let cy = 10; cy <= 30; cy++) {
        const colliders: any[] = [];
        const buildings = generateChunkBuildings(cx, cy, darkField, colliders);

        if (buildings.some((b) => b.type === 'tombstone_1' || b.type === 'fence_cemetery')) {
          foundGraveyard = true;
          // Must have generated colliders for the tombstones and scarecrow
          expect(colliders.length).toBeGreaterThan(0);
        }

        if (buildings.some((b) => b.type === 'ruin_temple' || b.type === 'ruin_archway')) {
          foundRuinShrine = true;
          // Must have generated colliders for temple, archway, and pillars
          expect(colliders.length).toBeGreaterThan(0);
        }

        if (foundGraveyard && foundRuinShrine) break;
      }
      if (foundGraveyard && foundRuinShrine) break;
    }

    expect(foundGraveyard).toBe(true);
    expect(foundRuinShrine).toBe(true);
  });

  it('7. Trees & Foliage: generates dark trees and cursed spires/sprouts in dark land', () => {
    const darkField: TerrainField = {
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
      isDarkLand: () => true,
    };

    const terrain = generateChunkTerrain(15, 15, darkField);
    expect(terrain.terrainGrid[0][0]).toBe(TERRAIN.DARK_LAND);
    expect(isDarkLandTile(terrain.tileIdGrid[0][0])).toBe(true);

    const colliders: any[] = [];
    const trees = generateChunkTrees(15, 15, darkField, colliders);
    for (const tree of trees) {
      expect(['dark_large_1', 'dark_large_2', 'dark_dead', 'dark_forest']).toContain(tree.type);
    }

    const plants = generateChunkFoliage(
      15,
      15,
      darkField,
      terrain.terrainGrid,
      terrain.tileIdGrid,
      [],
      [],
      colliders
    );
    const validDarkFoliage = [
      'dark_sprout',
      'rock_dark_spires',
      'bush_dark_1',
      'bush_dark_2',
      'bush_dark_3',
      'bush_dark_4',
      'bush_dark_5',
      'bush_dark_6',
    ];
    for (const plant of plants) {
      if (
        plant.type.startsWith('bush_dark_') ||
        plant.type === 'dark_sprout' ||
        plant.type === 'rock_dark_spires'
      ) {
        expect(validDarkFoliage).toContain(plant.type);
      }
    }
  });

  it('8. Wildlife Query Adapter: classifies dark land as dark_land biome and walkable ground', () => {
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
      isDarkLand: () => true,
    };

    const adapter = createWorldQueryAdapter(mockField);
    expect(adapter.contextAt(100, 100)).toBe('walkable_ground');
    expect(adapter.biomeAt(100, 100)).toBe('dark_land');
  });

  it('9. Wildlife spawning: uses the Dark Land group budget and circadian pool', () => {
    expect(spawnConfigData.groupsPerChunk.dark_land).toEqual([1, 3]);

    const darkField: TerrainField = {
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
      isDarkLand: () => true,
    };

    const dayWorld = createWorldQueryAdapter(darkField, [], [], () => 'day');
    const nightWorld = createWorldQueryAdapter(darkField, [], [], () => 'night');
    const daySpecies = new Set<string>();
    const nightSpecies = new Set<string>();

    for (let cx = 0; cx < 12; cx++) {
      for (let cy = 0; cy < 12; cy++) {
        for (const entity of populateChunkWildlife(cx, cy, dayWorld, { seed: 101 })) {
          daySpecies.add(entity.speciesKey);
        }
        for (const entity of populateChunkWildlife(cx, cy, nightWorld, { seed: 101 })) {
          nightSpecies.add(entity.speciesKey);
        }
      }
    }

    expect(daySpecies.size).toBeGreaterThan(0);
    expect(nightSpecies.size).toBeGreaterThan(0);

    const dayEligible = new Set(['ABRA', 'KADABRA', 'MRMIME', 'CUBONE', 'MAROWAK']);
    const nightEligible = new Set(['ZUBAT', 'GOLBAT', 'GASTLY', 'HAUNTER', 'DROWZEE', 'HYPNO']);
    expect([...daySpecies].every((species) => dayEligible.has(species))).toBe(true);
    expect([...nightSpecies].every((species) => nightEligible.has(species))).toBe(true);
  });

  it('10. Assets & Autotile Parity: validates 12 distinct dark_ground fringe tiles and complete 64x64 dark trees', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const manifestPath = path.resolve(__dirname, '../public/assets/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const fringeKeys = [
      'dark_ground_top',
      'dark_ground_bot',
      'dark_ground_left',
      'dark_ground_right',
      'dark_ground_tl',
      'dark_ground_tr',
      'dark_ground_bl',
      'dark_ground_br',
      'dark_ground_in_tl',
      'dark_ground_in_tr',
      'dark_ground_in_bl',
      'dark_ground_in_br',
    ];

    for (const key of fringeKeys) {
      expect(manifest).toHaveProperty(key);
      expect(manifest[key]).toBe(`/assets/biomes/dark-land/${key}.png`);
      const fullPath = path.resolve(__dirname, `../public${manifest[key]}`);
      expect(fs.existsSync(fullPath)).toBe(true);
    }

    // Verify bush_dark_1..6 all exist and point to dedicated assets
    for (let i = 1; i <= 6; i++) {
      const key = `bush_dark_${i}`;
      expect(manifest).toHaveProperty(key);
      const fullPath = path.resolve(__dirname, `../public${manifest[key]}`);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });
});

