import type { TerrainField } from './terrain-field';
import {
  isOceanTile,
  isSandTile,
  isHillTile,
  isRoadTile,
  isBridgeTile,
  isWaterTile,
  isLakeTile,
  isWaterOrBridge,
  isNearWater,
  isNearCliffEdge,
  getOceanTileId,
  getRoadCenterX,
  isValidTreePosGlobal,
  isValidPalmTreePosGlobal,
} from '../terrain-rules';

/**
 * LegacyStripField (worldGenVersion = 1)
 *
 * Wraps existing terrain-rules logic with 100% byte-for-byte fidelity,
 * guaranteeing all legacy strip-coordinate worlds and golden hashes remain intact.
 */
export class LegacyStripField implements TerrainField {
  public readonly version = 1;
  public readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  public isOcean(gx: number, gy: number, hasBeach = true): boolean {
    return isOceanTile(gx, gy, this.seed, hasBeach);
  }

  public isSand(gx: number, gy: number, hasBeach = true): boolean {
    return isSandTile(gx, gy, this.seed, hasBeach);
  }

  public isHill(
    gx: number,
    gy: number,
    hasHills = true,
    hasRoad = true,
    hasBeach = true
  ): boolean {
    return isHillTile(gx, gy, this.seed, hasHills, hasRoad, hasBeach);
  }

  public isRoad(gx: number, gy: number, hasRoad = true, hasBeach = true): boolean {
    return isRoadTile(gx, gy, this.seed, hasRoad, hasBeach);
  }

  public isBridge(gx: number, gy: number, hasRoad = true): boolean {
    return isBridgeTile(gx, gy, this.seed, hasRoad);
  }

  public isWater(
    gx: number,
    gy: number,
    hasWater = true,
    hasRoad = true,
    hasBeach = true,
    hasHills = true
  ): boolean {
    return isWaterTile(gx, gy, this.seed, hasWater, hasRoad, hasBeach, hasHills);
  }

  public isLake(
    gx: number,
    gy: number,
    hasRoad = true,
    hasBeach = true,
    hasHills = true
  ): boolean {
    return isLakeTile(gx, gy, this.seed, hasRoad, hasBeach, hasHills);
  }

  public isWaterOrBridge(
    gx: number,
    gy: number,
    hasWater = true,
    hasRoad = true,
    hasBeach = true,
    hasHills = true
  ): boolean {
    return isWaterOrBridge(gx, gy, this.seed, hasWater, hasRoad, hasBeach, hasHills);
  }

  public isNearWater(gx: number, gy: number, radius = 1, hasWater = true): boolean {
    return isNearWater(gx, gy, this.seed, radius, hasWater);
  }

  public isNearCliffEdge(gx: number, gy: number): boolean {
    return isNearCliffEdge(gx, gy, this.seed);
  }

  public getOceanTileId(gx: number, gy: number, hasBeach = true): number {
    return getOceanTileId(gx, gy, this.seed, hasBeach);
  }

  public getSpawn(): { gx: number; gy: number } {
    return {
      gx: getRoadCenterX(0, this.seed),
      gy: 0,
    };
  }

  public getRoadCenterX(gy: number): number {
    return getRoadCenterX(gy, this.seed);
  }

  public isValidTreePos(tx: number, ty: number): boolean {
    return isValidTreePosGlobal(tx, ty, this.seed);
  }

  public isValidPalmTreePos(gx: number, gy: number): boolean {
    return isValidPalmTreePosGlobal(gx, gy, this.seed);
  }
}
