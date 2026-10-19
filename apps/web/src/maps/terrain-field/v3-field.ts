import { TILE_IDS } from '@pokemon/game-data';
import type { TerrainField } from './terrain-field';
import { V3TerrainPlanCache } from './v3-plan';
import {
  computeV3EffectiveDistance,
  computeV3CorridorInfluence,
  computeV3SafetyLevel,
} from './v3-config';
import { isV0RoadTile } from './settlement-sites';
import { getStartSpawn } from './start-village';
import { isTreeClippingBuilding } from '../village-rules';

/**
 * V3Field (worldGenVersion = 3)
 *
 * Implements the Asymmetric Valley with Natural Opening Corridors:
 * - Compact safe core (R=20) around starter village (Twinleaf Hamlet)
 * - Low-frequency organic boundary noise
 * - 3 Directional soft corridors leading into the world (Route 1 NE, Lake WSW, Frontier SSE)
 * - Earlier natural terrain transitions (coasts, lakes, hill ranges) framing the valley
 * - LRU Cached Chunk Plans
 * - 100% deterministic per seed
 */
export class V3Field implements TerrainField {
  public readonly version = 3;
  public readonly seed: number;
  private readonly planCache: V3TerrainPlanCache;

  constructor(seed: number) {
    this.seed = seed;
    this.planCache = new V3TerrainPlanCache(seed);
  }

  public get planCacheSize(): number {
    return this.planCache.size;
  }

  private getCell(gx: number, gy: number): {
    isOcean: boolean;
    isSand: boolean;
    isHill: boolean;
    isDesert: boolean;
    isDarkLand: boolean;
  } {
    const cx = Math.floor(gx / 16);
    const cy = Math.floor(gy / 16);
    const lx = ((gx % 16) + 16) % 16;
    const ly = ((gy % 16) + 16) % 16;

    const plan = this.planCache.getPlan(cx, cy);
    const idx = ly * 16 + lx;

    return {
      isOcean: plan.isOcean[idx] === 1,
      isSand: plan.isSand[idx] === 1,
      isHill: plan.isHill[idx] === 1,
      isDesert: Boolean(plan.isDesert && plan.isDesert[idx] === 1),
      isDarkLand: Boolean(plan.isDarkLand && plan.isDarkLand[idx] === 1),
    };
  }

  public isOcean(gx: number, gy: number): boolean {
    return this.getCell(gx, gy).isOcean;
  }

  public isSand(gx: number, gy: number): boolean {
    return this.getCell(gx, gy).isSand;
  }

  public isDesert = (gx: number, gy: number): boolean => {
    return this.getCell(gx, gy).isDesert;
  };

  public isDarkLand = (gx: number, gy: number): boolean => {
    return this.getCell(gx, gy).isDarkLand;
  };

  public isHill(gx: number, gy: number): boolean {
    return this.getCell(gx, gy).isHill;
  }

  public isRoad(gx: number, gy: number): boolean {
    return isV0RoadTile(gx, gy, this);
  }

  public isBridge(_gx: number, _gy: number): boolean {
    return false;
  }

  public isWater(gx: number, gy: number): boolean {
    return this.isOcean(gx, gy);
  }

  public isLake(_gx: number, _gy: number): boolean {
    return false;
  }

  public isWaterOrBridge(gx: number, gy: number): boolean {
    return this.isWater(gx, gy);
  }

  public isNearWater(gx: number, gy: number, radius = 1): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (this.isWater(gx + dx, gy + dy)) {
          return true;
        }
      }
    }
    return false;
  }

  public isNearCliffEdge(gx: number, gy: number): boolean {
    const selfHill = this.isHill(gx, gy);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (this.isHill(gx + dx, gy + dy) !== selfHill) {
          return true;
        }
      }
    }
    return false;
  }

  public getOceanTileId(gx: number, gy: number, hasBeach = true): number {
    if (!hasBeach) return TILE_IDS.ocean_water;

    const isS = (x: number, y: number) => this.isSand(x, y);

    const w = isS(gx - 1, gy);
    const e = isS(gx + 1, gy);
    const n = isS(gx, gy - 1);
    const s = isS(gx, gy + 1);

    // 1. Dual cardinal sand contact (concave inner corners)
    if (w && s) return TILE_IDS.shore_corner_in_flip;
    if (w && n) return TILE_IDS.shore_corner_in;
    if (e && s) return TILE_IDS.shore_corner_in_es;
    if (e && n) return TILE_IDS.shore_corner_in_en;

    // 2. Single cardinal sand contact (straight shore edges)
    if (w) return TILE_IDS.shore_v;
    if (s) return TILE_IDS.shore_h;
    if (n) return TILE_IDS.shore_h_top;
    if (e) return TILE_IDS.shore_v_right;

    // 3. Diagonal-only sand contact (convex outer corners, NO cardinal sand)
    const sw = isS(gx - 1, gy + 1);
    if (sw) return TILE_IDS.shore_corner_out_flip;

    const nw = isS(gx - 1, gy - 1);
    if (nw) return TILE_IDS.shore_corner_out;

    const se = isS(gx + 1, gy + 1);
    if (se) return TILE_IDS.shore_corner_out_se;

    const ne = isS(gx + 1, gy - 1);
    if (ne) return TILE_IDS.shore_corner_out_ne;

    return TILE_IDS.ocean_water;
  }

  public getSpawn(): { gx: number; gy: number } {
    return getStartSpawn();
  }

  public getRoadCenterX(_gy: number): number {
    return 0;
  }

  public isValidTreePos(tx: number, ty: number): boolean {
    const ts = 32;
    const cStart = Math.floor((tx + 6) / ts);
    const cEnd = Math.floor((tx + 58) / ts);
    const rStart = Math.floor((ty + 50) / ts);
    const rEnd = Math.floor((ty + 118) / ts);

    let firstHill: boolean | null = null;
    for (let r = rStart; r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        if (this.isSand(c, r) || this.isOcean(c, r) || this.isRoad(c, r)) {
          return false;
        }
        const h = this.isHill(c, r);
        if (firstHill === null) {
          firstHill = h;
        } else if (h !== firstHill) {
          return false;
        }
        if (h && this.isNearCliffEdge(c, r)) {
          return false;
        }
      }
    }

    const rootR = Math.floor((ty + 112) / ts);
    const rootC1 = Math.floor((tx + 18) / ts);
    const rootC2 = Math.floor((tx + 46) / ts);

    if (this.isSand(rootC1, rootR) || this.isSand(rootC2, rootR)) return false;
    if (this.isOcean(rootC1, rootR) || this.isOcean(rootC2, rootR)) return false;

    if (isTreeClippingBuilding(tx, ty, this)) return false;

    return true;
  }

  public isValidPalmTreePos(gx: number, gy: number): boolean {
    if (!this.isSand(gx, gy)) return false;
    if (this.isOcean(gx, gy)) return false;
    if (this.isHill(gx, gy)) return false;

    return this.isNearWater(gx, gy, 3);
  }

  // --- Diagnostic & Inspection Helpers ---

  public getEffectiveDistance(gx: number, gy: number): {
    effectiveDist: number;
    corridorInfluence: number;
    radialDist: number;
  } {
    return computeV3EffectiveDistance(gx, gy, this.seed);
  }

  public getCorridorInfluence(gx: number, gy: number): number {
    return computeV3CorridorInfluence(gx, gy, this.seed).maxInfluence;
  }

  public getSafetyLevel(gx: number, gy: number): number {
    return computeV3SafetyLevel(gx, gy, this.seed);
  }
}
