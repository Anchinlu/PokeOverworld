import { fbm2 } from './noise';
import { isV4LakeTile, isV4RiverTile } from './v4-water';
import {
  isV4SourceLand,
  sampleV4ContinentalValue,
  V4_CONFIG,
  type V4SourceOffset,
} from './v4-config';

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
  }

  public isHomeContinentCell(worldMX: number, worldMY: number): boolean {
    const index = this.toSourceIndex(worldMX, worldMY);
    return index >= 0 ? this.selectedComponent.has(index) : false;
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
    const eligible = components.filter(
      (component) =>
        component.area >= V4_CONFIG.HOME_AREA_MIN_CELLS &&
        component.area <= V4_CONFIG.HOME_AREA_MAX_CELLS
    );
    const candidates = eligible.length > 0 ? eligible : components;
    if (candidates.length === 0) {
      throw new Error(`World Gen v4 could not find a landmass for seed ${this.seed}`);
    }

    return [...candidates].sort((left, right) => {
      const leftDistance = left.centroidMX * left.centroidMX + left.centroidMY * left.centroidMY;
      const rightDistance =
        right.centroidMX * right.centroidMX + right.centroidMY * right.centroidMY;
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      return right.area - left.area;
    })[0];
  }

  private findDeepestCell(component: MacroComponent): { mx: number; my: number } {
    let best = { mx: this.indexToMX(component.cells[0]), my: this.indexToMY(component.cells[0]) };
    let bestClearance = -1;
    const componentSet = new Set(component.cells);

    for (const index of component.cells) {
      const mx = this.indexToMX(index);
      const my = this.indexToMY(index);
      const clearance = this.measureClearance(mx, my, componentSet);
      if (
        clearance > bestClearance ||
        (clearance === bestClearance && (my < best.my || (my === best.my && mx < best.mx)))
      ) {
        best = { mx, my };
        bestClearance = clearance;
      }
    }
    return best;
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
    let best:
      { mx: number; my: number; clearance: number; score: number; index: number } | undefined;

    for (const index of component.cells) {
      const mx = this.indexToMX(index);
      const my = this.indexToMY(index);
      const clearance = this.measureClearance(mx, my, componentSet);
      if (clearance < 8) continue;

      const sourceGX = mx * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2;
      const sourceGY = my * V4_CONFIG.CELL_SIZE + V4_CONFIG.CELL_SIZE / 2;
      // Reject obviously unsuitable macro cells before the more expensive
      // footprint scan below.
      if (this.isStartSpecialBiome(sourceGX, sourceGY) || this.isStartHill(sourceGX, sourceGY)) {
        continue;
      }
      if (!this.isSuitableStartArea(sourceGX, sourceGY)) continue;

      const distanceFromCenter = mx * mx + my * my;
      const score = clearance * 10_000 - distanceFromCenter;
      if (!best || score > best.score || (score === best.score && index < best.index)) {
        best = { mx, my, clearance, score, index };
      }
    }

    if (best) return best;
    const fallback = this.findDeepestCell(component);
    return {
      ...fallback,
      clearance: this.measureClearance(fallback.mx, fallback.my, componentSet),
    };
  }

  private isSuitableStartArea(sourceGX: number, sourceGY: number): boolean {
    const radius = V4_CONFIG.START_SEARCH_RADIUS;
    const sampleStep = 8;
    for (let dy = -radius; dy <= radius; dy += sampleStep) {
      for (let dx = -radius; dx <= radius; dx += sampleStep) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const gx = sourceGX + dx;
        const gy = sourceGY + dy;
        if (sampleV4ContinentalValue(gx, gy, this.seed) < V4_CONFIG.START_LAND_THRESHOLD) {
          return false;
        }
        if (this.isStartSpecialBiome(gx, gy) || this.isStartHill(gx, gy)) return false;
        if (isV4RiverTile(gx, gy, this.seed) || isV4LakeTile(gx, gy, this.seed)) return false;
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
