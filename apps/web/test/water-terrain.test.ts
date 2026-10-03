import { describe, it, expect } from 'vitest';
import { TERRAIN, TILE_IDS } from '@pokemon/game-data';
import { WorldChunk } from '../src/maps/chunk';
import { ChunkManager } from '../src/maps/chunk-manager';
import {
  isWaterTile,
  isBridgeTile,
  isRiverTile,
  isLakeTile,
  isOceanTile,
  getLakePlacement,
} from '../src/maps/terrain-rules';
import { isInteriorFreshwater } from '../src/maps/chunk-objects';

describe('Water Terrain, River, Lake & Bridge Systems', () => {
  it('generates water and bridge tiles deterministically', () => {
    const seed = 12345;
    // River at gy = 48 (around chunk cy = 3)
    const chunkA = new WorldChunk(0, 3, seed);
    const chunkB = new WorldChunk(0, 3, seed);

    expect(chunkA.terrainGrid).toEqual(chunkB.terrainGrid);
    expect(chunkA.tileIdGrid).toEqual(chunkB.tileIdGrid);

    // Verify presence of river / bridge in cy=3
    let hasWaterOrBridge = false;
    for (let ly = 0; ly < 16; ly++) {
      for (let lx = 0; lx < 16; lx++) {
        const tid = chunkA.tileIdGrid[ly][lx];
        if (tid >= 700 && tid <= 721) {
          hasWaterOrBridge = true;
          break;
        }
      }
      if (hasWaterOrBridge) break;
    }
    expect(hasWaterOrBridge).toBe(true);
  });

  it('correctly blocks movement on water while allowing movement on bridges', () => {
    const seed = 777;
    const chunkManager = new ChunkManager(seed);

    // Scan for a water tile and a bridge tile in cy=3
    let waterTile: { gx: number; gy: number } | null = null;
    let bridgeTile: { gx: number; gy: number } | null = null;

    for (let gy = 44; gy <= 52; gy++) {
      for (let gx = -10; gx <= 10; gx++) {
        if (isBridgeTile(gx, gy, seed)) {
          bridgeTile = { gx, gy };
        } else if (isWaterTile(gx, gy, seed)) {
          waterTile = { gx, gy };
        }
      }
    }

    expect(waterTile).not.toBeNull();
    expect(bridgeTile).not.toBeNull();

    // Water tile must be IMPASSABLE (not walkable)
    if (waterTile) {
      expect(chunkManager.isWalkable(waterTile.gx, waterTile.gy)).toBe(false);
    }

    // Bridge tile must be WALKABLE (player can cross)
    if (bridgeTile) {
      expect(chunkManager.isWalkable(bridgeTile.gx, bridgeTile.gy)).toBe(true);
    }
  });

  it('ensures no flora, berry bushes, tall grass or trees spawn on water or bridges', () => {
    const testSeeds = [101, 777, 9999];

    for (const seed of testSeeds) {
      // Test chunks spanning valley and river (cx = -1..1, cy = 0..4)
      for (let cy = 0; cy <= 4; cy++) {
        for (let cx = -1; cx <= 1; cx++) {
          const chunk = new WorldChunk(cx, cy, seed);
          const startGX = cx * 16;
          const startGY = cy * 16;

          // Check trees
          for (const tree of chunk.trees) {
            const rootGX = Math.floor((tree.x + 32) / 32);
            const rootGY = Math.floor((tree.y + 112) / 32);
            expect(isWaterTile(rootGX, rootGY, seed)).toBe(false);
            expect(isBridgeTile(rootGX, rootGY, seed)).toBe(false);
          }

          // Check berry bushes
          for (const bush of chunk.berryBushes) {
            expect(isWaterTile(bush.gx, bush.gy, seed)).toBe(false);
            expect(isWaterTile(bush.gx, bush.gy - 1, seed)).toBe(false);
            expect(isBridgeTile(bush.gx, bush.gy, seed)).toBe(false);
          }

          // Check plants / flowers
          for (const plant of chunk.plants) {
            expect(isWaterTile(plant.gx, plant.gy, seed)).toBe(false);
            expect(isBridgeTile(plant.gx, plant.gy, seed)).toBe(false);
          }

          // Check tall grass
          for (const tg of chunk.tallGrass) {
            expect(isWaterTile(tg.gx, tg.gy, seed)).toBe(false);
            expect(isBridgeTile(tg.gx, tg.gy, seed)).toBe(false);
          }
        }
      }
    }
  });

  it('validates Grand Pixel River has 5-tile width and bridge spans the full crossing', () => {
    const seed = 12345;
    // River row 48
    let bridgeCount = 0;
    let riverRowCount = 0;

    for (let gy = 44; gy <= 56; gy++) {
      if (isRiverTile(0, gy, seed)) {
        riverRowCount++;
      }
      for (let gx = -10; gx <= 10; gx++) {
        if (isBridgeTile(gx, gy, seed)) {
          bridgeCount++;
        }
      }
    }

    // Grand River width is 5 tiles
    expect(riverRowCount).toBe(5);
    // Bridge spans 3 columns x 5 rows = 15 tiles
    expect(bridgeCount).toBe(15);
  });

  it('validates presence of diverse lake variants across cycles', () => {
    const seed = 12345;
    const variantsFound = new Set<number>();

    for (let k = 0; k < 30; k++) {
      const placement = getLakePlacement(k, seed);
      if (placement) {
        variantsFound.add(placement.variant);
      }
    }

    // Should generate multiple distinct variants (small, medium, large, elongated)
    expect(variantsFound.size).toBeGreaterThanOrEqual(3);
  });

  it('generates freshwater flora (water lilies & lotus pads) deterministically and exclusively on river and lake water', () => {
    const seed = 12345;
    const validFloraTypes = new Set([
      'water_lily_pad',
      'water_lily_purple',
      'water_lily_pink',
      'water_lily_white',
    ]);

    let totalWaterFlora = 0;

    for (let cx = -3; cx <= 3; cx++) {
      for (let cy = 0; cy <= 6; cy++) {
        const chunk1 = new WorldChunk(cx, cy, seed);
        const chunk2 = new WorldChunk(cx, cy, seed);

        // Deterministic check
        expect(chunk1.waterFlora).toEqual(chunk2.waterFlora);

        for (const flora of chunk1.waterFlora) {
          totalWaterFlora++;

          // Must have valid type and float phase
          expect(validFloraTypes.has(flora.type)).toBe(true);
          expect(typeof flora.phase).toBe('number');
          expect(flora.x).toBe(flora.gx * 32);
          expect(flora.y).toBe(flora.gy * 32);

          // Strictly on freshwater (river or lake)
          const onRiver = isRiverTile(flora.gx, flora.gy, seed);
          const onLake = isLakeTile(flora.gx, flora.gy, seed);
          expect(onRiver || onLake).toBe(true);

          // Strictly on interior freshwater (never on shorelines, banks, or bridge)
          expect(isInteriorFreshwater(flora.gx, flora.gy, seed)).toBe(true);

          // All 8 neighbor tiles must be water and not bridge
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (dx === 0 && dy === 0) continue;
              const nx = flora.gx + dx;
              const ny = flora.gy + dy;
              expect(isBridgeTile(nx, ny, seed)).toBe(false);
              expect(isWaterTile(nx, ny, seed)).toBe(true);
            }
          }
        }
      }
    }

    // Over 49 chunks including the Grand River and multiple lake zones, water flora should be serenely populated without overcrowding
    expect(totalWaterFlora).toBeGreaterThanOrEqual(10);
  });

  it('reliably generates water flora in lake bodies with interior freshwater', () => {
    const seeds = [101, 777, 12345];
    for (const seed of seeds) {
      let lakeFloraFound = 0;
      for (let cy = 0; cy <= 4; cy++) {
        for (let cx = -3; cx <= 3; cx++) {
          const chunk = new WorldChunk(cx, cy, seed);
          for (const f of chunk.waterFlora) {
            if (isLakeTile(f.gx, f.gy, seed)) {
              lakeFloraFound++;
            }
          }
        }
      }
      expect(lakeFloraFound).toBeGreaterThanOrEqual(1);
    }
  });
});
