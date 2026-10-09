import { describe, it, expect } from 'vitest';
import {
  getWeatherDamageMultiplier,
  isWeatherDamageImmune,
  calculateEndTurnWeatherDamage,
  getWeatherAccuracyOverride,
  getWeatherMovePowerMultiplier,
  isGrounded,
  getTerrainDamageMultiplier,
  canApplyStatusInTerrain,
  canUsePriorityMoveInTerrain,
  calculateEndTurnTerrainHealing,
  getEnvironmentSpeedMultiplier,
  getEnvironmentDamageMultiplier,
} from '../src/battle/rules/environment';
import { calculateEffectiveSpeed } from '../src/battle/rules/turn-order';
import { calculateDamage } from '../src/battle/rules/damage-calculator';
import { processEndTurnEffects } from '../src/battle/rules/status-engine';
import { FixedSequenceRng } from '../src/battle/battle-rng';
import { createBattler, BattleEngine, getBattleEnvironment } from '../src/battle';
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
    id: 25,
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
    currentHp: 100,
    maxHp: 100,
    moves: [],
    frontSprite: '',
    backSprite: '',
    iconSprite: '',
    gender: 'male',
    isFainted: false,
    catchRate: 190,
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

describe('BattleEnvironmentRules Unit Tests', () => {
  describe('1. Weather Damage Multipliers', () => {
    it('boosts Water by 1.5x and reduces Fire by 0.5x in Rain', () => {
      expect(getWeatherDamageMultiplier('rain', 'Water')).toBe(1.5);
      expect(getWeatherDamageMultiplier('rain', 'Fire')).toBe(0.5);
      expect(getWeatherDamageMultiplier('rain', 'Electric')).toBe(1.0);
    });

    it('boosts Fire by 1.5x and reduces Water by 0.5x in Sun', () => {
      expect(getWeatherDamageMultiplier('sun', 'Fire')).toBe(1.5);
      expect(getWeatherDamageMultiplier('sun', 'Water')).toBe(0.5);
      expect(getWeatherDamageMultiplier('sun', 'Grass')).toBe(1.0);
    });

    it('returns 1.0 for neutral weather or other types', () => {
      expect(getWeatherDamageMultiplier('none', 'Fire')).toBe(1.0);
      expect(getWeatherDamageMultiplier(undefined, 'Water')).toBe(1.0);
      expect(getWeatherDamageMultiplier('sandstorm', 'Rock')).toBe(1.0);
    });
  });

  describe('2. Weather Speed Abilities (Swift Swim, Chlorophyll, Sand Rush, Slush Rush)', () => {
    it('doubles speed with Swift Swim in Rain', () => {
      const pkmn = createMockBattler({ ability: 'Swift Swim' });
      const envRain: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'rain', turnsLeft: 5 },
      };
      const envNone: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'none', turnsLeft: 0 },
      };

      expect(getEnvironmentSpeedMultiplier(pkmn, envRain)).toBe(2.0);
      expect(calculateEffectiveSpeed(pkmn, envRain)).toBe(200);
      expect(calculateEffectiveSpeed(pkmn, envNone)).toBe(100);
    });

    it('doubles speed with Chlorophyll in Sun', () => {
      const pkmn = createMockBattler({ ability: 'Chlorophyll' });
      const envSun: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'sun', turnsLeft: 5 },
      };

      expect(getEnvironmentSpeedMultiplier(pkmn, envSun)).toBe(2.0);
      expect(calculateEffectiveSpeed(pkmn, envSun)).toBe(200);
    });

    it('doubles speed with Sand Rush in Sandstorm and Slush Rush in Hail', () => {
      const sandPkmn = createMockBattler({ ability: 'Sand Rush' });
      const hailPkmn = createMockBattler({ ability: 'Slush Rush' });

      const envSand: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'sandstorm', turnsLeft: 5 },
      };
      const envHail: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'hail', turnsLeft: 5 },
      };

      expect(calculateEffectiveSpeed(sandPkmn, envSand)).toBe(200);
      expect(calculateEffectiveSpeed(hailPkmn, envHail)).toBe(200);
    });
  });

  describe('3. Weather End-of-Turn Damage & Immunities', () => {
    it('damages non-immune Pokémon in Sandstorm for 1/16 max HP', () => {
      const pikachu = createMockBattler({ types: ['Electric'], maxHp: 160, currentHp: 160 });
      const res = calculateEndTurnWeatherDamage(pikachu, 'sandstorm');

      expect(res).not.toBeNull();
      expect(res?.damage).toBe(10); // 160 / 16
      expect(res?.message).toContain('Bão cát');
    });

    it('grants Sandstorm immunity only to Rock, Ground, Steel, Overcoat, and Magic Guard', () => {
      const rockPkmn = createMockBattler({ types: ['Rock'] });
      const groundPkmn = createMockBattler({ types: ['Ground'] });
      const steelPkmn = createMockBattler({ types: ['Steel'] });
      const magicGuardPkmn = createMockBattler({ ability: 'Magic Guard', types: ['Normal'] });
      const overcoatPkmn = createMockBattler({ ability: 'Overcoat', types: ['Normal'] });

      expect(isWeatherDamageImmune(rockPkmn, 'sandstorm')).toBe(true);
      expect(isWeatherDamageImmune(groundPkmn, 'sandstorm')).toBe(true);
      expect(isWeatherDamageImmune(steelPkmn, 'sandstorm')).toBe(true);
      expect(isWeatherDamageImmune(magicGuardPkmn, 'sandstorm')).toBe(true);
      expect(isWeatherDamageImmune(overcoatPkmn, 'sandstorm')).toBe(true);

      expect(calculateEndTurnWeatherDamage(rockPkmn, 'sandstorm')).toBeNull();
      expect(calculateEndTurnWeatherDamage(magicGuardPkmn, 'sandstorm')).toBeNull();
    });

    it('confirms Sand Veil, Sand Rush, and Sand Force still take Sandstorm damage if not Rock/Ground/Steel', () => {
      const sandVeilPkmn = createMockBattler({
        ability: 'Sand Veil',
        types: ['Normal'],
        maxHp: 160,
        currentHp: 160,
      });
      const sandRushPkmn = createMockBattler({
        ability: 'Sand Rush',
        types: ['Normal'],
        maxHp: 160,
        currentHp: 160,
      });
      const sandForcePkmn = createMockBattler({
        ability: 'Sand Force',
        types: ['Normal'],
        maxHp: 160,
        currentHp: 160,
      });

      expect(isWeatherDamageImmune(sandVeilPkmn, 'sandstorm')).toBe(false);
      expect(isWeatherDamageImmune(sandRushPkmn, 'sandstorm')).toBe(false);
      expect(isWeatherDamageImmune(sandForcePkmn, 'sandstorm')).toBe(false);

      expect(calculateEndTurnWeatherDamage(sandVeilPkmn, 'sandstorm')?.damage).toBe(10);
      expect(calculateEndTurnWeatherDamage(sandRushPkmn, 'sandstorm')?.damage).toBe(10);
      expect(calculateEndTurnWeatherDamage(sandForcePkmn, 'sandstorm')?.damage).toBe(10);
    });

    it('damages non-Ice types in Hail and grants immunity only to Ice types, Overcoat, and Magic Guard', () => {
      const normalPkmn = createMockBattler({ types: ['Normal'], maxHp: 80, currentHp: 80 });
      const icePkmn = createMockBattler({ types: ['Ice'] });
      const overcoatPkmn = createMockBattler({ ability: 'Overcoat', types: ['Normal'] });
      const magicGuardPkmn = createMockBattler({ ability: 'Magic Guard', types: ['Normal'] });

      expect(calculateEndTurnWeatherDamage(normalPkmn, 'hail')?.damage).toBe(5); // 80 / 16
      expect(isWeatherDamageImmune(icePkmn, 'hail')).toBe(true);
      expect(isWeatherDamageImmune(overcoatPkmn, 'hail')).toBe(true);
      expect(isWeatherDamageImmune(magicGuardPkmn, 'hail')).toBe(true);
    });

    it('confirms Slush Rush, Snow Cloak, and Ice Body still take Hail damage if not Ice type', () => {
      const slushRushPkmn = createMockBattler({
        ability: 'Slush Rush',
        types: ['Normal'],
        maxHp: 80,
        currentHp: 80,
      });
      const snowCloakPkmn = createMockBattler({
        ability: 'Snow Cloak',
        types: ['Normal'],
        maxHp: 80,
        currentHp: 80,
      });
      const iceBodyPkmn = createMockBattler({
        ability: 'Ice Body',
        types: ['Normal'],
        maxHp: 80,
        currentHp: 80,
      });

      expect(isWeatherDamageImmune(slushRushPkmn, 'hail')).toBe(false);
      expect(isWeatherDamageImmune(snowCloakPkmn, 'hail')).toBe(false);
      expect(isWeatherDamageImmune(iceBodyPkmn, 'hail')).toBe(false);

      expect(calculateEndTurnWeatherDamage(slushRushPkmn, 'hail')?.damage).toBe(5);
      expect(calculateEndTurnWeatherDamage(snowCloakPkmn, 'hail')?.damage).toBe(5);
      expect(calculateEndTurnWeatherDamage(iceBodyPkmn, 'hail')?.damage).toBe(5);
    });
  });

  describe('4. Weather Move Interactions (Accuracy & Power)', () => {
    it('Thunder and Hurricane never miss in Rain, and have 50% accuracy in Sun', () => {
      expect(getWeatherAccuracyOverride('rain', 'thunder')?.isNeverMiss).toBe(true);
      expect(getWeatherAccuracyOverride('rain', 'hurricane')?.isNeverMiss).toBe(true);
      expect(getWeatherAccuracyOverride('sun', 'thunder')?.fixedAccuracy).toBe(50);
      expect(getWeatherAccuracyOverride('sun', 'hurricane')?.fixedAccuracy).toBe(50);
    });

    it('Blizzard never misses in Hail', () => {
      expect(getWeatherAccuracyOverride('hail', 'blizzard')?.isNeverMiss).toBe(true);
    });

    it('Solar Beam power is halved in Rain, Sandstorm, and Hail', () => {
      expect(getWeatherMovePowerMultiplier('rain', 'solar_beam')).toBe(0.5);
      expect(getWeatherMovePowerMultiplier('sandstorm', 'solarbeam')).toBe(0.5);
      expect(getWeatherMovePowerMultiplier('hail', 'solar_blade')).toBe(0.5);
      expect(getWeatherMovePowerMultiplier('sun', 'solar_beam')).toBe(1.0);
    });
  });

  describe('5. Grounding Checks (isGrounded)', () => {
    it('considers normal Pokémon grounded', () => {
      const pikachu = createMockBattler({ types: ['Electric'] });
      expect(isGrounded(pikachu)).toBe(true);
    });

    it('considers Flying-types, Levitate ability, and Air Balloon ungrounded', () => {
      const pidgeot = createMockBattler({ types: ['Normal', 'Flying'] });
      const gengar = createMockBattler({ ability: 'Levitate', types: ['Ghost', 'Poison'] });
      const balloonPkmn = createMockBattler({ heldItem: 'air-balloon' });

      expect(isGrounded(pidgeot)).toBe(false);
      expect(isGrounded(gengar)).toBe(false);
      expect(isGrounded(balloonPkmn)).toBe(false);
    });

    it('forces grounding when holding Iron Ball even for Flying types', () => {
      const heavyBird = createMockBattler({ types: ['Flying'], heldItem: 'iron-ball' });
      expect(isGrounded(heavyBird)).toBe(true);
    });
  });

  describe('6. Terrain Damage Multipliers', () => {
    it('Electric Terrain boosts Electric moves by 1.5x for grounded attackers', () => {
      const groundedPkmn = createMockBattler();
      const flyingPkmn = createMockBattler({ types: ['Flying'] });

      expect(getTerrainDamageMultiplier('electric', 'Electric', groundedPkmn)).toBe(1.5);
      expect(getTerrainDamageMultiplier('electric', 'Electric', flyingPkmn)).toBe(1.0);
    });

    it('Grassy Terrain boosts Grass moves by 1.5x and halves Earthquake against grounded target', () => {
      const groundedAttacker = createMockBattler();
      const groundedDefender = createMockBattler();
      const flyingDefender = createMockBattler({ types: ['Flying'] });

      expect(getTerrainDamageMultiplier('grassy', 'Grass', groundedAttacker)).toBe(1.5);
      expect(
        getTerrainDamageMultiplier(
          'grassy',
          'Ground',
          groundedAttacker,
          groundedDefender,
          'earthquake'
        )
      ).toBe(0.5);
      expect(
        getTerrainDamageMultiplier(
          'grassy',
          'Ground',
          groundedAttacker,
          groundedDefender,
          'magnitude'
        )
      ).toBe(0.5);
      expect(
        getTerrainDamageMultiplier(
          'grassy',
          'Ground',
          groundedAttacker,
          groundedDefender,
          'bulldoze'
        )
      ).toBe(0.5);
      // Not halved if defender is in air
      expect(
        getTerrainDamageMultiplier(
          'grassy',
          'Ground',
          groundedAttacker,
          flyingDefender,
          'earthquake'
        )
      ).toBe(1.0);
    });

    it('Psychic Terrain boosts Psychic moves by 1.5x for grounded attackers', () => {
      const groundedPkmn = createMockBattler();
      expect(getTerrainDamageMultiplier('psychic', 'Psychic', groundedPkmn)).toBe(1.5);
    });

    it('Misty Terrain halves Dragon damage against grounded targets', () => {
      const groundedDefender = createMockBattler();
      const flyingDefender = createMockBattler({ types: ['Flying'] });

      expect(getTerrainDamageMultiplier('misty', 'Dragon', undefined, groundedDefender)).toBe(0.5);
      expect(getTerrainDamageMultiplier('misty', 'Dragon', undefined, flyingDefender)).toBe(1.0);
    });
  });

  describe('7. Terrain Status & Priority Rules', () => {
    it('Electric Terrain blocks Sleep for grounded targets', () => {
      const grounded = createMockBattler();
      const flying = createMockBattler({ types: ['Flying'] });

      expect(canApplyStatusInTerrain('electric', 'sleep', grounded)).toBe(false);
      expect(canApplyStatusInTerrain('electric', 'sleep', flying)).toBe(true);
      expect(canApplyStatusInTerrain('electric', 'paralysis', grounded)).toBe(true);
    });

    it('Misty Terrain blocks all primary status conditions for grounded targets', () => {
      const grounded = createMockBattler();
      const flying = createMockBattler({ types: ['Flying'] });

      expect(canApplyStatusInTerrain('misty', 'burn', grounded)).toBe(false);
      expect(canApplyStatusInTerrain('misty', 'poison', grounded)).toBe(false);
      expect(canApplyStatusInTerrain('misty', 'paralysis', grounded)).toBe(false);
      expect(canApplyStatusInTerrain('misty', 'sleep', grounded)).toBe(false);
      expect(canApplyStatusInTerrain('misty', 'freeze', grounded)).toBe(false);

      expect(canApplyStatusInTerrain('misty', 'burn', flying)).toBe(true);
    });

    it('Psychic Terrain blocks priority moves (priority > 0) targeting grounded Pokémon', () => {
      const groundedTarget = createMockBattler();
      const flyingTarget = createMockBattler({ types: ['Flying'] });

      expect(canUsePriorityMoveInTerrain('psychic', 1, groundedTarget)).toBe(false);
      expect(canUsePriorityMoveInTerrain('psychic', 2, groundedTarget)).toBe(false);
      expect(canUsePriorityMoveInTerrain('psychic', 0, groundedTarget)).toBe(true);
      expect(canUsePriorityMoveInTerrain('psychic', 1, flyingTarget)).toBe(true);
    });

    it('Grassy Terrain heals grounded damaged Pokémon for 1/16 max HP at end of turn', () => {
      const damagedGrounded = createMockBattler({ maxHp: 160, currentHp: 100 });
      const fullHp = createMockBattler({ maxHp: 160, currentHp: 160 });
      const flyingDamaged = createMockBattler({ types: ['Flying'], maxHp: 160, currentHp: 100 });

      const res = calculateEndTurnTerrainHealing(damagedGrounded, 'grassy');
      expect(res).not.toBeNull();
      expect(res?.healAmount).toBe(10); // 160 / 16
      expect(res?.message).toContain('Thảm cỏ tươi tốt');

      expect(calculateEndTurnTerrainHealing(fullHp, 'grassy')).toBeNull();
      expect(calculateEndTurnTerrainHealing(flyingDamaged, 'grassy')).toBeNull();
    });
  });

  describe('8. Integrated Damage & End-of-Turn Engine Tests', () => {
    it('calculates composite environment damage multiplier combining weather and terrain', () => {
      const attacker = createMockBattler({ types: ['Water'] });
      const defender = createMockBattler({ types: ['Normal'] });
      const waterGun: BattleMove = {
        id: 'water_gun',
        name: 'Súng Nước',
        type: 'Water',
        category: 'special',
        power: 40,
        accuracy: 100,
        pp: 25,
        maxPp: 25,
        description: '',
      };
      const envRain: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'rain', turnsLeft: 5 },
      };

      expect(getEnvironmentDamageMultiplier(envRain, waterGun, attacker, defender)).toBe(1.5);
    });

    it('calculateDamage integrates Weather damage multiplier seamlessly', () => {
      const attacker = createMockBattler({ types: ['Water'] });
      const defender = createMockBattler({ types: ['Normal'] });
      const waterGun: BattleMove = {
        id: 'water_gun',
        name: 'Súng Nước',
        type: 'Water',
        category: 'special',
        power: 40,
        accuracy: 100,
        pp: 25,
        maxPp: 25,
        description: '',
      };

      const rng = new FixedSequenceRng([0.5, 0.5]);
      const envRain: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'rain', turnsLeft: 5 },
      };
      const envSun: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'sun', turnsLeft: 5 },
      };

      const dmgRain = calculateDamage(attacker, defender, waterGun, rng, envRain).damage;
      const dmgSun = calculateDamage(attacker, defender, waterGun, rng, envSun).damage;

      expect(dmgRain).toBeGreaterThan(dmgSun * 2.5); // 1.5 vs 0.5 = 3x ratio
    });

    it('processEndTurnEffects applies Sandstorm damage and Grassy Terrain healing concurrently', () => {
      const target = createMockBattler({
        types: ['Electric'],
        maxHp: 160,
        currentHp: 100,
      });

      const env: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'sandstorm', turnsLeft: 5 },
        terrain: { type: 'grassy', turnsLeft: 5 },
      };

      const res = processEndTurnEffects(target, 'player', undefined, undefined, env);
      expect(res).not.toBeNull();
      // Sandstorm damage = 10, Grassy terrain healing = 10. Net HP: 100 - 10 + 10 = 100
      expect(target.currentHp).toBe(100);
      expect(res?.events.some((e) => e.type === 'end_turn_damage')).toBe(true);
      expect(res?.events.some((e) => e.type === 'hp_restored')).toBe(true);
    });
  });

  describe('Weather and Terrain Creation Moves & Special Interactions', () => {
    it('creates Weather from moves (Sunny Day, Rain Dance, Sandstorm, Snowscape)', () => {
      const baseEnv = getBattleEnvironment('meadow');
      const player = createBattler('NINETALES', 50, true);
      const enemy = createBattler('BLASTOISE', 50, false);
      const engine = new BattleEngine(player, enemy, baseEnv);

      // 1. Sunny Day
      const sunnyDay: BattleMove = {
        id: 'sunny_day',
        name: 'Sunny Day',
        type: 'Fire',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 5,
        maxPp: 5,
        description: 'Intensifies the sun for 5 turns.',
      };
      const resSun = engine.executeAttack(player, enemy, sunnyDay);
      expect(engine.environment.weather?.type).toBe('sun');
      expect(engine.environment.weather?.turnsLeft).toBe(5);
      expect(resSun.message).toContain('Ánh nắng mặt trời trở nên gay gắt');

      // 2. Rain Dance
      const rainDance: BattleMove = {
        id: 'rain_dance',
        name: 'Rain Dance',
        type: 'Water',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 5,
        maxPp: 5,
        description: 'Summons heavy rain for 5 turns.',
      };
      const resRain = engine.executeAttack(player, enemy, rainDance);
      expect(engine.environment.weather?.type).toBe('rain');
      expect(engine.environment.weather?.turnsLeft).toBe(5);
      expect(resRain.message).toContain('đổ mưa rào lớn');

      // 3. Sandstorm
      const sandstormMove: BattleMove = {
        id: 'sandstorm',
        name: 'Sandstorm',
        type: 'Rock',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Summons a sandstorm for 5 turns.',
      };
      engine.executeAttack(player, enemy, sandstormMove);
      expect(engine.environment.weather?.type).toBe('sandstorm');

      // 4. Snowscape / Hail
      const snowscapeMove: BattleMove = {
        id: 'snowscape',
        name: 'Snowscape',
        type: 'Ice',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Summons snow for 5 turns.',
      };
      engine.executeAttack(player, enemy, snowscapeMove);
      expect(engine.environment.weather?.type).toBe('hail');
    });

    it('creates Terrain from moves (Electric, Grassy, Misty, Psychic Terrain)', () => {
      const baseEnv = getBattleEnvironment('meadow');
      const player = createBattler('TAPU_KOKO', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, baseEnv);

      // Electric Terrain
      const elecMove: BattleMove = {
        id: 'electric_terrain',
        name: 'Electric Terrain',
        type: 'Electric',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Electrifies the ground.',
      };
      engine.executeAttack(player, enemy, elecMove);
      expect(engine.environment.terrain?.type).toBe('electric');
      expect(engine.environment.terrain?.turnsLeft).toBe(5);

      // Grassy Terrain
      const grassMove: BattleMove = {
        id: 'grassy_terrain',
        name: 'Grassy Terrain',
        type: 'Grass',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Covers the ground in grass.',
      };
      engine.executeAttack(player, enemy, grassMove);
      expect(engine.environment.terrain?.type).toBe('grassy');

      // Misty Terrain
      const mistyMove: BattleMove = {
        id: 'misty_terrain',
        name: 'Misty Terrain',
        type: 'Fairy',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Covers ground in mist.',
      };
      engine.executeAttack(player, enemy, mistyMove);
      expect(engine.environment.terrain?.type).toBe('misty');

      // Psychic Terrain
      const psychMove: BattleMove = {
        id: 'psychic_terrain',
        name: 'Psychic Terrain',
        type: 'Psychic',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Covers ground in weird psychic power.',
      };
      engine.executeAttack(player, enemy, psychMove);
      expect(engine.environment.terrain?.type).toBe('psychic');
    });

    it('dynamically adapts Weather Ball power and type under weather', () => {
      const weatherBall: BattleMove = {
        id: 'weather_ball',
        name: 'Weather Ball',
        type: 'Normal',
        category: 'special',
        power: 50,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Power and type depend on weather.',
      };

      const attacker = createMockBattler({ types: ['Normal'], level: 50 });
      const grassDefender = createMockBattler({ types: ['Grass'], level: 50 });
      const fireDefender = createMockBattler({ types: ['Fire'], level: 50 });
      const rng = new FixedSequenceRng([0.5]);

      // Under Sun: Weather Ball becomes Fire-type, 100 power -> super effective on Grass!
      const envSun: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'sun', turnsLeft: 5 },
      };
      const resSun = calculateDamage(attacker, grassDefender, weatherBall, rng, envSun);
      expect(resSun.typeEffectiveness).toBe(2.0); // Fire vs Grass = 2x
      expect(resSun.damage).toBeGreaterThan(60);

      // Under Rain: Weather Ball becomes Water-type, 100 power -> super effective on Fire!
      const envRain: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'rain', turnsLeft: 5 },
      };
      const resRain = calculateDamage(attacker, fireDefender, weatherBall, rng, envRain);
      expect(resRain.typeEffectiveness).toBe(2.0); // Water vs Fire = 2x
      expect(resRain.damage).toBeGreaterThan(60);
    });

    it('dynamically boosts Terrain Pulse, Rising Voltage, and Expanding Force on terrain', () => {
      const attacker = createMockBattler({ types: ['Electric'], level: 50 });
      const defender = createMockBattler({ types: ['Water'], level: 50 });
      const rng = new FixedSequenceRng([0.5]);

      // Rising Voltage: 70 power normally, 140 on Electric Terrain against grounded target
      const risingVoltage: BattleMove = {
        id: 'rising_voltage',
        name: 'Rising Voltage',
        type: 'Electric',
        category: 'special',
        power: 70,
        accuracy: 100,
        pp: 20,
        maxPp: 20,
        description: 'Doubles power on Electric Terrain.',
      };

      const envNone: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
      };
      const envElec: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        terrain: { type: 'electric', turnsLeft: 5 },
      };

      const dmgNoTerrain = calculateDamage(attacker, defender, risingVoltage, rng, envNone).damage;
      const dmgElecTerrain = calculateDamage(attacker, defender, risingVoltage, rng, envElec).damage;

      // 140 power * 1.5x electric terrain damage multiplier = ~3x total damage!
      expect(dmgElecTerrain).toBeGreaterThan(dmgNoTerrain * 2.5);

      // Expanding Force: 80 power normally, 120 power on Psychic Terrain
      const psychicAttacker = createMockBattler({ types: ['Psychic'], level: 50 });
      const fightingDefender = createMockBattler({ types: ['Fighting'], level: 50 });
      const expandingForce: BattleMove = {
        id: 'expanding_force',
        name: 'Expanding Force',
        type: 'Psychic',
        category: 'special',
        power: 80,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Boosted on Psychic Terrain.',
      };
      const envPsychic: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        terrain: { type: 'psychic', turnsLeft: 5 },
      };
      const dmgExpBase = calculateDamage(psychicAttacker, fightingDefender, expandingForce, rng, envNone).damage;
      const dmgExpBoosted = calculateDamage(psychicAttacker, fightingDefender, expandingForce, rng, envPsychic).damage;
      expect(dmgExpBoosted).toBeGreaterThan(dmgExpBase * 2.0); // 1.5x power * 1.5x psychic terrain boost = 2.25x
    });

    it('counts down weather and terrain turns on round reset and clears them after 5 turns', () => {
      const baseEnv = getBattleEnvironment('meadow');
      baseEnv.weather = { type: 'sun', turnsLeft: 2 };
      baseEnv.terrain = { type: 'electric', turnsLeft: 1 };
      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, baseEnv);

      // Round 1 reset: Terrain expires (was 1), Weather decreases to 1
      const msgs1 = engine.resetRound();
      expect(engine.environment.terrain?.type).toBe('none');
      expect(msgs1.some((m) => m.includes('Dòng điện trên mặt đất đã biến mất'))).toBe(true);
      expect(engine.environment.weather?.type).toBe('sun');
      expect(engine.environment.weather?.turnsLeft).toBe(1);

      // Round 2 reset: Weather expires (was 1)
      const msgs2 = engine.resetRound();
      expect(engine.environment.weather?.type).toBe('none');
      expect(msgs2.some((m) => m.includes('Ánh nắng gay gắt đã dịu đi'))).toBe(true);
    });
  });
});

