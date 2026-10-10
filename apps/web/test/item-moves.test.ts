import { describe, it, expect } from 'vitest';
import { BattleEngine } from '../src/battle/battle-engine';
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

describe('Item Interaction Moves', () => {
  it('Trick and Switcheroo swap held items between attacker and defender', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Alakazam', heldItem: 'choice-specs' });
    const defender = createMockBattler({ name: 'Snorlax', heldItem: 'leftovers' });
    const engine = new BattleEngine(attacker, defender, env);

    const trickMove: BattleMove = {
      id: 'trick',
      name: 'Trick',
      type: 'Psychic',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      description: 'Swaps held items',
    };

    const res = engine.executeAttack(attacker, defender, trickMove);
    expect(attacker.heldItem).toBe('leftovers');
    expect(defender.heldItem).toBe('choice-specs');
    expect(res.message).toContain('hoán đổi vật phẩm cho nhau');

    // Fails if Sticky Hold is present
    const stickyDefender = createMockBattler({
      name: 'Muk',
      ability: 'Sticky Hold',
      heldItem: 'black-sludge',
    });
    const engine2 = new BattleEngine(attacker, stickyDefender, env);
    const resSticky = engine2.executeAttack(attacker, stickyDefender, trickMove);
    expect(resSticky.message).toContain('Dính Chặt');
    expect(stickyDefender.heldItem).toBe('black-sludge');

    // Fails if neither has item
    const emptyAttacker = createMockBattler({ heldItem: null });
    const emptyDefender = createMockBattler({ heldItem: null });
    const engine3 = new BattleEngine(emptyAttacker, emptyDefender, env);
    const resEmpty = engine3.executeAttack(emptyAttacker, emptyDefender, trickMove);
    expect(resEmpty.message).toContain('không có vật phẩm nào');
  });

  it('Thief and Covet steal held item when user has none, blocked by Sticky Hold', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Weavile', heldItem: null });
    const defender = createMockBattler({
      name: 'Pikachu',
      heldItem: 'light-ball',
      maxHp: 100,
      currentHp: 100,
    });
    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.1, 0.1]));

    const thiefMove: BattleMove = {
      id: 'thief',
      name: 'Thief',
      type: 'Dark',
      category: 'physical',
      power: 60,
      accuracy: 100,
      pp: 25,
      maxPp: 25,
      description: 'Steals held item',
    };

    const res = engine.executeAttack(attacker, defender, thiefMove);
    expect(res.damage).toBeGreaterThan(0);
    expect(attacker.heldItem).toBe('light-ball');
    expect(defender.heldItem).toBeNull();
    expect(res.message).toContain('đã cướp lấy');

    // Cannot steal if user already holds an item
    const defender2 = createMockBattler({ heldItem: 'sitrus-berry', maxHp: 100, currentHp: 100 });
    const engine2 = new BattleEngine(attacker, defender2, env, new FixedSequenceRng([0.1, 0.1]));
    engine2.executeAttack(attacker, defender2, thiefMove);
    expect(defender2.heldItem).toBe('sitrus-berry');

    // Cannot steal if defender has Sticky Hold
    attacker.heldItem = null;
    const stickyDefender = createMockBattler({
      ability: 'Sticky Hold',
      heldItem: 'sitrus-berry',
      maxHp: 100,
      currentHp: 100,
    });
    const engine3 = new BattleEngine(
      attacker,
      stickyDefender,
      env,
      new FixedSequenceRng([0.1, 0.1])
    );
    const resSticky = engine3.executeAttack(attacker, stickyDefender, thiefMove);
    expect(stickyDefender.heldItem).toBe('sitrus-berry');
    expect(resSticky.message).toContain('Dính Chặt');
  });

  it('Knock Off gets 1.5x power and knocks off item, unless target has Sticky Hold', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Bisharp' });
    const defenderWithItem = createMockBattler({
      name: 'Gengar',
      heldItem: 'focus-sash',
      maxHp: 200,
      currentHp: 200,
    });
    const defenderNoItem = createMockBattler({
      name: 'Gengar',
      heldItem: null,
      maxHp: 200,
      currentHp: 200,
    });

    const knockOffMove: BattleMove = {
      id: 'knock_off',
      name: 'Knock Off',
      type: 'Dark',
      category: 'physical',
      power: 65,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      description: 'Knocks off item with 1.5x damage boost',
    };

    // Attack defender with item
    const engine1 = new BattleEngine(
      attacker,
      defenderWithItem,
      env,
      new FixedSequenceRng([0.1, 0.1])
    );
    const res1 = engine1.executeAttack(attacker, defenderWithItem, knockOffMove);
    expect(defenderWithItem.heldItem).toBeNull();
    expect(res1.message).toContain('đã đánh rơi');

    // Attack defender without item
    const engine2 = new BattleEngine(
      attacker,
      defenderNoItem,
      env,
      new FixedSequenceRng([0.1, 0.1])
    );
    const res2 = engine2.executeAttack(attacker, defenderNoItem, knockOffMove);
    expect(res1.damage).toBeGreaterThan(res2.damage);

    // Target with Sticky Hold does not lose item and takes normal damage
    const stickyDefender = createMockBattler({
      ability: 'Sticky Hold',
      heldItem: 'leftovers',
      maxHp: 200,
      currentHp: 200,
    });
    const engine3 = new BattleEngine(
      attacker,
      stickyDefender,
      env,
      new FixedSequenceRng([0.1, 0.1])
    );
    const res3 = engine3.executeAttack(attacker, stickyDefender, knockOffMove);
    expect(stickyDefender.heldItem).toBe('leftovers');
    expect(res3.message).toContain('Dính Chặt');
  });

  it('Bug Bite and Pluck eat the defender berry and gain its effect', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Scizor', maxHp: 100, currentHp: 50 });
    const defender = createMockBattler({
      name: 'Shuckle',
      heldItem: 'sitrus-berry',
      maxHp: 100,
      currentHp: 100,
    });
    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.1, 0.1]));

    const bugBiteMove: BattleMove = {
      id: 'bug_bite',
      name: 'Bug Bite',
      type: 'Bug',
      category: 'physical',
      power: 60,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      description: 'Eats opponent berry',
    };

    const res = engine.executeAttack(attacker, defender, bugBiteMove);
    expect(res.damage).toBeGreaterThan(0);
    expect(defender.heldItem).toBeNull();
    // Sitrus Berry heals 25% max HP (100 * 25% = 25 HP) -> 50 + 25 = 75
    expect(attacker.currentHp).toBe(75);
    expect(res.message).toContain('đã cướp lấy và ăn quả');
    expect(res.message).toContain('Đã hồi phục 25 HP!');
  });

  it('Incinerate burns and destroys opponent held berry', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Charizard' });
    const defender = createMockBattler({
      name: 'Venusaur',
      heldItem: 'lum-berry',
      maxHp: 100,
      currentHp: 100,
    });
    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.1, 0.1]));

    const incinerateMove: BattleMove = {
      id: 'incinerate',
      name: 'Incinerate',
      type: 'Fire',
      category: 'special',
      power: 60,
      accuracy: 100,
      pp: 15,
      maxPp: 15,
      description: 'Burns up berry',
    };

    const res = engine.executeAttack(attacker, defender, incinerateMove);
    expect(res.damage).toBeGreaterThan(0);
    expect(defender.heldItem).toBeNull();
    expect(res.message).toContain('đã bị thiêu rụi hoàn toàn!');
  });

  it('Fling throws held item with scaled power and consumes it into lastConsumedItem', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Machamp', heldItem: 'iron-ball' });
    const defender = createMockBattler({ name: 'Blissey', maxHp: 300, currentHp: 300 });
    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.1, 0.1]));

    const flingMove: BattleMove = {
      id: 'fling',
      name: 'Fling',
      type: 'Dark',
      category: 'physical',
      power: 0,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      description: 'Flings held item',
    };

    const res = engine.executeAttack(attacker, defender, flingMove);
    expect(res.damage).toBeGreaterThan(0);
    expect(attacker.heldItem).toBeNull();
    expect(attacker.lastConsumedItem).toBe('iron-ball');
    expect(res.message).toContain('đã ném mạnh');

    // Fling fails if user has no item
    const resNoItem = engine.executeAttack(attacker, defender, flingMove);
    expect(resNoItem.damage).toBe(0);
    expect(resNoItem.message).toContain('không có vật phẩm nào để ném!');
  });

  it('Fling with Flame Orb burns the defender', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Gengar', heldItem: 'flame-orb' });
    const defender = createMockBattler({
      name: 'NormalTarget',
      types: ['Normal'],
      status: 'none',
      maxHp: 100,
      currentHp: 100,
    });
    const engine = new BattleEngine(attacker, defender, env, new FixedSequenceRng([0.1, 0.1]));

    const flingMove: BattleMove = {
      id: 'fling',
      name: 'Fling',
      type: 'Dark',
      category: 'physical',
      power: 0,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      description: 'Flings held item',
    };

    const res = engine.executeAttack(attacker, defender, flingMove);
    expect(defender.status).toBe('burn');
    expect(res.message).toContain('đã bị bỏng!');
  });

  it('Recycle recovers the last consumed item', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({
      name: 'Snorlax',
      heldItem: null,
      lastConsumedItem: 'sitrus-berry',
    });
    const defender = createMockBattler();
    const engine = new BattleEngine(attacker, defender, env);

    const recycleMove: BattleMove = {
      id: 'recycle',
      name: 'Recycle',
      type: 'Normal',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      description: 'Recovers consumed item',
    };

    const res = engine.executeAttack(attacker, defender, recycleMove);
    expect(attacker.heldItem).toBe('sitrus-berry');
    expect(attacker.lastConsumedItem).toBeNull();
    expect(res.message).toContain('đã tái chế và nhận lại');

    // Cannot recycle if already holding item
    const resHolding = engine.executeAttack(attacker, defender, recycleMove);
    expect(resHolding.message).toContain('đang mang một vật phẩm rồi!');
  });

  it('Stuff Cheeks eats held berry and boosts Defense by 2 stages', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({
      name: 'Greedent',
      heldItem: 'sitrus-berry',
      maxHp: 100,
      currentHp: 60,
    });
    const defender = createMockBattler();
    const engine = new BattleEngine(attacker, defender, env);

    const stuffCheeksMove: BattleMove = {
      id: 'stuff_cheeks',
      name: 'Stuff Cheeks',
      type: 'Normal',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      description: 'Eats berry and boosts Defense +2',
    };

    const res = engine.executeAttack(attacker, defender, stuffCheeksMove);
    expect(attacker.heldItem).toBeNull();
    expect(attacker.lastConsumedItem).toBe('sitrus-berry');
    expect(attacker.currentHp).toBe(85); // 60 + 25 = 85
    expect(attacker.statStages.defense).toBe(2);
    expect(res.message).toContain('nhét đầy');
    expect(res.message).toContain('Phòng thủ tăng mạnh!');

    // Fails if not holding a berry
    const resNoBerry = engine.executeAttack(attacker, defender, stuffCheeksMove);
    expect(resNoBerry.message).toContain('không mang theo quả Berry nào');
  });

  it('Poltergeist deals high damage if defender holds item, fails if defender holds no item', () => {
    const env = createMockEnvironment();
    const attacker = createMockBattler({ name: 'Chandelure', types: ['Ghost', 'Fire'] });
    const defenderWithItem = createMockBattler({
      name: 'Lucario',
      heldItem: 'life-orb',
      maxHp: 150,
      currentHp: 150,
    });
    const defenderNoItem = createMockBattler({
      name: 'Lucario',
      heldItem: null,
      maxHp: 150,
      currentHp: 150,
    });

    const poltergeistMove: BattleMove = {
      id: 'poltergeist',
      name: 'Poltergeist',
      type: 'Ghost',
      category: 'physical',
      power: 110,
      accuracy: 90,
      pp: 5,
      maxPp: 5,
      description: 'Attacks with opponent item',
    };

    // Target with item takes damage and keeps item
    const engine1 = new BattleEngine(
      attacker,
      defenderWithItem,
      env,
      new FixedSequenceRng([0.1, 0.1])
    );
    const res1 = engine1.executeAttack(attacker, defenderWithItem, poltergeistMove);
    expect(res1.damage).toBeGreaterThan(0);
    expect(defenderWithItem.heldItem).toBe('life-orb');
    expect(res1.message).toContain('bị tấn công bởi chính');

    // Target with no item causes Poltergeist to fail
    const engine2 = new BattleEngine(
      attacker,
      defenderNoItem,
      env,
      new FixedSequenceRng([0.1, 0.1])
    );
    const res2 = engine2.executeAttack(attacker, defenderNoItem, poltergeistMove);
    expect(res2.damage).toBe(0);
    expect(res2.message).toContain('không mang vật phẩm nào!');
  });
});
