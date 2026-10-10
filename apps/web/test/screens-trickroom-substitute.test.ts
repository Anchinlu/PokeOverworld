import { describe, it, expect } from 'vitest';
import { BattleEngine } from '../src/battle/battle-engine';
import { determineTurnOrder } from '../src/battle/rules/turn-order';
import { calculateDamage } from '../src/battle/rules/damage-calculator';
import { applyEntryHazards, canSwitchOut } from '../src/battle/rules/hazard-engine';
import { FixedSequenceRng } from '../src/battle/battle-rng';
import type {
  BattlerPokemon,
  BattleMove,
  BattleEnvironment,
  StatStages,
} from '../src/battle/types';

interface MockBattlerPokemon extends BattlerPokemon {
  statStages: StatStages;
}

function createMockBattler(partial: Partial<BattlerPokemon> = {}): MockBattlerPokemon {
  return {
    id: 1,
    name: 'Pikachu',
    speciesKey: 'PIKACHU',
    level: 50,
    types: ['Electric'],
    stats: {
      hp: 100,
      attack: 100,
      defense: 100,
      spAtk: 100,
      spDef: 100,
      speed: 100,
      total: 600,
    },
    statStages: {
      attack: 0,
      defense: 0,
      spAtk: 0,
      spDef: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    },
    currentHp: 100,
    maxHp: 100,
    moves: [],
    frontSprite: '',
    backSprite: '',
    iconSprite: '',
    gender: 'genderless',
    catchRate: 255,
    exp: 0,
    maxExp: 1000,
    status: 'none',
    statusTurns: 0,
    sleepTurns: 0,
    toxicTurns: 0,
    confusionTurns: 0,
    isFainted: false,
    ...partial,
  };
}

describe('Item normalization in hazard engine', () => {
  it('Heavy-Duty Boots (heavy-duty-boots) grants complete hazard immunity', () => {
    const pokemon = createMockBattler({
      types: ['Fire', 'Flying'],
      heldItem: 'heavy-duty-boots',
      currentHp: 100,
      maxHp: 100,
    });
    const env: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
      playerHazards: { stealthRock: true, spikes: 3, toxicSpikes: 2, stickyWeb: true },
    };
    const msgs = applyEntryHazards(pokemon, 'player', env, []);

    expect(msgs.length).toBe(1);
    expect(msgs[0]).toContain('Giày Chống Gai');
    expect(pokemon.currentHp).toBe(100);
    expect(pokemon.status).toBe('none');
  });

  it('Shed Shell (shed-shell) allows trapped Pokémon to switch out', () => {
    const pokemon = createMockBattler({
      isTrapped: true,
      heldItem: 'shed-shell',
    });
    const result = canSwitchOut(pokemon);
    expect(result.canSwitch).toBe(true);
  });
});

