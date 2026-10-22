import { describe, expect, it } from 'vitest';
import { TILE_IDS } from '@pokemon/game-data';
import type { TerrainField } from '../src/maps/terrain-field';
import { getAutumnGroundTileKey, getDesertTileKey } from '../src/maps/autotile';

function createBoundaryField(
  isAutumn: (gx: number, gy: number) => boolean,
  isDesert: (gx: number, gy: number) => boolean
): TerrainField {
  return {
    version: 4,
    seed: 20261022,
    isOcean: () => false,
    isSand: () => false,
    isDesert,
    isDarkLand: () => false,
    isAutumn,
    isHill: () => false,
    isRoad: () => false,
    isBridge: () => false,
    isWater: () => false,
    isLake: () => false,
    isWaterOrBridge: () => false,
    isNearWater: () => false,
    isNearCliffEdge: () => false,
    getOceanTileId: () => 0,
    getSpawn: () => ({ gx: 0, gy: 0 }),
    getRoadCenterX: () => 0,
    isValidTreePos: () => true,
    isValidPalmTreePos: () => false,
  };
}

describe('Autumn and Desert biome boundary', () => {
  const isAutumn = (gx: number) => gx < 10;
  const isDesert = (gx: number) => gx >= 10;

  it('does not insert a meadow fringe on the Autumn side', () => {
    const field = createBoundaryField(isAutumn, isDesert);
    const result = getAutumnGroundTileKey(9, 10, field);

    expect(result.key).toBe('pure');
    expect(result.tileId).toBe(TILE_IDS.ground_autumn_pure);
  });

  it('does not insert a meadow fringe on the Desert side', () => {
    const field = createBoundaryField(isAutumn, isDesert);
    const result = getDesertTileKey(10, 10, field);

    expect(result.key).toBe('pure');
    expect(result.tileId).toBe(TILE_IDS.desert_pure);
  });

  it('keeps ordinary Autumn-to-meadow edges using Autumn boundary tiles', () => {
    const field = createBoundaryField(
      () => true,
      () => false
    );
    const result = getAutumnGroundTileKey(10, 10, {
      ...field,
      isAutumn: (gx, gy) => gx >= 10 && gy >= 10,
    });

    expect(result.key).toBe('tl');
    expect(result.tileId).toBe(TILE_IDS.ground_autumn_tl);
  });
});
