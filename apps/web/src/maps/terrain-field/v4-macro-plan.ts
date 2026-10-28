import { fbm2 } from './noise';
import { isV4LakeTile, isV4RiverTile } from './v4-water';
import {
  isV4SourceLand,
  sampleV4ContinentalValue,
  V4_CONFIG,
  type V4SourceOffset,
} from './v4-config';
import {
  CLIMATE_CONFIG,
  sampleClimate,
  type ClimateAnchor,
  type ClimateAnchorKind,
} from '../climate';


export interface V4HomeContinentStats {
  readonly sourceMinMX: number;
  readonly sourceMaxMX: number;
  readonly sourceMinMY: number;
  readonly sourceMaxMY: number;
  readonly areaCells: number;
  readonly originSourceCell: { mx: number; my: number };
}

export interface V4StartLocation {
  readonly sourceMX: number;
  readonly sourceMY: number;
  readonly clearance: number;
}

interface MacroComponent {
  readonly cells: number[];
  readonly area: number;
  readonly centroidMX: number;
  readonly centroidMY: number;
}

/**
 * Deterministic coarse geography plan used by World Gen v4.
 *
 * The plan is deliberately independent from rendering and chunk objects. It
 * scans only a macro grid once, chooses a home landmass, then exposes an
 * offset so the existing starter village remains at world coordinate (0, 0).
 */
export class V4MacroPlan {
  public readonly seed: number;
  public readonly sourceOffset: V4SourceOffset;
  public readonly homeContinent: V4HomeContinentStats;
  public readonly startLocation: V4StartLocation;
  public readonly climateAnchors: readonly ClimateAnchor[];

  private readonly cols = V4_CONFIG.HOME_SCAN_MAX_MX - V4_CONFIG.HOME_SCAN_MIN_MX + 1;
  private readonly rows = V4_CONFIG.HOME_SCAN_MAX_MY - V4_CONFIG.HOME_SCAN_MIN_MY + 1;
  private readonly sourceLand: Uint8Array;
  private readonly selectedComponent: Set<number>;
  private readonly islandComponents: Set<number>;

  public constructor(seed: number) {
    this.seed = seed;
    this.sourceLand = this.buildSourceLandMask();
    const components = this.findComponents();
    const selected = this.selectHomeComponent(components);
    this.selectedComponent = new Set(selected.cells);
    this.islandComponents = new Set(
      components
        .filter(
          (component) =>
            component !== selected &&
            component.area >= V4_CONFIG.ISLAND_MIN_CELLS &&
            component.area <= V4_CONFIG.ISLAND_MAX_CELLS
        )
        .flatMap((component) => component.cells)
    );

    const origin = this.findStartLocation(selected);
    this.startLocation = {
      sourceMX: origin.mx,
      sourceMY: origin.my,
      clearance: origin.clearance,
    };
    this.sourceOffset = {
      gx: origin.mx * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2,
      gy: origin.my * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2,
    };
    this.homeContinent = {
      sourceMinMX: Math.min(...selected.cells.map((index) => this.indexToMX(index))),
      sourceMaxMX: Math.max(...selected.cells.map((index) => this.indexToMX(index))),
      sourceMinMY: Math.min(...selected.cells.map((index) => this.indexToMY(index))),
      sourceMaxMY: Math.max(...selected.cells.map((index) => this.indexToMY(index))),
      areaCells: selected.area,
      originSourceCell: { mx: origin.mx, my: origin.my },
    };
    this.climateAnchors = this.buildClimateAnchors(selected);
  }


  public isHomeContinentCell(worldMX: number, worldMY: number): boolean {
    const index = this.toSourceIndex(worldMX, worldMY);
    return index >= 0 ? this.selectedComponent.has(index) : false;
  }

