import { describe, it, expect } from 'vitest';
import { composeHerd, shouldSpawnApex } from '../../src/wildlife/spawn/herd-composer';
import { speciesSpawnData } from '../../src/wildlife/data/data-loader';

describe('Wildlife Herd Roles, Leaders & Apex Predators (Section 4 & 11.3)', () => {
  const pidgeyDef = speciesSpawnData['PIDGEY'];

  it('guarantees every multi-entity herd has exactly one leader', () => {
    for (let i = 0; i < 20; i++) {
      const herd = composeHerd({
        speciesKey: 'PIDGEY',
        speciesDef: pidgeyDef,
        baseLevel: 10,
        difficulty: 0.2, // Below apex threshold
        distance: 150,
        sizeRoll01: 0.5,
        apexRoll01: 0.99, // No apex
        levelRolls: [0.5, 0.2, 0.4, 0.6, 0.8],
      });

      expect(herd.individuals.length).toBeGreaterThanOrEqual(2);
      const leaders = herd.individuals.filter((ind) => ind.role === 'leader');
      expect(leaders).toHaveLength(1);

      const leader = leaders[0];
      const members = herd.individuals.filter((ind) => ind.role === 'member');
      for (const m of members) {
        expect(leader.level).toBeGreaterThanOrEqual(m.level);
        // Leader bonus is +3..+8
        expect(leader.level - m.level).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('apex predator level requirements: base + 10..20 and minimum stage level', () => {
    const herd = composeHerd({
      speciesKey: 'PIDGEY',
      speciesDef: pidgeyDef,
      baseLevel: 20,
      difficulty: 0.8, // High difficulty
      distance: 300,
      sizeRoll01: 0.5,
      apexRoll01: 0.001, // Force apex roll
      levelRolls: [0.5, 0.2, 0.4, 0.6],
    });

    const apexList = herd.individuals.filter((ind) => ind.role === 'apex');
    expect(apexList).toHaveLength(1);

    const apex = apexList[0];
    // Pidgeot is stage 3, minimum valid level is 36
    expect(apex.level).toBeGreaterThanOrEqual(36);
    expect(apex.speciesKey).toBe('PIDGEOT');
    expect(apex.level).toBeGreaterThanOrEqual(20 + 10); // baseLevel (20) + 10
  });

  it('strictly forbids apex predators from spawning in the starter zone', () => {
    // Within distance <= 100
    const inStarterZone = shouldSpawnApex({
      speciesDef: pidgeyDef,
      difficulty: 0.9,
      isStartZone: true,
      apexRoll01: 0.0001,
    });
    expect(inStarterZone).toBe(false);

    const starterHerd = composeHerd({
      speciesKey: 'PIDGEY',
      speciesDef: pidgeyDef,
      baseLevel: 3,
      difficulty: 0.9,
      distance: 50, // Starter zone
      sizeRoll01: 0.5,
      apexRoll01: 0.0001,
      levelRolls: [0.5, 0.2, 0.4],
    });

    const apexInStart = starterHerd.individuals.filter((ind) => ind.role === 'apex');
    expect(apexInStart).toHaveLength(0);

    // Level cap in starter zone must not exceed 5
    for (const ind of starterHerd.individuals) {
      expect(ind.level).toBeLessThanOrEqual(5);
    }
  });

  it('guarantees at most one apex per herd', () => {
    const herd = composeHerd({
      speciesKey: 'PIDGEY',
      speciesDef: pidgeyDef,
      baseLevel: 30,
      difficulty: 0.95,
      distance: 400,
      sizeRoll01: 0.99, // Max flock size (8)
      apexRoll01: 0.001,
      levelRolls: [0.5, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
    });

    const apexCount = herd.individuals.filter((ind) => ind.role === 'apex').length;
    expect(apexCount).toBeLessThanOrEqual(1);
  });
});
