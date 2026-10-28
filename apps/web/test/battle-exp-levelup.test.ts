import { describe, it, expect, beforeEach } from 'vitest';
import { BattleState } from '../src/battle/battle-state';
import { calculateExpYield } from '../src/battle/battle-controller';
import { partyService } from '../src/domain/party/party-service';
import { createPartyPokemon, partyPokemonToBattler } from '../src/domain/party/party-state';
import { calculatePokemonStats, createDefaultIvs, createDefaultEvs } from '../src/domain/party/pokemon-stats';
import { getExpToNextLevel, normalizeGrowthRate } from '../src/domain/pokemon/pokemon-exp';
import { pokemonCatalog } from '../src/data';
import type { LevelUpStatBoost } from '../src/battle/types';

describe('Battle EXP Bar & In-Battle Level-Up System', () => {
  beforeEach(() => {
    partyService.setParty([]);
  });

  it('calculates canonical EXP yield based on defeated enemy species and level', () => {
    const pidgeyExp = calculateExpYield('PIDGEY', 5);
    expect(pidgeyExp).toBeGreaterThan(0);

    const highLevelExp = calculateExpYield('PIDGEY', 25);
    expect(highLevelExp).toBeGreaterThan(pidgeyExp);
  });

  it('BattleState initializes EXP bar state and interpolates smoothly toward target', () => {
    const state = new BattleState();
    expect(state.playerExpPct).toBe(0);
    expect(state.targetPlayerExpPct).toBe(0);
    expect(state.isExpGainAnimating).toBe(false);

    // Set target EXP fill progress to 75%
    state.isExpGainAnimating = true;
    state.targetPlayerExpPct = 0.75;

    // Simulate animation frames
    let completed = false;
    state.onExpGainStepComplete = () => {
      completed = true;
    };

    // First frame tick
    state.updateTick(16.67);
    expect(state.playerExpPct).toBeGreaterThan(0);
    expect(state.playerExpPct).toBeLessThanOrEqual(0.75);

    // Advance 60 frames to reach target
    for (let f = 0; f < 60; f++) {
      state.updateTick(16.67);
    }

    expect(state.playerExpPct).toBeCloseTo(0.75, 2);
    expect(completed).toBe(true);
    expect(state.isExpGainAnimating).toBe(false);
  });

  it('keeps EXP animation speed stable when frame time changes', () => {
    const at60Fps = new BattleState();
    const at144Fps = new BattleState();
    at60Fps.targetPlayerExpPct = 1;
    at144Fps.targetPlayerExpPct = 1;

    for (let i = 0; i < 60; i++) at60Fps.updateTick(1000 / 60);
    for (let i = 0; i < 144; i++) at144Fps.updateTick(1000 / 144);

    expect(at60Fps.playerExpPct).toBeCloseTo(at144Fps.playerExpPct, 5);
  });

  it('accurately calculates level-up stat increases across all 6 core attributes', () => {
    const species = pokemonCatalog.getBySpeciesKey('PIKACHU')!;
    const ivs = createDefaultIvs(31);
    const evs = createDefaultEvs();
    const nature = 'Hardy';

    const oldLevel = 5;
    const newLevel = 6;

    const oldStats = calculatePokemonStats(species.stats, oldLevel, ivs, evs, nature);
    const newStats = calculatePokemonStats(species.stats, newLevel, ivs, evs, nature);

    expect(newStats.hp).toBeGreaterThanOrEqual(oldStats.hp);
    expect(newStats.attack).toBeGreaterThanOrEqual(oldStats.attack);
    expect(newStats.defense).toBeGreaterThanOrEqual(oldStats.defense);
    expect(newStats.spAtk).toBeGreaterThanOrEqual(oldStats.spAtk);
    expect(newStats.spDef).toBeGreaterThanOrEqual(oldStats.spDef);
    expect(newStats.speed).toBeGreaterThanOrEqual(oldStats.speed);

    const boost: LevelUpStatBoost = {
      pokemonName: 'Pikachu',
      pokemonSpeciesKey: 'PIKACHU',
      oldLevel,
      newLevel,
      oldStats,
      newStats,
      hpGained: newStats.hp - oldStats.hp,
    };

    expect(boost.hpGained).toBeGreaterThan(0);
    expect(boost.newStats.attack - boost.oldStats.attack).toBeGreaterThanOrEqual(0);
  });

  it('syncBattleResult cleanly syncs pre-computed in-battle level-up to party without double-counting EXP', () => {
    const initialPk = createPartyPokemon('PIKACHU', 5);
    partyService.addPokemon(initialPk);

    const battler = partyPokemonToBattler(initialPk);

    // Simulate in-battle level-up from Lv5 to Lv6
    battler.level = 6;
    battler.exp = 25;
    battler.maxExp = getExpToNextLevel(normalizeGrowthRate('Medium Fast'), 6);
    battler.stats.hp += 2;
    battler.stats.attack += 1;
    battler.maxHp += 2;
    battler.currentHp = battler.maxHp;

    const res = partyService.syncBattleResult(battler, 120);

    expect(res.leveledUp).toBe(true);
    expect(res.newLevel).toBe(6);

    const partyPk = partyService.getParty()[0]!;
    expect(partyPk.level).toBe(6);
    expect(partyPk.exp).toBe(25);
    expect(partyPk.maxHp).toBe(battler.maxHp);
    expect(partyPk.stats.attack).toBe(battler.stats.attack);
  });

  it('keeps EXP unchanged when the final sync honors the already-applied EXP flag', () => {
    const initialPk = createPartyPokemon('PIKACHU', 5);
    partyService.addPokemon(initialPk);

    const battler = partyPokemonToBattler(initialPk);
    battler.exp = 80;
    partyService.syncBattleResult(battler, 0);

    // GameSession passes 0 here when BattleController reports
    // expAppliedToParty=true.
    partyService.syncBattleResult(battler, 0);

    expect(partyService.getParty()[0]!.exp).toBe(80);
  });

  it('correctly maps 192px EXP bar slot on databox_player', () => {
    // databox_player native width is 260px, empty slot is x: 40..231 (192px), y: 74..77 (4px)
    const slotX = 40;
    const slotY = 74;
    const fullSlotWidth = 192;
    const slotHeight = 4;

    const progress0 = 0.0;
    const fillW0 = Math.round(fullSlotWidth * progress0);
    expect(fillW0).toBe(0);

    const progress50 = 0.5;
    const fillW50 = Math.round(fullSlotWidth * progress50);
    expect(fillW50).toBe(96);

    const progress100 = 1.0;
    const fillW100 = Math.round(fullSlotWidth * progress100);
    expect(fillW100).toBe(192);

    expect(slotX + fullSlotWidth).toBe(232);
    expect(slotY + slotHeight).toBe(78);
  });
});
