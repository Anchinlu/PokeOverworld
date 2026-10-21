import { beforeEach, describe, expect, it } from 'vitest';
import { ContinentService } from '../../src/continent';

describe('World Gen v4 settlement network C5', () => {
  beforeEach(() => {
    ContinentService.clearCache();
  });

  it('creates settlements without forcing world-scale village-to-village roads', () => {
    const plan = new ContinentService(101).getPlan();

    expect(plan.settlements.length).toBeGreaterThanOrEqual(plan.regions.length * 3);
    expect(plan.roads).toEqual([]);
    expect(plan.roadMask.every((tile) => tile === 0)).toBe(true);
  });

  it('keeps settlement and road placement deterministic', () => {
    const first = new ContinentService(4242).getPlan();
    const second = new ContinentService(4242).getPlan();

    expect(first.settlements).toEqual(second.settlements);
    expect(first.roads).toEqual(second.roads);
  });
});
