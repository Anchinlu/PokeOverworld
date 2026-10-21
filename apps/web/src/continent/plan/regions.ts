import { fbm2 } from '../../maps/terrain-field/noise';
import type { ContinentBounds, ContinentPlan } from './continent-plan';

export const REGION_COUNT = 6;

const REGION_NAMES = [
  'Verdant Meadow',
  'Misty Wetlands',
  'Cinder Dunes',
  'Elderwood Forest',
  'Shadowmoor',
  'Highland Frontier',
] as const;

const REGION_PACKS = [
  'meadow_route',
  'wetland_basin',
  'desert_frontier',
  'dense_forest',
  'dark_land',
  'highland_meadow',
] as const;

export interface RegionInfo {
  readonly id: number;
  readonly name: string;
  readonly primaryBiome: string;
  readonly secondaryBiomes: readonly string[];
  readonly difficulty: number;
  readonly hubSettlementId: number | null;
  readonly packId: string;
  readonly centerGX: number;
  readonly centerGY: number;
  readonly bounds: ContinentBounds;
}

export interface RegionPlanData {
  readonly regionId: Uint8Array;
  readonly regions: readonly RegionInfo[];
}

interface MacroSeed {
  readonly mx: number;
  readonly my: number;
}

interface ClimateSample {
  readonly heat: number;
  readonly moisture: number;
  readonly density: number;
}

export function createRegionPlan(
  plan: Pick<ContinentPlan, 'seed' | 'cellSize' | 'bounds' | 'landMask' | 'macroPlan'>
): RegionPlanData {
  const regionId = new Uint8Array(plan.landMask.length);
  regionId.fill(255);

  const landCells = getLandCells(plan);
  if (landCells.length === 0) return { regionId, regions: [] };

  const seedCells = chooseFarthestSeeds(plan, landCells);
  assignCells(plan, landCells, seedCells, regionId);

  const regions = seedCells.map((seed, id) => createRegionInfo(plan, id, seed, regionId));
  return { regionId, regions };
}

function getLandCells(plan: Pick<ContinentPlan, 'landMask'>): number[] {
  const landCells: number[] = [];
  for (let index = 0; index < plan.landMask.length; index++) {
    if (plan.landMask[index] === 1) landCells.push(index);
  }
  return landCells;
}

function chooseFarthestSeeds(
  plan: Pick<ContinentPlan, 'seed' | 'bounds' | 'landMask'>,
  landCells: number[]
): MacroSeed[] {
  const count = Math.min(REGION_COUNT, landCells.length);
  const seeds: MacroSeed[] = [];
  const used = new Set<number>();

  const startIndex = landCells.reduce((best, index) => {
    const bestDistance = distanceToOrigin(plan, best);
    const candidateDistance = distanceToOrigin(plan, index);
    return candidateDistance < bestDistance ? index : best;
  }, landCells[0]);
  seeds.push(indexToCell(startIndex, plan.bounds));
  used.add(startIndex);

  while (seeds.length < count) {
    let bestIndex = -1;
    let bestDistance = -1;
    for (const candidate of landCells) {
      if (used.has(candidate)) continue;
      const cell = indexToCell(candidate, plan.bounds);
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const seed of seeds) {
        const dx = cell.mx - seed.mx;
        const dy = cell.my - seed.my;
        nearestDistance = Math.min(nearestDistance, dx * dx + dy * dy);
      }
      const tieBreaker = ((candidate * 1103515245 + plan.seed) >>> 0) / 4294967296;
      const score = nearestDistance + tieBreaker * 0.001;
      if (score > bestDistance) {
        bestDistance = score;
        bestIndex = candidate;
      }
    }
    if (bestIndex < 0) break;
    used.add(bestIndex);
    seeds.push(indexToCell(bestIndex, plan.bounds));
  }

  return seeds;
}

function assignCells(
  plan: Pick<ContinentPlan, 'bounds' | 'landMask'>,
  landCells: number[],
  seeds: MacroSeed[],
  regionId: Uint8Array
): void {
  for (const index of landCells) {
    const cell = indexToCell(index, plan.bounds);
    let bestRegion = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let region = 0; region < seeds.length; region++) {
      const dx = cell.mx - seeds[region].mx;
      const dy = cell.my - seeds[region].my;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestRegion = region;
      }
    }
    regionId[index] = bestRegion;
  }
}

