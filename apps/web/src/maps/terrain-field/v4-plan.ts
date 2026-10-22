import { dilate, erode, open, close } from './morphology';
import {
  V4_CONFIG,
  V4_LANDMASS_PROFILES,
  sampleV4ContinentalValue,
  type V4LandmassProfile,
} from './v4-config';
import { fbm2 } from './noise';
import type { ChunkTerrainPlan } from './terrain-plan';
import { V4MacroPlan } from './v4-macro-plan';
import { isV4LakeTile, isV4RiverTile } from './v4-water';

export class V4TerrainPlanCache {
  private readonly cache = new Map<string, ChunkTerrainPlan>();
  private readonly seed: number;

  public constructor(
    seed: number,
    private readonly macroPlan: V4MacroPlan,
    private readonly profile: V4LandmassProfile = 'classic'
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
    const landmassProfile = V4_LANDMASS_PROFILES[this.profile];
    const margin = V4_CONFIG.PLAN_MARGIN;
    const totalDim = V4_CONFIG.CHUNK_TILES + margin * 2;
    const totalCells = totalDim * totalDim;
    const startGX = cx * V4_CONFIG.CHUNK_TILES - margin;
    const startGY = cy * V4_CONFIG.CHUNK_TILES - margin;

    const rawLandGrid = new Uint8Array(totalCells);

    for (let y = 0; y < totalDim; y++) {
      for (let x = 0; x < totalDim; x++) {
        const gx = startGX + x;
        const gy = startGY + y;
        const index = y * totalDim + x;
        const startCore = gx * gx + gy * gy <= V4_CONFIG.START_CORE_RADIUS ** 2;
        const worldMacroX = Math.floor(gx / V4_CONFIG.CELL_SIZE);
        const worldMacroY = Math.floor(gy / V4_CONFIG.CELL_SIZE);
        const macroLandAllowed =
          this.profile === 'natural-landmass'
            ? this.macroPlan.isNearNaturalLandCell(worldMacroX, worldMacroY)
            : true;
        const source = this.macroPlan.getSourceCoordinates(gx, gy);
        const continentalValue = sampleV4ContinentalValue(source.gx, source.gy, this.seed);
        // The continuous field owns the actual coastline. A low-frequency
        // signed edge warp breaks long axis-aligned runs without introducing
        // a cell-sized macro step or changing the deterministic seed model.
        const coastEdgeWarp =
          (fbm2(
            gx / landmassProfile.coastEdgeScale,
            gy / landmassProfile.coastEdgeScale,
            this.seed,
            V4_CONFIG.MACRO_SALT + 19,
            3
          ) -
            0.5) *
          landmassProfile.coastEdgeWeight;
        const threshold = landmassProfile.seaLevel + coastEdgeWarp;
        if (startCore || (macroLandAllowed && continentalValue >= threshold)) {
          rawLandGrid[index] = 1;
        }
      }
    }

    // Remove one-tile teeth and fill tiny coastal notches. The bounded margin
    // keeps this operation identical when neighboring chunks are generated in
    // a different order.
    const landGrid = close(
      open(rawLandGrid, totalDim, totalDim, landmassProfile.coastOpenRadius),
      totalDim,
      totalDim,
      landmassProfile.coastCloseRadius
    );

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

    const rawDesertGrid = new Uint8Array(totalCells);
    const rawDarkGrid = new Uint8Array(totalCells);
    const rawAutumnGrid = new Uint8Array(totalCells);
    const rawSnowGrid = new Uint8Array(totalCells);
    for (let y = 0; y < totalDim; y++) {
      for (let x = 0; x < totalDim; x++) {
        const index = y * totalDim + x;
        // Desert may touch the beach directly. The beach itself still wins in
        // the final terrain priority, while removing the artificial grass
        // separator created by the old strict sand buffer.
        if (landGrid[index] === 0 || sandGrid[index] === 1) continue;
        const gx = startGX + x + this.macroPlan.sourceOffset.gx;
        const gy = startGY + y + this.macroPlan.sourceOffset.gy;
        const aridRegion = fbm2(
          gx / V4_CONFIG.DESERT_SCALE,
          gy / V4_CONFIG.DESERT_SCALE,
          this.seed,
          V4_CONFIG.DESERT_SALT,
          3
        );
        const aridDetail = fbm2(
          gx / (V4_CONFIG.DESERT_SCALE * 0.48),
          gy / (V4_CONFIG.DESERT_SCALE * 0.48),
          this.seed,
          V4_CONFIG.DESERT_SALT + 17,
          2
        );
        const darkRegion = fbm2(
          gx / V4_CONFIG.DARK_SCALE,
          gy / V4_CONFIG.DARK_SCALE,
          this.seed,
          V4_CONFIG.DARK_SALT,
          3
        );
        const darkDetail = fbm2(
          gx / (V4_CONFIG.DARK_SCALE * 0.46),
          gy / (V4_CONFIG.DARK_SCALE * 0.46),
          this.seed,
          V4_CONFIG.DARK_SALT + 17,
          2
        );
        const autumnRegion = fbm2(
          gx / V4_CONFIG.AUTUMN_SCALE,
          gy / V4_CONFIG.AUTUMN_SCALE,
          this.seed,
          V4_CONFIG.AUTUMN_SALT,
          3
        );
        const autumnDetail = fbm2(
          gx / (V4_CONFIG.AUTUMN_SCALE * 0.48),
          gy / (V4_CONFIG.AUTUMN_SCALE * 0.48),
          this.seed,
          V4_CONFIG.AUTUMN_SALT + 17,
          2
        );
        const snowRegion = fbm2(
          gx / V4_CONFIG.SNOW_SCALE,
          gy / V4_CONFIG.SNOW_SCALE,
          this.seed,
          V4_CONFIG.SNOW_SALT,
          3
        );
        const snowDetail = fbm2(
          gx / (V4_CONFIG.SNOW_SCALE * 0.45),
          gy / (V4_CONFIG.SNOW_SCALE * 0.45),
          this.seed,
          V4_CONFIG.SNOW_SALT + 17,
          2
        );
        const biomeEdgeWarp =
          (fbm2(
            gx / V4_CONFIG.BIOME_EDGE_SCALE,
            gy / V4_CONFIG.BIOME_EDGE_SCALE,
            this.seed,
            V4_CONFIG.BIOME_EDGE_SALT,
            3
          ) -
            0.5) *
          V4_CONFIG.BIOME_EDGE_WEIGHT;

        // The low-frequency field owns the geographic region. Detail only
        // shapes its edge, preventing a biome from becoming a texture of
        // disconnected dots while retaining a natural transition.
        const aridScore = aridRegion * 0.9 + aridDetail * 0.1 + biomeEdgeWarp;
        const darkScore = darkRegion * 0.9 + darkDetail * 0.1 + biomeEdgeWarp;
        const autumnScore = autumnRegion * 0.9 + autumnDetail * 0.1 + biomeEdgeWarp;
        const snowScore = snowRegion * 0.9 + snowDetail * 0.1 + biomeEdgeWarp;
        if (aridScore >= V4_CONFIG.DESERT_THRESHOLD) rawDesertGrid[index] = 1;
        else if (darkScore >= V4_CONFIG.DARK_THRESHOLD) rawDarkGrid[index] = 1;
        else if (autumnScore >= V4_CONFIG.AUTUMN_THRESHOLD) rawAutumnGrid[index] = 1;
        else if (snowScore >= V4_CONFIG.SNOW_THRESHOLD) rawSnowGrid[index] = 1;
      }
    }

    const desertGrid = close(open(rawDesertGrid, totalDim, totalDim, 3), totalDim, totalDim, 3);
    const darkGrid = close(open(rawDarkGrid, totalDim, totalDim, 3), totalDim, totalDim, 3);
    const autumnGrid = close(open(rawAutumnGrid, totalDim, totalDim, 3), totalDim, totalDim, 3);
    const snowGrid = close(open(rawSnowGrid, totalDim, totalDim, 3), totalDim, totalDim, 3);

    // V4's hill is a raised form of the ordinary plain, not an independent
    // biome. Keep it inside ordinary inland grass and prevent it from leaking
    // into desert, Dark Land, Autumn Forest, or coastal sand buffers.
    const hillGrid = new Uint8Array(totalCells);
    for (let index = 0; index < totalCells; index++) {
      if (
        hillClosed[index] === 1 &&
        strictSandBuffer[index] === 0 &&
        desertGrid[index] === 0 &&
        darkGrid[index] === 0 &&
        autumnGrid[index] === 0
      ) {
        hillGrid[index] = 1;
      }
    }

    const isOcean = new Uint8Array(256);
    const isSand = new Uint8Array(256);
    const isHill = new Uint8Array(256);
    const isRiver = new Uint8Array(256);
    const isLake = new Uint8Array(256);
    const isDesert = new Uint8Array(256);
    const isDarkLand = new Uint8Array(256);
    const isAutumn = new Uint8Array(256);
    const isSnow = new Uint8Array(256);

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
        const riverCandidate = isV4RiverTile(gxWithMargin, gyWithMargin, this.seed);
        const lakeCandidate = isV4LakeTile(gxWithMargin, gyWithMargin, this.seed);

        const isAutumnCandidate = autumnGrid[sourceIndex] === 1;
        const isSnowCandidate = snowGrid[sourceIndex] === 1;

        if (freshwaterAllowed && riverCandidate) {
          isRiver[targetIndex] = 1;
          if (isAutumnCandidate) isAutumn[targetIndex] = 1;
          if (isSnowCandidate) isSnow[targetIndex] = 1;
        } else if (freshwaterAllowed && lakeCandidate) {
          isLake[targetIndex] = 1;
          if (isAutumnCandidate) isAutumn[targetIndex] = 1;
          if (isSnowCandidate) isSnow[targetIndex] = 1;
        } else if (landGrid[sourceIndex] === 0) isOcean[targetIndex] = 1;
        else if (sandGrid[sourceIndex] === 1) isSand[targetIndex] = 1;
        else if (hillGrid[sourceIndex] === 1) {
          isHill[targetIndex] = 1;
          if (isSnowCandidate) isSnow[targetIndex] = 1;
        } else if (desertGrid[sourceIndex] === 1) isDesert[targetIndex] = 1;
        else if (darkGrid[sourceIndex] === 1) isDarkLand[targetIndex] = 1;
        else if (isAutumnCandidate) isAutumn[targetIndex] = 1;
        else if (isSnowCandidate) isSnow[targetIndex] = 1;
      }
    }

    return {
      cx,
      cy,
      isOcean,
      isSand,
      isHill,
      isRiver,
      isLake,
      isDesert,
      isDarkLand,
      isAutumn,
      isSnow,
    };
  }
}
