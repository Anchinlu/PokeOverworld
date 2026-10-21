import type { ContinentPlan } from '../plan/continent-plan';
import type { RegionInfo } from '../plan/regions';
import type { RoadEdge, SettlementInfo } from '../plan/settlement-network';

/** Read-only runtime gateway for systems that need macro continent data. */
export class ContinentQuery {
  public constructor(private readonly plan: ContinentPlan) {}

  public getPlan(): ContinentPlan {
    return this.plan;
  }

  public isMacroLandAt(gx: number, gy: number): boolean {
    return this.plan.macroPlan.isMacroLandAtWorld(gx, gy);
  }

  public isHomeContinentAtMacroCell(mx: number, my: number): boolean {
    const { bounds, landMask } = this.plan;
    const localX = mx - bounds.gx0;
    const localY = my - bounds.gy0;
    if (localX < 0 || localY < 0 || localX >= bounds.cols || localY >= bounds.rows) {
      return false;
    }
    return landMask[localY * bounds.cols + localX] === 1;
  }

  public difficultyAt(_gx: number, _gy: number): number {
    // C4 will replace this placeholder with the path-distance difficulty field.
    return 0;
  }

  public regionAtMacroCell(mx: number, my: number): RegionInfo | undefined {
    const { bounds, regionId } = this.plan;
    const localX = mx - bounds.gx0;
    const localY = my - bounds.gy0;
    if (localX < 0 || localY < 0 || localX >= bounds.cols || localY >= bounds.rows) {
      return undefined;
    }
    const region = regionId[localY * bounds.cols + localX];
    return region === 255 ? undefined : this.plan.regions[region];
  }

  public regionAt(gx: number, gy: number): RegionInfo | undefined {
    return this.regionAtMacroCell(
      Math.floor(gx / this.plan.cellSize),
      Math.floor(gy / this.plan.cellSize)
    );
  }

  public biomeAt(gx: number, gy: number): string | undefined {
    return this.regionAt(gx, gy)?.primaryBiome;
  }

  public settlementNear(gx: number, gy: number, radius = 48): SettlementInfo | undefined {
    const radiusSquared = radius * radius;
    let nearest: SettlementInfo | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const settlement of this.plan.settlements) {
      const dx = settlement.gx - gx;
      const dy = settlement.gy - gy;
      const distance = dx * dx + dy * dy;
      if (distance <= radiusSquared && distance < nearestDistance) {
        nearest = settlement;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  public getRoads(): readonly RoadEdge[] {
    return this.plan.roads;
  }

  public isRoadAt(gx: number, gy: number): boolean {
    const localX = gx - this.plan.bounds.gx0 * this.plan.cellSize;
    const localY = gy - this.plan.bounds.gy0 * this.plan.cellSize;
    const width = this.plan.bounds.cols * this.plan.cellSize;
    const height = this.plan.bounds.rows * this.plan.cellSize;
    if (localX < 0 || localY < 0 || localX >= width || localY >= height) return false;
    return this.plan.roadMask[localY * width + localX] === 1;
  }
}
