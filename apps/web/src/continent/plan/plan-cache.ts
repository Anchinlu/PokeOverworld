import { V4MacroPlan } from '../../maps/terrain-field/v4-macro-plan';
import { createContinentPlan, type ContinentPlan } from './continent-plan';

const MAX_CACHED_PLANS = 8;

/** Bounded deterministic plan cache keyed by world generation version and seed. */
export class ContinentPlanCache {
  private readonly plans = new Map<string, ContinentPlan>();

  public get(seed: number, version = 4): ContinentPlan {
    if (version !== 4) {
      throw new Error(`ContinentPlan only supports worldGenVersion 4, received ${version}`);
    }

    const key = `${version}:${seed}`;
    const cached = this.plans.get(key);
    if (cached) return cached;

    const plan = createContinentPlan(seed, new V4MacroPlan(seed));
    if (this.plans.size >= MAX_CACHED_PLANS) {
      const firstKey = this.plans.keys().next().value;
      if (firstKey !== undefined) this.plans.delete(firstKey);
    }
    this.plans.set(key, plan);
    return plan;
  }

  public clear(): void {
    this.plans.clear();
  }

  public get size(): number {
    return this.plans.size;
  }
}
