import { describe, it, expect } from 'vitest';
import { BattleEngine } from '../src/battle/battle-engine';
import {
  applyEntryHazards,
  canSwitchOut,
  clearSideHazards,
  getSideHazards,
  releaseTrapsFromSide,
  BINDING_MOVE_IDS,
  TRAPPING_ATTACK_MOVE_IDS,
  TRAPPING_STATUS_MOVE_IDS,
  HAZARD_CLEARING_MOVE_IDS,
} from '../src/battle/rules/hazard-engine';
import { processEndTurnEffects } from '../src/battle/rules/status-engine';
import { FixedSequenceRng } from '../src/battle/battle-rng';
import type {
  BattlerPokemon,
  BattleMove,
  BattleEnvironment,
  StatStages,
  BattleEvent,
} from '../src/battle/types';

interface MockBattlerPokemon extends BattlerPokemon {
  statStages: StatStages;
}

function createMockBattler(overrides: Partial<MockBattlerPokemon> = {}): MockBattlerPokemon {
  return {
    id: 1,
    name: 'Bulbasaur',
    speciesKey: 'BULBASAUR',
    level: 50,
    types: ['Grass', 'Poison'],
    stats: {
      hp: 100,
      attack: 100,
      defense: 100,
      spAtk: 100,
      spDef: 100,
      speed: 100,
      total: 600,
    },
    currentHp: 100,
    maxHp: 100,
    moves: [],
    frontSprite: '',
    backSprite: '',
    iconSprite: '',
    gender: 'male',
    isFainted: false,
    catchRate: 45,
    exp: 100,
    maxExp: 200,
    status: 'none',
    statStages: {
      attack: 0,
      defense: 0,
      spAtk: 0,
      spDef: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    },
    ...overrides,
  };
}

function createMockEnvironment(overrides: Partial<BattleEnvironment> = {}): BattleEnvironment {
  return {
    background: 'field',
    enemyBase: 'grass',
    playerBase: 'grass',
    weather: { type: 'none', turnsLeft: 0 },
    terrain: { type: 'none', turnsLeft: 0 },
    ...overrides,
  };
}

