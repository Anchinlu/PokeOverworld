import type { TerrainField } from '../../maps/terrain-field';
import type { Collider } from '@pokemon/shared-types';
import type { TallGrassEntity } from '../../maps/chunk-objects';
import { sampleEcology, getEcologyZone } from '../../maps/ecology';
import type { WorldQuery, TileContext, TimeBand } from './world-query';

/**
 * Creates a WorldQuery port adapter wrapping a TerrainField and local chunk entities.
 */
export function createWorldQueryAdapter(
  field: TerrainField,
  colliders: Collider[] = [],
  tallGrass: TallGrassEntity[] = []
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
    isWalkable(gx: number, gy: number): boolean {
      if (colliderSet.has(`${gx},${gy}`)) return false;
      // Impassable terrain: ocean, deep water lakes, and hills
      if (field.isOcean(gx, gy) || field.isWater(gx, gy) || field.isHill(gx, gy)) {
        return false;
      }
      return true;
    },

    contextAt(gx: number, gy: number): TileContext {
      if (tallGrassSet.has(`${gx},${gy}`)) {
        return 'tall_grass';
      }
      if (field.isOcean(gx, gy) || field.isWater(gx, gy)) {
        return 'water_surface';
      }
      if (field.isSand(gx, gy)) {
        return 'sand';
      }
      if (field.isHill(gx, gy)) {
        return 'rock';
      }

      const sample = sampleEcology(gx, gy, field.seed);
      const zone = getEcologyZone(sample);
      if (zone === 'dense_forest') {
        return 'forest_floor';
      }

      return 'walkable_ground';
    },

    biomeAt(gx: number, gy: number): string {
      const sample = sampleEcology(gx, gy, field.seed);
      return getEcologyZone(sample);
    },

    difficultyAt(gx: number, gy: number): number {
      const dist = Math.hypot(gx, gy);
      return Math.min(1.0, Math.max(0, dist / 500));
    },

    timeBand(): TimeBand {
      return 'day';
    },

    weather(): string {
      return 'clear';
    },
  };
}
