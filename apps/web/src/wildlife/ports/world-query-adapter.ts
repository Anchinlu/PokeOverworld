import { TILE_IDS } from '@pokemon/game-data';
import type { TerrainField } from '../../maps/terrain-field';
import type { Collider } from '@pokemon/shared-types';
import type { TallGrassEntity } from '../../maps/chunk-objects';
import { sampleEcology, getEcologyZone, resolveWorldBiome } from '../../maps/ecology';
import type { WorldQuery, TileContext, TimeBand } from './world-query';

/**
 * Creates a WorldQuery port adapter wrapping a TerrainField and local chunk entities.
 */
export function createWorldQueryAdapter(
  field: TerrainField,
  colliders: Collider[] = [],
  tallGrass: TallGrassEntity[] = [],
  getTimeBand: () => TimeBand = () => 'day',
  getWeather: () => string = () => 'clear'
): WorldQuery {
  const tallGrassSet = new Set<string>();
  for (const tg of tallGrass) {
    tallGrassSet.add(`${tg.gx},${tg.gy}`);
  }

  const colliderSet = new Set<string>();
  for (const c of colliders) {
    const cgx = Math.floor(c.x / 32);
    const cgy = Math.floor(c.y / 32);
    colliderSet.add(`${cgx},${cgy}`);
  }

  return {
    isWalkable(
      gx: number,
      gy: number,
      fromGX?: number,
      fromGY?: number,
      canJumpHills = false
    ): boolean {
      if (colliderSet.has(`${gx},${gy}`)) return false;
      // Impassable terrain: ocean and deep water lakes. Elevated plateaus
      // are valid wildlife habitat; elevation must not be confused with a
      // rocky ecology zone.
      if (field.isOcean(gx, gy) || field.isWater(gx, gy) || field.isLake?.(gx, gy)) {
        return false;
      }
      if (
        fromGX !== undefined &&
        fromGY !== undefined &&
        !field.isHill(fromGX, fromGY) &&
        field.isHill(gx, gy) &&
        !canJumpHills
      ) {
        // Wildlife has no jump animation yet. It may descend from a plateau,
        // but cannot climb from flat ground onto an elevated tile.
        return false;
      }
      return true;
    },

    isElevated(gx: number, gy: number): boolean {
      return field.isHill(gx, gy);
    },

    contextAt(gx: number, gy: number): TileContext {
      if (tallGrassSet.has(`${gx},${gy}`)) {
        return 'tall_grass';
      }
      if (field.isOcean(gx, gy)) {
        const tid = field.getOceanTileId(gx, gy);
        if (tid !== TILE_IDS.ocean_water) {
          return 'shore';
        }
        return 'water_surface';
      }
      if (field.isWater(gx, gy) || field.isLake?.(gx, gy)) {
        return 'water_surface';
      }
      if (field.isSand(gx, gy) || (field.isDesert && field.isDesert(gx, gy))) {
        return 'sand';
      }
      // Dark Land has its own biome pool. Keep walkable dark ground distinct
      // from the regular ecology sample so dark-land species can resolve the
      // `dark_land + walkable_ground` habitat pair deterministically.
      if (field.isDarkLand && field.isDarkLand(gx, gy)) {
        return 'walkable_ground';
      }

      const sample = sampleEcology(gx, gy, field);
      const zone = getEcologyZone(sample);
      if (zone === 'dense_forest') {
        return 'forest_floor';
      }

      return 'walkable_ground';
    },

    biomeAt(gx: number, gy: number): string {
      return resolveWorldBiome(field, gx, gy);
    },

    difficultyAt(gx: number, gy: number): number {
      const dist = Math.hypot(gx, gy);
      return Math.min(1.0, Math.max(0, dist / 500));
    },

    timeBand(): TimeBand {
      return getTimeBand();
    },

    weather(): string {
      return getWeather();
    },
  };
}