describe('Field Hazards & Entry Hazards System', () => {
  it('correctly sets Stealth Rock and damages incoming Pokémon based on Rock typing', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Tyranitar', types: ['Rock', 'Dark'] });
    const defender = createMockBattler({ name: 'Charizard', types: ['Fire', 'Flying'], maxHp: 100, currentHp: 100 });
    const engine = new BattleEngine(attacker, defender, env);

    const srMove: BattleMove = {
      id: 'stealth_rock',
      name: 'Stealth Rock',
      type: 'Rock',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      description: 'Sets Stealth Rock',
    };

    const res = engine.executeAttack(attacker, defender, srMove);
    expect(res.message).toContain('Những viên đá nhọn tàng hình đã trôi nổi');
    expect(env.enemyHazards?.stealthRock).toBe(true);

    // Re-use says already set
    const res2 = engine.executeAttack(attacker, defender, srMove);
    expect(res2.message).toContain('Nhưng Đá Tàng Hình đã bao quanh phe đối thủ rồi!');

    // Charizard is Fire/Flying -> 4x weak to Rock -> 50% damage
    const events: BattleEvent[] = [];
    const msgs = applyEntryHazards(defender, 'enemy', env, events);
    expect(defender.currentHp).toBe(50); // 100 - 50
    expect(msgs[0]).toContain('(-50 HP)');

    // Steelix is Steel/Ground -> 0.25x weak to Rock -> 100 * 0.125 * 0.25 = 3.125 -> 3 damage
    const steelix = createMockBattler({ name: 'Steelix', types: ['Steel', 'Ground'], maxHp: 100, currentHp: 100 });
    const events2: BattleEvent[] = [];
    applyEntryHazards(steelix, 'enemy', env, events2);
    expect(steelix.currentHp).toBe(97); // 100 - 3
  });

  it('correctly sets Spikes up to 3 layers and applies damage only to grounded targets', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler();
    const defender = createMockBattler();
    const engine = new BattleEngine(attacker, defender, env);

    const spikesMove: BattleMove = {
      id: 'spikes',
      name: 'Spikes',
      type: 'Ground',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      description: 'Sets Spikes',
    };

    // Layer 1
    engine.executeAttack(attacker, defender, spikesMove);
    expect(env.enemyHazards?.spikes).toBe(1);

    // Layer 2
    engine.executeAttack(attacker, defender, spikesMove);
    expect(env.enemyHazards?.spikes).toBe(2);

    // Layer 3
    engine.executeAttack(attacker, defender, spikesMove);
    expect(env.enemyHazards?.spikes).toBe(3);

    // Layer 4 fails
    const res4 = engine.executeAttack(attacker, defender, spikesMove);
    expect(res4.message).toContain('Gai nhọn không thể rải thêm được nữa!');
    expect(env.enemyHazards?.spikes).toBe(3);

    // Grounded Pokémon takes 25% at 3 layers (100 * 1/4 = 25)
    const groundedTarget = createMockBattler({ types: ['Normal'], maxHp: 100, currentHp: 100 });
    applyEntryHazards(groundedTarget, 'enemy', env, []);
    expect(groundedTarget.currentHp).toBe(75);

    // Flying Pokémon is immune to Spikes
    const flyingTarget = createMockBattler({ types: ['Flying'], maxHp: 100, currentHp: 100 });
    applyEntryHazards(flyingTarget, 'enemy', env, []);
    expect(flyingTarget.currentHp).toBe(100);
  });

  it('Toxic Spikes inflicts poison (1 layer) or toxic (2 layers), and grounded Poison absorbs them', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler();
    const defender = createMockBattler();
    const engine = new BattleEngine(attacker, defender, env);

    const tspikesMove: BattleMove = {
      id: 'toxic_spikes',
      name: 'Toxic Spikes',
      type: 'Poison',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      description: 'Sets Toxic Spikes',
    };

    // Layer 1
    engine.executeAttack(attacker, defender, tspikesMove);
    expect(env.enemyHazards?.toxicSpikes).toBe(1);

    // Grounded Normal takes regular poison
    const normalPk = createMockBattler({ types: ['Normal'], status: 'none' });
    applyEntryHazards(normalPk, 'enemy', env, []);
    expect(normalPk.status).toBe('poison');

    // Layer 2
    engine.executeAttack(attacker, defender, tspikesMove);
    expect(env.enemyHazards?.toxicSpikes).toBe(2);

    // Grounded Normal takes toxic
    const normalPk2 = createMockBattler({ types: ['Normal'], status: 'none' });
    applyEntryHazards(normalPk2, 'enemy', env, []);
    expect(normalPk2.status).toBe('toxic');

    // Steel type is immune to Toxic Spikes
    const steelPk = createMockBattler({ types: ['Steel'], status: 'none' });
    applyEntryHazards(steelPk, 'enemy', env, []);
    expect(steelPk.status).toBe('none');

    // Grounded Poison absorbs Toxic Spikes
    const poisonPk = createMockBattler({ types: ['Poison'], status: 'none' });
    const msgs = applyEntryHazards(poisonPk, 'enemy', env, []);
    expect(msgs[0]).toContain('đã hút sạch gai độc');
    expect(env.enemyHazards?.toxicSpikes).toBe(0);
  });

  it('Sticky Web lowers speed by 1 stage on grounded targets and respects Clear Body', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler();
    const defender = createMockBattler();
    const engine = new BattleEngine(attacker, defender, env);

    const webMove: BattleMove = {
      id: 'sticky_web',
      name: 'Sticky Web',
      type: 'Bug',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      description: 'Sets Sticky Web',
    };

    engine.executeAttack(attacker, defender, webMove);
    expect(env.enemyHazards?.stickyWeb).toBe(true);

    // Grounded target loses 1 speed stage
    const normalPk = createMockBattler({ types: ['Normal'] });
    applyEntryHazards(normalPk, 'enemy', env, []);
    expect(normalPk.statStages.speed).toBe(-1);

    // Flying target ignores Sticky Web
    const flyingPk = createMockBattler({ types: ['Flying'] });
    applyEntryHazards(flyingPk, 'enemy', env, []);
    expect(flyingPk.statStages.speed).toBe(0);

    // Clear Body protects against Sticky Web speed drop
    const clearBodyPk = createMockBattler({ types: ['Normal'], ability: 'Clear Body' });
    const msgs = applyEntryHazards(clearBodyPk, 'enemy', env, []);
    expect(msgs[0]).toContain('ngăn cản giảm Tốc độ');
    expect(clearBodyPk.statStages.speed).toBe(0);
  });

  it('Heavy-Duty Boots completely protects from all entry hazards', () => {
    const env = createMockEnvironment({
      enemyHazards: {
        stealthRock: true,
        spikes: 3,
        toxicSpikes: 2,
        stickyWeb: true,
      },
    });

    const bootsPk = createMockBattler({
      types: ['Fire', 'Flying'],
      heldItem: 'heavy_duty_boots',
      currentHp: 100,
      maxHp: 100,
      status: 'none',
    });

    const msgs = applyEntryHazards(bootsPk, 'enemy', env, []);
    expect(msgs[0]).toContain('[Giày Chống Gai]');
    expect(bootsPk.currentHp).toBe(100);
    expect(bootsPk.status).toBe('none');
    expect(bootsPk.statStages.speed).toBe(0);
  });

  it('Stone Axe deals damage AND sets Stealth Rock on opponent side', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Kleavor', types: ['Bug', 'Rock'] });
    const defender = createMockBattler({ name: 'Pikachu', currentHp: 100, maxHp: 100 });
    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.9, 0.9]));

    const stoneAxeMove: BattleMove = {
      id: 'stone_axe',
      name: 'Stone Axe',
      type: 'Rock',
      category: 'physical',
      power: 65,
      accuracy: 90,
      pp: 15,
      maxPp: 15,
      description: 'Sets Stealth Rock',
    };

    const res = engine.executeAttack(attacker, defender, stoneAxeMove);
    expect(res.damage).toBeGreaterThan(0);
    expect(res.message).toContain('Những viên đá tàng hình trôi nổi bao vây phe của Pikachu!');
    expect(env.enemyHazards?.stealthRock).toBe(true);
  });

  it('Ceaseless Edge deals damage AND sets Spikes on opponent side', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Samurott', types: ['Water', 'Dark'] });
    const defender = createMockBattler({ name: 'Pikachu', currentHp: 100, maxHp: 100 });
    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.9, 0.9]));

    const ceaselessMove: BattleMove = {
      id: 'ceaseless_edge',
      name: 'Ceaseless Edge',
      type: 'Dark',
      category: 'physical',
      power: 65,
      accuracy: 90,
      pp: 15,
      maxPp: 15,
      description: 'Sets Spikes',
    };

    const res = engine.executeAttack(attacker, defender, ceaselessMove);
    expect(res.damage).toBeGreaterThan(0);
    expect(res.message).toContain('Gai nhọn đã được rải quanh phe của Pikachu! (1/3 lớp)');
    expect(env.enemyHazards?.spikes).toBe(1);
  });
});

