import { describe, it, expect } from 'vitest';
import { decideNextAction } from '../../src/wildlife/behavior/brain/utility-brain';
import { getBehaviorProfile } from '../../src/wildlife/behavior/profiles/profile-registry';
import { WildlifeSimulator } from '../../src/wildlife/behavior/wildlife-simulator';
import type { WildEntity } from '../../src/wildlife/model';
import type { WorldQuery } from '../../src/wildlife/ports/world-query';
import type { PlayerQuery } from '../../src/wildlife/ports/player-query';

function createMockCreature(overrides?: Partial<WildEntity>): WildEntity {
  return {
    id: 'test_creature_1',
    gx: 10,
    gy: 10,
    x: 320,
    y: 320,
    speciesKey: 'ZUBAT',
    name: 'ZUBAT',
    level: 6,
    role: 'solo',
    behavior: 'nocturnal_flyer',
    dir: 0,
    homeGX: 10,
    homeGY: 10,
    wanderRadius: 4,
    state: 'idle',
    isMoving: false,
    fromX: 320,
    fromY: 320,
    targetGX: 10,
    targetGY: 10,
    targetX: 320,
    targetY: 320,
    stepProgress: 0,
    moveSpeed: 1.0,
    stepsRemaining: 0,
    currentDir: 0,
    lastMoveTime: 0,
    idleTimer: 1000,
    frame: 0,
    seed: 42,
    chunkCx: 0,
    chunkCy: 0,
    ...overrides,
  };
}

