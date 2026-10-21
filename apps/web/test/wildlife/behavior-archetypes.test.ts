import { describe, it, expect } from 'vitest';
import { getBehaviorProfile, getAllBehaviorArchetypes } from '../../src/wildlife/behavior/profiles/profile-registry';
import {
  startWildStep,
  updateGridMovement,
  canWildEntityEnter,
} from '../../src/wildlife/behavior/movement/grid-mover';
import type { WildEntity } from '../../src/wildlife/model';
import type { WorldQuery } from '../../src/wildlife/ports/world-query';

function createMockEntity(overrides?: Partial<WildEntity>): WildEntity {
  return {
    gx: 5,
    gy: 5,
    x: 160,
    y: 160,
    speciesKey: 'PIDGEY',
    name: 'PIDGEY',
    level: 5,
    role: 'solo',
    behavior: 'skittish_bird',
    dir: 0,
    homeGX: 5,
    homeGY: 5,
    wanderRadius: 3,
    state: 'idle',
    isMoving: false,
    fromX: 160,
    fromY: 160,
    targetGX: 5,
    targetGY: 5,
    targetX: 160,
    targetY: 160,
    stepProgress: 0,
    moveSpeed: 1.0,
    stepsRemaining: 0,
    currentDir: 0,
    lastMoveTime: 0,
    idleTimer: 1000,
    frame: 0,
    seed: 12345,
    chunkCx: 0,
    chunkCy: 0,
    ...overrides,
  };
}

describe('Wildlife Behavior Archetypes & Grid Movement (Section 6.1 & W5)', () => {
  describe('Archetype Registry Parity', () => {
    it('contains all 5 legacy behavior archetypes with full parity', () => {
      const all = getAllBehaviorArchetypes();
      expect(all).toHaveProperty('skittish_bird');
      expect(all).toHaveProperty('aggressive_bird');
      expect(all).toHaveProperty('curious_rodent');
      expect(all).toHaveProperty('slow_bug');
      expect(all).toHaveProperty('dormant_cocoon');
    });

    it('returns default curious_rodent profile for unknown behavior ids', () => {
      const profile = getBehaviorProfile('unknown_mystic_beast');
      expect(profile.id).toBe('curious_rodent');
    });

    it('verifies sensory and temperament configuration for skittish vs aggressive birds', () => {
      const skittish = getBehaviorProfile('skittish_bird');
      const aggressive = getBehaviorProfile('aggressive_bird');

      expect(skittish.temperament).toBe('skittish');
      expect(aggressive.temperament).toBe('aggressive');
      expect(skittish.threat.fleeBelowRatio).toBeGreaterThan(aggressive.threat.fleeBelowRatio);
    });
  });

  describe('Grid Mover Movement & Collision', () => {
    const mockWorld: WorldQuery = {
      isWalkable: (gx, gy) => gx >= 0 && gy >= 0 && !(gx === 5 && gy === 6), // tile (5, 6) is blocked
      contextAt: () => 'tall_grass',
      biomeAt: () => 'meadow',
      difficultyAt: () => 0.1,
      timeBand: () => 'day',
      weather: () => 'clear',
    };

    it('prevents wild entities from stepping into unwalkable or occupied tiles', () => {
      // (5, 6) is unwalkable in mockWorld
      expect(canWildEntityEnter(5, 6, mockWorld)).toBe(false);
      // (5, 4) is walkable
      expect(canWildEntityEnter(5, 4, mockWorld)).toBe(true);

      // Occupied tiles check
      const occupied = new Set(['5,4']);
      expect(canWildEntityEnter(5, 4, mockWorld, occupied)).toBe(false);
    });

    it('interpolates grid step movement smoothly across 32px step and completes cleanly', () => {
      const entity = createMockEntity();

      // Start stepping Down (dir = 0 => dx: 0, dy: 1)
      startWildStep(entity, 0);

      expect(entity.isMoving).toBe(true);
      expect(entity.targetGX).toBe(5);
      expect(entity.targetGY).toBe(6);
      expect(entity.targetX).toBe(5 * 32 - 16);
      expect(entity.targetY).toBe(6 * 32 - 32);

      // Simulate partial steps (dtScale = 16 => 16px of 32px progress, half way)
      entity.moveSpeed = 16.0;
      const resHalf = updateGridMovement(entity, 1.0);
      expect(resHalf.reachedTarget).toBe(false);
      expect(entity.isMoving).toBe(true);
      expect(entity.x).toBe(5 * 32 - 16);
      expect(entity.y).toBe(5 * 32 - 32 + 16); // Halfway between 128 and 160
      expect(entity.bobY).toBeLessThan(0); // Subtle step bounce

      // Advance second half (reaches 32px)
      const resEnd = updateGridMovement(entity, 1.0);
      expect(resEnd.reachedTarget).toBe(true);
      expect(entity.isMoving).toBe(false);
      expect(entity.gx).toBe(5);
      expect(entity.gy).toBe(6);
      expect(entity.x).toBe(5 * 32 - 16);
      expect(entity.y).toBe(6 * 32 - 32);
      expect(entity.bobY).toBe(0);
      expect(entity.frame).toBe(0);
    });
  });
});
