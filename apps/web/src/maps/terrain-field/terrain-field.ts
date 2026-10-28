/**
 * Unified Terrain Field Interface (v0 World Architecture)
 *
 * Provides deterministic spatial queries for all terrain classes (ocean, sand,
 * hill, road, bridge, water, lake) and spawn positions, decoupling callers from
 * legacy strip-coordinate formulas.
 */

export interface TerrainField {
  readonly version: number;
  readonly seed: number;

  isOcean(gx: number, gy: number, hasBeach?: boolean): boolean;
  isSand(gx: number, gy: number, hasBeach?: boolean): boolean;
  isDesert?(gx: number, gy: number): boolean;
  isDarkLand?(gx: number, gy: number): boolean;
  isAutumn?(gx: number, gy: number): boolean;
  isApricornPlain?(gx: number, gy: number): boolean;
  isSnow?(gx: number, gy: number): boolean;
  isRockyHighland?(gx: number, gy: number): boolean;
  /** Freshwater tile inside a Rocky Highland region; kept separate from land. */
  isRockyWater?(gx: number, gy: number): boolean;
  isHighCliff?(gx: number, gy: number): boolean;
  isHighCliffPlateau?(gx: number, gy: number): boolean;
  isHill(
    gx: number,
    gy: number,
    hasHills?: boolean,
    hasRoad?: boolean,
    hasBeach?: boolean
  ): boolean;
  isRoad(gx: number, gy: number, hasRoad?: boolean, hasBeach?: boolean): boolean;
  isBridge(gx: number, gy: number, hasRoad?: boolean): boolean;
  isWater(
    gx: number,
    gy: number,
    hasWater?: boolean,
    hasRoad?: boolean,
    hasBeach?: boolean,
    hasHills?: boolean
  ): boolean;
  isLake(
    gx: number,
    gy: number,
    hasRoad?: boolean,
    hasBeach?: boolean,
    hasHills?: boolean
  ): boolean;
  isWaterOrBridge(
    gx: number,
    gy: number,
    hasWater?: boolean,
    hasRoad?: boolean,
    hasBeach?: boolean,
    hasHills?: boolean
  ): boolean;
  isNearWater(gx: number, gy: number, radius?: number, hasWater?: boolean): boolean;
  isNearCliffEdge(gx: number, gy: number): boolean;
  getOceanTileId(gx: number, gy: number, hasBeach?: boolean): number;
  getSpawn(): { gx: number; gy: number };
  getRoadCenterX(gy: number): number;

  // Tree and palm placement validation helpers
  isValidTreePos(tx: number, ty: number): boolean;
  isValidPalmTreePos(gx: number, gy: number): boolean;
}

import { LegacyStripField } from './legacy-field';
import { V0Field } from './v0-field';
import { V3Field } from './v3-field';
import { V4Field } from './v4-field';

export { LegacyStripField } from './legacy-field';
export { V0Field } from './v0-field';
export { V3Field } from './v3-field';
export { V4Field } from './v4-field';
export { V4_CONFIG } from './v4-config';
export { V4MacroPlan } from './v4-macro-plan';
export type { V4LandmassProfile } from './v4-config';

export function createNaturalLandmassField(seed: number): TerrainField {
  return new V4Field(seed, 'natural-landmass');
}

export function createTerrainField(version: number, seed: number): TerrainField {
  if (version === 1) {
    return new LegacyStripField(seed);
  }
  if (version === 2) {
    return new V0Field(seed);
  }
  if (version === 3) {
    return new V3Field(seed);
  }
  if (version === 4) {
    return new V4Field(seed);
  }
  if (version === 5) {
    return new V4Field(seed, 'natural-landmass');
  }
  throw new Error(`Unsupported worldGenVersion: ${version}`);
}
