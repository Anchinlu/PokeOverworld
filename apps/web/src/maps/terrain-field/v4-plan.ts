import { dilate, erode, open, close } from './morphology';
import { V4_CONFIG, sampleV4ContinentalValue } from './v4-config';
import { fbm2 } from './noise';
import type { ChunkTerrainPlan } from './terrain-plan';
import { V4MacroPlan } from './v4-macro-plan';
import {
  getLakePlacement,
  isLakeTileVariant,
  isRiverTile,
  type LakePlacement,
} from '../terrain-rules';

export class V4TerrainPlanCache {
  private readonly cache = new Map<string, ChunkTerrainPlan>();
  private readonly seed: number;

  public constructor(
    seed: number,
    private readonly macroPlan: V4MacroPlan
  ) {
    this.seed = seed;
  }

  public get size(): number {
    return this.cache.size;
  }

  public getPlan(cx: number, cy: number): ChunkTerrainPlan {
    const key = `${cx},${cy}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const plan = this.computePlan(cx, cy);
    if (this.cache.size >= V4_CONFIG.MAX_CACHED_PLANS) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, plan);
    return plan;
  }

  private computePlan(cx: number, cy: number): ChunkTerrainPlan {
    const margin = V4_CONFIG.PLAN_MARGIN;
    const totalDim = V4_CONFIG.CHUNK_TILES + margin * 2;
    const totalCells = totalDim * totalDim;
    const startGX = cx * V4_CONFIG.CHUNK_TILES - margin;
    const startGY = cy * V4_CONFIG.CHUNK_TILES - margin;

    const landGrid = new Uint8Array(totalCells);

    for (let y = 0; y < totalDim; y++) {
      for (let x = 0; x < totalDim; x++) {
        const gx = startGX + x;
        const gy = startGY + y;
        const index = y * totalDim + x;
        const startCore = gx * gx + gy * gy <= V4_CONFIG.START_CORE_RADIUS ** 2;
        const source = this.macroPlan.getSourceCoordinates(gx, gy);
        const continentalValue = sampleV4ContinentalValue(source.gx, source.gy, this.seed);
        const macroLand = this.macroPlan.isMacroLandAtWorld(gx, gy);

        // The macro mask controls large geography; detail makes coastlines and
        // island edges irregular without breaking chunk determinism.
        const threshold = macroLand ? V4_CONFIG.SEA_LEVEL - 0.055 : V4_CONFIG.SEA_LEVEL + 0.095;
        if (startCore || continentalValue >= threshold) landGrid[index] = 1;
      }
    }

    const erodedLand = erode(landGrid, totalDim, totalDim, V4_CONFIG.BEACH_WIDTH);
    const sandGrid = new Uint8Array(totalCells);
    for (let index = 0; index < totalCells; index++) {
      if (landGrid[index] === 1 && erodedLand[index] === 0) sandGrid[index] = 1;
    }

    const sandBuffer = dilate(sandGrid, totalDim, totalDim, 4);
    const rawHillGrid = new Uint8Array(totalCells);
    for (let y = 0; y < totalDim; y++) {
      for (let x = 0; x < totalDim; x++) {
        const index = y * totalDim + x;
        const gx = startGX + x;
        const gy = startGY + y;
        if (
          landGrid[index] === 1 &&
          sandBuffer[index] === 0 &&
          gx * gx + gy * gy > V4_CONFIG.START_CORE_RADIUS ** 2
        ) {
          const elevation = fbm2(
            (gx + this.macroPlan.sourceOffset.gx) / V4_CONFIG.HILL_SCALE,
            (gy + this.macroPlan.sourceOffset.gy) / V4_CONFIG.HILL_SCALE,
            this.seed,
            V4_CONFIG.HILL_SALT,
            3
          );
          if (elevation >= V4_CONFIG.HILL_THRESHOLD) rawHillGrid[index] = 1;
        }
      }
    }

    const hillClosed = close(open(rawHillGrid, totalDim, totalDim, 2), totalDim, totalDim, 2);
    const strictSandBuffer = dilate(sandGrid, totalDim, totalDim, 2);
    const hillGrid = new Uint8Array(totalCells);
    for (let index = 0; index < totalCells; index++) {
      if (hillClosed[index] === 1 && strictSandBuffer[index] === 0) hillGrid[index] = 1;
    }

    const rawDesertGrid = new Uint8Array(totalCells);
    const rawDarkGrid = new Uint8Array(totalCells);
    for (let y = 0; y < totalDim; y++) {
      for (let x = 0; x < totalDim; x++) {
        const index = y * totalDim + x;
        // Desert may touch the beach directly. The beach itself still wins in
        // the final terrain priority, while removing the artificial grass
        // separator created by the old strict sand buffer.
        if (landGrid[index] === 0 || sandGrid[index] === 1) continue;
        const gx = startGX + x + this.macroPlan.sourceOffset.gx;
        const gy = startGY + y + this.macroPlan.sourceOffset.gy;
        const arid = fbm2(
          gx / V4_CONFIG.DESERT_SCALE,
          gy / V4_CONFIG.DESERT_SCALE,
          this.seed,
          V4_CONFIG.DESERT_SALT,
          3
        );
        const dark = fbm2(
          gx / V4_CONFIG.DARK_SCALE,
          gy / V4_CONFIG.DARK_SCALE,
          this.seed,
          V4_CONFIG.DARK_SALT,
          3
        );
        if (arid >= V4_CONFIG.DESERT_THRESHOLD) rawDesertGrid[index] = 1;
        else if (dark >= V4_CONFIG.DARK_THRESHOLD) rawDarkGrid[index] = 1;
      }
    }

    const desertGrid = close(open(rawDesertGrid, totalDim, totalDim, 2), totalDim, totalDim, 2);
    const darkGrid = close(open(rawDarkGrid, totalDim, totalDim, 2), totalDim, totalDim, 2);

    const isOcean = new Uint8Array(256);
    const isSand = new Uint8Array(256);
    const isHill = new Uint8Array(256);
    const isRiver = new Uint8Array(256);
    const isLake = new Uint8Array(256);
    const isDesert = new Uint8Array(256);
    const isDarkLand = new Uint8Array(256);
    const lakePlacements = new Map<number, LakePlacement | null>();

    for (let ly = 0; ly < 16; ly++) {
      for (let lx = 0; lx < 16; lx++) {
        const sourceIndex = (margin + ly) * totalDim + margin + lx;
        const targetIndex = ly * 16 + lx;
        const gx = cx * V4_CONFIG.CHUNK_TILES + lx;
        const gy = cy * V4_CONFIG.CHUNK_TILES + ly;
        if (gx * gx + gy * gy <= V4_CONFIG.START_CORE_RADIUS ** 2) {
          // Keep the starter village footprint flat and free of shoreline
          // decoration even when the macro coastline passes nearby.
          continue;
        }
        const gxWithMargin = startGX + lx;
        const gyWithMargin = startGY + ly;
        const isStartCore =
          gxWithMargin * gxWithMargin + gyWithMargin * gyWithMargin <=
          V4_CONFIG.START_CORE_RADIUS ** 2;
        const freshwaterAllowed =
          landGrid[sourceIndex] === 1 &&
          sandGrid[sourceIndex] === 0 &&
          hillGrid[sourceIndex] === 0 &&
          desertGrid[sourceIndex] === 0 &&
          darkGrid[sourceIndex] === 0 &&
          !isStartCore;

        // Reuse the established deterministic river/lake silhouettes, but
        // clip them to the V4 continent and terrain masks. This restores the
        // freshwater biome without reviving the old radial world generator.
        // Desert and Dark Land reserve their own future water/lore rules.
        const riverBaseY = Math.floor(gyWithMargin / 96) * 96 + 48;
        const riverCandidate =
          Math.abs(gyWithMargin - riverBaseY) <= 10 &&
          isRiverTile(gxWithMargin, gyWithMargin, this.seed);
        const lakeBand = Math.floor(gyWithMargin / 64);
        if (!lakePlacements.has(lakeBand)) {
          lakePlacements.set(lakeBand, getLakePlacement(lakeBand, this.seed));
        }
        const lakePlacement = lakePlacements.get(lakeBand);
        const lakeCandidate =
          lakePlacement !== null &&
          lakePlacement !== undefined &&
          isLakeTileVariant(
            gxWithMargin,
            gyWithMargin,
            lakePlacement.cx,
            lakePlacement.cy,
            lakePlacement.variant
          );

        if (freshwaterAllowed && riverCandidate) {
          isRiver[targetIndex] = 1;
        } else if (freshwaterAllowed && lakeCandidate) {
          isLake[targetIndex] = 1;
        } else if (landGrid[sourceIndex] === 0) isOcean[targetIndex] = 1;
        else if (sandGrid[sourceIndex] === 1) isSand[targetIndex] = 1;
        else if (hillGrid[sourceIndex] === 1) isHill[targetIndex] = 1;
        else if (desertGrid[sourceIndex] === 1) isDesert[targetIndex] = 1;
        else if (darkGrid[sourceIndex] === 1) isDarkLand[targetIndex] = 1;
      }
    }

    return { cx, cy, isOcean, isSand, isHill, isRiver, isLake, isDesert, isDarkLand };
  }
}
