import { TILE_IDS } from '@pokemon/game-data';
import type { TerrainField } from '../../maps/terrain-field';
import { sampleEcology, getEcologyZone } from '../../maps/ecology';
import type { TileContext } from './world-query';

export interface WorldContextOptions {
  /** True when a generated tall-grass entity occupies this coordinate. */
  isTallGrass?: (gx: number, gy: number) => boolean;
}

/**
 * Single source of truth for wildlife tile context resolution.
 *
 * The order is intentional: Autumn/Dark Land own their encounter context,
 * then water/shore/sand are resolved, and finally ordinary ecology decides
 * between forest floor and walkable ground.
 */
export function resolveWorldTileContext(
  field: TerrainField,
  gx: number,
  gy: number,
  options: WorldContextOptions = {}
): TileContext {
  if (field.isAutumn?.(gx, gy)) {
    return 'walkable_ground';
  }

  if (options.isTallGrass?.(gx, gy)) {
    return 'tall_grass';
  }

  if (field.isOcean(gx, gy)) {
    return field.getOceanTileId(gx, gy) === TILE_IDS.ocean_water ? 'water_surface' : 'shore';
  }

  if (field.isWater(gx, gy) || field.isLake?.(gx, gy)) {
    return 'water_surface';
  }

  if (field.isSand(gx, gy) || field.isDesert?.(gx, gy)) {
    return 'sand';
  }

  if (field.isDarkLand?.(gx, gy)) {
    return 'walkable_ground';
  }

  if (field.isSnow?.(gx, gy)) {
    return 'walkable_ground';
  }

  const zone = getEcologyZone(sampleEcology(gx, gy, field));
  return zone === 'dense_forest' ? 'forest_floor' : 'walkable_ground';
}
