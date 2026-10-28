import { TILE_IDS, isBridgeTile, isFreshwaterTile, isOceanOrShoreTile } from '@pokemon/game-data';

export interface BiomeGroundDecalRule {
  readonly id: string;
  readonly matchesTile: (tileId: number) => boolean;
  readonly rollSalt: number;
  readonly largeDecal?: {
    readonly threshold: number;
    readonly assetKey: string;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly width: number;
    readonly height: number;
  };
  readonly smallDecal: {
    readonly threshold: number;
    readonly pickSalt: number;
    readonly assets: readonly string[];
  };
}

export interface PlantColliderSpec {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly w: number;
  readonly h: number;
}

export interface PlantVisualSpec {
  readonly layer: 'ground' | 'entity';
  readonly width: number;
  readonly height: number;
  /** Placement offset relative to `gx * TILE_SIZE` when spawning shrub/accent flora. */
  readonly placementOffsetX: number;
  /** Placement offset relative to `gy * TILE_SIZE` when spawning shrub/accent flora. */
  readonly placementOffsetY: number;
  /** Render offset relative to `px, py` when baked onto the ground canvas. */
  readonly groundRenderOffsetX: number;
  readonly groundRenderOffsetY: number;
  readonly ySortOffset: number;
  readonly animatedFrames?: number;
  readonly clearanceWidth: number;
  readonly collider?: PlantColliderSpec;
}

export type TreeShadowSpec =
  | { readonly kind: 'image'; readonly assetKey: string }
  | {
      readonly kind: 'ellipse';
      readonly cx: number;
      readonly cy: number;
      readonly rx: number;
      readonly ry: number;
    };

export interface TreeVisualSpec {
  readonly width: number;
  readonly height: number;
  readonly ySortOffset: number;
  readonly assetKey: string;
  readonly shadow: TreeShadowSpec;
}

const TALL_GRASS_BASE_GROUND_BY_TILE_ID: Readonly<Record<number, string>> = {
  [TILE_IDS.tall_grass_dark]: 'dark_ground_pure',
  [TILE_IDS.tall_grass_autumn]: 'ground_autumn_pure',
  [TILE_IDS.tall_grass_snow]: 'ground_snow_pure',
};

/**
 * Classifies a tile ID into its rendering category for `GroundRenderer`.
 */
export function classifyGroundTile(tileId: number): {
  readonly isSand: boolean;
  readonly isDesert: boolean;
  readonly isDarkGround: boolean;
  readonly isDarkCliff: boolean;
  readonly isDarkLand: boolean;
  readonly isAutumn: boolean;
  readonly isSnowGround: boolean;
  readonly isSnowCliff: boolean;
  readonly isSnowIce: boolean;
  readonly isSnow: boolean;
  readonly isRockyGround: boolean;
  readonly isRockyCliff: boolean;
  readonly isRockyWater: boolean;
  readonly isRockyHighland: boolean;
  readonly isRoad: boolean;
  readonly isCliff: boolean;
  readonly isWaterOrBridge: boolean;
  readonly isBridge: boolean;
  readonly isOceanOrShore: boolean;
} {
  const isSand = tileId >= 300 && tileId < 350;
  const isDesert = tileId >= 350 && tileId < 400;
  const isDarkGround = (tileId >= 440 && tileId < 460) || tileId === TILE_IDS.tall_grass_dark;
  const isDarkCliff = tileId >= 460 && tileId < 475;
  const isDarkLand = isDarkGround || isDarkCliff;
  const isAutumn = (tileId >= 480 && tileId <= 492) || tileId === TILE_IDS.tall_grass_autumn;
  const isSnowGround = (tileId >= 510 && tileId <= 522) || tileId === TILE_IDS.tall_grass_snow;
  const isSnowCliff = tileId >= 530 && tileId <= 542;
  const isSnowIce = tileId >= 550 && tileId <= 558;
  const isSnow = isSnowGround || isSnowCliff || isSnowIce;
  const isRockyGround = tileId >= 570 && tileId <= 582;
  const isRockyCliff = (tileId >= 585 && tileId <= 597) || (tileId >= 620 && tileId <= 637);
  const isRockyWater = tileId >= 785 && tileId <= 798;
  const isRockyHighland = isRockyGround || isRockyCliff;
  const isRoad = tileId >= 200 && tileId < 300;
  const isCliff = (tileId >= 400 && tileId < 435) || isDarkCliff || isSnowCliff || isRockyCliff;
  const isBridge = isBridgeTile(tileId);
  const isWaterOrBridge = isFreshwaterTile(tileId) || isBridge;
  const isOceanOrShore = isOceanOrShoreTile(tileId);

  return {
    isSand,
    isDesert,
    isDarkGround,
    isDarkCliff,
    isDarkLand,
    isAutumn,
    isSnowGround,
    isSnowCliff,
    isSnowIce,
    isSnow,
    isRockyGround,
    isRockyCliff,
    isRockyWater,
    isRockyHighland,
    isRoad,
    isCliff,
    isWaterOrBridge,
    isBridge,
    isOceanOrShore,
  };
}

