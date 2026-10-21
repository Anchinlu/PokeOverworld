import { ContinentQuery } from './runtime/continent-query';
import { ContinentPlanCache } from './plan/plan-cache';

const planCache = new ContinentPlanCache();

/** Public C2 gateway shared by terrain, map and future wildlife systems. */
export class ContinentService {
  private readonly query: ContinentQuery;

  public constructor(seed: number, version = 4) {
    this.query = new ContinentQuery(planCache.get(seed, version));
  }

  public getPlan() {
    return this.query.getPlan();
  }

  public getQuery(): ContinentQuery {
    return this.query;
  }

  public static clearCache(): void {
    planCache.clear();
  }

  public static getCacheSize(): number {
    return planCache.size;
  }
}

export * from './plan/continent-plan';
export * from './plan/plan-cache';
export * from './runtime/continent-query';
export * from './plan/regions';
export * from './plan/settlement-network';
