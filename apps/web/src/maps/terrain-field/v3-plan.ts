import { V3_CONFIG, computeV3EffectiveDistance } from './v3-config';
import { smoothstep } from './v0-config';
import { fbm2 } from './noise';
import { erode, dilate, open, close } from './morphology';
import type { ChunkTerrainPlan } from './terrain-plan';

export class V3TerrainPlanCache {
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
    if (this.cache.size >= V3_CONFIG.MAX_CACHED_PLANS) {
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
    const margin = V3_CONFIG.PLAN_MARGIN; // 16
    const totalDim = V3_CONFIG.CHUNK_TILES + margin * 2; // 48
    const totalCells = totalDim * totalDim;

    const startGX = cx * V3_CONFIG.CHUNK_TILES - margin;
    const startGY = cy * V3_CONFIG.CHUNK_TILES - margin;

    const landGrid = new Uint8Array(totalCells);
    const rawHillGrid = new Uint8Array(totalCells);

    // 1. Continentality Field with Organic Valley & Corridor Boost
    for (let y = 0; y < totalDim; y++) {
      const gy = startGY + y;
      const rowOffset = y * totalDim;

      for (let x = 0; x < totalDim; x++) {
        const gx = startGX + x;
        const cVal = fbm2(
          gx / V3_CONFIG.CONT_SCALE,
          gy / V3_CONFIG.CONT_SCALE,
          this.seed,
          V3_CONFIG.CONT_SALT,
          4
        );

        const { effectiveDist, corridorInfluence, radialDist } = computeV3EffectiveDistance(gx, gy, this.seed);

        let cBoosted: number;
        if (radialDist <= V3_CONFIG.SAFE_CORE_R) {
          // Hard safe core: strictly guaranteed 100% solid land
          cBoosted = V3_CONFIG.SEA_LEVEL + V3_CONFIG.LAND_BOOST;
        } else {
          // Valley transition modulated by corridors and low-frequency noise
          const w = smoothstep(V3_CONFIG.VALLEY_R0, V3_CONFIG.VALLEY_R1, effectiveDist);
          const valleyLand = V3_CONFIG.SEA_LEVEL + V3_CONFIG.LAND_BOOST;
          cBoosted = (1 - w) * valleyLand + w * cVal;

          // Corridor soft land guarantee: ensures continuous route leading out
          if (corridorInfluence > 0) {
            const corridorLand = (V3_CONFIG.SEA_LEVEL + 0.10) * corridorInfluence;
            cBoosted = Math.max(cBoosted, corridorLand);
          }
        }

        if (cBoosted >= V3_CONFIG.SEA_LEVEL) {
          landGrid[rowOffset + x] = 1;
        }
      }
    }

    // 2. Coastal Sand Fringe (land within BEACH_WIDTH of ocean)
    const erodedLand = erode(landGrid, totalDim, totalDim, V3_CONFIG.BEACH_WIDTH);
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
          const { effectiveDist, corridorInfluence, radialDist } = computeV3EffectiveDistance(
            gx,
            gy,
            this.seed
          );

          // Suppress hills in the safe village core and along walkable corridors
          if (radialDist <= V3_CONFIG.SAFE_CORE_R || corridorInfluence > 0.45) {
            continue;
          }

          const eVal = fbm2(
            gx / V3_CONFIG.ELEV_SCALE,
            gy / V3_CONFIG.ELEV_SCALE,
            this.seed,
            V3_CONFIG.ELEV_SALT,
            3
          );

          // Hill calm zone: smooth ramp-up framing the valley
          const wCalm = smoothstep(V3_CONFIG.CALM_R0, V3_CONFIG.CALM_R1, effectiveDist);
          // Further suppress hills as corridor influence rises
          const corridorSuppression = 1 - smoothstep(0.15, 0.45, corridorInfluence);
          const eBoosted = eVal * wCalm * corridorSuppression;

          if (eBoosted >= V3_CONFIG.HILL_T) {
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

    // 3.5. Arid Desert Dunes (outside safe core and corridors)
    const rawDesertGrid = new Uint8Array(totalCells);
    for (let y = 0; y < totalDim; y++) {
      const gy = startGY + y;
      const rowOffset = y * totalDim;
      for (let x = 0; x < totalDim; x++) {
        const idx = rowOffset + x;
        if (landGrid[idx] === 1 && sandStrictBuffer[idx] === 0) {
          const gx = startGX + x;
          const { radialDist, corridorInfluence } = computeV3EffectiveDistance(
            gx,
            gy,
            this.seed
          );
          if (radialDist > 64 && corridorInfluence < 0.35) {
            const aridVal = fbm2(
              gx / 180,
              gy / 180,
              this.seed,
              0xd35e,
              3
            );
            if (aridVal >= 0.58) {
              rawDesertGrid[idx] = 1;
            }
          }
        }
      }
    }
    const desertOpened = open(rawDesertGrid, totalDim, totalDim, 2);
    const desertClosed = close(desertOpened, totalDim, totalDim, 2);

    // 4. Extract interior 16x16 chunk area
    const isOcean = new Uint8Array(256);
    const isSand = new Uint8Array(256);
    const isHill = new Uint8Array(256);
    const isDesert = new Uint8Array(256);

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
        } else {
          if (desertClosed[srcIdx] === 1) {
            isDesert[dstIdx] = 1;
          }
          if (hillFinal[srcIdx] === 1) {
            isHill[dstIdx] = 1;
          }
        }
      }
    }

    return {
      cx,
      cy,
      isOcean,
      isSand,
      isHill,
      isDesert,
    };
  }
}