/**
 * Resolves the ground texture key for a tile ID (handling tall-grass biome ground underlays).
 */
export function resolveGroundOverlayAssetKey(
  tileId: number,
  tileKeyById: Readonly<Record<number, string>>
): string | undefined {
  return TALL_GRASS_BASE_GROUND_BY_TILE_ID[tileId] ?? tileKeyById[tileId];
}

/**
 * Declarative biome ground decoration rules (Layer 0 procedural scatter).
 * Preserves exact deterministic hash salts and thresholds across all biomes.
 */
export const BIOME_GROUND_DECAL_RULES: readonly BiomeGroundDecalRule[] = [
  {
    id: 'beach_sand',
    matchesTile: (tileId) => tileId === TILE_IDS.sand_pure,
    rollSalt: 13,
    smallDecal: {
      threshold: 0.06,
      pickSalt: 17,
      assets: ['sand_grass', 'sand_mound', 'sand_shell'],
    },
  },
  {
    id: 'desert_sand',
    matchesTile: (tileId) => tileId === TILE_IDS.desert_pure,
    rollSalt: 47,
    smallDecal: {
      threshold: 0.08,
      pickSalt: 59,
      assets: [
        'rock_desert_small_orange',
        'rock_desert_pebbles_orange',
        'rock_desert_small_slate',
        'rock_desert_pebbles_slate',
      ],
    },
  },
  {
    id: 'autumn_ground',
    matchesTile: (tileId) =>
      (tileId >= 480 && tileId <= 492) || tileId === TILE_IDS.tall_grass_autumn,
    rollSalt: 31,
    largeDecal: {
      threshold: 0.035,
      assetKey: 'leaf_pile_red_big',
      offsetX: -16,
      offsetY: -16,
      width: 64,
      height: 64,
    },
    smallDecal: {
      threshold: 0.15,
      pickSalt: 67,
      assets: [
        'decor_mushroom_tan',
        'decor_mushroom_red_cluster',
        'decor_grass_red_tuft',
        'decor_grass_dry',
        'decor_flower_white_cluster',
        'decor_flowerbed_red',
        'decor_flowerbed_red_white',
        'decor_mushroom_red_pair',
        'decor_mushroom_red_single',
        'decor_flower_orange_patch',
        'decor_flowerbed_red_pink',
        'decor_flowerbed_red_lilac',
        'decor_grass_red_blue',
        'decor_grass_red_white',
        'decor_rock_mossy_pile',
        'decor_leaf_fragments_red',
        'decor_rock_brown',
        'decor_leaf_pile_red',
        'decor_roots_curved_1',
        'decor_roots_curved_2',
      ],
    },
  },
  {
    id: 'snow_ground',
    matchesTile: (tileId) => tileId === TILE_IDS.ground_snow_pure,
    rollSalt: 41,
    largeDecal: {
      threshold: 0.03,
      assetKey: 'ice_snow_patch_medium',
      offsetX: 0,
      offsetY: 0,
      width: 64,
      height: 32,
    },
    smallDecal: {
      threshold: 0.16,
      pickSalt: 83,
      assets: [
        'decor_snow_drift',
        'decor_snow_sparkle',
        'decor_snow_crack',
        'decor_snow_flower',
        'decor_snow_mound',
        'decor_snow_grass_1',
        'decor_snow_grass_2',
        'ice_snow_patch_small',
      ],
    },
  },
  {
    id: 'rocky_highland_ground',
    matchesTile: (tileId) => tileId === TILE_IDS.ground_rock_pure,
    rollSalt: 53,
    largeDecal: {
      threshold: 0.01,
      assetKey: 'decor_rock_puddle_cluster',
      offsetX: -16,
      offsetY: -16,
      width: 64,
      height: 64,
    },
    smallDecal: {
      threshold: 0.11,
      pickSalt: 89,
      assets: [
        'decor_rock_pebbles',
        'decor_rock_pebbles',
        'decor_rock_pebbles',
        'rock_highland_small',
        'rock_highland_small',
        'decor_rock_puddle_1',
        'decor_rock_puddle_2',
      ],
    },
  },
];

