import type { ContinentBounds, ContinentPlan } from './continent-plan';
import type { RegionInfo } from './regions';

export type SettlementKind = 'hub' | 'village' | 'hamlet';

export interface SettlementInfo {
  readonly id: number;
  readonly name: string;
  readonly kind: SettlementKind;
  readonly regionId: number;
  readonly gx: number;
  readonly gy: number;
  readonly tier: 0 | 1 | 2;
}

export interface MacroRoadPoint {
  readonly mx: number;
  readonly my: number;
}

export interface RoadEdge {
  readonly id: number;
  readonly fromSettlementId: number;
  readonly toSettlementId: number;
  readonly isPrimary: boolean;
  readonly path: readonly MacroRoadPoint[];
}

export interface RoadMaskSource {
  readonly cellSize: number;
  readonly bounds: ContinentBounds;
  readonly landMask: Uint8Array;
}

export interface SettlementNetwork {
  readonly settlements: readonly SettlementInfo[];
  readonly roads: readonly RoadEdge[];
}

/**
 * Rasterizes the macro road graph once at plan creation time. Chunk terrain can
 * then query a tile in O(1), instead of walking every road edge for every tile.
 */
export function createRoadMask(plan: RoadMaskSource, roads: readonly RoadEdge[]): Uint8Array {
  const width = plan.bounds.cols * plan.cellSize;
  const height = plan.bounds.rows * plan.cellSize;
  const mask = new Uint8Array(width * height);
  const originGX = plan.bounds.gx0 * plan.cellSize;
  const originGY = plan.bounds.gy0 * plan.cellSize;

  const mark = (gx: number, gy: number, radius: number): void => {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = gx + dx - originGX;
        const y = gy + dy - originGY;
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const macroX = Math.floor((x + originGX) / plan.cellSize);
        const macroY = Math.floor((y + originGY) / plan.cellSize);
        const macroIndex =
          (macroY - plan.bounds.gy0) * plan.bounds.cols + (macroX - plan.bounds.gx0);
        if (plan.landMask[macroIndex] !== 1) continue;
        mask[y * width + x] = 1;
      }
    }
  };

  for (const road of roads) {
    for (let index = 0; index < road.path.length; index++) {
      const point = road.path[index];
      const centerGX = point.mx * plan.cellSize + Math.floor(plan.cellSize / 2);
      const centerGY = point.my * plan.cellSize + Math.floor(plan.cellSize / 2);
      mark(centerGX, centerGY, 1);
      const next = road.path[index + 1];
      if (!next) continue;

      const nextGX = next.mx * plan.cellSize + Math.floor(plan.cellSize / 2);
      const nextGY = next.my * plan.cellSize + Math.floor(plan.cellSize / 2);
      if (centerGX !== nextGX) {
        const step = nextGX > centerGX ? 1 : -1;
        for (let gx = centerGX; gx !== nextGX; gx += step) mark(gx, centerGY, 1);
      } else {
        const step = nextGY > centerGY ? 1 : -1;
        for (let gy = centerGY; gy !== nextGY; gy += step) mark(centerGX, gy, 1);
      }
    }
  }

  return mask;
}

const HUB_NAMES = [
  'Verdant City',
  'Mistveil City',
  'Cinder City',
  'Elderwood City',
  'Shadow City',
  'Frontier City',
];
const VILLAGE_NAMES = [
  'Oakrest',
  'Riverside',
  'Sunpetal',
  'Pinewatch',
  'Breezefield',
  'Moonhollow',
];