describe('Wildlife AI Behavior & Utility Brain (Section 6.2, 6.5 & 11.5)', () => {
  const mockWorld: WorldQuery = {
    isWalkable: (gx, gy) => gx >= 0 && gy >= 0 && !(gx === 10 && gy === 11), // 10,11 is blocked
    contextAt: () => 'tall_grass',
    biomeAt: () => 'light_forest',
    difficultyAt: () => 0.1,
    timeBand: () => 'day',
    weather: () => 'clear',
  };

  it('nocturnal creature sleeps during the day and startles awake when player is within 2 tiles', () => {
    const profile = getBehaviorProfile('nocturnal_flyer');
    const creature = createMockCreature({ behavior: 'nocturnal_flyer' });

    // Player far away (10 tiles away)
    const farPlayer: PlayerQuery = {
      position: () => ({ gx: 20, gy: 10 }),
      isRunning: () => false,
      inTallGrass: () => false,
      referenceLevel: () => 10,
    };

    // Daytime check: creature sleeps soundly
    const dayDecision = decideNextAction(creature, profile, mockWorld, farPlayer, 1000);
    expect(dayDecision.nextState).toBe('rest_sleep');
    expect(dayDecision.triggerEmote).toBe('dots');

    // Player walks close (1 tile away)
    const nearPlayer: PlayerQuery = {
      position: () => ({ gx: 11, gy: 10 }),
      isRunning: () => false,
      inTallGrass: () => false,
      referenceLevel: () => 10,
    };

    // Startled awake!
    const startledDecision = decideNextAction(creature, profile, mockWorld, nearPlayer, 1000);
    expect(startledDecision.nextState).not.toBe('rest_sleep');
    expect(startledDecision.nextState).toBe('flee'); // Low level creature flees from level 10 player
  });

  it('weak creature flees when player is much stronger, strong creature warns', () => {
    const skittishProfile = getBehaviorProfile('skittish_bird');
    const bruteProfile = getBehaviorProfile('territorial_brute');

    // Weak level 3 Pidgey vs level 15 player
    const weakBird = createMockCreature({
      speciesKey: 'PIDGEY',
      level: 3,
      behavior: 'skittish_bird',
    });
    const strongPlayer: PlayerQuery = {
      position: () => ({ gx: 12, gy: 10 }), // 2 tiles away
      isRunning: () => false,
      inTallGrass: () => false,
      referenceLevel: () => 15,
    };

    const weakDecision = decideNextAction(weakBird, skittishProfile, mockWorld, strongPlayer, 1000);
    expect(weakDecision.nextState).toBe('flee');
    expect(weakDecision.triggerEmote).toBe('sweat');

    // Strong level 25 territorial brute vs level 15 player
    const strongBrute = createMockCreature({
      speciesKey: 'PIDGEOT',
      level: 25,
      behavior: 'territorial_brute',
    });
    const strongDecision = decideNextAction(
      strongBrute,
      bruteProfile,
      mockWorld,
      strongPlayer,
      1000
    );
    expect(['alert', 'territorial', 'chase']).toContain(strongDecision.nextState);
    expect(strongDecision.triggerEmote).toBe('!');
  });

  it('prevents wild entities from stepping into unwalkable terrain', () => {
    const sim = new WildlifeSimulator();
    const creature = createMockCreature({ gx: 10, gy: 10, state: 'wander' });
    sim.setEntities([creature]);

    const player: PlayerQuery = {
      position: () => ({ gx: 10, gy: 5 }),
      isRunning: () => false,
      inTallGrass: () => false,
      referenceLevel: () => 10,
    };

    // Run 30 simulation ticks
    for (let t = 0; t < 30; t++) {
      sim.update(16.6, mockWorld, player);
      // Ensure entity never stepped onto blocked tile (10, 11)
      expect(creature.gx === 10 && creature.gy === 11).toBe(false);
      expect(creature.targetGX === 10 && creature.targetGY === 11).toBe(false);
    }
  });

  it('moves creatures when forage is the selected utility state', () => {
    const sim = new WildlifeSimulator();
    const creature = createMockCreature({
      state: 'idle',
      idleTimer: 0,
      behavior: 'herd_grazer',
      speciesKey: 'BULBASAUR',
    });
    sim.setEntities([creature]);

    const player: PlayerQuery = {
      position: () => ({ gx: 20, gy: 20 }),
      isRunning: () => false,
      inTallGrass: () => false,
      referenceLevel: () => 10,
    };

    for (let tick = 0; tick < 45; tick++) {
      sim.update(16.6, mockWorld, player);
      if (creature.isMoving) break;
    }
    expect(['forage', 'wander', 'groom_play', 'curious']).toContain(creature.state);
    expect(creature.isMoving).toBe(true);
  });

  it('lets territorial species patrol when no player threat is perceived', () => {
    const sim = new WildlifeSimulator();
    const creature = createMockCreature({
      state: 'idle',
      idleTimer: 0,
      behavior: 'territorial_brute',
      speciesKey: 'CHARMANDER',
    });
    sim.setEntities([creature]);

    const distantPlayer: PlayerQuery = {
      position: () => ({ gx: 20, gy: 20 }),
      isRunning: () => false,
      inTallGrass: () => false,
      referenceLevel: () => 10,
    };

    for (let tick = 0; tick < 45; tick++) {
      sim.update(16.6, mockWorld, distantPlayer);
      if (creature.isMoving) break;
    }

    expect(['forage', 'wander', 'curious']).toContain(creature.state);
    expect(creature.isMoving).toBe(true);
  });

  it('avoids rapid state oscillation through inertia and hysteresis margin', () => {
    const profile = getBehaviorProfile('curious_rodent');
    const creature = createMockCreature({ state: 'forage', behavior: 'curious_rodent' });

    const distantPlayer: PlayerQuery = {
      position: () => ({ gx: 100, gy: 100 }),
      isRunning: () => false,
      inTallGrass: () => false,
      referenceLevel: () => 10,
    };

    // When elapsed time is small (e.g. 100ms), state should persist due to inertia
    const decisionShort = decideNextAction(creature, profile, mockWorld, distantPlayer, 100);
    expect(decisionShort.nextState).toBe('forage');
  });

  it('simulates 200 entities within acceptable performance budget', () => {
    const sim = new WildlifeSimulator({ frameBudgetMs: 5.0 });
    const entities: WildEntity[] = [];

    // Create 200 entities distributed across chunks
    for (let i = 0; i < 200; i++) {
      entities.push(
        createMockCreature({
          id: `entity_${i}`,
          gx: (i % 20) * 2,
          gy: Math.floor(i / 20) * 2,
          level: 5 + (i % 10),
          speciesKey: i % 2 === 0 ? 'PIDGEY' : 'RATTATA',
        })
      );
    }

    sim.setEntities(entities);

    const player: PlayerQuery = {
      position: () => ({ gx: 10, gy: 10 }),
      isRunning: () => false,
      inTallGrass: () => false,
      referenceLevel: () => 10,
    };

    const startPerf = performance.now();
    const result = sim.update(16.6, mockWorld, player);
    const duration = performance.now() - startPerf;

    // Simulation should complete quickly and respect LOD
    expect(result.simulatedCount).toBeGreaterThan(0);
    expect(duration).toBeLessThan(50); // <50ms in parallel test runner
  });
});