describe('Switch-Lock & Trapping Moves', () => {
  it('Mean Look and Block trap target unless target is Ghost-type', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Gengar', types: ['Ghost', 'Poison'] });
    const defender = createMockBattler({ name: 'Snorlax', types: ['Normal'] });
    const ghostDefender = createMockBattler({ name: 'Dusclops', types: ['Ghost'] });
    const engine = new BattleEngine(attacker, defender, env);

    const meanLookMove: BattleMove = {
      id: 'mean_look',
      name: 'Mean Look',
      type: 'Normal',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 5,
      maxPp: 5,
      description: 'Traps opponent',
    };

    // Traps normal defender
    const res = engine.executeAttack(attacker, defender, meanLookMove);
    expect(defender.isTrapped).toBe(true);
    expect(defender.trappedBy).toBe('player');
    expect(res.message).toContain('không thể chạy trốn hoặc đổi Pokémon!');

    // cannot switch out
    const switchCheck = canSwitchOut(defender);
    expect(switchCheck.canSwitch).toBe(false);
    expect(switchCheck.reason).toContain('đã bị khóa chặt');

    // Ghost type is immune to Mean Look
    const resGhost = engine.executeAttack(attacker, ghostDefender, meanLookMove);
    expect(ghostDefender.isTrapped).toBeFalsy();
    expect(resGhost.message).toContain('là hệ Ma nên không thể bị chặn đường');
    expect(canSwitchOut(ghostDefender).canSwitch).toBe(true);
  });

  it('Spirit Shackle deals damage and locks opponent out of switching', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Decidueye', types: ['Grass', 'Ghost'] });
    const defender = createMockBattler({ name: 'Pikachu', types: ['Electric'], currentHp: 100, maxHp: 100 });
    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.9, 0.9]));

    const shackleMove: BattleMove = {
      id: 'spirit_shackle',
      name: 'Spirit Shackle',
      type: 'Ghost',
      category: 'physical',
      power: 80,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      description: 'Prevents switching',
    };

    const res = engine.executeAttack(attacker, defender, shackleMove);
    expect(res.damage).toBeGreaterThan(0);
    expect(defender.isTrapped).toBe(true);
    expect(defender.trappedBy).toBe('player');
    expect(res.message).toContain('đã bị khóa chặt, không thể đổi Pokémon!');
    expect(engine.canSwitchPokemon(defender).canSwitch).toBe(false);
  });

  it('Binding moves (Fire Spin, Whirlpool, Bind, Wrap) trap target and deal 1/8 HP end-turn damage', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Charizard', types: ['Fire', 'Flying'] });
    const defender = createMockBattler({ name: 'Blastoise', types: ['Water'], maxHp: 80, currentHp: 80 });
    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.1, 0.1]));

    const fireSpinMove: BattleMove = {
      id: 'fire_spin',
      name: 'Fire Spin',
      type: 'Fire',
      category: 'special',
      power: 35,
      accuracy: 85,
      pp: 15,
      maxPp: 15,
      description: 'Traps opponent 4-5 turns',
    };

    const res = engine.executeAttack(attacker, defender, fireSpinMove);
    expect(res.damage).toBeGreaterThan(0);
    expect(defender.boundStatus).toBeDefined();
    expect(defender.boundStatus?.moveId).toBe('fire_spin');
    expect(defender.boundStatus?.turnsLeft).toBeGreaterThanOrEqual(4);

    // Cannot switch while bound
    expect(canSwitchOut(defender).canSwitch).toBe(false);

    // End of turn deals 1/8 max HP damage (80 / 8 = 10 dmg)
    const prevHp = defender.currentHp;
    const initialTurns = defender.boundStatus!.turnsLeft;
    const endTurnRes = processEndTurnEffects(defender, 'enemy', attacker, 'player', env);
    expect(defender.currentHp).toBe(prevHp - 10);
    expect(endTurnRes?.message).toContain('bị tổn thương bởi Fire Spin!');
    expect(defender.boundStatus!.turnsLeft).toBe(initialTurns - 1);
  });

  it('Trapper fainting or switching releases the opponent from trap and binding', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Gengar' });
    const defender = createMockBattler({ name: 'Pikachu', isTrapped: true, trappedBy: 'player' });
    defender.boundStatus = {
      moveId: 'fire_spin',
      moveName: 'Fire Spin',
      sourceSide: 'player',
      turnsLeft: 3,
    };

    const engine = new BattleEngine(attacker, defender, env);

    // Switch player out -> releases defender
    const newAttacker = createMockBattler({ name: 'Snorlax' });
    engine.switchPlayerPokemon(newAttacker);

    expect(defender.isTrapped).toBe(false);
    expect(defender.trappedBy).toBeUndefined();
    expect(defender.boundStatus).toBeUndefined();
    expect(engine.canSwitchPokemon(defender).canSwitch).toBe(true);
  });

  it('Rapid Spin / Mortal Spin clears hazards on user side and frees user from binding', () => {
    const env = createMockEnvironment({
      playerHazards: {
        stealthRock: true,
        spikes: 2,
        stickyWeb: true,
      },
    });

    const player = createMockBattler({ name: 'Blastoise', isSeeded: true });
    player.boundStatus = {
      moveId: 'wrap',
      moveName: 'Wrap',
      sourceSide: 'enemy',
      turnsLeft: 3,
    };
    const enemy = createMockBattler({ name: 'Pikachu' });
    const engine = new BattleEngine(player, enemy, env, new FixedSequenceRng([0.9, 0.9]));

    const rapidSpinMove: BattleMove = {
      id: 'rapid_spin',
      name: 'Rapid Spin',
      type: 'Normal',
      category: 'physical',
      power: 50,
      accuracy: 100,
      pp: 40,
      maxPp: 40,
      description: 'Blows away hazards and binding',
    };

    const res = engine.executeAttack(player, enemy, rapidSpinMove);
    expect(res.damage).toBeGreaterThan(0);
    expect(res.message).toContain('đã thổi bay toàn bộ bẫy và trói buộc');
    expect(env.playerHazards?.stealthRock).toBe(false);
    expect(env.playerHazards?.spikes).toBe(0);
    expect(env.playerHazards?.stickyWeb).toBe(false);
    expect(player.boundStatus).toBeUndefined();
    expect(player.isSeeded).toBe(false);
  });
});
