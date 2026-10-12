import { describe, it, expect, beforeEach } from 'vitest';
import { BattleEngine } from '../src/battle/battle-engine';
import { determineTurnOrder } from '../src/battle/rules/turn-order';
import { MOVES_DB } from '../src/battle/moves-db';
import type { BattlerPokemon, BattleEnvironment, StatStages } from '../src/battle/types';
import { SeededBattleRng, type BattleRng } from '../src/battle/battle-rng';

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
    moves: [
      MOVES_DB['quick_attack'] ?? {
        id: 'quick_attack',
        name: 'Quick Attack',
        type: 'Normal',
        category: 'physical',
        power: 40,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
        description: 'Attacks first',
      },
    ],
    frontSprite: '',
    backSprite: '',
    iconSprite: '',
    gender: 'genderless',
    isFainted: false,
    catchRate: 255,
    exp: 0,
    maxExp: 100,
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

describe('Switching & Phazing Battle Mechanics', () => {
  let env: BattleEnvironment;
  let rng: BattleRng;

  beforeEach(() => {
    env = {
      background: 'field',
      enemyBase: 'base',
      playerBase: 'base',
    };
    rng = new SeededBattleRng(42);
  });

  describe('Turn Order Priority for Phazing Moves', () => {
    it('forces Roar, Whirlwind, Dragon Tail, and Circle Throw to move at -6 priority', () => {
      const fastPikachu = createMockBattler({
        stats: {
          hp: 100,
          attack: 100,
          defense: 100,
          spAtk: 100,
          spDef: 100,
          speed: 200,
          total: 700,
        },
      });
      const slowSnorlax = createMockBattler({
        stats: {
          hp: 100,
          attack: 100,
          defense: 100,
          spAtk: 100,
          spDef: 100,
          speed: 30,
          total: 530,
        },
      });

      const tackleMove = MOVES_DB['tackle'];
      const dragonTailMove = MOVES_DB['dragon_tail'];
      const roarMove = MOVES_DB['roar'];

      // Fast Pikachu uses Dragon Tail (-6), Slow Snorlax uses Tackle (0) -> Snorlax must go first!
      const firstAttacker1 = determineTurnOrder(
        fastPikachu,
        dragonTailMove,
        slowSnorlax,
        tackleMove,
        rng,
        env
      );
      expect(firstAttacker1).toBe('enemy');

      // Fast Pikachu uses Roar (-6), Slow Snorlax uses Tackle (0) -> Snorlax must go first!
      const firstAttacker2 = determineTurnOrder(
        fastPikachu,
        roarMove,
        slowSnorlax,
        tackleMove,
        rng,
        env
      );
      expect(firstAttacker2).toBe('enemy');
    });
  });

  describe('Self-Switching Attacking Moves (U-turn, Volt Switch, Flip Turn)', () => {
    it('sets mustSwitch=true and switchSide=player after hitting with U-turn', () => {
      const player = createMockBattler({ name: 'Scizor', moves: [MOVES_DB['u_turn']] });
      const enemy = createMockBattler({ name: 'Snorlax', currentHp: 200, maxHp: 200 });
      const engine = new BattleEngine(player, enemy, env, rng, true);

      const res = engine.executeAttack(player, enemy, MOVES_DB['u_turn']);
      expect(res.damage).toBeGreaterThan(0);
      expect(res.mustSwitch).toBe(true);
      expect(res.switchSide).toBe('player');
      expect(res.isForcedSwitch).toBeFalsy();
    });

    it('sets mustSwitch=true and switchSide=enemy after enemy hits with Volt Switch', () => {
      const player = createMockBattler({ name: 'Snorlax', currentHp: 200, maxHp: 200 });
      const enemy = createMockBattler({ name: 'Rotom', moves: [MOVES_DB['volt_switch']] });
      const engine = new BattleEngine(player, enemy, env, rng, true);

      const res = engine.executeAttack(enemy, player, MOVES_DB['volt_switch']);
      expect(res.damage).toBeGreaterThan(0);
      expect(res.mustSwitch).toBe(true);
      expect(res.switchSide).toBe('enemy');
      expect(res.isForcedSwitch).toBeFalsy();
    });

    it('sets mustSwitch=true after hitting with Flip Turn', () => {
      const player = createMockBattler({ name: 'Swampert', moves: [MOVES_DB['flip_turn']] });
      const enemy = createMockBattler({ name: 'Snorlax', currentHp: 200, maxHp: 200 });
      const engine = new BattleEngine(player, enemy, env, rng, true);

      const res = engine.executeAttack(player, enemy, MOVES_DB['flip_turn']);
      expect(res.damage).toBeGreaterThan(0);
      expect(res.mustSwitch).toBe(true);
      expect(res.switchSide).toBe('player');
    });
  });

  describe('Support Self-Switching Moves', () => {
    it('baton_pass passes stat stages, substitute, and seeded status in batonPassData', () => {
      const player = createMockBattler({
        name: 'Ninjask',
        statStages: {
          attack: 2,
          defense: 0,
          spAtk: 0,
          spDef: 0,
          speed: 4,
          accuracy: 0,
          evasion: 0,
        },
        hasAquaRing: true,
        substituteHp: 25,
      });
      const enemy = createMockBattler({ name: 'Snorlax' });
      const engine = new BattleEngine(player, enemy, env, rng, true);

      const res = engine.executeAttack(player, enemy, MOVES_DB['baton_pass']);
      expect(res.mustSwitch).toBe(true);
      expect(res.switchSide).toBe('player');
      expect(res.batonPassData).toBeDefined();
      expect(res.batonPassData?.statStages?.speed).toBe(4);
      expect(res.batonPassData?.statStages?.attack).toBe(2);
      expect(res.batonPassData?.hasAquaRing).toBe(true);
      expect(res.batonPassData?.substituteHp).toBe(25);
    });

    it('parting_shot debuffs target and triggers self-switch', () => {
      const player = createMockBattler({ name: 'Incineroar' });
      const enemy = createMockBattler({
        name: 'Garchomp',
        statStages: {
          attack: 0,
          defense: 0,
          spAtk: 0,
          spDef: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      });
      const engine = new BattleEngine(player, enemy, env, rng, true);

      const res = engine.executeAttack(player, enemy, MOVES_DB['parting_shot']);
      expect(enemy.statStages.attack).toBe(-1);
      expect(res.mustSwitch).toBe(true);
      expect(res.switchSide).toBe('player');
    });

    it('chilly_reception summons hail and triggers self-switch', () => {
      const player = createMockBattler({ name: 'Slowking' });
      const enemy = createMockBattler({ name: 'Garchomp' });
      const engine = new BattleEngine(player, enemy, env, rng, true);

      const res = engine.executeAttack(player, enemy, MOVES_DB['chilly_reception']);
      expect(env.weather?.type).toBe('hail');
      expect(res.mustSwitch).toBe(true);
      expect(res.switchSide).toBe('player');
    });

    it('shed_tail costs 50% HP and passes a substitute to incoming teammate', () => {
      const player = createMockBattler({ name: 'Cyclizar', currentHp: 100, maxHp: 100 });
      const enemy = createMockBattler({ name: 'Garchomp' });
      const engine = new BattleEngine(player, enemy, env, rng, true);

      const res = engine.executeAttack(player, enemy, MOVES_DB['shed_tail']);
      expect(player.currentHp).toBe(50);
      expect(res.mustSwitch).toBe(true);
      expect(res.batonPassData?.substituteHp).toBe(25);
    });

    it('shed_tail fails if user HP is 50% or less', () => {
      const player = createMockBattler({ name: 'Cyclizar', currentHp: 50, maxHp: 100 });
      const enemy = createMockBattler({ name: 'Garchomp' });
      const engine = new BattleEngine(player, enemy, env, rng, true);

      const res = engine.executeAttack(player, enemy, MOVES_DB['shed_tail']);
      expect(player.currentHp).toBe(50);
      expect(res.mustSwitch).toBeFalsy();
    });

    it('teleport flees in wild battle, but switches in trainer battle', () => {
      const player = createMockBattler({ name: 'Abra' });
      const wildEnemy = createMockBattler({ name: 'Pidgey' });

      // 1. Wild battle
      const wildEngine = new BattleEngine(player, wildEnemy, env, rng, true);
      const wildRes = wildEngine.executeAttack(player, wildEnemy, MOVES_DB['teleport']);
      expect(wildRes.battleEnded).toBe(true);
      expect(wildRes.battleEndReason).toBe('fled');

      // 2. Trainer battle
      const trainerEngine = new BattleEngine(player, wildEnemy, env, rng, false);
      const trainerRes = trainerEngine.executeAttack(player, wildEnemy, MOVES_DB['teleport']);
      expect(trainerRes.mustSwitch).toBe(true);
      expect(trainerRes.switchSide).toBe('player');
      expect(trainerRes.battleEnded).toBeFalsy();
    });
  });

  describe('Phazing & Forced-Switch Moves (Roar, Whirlwind, Dragon Tail, Circle Throw)', () => {
    it('Roar forces wild Pokémon to flee in wild battles', () => {
      const player = createMockBattler({ name: 'Arcanine' });
      const wildEnemy = createMockBattler({ name: 'Wild Pidgey' });
      const engine = new BattleEngine(player, wildEnemy, env, rng, true);

      const res = engine.executeAttack(player, wildEnemy, MOVES_DB['roar']);
      expect(res.battleEnded).toBe(true);
      expect(res.battleEndReason).toBe('roar');
      expect(res.mustSwitch).toBeFalsy();
    });

    it('Whirlwind forces wild Pokémon to flee in wild battles', () => {
      const player = createMockBattler({ name: 'Pidgeot' });
      const wildEnemy = createMockBattler({ name: 'Wild Rattata' });
      const engine = new BattleEngine(player, wildEnemy, env, rng, true);

      const res = engine.executeAttack(player, wildEnemy, MOVES_DB['whirlwind']);
      expect(res.battleEnded).toBe(true);
      expect(res.battleEndReason).toBe('roar');
    });

    it('Roar forces defender to switch (isForcedSwitch=true) in Trainer battles', () => {
      const player = createMockBattler({ name: 'Arcanine' });
      const trainerEnemy = createMockBattler({ name: 'Trainer Venusaur' });
      const engine = new BattleEngine(player, trainerEnemy, env, rng, false); // isWild = false

      const res = engine.executeAttack(player, trainerEnemy, MOVES_DB['roar']);
      expect(res.battleEnded).toBeFalsy();
      expect(res.mustSwitch).toBe(true);
      expect(res.switchSide).toBe('enemy');
      expect(res.isForcedSwitch).toBe(true);
    });

    it('Dragon Tail deals damage and blows away wild Pokémon in wild battles', () => {
      const player = createMockBattler({ name: 'Dragonite' });
      const wildEnemy = createMockBattler({ name: 'Wild Rattata', currentHp: 200, maxHp: 200 });
      const engine = new BattleEngine(player, wildEnemy, env, rng, true);

      const res = engine.executeAttack(player, wildEnemy, MOVES_DB['dragon_tail']);
      expect(res.damage).toBeGreaterThan(0);
      expect(res.battleEnded).toBe(true);
      expect(res.battleEndReason).toBe('roar');
    });

    it('Circle Throw deals damage and forces enemy switch in Trainer battles', () => {
      const player = createMockBattler({ name: 'Poliwrath' });
      const trainerEnemy = createMockBattler({
        name: 'Trainer Snorlax',
        currentHp: 200,
        maxHp: 200,
      });
      const engine = new BattleEngine(player, trainerEnemy, env, rng, false); // isWild = false

      const res = engine.executeAttack(player, trainerEnemy, MOVES_DB['circle_throw']);
      expect(res.damage).toBeGreaterThan(0);
      expect(res.mustSwitch).toBe(true);
      expect(res.switchSide).toBe('enemy');
      expect(res.isForcedSwitch).toBe(true);
    });

    it('Suction Cups ability blocks forced switch and wild flee', () => {
      const player = createMockBattler({ name: 'Arcanine' });
      const suctionEnemy = createMockBattler({ name: 'Octillery', ability: 'Suction Cups' });

      // Wild battle with Suction Cups
      const wildEngine = new BattleEngine(player, suctionEnemy, env, rng, true);
      const wildRes = wildEngine.executeAttack(player, suctionEnemy, MOVES_DB['roar']);
      expect(wildRes.battleEnded).toBeFalsy();
      expect(wildRes.mustSwitch).toBeFalsy();

      // Dragon tail damage works, but phaze is blocked
      const dtRes = wildEngine.executeAttack(player, suctionEnemy, MOVES_DB['dragon_tail']);
      expect(dtRes.damage).toBeGreaterThan(0);
      expect(dtRes.battleEnded).toBeFalsy();
      expect(dtRes.mustSwitch).toBeFalsy();
    });

    it('Ingrain status blocks forced switch and wild flee', () => {
      const player = createMockBattler({ name: 'Arcanine' });
      const ingrainedEnemy = createMockBattler({ name: 'Cradily', isIngrained: true });
      const engine = new BattleEngine(player, ingrainedEnemy, env, rng, true);

      const res = engine.executeAttack(player, ingrainedEnemy, MOVES_DB['whirlwind']);
      expect(res.battleEnded).toBeFalsy();
      expect(res.mustSwitch).toBeFalsy();
    });

    it('Soundproof ability is immune to Roar', () => {
      const player = createMockBattler({ name: 'Arcanine' });
      const soundproofEnemy = createMockBattler({ name: 'Exploud', ability: 'Soundproof' });
      const engine = new BattleEngine(player, soundproofEnemy, env, rng, false);

      const res = engine.executeAttack(player, soundproofEnemy, MOVES_DB['roar']);
      expect(res.mustSwitch).toBeFalsy();
      expect(res.message).toContain('Cách Âm');
    });

    it('Substitute blocks Dragon Tail forced switch', () => {
      const player = createMockBattler({ name: 'Dragonite' });
      const subEnemy = createMockBattler({
        name: 'Gengar',
        substituteHp: 50,
        currentHp: 100,
        maxHp: 100,
      });
      const engine = new BattleEngine(player, subEnemy, env, rng, false);

      const res = engine.executeAttack(player, subEnemy, MOVES_DB['dragon_tail']);
      // Substitute absorbed or broke, phaze must NOT trigger
      expect(res.mustSwitch).toBeFalsy();
      expect(res.message.toLowerCase()).toContain('thế thân');
    });
  });
});
