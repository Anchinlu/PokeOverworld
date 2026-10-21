import { beforeEach, describe, expect, it } from 'vitest';
import { ContinentService } from '../../src/continent';

describe('World Gen v4 ContinentPlan C2', () => {
  beforeEach(() => {
    ContinentService.clearCache();
  });

  it('builds a deterministic plan with a bounded macro home mask', () => {
    const first = new ContinentService(101).getPlan();
    const second = new ContinentService(101).getPlan();

    expect(first).toBe(second);
    expect(first.version).toBe(4);
    expect(first.bounds.cols * first.bounds.rows).toBe(first.landMask.length);
    expect(first.regionId.some((value) => value !== 255)).toBe(true);
    expect(first.difficulty.every((value) => value === 0)).toBe(true);
    expect(first.startVillage).toEqual({ gx: 0, gy: 0, name: 'Twinleaf Hamlet' });
  });

  it('provides O(1)-style runtime macro queries through the gateway', () => {
    const service = new ContinentService(4242);
    const query = service.getQuery();
    const plan = service.getPlan();

    expect(query.getPlan()).toBe(plan);
    expect(typeof query.isMacroLandAt(0, 0)).toBe('boolean');
    expect(query.isHomeContinentAtMacroCell(0, 0)).toBe(true);
    expect(query.difficultyAt(0, 0)).toBe(0);
  });
});
