import { V0_CONFIG, smoothstep } from './v0-config';
import { fbm2 } from './noise';
import { erode, dilate, open, close } from './morphology';

export interface ChunkTerrainPlan {
  readonly cx: number;
  readonly cy: number;
  // Interior 16x16 boolean bitmasks for this chunk
  // Flattened length 256 (16 * 16), index = ly * 16 + lx
  readonly isOcean: Uint8Array;
  readonly isSand: Uint8Array;
  readonly isHill: Uint8Array;
  /** Freshwater masks are optional for legacy plans and populated by V4. */
  readonly isRiver?: Uint8Array;
  readonly isLake?: Uint8Array;
  readonly isDesert?: Uint8Array;
  readonly isDarkLand?: Uint8Array;
  readonly isAutumn?: Uint8Array;
  readonly isApricornPlain?: Uint8Array;
  readonly isSnow?: Uint8Array;
  readonly isRockyHighland?: Uint8Array;
  readonly isRockyWater?: Uint8Array;
  readonly isHighCliff?: Uint8Array;
}

export class TerrainPlanCache {
  private readonly cache = new Map<string, ChunkTerrainPlan>();
  private readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  public getPlan(cx: number, cy: number): ChunkTerrainPlan {
    const key = `${cx},${cy}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const plan = this.computePlan(cx, cy);
    if (this.cache.size >= V0_CONFIG.MAX_CACHED_PLANS) {
      // LRU eviction: remove oldest key
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, plan);
    return plan;
  }

  public get size(): number {
    return this.cache.size;
  }

  public clear(): void {
    this.cache.clear();
  }

  private computePlan(cx: number, cy: number): ChunkTerrainPlan {
    const margin = V0_CONFIG.PLAN_MARGIN; // 16
    const totalDim = V0_CONFIG.CHUNK_TILES + margin * 2; // 48
    const totalCells = totalDim * totalDim;

    const startGX = cx * V0_CONFIG.CHUNK_TILES - margin;
    const startGY = cy * V0_CONFIG.CHUNK_TILES - margin;

    const landGrid = new Uint8Array(totalCells);
    const rawHillGrid = new Uint8Array(totalCells);

    // 1. Continentality Field with Forced Anchor Boost
    for (let y = 0; y < totalDim; y++) {
      const gy = startGY + y;
      const rowOffset = y * totalDim;

      for (let x = 0; x < totalDim; x++) {
        const gx = startGX + x;
        const cVal = fbm2(
          gx / V0_CONFIG.CONT_SCALE,
          gy / V0_CONFIG.CONT_SCALE,
          this.seed,
          V0_CONFIG.CONT_SALT,
          4
        );

        // Distance from start anchor (0, 0)
        const d = Math.hypot(gx, gy);
        const w = smoothstep(V0_CONFIG.LAND_R0, V0_CONFIG.LAND_R1, d);
        // Inside R0: minC = SEA_LEVEL + LAND_BOOST (guaranteed land)
        // Outside R1: minC = 0 (natural cVal)
        const minC = (V0_CONFIG.SEA_LEVEL + V0_CONFIG.LAND_BOOST) * (1 - w);
        const cBoosted = Math.max(cVal, minC);

        if (cBoosted >= V0_CONFIG.SEA_LEVEL) {
          landGrid[rowOffset + x] = 1;
        }
      }
    }

    // 2. Coastal Sand Fringe (land within BEACH_WIDTH of ocean)
    const erodedLand = erode(landGrid, totalDim, totalDim, V0_CONFIG.BEACH_WIDTH);
    const sandGrid = new Uint8Array(totalCells);
    for (let i = 0; i < totalCells; i++) {
      if (landGrid[i] === 1 && erodedLand[i] === 0) {
        sandGrid[i] = 1;
      }
    }

    // 3. Elevation & Hill Plateaus (clean morphology, away from sand & calm zone)
    const sandBuffer = dilate(sandGrid, totalDim, totalDim, 4);

    for (let y = 0; y < totalDim; y++) {
      const gy = startGY + y;
      const rowOffset = y * totalDim;

      for (let x = 0; x < totalDim; x++) {
        const idx = rowOffset + x;
        if (landGrid[idx] === 1 && sandBuffer[idx] === 0) {
          const gx = startGX + x;
          const eVal = fbm2(
            gx / V0_CONFIG.ELEV_SCALE,
            gy / V0_CONFIG.ELEV_SCALE,
            this.seed,
            V0_CONFIG.ELEV_SALT,
            3
          );
          const d = Math.hypot(gx, gy);
          const wCalm = smoothstep(V0_CONFIG.CALM_R0, V0_CONFIG.CALM_R1, d);
          const eBoosted = eVal * wCalm;

          if (eBoosted >= V0_CONFIG.HILL_T) {
            rawHillGrid[idx] = 1;
          }
        }
      }
    }

    // Morphological opening (r=2) + closing (r=2) ensures hill plateaus >= 3 tiles wide without 1-tile holes
    const hillOpened = open(rawHillGrid, totalDim, totalDim, 2);
    const hillClosed = close(hillOpened, totalDim, totalDim, 2);

    // Strict guarantee: no hill cell may ever touch or be within 2 tiles of sand
    const sandStrictBuffer = dilate(sandGrid, totalDim, totalDim, 2);
    const hillFinal = new Uint8Array(totalCells);
    for (let i = 0; i < totalCells; i++) {
      if (hillClosed[i] === 1 && sandStrictBuffer[i] === 0) {
        hillFinal[i] = 1;
      }
    }

    // 4. Extract interior 16x16 chunk area
    const isOcean = new Uint8Array(256);
    const isSand = new Uint8Array(256);
    const isHill = new Uint8Array(256);

    for (let ly = 0; ly < 16; ly++) {
      const py = margin + ly;
      const srcRowOffset = py * totalDim;
      const dstRowOffset = ly * 16;

      for (let lx = 0; lx < 16; lx++) {
        const px = margin + lx;
        const srcIdx = srcRowOffset + px;
        const dstIdx = dstRowOffset + lx;

        if (landGrid[srcIdx] === 0) {
          isOcean[dstIdx] = 1;
        } else if (sandGrid[srcIdx] === 1) {
          isSand[dstIdx] = 1;
        } else if (hillFinal[srcIdx] === 1) {
          isHill[dstIdx] = 1;
        }
      }
    }

    return {
      cx,
      cy,
      isOcean,
      isSand,
      isHill,
    };
  }
}