describe('Mortal Spin Mechanics', () => {
  it('clears hazards and inflicts poison on opponent', () => {
    const attacker = createMockBattler({ name: 'Glimmora', types: ['Rock', 'Poison'] });
    const defender = createMockBattler({ name: 'Vaporeon', types: ['Water'], status: 'none' });
    const env: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
      playerHazards: { stealthRock: true, spikes: 2 },
    };

    const mortalSpin: BattleMove = {
      id: 'mortal_spin',
      name: 'Mortal Spin',
      type: 'Poison',
      category: 'physical',
      power: 30,
      accuracy: 100,
      pp: 15,
      maxPp: 15,
      description: 'Spin attack that removes hazards and inflicts poison.',
    };

    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.5]));
    const result = engine.executeAttack(attacker, defender, mortalSpin);

    expect(env.playerHazards?.stealthRock).toBe(false);
    expect(env.playerHazards?.spikes).toBe(0);
    expect(defender.status).toBe('poison');
    expect(result.message).toContain('đã bị trúng độc');
  });

  it('does not poison Steel or Poison type opponents', () => {
    const attacker = createMockBattler({ name: 'Glimmora' });
    const steelDefender = createMockBattler({
      name: 'Corviknight',
      types: ['Steel', 'Flying'],
      status: 'none',
    });
    const env: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };

    const mortalSpin: BattleMove = {
      id: 'mortal_spin',
      name: 'Mortal Spin',
      type: 'Poison',
      category: 'physical',
      power: 30,
      accuracy: 100,
      pp: 15,
      maxPp: 15,
      description: 'Spin attack that removes hazards and inflicts poison.',
    };

    const engine = new BattleEngine(attacker, steelDefender, env, new FixedSequenceRng([0.5]));
    engine.executeAttack(attacker, steelDefender, mortalSpin);

    expect(steelDefender.status).toBe('none');
  });

  it('clears player hazards and binding when hitting Substitute, but does not poison defender', () => {
    const attacker = createMockBattler({ name: 'Glimmora', types: ['Rock', 'Poison'] });
    attacker.boundStatus = { moveId: 'wrap', moveName: 'Wrap', sourceSide: 'enemy', turnsLeft: 3 };
    attacker.isSeeded = true;

    const defender = createMockBattler({
      name: 'Vaporeon',
      types: ['Water'],
      status: 'none',
      substituteHp: 50,
    });
    const env: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
      playerHazards: { stealthRock: true, spikes: 2 },
    };

    const mortalSpin: BattleMove = {
      id: 'mortal_spin',
      name: 'Mortal Spin',
      type: 'Poison',
      category: 'physical',
      power: 30,
      accuracy: 100,
      pp: 15,
      maxPp: 15,
      description: 'Spin attack that removes hazards and inflicts poison.',
    };

    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.5]));
    const result = engine.executeAttack(attacker, defender, mortalSpin);

    // Decoy received damage
    expect(defender.substituteHp).toBeLessThan(50);
    // Hazards and binding cleared for attacker
    expect(env.playerHazards?.stealthRock).toBe(false);
    expect(env.playerHazards?.spikes).toBe(0);
    expect(attacker.boundStatus).toBeUndefined();
    expect(attacker.isSeeded).toBe(false);
    // Defender behind Substitute is NOT poisoned
    expect(defender.status).toBe('none');
    expect(result.message).not.toContain('đã bị trúng độc');
  });
});

describe('Trick Room Mechanics', () => {
  it('reverses turn order so slower Pokémon moves first', () => {
    const fastPokemon = createMockBattler({ stats: { ...createMockBattler().stats, speed: 150 } });
    const slowPokemon = createMockBattler({ stats: { ...createMockBattler().stats, speed: 50 } });

    const normalEnv: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };
    const trickRoomEnv: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
      trickRoomTurns: 5,
    };

    const dummyMove: BattleMove = {
      id: 'tackle',
      name: 'Tackle',
      type: 'Normal',
      category: 'physical',
      power: 40,
      accuracy: 100,
      pp: 35,
      maxPp: 35,
      description: 'A physical attack.',
    };
    const normalFirst = determineTurnOrder(
      fastPokemon,
      dummyMove,
      slowPokemon,
      dummyMove,
      new FixedSequenceRng([0.5]),
      normalEnv
    );
    expect(normalFirst).toBe('player');

    const trickRoomFirst = determineTurnOrder(
      fastPokemon,
      dummyMove,
      slowPokemon,
      dummyMove,
      new FixedSequenceRng([0.5]),
      trickRoomEnv
    );
    expect(trickRoomFirst).toBe('enemy');
  });

  it('Trick Room status move toggles active turns and ticks down', () => {
    const user = createMockBattler({ name: 'Porygon2' });
    const enemy = createMockBattler({ name: 'Gengar' });
    const env: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };

    const trickRoomMove: BattleMove = {
      id: 'trick_room',
      name: 'Trick Room',
      type: 'Psychic',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 5,
      maxPp: 5,
      description: 'Reverses turn order.',
    };

    const engine = new BattleEngine(user, enemy, env, new FixedSequenceRng([0.5]));
    engine.executeAttack(user, enemy, trickRoomMove);
    expect(env.trickRoomTurns).toBe(5);

    // End of round tick
    const msgs = engine.resetRound();
    expect(env.trickRoomTurns).toBe(4);
    expect(msgs.length).toBe(0);

    // Tick remaining turns
    engine.resetRound();
    engine.resetRound();
    engine.resetRound();
    const finalMsgs = engine.resetRound();
    expect(env.trickRoomTurns).toBe(0);
    expect(finalMsgs.some((m) => m.includes('Không gian bị bóp méo đã trở lại'))).toBe(true);
  });
});

