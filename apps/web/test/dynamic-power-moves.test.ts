import { describe, it, expect } from 'vitest';
import { BattleEngine } from '../src/battle/battle-engine';
import { FixedSequenceRng } from '../src/battle/battle-rng';
import { calculateDamage } from '../src/battle/rules/damage-calculator';
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
      hp: 200,
      attack: 100,
      defense: 100,
      spAtk: 100,
      spDef: 100,
      speed: 100,
      total: 700,
    },
    currentHp: 200,
    maxHp: 200,
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
    weight: 50,
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

function createMove(overrides: Partial<BattleMove>): BattleMove {
  return {
    id: 'tackle',
    name: 'Tackle',
    type: 'Normal',
    category: 'physical',
    power: 50,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: '',
    ...overrides,
  };
}

describe('Dynamic Base Power Moves', () => {
  it('Facade doubles in power and ignores burn Attack penalty when burned', () => {
    const facade = createMove({
      id: 'facade',
      name: 'Facade',
      type: 'Normal',
      category: 'physical',
      power: 70,
    });
    const defender = createMockBattler({ types: ['Normal'] }); // Neutral
    const rng = new FixedSequenceRng([0.99, 1.0]); // Fixed damage roll without crit

    // Normal Facade
    const normalAttacker = createMockBattler({ status: 'none' });
    const normalResult = calculateDamage(normalAttacker, defender, facade, rng);

    // Burned Facade
    const burnedAttacker = createMockBattler({ status: 'burn' });
    const burnedResult = calculateDamage(burnedAttacker, defender, facade, rng);

    // Burned should deal approximately double damage, NOT halved by burn!
    expect(burnedResult.damage).toBeGreaterThan(normalResult.damage * 1.8);

    // Poisoned Facade
    const poisonedAttacker = createMockBattler({ status: 'poison' });
    const poisonedResult = calculateDamage(poisonedAttacker, defender, facade, rng);
    expect(poisonedResult.damage).toBe(burnedResult.damage);
  });

  it('Venoshock doubles power against poisoned or toxic targets', () => {
    const venoshock = createMove({
      id: 'venoshock',
      name: 'Venoshock',
      type: 'Poison',
      category: 'special',
      power: 65,
    });
    const attacker = createMockBattler({ types: ['Poison'] });
    const rng = new FixedSequenceRng([0.99, 1.0]);

    const normalDefender = createMockBattler({ types: ['Normal'], status: 'none' });
    const normalResult = calculateDamage(attacker, normalDefender, venoshock, rng);

    const toxicDefender = createMockBattler({ types: ['Normal'], status: 'toxic' });
    const toxicResult = calculateDamage(attacker, toxicDefender, venoshock, rng);

    expect(toxicResult.damage).toBeGreaterThan(normalResult.damage * 1.8);
  });

  it('Wake-Up Slap doubles power and wakes sleeping defender on hit', () => {
    const wakeUpSlap = createMove({
      id: 'wake_up_slap',
      name: 'Wake-Up Slap',
      type: 'Fighting',
      category: 'physical',
      power: 70,
    });
    const rng = new FixedSequenceRng([0.99, 1.0]);

    const attacker = createMockBattler({ types: ['Fighting'] });
    const awakeDefender = createMockBattler({ types: ['Normal'], status: 'none' });
    const awakeResult = calculateDamage(attacker, awakeDefender, wakeUpSlap, rng);

    const asleepDefender = createMockBattler({ types: ['Normal'], status: 'sleep' });
    const asleepResult = calculateDamage(attacker, asleepDefender, wakeUpSlap, rng);

    expect(asleepResult.damage).toBeGreaterThan(awakeResult.damage * 1.8);

    // Test BattleEngine waking effect
    const engine = new BattleEngine(attacker, asleepDefender, createMockEnvironment(), rng);
    const result = engine.executeAttack(attacker, asleepDefender, wakeUpSlap);

    expect(asleepDefender.status).toBe('none');
    expect(result.message).toContain('đã tỉnh giấc');
    expect(result.events.some((e) => e.type === 'status_cured')).toBe(true);
  });

  it('Stored Power and Power Trip scale with positive stat boosts only', () => {
    const storedPower = createMove({
      id: 'stored_power',
      name: 'Stored Power',
      type: 'Psychic',
      category: 'special',
      power: 20,
    });
    const powerTrip = createMove({
      id: 'power_trip',
      name: 'Power Trip',
      type: 'Dark',
      category: 'physical',
      power: 20,
    });
    const defender = createMockBattler({ types: ['Normal'] });
    const rng = new FixedSequenceRng([0.99, 1.0]);

    // Baseline 0 stages -> 20 power
    const neutralAttacker = createMockBattler();
    const baseResult = calculateDamage(neutralAttacker, defender, storedPower, rng);

    // +2 spAtk, +1 speed, but -2 defense -> total positive stages = 3 -> 20 + 20*3 = 80 power
    // note: spAtk stage also increases stat multiplier
    const boostedAttacker = createMockBattler({
      statStages: {
        attack: 0,
        defense: -2,
        spAtk: 2,
        spDef: 0,
        speed: 1,
        accuracy: 0,
        evasion: 0,
      },
    });
    const boostedResult = calculateDamage(boostedAttacker, defender, storedPower, rng);
    expect(boostedResult.damage).toBeGreaterThan(baseResult.damage * 3);

    // Power Trip behaves identically for positive stages
    const darkAttacker = createMockBattler({
      statStages: {
        attack: 1,
        defense: 1,
        spAtk: 0,
        spDef: 0,
        speed: 1,
        accuracy: 0,
        evasion: 0,
      },
    });
    const ptResult = calculateDamage(darkAttacker, defender, powerTrip, rng);
    expect(ptResult.damage).toBeGreaterThan(0);
  });

  it('Heavy Slam and Heat Crash scale with weight ratio between user and target', () => {
    const heavySlam = createMove({
      id: 'heavy_slam',
      name: 'Heavy Slam',
      type: 'Steel',
      category: 'physical',
      power: 40,
    });
    const rng = new FixedSequenceRng([0.99, 1.0]);

    // User 500kg, Target 50kg -> ratio 10 (>= 5) -> 120 power
    const heavyAttacker = createMockBattler({ weight: 500 });
    const lightDefender = createMockBattler({ weight: 50 });
    const highResult = calculateDamage(heavyAttacker, lightDefender, heavySlam, rng);

    // User 60kg, Target 50kg -> ratio 1.2 (< 2) -> 40 power
    const lightAttacker = createMockBattler({ weight: 60 });
    const lowResult = calculateDamage(lightAttacker, lightDefender, heavySlam, rng);

    expect(highResult.damage).toBeGreaterThan(lowResult.damage * 2.5);
  });

  it('Low Kick and Grass Knot scale with target weight brackets', () => {
    const lowKick = createMove({
      id: 'low_kick',
      name: 'Low Kick',
      type: 'Fighting',
      category: 'physical',
      power: 20,
    });
    const grassKnot = createMove({
      id: 'grass_knot',
      name: 'Grass Knot',
      type: 'Grass',
      category: 'special',
      power: 20,
    });
    const attacker = createMockBattler();
    const rng = new FixedSequenceRng([0.99, 1.0]);

    // Defender 250kg (>= 200kg) -> 120 power
    const heavyDefender = createMockBattler({ weight: 250, types: ['Normal'] });
    const heavyResult = calculateDamage(attacker, heavyDefender, lowKick, rng);

    // Defender 5kg (< 10kg) -> 20 power
    const tinyDefender = createMockBattler({ weight: 5, types: ['Normal'] });
    const tinyResult = calculateDamage(attacker, tinyDefender, lowKick, rng);

    expect(heavyResult.damage).toBeGreaterThan(tinyResult.damage * 4.5);

    // Grass Knot test
    const gkHeavy = calculateDamage(attacker, heavyDefender, grassKnot, rng);
    const gkTiny = calculateDamage(attacker, tinyDefender, grassKnot, rng);
    expect(gkHeavy.damage).toBeGreaterThan(gkTiny.damage * 4.5);
  });

  it('Electro Ball scales with user speed relative to target speed', () => {
    const electroBall = createMove({
      id: 'electro_ball',
      name: 'Electro Ball',
      type: 'Electric',
      category: 'special',
      power: 40,
    });
    const rng = new FixedSequenceRng([0.99, 1.0]);
    const defender = createMockBattler({ stats: { ...createMockBattler().stats, speed: 50 }, types: ['Normal'] });

    // Attacker speed 250 / Target speed 50 = 5.0 (>= 4.0) -> 150 power
    const fastAttacker = createMockBattler({ stats: { ...createMockBattler().stats, speed: 250 } });
    const fastResult = calculateDamage(fastAttacker, defender, electroBall, rng);

    // Attacker speed 30 / Target speed 50 = 0.6 (< 1.0) -> 40 power
    const slowAttacker = createMockBattler({ stats: { ...createMockBattler().stats, speed: 30 } });
    const slowResult = calculateDamage(slowAttacker, defender, electroBall, rng);

    expect(fastResult.damage).toBeGreaterThan(slowResult.damage * 3);
  });

  it('Gyro Ball scales inversely with user speed and directly with target speed', () => {
    const gyroBall = createMove({
      id: 'gyro_ball',
      name: 'Gyro Ball',
      type: 'Steel',
      category: 'physical',
      power: 1,
    });
    const rng = new FixedSequenceRng([0.99, 1.0]);
    const fastDefender = createMockBattler({ stats: { ...createMockBattler().stats, speed: 200 }, types: ['Normal'] });

    // Slow user: 20 speed. Formula: min(150, floor(25 * 200 / 20) + 1) = min(150, 251) = 150 power
    const slowAttacker = createMockBattler({ stats: { ...createMockBattler().stats, speed: 20 } });
    const highGyro = calculateDamage(slowAttacker, fastDefender, gyroBall, rng);

    // Fast user: 200 speed against slow target: 20 speed. Formula: floor(25 * 20 / 200) + 1 = 3 power
    const slowDefender = createMockBattler({ stats: { ...createMockBattler().stats, speed: 20 }, types: ['Normal'] });
    const fastAttacker = createMockBattler({ stats: { ...createMockBattler().stats, speed: 200 } });
    const lowGyro = calculateDamage(fastAttacker, slowDefender, gyroBall, rng);

    expect(highGyro.damage).toBeGreaterThan(lowGyro.damage * 10);
  });

  it('Last Respects scales with fainted allies count', () => {
    const lastRespects = createMove({
      id: 'last_respects',
      name: 'Last Respects',
      type: 'Ghost',
      category: 'physical',
      power: 50,
    });
    const defender = createMockBattler({ types: ['Psychic'] });
    const rng = new FixedSequenceRng([0.99, 1.0]);

    const zeroAllies = createMockBattler({ faintedAlliesCount: 0 });
    const zeroResult = calculateDamage(zeroAllies, defender, lastRespects, rng);

    const threeAllies = createMockBattler({ faintedAlliesCount: 3 }); // 50 + 50*3 = 200 power
    const threeResult = calculateDamage(threeAllies, defender, lastRespects, rng);

    expect(threeResult.damage).toBeGreaterThan(zeroResult.damage * 3.5);
  });

  it('Pledge moves increase to 150 power under pledgeCombo environment', () => {
    const grassPledge = createMove({
      id: 'grass_pledge',
      name: 'Grass Pledge',
      type: 'Grass',
      category: 'special',
      power: 80,
    });
    const defender = createMockBattler({ types: ['Normal'] });
    const rng = new FixedSequenceRng([0.99, 1.0]);
    const attacker = createMockBattler();

    const normalEnv = createMockEnvironment();
    const normalResult = calculateDamage(attacker, defender, grassPledge, rng, normalEnv);

    const comboEnv = createMockEnvironment({ pledgeCombo: true });
    const comboResult = calculateDamage(attacker, defender, grassPledge, rng, comboEnv);

    expect(comboResult.damage).toBeGreaterThan(normalResult.damage * 1.7);
  });

  it('Weather Ball and Terrain Pulse adapt type and power', () => {
    const weatherBall = createMove({
      id: 'weather_ball',
      name: 'Weather Ball',
      type: 'Normal',
      category: 'special',
      power: 50,
    });
    const terrainPulse = createMove({
      id: 'terrain_pulse',
      name: 'Terrain Pulse',
      type: 'Normal',
      category: 'special',
      power: 50,
    });
    const attacker = createMockBattler();
    const defender = createMockBattler({ types: ['Grass'] }); // Weak to Fire, Resists Water/Grass
    const rng = new FixedSequenceRng([0.99, 1.0]);

    // Weather Ball under Sun -> Fire type, 100 power, Super Effective on Grass
    const sunEnv = createMockEnvironment({ weather: { type: 'sun', turnsLeft: 5 } });
    const wbResult = calculateDamage(attacker, defender, weatherBall, rng, sunEnv);
    expect(wbResult.typeEffectiveness).toBe(2.0);

    // Terrain Pulse under Grassy Terrain -> Grass type, 100 power, Not Very Effective (0.5x) on Grass
    const grassyEnv = createMockEnvironment({ terrain: { type: 'grassy', turnsLeft: 5 } });
    const tpResult = calculateDamage(attacker, defender, terrainPulse, rng, grassyEnv);
    expect(tpResult.typeEffectiveness).toBe(0.5);
  });
});
