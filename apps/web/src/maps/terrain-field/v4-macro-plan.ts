import { isV4SourceLand, V4_CONFIG, type V4SourceOffset } from './v4-config';

export interface V4HomeContinentStats {
  readonly sourceMinMX: number;
  readonly sourceMaxMX: number;
  readonly sourceMinMY: number;
  readonly sourceMaxMY: number;
  readonly areaCells: number;
  readonly originSourceCell: { mx: number; my: number };
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

  private readonly cols = V4_CONFIG.HOME_SCAN_MAX_MX - V4_CONFIG.HOME_SCAN_MIN_MX + 1;
  private readonly rows = V4_CONFIG.HOME_SCAN_MAX_MY - V4_CONFIG.HOME_SCAN_MIN_MY + 1;
  private readonly sourceLand: Uint8Array;
  private readonly selectedComponent: Set<number>;

  public constructor(seed: number) {
    this.seed = seed;
    this.sourceLand = this.buildSourceLandMask();
    const components = this.findComponents();
    const selected = this.selectHomeComponent(components);
    this.selectedComponent = new Set(selected.cells);

    const origin = this.findDeepestCell(selected);
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
      originSourceCell: origin,
    };
  }

  public isHomeContinentCell(worldMX: number, worldMY: number): boolean {
    const sourceMX = Math.floor(
      (worldMX * V4_CONFIG.CELL_SIZE + this.sourceOffset.gx) / V4_CONFIG.CELL_SIZE
    );
    const sourceMY = Math.floor(
      (worldMY * V4_CONFIG.CELL_SIZE + this.sourceOffset.gy) / V4_CONFIG.CELL_SIZE
    );
    const index = this.toIndex(sourceMX, sourceMY);
    return index >= 0 ? this.selectedComponent.has(index) : false;
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