describe('Screens & Tailwind Mechanics', () => {
  const tackle: BattleMove = {
    id: 'tackle',
    name: 'Tackle',
    type: 'Normal',
    category: 'physical',
    power: 50,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: 'A physical attack.',
  };
  const swift: BattleMove = {
    id: 'swift',
    name: 'Swift',
    type: 'Normal',
    category: 'special',
    power: 60,
    accuracy: 100,
    pp: 20,
    maxPp: 20,
    description: 'Star-shaped rays that never miss.',
  };

  it('Reflect halves physical damage, Light Screen halves special damage', () => {
    const attacker = createMockBattler({
      stats: { ...createMockBattler().stats, attack: 100, spAtk: 100 },
    });
    const defender = createMockBattler({
      stats: { ...createMockBattler().stats, defense: 100, spDef: 100 },
    });

    const normalDmgPhysical = calculateDamage(
      attacker,
      defender,
      tackle,
      new FixedSequenceRng([0.5])
    ).damage;
    const normalDmgSpecial = calculateDamage(
      attacker,
      defender,
      swift,
      new FixedSequenceRng([0.5])
    ).damage;

    const envWithReflect: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
      enemyScreens: { reflectTurns: 5 },
    };
    const reflectDmg = calculateDamage(
      attacker,
      defender,
      tackle,
      new FixedSequenceRng([0.5]),
      envWithReflect,
      'enemy'
    ).damage;
    expect(reflectDmg).toBeLessThanOrEqual(Math.floor(normalDmgPhysical * 0.55));

    const envWithLightScreen: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
      enemyScreens: { lightScreenTurns: 5 },
    };
    const screenDmg = calculateDamage(
      attacker,
      defender,
      swift,
      new FixedSequenceRng([0.5]),
      envWithLightScreen,
      'enemy'
    ).damage;
    expect(screenDmg).toBeLessThanOrEqual(Math.floor(normalDmgSpecial * 0.55));
  });

  it('Tailwind doubles speed for the side', () => {
    const player = createMockBattler({ stats: { ...createMockBattler().stats, speed: 80 } });
    const enemy = createMockBattler({ stats: { ...createMockBattler().stats, speed: 100 } });

    const envNoTailwind: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };
    const dummyMove: BattleMove = {
      id: 'tackle',
      name: 'Tackle',
      type: 'Normal',
      category: 'physical',
      power: 40,
      accuracy: 100,
      pp: 35,
      maxPp: 35,
      description: 'A physical attack.',
    };
    const firstBefore = determineTurnOrder(
      player,
      dummyMove,
      enemy,
      dummyMove,
      new FixedSequenceRng([0.5]),
      envNoTailwind
    );
    expect(firstBefore).toBe('enemy');

    const envTailwind: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
      playerScreens: { tailwindTurns: 4 },
    };
    const firstAfter = determineTurnOrder(
      player,
      dummyMove,
      enemy,
      dummyMove,
      new FixedSequenceRng([0.5]),
      envTailwind
    );
    expect(firstAfter).toBe('player');
  });
});

