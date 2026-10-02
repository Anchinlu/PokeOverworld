import type { EcologySample } from './ecology-field';
import {
  DENSE_FOREST_DENSITY_THRESHOLD,
  DRYLAND_MOISTURE_THRESHOLD,
  DRYLAND_FERTILITY_THRESHOLD,
} from './ecology-config';

export type EcologyZone =
  | 'coast'
  | 'wetland'
  | 'meadow'
  | 'dryland'
  | 'dense_forest'
  | 'hill_edge';

/**
 * Classifies an ecology sample into an ecological zone.
 * Order:
 * 1. Coast (near sand) / Wetland (near water)
 * 2. Hill Edge (near cliffs/hills)
 * 3. Dense Forest (density >= threshold)
 * 4. Dryland (moisture <= threshold or fertility <= threshold)
 * 5. Meadow (neutral default)
 */
export function getEcologyZone(sample: EcologySample): EcologyZone {
  if (sample.nearSand) {
    return 'coast';
  }
  if (sample.nearWater) {
    return 'wetland';
  }
  if (sample.nearHill) {
    return 'hill_edge';
  }
  if (sample.density >= DENSE_FOREST_DENSITY_THRESHOLD) {
    return 'dense_forest';
  }
  if (
    sample.moisture <= DRYLAND_MOISTURE_THRESHOLD ||
    sample.fertility <= DRYLAND_FERTILITY_THRESHOLD
  ) {
    return 'dryland';
  }
  return 'meadow';
}
