import { TILE_IDS } from '@pokemon/game-data';
import type { TerrainField } from './terrain-field';
import { V4MacroPlan } from './v4-macro-plan';
import { V4TerrainPlanCache } from './v4-plan';
import { ContinentService, type ContinentPlan } from '../../continent';
import { isV0RoadTile } from './settlement-sites';
import { getStartSpawn } from './start-village';
import { isTreeClippingBuilding } from '../village-rules';
import { V4_CONFIG, type V4LandmassProfile } from './v4-config';

/** World Gen v4 classic / v5 natural-landmass field. */
export class V4Field implements TerrainField {
  public readonly version: number;
  public readonly profile: V4LandmassProfile;
  public readonly seed: number;
  public readonly macroPlan: V4MacroPlan;
  public readonly continentPlan: ContinentPlan;
  private readonly planCache: V4TerrainPlanCache;
  private readonly settlementRoadNeighborhood = new Set<string>();

  public constructor(seed: number, profile: V4LandmassProfile = 'classic') {
    this.profile = profile;
    this.version = profile === 'natural-landmass' ? 5 : 4;
    this.seed = seed;
    this.continentPlan = new ContinentService(seed).getPlan();
    this.macroPlan = this.continentPlan.macroPlan;
    this.planCache = new V4TerrainPlanCache(seed, this.macroPlan, profile);
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
    isAutumn: boolean;
    isApricornPlain: boolean;
    isSnow: boolean;
    isRockyHighland: boolean;
    isRockyWater: boolean;
    isHighCliff: boolean;
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
      isAutumn: plan.isAutumn?.[index] === 1,
      isApricornPlain: plan.isApricornPlain?.[index] === 1,
      isSnow: plan.isSnow?.[index] === 1,
      isRockyHighland: plan.isRockyHighland?.[index] === 1,
      isRockyWater: plan.isRockyWater?.[index] === 1,
      isHighCliff: plan.isHighCliff?.[index] === 1,
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

  public isAutumn = (gx: number, gy: number): boolean => this.getCell(gx, gy).isAutumn;

  public isApricornPlain = (gx: number, gy: number): boolean =>
    this.getCell(gx, gy).isApricornPlain;

  public isSnow = (gx: number, gy: number): boolean => this.getCell(gx, gy).isSnow;

  public isRockyHighland = (gx: number, gy: number): boolean =>
    this.getCell(gx, gy).isRockyHighland;

  public isRockyWater = (gx: number, gy: number): boolean => this.getCell(gx, gy).isRockyWater;

  public isHighCliff = (gx: number, gy: number): boolean => this.getCell(gx, gy).isHighCliff;

  public isHighCliffPlateau = (gx: number, gy: number): boolean =>
    this.isHighCliff(gx, gy) &&
    this.isHighCliff(gx, gy + 1) &&
    // A plateau is the top two rows of a High Cliff. Requiring the two tiles
    // above the current row to be outside the cliff prevents a large noise
    // blob from incorrectly making its middle rows walkable plateau.
    (!this.isHighCliff(gx, gy - 1) || !this.isHighCliff(gx, gy - 2));

  public isRoad(gx: number, gy: number): boolean {
    // Roads are local village paths only and never occupy elevated terrain.
    if (this.isHill(gx, gy) || this.isSnow(gx, gy) || this.isRockyHighland(gx, gy)) return false;
    if (this.isContinentRoadTile(gx, gy)) return true;

    // Village paths are relevant only near a settlement. Avoid scanning every
    // V4 placement for every ordinary grass tile during large map exports.
    const mx = Math.floor(gx / this.continentPlan.cellSize);
    const my = Math.floor(gy / this.continentPlan.cellSize);
    const nearStarter = Math.abs(gx) <= 160 && Math.abs(gy) <= 160;
    const nearHighway = Math.abs(gx) <= 80;
    if (!nearStarter && !nearHighway && !this.settlementRoadNeighborhood.has(`${mx},${my}`)) return false;
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
    const preferred = getStartSpawn(this.seed);
    if (this.isStartPlain(preferred.gx, preferred.gy)) return preferred;

    // The village door is normally inside the forced starter core. Keep a
    // deterministic nearby fallback for unusual seeds or custom village
    // layouts so a new world can never start on a special biome or water.
    for (let radius = 1; radius <= V4_CONFIG.START_CORE_RADIUS; radius++) {
      for (let gy = -radius; gy <= radius; gy++) {
        for (let gx = -radius; gx <= radius; gx++) {
          if (Math.max(Math.abs(gx), Math.abs(gy)) !== radius) continue;
          if (this.isStartPlain(gx, gy)) return { gx, gy };
        }
      }
    }

    return { gx: 0, gy: 0 };
  }

  private isStartPlain(gx: number, gy: number): boolean {
    return (
      !this.isOcean(gx, gy) &&
      !this.isSand(gx, gy) &&
      !this.isWater(gx, gy) &&
      !this.isHill(gx, gy) &&
      !this.isDesert(gx, gy) &&
      !this.isDarkLand(gx, gy) &&
      !this.isAutumn(gx, gy) &&
      !this.isSnow(gx, gy) &&
      !this.isRockyHighland(gx, gy)
    );
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
        if (this.isSand(c, r) || this.isWater(c, r) || this.isRoad(c, r)) return false;
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
    if (this.isWater(rootC1, rootR) || this.isWater(rootC2, rootR)) return false;
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