describe('Substitute & Endure Mechanics', () => {
  it('Substitute creates decoy with 25% HP that absorbs damage and blocks status', () => {
    const attacker = createMockBattler({ name: 'SubUser', currentHp: 100, maxHp: 100 });
    const enemy = createMockBattler({ name: 'Enemy', currentHp: 100, maxHp: 100 });
    const env: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };

    const subMove: BattleMove = {
      id: 'substitute',
      name: 'Substitute',
      type: 'Normal',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      description: 'Creates a decoy using HP.',
    };
    const engine = new BattleEngine(attacker, enemy, env, new FixedSequenceRng([0.5]));
    engine.executeAttack(attacker, enemy, subMove);

    expect(attacker.currentHp).toBe(75);
    expect(attacker.substituteHp).toBe(25);

    // Enemy attacks attacker with Flamethrower (burn chance)
    const flamethrower: BattleMove = {
      id: 'flamethrower',
      name: 'Flamethrower',
      type: 'Fire',
      category: 'special',
      power: 90,
      accuracy: 100,
      pp: 15,
      maxPp: 15,
      description: 'A fiery blast.',
      statusEffect: { condition: 'burn', chance: 1.0, target: 'opponent' },
    };

    const atkResult = engine.executeAttack(enemy, attacker, flamethrower);
    // Substitute should take the hit and break, but attacker takes 0 main HP damage and no burn
    expect(attacker.currentHp).toBe(75);
    expect(attacker.substituteHp).toBe(0);
    expect(attacker.status).toBe('none');
    expect(atkResult.message).toContain('bị phá hủy');
  });

  it('Endure allows surviving lethal hit with exactly 1 HP', () => {
    const attacker = createMockBattler({ name: 'EndureUser', currentHp: 20, maxHp: 100 });
    const enemy = createMockBattler({
      name: 'Boss',
      stats: { ...createMockBattler().stats, attack: 200 },
    });
    const env: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };

    const endureMove: BattleMove = {
      id: 'endure',
      name: 'Endure',
      type: 'Normal',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      description: 'Endures any attack with at least 1 HP.',
    };
    const engine = new BattleEngine(attacker, enemy, env, new FixedSequenceRng([0.5]));
    engine.executeAttack(attacker, enemy, endureMove);
    expect(attacker.isEndured).toBe(true);

    const lethalMove: BattleMove = {
      id: 'hyper_beam',
      name: 'Hyper Beam',
      type: 'Normal',
      category: 'special',
      power: 150,
      accuracy: 100,
      pp: 5,
      maxPp: 5,
      description: 'A powerful blast.',
    };

    const result = engine.executeAttack(enemy, attacker, lethalMove);
    expect(attacker.currentHp).toBe(1);
    expect(attacker.isFainted).toBe(false);
    expect(result.message).toContain('kiên cường chịu đựng đòn đánh với 1 HP');
  });
});

describe('Stockpile, Swallow, Spit Up Cycle', () => {
  it('Stockpile stacks up to 3 times and boosts defense stats', () => {
    const user = createMockBattler({ name: 'Drifblim' });
    const enemy = createMockBattler({ name: 'Target' });
    const env: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };

    const stockpile: BattleMove = {
      id: 'stockpile',
      name: 'Stockpile',
      type: 'Normal',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      description: 'Charges power up to 3 times.',
    };
    const engine = new BattleEngine(user, enemy, env, new FixedSequenceRng([0.5]));
    engine.executeAttack(user, enemy, stockpile);
    expect(user.stockpileCount).toBe(1);
    expect(user.statStages.defense).toBe(1);
    expect(user.statStages.spDef).toBe(1);

    engine.executeAttack(user, enemy, stockpile);
    expect(user.stockpileCount).toBe(2);
    expect(user.statStages.defense).toBe(2);

    engine.executeAttack(user, enemy, stockpile);
    expect(user.stockpileCount).toBe(3);
    expect(user.statStages.defense).toBe(3);

    // 4th time fails
    const fourth = engine.executeAttack(user, enemy, stockpile);
    expect(user.stockpileCount).toBe(3);
    expect(fourth.message).toContain('đã đạt tối đa 3 lần');
  });

  it('Swallow heals HP according to stockpileCount and resets boosts', () => {
    const user = createMockBattler({
      name: 'Drifblim',
      currentHp: 20,
      maxHp: 100,
      stockpileCount: 3,
    });
    user.statStages.defense = 3;
    user.statStages.spDef = 3;
    const enemy = createMockBattler({ name: 'Target' });
    const env: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };

    const swallow: BattleMove = {
      id: 'swallow',
      name: 'Swallow',
      type: 'Normal',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      description: 'Absorbs stockpiled power to restore HP.',
    };
    const engine = new BattleEngine(user, enemy, env, new FixedSequenceRng([0.5]));
    engine.executeAttack(user, enemy, swallow);

    expect(user.currentHp).toBe(100);
    expect(user.stockpileCount).toBe(0);
    expect(user.statStages.defense).toBe(0);
    expect(user.statStages.spDef).toBe(0);
  });
});

