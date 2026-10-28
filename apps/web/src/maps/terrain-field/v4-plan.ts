import { dilate, erode, open, close } from './morphology';
import {
  V4_CONFIG,
  V4_LANDMASS_PROFILES,
  V5_BIOME_CONFIG,
  sampleV4ContinentalValue,
  type V4LandmassProfile,
} from './v4-config';
import { fbm2 } from './noise';
import type { ChunkTerrainPlan } from './terrain-plan';
import { V4MacroPlan } from './v4-macro-plan';
import { isV4LakeTile, isV4RiverTile } from './v4-water';
import {
  getClimateTransitionZone,
  sampleClimate,
  type ClimateBiomeTarget,
  type ClimateSample,
} from '../climate';

/**
 * Removes small disconnected interior biome pockets that do not touch the plan
 * window boundary, preventing tiny "mini desert" or "mini snow" specks.
 */
function pruneSmallBiomeComponents(
  grid: Uint8Array,
  width: number,
  height: number,
  minArea: number
): Uint8Array {
  const result = new Uint8Array(grid);
  const visited = new Uint8Array(width * height);

  for (let start = 0; start < result.length; start++) {
    if (result[start] === 0 || visited[start] === 1) continue;

    const cells: number[] = [];
    const queue = [start];
    visited[start] = 1;
    let touchesBorder = false;

    while (queue.length > 0) {
      const current = queue.pop()!;
      cells.push(current);
      const x = current % width;
      const y = Math.floor(current / width);
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        touchesBorder = true;
      }

      const neighbors = [
        x > 0 ? current - 1 : -1,
        x + 1 < width ? current + 1 : -1,
        y > 0 ? current - width : -1,
        y + 1 < height ? current + width : -1,
      ];
      for (const next of neighbors) {
        if (next < 0 || result[next] === 0 || visited[next] === 1) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }

    if (!touchesBorder && cells.length < minArea) {
      for (const cell of cells) {
        result[cell] = 0;
      }
    }
  }

  return result;
}

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
    const useClimateGating = this.profile === 'natural-landmass';
    const desertRegionScale = useClimateGating
      ? V5_BIOME_CONFIG.regionScale
      : V4_CONFIG.DESERT_SCALE;
    const darkRegionScale = useClimateGating ? V5_BIOME_CONFIG.regionScale : V4_CONFIG.DARK_SCALE;
    const autumnRegionScale = useClimateGating
      ? V5_BIOME_CONFIG.regionScale
      : V4_CONFIG.AUTUMN_SCALE;
    const snowRegionScale = useClimateGating ? V5_BIOME_CONFIG.regionScale : V4_CONFIG.SNOW_SCALE;
    const rockyRegionScale = useClimateGating ? V5_BIOME_CONFIG.regionScale : V4_CONFIG.ROCKY_SCALE;
    const desertDetailScale = useClimateGating
      ? V5_BIOME_CONFIG.regionScale * V5_BIOME_CONFIG.detailScaleFactor
      : V4_CONFIG.DESERT_SCALE * 0.48;
    const darkDetailScale = useClimateGating
      ? V5_BIOME_CONFIG.regionScale * V5_BIOME_CONFIG.detailScaleFactor
      : V4_CONFIG.DARK_SCALE * 0.46;
    const autumnDetailScale = useClimateGating
      ? V5_BIOME_CONFIG.regionScale * V5_BIOME_CONFIG.detailScaleFactor
      : V4_CONFIG.AUTUMN_SCALE * 0.48;
    const snowDetailScale = useClimateGating
      ? V5_BIOME_CONFIG.regionScale * V5_BIOME_CONFIG.detailScaleFactor
      : V4_CONFIG.SNOW_SCALE * 0.45;
    const rockyDetailScale = useClimateGating
      ? V5_BIOME_CONFIG.regionScale * V5_BIOME_CONFIG.detailScaleFactor
      : V4_CONFIG.ROCKY_SCALE * 0.46;
    const biomeDetailWeight = useClimateGating ? V5_BIOME_CONFIG.detailWeight : 0.1;
    const biomeEdgeWeight = useClimateGating
      ? V5_BIOME_CONFIG.edgeWeight
      : V4_CONFIG.BIOME_EDGE_WEIGHT;
    const desertThreshold = useClimateGating
      ? V5_BIOME_CONFIG.desertThreshold
      : V4_CONFIG.DESERT_THRESHOLD;
    const darkThreshold = useClimateGating
      ? V5_BIOME_CONFIG.darkThreshold
      : V4_CONFIG.DARK_THRESHOLD;
    const autumnThreshold = useClimateGating
      ? V5_BIOME_CONFIG.autumnThreshold
      : V4_CONFIG.AUTUMN_THRESHOLD;
    const snowThreshold = useClimateGating
      ? V5_BIOME_CONFIG.snowThreshold
      : V4_CONFIG.SNOW_THRESHOLD;
    const rockyThreshold = useClimateGating
      ? V5_BIOME_CONFIG.rockyThreshold
      : V4_CONFIG.ROCKY_THRESHOLD;
    const margin = V4_CONFIG.PLAN_MARGIN;
    const totalDim = V4_CONFIG.CHUNK_TILES + margin * 2;
    const totalCells = totalDim * totalDim;
    const startGX = cx * V4_CONFIG.CHUNK_TILES - margin;
    const startGY = cy * V4_CONFIG.CHUNK_TILES - margin;

    const rawLandGrid = new Uint8Array(totalCells);
    const continentalGrid = new Float32Array(totalCells);

    for (let y = 0; y < totalDim; y++) {
      for (let x = 0; x < totalDim; x++) {
        const gx = startGX + x;
        const gy = startGY + y;
        const index = y * totalDim + x;
        const startCore = gx * gx + gy * gy <= V4_CONFIG.START_CORE_RADIUS ** 2;
        const worldMacroX = Math.floor(gx / V4_CONFIG.CELL_SIZE);
        const worldMacroY = Math.floor(gy / V4_CONFIG.CELL_SIZE);
        const macroDist =
          this.profile === 'natural-landmass'
            ? this.macroPlan.getNaturalLandCellDistance(worldMacroX, worldMacroY, 4)
            : 0;
        const macroLandAllowed = macroDist <= 4;
        const source = this.macroPlan.getSourceCoordinates(gx, gy);
        const rawContinentalValue = sampleV4ContinentalValue(source.gx, source.gy, this.seed);
        // Smoothly taper continental height outside the macro landmass mask so
        // excluded components fade into natural bays/straits instead of straight
        // 32-tile macro-cell cutoff lines.
        const continentalValue =
          macroDist === 0 ? rawContinentalValue : rawContinentalValue - macroDist * 0.055;
        continentalGrid[index] = continentalValue;

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
    const rawRockyGrid = new Uint8Array(totalCells);
    const climateCache: Array<ClimateSample | undefined> = useClimateGating
      ? new Array<ClimateSample | undefined>(totalCells)
      : [];

    const getContinuousClimateSuitability = (
      biome: ClimateBiomeTarget,
      climate: ClimateSample
    ): number => {
      const zone = getClimateTransitionZone(biome, climate);
      if (zone === 'blocked') return 0;

      const t = climate.temperature;
      const m = climate.moisture;
      switch (biome) {
        case 'snow': {
          if (t <= 0.22) return 1;
          return Math.max(0, Math.min(1, (0.36 - t) / (0.36 - 0.22)));
        }
        case 'desert': {
          const tempFit = Math.max(0, Math.min(1, (t - 0.6) / (0.76 - 0.6)));
          const dryFit = Math.max(0, Math.min(1, (0.45 - m) / (0.45 - 0.22)));
          return tempFit * dryFit;
        }
        case 'autumn': {
          const tempDist = Math.abs(t - 0.35);
          const tempFit = Math.max(0, Math.min(1, 1 - tempDist / 0.22));
          const moistFit = Math.max(0, Math.min(1, (m - 0.22) / 0.32));
          return tempFit * moistFit;
        }
        case 'dark_land': {
          const tempDist = Math.abs(t - 0.38);
          const tempFit = Math.max(0, Math.min(1, 1 - tempDist / 0.22));
          const dryFit = Math.max(0, Math.min(1, (0.58 - m) / 0.32));
          return tempFit * dryFit;
        }
        case 'rocky_highland': {
          const tempDist = Math.abs(t - 0.46);
          const tempFit = Math.max(0, Math.min(1, 1 - tempDist / 0.24));
          const moistDist = Math.abs(m - 0.34);
          const moistFit = Math.max(0, Math.min(1, 1 - moistDist / 0.24));
          return tempFit * moistFit;
        }
      }
    };

    const matchesBiomeClimateAndScore = (
      biome: ClimateBiomeTarget,
      score: number,
      coreThreshold: number,
      transitionThreshold: number,
      climate: ClimateSample | undefined,
      starterSafePenalty: number
    ): boolean => {
      if (!useClimateGating || !climate) {
        return score >= transitionThreshold;
      }
      const suitability = getContinuousClimateSuitability(biome, climate);
      if (suitability <= 0) return false;
      const dynamicThreshold =
        transitionThreshold -
        (transitionThreshold - coreThreshold) * suitability +
        starterSafePenalty;
      return score >= dynamicThreshold;
    };

    for (let y = 0; y < totalDim; y++) {
      for (let x = 0; x < totalDim; x++) {
        const index = y * totalDim + x;
        // Desert may touch the beach directly. The beach itself still wins in
        // the final terrain priority, while removing the artificial grass
        // separator created by the old strict sand buffer.
        if (landGrid[index] === 0 || sandGrid[index] === 1) continue;
        const worldGX = startGX + x;
        const worldGY = startGY + y;
        const worldMacroX = Math.floor(worldGX / V4_CONFIG.CELL_SIZE);
        const worldMacroY = Math.floor(worldGY / V4_CONFIG.CELL_SIZE);
        const onHomeContinent =
          !useClimateGating || this.macroPlan.isNearHomeContinentCell(worldMacroX, worldMacroY, 3);

        // Prevent small offshore islands from turning into "mini deserts" or "mini snow biomes".
        if (!onHomeContinent) continue;

        const gx = worldGX + this.macroPlan.sourceOffset.gx;
        const gy = worldGY + this.macroPlan.sourceOffset.gy;
        const aridRegion = fbm2(
          gx / desertRegionScale,
          gy / desertRegionScale,
          this.seed,
          V4_CONFIG.DESERT_SALT,
          3
        );
        const aridDetail = fbm2(
          gx / desertDetailScale,
          gy / desertDetailScale,
          this.seed,
          V4_CONFIG.DESERT_SALT + 17,
          2
        );
        const darkRegion = fbm2(
          gx / darkRegionScale,
          gy / darkRegionScale,
          this.seed,
          V4_CONFIG.DARK_SALT,
          3
        );
        const darkDetail = fbm2(
          gx / darkDetailScale,
          gy / darkDetailScale,
          this.seed,
          V4_CONFIG.DARK_SALT + 17,
          2
        );
        const autumnRegion = fbm2(
          gx / autumnRegionScale,
          gy / autumnRegionScale,
          this.seed,
          V4_CONFIG.AUTUMN_SALT,
          3
        );
        const autumnDetail = fbm2(
          gx / autumnDetailScale,
          gy / autumnDetailScale,
          this.seed,
          V4_CONFIG.AUTUMN_SALT + 17,
          2
        );
        const snowRegion = fbm2(
          gx / snowRegionScale,
          gy / snowRegionScale,
          this.seed,
          V4_CONFIG.SNOW_SALT,
          3
        );
        const snowDetail = fbm2(
          gx / snowDetailScale,
          gy / snowDetailScale,
          this.seed,
          V4_CONFIG.SNOW_SALT + 17,
          2
        );
        const rockyRegion = fbm2(
          gx / rockyRegionScale,
          gy / rockyRegionScale,
          this.seed,
          V4_CONFIG.ROCKY_SALT,
          3
        );
        const rockyDetail = fbm2(
          gx / rockyDetailScale,
          gy / rockyDetailScale,
          this.seed,
          V4_CONFIG.ROCKY_SALT + 17,
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
          biomeEdgeWeight;

        // Keep an organic, non-circular meadow buffer around the starter village (0, 0) in V5.
        const distFromOrigin = Math.hypot(worldGX, worldGY);
        const warpedStarterDist =
          distFromOrigin +
          (biomeEdgeWeight > 0 ? (biomeEdgeWarp / biomeEdgeWeight) * 56 : 0) +
          (autumnRegion - 0.5) * 48;
        if (useClimateGating && warpedStarterDist <= 56) continue;
        const starterSafePenalty =
          useClimateGating && warpedStarterDist < 136
            ? ((136 - warpedStarterDist) / (136 - 56)) * 0.24
            : 0;

        // The low-frequency field owns the geographic region. Detail only
        // shapes its edge, preventing a biome from becoming a texture of
        // disconnected dots while retaining a natural transition.
        const regionWeight = 1 - biomeDetailWeight;
        const aridScore =
          aridRegion * regionWeight + aridDetail * biomeDetailWeight + biomeEdgeWarp;
        const darkScore =
          darkRegion * regionWeight + darkDetail * biomeDetailWeight + biomeEdgeWarp;
        const autumnScore =
          autumnRegion * regionWeight + autumnDetail * biomeDetailWeight + biomeEdgeWarp;
        const snowScore =
          snowRegion * regionWeight + snowDetail * biomeDetailWeight + biomeEdgeWarp;
        const rockyScore =
          rockyRegion * regionWeight + rockyDetail * biomeDetailWeight + biomeEdgeWarp;

        let climate: ClimateSample | undefined;
        if (useClimateGating) {
          const continentalValue = continentalGrid[index];
          const continentality = Math.max(
            0,
            Math.min(1, (continentalValue - landmassProfile.seaLevel) / 0.32)
          );
          const localElevation = hillClosed[index] === 1 ? 0.65 : 0.15;
          climate = sampleClimate(gx, gy, this.seed, {
            elevation: localElevation,
            continentality,
            anchors: this.macroPlan.climateAnchors,
          });
          climateCache[index] = climate;
        }

        if (
          matchesBiomeClimateAndScore(
            'snow',
            snowScore,
            V5_BIOME_CONFIG.snowCoreThreshold,
            snowThreshold,
            climate,
            starterSafePenalty
          )
        ) {
          rawSnowGrid[index] = 1;
        } else if (
          matchesBiomeClimateAndScore(
            'desert',
            aridScore,
            V5_BIOME_CONFIG.desertCoreThreshold,
            desertThreshold,
            climate,
            starterSafePenalty
          )
        ) {
          rawDesertGrid[index] = 1;
        } else if (
          matchesBiomeClimateAndScore(
            'dark_land',
            darkScore,
            V5_BIOME_CONFIG.darkCoreThreshold,
            darkThreshold,
            climate,
            starterSafePenalty
          )
        ) {
          rawDarkGrid[index] = 1;
        } else if (
          matchesBiomeClimateAndScore(
            'autumn',
            autumnScore,
            V5_BIOME_CONFIG.autumnCoreThreshold,
            autumnThreshold,
            climate,
            starterSafePenalty
          )
        ) {
          rawAutumnGrid[index] = 1;
        } else if (
          useClimateGating &&
          matchesBiomeClimateAndScore(
            'rocky_highland',
            rockyScore,
            V5_BIOME_CONFIG.rockyCoreThreshold,
            rockyThreshold,
            climate,
            starterSafePenalty
          )
        ) {
          rawRockyGrid[index] = 1;
        }
      }
    }

    const applyClimateMask = (grid: Uint8Array, biome: ClimateBiomeTarget): Uint8Array => {
      if (!useClimateGating) return grid;
      for (let index = 0; index < totalCells; index++) {
        if (grid[index] !== 1) continue;
        const climate = climateCache[index];
        if (!climate || getClimateTransitionZone(biome, climate) === 'blocked') {
          grid[index] = 0;
        }
      }
      return pruneSmallBiomeComponents(
        grid,
        totalDim,
        totalDim,
        V5_BIOME_CONFIG.minBiomeComponentTiles
      );
    };

    const desertGrid = applyClimateMask(
      close(open(rawDesertGrid, totalDim, totalDim, 3), totalDim, totalDim, 3),
      'desert'
    );
    const snowGrid = applyClimateMask(
      close(open(rawSnowGrid, totalDim, totalDim, 3), totalDim, totalDim, 3),
      'snow'
    );
    const darkGrid = applyClimateMask(
      close(open(rawDarkGrid, totalDim, totalDim, 3), totalDim, totalDim, 3),
      'dark_land'
    );
    const autumnGrid = applyClimateMask(
      close(open(rawAutumnGrid, totalDim, totalDim, 3), totalDim, totalDim, 3),
      'autumn'
    );
    const rockyGrid = applyClimateMask(
      close(open(rawRockyGrid, totalDim, totalDim, 3), totalDim, totalDim, 3),
      'rocky_highland'
    );

    // Ensure distinct special biomes do not overlap or collide directly without
    // room for their boundary grass fringe over the base grass layer.
    const snowBuffer1 = dilate(snowGrid, totalDim, totalDim, 1);
    const desertBuffer1 = dilate(desertGrid, totalDim, totalDim, 1);
    for (let index = 0; index < totalCells; index++) {
      if (snowBuffer1[index] === 1) {
        darkGrid[index] = 0;
        autumnGrid[index] = 0;
        desertGrid[index] = 0;
        rockyGrid[index] = 0;
      }
      if (desertBuffer1[index] === 1) {
        darkGrid[index] = 0;
        rockyGrid[index] = 0;
      }
    }
    const darkBuffer1 = dilate(darkGrid, totalDim, totalDim, 1);
    for (let index = 0; index < totalCells; index++) {
      if (darkBuffer1[index] === 1) {
        autumnGrid[index] = 0;
        rockyGrid[index] = 0;
      }
    }
    const autumnBuffer1 = dilate(autumnGrid, totalDim, totalDim, 1);
    for (let index = 0; index < totalCells; index++) {
      if (autumnBuffer1[index] === 1) {
        rockyGrid[index] = 0;
      }
    }

    // Assemble unified hillGrid and per-biome hill ownership
    const hillGrid = new Uint8Array(totalCells);
    const isRockyHill = new Uint8Array(totalCells);
    const isSnowHill = new Uint8Array(totalCells);
    const highCliffGrid = new Uint8Array(totalCells);

    if (!useClimateGating) {
      // Classic V4 backwards compatibility: keep original flat hill placement for legacy V4 tests
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
    } else {
      // Natural Landmass V5: Strict biome interior hill isolation & Rocky Highland 2-tier architecture
      const interiorMargin = 2;
      const snowHillInterior = erode(snowGrid, totalDim, totalDim, interiorMargin);
      const rockyHillInterior = erode(rockyGrid, totalDim, totalDim, interiorMargin);
      const allSpecialBiomes = new Uint8Array(totalCells);
      for (let index = 0; index < totalCells; index++) {
        if (
          desertGrid[index] === 1 ||
          darkGrid[index] === 1 ||
          autumnGrid[index] === 1 ||
          snowGrid[index] === 1 ||
          rockyGrid[index] === 1
        ) {
          allSpecialBiomes[index] = 1;
        }
      }
      const specialBiomeBuffer = dilate(allSpecialBiomes, totalDim, totalDim, 3);

      // 1. Meadow Hills: Global hills (hillClosed) strictly excluded from all special biomes
      // and morphologically opened by kernel 2 to eliminate 1-tile staircase clipping.
      const rawMeadowHills = new Uint8Array(totalCells);
      for (let index = 0; index < totalCells; index++) {
        if (
          hillClosed[index] === 1 &&
          specialBiomeBuffer[index] === 0 &&
          strictSandBuffer[index] === 0
        ) {
          rawMeadowHills[index] = 1;
        }
      }
      const cleanedMeadowHills = open(
        pruneSmallBiomeComponents(rawMeadowHills, totalDim, totalDim, 16),
        totalDim,
        totalDim,
        2
      );

      // 2. Snow Hills: Inside snow interior only, smoothed and pruned.
      const rawSnowHills = new Uint8Array(totalCells);
      for (let index = 0; index < totalCells; index++) {
        if (
          snowHillInterior[index] === 1 &&
          hillClosed[index] === 1 &&
          strictSandBuffer[index] === 0
        ) {
          rawSnowHills[index] = 1;
        }
      }
      const cleanedSnowHills = open(
        pruneSmallBiomeComponents(rawSnowHills, totalDim, totalDim, 16),
        totalDim,
        totalDim,
        2
      );

      // 3. 2-tier High Cliffs (vách đá cao): Form inside the Rocky Highland interior
      // with radius 1 morphology so every High Cliff mesa has a full 2-tier vertical
      // southern wall + flat top plateau for wildlife without being obliterated.
      const rawHighCliffGrid = new Uint8Array(totalCells);
      for (let y = 0; y < totalDim; y++) {
        for (let x = 0; x < totalDim; x++) {
          const index = y * totalDim + x;
          if (rockyHillInterior[index] !== 1 || strictSandBuffer[index] === 1) continue;
          const gx = startGX + x + this.macroPlan.sourceOffset.gx;
          const gy = startGY + y + this.macroPlan.sourceOffset.gy;
          const highCliffNoise = fbm2(
            gx / V4_CONFIG.HIGH_CLIFF_SCALE,
            gy / V4_CONFIG.HIGH_CLIFF_SCALE,
            this.seed,
            V4_CONFIG.HIGH_CLIFF_SALT,
            3
          );
          if (highCliffNoise >= V5_BIOME_CONFIG.highCliffThreshold) {
            rawHighCliffGrid[index] = 1;
          }
        }
      }
      const smoothedHighCliff = close(
        open(rawHighCliffGrid, totalDim, totalDim, 1),
        totalDim,
        totalDim,
        1
      );
      const clippedHighCliff = new Uint8Array(totalCells);
      for (let index = 0; index < totalCells; index++) {
        if (
          smoothedHighCliff[index] === 1 &&
          rockyHillInterior[index] === 1 &&
          strictSandBuffer[index] === 0
        ) {
          clippedHighCliff[index] = 1;
        }
      }
      const rawHighCliffOpened = pruneSmallBiomeComponents(clippedHighCliff, totalDim, totalDim, 8);
      for (let i = 0; i < totalCells; i++) {
        highCliffGrid[i] = rawHighCliffOpened[i];
      }
      // 1-tile buffer around 2-tier high cliffs so 1-tier rocky hills never collide with high cliffs.
      const highCliffBuffer = dilate(highCliffGrid, totalDim, totalDim, 1);

      // 4. 1-tier Rocky Hills (đồi đá): Form inside the Rocky Highland interior
      // alongside high cliffs, separated by a buffer and morphologically smoothed.
      const rawRockyHills = new Uint8Array(totalCells);
      for (let y = 0; y < totalDim; y++) {
        for (let x = 0; x < totalDim; x++) {
          const index = y * totalDim + x;
          if (
            rockyHillInterior[index] !== 1 ||
            highCliffBuffer[index] === 1 ||
            strictSandBuffer[index] === 1
          ) {
            continue;
          }
          const gx = startGX + x + this.macroPlan.sourceOffset.gx;
          const gy = startGY + y + this.macroPlan.sourceOffset.gy;
          const rockyHillScore = fbm2(
            gx / (V4_CONFIG.HILL_SCALE * 0.72),
            gy / (V4_CONFIG.HILL_SCALE * 0.72),
            this.seed,
            V4_CONFIG.ROCKY_SALT + 31,
            3
          );
          if (rockyHillScore >= 0.46) {
            rawRockyHills[index] = 1;
          }
        }
      }
      const cleanedRockyHills = pruneSmallBiomeComponents(
        close(open(rawRockyHills, totalDim, totalDim, 1), totalDim, totalDim, 1),
        totalDim,
        totalDim,
        8
      );

      for (let index = 0; index < totalCells; index++) {
        if (highCliffGrid[index] === 1) {
          hillGrid[index] = 1;
          isRockyHill[index] = 1;
        } else if (cleanedRockyHills[index] === 1) {
          hillGrid[index] = 1;
          isRockyHill[index] = 1;
        } else if (cleanedSnowHills[index] === 1) {
          hillGrid[index] = 1;
          isSnowHill[index] = 1;
        } else if (cleanedMeadowHills[index] === 1) {
          hillGrid[index] = 1;
        }
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
    const isApricornPlain = new Uint8Array(256);
    const isSnow = new Uint8Array(256);
    const isRockyHighland = new Uint8Array(256);
    const isRockyWater = new Uint8Array(256);
    const isHighCliff = new Uint8Array(256);

    // Build the Apricorn mask before copying the chunk interior. It is a
    // meadow sub-biome, so special terrain/biome masks are excluded here;
    // this prevents a grove from leaking onto water, hills, desert, snow, or
    // another biome after the morphology pass.
    const rawApricornPlain = new Uint8Array(totalCells);
    for (let y = 0; y < totalDim; y++) {
      for (let x = 0; x < totalDim; x++) {
        const index = y * totalDim + x;
        const gx = startGX + x;
        const gy = startGY + y;
        const inStarterCore = gx * gx + gy * gy <= V4_CONFIG.START_CORE_RADIUS ** 2;
        const isOrdinaryMeadow =
          landGrid[index] === 1 &&
          sandGrid[index] === 0 &&
          hillGrid[index] === 0 &&
          desertGrid[index] === 0 &&
          darkGrid[index] === 0 &&
          autumnGrid[index] === 0 &&
          snowGrid[index] === 0 &&
          rockyGrid[index] === 0 &&
          !inStarterCore &&
          !isV4RiverTile(gx, gy, this.seed) &&
          !isV4LakeTile(gx, gy, this.seed);

        if (
          isOrdinaryMeadow &&
          fbm2(
            gx / V4_CONFIG.APRICORN_SCALE,
            gy / V4_CONFIG.APRICORN_SCALE,
            this.seed,
            V4_CONFIG.APRICORN_SALT
          ) > V4_CONFIG.APRICORN_THRESHOLD
        ) {
          rawApricornPlain[index] = 1;
        }
      }
    }

    const apricornPlainGrid = pruneSmallBiomeComponents(
      close(open(rawApricornPlain, totalDim, totalDim, 1), totalDim, totalDim, 1),
      totalDim,
      totalDim,
      V4_CONFIG.APRICORN_MIN_COMPONENT_TILES
    );

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
        const isStartFreshwaterBuffer =
          gx * gx + gy * gy <= Math.max(32, V4_CONFIG.START_CORE_RADIUS + 16) ** 2;
        const freshwaterAllowed =
          landGrid[sourceIndex] === 1 &&
          sandGrid[sourceIndex] === 0 &&
          hillGrid[sourceIndex] === 0 &&
          desertGrid[sourceIndex] === 0 &&
          darkGrid[sourceIndex] === 0 &&
          !isStartFreshwaterBuffer;

        // Reuse the established deterministic river/lake silhouettes, but
        // clip them to the V4 continent and terrain masks. This restores the
        // freshwater biome without reviving the old radial world generator.
        // Desert and Dark Land reserve their own future water/lore rules.
        const riverCandidate = isV4RiverTile(gxWithMargin, gyWithMargin, this.seed);
        const lakeCandidate = isV4LakeTile(gxWithMargin, gyWithMargin, this.seed);

        const isAutumnCandidate = autumnGrid[sourceIndex] === 1;
        const isSnowCandidate = snowGrid[sourceIndex] === 1;
        const isRockyCandidate = rockyGrid[sourceIndex] === 1;
        if (freshwaterAllowed && riverCandidate) {
          isRiver[targetIndex] = 1;
          if (isAutumnCandidate) isAutumn[targetIndex] = 1;
          if (isSnowCandidate) isSnow[targetIndex] = 1;
          if (isRockyCandidate) isRockyWater[targetIndex] = 1;
        } else if (freshwaterAllowed && lakeCandidate) {
          isLake[targetIndex] = 1;
          if (isAutumnCandidate) isAutumn[targetIndex] = 1;
          if (isSnowCandidate) isSnow[targetIndex] = 1;
          if (isRockyCandidate) isRockyWater[targetIndex] = 1;
        } else if (landGrid[sourceIndex] === 0) isOcean[targetIndex] = 1;
        else if (sandGrid[sourceIndex] === 1) isSand[targetIndex] = 1;
        else if (hillGrid[sourceIndex] === 1) {
          isHill[targetIndex] = 1;
          if (isSnowHill[sourceIndex] === 1) isSnow[targetIndex] = 1;
          if (isRockyHill[sourceIndex] === 1) isRockyHighland[targetIndex] = 1;
          if (highCliffGrid[sourceIndex] === 1) isHighCliff[targetIndex] = 1;
        } else if (desertGrid[sourceIndex] === 1) isDesert[targetIndex] = 1;
        else if (darkGrid[sourceIndex] === 1) isDarkLand[targetIndex] = 1;
        else if (isAutumnCandidate) isAutumn[targetIndex] = 1;
        else if (isSnowCandidate) isSnow[targetIndex] = 1;
        else if (isRockyCandidate) isRockyHighland[targetIndex] = 1;
        else if (apricornPlainGrid[sourceIndex] === 1) isApricornPlain[targetIndex] = 1;
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
      isApricornPlain,
      isSnow,
      isRockyHighland,
      isRockyWater,
      isHighCliff,
    };
  }
}