/**
 * Single source of truth for plant, shrub, rock, and ground-decal visual/collision metadata.
 */
export function getPlantVisualSpec(type: string): PlantVisualSpec {
  // 1. Ground-baked decals (Layer 0, zero hitbox)
  if (type === 'leaf_pile_red_big' || type === 'decor_rock_puddle_cluster') {
    return {
      layer: 'ground',
      width: 64,
      height: 64,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: -16,
      groundRenderOffsetY: -16,
      ySortOffset: 0,
      clearanceWidth: 24,
    };
  }
  if (type === 'ice_snow_patch_medium' || type === 'decor_snow_frost_grass') {
    return {
      layer: 'ground',
      width: 64,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 0,
      clearanceWidth: 24,
    };
  }
  if (
    type.startsWith('decor_') &&
    type !== 'decor_stump_autumn' &&
    !type.startsWith('decor_snow_rock_') &&
    !type.startsWith('decor_snow_stump_') &&
    type !== 'decor_snow_log'
  ) {
    return {
      layer: 'ground',
      width: 32,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 0,
      clearanceWidth: 24,
    };
  }

  // 2. Very tall spires & dark sprouts (96px height)
  if (type === 'rock_dark_spires') {
    return {
      layer: 'entity',
      width: 64,
      height: 96,
      placementOffsetX: 0,
      placementOffsetY: -64,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 90,
      clearanceWidth: 40,
      collider: { offsetX: 12, offsetY: 68, w: 40, h: 24 },
    };
  }
  if (type === 'dark_sprout' || type.startsWith('dark_sprout_')) {
    return {
      layer: 'entity',
      width: 32,
      height: 96,
      placementOffsetX: 0,
      placementOffsetY: -64,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 90,
      clearanceWidth: 24,
      collider: type === 'dark_sprout' ? { offsetX: 6, offsetY: 68, w: 20, h: 24 } : undefined,
    };
  }

  // 3. Large 64x64 bushes (White flowering bush, Dark bush, Autumn big spiky bush, Snow bush)
  if (
    type === 'bush_flowering_white' ||
    type.startsWith('bush_dark_') ||
    type.startsWith('bush_spiky_big_') ||
    type.startsWith('bush_snow_')
  ) {
    return {
      layer: 'entity',
      width: 64,
      height: 64,
      placementOffsetX: -16,
      placementOffsetY: -32,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 56,
      clearanceWidth: 40,
      collider: { offsetX: 18, offsetY: 40, w: 28, h: 20 },
    };
  }

  // 4. Medium 32x64 bushes, cactuses, cone trees, crystals
  if (type.startsWith('bush_spiky_')) {
    return {
      layer: 'entity',
      width: 32,
      height: 64,
      placementOffsetX: 0,
      placementOffsetY: -32,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 56,
      clearanceWidth: 24,
      collider: { offsetX: 6, offsetY: 40, w: 20, h: 20 },
    };
  }
  if (type === 'bush_cone_autumn' || type === 'bush_cone_forest') {
    return {
      layer: 'entity',
      width: 32,
      height: 64,
      placementOffsetX: 0,
      placementOffsetY: -32,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 58,
      clearanceWidth: 24,
      collider: { offsetX: 6, offsetY: 44, w: 20, h: 18 },
    };
  }
  if (type === 'cactus_medium') {
    return {
      layer: 'entity',
      width: 32,
      height: 64,
      placementOffsetX: 0,
      placementOffsetY: -32,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 58,
      clearanceWidth: 24,
      collider: { offsetX: 6, offsetY: 40, w: 20, h: 20 },
    };
  }
  if (type === 'desert_dry_bush' || type === 'desert_succulent') {
    return {
      layer: 'entity',
      width: 32,
      height: 64,
      placementOffsetX: 0,
      placementOffsetY: -32,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 58,
      clearanceWidth: 24,
      collider: { offsetX: 4, offsetY: 40, w: 24, h: 18 },
    };
  }
  if (
    type === 'flower_purple_bell' ||
    type.startsWith('tree_snow_cone_') ||
    type.startsWith('crystal_snow_')
  ) {
    return {
      layer: 'entity',
      width: 32,
      height: 64,
      placementOffsetX: 0,
      placementOffsetY: -32,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 58,
      clearanceWidth: 24,
    };
  }

  // 5. Wide 64x32 fallen logs & boulders
  if (type === 'nature_fallen_log') {
    return {
      layer: 'entity',
      width: 64,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 60,
      collider: { offsetX: 4, offsetY: 8, w: 56, h: 22 },
    };
  }
  if (type === 'log_snow_fallen' || type === 'rock_snow_boulder') {
    return {
      layer: 'entity',
      width: 64,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 60,
    };
  }
  if (type === 'rock_wet_wide') {
    return {
      layer: 'entity',
      width: 64,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 56,
      collider: { offsetX: 8, offsetY: 8, w: 48, h: 20 },
    };
  }
  if (type === 'rock_wet_tall') {
    return {
      layer: 'entity',
      width: 32,
      height: 64,
      placementOffsetX: 0,
      placementOffsetY: -32,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 56,
      clearanceWidth: 28,
      collider: { offsetX: 4, offsetY: 36, w: 24, h: 22 },
    };
  }
  if (type === 'rock_highland_1' || type === 'rock_highland_2' || type === 'rock_wet_small') {
    return {
      layer: 'entity',
      width: 32,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 24,
      collider: { offsetX: 4, offsetY: 8, w: 24, h: 20 },
    };
  }
  if (type === 'rock_highland_small') {
    return {
      layer: 'entity',
      width: 32,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 24,
    };
  }

  // 6. Static 32x32 stumps, rocks, vines, small cactuses
  if (type === 'nature_tree_stump' || type === 'decor_stump_autumn') {
    return {
      layer: 'entity',
      width: 32,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 24,
      collider: { offsetX: 4, offsetY: 8, w: 24, h: 22 },
    };
  }
  if (type === 'cactus_small') {
    return {
      layer: 'entity',
      width: 32,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 24,
      collider: { offsetX: 6, offsetY: 8, w: 20, h: 20 },
    };
  }
  if (type.startsWith('flower_vine_')) {
    return {
      layer: 'entity',
      width: 32,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: -32,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 24,
    };
  }
  if (type.startsWith('rocks_') || type.startsWith('decor_snow_rock_')) {
    return {
      layer: 'entity',
      width: 32,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 24,
      collider: { offsetX: 4, offsetY: 8, w: 24, h: 20 },
    };
  }
  if (type.startsWith('decor_snow_stump_')) {
    return {
      layer: 'entity',
      width: 32,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 24,
      collider: { offsetX: 6, offsetY: 8, w: 20, h: 20 },
    };
  }
  if (type === 'decor_snow_log') {
    return {
      layer: 'entity',
      width: 32,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 24,
      collider: { offsetX: 2, offsetY: 8, w: 28, h: 20 },
    };
  }
  if (type === 'rock_snow_pointed' || type === 'rock_snow_pebbles' || type === 'stump_snow') {
    return {
      layer: 'entity',
      width: 32,
      height: 32,
      placementOffsetX: 0,
      placementOffsetY: 0,
      groundRenderOffsetX: 0,
      groundRenderOffsetY: 0,
      ySortOffset: 26,
      clearanceWidth: 24,
    };
  }

  // 7. Default animated 5-frame wildflowers & sprouts (32x32)
  return {
    layer: 'entity',
    width: 32,
    height: 32,
    placementOffsetX: 0,
    placementOffsetY: -32,
    groundRenderOffsetX: 0,
    groundRenderOffsetY: 0,
    ySortOffset: 16,
    animatedFrames: 5,
    clearanceWidth: 24,
  };
}

