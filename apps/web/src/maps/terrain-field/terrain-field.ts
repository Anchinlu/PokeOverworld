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

export { LegacyStripField } from './legacy-field';
export { V0Field } from './v0-field';
export { V3Field } from './v3-field';

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
  throw new Error(`Unsupported worldGenVersion: ${version}`);
}