describe('Rampage Mechanics and Move Locking', () => {
  const outrage: BattleMove = {
    id: 'outrage',
    name: 'Outrage',
    type: 'Dragon',
    category: 'physical',
    power: 120,
    accuracy: 100,
    pp: 10,
    maxPp: 10,
    description: 'Rampages for 2 to 3 turns.',
  };
  const tackle: BattleMove = {
    id: 'tackle',
    name: 'Tackle',
    type: 'Normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: 'A physical attack.',
  };

  it('locks attacker into Outrage, blocks other moves, ticks down, and inflicts confusion upon fatigue', () => {
    const attacker = createMockBattler({
      name: 'Dragonite',
      moves: [outrage, tackle],
    });
    const defender = createMockBattler({
      name: 'Snorlax',
      currentHp: 500,
      maxHp: 500,
    });
    const env: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };

    // RNG: sequence: turn 1 [crit: 0.1, dmgFactor: 0.5, rampageDuration: 0.0 -> 2 - 1 = 1], turn 2 [crit: 0.1, dmgFactor: 0.5, confusion: 0.5 -> 3]
    const engine = new BattleEngine(
      attacker,
      defender,
      env,
      new FixedSequenceRng([0.1, 0.5, 0.0, 0.1, 0.5, 0.5])
    );

    // Turn 1: Uses Outrage -> creates rampage with turnsLeft = 1
    const res1 = engine.executeAttack(attacker, defender, outrage);
    expect(res1.damage).toBeGreaterThan(0);
    expect(attacker.rampage).toBeDefined();
    expect(attacker.rampage?.moveId).toBe('outrage');
    expect(attacker.rampage?.turnsLeft).toBe(1);

    // Attacker tries to use Tackle while rampaging -> BLOCKED!
    const resBlocked = engine.executeAttack(attacker, defender, tackle);
    expect(resBlocked.damage).toBe(0);
    expect(resBlocked.message).toContain('đang trong cơn cuồng nộ và chỉ có thể sử dụng Outrage');

    // forced move helper confirms Outrage is locked
    expect(engine.getForcedMove(attacker)?.id).toBe('outrage');

    // Turn 2: Uses Outrage again -> completes rampage and inflicts confusion
    const res2 = engine.executeAttack(attacker, defender, outrage);
    expect(res2.damage).toBeGreaterThan(0);
    expect(attacker.rampage).toBeUndefined();
    expect(attacker.confusionTurns).toBeGreaterThan(0);
    expect(res2.message).toContain('rơi vào trạng thái bối rối do mệt mỏi');
  });

  it('enemy AI forced move respects rampage', () => {
    const player = createMockBattler({ name: 'Pikachu' });
    const enemy = createMockBattler({
      name: 'Garchomp',
      moves: [outrage, tackle],
      rampage: { moveId: 'outrage', turnsLeft: 1 },
    });
    const env: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };
    const engine = new BattleEngine(player, enemy, env, new FixedSequenceRng([0.5]));
    expect(engine.getEnemyAction().id).toBe('outrage');
  });
});

describe('Substitute with Drain and Recoil mechanics', () => {
  const gigaDrain: BattleMove = {
    id: 'giga_drain',
    name: 'Giga Drain',
    type: 'Grass',
    category: 'special',
    power: 75,
    accuracy: 100,
    pp: 10,
    maxPp: 10,
    drainPercent: 0.5,
    description: 'Nutrient-draining attack.',
  };
  const braveBird: BattleMove = {
    id: 'brave_bird',
    name: 'Brave Bird',
    type: 'Flying',
    category: 'physical',
    power: 120,
    accuracy: 100,
    pp: 15,
    maxPp: 15,
    recoilPercent: 0.33,
    description: 'High-power recoil attack.',
  };

  it('Drain moves against Substitute deal damage to decoy but HEAL 0 HP to attacker', () => {
    const attacker = createMockBattler({ name: 'Sceptile', currentHp: 50, maxHp: 100 });
    const defender = createMockBattler({
      name: 'Blissey',
      currentHp: 200,
      maxHp: 200,
      substituteHp: 40,
    });
    const env: BattleEnvironment = { background: 'field', enemyBase: 'base', playerBase: 'base' };

    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.5]));
    const res = engine.executeAttack(attacker, defender, gigaDrain);

    // Decoy received damage
    expect(defender.substituteHp).toBeLessThan(40);
    // Attacker received ZERO healing from Substitute hit
    expect(attacker.currentHp).toBe(50);
    expect(res.events.some((e) => e.type === 'hp_restored')).toBe(false);
  });

  it('Recoil moves calculate recoil based on damage dealt to Substitute and not 0 or min 1 when 0 dmg', () => {
    const attacker = createMockBattler({
      name: 'Staraptor',
      types: ['Flying'],
      currentHp: 100,
      maxHp: 100,
    });
    // Substitute only has 20 HP
    const defender = createMockBattler({
      name: 'Target',
      currentHp: 100,
      maxHp: 100,
      substituteHp: 20,
    });
    const env: BattleEnvironment = { background: 'field', enemyBase: 'base', playerBase: 'base' };

    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.5]));
    const res = engine.executeAttack(attacker, defender, braveBird);

    // Substitute is broken (20 HP taken)
    expect(defender.substituteHp).toBe(0);
    // Recoil is 33% of 20 HP = Math.floor(20 * 0.33) = 6 HP recoil
    expect(attacker.currentHp).toBe(100 - 6);
    expect(res.events.some((e) => e.type === 'recoil_damage')).toBe(true);
  });

  it('Recoil does NOT deduct HP when 0 damage is dealt', () => {
    const attacker = createMockBattler({ name: 'Staraptor', currentHp: 100, maxHp: 100 });
    const defender = createMockBattler({
      name: 'Gengar',
      types: ['Ghost'],
      currentHp: 100,
      maxHp: 100,
    });
    const env: BattleEnvironment = { background: 'field', enemyBase: 'base', playerBase: 'base' };
    const takeDownNormal: BattleMove = {
      id: 'take_down',
      name: 'Take Down',
      type: 'Normal',
      category: 'physical',
      power: 90,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      recoilPercent: 0.25,
      description: 'A reckless, full-body charge attack.',
    };

    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.5]));
    const res = engine.executeAttack(attacker, defender, takeDownNormal);
    // Immune -> 0 damage -> 0 recoil (not Math.max(1, 0))
    expect(attacker.currentHp).toBe(100);
    expect(res.events.some((e) => e.type === 'recoil_damage')).toBe(false);
  });
});

