import { seededHash } from '../noise';
import { isNearWater, isHillTile, isNearCliffEdge, isSandTile } from '../terrain-rules';
import {
  ECOLOGY_FERTILITY_SALT,
  ECOLOGY_MOISTURE_SALT,
  ECOLOGY_DENSITY_SALT,
  ECOLOGY_FREQUENCY,
  TALL_GRASS_BASE_DENSITY,
  TALL_GRASS_MOISTURE_WEIGHT,
  TALL_GRASS_FERTILITY_WEIGHT,
  TALL_GRASS_DENSITY_WEIGHT,
  TALL_GRASS_MIN_DENSITY,
  TALL_GRASS_MAX_DENSITY,
} from './ecology-config';

export interface EcologySample {
  fertility: number; // 0..1
  moisture: number; // 0..1
  density: number; // 0..1
  elevation: number; // 0..1
  nearWater: boolean;
  nearHill: boolean;
  nearSand: boolean;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Deterministic low-frequency 2D value noise with bilinear smoothstep interpolation.
 */
export function sampleEcologicalNoise(
  gx: number,
  gy: number,
  seed: number,
  salt: number,
  freq = ECOLOGY_FREQUENCY
): number {
  const x = gx * freq;
  const y = gy * freq;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;

  const v00 = seededHash(x0, y0, seed + salt);
  const v10 = seededHash(x0 + 1, y0, seed + salt);
  const v01 = seededHash(x0, y0 + 1, seed + salt);
  const v11 = seededHash(x0 + 1, y0 + 1, seed + salt);

  const wx = smoothstep(fx);
  const wy = smoothstep(fy);

  const top = v00 + wx * (v10 - v00);
  const bottom = v01 + wx * (v11 - v01);
  const val = top + wy * (bottom - top);

  return Math.max(0, Math.min(1, val));
}

export function sampleEcology(gx: number, gy: number, seed: number): EcologySample {
  const fertility = sampleEcologicalNoise(gx, gy, seed, ECOLOGY_FERTILITY_SALT);
  const moisture = sampleEcologicalNoise(gx, gy, seed, ECOLOGY_MOISTURE_SALT);
  const density = sampleEcologicalNoise(gx, gy, seed, ECOLOGY_DENSITY_SALT);

  const nearWater = isNearWater(gx, gy, seed, 2);
  const nearHill = isNearCliffEdge(gx, gy, seed) || isHillTile(gx, gy, seed);
  const nearSand =
    isSandTile(gx, gy, seed) ||
    isSandTile(gx + 1, gy, seed) ||
    isSandTile(gx - 1, gy, seed) ||
    isSandTile(gx, gy + 1, seed) ||
    isSandTile(gx, gy - 1, seed);
  const elevation = isHillTile(gx, gy, seed) ? 1.0 : 0.0;

  return {
    fertility,
    moisture,
    density,
    elevation,
    nearWater,
    nearHill,
    nearSand,
  };
}

/**
 * Calculates tall grass density from moisture, fertility, and density.
 * Formula per spec Section 8.1:
 * clamp(baseDensity + moisture * mWeight + fertility * fWeight + density * dWeight, min, max)
 */
export function calculateTallGrassDensity(sample: EcologySample): number {
  const raw =
    TALL_GRASS_BASE_DENSITY +
    sample.moisture * TALL_GRASS_MOISTURE_WEIGHT +
    sample.fertility * TALL_GRASS_FERTILITY_WEIGHT +
    sample.density * TALL_GRASS_DENSITY_WEIGHT;
  return Math.max(TALL_GRASS_MIN_DENSITY, Math.min(TALL_GRASS_MAX_DENSITY, raw));
}