/**
 * Single source of truth for tree sprite dimensions, ySort anchor, asset key, and ground shadow.
 */
export function getTreeVisualSpec(type: string): TreeVisualSpec {
  if (type.startsWith('tree_apricorn_') || type.startsWith('apricorn_')) {
    return {
      width: 76,
      height: 140,
      ySortOffset: 132,
      assetKey: type.startsWith('tree_') ? type : `tree_${type}`,
      shadow: { kind: 'ellipse', cx: 38, cy: 132, rx: 24, ry: 8 },
    };
  }
  if (type === 'palm') {
    return {
      width: 128,
      height: 200,
      ySortOffset: 151,
      assetKey: 'tree_palm',
      shadow: { kind: 'image', assetKey: 'tree_palm_shadow' },
    };
  }
  if (type === 'dark_large_1' || type === 'dark_large_2' || type === 'dark_dead') {
    return {
      width: 128,
      height: 128,
      ySortOffset: 118,
      assetKey: `tree_${type}`,
      shadow: { kind: 'ellipse', cx: 64, cy: 118, rx: 38, ry: 12 },
    };
  }
  if (type === 'dark_forest') {
    return {
      width: 96,
      height: 96,
      ySortOffset: 88,
      assetKey: 'tree_dark_forest',
      shadow: { kind: 'ellipse', cx: 48, cy: 88, rx: 28, ry: 9 },
    };
  }
  if (type === 'cactus_large') {
    return {
      width: 64,
      height: 96,
      ySortOffset: 88,
      assetKey: 'cactus_large',
      shadow: { kind: 'ellipse', cx: 32, cy: 90, rx: 18, ry: 7 },
    };
  }
  if (type === 'dead_1' || type === 'dead_2') {
    return {
      width: 64,
      height: 64,
      ySortOffset: 58,
      assetKey: `tree_${type}`,
      shadow: { kind: 'ellipse', cx: 32, cy: 60, rx: 18, ry: 7 },
    };
  }
  if (type === 'desert_boulder' || type === 'rock_highland_boulder') {
    return {
      width: 64,
      height: 64,
      ySortOffset: 58,
      assetKey: type === 'desert_boulder' ? 'rock_desert_boulder' : 'rock_highland_boulder',
      shadow: { kind: 'ellipse', cx: 32, cy: 60, rx: 24, ry: 7 },
    };
  }
  if (
    type.startsWith('maple_') ||
    type.startsWith('larch_') ||
    type.startsWith('tree_maple_') ||
    type.startsWith('tree_larch_') ||
    type.startsWith('snow_pine_') ||
    type.startsWith('tree_snow_')
  ) {
    return {
      width: 64,
      height: 128,
      ySortOffset: 120,
      assetKey: type.startsWith('tree_') ? type : `tree_${type}`,
      shadow: { kind: 'ellipse', cx: 32, cy: 112, rx: 20, ry: 8 },
    };
  }

  return {
    width: 64,
    height: 120,
    ySortOffset: 112,
    assetKey: type.startsWith('tree_') ? type : `tree_${type}`,
    shadow: { kind: 'ellipse', cx: 32, cy: 112, rx: 20, ry: 8 },
  };
}
