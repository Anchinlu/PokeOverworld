import { describe, expect, it } from 'vitest';
import type { TerrainField } from '../src/maps/terrain-field';
import { resolveWorldTileContext } from '../src/wildlife/ports/world-context';

function createField(overrides: Partial<TerrainField> = {}): TerrainField {
  return {
    version: 4,
    seed: 1,
    isOcean: () => false,
    isSand: () => false,
    isDesert: () => false,
    isDarkLand: () => false,
    isAutumn: () => false,
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
    ...overrides,
  };
}

describe('unified wildlife tile context resolver', () => {
  it('keeps Autumn context on walkable ground even inside tall grass', () => {
    const field = createField({ isAutumn: () => true });
    expect(resolveWorldTileContext(field, 4, 8, { isTallGrass: () => true })).toBe(
      'walkable_ground'
    );
  });

  it('resolves tall grass for ordinary land', () => {
    const field = createField();
    expect(resolveWorldTileContext(field, 4, 8, { isTallGrass: () => true })).toBe('tall_grass');
  });

  it('resolves water and shore from terrain before ecology noise', () => {
    const waterField = createField({ isWater: () => true });
    expect(resolveWorldTileContext(waterField, 4, 8)).toBe('water_surface');

    const shoreField = createField({
      isOcean: () => true,
      getOceanTileId: () => 1,
    });
    expect(resolveWorldTileContext(shoreField, 4, 8)).toBe('shore');
  });

  it('keeps Dark Land on its dedicated walkable-ground context', () => {
    const field = createField({ isDarkLand: () => true });
    expect(resolveWorldTileContext(field, 4, 8)).toBe('walkable_ground');
  });
});
