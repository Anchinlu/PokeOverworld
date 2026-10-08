import { describe, it, expect } from 'vitest';
import {
  calculatePokemonStats,
  getNatureMultiplier,
  getNatureData,
  addEffortValues,
  createDefaultIvs,
  createDefaultEvs,
  ALL_NATURES,
} from '../src/domain/party/pokemon-stats';
import { createPartyPokemon, recalculatePartyPokemonStats } from '../src/domain/party/party-state';
import type { PokemonStats } from '@pokemon/shared-types';

describe('Pokemon Core Stats & 25 Natures Engine', () => {
  it('correctly registers all 25 canonical Natures with accurate stat modifiers', () => {
    expect(ALL_NATURES.length).toBe(25);

    // Neutral natures
    const neutralNatures = ['Hardy', 'Docile', 'Serious', 'Bashful', 'Quirky'] as const;
    for (const nat of neutralNatures) {
      const data = getNatureData(nat);
      expect(data.increasedStat).toBeNull();
      expect(data.decreasedStat).toBeNull();
      expect(getNatureMultiplier(nat, 'attack')).toBe(1.0);
      expect(getNatureMultiplier(nat, 'speed')).toBe(1.0);
    }

    // Adamant (+Atk, -SpAtk)
    const adamant = getNatureData('Adamant');
    expect(adamant.increasedStat).toBe('attack');
    expect(adamant.decreasedStat).toBe('spAtk');
    expect(getNatureMultiplier('Adamant', 'attack')).toBe(1.1);
    expect(getNatureMultiplier('Adamant', 'spAtk')).toBe(0.9);
    expect(getNatureMultiplier('Adamant', 'speed')).toBe(1.0);
    expect(getNatureMultiplier('Adamant', 'hp')).toBe(1.0);

    // Modest (+SpAtk, -Atk)
    expect(getNatureMultiplier('Modest', 'spAtk')).toBe(1.1);
    expect(getNatureMultiplier('Modest', 'attack')).toBe(0.9);

    // Jolly (+Speed, -SpAtk)
    expect(getNatureMultiplier('Jolly', 'speed')).toBe(1.1);
    expect(getNatureMultiplier('Jolly', 'spAtk')).toBe(0.9);

    // Timid (+Speed, -Atk)
    expect(getNatureMultiplier('Timid', 'speed')).toBe(1.1);
    expect(getNatureMultiplier('Timid', 'attack')).toBe(0.9);
  });

  it('calculates authentic Gen 7 stats at Level 100 matching canonical Pokemon formula', () => {
    // Base 100 in all stats (e.g. Mew or Celebi)
    const base100: PokemonStats = {
      hp: 100,
      attack: 100,
      defense: 100,
      spAtk: 100,
      spDef: 100,
      speed: 100,
      total: 600,
    };

    // 1. Level 100, IV 31, EV 0, Hardy (neutral)
    // HP: floor(((2*100 + 31 + 0)*100)/100) + 100 + 10 = 231 + 110 = 341
    // Other: floor((floor(((2*100 + 31 + 0)*100)/100) + 5) * 1.0) = 231 + 5 = 236
    const statsNeutral = calculatePokemonStats(
      base100,
      100,
      createDefaultIvs(31),
      createDefaultEvs(),
      'Hardy'
    );
    expect(statsNeutral.hp).toBe(341);
    expect(statsNeutral.attack).toBe(236);
    expect(statsNeutral.defense).toBe(236);
    expect(statsNeutral.spAtk).toBe(236);
    expect(statsNeutral.speed).toBe(236);

    // 2. Level 100, IV 31, EV 252 (max), Adamant (+Atk, -SpAtk)
    // EV / 4 = 63.
    // Atk Raw: 200 + 31 + 63 + 5 = 299. Adamant: floor(299 * 1.1) = 328
    // SpAtk Raw: 299. Adamant: floor(299 * 0.9) = 269
    const maxEvs = {
      hp: 0,
      attack: 252,
      defense: 0,
      spAtk: 252,
      spDef: 0,
      speed: 0,
    };
    const statsAdamant = calculatePokemonStats(
      base100,
      100,
      createDefaultIvs(31),
      maxEvs,
      'Adamant'
    );
    expect(statsAdamant.attack).toBe(328);
    expect(statsAdamant.spAtk).toBe(269);
  });

  it('enforces EV cap of 252 per stat and 510 total', () => {
    const evs = createDefaultEvs();

    // Add 200 EV to attack
    const added1 = addEffortValues(evs, 'attack', 200);
    expect(added1).toBe(200);
    expect(evs.attack).toBe(200);

    // Try adding 100 EV (should cap at 252, adding only 52)
    const added2 = addEffortValues(evs, 'attack', 100);
    expect(added2).toBe(52);
    expect(evs.attack).toBe(252);

    // Try adding more to attack (already capped)
    expect(addEffortValues(evs, 'attack', 10)).toBe(0);

    // Add 252 to speed (252 + 252 = 504 total)
    expect(addEffortValues(evs, 'speed', 252)).toBe(252);

    // Total is now 504. Remaining total capacity is 510 - 504 = 6 EV!
    const addedHp = addEffortValues(evs, 'hp', 20);
    expect(addedHp).toBe(6);
    expect(evs.hp).toBe(6);

    // Total is now exactly 510, cannot add any more to any stat
    expect(addEffortValues(evs, 'defense', 10)).toBe(0);
  });

  it('recalculates party Pokemon stats seamlessly upon leveling up', () => {
    const pk = createPartyPokemon('PIKACHU', 5, {
      ivs: createDefaultIvs(31),
      nature: 'Jolly',
    });
    expect(pk.nature).toBe('Jolly');
    expect(pk.level).toBe(5);

    const oldAtk = pk.stats.attack;
    const oldSpd = pk.stats.speed;

    // Level up to 10
    const res = recalculatePartyPokemonStats(pk, 10);
    expect(pk.level).toBe(10);
    expect(res.newStats.attack).toBeGreaterThan(oldAtk);
    expect(res.newStats.speed).toBeGreaterThan(oldSpd);
    expect(res.hpGained).toBeGreaterThan(0);
    expect(pk.currentHp).toBe(pk.maxHp);
  });

  it('generates random IVs (0–31) and diverse Natures by default for caught Pokémon', () => {
    // Generate 10 Pokémon and check that IVs are not all 31 and natures vary
    const pokemons = Array.from({ length: 10 }, () => createPartyPokemon('PIDGEY', 5));
    const allIvValues: number[] = [];
    const naturesSet = new Set<string>();

    for (const p of pokemons) {
      expect(p.ivs).toBeDefined();
      expect(p.nature).toBeDefined();
      expect(ALL_NATURES).toContain(p.nature);

      for (const stat of ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'] as const) {
        expect(p.ivs[stat]).toBeGreaterThanOrEqual(0);
        expect(p.ivs[stat]).toBeLessThanOrEqual(31);
        allIvValues.push(p.ivs[stat]);
      }
      naturesSet.add(p.nature);
    }

    // Crucial check: NOT all IVs should be 31! There must be variance across 60 rolled stats
    const not31Count = allIvValues.filter((v) => v !== 31).length;
    expect(not31Count).toBeGreaterThan(0);

    // There should also be diversity in natures (more than just 1 Hardy nature)
    expect(naturesSet.size).toBeGreaterThan(1);

    // Verify perfect IV option still works when explicitly requested
    const perfectPk = createPartyPokemon('CHARIZARD', 50, { ivs: 'perfect' });
    expect(perfectPk.ivs).toEqual({
      hp: 31,
      attack: 31,
      defense: 31,
      spAtk: 31,
      spDef: 31,
      speed: 31,
    });
  });
});