function createRegionInfo(
  plan: Pick<ContinentPlan, 'seed' | 'cellSize' | 'bounds' | 'macroPlan'>,
  id: number,
  seed: MacroSeed,
  regionId: Uint8Array
): RegionInfo {
  let count = 0;
  let minMX = Number.POSITIVE_INFINITY;
  let maxMX = Number.NEGATIVE_INFINITY;
  let minMY = Number.POSITIVE_INFINITY;
  let maxMY = Number.NEGATIVE_INFINITY;
  let heat = 0;
  let moisture = 0;
  let density = 0;
  let centerGX = 0;
  let centerGY = 0;

  for (let index = 0; index < regionId.length; index++) {
    if (regionId[index] !== id) continue;
    const cell = indexToCell(index, plan.bounds);
    const climate = sampleClimate(plan, cell);
    count++;
    minMX = Math.min(minMX, cell.mx);
    maxMX = Math.max(maxMX, cell.mx);
    minMY = Math.min(minMY, cell.my);
    maxMY = Math.max(maxMY, cell.my);
    heat += climate.heat;
    moisture += climate.moisture;
    density += climate.density;
    centerGX += cell.mx;
    centerGY += cell.my;
  }

  const average =
    count > 0
      ? { heat: heat / count, moisture: moisture / count, density: density / count }
      : sampleClimate(plan, seed);
  const primaryBiome = classifyPrimaryBiome(average);
  const secondaryBiomes = classifySecondaryBiomes(average, primaryBiome);
  return {
    id,
    name: REGION_NAMES[id] ?? `Region ${id + 1}`,
    primaryBiome,
    secondaryBiomes,
    difficulty: 0,
    hubSettlementId: null,
    packId: REGION_PACKS[id] ?? 'meadow_route',
    centerGX: count > 0 ? centerGX / count : seed.mx,
    centerGY: count > 0 ? centerGY / count : seed.my,
    bounds: {
      gx0: Number.isFinite(minMX) ? minMX : seed.mx,
      gy0: Number.isFinite(minMY) ? minMY : seed.my,
      cols: Number.isFinite(minMX) ? maxMX - minMX + 1 : 1,
      rows: Number.isFinite(minMY) ? maxMY - minMY + 1 : 1,
    },
  };
}

function sampleClimate(
  plan: Pick<ContinentPlan, 'seed' | 'cellSize' | 'macroPlan'>,
  cell: MacroSeed
): ClimateSample {
  const source = plan.macroPlan.getSourceCoordinates(
    cell.mx * plan.cellSize + plan.cellSize / 2,
    cell.my * plan.cellSize + plan.cellSize / 2
  );
  return {
    heat: fbm2(source.gx / 900, source.gy / 900, plan.seed, 5101, 3),
    moisture: fbm2(source.gx / 820, source.gy / 820, plan.seed, 5102, 3),
    density: fbm2(source.gx / 680, source.gy / 680, plan.seed, 5103, 3),
  };
}

function classifyPrimaryBiome(climate: ClimateSample): string {
  if (climate.heat > 0.68 && climate.moisture < 0.38) return 'desert';
  if (climate.moisture < 0.3 && climate.density > 0.58) return 'dark_land';
  if (climate.density > 0.66) return 'dense_forest';
  if (climate.moisture > 0.7) return 'wetland';
  if (climate.density > 0.48) return 'light_forest';
  return 'meadow';
}

function classifySecondaryBiomes(climate: ClimateSample, primary: string): string[] {
  const candidates = [
    climate.moisture > 0.6 ? 'wetland' : 'meadow',
    climate.density > 0.55 ? 'light_forest' : 'dryland',
    climate.heat > 0.62 ? 'desert' : 'dense_forest',
  ];
  return [...new Set(candidates.filter((biome) => biome !== primary))].slice(0, 2);
}

function distanceToOrigin(plan: Pick<ContinentPlan, 'bounds'>, index: number): number {
  const cell = indexToCell(index, plan.bounds);
  return cell.mx * cell.mx + cell.my * cell.my;
}

function indexToCell(index: number, bounds: ContinentBounds): MacroSeed {
  return {
    mx: bounds.gx0 + (index % bounds.cols),
    my: bounds.gy0 + Math.floor(index / bounds.cols),
  };
}
