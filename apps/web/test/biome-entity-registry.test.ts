import { describe, it, expect } from 'vitest';
import {
  TILE_IDS,
  isAnimatedWaterOrShoreTile,
  isBridgeTile,
  isFreshwaterTile,
  isOceanOrShoreTile,
} from '@pokemon/game-data';
import {
  BIOME_GROUND_DECAL_RULES,
  classifyGroundTile,
  getPlantVisualSpec,
  getTreeVisualSpec,
  resolveGroundOverlayAssetKey,
} from '../src/maps/biome-entity-registry';
import { TILE_KEY_BY_ID } from '../src/rendering/types';

describe('biome-entity-registry & water tile helpers', () => {
  it('distinguishes freshwater, bridge, and ocean/shore tiles accurately', () => {
    expect(isFreshwaterTile(TILE_IDS.water_pure)).toBe(true);
    expect(isFreshwaterTile(TILE_IDS.water_autumn_pure)).toBe(true);
    expect(isFreshwaterTile(TILE_IDS.water_snow_pure)).toBe(true);
    expect(isFreshwaterTile(TILE_IDS.ocean_water)).toBe(false);
    expect(isFreshwaterTile(TILE_IDS.bridge_wood_v)).toBe(false);

    expect(isBridgeTile(TILE_IDS.bridge_wood_h)).toBe(true);
    expect(isBridgeTile(TILE_IDS.bridge_wood_v)).toBe(true);
    expect(isBridgeTile(TILE_IDS.water_pure)).toBe(false);

    expect(isOceanOrShoreTile(TILE_IDS.ocean_water)).toBe(true);
    expect(isOceanOrShoreTile(TILE_IDS.shore_v)).toBe(true);
    expect(isOceanOrShoreTile(TILE_IDS.water_pure)).toBe(false);

    expect(isAnimatedWaterOrShoreTile(TILE_IDS.water_snow_curve)).toBe(true);
    expect(isAnimatedWaterOrShoreTile(TILE_IDS.bridge_wood_h)).toBe(true);
    expect(isAnimatedWaterOrShoreTile(TILE_IDS.ocean_water)).toBe(true);
    expect(isAnimatedWaterOrShoreTile(TILE_IDS.grass_01)).toBe(false);
  });

  it('classifies ground tiles and resolves tall-grass biome underlays', () => {
    expect(classifyGroundTile(TILE_IDS.ground_snow_pure).isSnow).toBe(true);
    expect(classifyGroundTile(TILE_IDS.cliff_snow_top).isCliff).toBe(true);
    expect(classifyGroundTile(TILE_IDS.water_autumn_top).isWaterOrBridge).toBe(true);
    expect(classifyGroundTile(TILE_IDS.bridge_wood_h).isBridge).toBe(true);

    expect(resolveGroundOverlayAssetKey(TILE_IDS.tall_grass_dark, TILE_KEY_BY_ID)).toBe(
      'dark_ground_pure'
    );
    expect(resolveGroundOverlayAssetKey(TILE_IDS.tall_grass_autumn, TILE_KEY_BY_ID)).toBe(
      'ground_autumn_pure'
    );
    expect(resolveGroundOverlayAssetKey(TILE_IDS.tall_grass_snow, TILE_KEY_BY_ID)).toBe(
      'ground_snow_pure'
    );
  });

  it('provides ground decal rules for beach, desert, autumn, snow, and rocky highland', () => {
    const ids = BIOME_GROUND_DECAL_RULES.map((r) => r.id);
    expect(ids).toEqual([
      'beach_sand',
      'desert_sand',
      'autumn_ground',
      'snow_ground',
      'rocky_highland_ground',
    ]);

    const snowRule = BIOME_GROUND_DECAL_RULES.find((r) => r.id === 'snow_ground')!;
    expect(snowRule.matchesTile(TILE_IDS.ground_snow_pure)).toBe(true);
    expect(snowRule.matchesTile(TILE_IDS.ground_snow_top)).toBe(false);

    const rockyRule = BIOME_GROUND_DECAL_RULES.find((r) => r.id === 'rocky_highland_ground')!;
    expect(rockyRule.matchesTile(TILE_IDS.ground_rock_pure)).toBe(true);
    expect(rockyRule.matchesTile(TILE_IDS.ground_rock_top)).toBe(false);
  });

  it('resolves plant visual & collision specs for ground decals, bushes, spires, and flowers', () => {
    const leafPile = getPlantVisualSpec('leaf_pile_red_big');
    expect(leafPile.layer).toBe('ground');
    expect(leafPile.width).toBe(64);
    expect(leafPile.collider).toBeUndefined();

    const snowStump = getPlantVisualSpec('decor_snow_stump_1');
    expect(snowStump.layer).toBe('entity');
    expect(snowStump.collider).toEqual({ offsetX: 6, offsetY: 8, w: 20, h: 20 });

    const darkSpires = getPlantVisualSpec('rock_dark_spires');
    expect(darkSpires.width).toBe(64);
    expect(darkSpires.height).toBe(96);
    expect(darkSpires.ySortOffset).toBe(90);
    expect(darkSpires.collider).toEqual({ offsetX: 12, offsetY: 68, w: 40, h: 24 });

    const flower = getPlantVisualSpec('flower_red');
    expect(flower.animatedFrames).toBe(5);
    expect(flower.ySortOffset).toBe(16);
  });

  it('resolves tree visual & shadow specs across biomes', () => {
    const palm = getTreeVisualSpec('palm');
    expect(palm.width).toBe(128);
    expect(palm.height).toBe(200);
    expect(palm.shadow).toEqual({ kind: 'image', assetKey: 'tree_palm_shadow' });

    const snowPine = getTreeVisualSpec('tree_snow_pine_1');
    expect(snowPine.width).toBe(64);
    expect(snowPine.height).toBe(128);
    expect(snowPine.ySortOffset).toBe(120);
    expect(snowPine.assetKey).toBe('tree_snow_pine_1');
  });
});