export function createSettlementNetwork(
  plan: Pick<ContinentPlan, 'seed' | 'cellSize' | 'bounds' | 'landMask'> & {
    readonly regions: readonly RegionInfo[];
    readonly regionId: Uint8Array;
  }
): SettlementNetwork {
  const settlements: SettlementInfo[] = [];

  for (const region of plan.regions) {
    const regionCells = getRegionCells(plan, region.id);
    if (regionCells.length === 0) continue;

    const hubCell = findCellNear(regionCells, region.centerGX, region.centerGY);
    settlements.push({
      id: settlements.length,
      name: HUB_NAMES[region.id] ?? `Region ${region.id + 1} Hub`,
      kind: 'hub',
      regionId: region.id,
      gx: hubCell.mx * plan.cellSize + plan.cellSize / 2,
      gy: hubCell.my * plan.cellSize + plan.cellSize / 2,
      tier: 2,
    });

    const villageCount = 3 + Math.floor(hash01(region.id, plan.seed, 611) * 3);
    const chosen: MacroCell[] = [hubCell];
    for (let index = 0; index < villageCount; index++) {
      const villageCell = chooseSpacedCell(regionCells, chosen, region.id, plan.seed, index);
      chosen.push(villageCell);
      const settlementIndex = settlements.length;
      settlements.push({
        id: settlementIndex,
        name: `${VILLAGE_NAMES[(settlementIndex + region.id) % VILLAGE_NAMES.length]} ${region.id + 1}`,
        kind: index === villageCount - 1 ? 'hamlet' : 'village',
        regionId: region.id,
        gx: villageCell.mx * plan.cellSize + plan.cellSize / 2,
        gy: villageCell.my * plan.cellSize + plan.cellSize / 2,
        tier: index === villageCount - 1 ? 0 : 1,
      });
    }
  }

  return {
    settlements,
    // Inter-settlement routes are intentionally deferred. Villages keep their
    // own internal paths; world-scale roads will be introduced later with
    // terrain-aware bridges and route rules instead of a forced connected graph.
    roads: [],
  };
}

interface MacroCell {
  readonly mx: number;
  readonly my: number;
  readonly index: number;
}

function getRegionCells(
  plan: Pick<ContinentPlan, 'bounds' | 'regionId' | 'landMask'> & { readonly regionId: Uint8Array },
  regionId: number
): MacroCell[] {
  const cells: MacroCell[] = [];
  for (let index = 0; index < plan.regionId.length; index++) {
    if (plan.regionId[index] !== regionId || plan.landMask[index] !== 1) continue;
    cells.push({
      mx: plan.bounds.gx0 + (index % plan.bounds.cols),
      my: plan.bounds.gy0 + Math.floor(index / plan.bounds.cols),
      index,
    });
  }
  return cells;
}

function findCellNear(cells: MacroCell[], gx: number, gy: number): MacroCell {
  return cells.reduce((best, cell) => {
    const bestDX = best.mx - gx;
    const bestDY = best.my - gy;
    const cellDX = cell.mx - gx;
    const cellDY = cell.my - gy;
    const bestDistance = bestDX * bestDX + bestDY * bestDY;
    const cellDistance = cellDX * cellDX + cellDY * cellDY;
    if (cellDistance !== bestDistance) return cellDistance < bestDistance ? cell : best;
    return cell.index < best.index ? cell : best;
  }, cells[0]);
}

function chooseSpacedCell(
  cells: MacroCell[],
  chosen: MacroCell[],
  regionId: number,
  seed: number,
  sequence: number
): MacroCell {
  let best = cells[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of cells) {
    let nearest = Number.POSITIVE_INFINITY;
    for (const existing of chosen) {
      const dx = candidate.mx - existing.mx;
      const dy = candidate.my - existing.my;
      nearest = Math.min(nearest, dx * dx + dy * dy);
    }
    const tieBreaker = hash01(candidate.index + sequence * 17, seed, 700 + regionId) * 0.01;
    const score = nearest + tieBreaker;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

function hash01(value: number, seed: number, salt: number): number {
  let hash = Math.imul(value | 0, 0x27d4eb2d) ^ Math.imul((seed ^ salt) | 0, 0x9e3779b1);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  return (hash >>> 0) / 4294967296;
}
