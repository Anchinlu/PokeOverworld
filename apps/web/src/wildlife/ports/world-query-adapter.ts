import type { TerrainField } from '../../maps/terrain-field';
import type { Collider } from '@pokemon/shared-types';
import type { TallGrassEntity } from '../../maps/chunk-objects';
import { resolveWorldBiome } from '../../maps/ecology';
import type { RuntimeBiomeId } from '../../maps/ecology';
import type { WorldQuery, TileContext, TimeBand } from './world-query';
import { resolveWorldTileContext } from './world-context';
import { isVillageArea } from '../../maps/village-rules';

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
      // 2-tier High Cliffs (`vách đá cao`): wildlife can spawn and roam on the
      // flat top plateau (`isHighCliffPlateau`), but never on the 2-tile vertical
      // southern cliff wall face.
      if (field.isHighCliff?.(gx, gy)) {
        const onPlateau = field.isHighCliffPlateau
          ? field.isHighCliffPlateau(gx, gy)
          : field.isHighCliff(gx, gy + 1) && field.isHighCliff(gx, gy + 2);
        if (!onPlateau) return false;
      }
      if (fromGX !== undefined && fromGY !== undefined) {
        const fromHighCliff = Boolean(field.isHighCliff?.(fromGX, fromGY));
        const toHighCliff = Boolean(field.isHighCliff?.(gx, gy));
        if (fromHighCliff !== toHighCliff) {
          return false;
        }
        if (!field.isHill(fromGX, fromGY) && field.isHill(gx, gy) && !canJumpHills) {
          // Wildlife has no jump animation yet. It may descend from a 1-tier plateau,
          // but cannot climb from flat ground onto an elevated tile.
          return false;
        }
      }
      return true;
    },

    isElevated(gx: number, gy: number): boolean {
      return field.isHill(gx, gy);
    },

    isWildlifeRestricted(gx: number, gy: number): boolean {
      return isVillageArea(gx, gy, field, 0);
    },

    contextAt(gx: number, gy: number): TileContext {
      return resolveWorldTileContext(field, gx, gy, {
        isTallGrass: (x, y) => tallGrassSet.has(`${x},${y}`),
      });
    },

    biomeAt(gx: number, gy: number): RuntimeBiomeId {
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
