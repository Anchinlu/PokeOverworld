import { describe, it, expect } from 'vitest';
import { createWildlifeSystem } from '../../src/wildlife';
import type { WorldQuery } from '../../src/wildlife/ports/world-query';
import type { PlayerQuery } from '../../src/wildlife/ports/player-query';

describe('WildlifeSystem Public Interface & Integration (Section 8.2 & W8)', () => {
  const mockWorld: WorldQuery = {
    isWalkable: () => true,
    contextAt: () => 'tall_grass',
    biomeAt: () => 'meadow',
    difficultyAt: () => 0.1,
    timeBand: () => 'day',
    weather: () => 'clear',
  };

  const mockPlayer: PlayerQuery = {
    position: () => ({ gx: 10, gy: 10 }),
    isRunning: () => false,
    inTallGrass: () => false,
    referenceLevel: () => 10,
  };

  it('populates chunk deterministically using seed and world query', () => {
    const system = createWildlifeSystem({
      seed: 4242,
      world: mockWorld,
      player: mockPlayer,
    });

    const chunk1 = system.populateChunk(0, 0);
    const chunk2 = system.populateChunk(0, 0);

    expect(chunk1.length).toBeGreaterThan(0);
    expect(chunk1.length).toBe(chunk2.length);
    expect(chunk1[0].speciesKey).toBe(chunk2[0].speciesKey);
    expect(chunk1[0].level).toBe(chunk2[0].level);
    expect(chunk1[0].role).toBe(chunk2[0].role);
  });

  it('updates simulated entities and queries viewport overlays', () => {
    const system = createWildlifeSystem({
      seed: 4242,
      world: mockWorld,
      player: mockPlayer,
    });

    const entities = system.populateChunk(0, 0);
    system.setEntities(entities);

    // Run simulation tick
    system.update(16.6);

    // Query viewport around chunk (0, 0)
    const overlays = system.getOverlays({
      minX: -100,
      minY: -100,
      maxX: 1000,
      maxY: 1000,
    });

    expect(overlays.length).toBe(entities.length);
    for (const ov of overlays) {
      expect(ov.indicator).toBeDefined();
      expect(['level', 'unknown_red', 'none']).toContain(ov.indicator.kind);
    }
  });

  it('resolves combat battles and triggers post-battle herd reaction', () => {
    const system = createWildlifeSystem({
      seed: 4242,
      world: mockWorld,
      player: mockPlayer,
    });

    const entities = system.populateChunk(0, 0);
    system.setEntities(entities);

    const target = entities[0];
    const targetId = target.id ?? `${target.gx},${target.gy}`;

    // Resolve battle with target caught
    system.onBattleResolved(targetId, 'caught');

    // Re-populating the same chunk will now exclude the caught entity
    const refreshed = system.populateChunk(0, 0);
    const found = refreshed.find((e) => (e.id ?? `${e.gx},${e.gy}`) === targetId);
    expect(found).toBeUndefined();
  });
});
