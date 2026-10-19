import { describe, it, expect } from 'vitest';
import {
  calculateHerdCohesion,
  handleHerdPostBattle,
} from '../../src/wildlife/behavior/social/herd-controller';
import {
  AlarmNetwork,
  calculateAlarmLatency,
} from '../../src/wildlife/behavior/social/alarm';
import type { WildEntity } from '../../src/wildlife/model';

function createHerdMember(id: string, gx: number, gy: number, role: 'member' | 'leader' | 'apex'): WildEntity {
  return {
    id,
    gx,
    gy,
    x: gx * 32,
    y: gy * 32,
    speciesKey: 'PIDGEY',
    name: 'PIDGEY',
    level: 5,
    role,
    herdId: 'herd_alpha',
    behavior: 'skittish_bird',
    dir: 0,
    homeGX: 10,
    homeGY: 10,
    wanderRadius: 4,
    state: 'idle',
    isMoving: false,
    fromX: gx * 32,
    fromY: gy * 32,
    targetGX: gx,
    targetGY: gy,
    targetX: gx * 32,
    targetY: gy * 32,
    stepProgress: 0,
    moveSpeed: 1.0,
    stepsRemaining: 0,
    currentDir: 0,
    lastMoveTime: 0,
    idleTimer: 1000,
    frame: 0,
    seed: 1234,
    chunkCx: 0,
    chunkCy: 0,
  };
}

describe('Wildlife Herd & Alarm Social Network (Section 6.4 & 11.6)', () => {
  describe('Herd Cohesion & Steering', () => {
    it('pulls member towards leader if distance exceeds R_COHESION', () => {
      const leader = createHerdMember('lead', 10, 10, 'leader');
      // Member is 5 tiles away (exceeds R_COHESION = 3)
      const distantMember = createHerdMember('m1', 15, 10, 'member');

      const cohesion = calculateHerdCohesion(distantMember, leader);
      expect(cohesion.shouldPull).toBe(true);
      expect(cohesion.shouldPush).toBe(false);
      expect(cohesion.targetGX).toBe(10);
      expect(cohesion.targetGY).toBe(10);
    });

    it('pushes member away if overlapping with leader (< 1 tile)', () => {
      const leader = createHerdMember('lead', 10, 10, 'leader');
      // Member is on tile (10, 10.5) - too close
      const crowdedMember = createHerdMember('m1', 10, 10, 'member');

      const cohesion = calculateHerdCohesion(crowdedMember, leader);
      expect(cohesion.shouldPull).toBe(false);
    });

    it('remains comfortable when within 1 to R_COHESION tiles', () => {
      const leader = createHerdMember('lead', 10, 10, 'leader');
      const comfortableMember = createHerdMember('m1', 12, 10, 'member'); // 2 tiles away

      const cohesion = calculateHerdCohesion(comfortableMember, leader);
      expect(cohesion.shouldPull).toBe(false);
      expect(cohesion.shouldPush).toBe(false);
    });
  });

  describe('Alarm Propagation Network', () => {
    it('calculates latency between 3 and 8 ticks proportional to distance', () => {
      expect(calculateAlarmLatency(1)).toBe(3); // min clamp 3
      expect(calculateAlarmLatency(3)).toBe(5); // 3 * 1.5 = 4.5 -> 5
      expect(calculateAlarmLatency(10)).toBe(8); // max clamp 8
    });

    it('propagates alarms over time with calculated latency', () => {
      const network = new AlarmNetwork();
      const sender = { gx: 10, gy: 10 };
      const members = [
        { id: 'near_friend', gx: 11, gy: 10 }, // 1 tile -> delay 3 ticks
        { id: 'far_friend', gx: 14, gy: 10 },  // 4 tiles -> delay 6 ticks
      ];

      network.broadcastAlarm('sender_id', sender, members);

      // Tick 1 & 2: no alarms triggered yet
      expect(network.tick()).toEqual([]);
      expect(network.tick()).toEqual([]);

      // Tick 3: near_friend triggers!
      const triggered3 = network.tick();
      expect(triggered3).toContain('near_friend');
      expect(triggered3).not.toContain('far_friend');

      // Tick 4 & 5
      expect(network.tick()).toEqual([]);
      expect(network.tick()).toEqual([]);

      // Tick 6: far_friend triggers!
      const triggered6 = network.tick();
      expect(triggered6).toContain('far_friend');
    });
  });

  describe('Post-Battle Herd Reactions', () => {
    it('causes remaining members to flee when a member is defeated or caught', () => {
      const leader = createHerdMember('lead', 10, 10, 'leader');
      const m1 = createHerdMember('m1', 11, 10, 'member');
      const m2 = createHerdMember('m2', 9, 10, 'member');
      const herd = [leader, m1, m2];

      const res = handleHerdPostBattle('m1', 'member', herd, 'defeated');

      expect(res.herdDissolved).toBe(false);
      expect(res.fleeingIds).toContain('m2');
      expect(m2.state).toBe('flee');
    });

    it('dissolves the entire herd when the leader is defeated or caught', () => {
      const leader = createHerdMember('lead', 10, 10, 'leader');
      const m1 = createHerdMember('m1', 11, 10, 'member');
      const m2 = createHerdMember('m2', 9, 10, 'member');
      const herd = [leader, m1, m2];

      const res = handleHerdPostBattle('lead', 'leader', herd, 'caught');

      expect(res.herdDissolved).toBe(true);
      expect(res.fleeingIds).toContain('m1');
      expect(res.fleeingIds).toContain('m2');
      // Members become solo and flee
      expect(m1.role).toBe('solo');
      expect(m1.state).toBe('flee');
      expect(m1.herdId).toBeUndefined();
    });

    it('does not panic the herd if the player fled from battle', () => {
      const leader = createHerdMember('lead', 10, 10, 'leader');
      const m1 = createHerdMember('m1', 11, 10, 'member');
      const herd = [leader, m1];

      const res = handleHerdPostBattle('m1', 'member', herd, 'fled');

      expect(res.herdDissolved).toBe(false);
      expect(res.fleeingIds).toEqual([]);
      expect(m1.state).not.toBe('flee');
    });
  });
});