describe('Pledge Combo Mechanics across battle rounds', () => {
  const firePledge: BattleMove = {
    id: 'fire_pledge',
    name: 'Fire Pledge',
    type: 'Fire',
    category: 'special',
    power: 80,
    accuracy: 100,
    pp: 10,
    maxPp: 10,
    description: 'A column of fire.',
  };
  const grassPledge: BattleMove = {
    id: 'grass_pledge',
    name: 'Grass Pledge',
    type: 'Grass',
    category: 'special',
    power: 80,
    accuracy: 100,
    pp: 10,
    maxPp: 10,
    description: 'A column of grass.',
  };

  it('triggers pledgeCombo with power 150 on the second pledge move, and resets on round reset', () => {
    const player = createMockBattler({ name: 'Charizard' });
    const enemy = createMockBattler({ name: 'Venusaur', currentHp: 500, maxHp: 500 });
    const env: BattleEnvironment = { background: 'field', enemyBase: 'base', playerBase: 'base' };

    const engine = new BattleEngine(player, enemy, env, new FixedSequenceRng([0.5]));

    // Step 1: First pledge move executed
    engine.executeAttack(player, enemy, firePledge);
    expect(env.lastPledgeMove).toBe('fire_pledge');
    expect(env.pledgeCombo).toBeFalsy();

    // Step 2: Second pledge move executed by enemy
    const resCombo = engine.executeAttack(enemy, player, grassPledge);
    expect(env.pledgeCombo).toBe(true);
    expect(resCombo.damage).toBeGreaterThan(0);

    // End of round: resetRound clears pledge combo
    engine.resetRound();
    expect(env.pledgeCombo).toBe(false);
    expect(env.lastPledgeMove).toBeUndefined();
  });
});

describe('Metronome Move Execution', () => {
  const metronomeMove: BattleMove = {
    id: 'metronome',
    name: 'Metronome',
    type: 'Normal',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 10,
    maxPp: 10,
    description: 'Waggles a finger to use any move.',
  };

  it('executes a random move from MOVES_DB via BattleEngine', () => {
    const attacker = createMockBattler({ name: 'Clefairy' });
    const defender = createMockBattler({ name: 'Snorlax', currentHp: 200, maxHp: 200 });
    const env: BattleEnvironment = { background: 'field', enemyBase: 'base', playerBase: 'base' };

    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.2, 0.5, 0.5]));
    const result = engine.executeAttack(attacker, defender, metronomeMove);

    expect(result.message).toContain('vung Ngón Tay Ma Thuật!');
    expect(result.events.length).toBeGreaterThan(0);
  });
});

