import { TILE_IDS } from '@pokemon/game-data';
import type { TerrainField } from './terrain-field';
import { V4MacroPlan } from './v4-macro-plan';
import { V4TerrainPlanCache } from './v4-plan';
import { ContinentService, type ContinentPlan } from '../../continent';
import { isV0RoadTile } from './settlement-sites';
import { getStartSpawn } from './start-village';
import { isTreeClippingBuilding } from '../village-rules';
import { V4_CONFIG } from './v4-config';

/** World Gen v4: macro continent selection plus natural islands and coasts. */
export class V4Field implements TerrainField {
  public readonly version = 4;
  public readonly seed: number;
  public readonly macroPlan: V4MacroPlan;
  public readonly continentPlan: ContinentPlan;
  private readonly planCache: V4TerrainPlanCache;
  private readonly settlementRoadNeighborhood = new Set<string>();

  public constructor(seed: number) {
    this.seed = seed;
    this.continentPlan = new ContinentService(seed).getPlan();
    this.macroPlan = this.continentPlan.macroPlan;
    this.planCache = new V4TerrainPlanCache(seed, this.macroPlan);
    for (const settlement of this.continentPlan.settlements) {
      const mx = Math.floor(settlement.gx / this.continentPlan.cellSize);
      const my = Math.floor(settlement.gy / this.continentPlan.cellSize);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          this.settlementRoadNeighborhood.add(`${mx + dx},${my + dy}`);
        }
      }
    }
  }

  public get planCacheSize(): number {
    return this.planCache.size;
  }

  private getCell(
    gx: number,
    gy: number
  ): {
    isOcean: boolean;
    isSand: boolean;
    isHill: boolean;
    isRiver: boolean;
    isLake: boolean;
    isDesert: boolean;
    isDarkLand: boolean;
  } {
    const cx = Math.floor(gx / 16);
    const cy = Math.floor(gy / 16);
    const lx = ((gx % 16) + 16) % 16;
    const ly = ((gy % 16) + 16) % 16;
    const plan = this.planCache.getPlan(cx, cy);
    const index = ly * 16 + lx;
    return {
      isOcean: plan.isOcean[index] === 1,
      isSand: plan.isSand[index] === 1,
      isHill: plan.isHill[index] === 1,
      isRiver: plan.isRiver?.[index] === 1,
      isLake: plan.isLake?.[index] === 1,
      isDesert: plan.isDesert?.[index] === 1,
      isDarkLand: plan.isDarkLand?.[index] === 1,
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

  public isDesert = (gx: number, gy: number): boolean => this.getCell(gx, gy).isDesert;

  public isDarkLand = (gx: number, gy: number): boolean => this.getCell(gx, gy).isDarkLand;

  public isRoad(gx: number, gy: number): boolean {
    // Roads are local village paths only and never occupy elevated terrain.
    if (this.isHill(gx, gy)) return false;
    if (this.isContinentRoadTile(gx, gy)) return true;

    // Village paths are relevant only near a settlement. Avoid scanning every
    // V4 placement for every ordinary grass tile during large map exports.
    const mx = Math.floor(gx / this.continentPlan.cellSize);
    const my = Math.floor(gy / this.continentPlan.cellSize);
    const nearStarter = Math.abs(gx) <= 160 && Math.abs(gy) <= 160;
    if (!nearStarter && !this.settlementRoadNeighborhood.has(`${mx},${my}`)) return false;
    return isV0RoadTile(gx, gy, this);
  }

  private isContinentRoadTile(gx: number, gy: number): boolean {
    const localX = gx - this.continentPlan.bounds.gx0 * this.continentPlan.cellSize;
    const localY = gy - this.continentPlan.bounds.gy0 * this.continentPlan.cellSize;
    const width = this.continentPlan.bounds.cols * this.continentPlan.cellSize;
    const height = this.continentPlan.bounds.rows * this.continentPlan.cellSize;
    return (
      localX >= 0 &&
      localY >= 0 &&
      localX < width &&
      localY < height &&
      this.continentPlan.roadMask[localY * width + localX] === 1
    );
  }

  public isBridge(_gx: number, _gy: number): boolean {
    return false;
  }

  public isWater(gx: number, gy: number): boolean {
    const cell = this.getCell(gx, gy);
    return cell.isOcean || cell.isRiver || cell.isLake;
  }

  public isLake(gx: number, gy: number): boolean {
    return this.getCell(gx, gy).isLake;
  }

  public isWaterOrBridge(gx: number, gy: number): boolean {
    return this.isWater(gx, gy);
  }

  public isNearWater(gx: number, gy: number, radius = 1): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (this.isWater(gx + dx, gy + dy)) return true;
      }
    }
    return false;
  }

  public isNearCliffEdge(gx: number, gy: number): boolean {
    const selfHill = this.isHill(gx, gy);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (this.isHill(gx + dx, gy + dy) !== selfHill) return true;
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
    if (w && s) return TILE_IDS.shore_corner_in_flip;
    if (w && n) return TILE_IDS.shore_corner_in;
    if (e && s) return TILE_IDS.shore_corner_in_es;
    if (e && n) return TILE_IDS.shore_corner_in_en;
    if (w) return TILE_IDS.shore_v;
    if (s) return TILE_IDS.shore_h;
    if (n) return TILE_IDS.shore_h_top;
    if (e) return TILE_IDS.shore_v_right;
    if (isS(gx - 1, gy + 1)) return TILE_IDS.shore_corner_out_flip;
    if (isS(gx - 1, gy - 1)) return TILE_IDS.shore_corner_out;
    if (isS(gx + 1, gy + 1)) return TILE_IDS.shore_corner_out_se;
    if (isS(gx + 1, gy - 1)) return TILE_IDS.shore_corner_out_ne;
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
        if (this.isSand(c, r) || this.isOcean(c, r) || this.isRoad(c, r)) return false;
        const hill = this.isHill(c, r);
        if (firstHill === null) firstHill = hill;
        else if (hill !== firstHill) return false;
        if (hill && this.isNearCliffEdge(c, r)) return false;
      }
    }
    const rootR = Math.floor((ty + 112) / ts);
    const rootC1 = Math.floor((tx + 18) / ts);
    const rootC2 = Math.floor((tx + 46) / ts);
    if (this.isSand(rootC1, rootR) || this.isSand(rootC2, rootR)) return false;
    if (this.isOcean(rootC1, rootR) || this.isOcean(rootC2, rootR)) return false;
    return !isTreeClippingBuilding(tx, ty, this);
  }

  public isValidPalmTreePos(gx: number, gy: number): boolean {
    return (
      this.isSand(gx, gy) &&
      !this.isOcean(gx, gy) &&
      !this.isHill(gx, gy) &&
      this.isNearWater(gx, gy, 3)
    );
  }

  public getMacroStats(): V4FieldMacroStats {
    return {
      ...this.macroPlan.homeContinent,
      sourceOffset: this.macroPlan.sourceOffset,
      cellSize: V4_CONFIG.CELL_SIZE,
    };
  }
}

export interface V4FieldMacroStats {
  readonly sourceMinMX: number;
  readonly sourceMaxMX: number;
  readonly sourceMinMY: number;
  readonly sourceMaxMY: number;
  readonly areaCells: number;
  readonly originSourceCell: { mx: number; my: number };
  readonly sourceOffset: { gx: number; gy: number };
  readonly cellSize: number;
}
