import type { V4HomeContinentStats, V4MacroPlan } from '../../maps/terrain-field/v4-macro-plan';
import { createRegionPlan, type RegionInfo } from './regions';
import {
  createRoadMask,
  createSettlementNetwork,
  type RoadEdge,
  type SettlementInfo,
} from './settlement-network';

export interface ContinentBounds {
  readonly gx0: number;
  readonly gy0: number;
  readonly cols: number;
  readonly rows: number;
}

export interface ContinentStartVillage {
  readonly gx: number;
  readonly gy: number;
  readonly name: string;
}

/** Stable C2 plan contract. Region, settlement and POI arrays are reserved for later phases. */
export interface ContinentPlan {
  readonly version: 4;
  readonly seed: number;
  readonly cellSize: number;
  readonly bounds: ContinentBounds;
  readonly landMask: Uint8Array;
  readonly regionId: Uint8Array;
  readonly difficulty: Float32Array;
  readonly regions: readonly RegionInfo[];
  readonly settlements: readonly SettlementInfo[];
  readonly roads: readonly RoadEdge[];
  /** Reserved tile-resolution mask for future world-scale routes. */
  readonly roadMask: Uint8Array;
  readonly pois: readonly unknown[];
  readonly homeContinent: V4HomeContinentStats;
  readonly startVillage: ContinentStartVillage;
  readonly macroPlan: V4MacroPlan;
}

export function createContinentPlan(seed: number, macroPlan: V4MacroPlan): ContinentPlan {
  const cellSize = 32;
  const sourceOffsetMX = Math.floor(macroPlan.sourceOffset.gx / cellSize);
  const sourceOffsetMY = Math.floor(macroPlan.sourceOffset.gy / cellSize);
  const bounds: ContinentBounds = {
    gx0: macroPlan.homeContinent.sourceMinMX - sourceOffsetMX,
    gy0: macroPlan.homeContinent.sourceMinMY - sourceOffsetMY,
    cols: macroPlan.homeContinent.sourceMaxMX - macroPlan.homeContinent.sourceMinMX + 1,
    rows: macroPlan.homeContinent.sourceMaxMY - macroPlan.homeContinent.sourceMinMY + 1,
  };

  const cellCount = bounds.cols * bounds.rows;
  const landMask = new Uint8Array(cellCount);
  const regionId = new Uint8Array(cellCount);
  regionId.fill(255);
  const difficulty = new Float32Array(cellCount);

  for (let y = 0; y < bounds.rows; y++) {
    for (let x = 0; x < bounds.cols; x++) {
      const index = y * bounds.cols + x;
      if (macroPlan.isHomeContinentCell(bounds.gx0 + x, bounds.gy0 + y)) {
        landMask[index] = 1;
      }
    }
  }

  const regionPlan = createRegionPlan({
    seed,
    cellSize,
    bounds,
    landMask,
    macroPlan,
  });
  const settlementNetwork = createSettlementNetwork({
    seed,
    cellSize,
    bounds,
    landMask,
    regionId: regionPlan.regionId,
    regions: regionPlan.regions,
  });
  const roadMask = createRoadMask({ cellSize, bounds, landMask }, settlementNetwork.roads);

  return {
    version: 4,
    seed,
    cellSize,
    bounds,
    landMask,
    regionId: regionPlan.regionId,
    difficulty,
    regions: regionPlan.regions,
    settlements: settlementNetwork.settlements,
    roads: settlementNetwork.roads,
    roadMask,
    pois: [],
    homeContinent: macroPlan.homeContinent,
    startVillage: { gx: 0, gy: 0, name: 'Twinleaf Hamlet' },
    macroPlan,
  };
}