describe('Screens & Mist Full BattleEngine Flow', () => {
  const reflectMove: BattleMove = {
    id: 'reflect',
    name: 'Reflect',
    type: 'Psychic',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 20,
    maxPp: 20,
    description: 'Reduces physical damage.',
  };
  const lightScreenMove: BattleMove = {
    id: 'light_screen',
    name: 'Light Screen',
    type: 'Psychic',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 30,
    maxPp: 30,
    description: 'Reduces special damage.',
  };
  const mistMove: BattleMove = {
    id: 'mist',
    name: 'Mist',
    type: 'Ice',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 30,
    maxPp: 30,
    description: 'Protects stats from being lowered.',
  };
  const physicalAtk: BattleMove = {
    id: 'slash',
    name: 'Slash',
    type: 'Normal',
    category: 'physical',
    power: 70,
    accuracy: 100,
    pp: 20,
    maxPp: 20,
    description: 'Slashes with sharp claws.',
  };
  const specialAtk: BattleMove = {
    id: 'swift',
    name: 'Swift',
    type: 'Normal',
    category: 'special',
    power: 60,
    accuracy: 100,
    pp: 20,
    maxPp: 20,
    description: 'Star-shaped rays that never miss.',
  };
  const growlDebuff: BattleMove = {
    id: 'growl',
    name: 'Growl',
    type: 'Normal',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 40,
    maxPp: 40,
    description: 'Growls cutely to reduce attack.',
    statChanges: [{ stat: 'attack', stages: -1, chance: 1.0, target: 'opponent' }],
  };

  it('sets up Reflect and Light Screen and reduces physical/special damage by 50%', () => {
    const user = createMockBattler({ name: 'Mr. Mime' });
    const enemy = createMockBattler({ name: 'Mewtwo' });
    const env: BattleEnvironment = { background: 'field', enemyBase: 'base', playerBase: 'base' };

    const engine = new BattleEngine(user, enemy, env, new FixedSequenceRng([0.5]));

    // Cast Reflect
    engine.executeAttack(user, enemy, reflectMove);
    expect(env.playerScreens?.reflectTurns).toBe(5);

    // Cast Light Screen
    engine.executeAttack(user, enemy, lightScreenMove);
    expect(env.playerScreens?.lightScreenTurns).toBe(5);

    // Enemy attacks with physical and special
    const resPhys = engine.executeAttack(enemy, user, physicalAtk);
    const resSpec = engine.executeAttack(enemy, user, specialAtk);

    // Without screens baseline
    const envNoScreen: BattleEnvironment = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };
    const engineBaseline = new BattleEngine(
      createMockBattler(),
      createMockBattler(),
      envNoScreen,
      new FixedSequenceRng([0.5])
    );
    const resPhysBase = engineBaseline.executeAttack(enemy, user, physicalAtk);
    const resSpecBase = engineBaseline.executeAttack(enemy, user, specialAtk);

    expect(resPhys.damage).toBeLessThan(resPhysBase.damage);
    expect(resSpec.damage).toBeLessThan(resSpecBase.damage);
  });

  it('Mist prevents stat reduction moves from enemy and ticks down over 5 rounds', () => {
    const user = createMockBattler({ name: 'Lapras' });
    const enemy = createMockBattler({ name: 'Growlithe' });
    const env: BattleEnvironment = { background: 'field', enemyBase: 'base', playerBase: 'base' };

    const engine = new BattleEngine(user, enemy, env, new FixedSequenceRng([0.5]));

    // Cast Mist
    engine.executeAttack(user, enemy, mistMove);
    expect(env.playerScreens?.mistTurns).toBe(5);

    // Enemy uses Growl (-1 Attack) -> blocked by Mist!
    const growlRes = engine.executeAttack(enemy, user, growlDebuff);
    expect(user.statStages.attack).toBe(0);
    expect(growlRes.message).toContain('Màn Sương Trắng bảo vệ');

    // Tick through 5 rounds to expire Mist
    engine.resetRound(); // 4
    engine.resetRound(); // 3
    engine.resetRound(); // 2
    engine.resetRound(); // 1
    const expireMsgs = engine.resetRound(); // 0
    expect(env.playerScreens?.mistTurns).toBe(0);
    expect(expireMsgs.some((m) => m.includes('Màn Sương Trắng của bạn đã tan biến'))).toBe(true);

    // Now Growl succeeds
    engine.executeAttack(enemy, user, growlDebuff);
    expect(user.statStages.attack).toBe(-1);
  });
});
