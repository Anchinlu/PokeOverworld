import { describe, expect, it } from 'vitest';
import type { TerrainField } from '../src/maps/terrain-field';
import { getEcologyZone } from '../src/maps/ecology/ecology-profile';
import { createWorldQueryAdapter } from '../src/wildlife/ports/world-query-adapter';

function createHighlandField(): TerrainField {
  return {
    version: 3,
    seed: 20261020,
    isOcean: () => false,
    isSand: () => false,
    isDesert: () => false,
    isDarkLand: () => false,
    isHill: () => true,
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

describe('Highland meadow ecology', () => {
  it('does not turn elevated ground into a rocky ecology zone', () => {
    const zone = getEcologyZone({
      fertility: 0.8,
      moisture: 0.8,
      density: 0.2,
      elevation: 1,
      nearWater: false,
      nearHill: true,
      nearSand: false,
    });

    expect(zone).toBe('meadow');
  });

  it('keeps an elevated plateau valid for wildlife and tall-grass habitat', () => {
    const adapter = createWorldQueryAdapter(
      createHighlandField(),
      [],
      [{ gx: 10, gy: 10, x: 320, y: 320, phase: 0, heightScale: 1 }]
    );

    expect(adapter.isWalkable(10, 10)).toBe(true);
    expect(adapter.contextAt(10, 10)).toBe('tall_grass');
    expect(adapter.biomeAt(10, 10)).not.toBe('hill_edge');
  });
});
