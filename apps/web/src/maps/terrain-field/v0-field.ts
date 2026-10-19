import { TILE_IDS } from '@pokemon/game-data';
import type { TerrainField } from './terrain-field';
import { TerrainPlanCache } from './terrain-plan';
import { isV0RoadTile } from './settlement-sites';
import { getStartSpawn } from './start-village';
import { isTreeClippingBuilding } from '../village-rules';

/**
 * V0Field (worldGenVersion = 2)
 *
 * Implements the infinite 2D procedural world according to WORLD_GEN_V0_DEV_GUIDE:
 * - 2D Continentality with Start Village Anchor Land Boost
 * - 5-tile Coastal Sand Fringes
 * - Clean Hill Plateaus with Morphological Opening/Closing
 * - LRU Cached Chunk Plans
 * - 2D Settlements with Internal Paved Roads & Fixed Starter Hamlet (Twinleaf)
 */
export class V0Field implements TerrainField {
  public readonly version = 2;
  public readonly seed: number;
  private readonly planCache: TerrainPlanCache;

  constructor(seed: number) {
    this.seed = seed;
    this.planCache = new TerrainPlanCache(seed);
  }

  public get planCacheSize(): number {
    return this.planCache.size;
  }

  private getCell(gx: number, gy: number): { isOcean: boolean; isSand: boolean; isHill: boolean } {
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
    };
  }

  public isOcean(gx: number, gy: number): boolean {
    return this.getCell(gx, gy).isOcean;
  }

  public isSand(gx: number, gy: number): boolean {
    return this.getCell(gx, gy).isSand;
  }

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
    if (w && s) {
      // Sand to the West and South (ocean to North-East)
      return TILE_IDS.shore_corner_in_flip;
    }
    if (w && n) {
      // Sand to the West and North (ocean to South-East)
      return TILE_IDS.shore_corner_in;
    }

    // 2. Single cardinal sand contact (straight shore edges)
    if (w) {
      // Sand on West, Ocean on East
      return TILE_IDS.shore_v;
    }
    if (s) {
      // Sand on South, Ocean on North -> rotated -90° (sand at bottom, ocean at top)
      return TILE_IDS.shore_h;
    }
    if (n) {
      // Sand on North, Ocean on South -> rotated 90° (sand at top, ocean at bottom)
      return TILE_IDS.shore_h_top;
    }
    if (e) {
      // Sand on East, Ocean on West -> rotated 180°
      return TILE_IDS.shore_v_right;
    }

    // 3. Diagonal-only sand contact (convex outer corners, NO cardinal sand)
    const sw = isS(gx - 1, gy + 1);
    if (sw) {
      // Convex corner pointing into water towards North-East (sand tip at South-West)
      return TILE_IDS.shore_corner_out_flip;
    }

    const nw = isS(gx - 1, gy - 1);
    if (nw) {
      // Convex corner pointing into water towards South-East (sand tip at North-West)
      return TILE_IDS.shore_corner_out;
    }

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

    // Palm tree must be strictly on coastal sand fringe facing ocean
    return this.isNearWater(gx, gy, 3);
  }
}