  public isNearHomeContinentCell(worldMX: number, worldMY: number, radius = 1): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (this.isHomeContinentCell(worldMX + dx, worldMY + dy)) return true;
      }
    }
    return false;
  }


  /** Returns true for the selected home continent or an intentionally small island. */
  public isNaturalLandCell(worldMX: number, worldMY: number): boolean {
    const index = this.toSourceIndex(worldMX, worldMY);
    return index >= 0 && (this.selectedComponent.has(index) || this.islandComponents.has(index));
  }

  /**
   * Keeps one macro-cell of continuous-field transition around landmasses.
   * Without this buffer, component clipping would create axis-aligned coast
   * edges at 32-tile macro-cell boundaries.
   */
  public isNearNaturalLandCell(worldMX: number, worldMY: number, radius = 1): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (this.isNaturalLandCell(worldMX + dx, worldMY + dy)) return true;
      }
    }
    return false;
  }

  /**
   * Returns the Chebyshev macro-cell distance (0..maxRadius+1) to the nearest
   * natural land cell so coastlines outside the macro mask taper organically
   * along continuous noise contours instead of clipping on axis-aligned lines.
   */
  public getNaturalLandCellDistance(worldMX: number, worldMY: number, maxRadius = 4): number {
    if (this.isNaturalLandCell(worldMX, worldMY)) return 0;
    for (let r = 1; r <= maxRadius; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (this.isNaturalLandCell(worldMX + dx, worldMY + dy)) return r;
        }
      }
    }
    return maxRadius + 1;
  }


  public isMacroLandAtWorld(gx: number, gy: number): boolean {
    const sourceGX = gx + this.sourceOffset.gx;
    const sourceGY = gy + this.sourceOffset.gy;
    const sourceMX = Math.floor(sourceGX / V4_CONFIG.CELL_SIZE);
    const sourceMY = Math.floor(sourceGY / V4_CONFIG.CELL_SIZE);
    return isV4SourceLand(
      sourceMX * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2,
      sourceMY * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2,
      this.seed
    );
  }

  public getSourceCoordinates(gx: number, gy: number): { gx: number; gy: number } {
    return { gx: gx + this.sourceOffset.gx, gy: gy + this.sourceOffset.gy };
  }

  private toSourceIndex(worldMX: number, worldMY: number): number {
    const sourceMX = Math.floor(
      (worldMX * V4_CONFIG.CELL_SIZE + this.sourceOffset.gx) / V4_CONFIG.CELL_SIZE
    );
    const sourceMY = Math.floor(
      (worldMY * V4_CONFIG.CELL_SIZE + this.sourceOffset.gy) / V4_CONFIG.CELL_SIZE
    );
    return this.toIndex(sourceMX, sourceMY);
  }

  private buildSourceLandMask(): Uint8Array {
    const mask = new Uint8Array(this.cols * this.rows);
    for (let my = V4_CONFIG.HOME_SCAN_MIN_MY; my <= V4_CONFIG.HOME_SCAN_MAX_MY; my++) {
      for (let mx = V4_CONFIG.HOME_SCAN_MIN_MX; mx <= V4_CONFIG.HOME_SCAN_MAX_MX; mx++) {
        const sourceGX = mx * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2;
        const sourceGY = my * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2;
        if (isV4SourceLand(sourceGX, sourceGY, this.seed)) {
          mask[this.toIndex(mx, my)] = 1;
        }
      }
    }
    return mask;
  }

  private findComponents(): MacroComponent[] {
    const visited = new Uint8Array(this.sourceLand.length);
    const components: MacroComponent[] = [];

    for (let index = 0; index < this.sourceLand.length; index++) {
      if (this.sourceLand[index] === 0 || visited[index] === 1) continue;

      const cells: number[] = [];
      const queue = [index];
      visited[index] = 1;
      let sumMX = 0;
      let sumMY = 0;

      while (queue.length > 0) {
        const current = queue.pop()!;
        cells.push(current);
        const mx = this.indexToMX(current);
        const my = this.indexToMY(current);
        sumMX += mx;
        sumMY += my;

        for (const [nextMX, nextMY] of [
          [mx + 1, my],
          [mx - 1, my],
          [mx, my + 1],
          [mx, my - 1],
        ] as const) {
          const next = this.toIndex(nextMX, nextMY);
          if (next < 0 || this.sourceLand[next] === 0 || visited[next] === 1) continue;
          visited[next] = 1;
          queue.push(next);
        }
      }

      components.push({
        cells,
        area: cells.length,
        centroidMX: sumMX / cells.length,
        centroidMY: sumMY / cells.length,
      });
    }

    return components;
  }

  private selectHomeComponent(components: MacroComponent[]): MacroComponent {
    if (components.length === 0) {
      throw new Error(`World Gen v4 could not find a landmass for seed ${this.seed}`);
    }

    const eligible = components.filter(
      (component) =>
        component.area >= V4_CONFIG.HOME_AREA_MIN_CELLS &&
        component.area <= V4_CONFIG.HOME_AREA_MAX_CELLS
    );
    if (eligible.length > 0) {
      return [...eligible].sort((left, right) => {
        const leftDistance = left.centroidMX * left.centroidMX + left.centroidMY * left.centroidMY;
        const rightDistance =
          right.centroidMX * right.centroidMX + right.centroidMY * right.centroidMY;
        if (leftDistance !== rightDistance) return leftDistance - rightDistance;
        return right.area - left.area;
      })[0];
    }

    // If the main continent exceeds HOME_AREA_MAX_CELLS, still require at least
    // HOME_AREA_MIN_CELLS so we never fall back to a 1-cell ocean speck near (0,0).
    const largeEnough = components.filter(
      (component) => component.area >= V4_CONFIG.HOME_AREA_MIN_CELLS
    );
    if (largeEnough.length > 0) {
      return [...largeEnough].sort((left, right) => {
        const leftDistance = left.centroidMX * left.centroidMX + left.centroidMY * left.centroidMY;
        const rightDistance =
          right.centroidMX * right.centroidMX + right.centroidMY * right.centroidMY;
        if (leftDistance !== rightDistance) return leftDistance - rightDistance;
        return right.area - left.area;
      })[0];
    }

    // Ultimate fallback: largest landmass by area.
    return [...components].sort((left, right) => right.area - left.area)[0];
  }

  private findDeepestCell(component: MacroComponent): { mx: number; my: number } {
    let best = { mx: this.indexToMX(component.cells[0]), my: this.indexToMY(component.cells[0]) };
    let bestScore = Number.NEGATIVE_INFINITY;
    const componentSet = new Set(component.cells);

    for (const index of component.cells) {
      const mx = this.indexToMX(index);
      const my = this.indexToMY(index);
      const clearance = this.measureClearance(mx, my, componentSet);
      const sourceGX = mx * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2;
      const sourceGY = my * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2;
      const minLandVal = this.getMinLandValueInRadius(sourceGX, sourceGY, 24);
      // Strongly penalize cells that dip below V5 natural-landmass seaLevel (0.56 + coast warp)
      const landBonus = minLandVal >= 0.60 ? 500_000 : minLandVal >= 0.575 ? 100_000 : -1_000_000;
      const score = clearance * 10_000 + landBonus + Math.round(minLandVal * 1000);
      if (
        score > bestScore ||
        (score === bestScore && (my < best.my || (my === best.my && mx < best.mx)))
      ) {
        best = { mx, my };
        bestScore = score;
      }
    }
    return best;
  }

  private getMinLandValueInRadius(sourceGX: number, sourceGY: number, radius: number): number {
    let minVal = Number.POSITIVE_INFINITY;
    const step = 8;
    for (let dy = -radius; dy <= radius; dy += step) {
      for (let dx = -radius; dx <= radius; dx += step) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const val = sampleV4ContinentalValue(sourceGX + dx, sourceGY + dy, this.seed);
        if (val < minVal) minVal = val;
      }
    }
    return minVal;
  }

  /**
   * Finds a deterministic flat start area inside the selected continent.
   *
   * The village is still placed at world coordinate (0, 0); only the source
   * offset changes. This preserves the existing village/save API while making
   * each seed choose a genuinely suitable plain instead of relying on a large
   * artificial safe circle around the origin.
   */
  private findStartLocation(component: MacroComponent): {
    mx: number;
    my: number;
    clearance: number;
  } {
    const componentSet = new Set(component.cells);

    const searchPass = (
      minClearance: number,
      landThreshold: number,
      checkSpecialAndWater: boolean
    ): { mx: number; my: number; clearance: number; score: number; index: number } | undefined => {
      let best:
        { mx: number; my: number; clearance: number; score: number; index: number } | undefined;

      for (const index of component.cells) {
        const mx = this.indexToMX(index);
        const my = this.indexToMY(index);
        const clearance = this.measureClearance(mx, my, componentSet);
        if (clearance < minClearance) continue;

        const sourceGX = mx * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2;
        const sourceGY = my * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2;
        if (this.isStartHill(sourceGX, sourceGY)) continue;
        if (checkSpecialAndWater && this.isStartSpecialBiome(sourceGX, sourceGY)) continue;
        if (!this.isSuitableStartArea(sourceGX, sourceGY, landThreshold, checkSpecialAndWater)) {
          continue;
        }

        const distanceFromCenter = mx * mx + my * my;
        const borderMargin = Math.min(
          mx - V4_CONFIG.HOME_SCAN_MIN_MX,
          V4_CONFIG.HOME_SCAN_MAX_MX - mx,
          my - V4_CONFIG.HOME_SCAN_MIN_MY,
          V4_CONFIG.HOME_SCAN_MAX_MY - my
        );
        const borderPenalty = borderMargin < 34 ? (34 - borderMargin) * 25_000 : 0;
        const score = clearance * 10_000 - distanceFromCenter - borderPenalty;
        if (!best || score > best.score || (score === best.score && index < best.index)) {
          best = { mx, my, clearance, score, index };
        }
      }
      return best;
    };

    // Pass 1: Strict ideal plain
    const strictBest = searchPass(8, V4_CONFIG.START_LAND_THRESHOLD, true);
    if (strictBest) return strictBest;

    // Pass 2: Relaxed inland plain (still well above V5 0.56 seaLevel so it never touches ocean)
    const relaxedBest = searchPass(4, 0.60, false);
    if (relaxedBest) return relaxedBest;

    const fallback = this.findDeepestCell(component);
    return {
      ...fallback,
      clearance: this.measureClearance(fallback.mx, fallback.my, componentSet),
    };
  }

  private isSuitableStartArea(
    sourceGX: number,
    sourceGY: number,
    landThreshold: number = V4_CONFIG.START_LAND_THRESHOLD,
    checkSpecialAndWater = true
  ): boolean {
    const radius = Math.max(V4_CONFIG.START_SEARCH_RADIUS, 28);
    const sampleStep = 8;
    for (let dy = -radius; dy <= radius; dy += sampleStep) {
      for (let dx = -radius; dx <= radius; dx += sampleStep) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const gx = sourceGX + dx;
        const gy = sourceGY + dy;
        if (sampleV4ContinentalValue(gx, gy, this.seed) < landThreshold) {
          return false;
        }
        if (this.isStartHill(gx, gy)) return false;
        if (checkSpecialAndWater) {
          if (this.isStartSpecialBiome(gx, gy)) return false;
          if (isV4RiverTile(gx, gy, this.seed) || isV4LakeTile(gx, gy, this.seed)) return false;
        }
      }
    }
    return true;
  }

  private isStartHill(sourceGX: number, sourceGY: number): boolean {
    return (
      fbm2(
        sourceGX / V4_CONFIG.HILL_SCALE,
        sourceGY / V4_CONFIG.HILL_SCALE,
        this.seed,
        V4_CONFIG.HILL_SALT,
        3
      ) >= V4_CONFIG.START_HILL_THRESHOLD
    );
  }

  private isStartSpecialBiome(sourceGX: number, sourceGY: number): boolean {
    const samples = [
      [V4_CONFIG.DESERT_SCALE, V4_CONFIG.DESERT_SALT, V4_CONFIG.DESERT_THRESHOLD],
      [V4_CONFIG.DARK_SCALE, V4_CONFIG.DARK_SALT, V4_CONFIG.DARK_THRESHOLD],
      [V4_CONFIG.AUTUMN_SCALE, V4_CONFIG.AUTUMN_SALT, V4_CONFIG.AUTUMN_THRESHOLD],
      [V4_CONFIG.SNOW_SCALE, V4_CONFIG.SNOW_SALT, V4_CONFIG.SNOW_THRESHOLD],
    ] as const;
    return samples.some(([scale, salt, threshold]) => {
      const region = fbm2(sourceGX / scale, sourceGY / scale, this.seed, salt, 3);
      const detail = fbm2(
        sourceGX / (scale * 0.48),
        sourceGY / (scale * 0.48),
        this.seed,
        salt + 17,
        2
      );
      return region * 0.9 + detail * 0.1 >= threshold - 0.02;
    });
  }

  private measureClearance(mx: number, my: number, component: Set<number>): number {
    let radius = 0;
    while (radius < 16) {
      const next = radius + 1;
      const edge = [
        [mx + next, my],
        [mx - next, my],
        [mx, my + next],
        [mx, my - next],
      ] as const;
      if (edge.some(([x, y]) => !component.has(this.toIndex(x, y)))) break;
      radius = next;
    }
    return radius;
  }

  /**
   * Selects deterministic soft climate anchors on the home continent.
   *
   * Rules:
   * - Never placed on small islands or continents below `anchorMinContinentCells`.
   * - Never placed inside the starter safety radius (`anchorMinStartDistanceCells`).
   * - Requires inland clearance (`anchorMinClearanceCells`) so the resulting
   *   climate basin has enough landmass area to form a full biome.
   * - Anchor coordinates vary by seed while preserving relative climate
   *   direction (cold/snow toward cooler/northern/high-clearance basins,
   *   arid/desert toward warmer/southern/drier basins).
   */
  private buildClimateAnchors(component: MacroComponent): readonly ClimateAnchor[] {
    if (component.area < CLIMATE_CONFIG.anchorMinContinentCells) {
      return [];
    }

    const componentSet = new Set(component.cells);
    const minStartDistSq = CLIMATE_CONFIG.anchorMinStartDistanceCells ** 2;
    const maxStartDistSq = CLIMATE_CONFIG.anchorMaxStartDistanceCells ** 2;
    const minSepSq = CLIMATE_CONFIG.anchorMinSeparationCells ** 2;
    const halfSpanY = Math.max(
      4,
      (this.homeContinent.sourceMaxMY - this.homeContinent.sourceMinMY) / 2
    );

    interface AnchorCandidate {
      readonly index: number;
      readonly mx: number;
      readonly my: number;
      readonly sourceGX: number;
      readonly sourceGY: number;
      readonly clearance: number;
      readonly relY: number;
      readonly baseTemp: number;
      readonly baseMoisture: number;
    }

    const collectCandidates = (enforceMaxRadius: boolean): AnchorCandidate[] => {
      const list: AnchorCandidate[] = [];
      for (const index of component.cells) {
        const mx = this.indexToMX(index);
        const my = this.indexToMY(index);
        const dxStart = mx - this.startLocation.sourceMX;
        const dyStart = my - this.startLocation.sourceMY;
        const startDistSq = dxStart * dxStart + dyStart * dyStart;
        if (startDistSq < minStartDistSq) continue;
        if (enforceMaxRadius && startDistSq > maxStartDistSq) continue;

        const clearance = this.measureClearance(mx, my, componentSet);
        if (clearance < CLIMATE_CONFIG.anchorMinClearanceCells) continue;

        const sourceGX = mx * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2;
        const sourceGY = my * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2;
        const baseClimate = sampleClimate(sourceGX, sourceGY, this.seed);
        const relY = (my - this.startLocation.sourceMY) / halfSpanY;

        list.push({
          index,
          mx,
          my,
          sourceGX,
          sourceGY,
          clearance,
          relY,
          baseTemp: baseClimate.temperature,
          baseMoisture: baseClimate.moisture,
        });
      }
      return list;
    };

    let candidates = collectCandidates(true);
    if (candidates.length < 4) {
      candidates = collectCandidates(false);
    }
    if (candidates.length === 0) return [];


    const chosen: Array<{ kind: ClimateAnchorKind; candidate: AnchorCandidate }> = [];
    const pickBest = (
      kind: ClimateAnchorKind,
      scoreFn: (c: AnchorCandidate) => number
    ): AnchorCandidate | undefined => {
      let best: AnchorCandidate | undefined;
      let bestScore = Number.NEGATIVE_INFINITY;
      for (const candidate of candidates) {
        const tooClose = chosen.some(({ candidate: other }) => {
          const dx = candidate.mx - other.mx;
          const dy = candidate.my - other.my;
          return dx * dx + dy * dy < minSepSq;
        });
        if (tooClose) continue;

        const score = scoreFn(candidate);
        if (
          score > bestScore ||
          (score === bestScore && best !== undefined && candidate.index < best.index)
        ) {
          bestScore = score;
          best = candidate;
        }
      }
      if (best) {
        chosen.push({ kind, candidate: best });
      }
      return best;
    };

    const seedJitter = (c: AnchorCandidate, salt: number): number =>
      fbm2(c.sourceGX / 520, c.sourceGY / 520, this.seed, salt, 2) * 0.35;

    const regionAffinity = (c: AnchorCandidate, salt: number): number =>
      fbm2(c.sourceGX / 260, c.sourceGY / 260, this.seed, salt, 3);

    // 1. Snow anchor: prefers colder baseline, northern/poleward latitude, regional snow basin, and inland clearance.
    const snowCandidate = pickBest(
      'snow',
      (c) =>
        (1 - c.baseTemp) * 1.2 +
        Math.max(-1, Math.min(1, -c.relY)) * 0.4 +
        regionAffinity(c, V4_CONFIG.SNOW_SALT) * 0.8 +
        Math.min(8, c.clearance) * 0.08 +
        seedJitter(c, 5201)
    );

    // 2. Desert anchor: prefers warmer & drier baseline, equatorward latitude, regional arid basin, and inland clearance.
    const desertCandidate = pickBest(
      'desert',
      (c) =>
        c.baseTemp * 1.1 +
        (1 - c.baseMoisture) * 0.75 +
        Math.max(-1, Math.min(1, c.relY)) * 0.4 +
        regionAffinity(c, V4_CONFIG.DESERT_SALT) * 0.8 +
        Math.min(8, c.clearance) * 0.06 +
        seedJitter(c, 5202)
    );

    // 3. Autumn anchor: prefers cool-temperate moisture-rich basin and autumn region affinity.
    const autumnCandidate = pickBest(
      'autumn',
      (c) =>
        (1 - Math.abs(c.baseTemp - 0.34)) * 1.0 +
        c.baseMoisture * 0.6 +
        regionAffinity(c, V4_CONFIG.AUTUMN_SALT) * 0.8 +
        Math.min(8, c.clearance) * 0.06 +
        seedJitter(c, 5203)
    );

    // 4. Dark Land anchor: prefers cool/temperate basin and dark region affinity.
    const darkCandidate = pickBest(
      'dark_land',
      (c) =>
        (1 - Math.abs(c.baseTemp - 0.38)) * 0.9 +
        (1 - c.baseMoisture) * 0.5 +
        regionAffinity(c, V4_CONFIG.DARK_SALT) * 0.8 +
        Math.min(8, c.clearance) * 0.06 +
        seedJitter(c, 5204)
    );

    // 5. Rocky Highland anchor: prefers inland elevated/temperate crag basin and rocky region affinity.
    const rockyCandidate = pickBest(
      'rocky_highland',
      (c) =>
        (1 - Math.abs(c.baseTemp - 0.46)) * 0.95 +
        (1 - Math.abs(c.baseMoisture - 0.36)) * 0.65 +
        regionAffinity(c, V4_CONFIG.ROCKY_SALT) * 0.85 +
        Math.min(8, c.clearance) * 0.08 +
        seedJitter(c, 5205)
    );

    const anchors: ClimateAnchor[] = [];
    if (snowCandidate) {
      anchors.push({
        kind: 'snow',
        sourceGX: snowCandidate.sourceGX,
        sourceGY: snowCandidate.sourceGY,
        targetTemperature: 0.08,
        targetMoisture: 0.56,
        radius: CLIMATE_CONFIG.anchorRadiusTiles,
        maxInfluence: CLIMATE_CONFIG.anchorMaxInfluence,
      });
    }
    if (desertCandidate) {
      anchors.push({
        kind: 'desert',
        sourceGX: desertCandidate.sourceGX,
        sourceGY: desertCandidate.sourceGY,
        targetTemperature: 0.88,
        targetMoisture: 0.14,
        radius: CLIMATE_CONFIG.anchorRadiusTiles,
        maxInfluence: CLIMATE_CONFIG.anchorMaxInfluence,
      });
    }

    if (autumnCandidate) {
      anchors.push({
        kind: 'autumn',
        sourceGX: autumnCandidate.sourceGX,
        sourceGY: autumnCandidate.sourceGY,
        targetTemperature: 0.31,
        targetMoisture: 0.58,
        radius: CLIMATE_CONFIG.anchorSecondaryRadiusTiles,
        maxInfluence: CLIMATE_CONFIG.anchorSecondaryMaxInfluence,
      });
    }
    if (darkCandidate) {
      anchors.push({
        kind: 'dark_land',
        sourceGX: darkCandidate.sourceGX,
        sourceGY: darkCandidate.sourceGY,
        targetTemperature: 0.38,
        targetMoisture: 0.34,
        radius: CLIMATE_CONFIG.anchorSecondaryRadiusTiles,
        maxInfluence: CLIMATE_CONFIG.anchorSecondaryMaxInfluence,
      });
    }
    if (rockyCandidate) {
      anchors.push({
        kind: 'rocky_highland',
        sourceGX: rockyCandidate.sourceGX,
        sourceGY: rockyCandidate.sourceGY,
        targetTemperature: 0.46,
        targetMoisture: 0.34,
        radius: CLIMATE_CONFIG.anchorSecondaryRadiusTiles,
        maxInfluence: CLIMATE_CONFIG.anchorSecondaryMaxInfluence,
      });
    }

    return anchors;
  }


  private toIndex(mx: number, my: number): number {
    if (
      mx < V4_CONFIG.HOME_SCAN_MIN_MX ||
      mx > V4_CONFIG.HOME_SCAN_MAX_MX ||
      my < V4_CONFIG.HOME_SCAN_MIN_MY ||
      my > V4_CONFIG.HOME_SCAN_MAX_MY
    ) {
      return -1;
    }
    return (my - V4_CONFIG.HOME_SCAN_MIN_MY) * this.cols + (mx - V4_CONFIG.HOME_SCAN_MIN_MX);
  }

  private indexToMX(index: number): number {
    return (index % this.cols) + V4_CONFIG.HOME_SCAN_MIN_MX;
  }

  private indexToMY(index: number): number {
    return Math.floor(index / this.cols) + V4_CONFIG.HOME_SCAN_MIN_MY;
  }
}
