import { beforeEach, describe, expect, it } from 'vitest';
import { ContinentService } from '../../src/continent';

describe('World Gen v4 regions C3', () => {
  beforeEach(() => {
    ContinentService.clearCache();
  });

  it('assigns home-continent land to deterministic regions', () => {
    const plan = new ContinentService(101).getPlan();
    const assigned = [...plan.regionId].filter((id) => id !== 255);
    const regionIds = new Set(assigned);

    expect(plan.regions.length).toBeGreaterThanOrEqual(2);
    expect(plan.regions.length).toBeLessThanOrEqual(6);
    expect(regionIds.size).toBe(plan.regions.length);
    expect(plan.regions.every((region) => region.primaryBiome.length > 0)).toBe(true);
  });

  it('exposes region and biome queries through ContinentQuery', () => {
    const service = new ContinentService(4242);
    const query = service.getQuery();
    const region = query.regionAt(0, 0);

    expect(region).toBeDefined();
    expect(query.biomeAt(0, 0)).toBe(region?.primaryBiome);
    expect(query.regionAt(999999, 999999)).toBeUndefined();
  });
});
