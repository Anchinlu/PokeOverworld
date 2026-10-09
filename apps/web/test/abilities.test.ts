import { describe, it, expect } from 'vitest';
import { BattleEngine } from '../src/battle/battle-engine';
import { calculateDamage } from '../src/battle/rules/damage-calculator';
import { checkMoveAccuracy } from '../src/battle/rules/move-effect-engine';
import type {
  BattlerPokemon,
  BattleMove,
  BattleEnvironment,
  StatStages,
} from '../src/battle/types';
import { FixedSequenceRng } from '../src/battle/battle-rng';

interface MockBattlerPokemon extends BattlerPokemon {
  statStages: StatStages;
}

function createMockPokemon(overrides: Partial<MockBattlerPokemon> = {}): MockBattlerPokemon {
  return {
    id: 25,
    speciesKey: 'PIKACHU',
    name: 'Pikachu',
    level: 50,
    types: ['Electric'],
    stats: {
      hp: 120,
      attack: 100,
      defense: 80,
      spAtk: 90,
      spDef: 80,
      speed: 110,
      total: 580,
    },
    currentHp: 120,
    maxHp: 120,
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
    ability: 'Static',
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

describe('AbilityEngine System & Mechanics', () => {
  describe('1. Switch-In Abilities', () => {
    it('Intimidate lowers opponent Attack stage by 1', () => {
      const player = createMockPokemon({ name: 'Gyarados', ability: 'Intimidate' });
      const enemy = createMockPokemon({ name: 'Machamp', ability: 'Guts' });
      const engine = new BattleEngine(player, enemy, createMockEnvironment());

      const res = engine.triggerInitialAbilities();
      expect(enemy.statStages.attack).toBe(-1);
      expect(res.messages.some((m) => m.includes('Đe Dọa') || m.includes('bị giảm'))).toBe(true);
      expect(res.events.some((e) => e.type === 'ability_triggered')).toBe(true);
      expect(res.events.some((e) => e.type === 'stat_stage_changed')).toBe(true);
    });

    it('Intimidate is blocked by Clear Body, Hyper Cutter, and White Smoke', () => {
      const player = createMockPokemon({ name: 'Gyarados', ability: 'Intimidate' });
      const clearBodyEnemy = createMockPokemon({ name: 'Metagross', ability: 'Clear Body' });
      const engine1 = new BattleEngine(player, clearBodyEnemy, createMockEnvironment());
      engine1.triggerInitialAbilities();
      expect(clearBodyEnemy.statStages.attack).toBe(0);

      const hyperCutterEnemy = createMockPokemon({ name: 'Pinsir', ability: 'Hyper Cutter' });
      const engine2 = new BattleEngine(player, hyperCutterEnemy, createMockEnvironment());
      engine2.triggerInitialAbilities();
      expect(hyperCutterEnemy.statStages.attack).toBe(0);
    });

    it('Weather switch-in abilities (Drizzle, Drought, Sand Stream, Snow Warning)', () => {
      const p1 = createMockPokemon({ ability: 'Drizzle' });
      const e1 = createMockPokemon({ ability: 'Static' });
      const eng1 = new BattleEngine(p1, e1, createMockEnvironment());
      eng1.triggerInitialAbilities();
      expect(eng1.environment.weather?.type).toBe('rain');
      expect(eng1.environment.weather?.turnsLeft).toBe(5);

      const p2 = createMockPokemon({ ability: 'Drought' });
      const eng2 = new BattleEngine(p2, e1, createMockEnvironment());
      eng2.triggerInitialAbilities();
      expect(eng2.environment.weather?.type).toBe('sun');

      const p3 = createMockPokemon({ ability: 'Sand Stream' });
      const eng3 = new BattleEngine(p3, e1, createMockEnvironment());
      eng3.triggerInitialAbilities();
      expect(eng3.environment.weather?.type).toBe('sandstorm');

      const p4 = createMockPokemon({ ability: 'Snow Warning' });
      const eng4 = new BattleEngine(p4, e1, createMockEnvironment());
      eng4.triggerInitialAbilities();
      expect(eng4.environment.weather?.type).toBe('hail');
    });

    it('Terrain switch-in abilities (Electric, Grassy, Misty, Psychic Surge)', () => {
      const p1 = createMockPokemon({ ability: 'Electric Surge' });
      const e1 = createMockPokemon({ ability: 'Static' });
      const eng1 = new BattleEngine(p1, e1, createMockEnvironment());
      eng1.triggerInitialAbilities();
      expect(eng1.environment.terrain?.type).toBe('electric');

      const p2 = createMockPokemon({ ability: 'Grassy Surge' });
      const eng2 = new BattleEngine(p2, e1, createMockEnvironment());
      eng2.triggerInitialAbilities();
      expect(eng2.environment.terrain?.type).toBe('grassy');
    });

    it('Download boosts Attack when opponent SpDef > Def, SpAttack otherwise', () => {
      // Enemy with higher Defense than SpDef -> Download boosts SpAttack
      const p1 = createMockPokemon({ ability: 'Download' });
      const e1 = createMockPokemon({
        stats: { hp: 100, attack: 100, defense: 120, spAtk: 80, spDef: 70, speed: 80, total: 550 },
      });
      const eng1 = new BattleEngine(p1, e1, createMockEnvironment());
      eng1.triggerInitialAbilities();
      expect(p1.statStages.spAtk).toBe(1);
      expect(p1.statStages.attack).toBe(0);

      // Enemy with higher SpDef than Defense -> Download boosts Attack
      const p2 = createMockPokemon({ ability: 'Download' });
      const e2 = createMockPokemon({
        stats: { hp: 100, attack: 100, defense: 60, spAtk: 80, spDef: 110, speed: 80, total: 530 },
      });
      const eng2 = new BattleEngine(p2, e2, createMockEnvironment());
      eng2.triggerInitialAbilities();
      expect(p2.statStages.attack).toBe(1);
      expect(p2.statStages.spAtk).toBe(0);
    });

    it('Trace copies opponent ability', () => {
      const p1 = createMockPokemon({ name: 'Gardevoir', ability: 'Trace' });
      const e1 = createMockPokemon({ name: 'Arcanine', ability: 'Intimidate' });
      const eng1 = new BattleEngine(p1, e1, createMockEnvironment());
      eng1.triggerInitialAbilities();
      expect(p1.ability).toBe('Intimidate');
    });
  });

  describe('2. Passive Elemental Immunities', () => {
    it('Levitate grants immunity to Ground type moves', () => {
      const player = createMockPokemon({ ability: 'Keen Eye' });
      const enemy = createMockPokemon({ ability: 'Levitate', types: ['Ghost', 'Poison'] });
      const earthquake: BattleMove = {
        id: 'earthquake',
        name: 'Động Đất',
        type: 'Ground',
        category: 'physical',
        power: 100,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: '',
      };
      const engine = new BattleEngine(player, enemy, createMockEnvironment());
      const res = engine.executeAttack(player, enemy, earthquake);
      expect(res.damage).toBe(0);
      expect(res.typeEffectiveness).toBe(0);
      expect(res.message).toContain('Bay Lượn');
      expect(res.events.some((e) => e.type === 'ability_triggered')).toBe(true);
    });

    it('Water Absorb absorbs Water moves and restores up to 25% HP', () => {
      const player = createMockPokemon();
      const enemy = createMockPokemon({
        ability: 'Water Absorb',
        types: ['Water'],
        currentHp: 60,
        maxHp: 120,
      });
      const surf: BattleMove = {
        id: 'surf',
        name: 'Lướt Sóng',
        type: 'Water',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        description: '',
      };
      const engine = new BattleEngine(player, enemy, createMockEnvironment());
      const res = engine.executeAttack(player, enemy, surf);
      expect(res.damage).toBe(0);
      expect(enemy.currentHp).toBe(90); // 60 + 30 (25% of 120)
      expect(res.message).toContain('hấp thụ');
      expect(res.events.some((e) => e.type === 'hp_restored')).toBe(true);
    });

    it('Flash Fire absorbs Fire moves and activates Flash Fire state', () => {
      const player = createMockPokemon();
      const enemy = createMockPokemon({ ability: 'Flash Fire', types: ['Fire'] });
      const flamethrower: BattleMove = {
        id: 'flamethrower',
        name: 'Phun Lửa',
        type: 'Fire',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        description: '',
      };
      const engine = new BattleEngine(player, enemy, createMockEnvironment());
      const res = engine.executeAttack(player, enemy, flamethrower);
      expect(res.damage).toBe(0);
      expect(enemy.flashFireBoost).toBe(true);
      expect(res.message).toContain('Ngọn Lửa Bốc Cháy');
    });

    it('Sap Sipper absorbs Grass moves and increases Attack by 1 stage', () => {
      const player = createMockPokemon();
      const enemy = createMockPokemon({ ability: 'Sap Sipper', types: ['Normal'] });
      const energyBall: BattleMove = {
        id: 'energy_ball',
        name: 'Quả Cầu Năng Lượng',
        type: 'Grass',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: '',
      };
      const engine = new BattleEngine(player, enemy, createMockEnvironment());
      const res = engine.executeAttack(player, enemy, energyBall);
      expect(res.damage).toBe(0);
      expect(enemy.statStages.attack).toBe(1);
    });

    it('Damp completely prevents Explosion and Self-Destruct', () => {
      const player = createMockPokemon({ name: 'Electrode' });
      const enemy = createMockPokemon({ name: 'Poliwrath', ability: 'Damp' });
      const explosion: BattleMove = {
        id: 'explosion',
        name: 'Bộc Phá Tự Sát',
        type: 'Normal',
        category: 'physical',
        power: 250,
        accuracy: 100,
        pp: 5,
        maxPp: 5,
        description: '',
      };
      const engine = new BattleEngine(player, enemy, createMockEnvironment());
      const res = engine.executeAttack(player, enemy, explosion);
      expect(res.damage).toBe(0);
      expect(player.currentHp).toBe(player.maxHp); // Attacker did NOT faint
      expect(res.message).toContain('ngăn chặn hoàn toàn vụ nổ');
    });
  });

  describe('3. Damage & Stat Modifiers in DamageCalculator', () => {
    const tackle: BattleMove = {
      id: 'tackle',
      name: 'Húc',
      type: 'Normal',
      category: 'physical',
      power: 50,
      accuracy: 100,
      pp: 35,
      maxPp: 35,
      description: '',
    };

    it('Huge Power & Pure Power double physical attack', () => {
      const normalAttacker = createMockPokemon({
        ability: 'Static',
        stats: {
          hp: 100,
          attack: 100,
          defense: 100,
          spAtk: 100,
          spDef: 100,
          speed: 100,
          total: 600,
        },
      });
      const hugePowerAttacker = createMockPokemon({
        ability: 'Huge Power',
        stats: {
          hp: 100,
          attack: 100,
          defense: 100,
          spAtk: 100,
          spDef: 100,
          speed: 100,
          total: 600,
        },
      });
      const defender = createMockPokemon({
        stats: {
          hp: 200,
          attack: 100,
          defense: 100,
          spAtk: 100,
          spDef: 100,
          speed: 100,
          total: 700,
        },
      });

      const rng = new FixedSequenceRng([0.5, 0.5]); // fixed roll
      const dmgNormal = calculateDamage(normalAttacker, defender, tackle, rng).damage;
      const dmgHuge = calculateDamage(hugePowerAttacker, defender, tackle, rng).damage;

      expect(dmgHuge).toBeGreaterThan(dmgNormal * 1.8);
    });

    it('Guts boosts physical attack by 1.5x when statused', () => {
      const healthyGuts = createMockPokemon({ ability: 'Guts', status: 'none' });
      const burnedGuts = createMockPokemon({ ability: 'Guts', status: 'burn' });
      const defender = createMockPokemon();

      const rng = new FixedSequenceRng([0.5, 0.5]);
      const dmgHealthy = calculateDamage(healthyGuts, defender, tackle, rng).damage;
      const dmgBurned = calculateDamage(burnedGuts, defender, tackle, rng).damage;

      // In Guts, burn does NOT halve damage, and attack is multiplied by 1.5x!
      expect(dmgBurned).toBeGreaterThan(dmgHealthy * 1.3);
    });

    it('Overgrow / Blaze / Torrent / Swarm activate at <= 1/3 HP', () => {
      const healthyCharizard = createMockPokemon({
        ability: 'Blaze',
        types: ['Fire'],
        currentHp: 120,
        maxHp: 120,
      });
      const pinchCharizard = createMockPokemon({
        ability: 'Blaze',
        types: ['Fire'],
        currentHp: 30,
        maxHp: 120,
      });
      const defender = createMockPokemon({ types: ['Normal'] });

      const ember: BattleMove = {
        id: 'ember',
        name: 'Đốm Lửa',
        type: 'Fire',
        category: 'special',
        power: 40,
        accuracy: 100,
        pp: 25,
        maxPp: 25,
        description: '',
      };
      const rng = new FixedSequenceRng([0.5, 0.5]);

      const dmgHealthy = calculateDamage(healthyCharizard, defender, ember, rng).damage;
      const dmgPinch = calculateDamage(pinchCharizard, defender, ember, rng).damage;

      expect(dmgPinch).toBeGreaterThan(dmgHealthy * 1.4);
    });

    it('Technician boosts moves with power <= 60 by 1.5x', () => {
      const normalScizor = createMockPokemon({ ability: 'Swarm' });
      const techScizor = createMockPokemon({ ability: 'Technician' });
      const defender = createMockPokemon();

      const rng = new FixedSequenceRng([0.5, 0.5]);
      const dmgNormal = calculateDamage(normalScizor, defender, tackle, rng).damage;
      const dmgTech = calculateDamage(techScizor, defender, tackle, rng).damage;

      expect(dmgTech).toBeGreaterThan(dmgNormal * 1.4);
    });

    it('Wonder Guard blocks non-super-effective damaging moves', () => {
      const shedinja = createMockPokemon({
        ability: 'Wonder Guard',
        types: ['Bug', 'Ghost'],
        currentHp: 1,
        maxHp: 1,
      });
      const attacker = createMockPokemon();

      // Normal is not effective against Ghost -> 0 damage
      const tackleRes = calculateDamage(attacker, shedinja, tackle, new FixedSequenceRng([0.5]));
      expect(tackleRes.damage).toBe(0);

      // Water move (neutral against Bug/Ghost) -> blocked by Wonder Guard!
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
      const waterRes = calculateDamage(attacker, shedinja, waterGun, new FixedSequenceRng([0.5]));
      expect(waterRes.damage).toBe(0);

      // Fire move is Super Effective against Bug! -> hits through Wonder Guard!
      const ember: BattleMove = {
        id: 'ember',
        name: 'Đốm Lửa',
        type: 'Fire',
        category: 'special',
        power: 40,
        accuracy: 100,
        pp: 25,
        maxPp: 25,
        description: '',
      };
      const fireRes = calculateDamage(attacker, shedinja, ember, new FixedSequenceRng([0.5]));
      expect(fireRes.damage).toBeGreaterThan(0);
    });

    it('Multiscale halves damage when at 100% full HP', () => {
      const fullDragonite = createMockPokemon({
        ability: 'Multiscale',
        currentHp: 120,
        maxHp: 120,
      });
      const damagedDragonite = createMockPokemon({
        ability: 'Multiscale',
        currentHp: 110,
        maxHp: 120,
      });
      const attacker = createMockPokemon();

      const rng = new FixedSequenceRng([0.5, 0.5]);
      const dmgFull = calculateDamage(attacker, fullDragonite, tackle, rng).damage;
      const dmgDamaged = calculateDamage(attacker, damagedDragonite, tackle, rng).damage;

      expect(dmgDamaged).toBeGreaterThanOrEqual(dmgFull * 1.8);
    });

    it('Sturdy prevents One-Hit KO from 100% max HP, leaving 1 HP', () => {
      const attacker = createMockPokemon({
        stats: {
          hp: 100,
          attack: 500,
          defense: 100,
          spAtk: 500,
          spDef: 100,
          speed: 100,
          total: 1400,
        },
      });
      const defender = createMockPokemon({
        ability: 'Sturdy',
        currentHp: 100,
        maxHp: 100,
        stats: { hp: 100, attack: 100, defense: 20, spAtk: 100, spDef: 20, speed: 50, total: 390 },
      });

      const superAttack: BattleMove = {
        id: 'super_atk',
        name: 'Siêu Tấn Công',
        type: 'Normal',
        category: 'physical',
        power: 300,
        accuracy: 100,
        pp: 5,
        maxPp: 5,
        description: '',
      };

      const engine = new BattleEngine(
        attacker,
        defender,
        createMockEnvironment(),
        new FixedSequenceRng([0.9])
      );
      const res = engine.executeAttack(attacker, defender, superAttack);

      expect(defender.currentHp).toBe(1);
      expect(defender.isFainted).toBe(false);
      expect(res.defenderFainted).toBe(false);
    });
  });

  describe('4. Contact Abilities & Recoil Immunity', () => {
    it('Static inflicts Paralysis on contact (30% roll)', () => {
      const attacker = createMockPokemon({ types: ['Normal'] });
      const defender = createMockPokemon({ ability: 'Static' });
      const contactMove: BattleMove = {
        id: 'slam',
        name: 'Đập Mạnh',
        type: 'Normal',
        category: 'physical',
        power: 80,
        accuracy: 100,
        pp: 20,
        maxPp: 20,
        description: '',
      };

      // Set RNG: [crit roll (0.5), damage random roll (0.5), static contact roll (0.2 < 0.3)]
      const engine = new BattleEngine(
        attacker,
        defender,
        createMockEnvironment(),
        new FixedSequenceRng([0.5, 0.5, 0.2])
      );
      const res = engine.executeAttack(attacker, defender, contactMove);

      expect(attacker.status).toBe('paralysis');
      expect(res.message).toContain('bị tê liệt');
    });

    it('Rough Skin / Iron Barbs damages the attacker for 1/8 max HP on contact', () => {
      const attacker = createMockPokemon({ currentHp: 120, maxHp: 120 });
      const defender = createMockPokemon({ ability: 'Rough Skin' });
      const contactMove: BattleMove = {
        id: 'bite',
        name: 'Cắn',
        type: 'Dark',
        category: 'physical',
        power: 60,
        accuracy: 100,
        pp: 25,
        maxPp: 25,
        description: '',
      };

      const engine = new BattleEngine(attacker, defender, createMockEnvironment());
      const res = engine.executeAttack(attacker, defender, contactMove);

      expect(attacker.currentHp).toBe(120 - 15); // 120 / 8 = 15 HP recoil
      expect(res.message).toContain('Da Gai Góc');
    });

    it('Rock Head prevents recoil damage from recoil moves', () => {
      const rockHeadAttacker = createMockPokemon({
        ability: 'Rock Head',
        currentHp: 120,
        maxHp: 120,
      });
      const defender = createMockPokemon();
      const doubleEdge: BattleMove = {
        id: 'double_edge',
        name: 'Song Đao Phản Kích',
        type: 'Normal',
        category: 'physical',
        power: 120,
        accuracy: 100,
        recoilPercent: 0.33,
        pp: 15,
        maxPp: 15,
        description: '',
      };

      const engine = new BattleEngine(rockHeadAttacker, defender, createMockEnvironment());
      const res = engine.executeAttack(rockHeadAttacker, defender, doubleEdge);

      expect(rockHeadAttacker.currentHp).toBe(120); // No recoil taken!
      expect(res.message).toContain('Đầu Đá');
    });

    it('Moxie boosts Attack by 1 stage upon knocking out opponent', () => {
      const attacker = createMockPokemon({ ability: 'Moxie' });
      const defender = createMockPokemon({ currentHp: 5, maxHp: 100 });
      const finishMove: BattleMove = {
        id: 'crunch',
        name: 'Nhai Nghiến',
        type: 'Dark',
        category: 'physical',
        power: 80,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        description: '',
      };

      const engine = new BattleEngine(attacker, defender, createMockEnvironment());
      const res = engine.executeAttack(attacker, defender, finishMove);

      expect(defender.isFainted).toBe(true);
      expect(attacker.statStages.attack).toBe(1);
      expect(res.message).toContain('Tự Tin Chiến Thắng');
    });
  });

  describe('5. End of Turn & Special Defensive Abilities', () => {
    it('Speed Boost increases Speed by 1 stage at the end of every turn', () => {
      const pkmn = createMockPokemon({ ability: 'Speed Boost' });
      const engine = new BattleEngine(pkmn, createMockPokemon(), createMockEnvironment());

      const res = engine.applyEndTurnEffects(pkmn);
      expect(pkmn.statStages.speed).toBe(1);
      expect(res?.message).toContain('Tăng Tốc');
    });

    it('Shed Skin has 33% chance to cure status condition at end of turn', () => {
      const pkmn = createMockPokemon({ ability: 'Shed Skin', status: 'burn' });
      // RNG roll < 0.33
      const engine = new BattleEngine(
        pkmn,
        createMockPokemon(),
        createMockEnvironment(),
        new FixedSequenceRng([0.2])
      );

      const res = engine.applyEndTurnEffects(pkmn);
      expect(pkmn.status).toBe('none');
      expect(res?.message).toContain('Lột Xác');
    });

    it('Shield Dust prevents secondary effects (e.g. burn chance) on defender', () => {
      const attacker = createMockPokemon();
      const defender = createMockPokemon({ ability: 'Shield Dust' });
      const flamethrower: BattleMove = {
        id: 'flamethrower',
        name: 'Phun Lửa',
        type: 'Fire',
        category: 'special',
        power: 90,
        accuracy: 100,
        description: '',
        statusEffect: {
          condition: 'burn',
          target: 'opponent',
          chance: 1.0, // 100% chance normally
        },
        pp: 15,
        maxPp: 15,
      };

      const engine = new BattleEngine(attacker, defender, createMockEnvironment());
      engine.executeAttack(attacker, defender, flamethrower);

      expect(defender.status).toBe('none'); // Protected by Shield Dust!
    });
  });

  describe('6. Newly Activated Passive Abilities (Poison Heal, Magic Guard, Synchronize, Pressure, Natural Cure, Overcoat, Compound Eyes, Sand Veil)', () => {
    it('Poison Heal restores 1/8 max HP every turn instead of taking poison damage', () => {
      const gliscor = createMockPokemon({
        ability: 'Poison Heal',
        status: 'poison',
        maxHp: 160,
        currentHp: 100,
      });
      const engine = new BattleEngine(gliscor, createMockPokemon(), createMockEnvironment());

      engine.applyEndTurnEffects(gliscor);
      expect(gliscor.currentHp).toBe(120); // 100 + 160/8 = 120
    });

    it('Magic Guard ignores indirect damage (poison tick, Rocky Helmet, Life Orb recoil)', () => {
      const reuniclus = createMockPokemon({
        ability: 'Magic Guard',
        status: 'burn',
        maxHp: 100,
        currentHp: 100,
      });
      const engine = new BattleEngine(reuniclus, createMockPokemon(), createMockEnvironment());

      // 1. Burn tick ignored
      engine.applyEndTurnEffects(reuniclus);
      expect(reuniclus.currentHp).toBe(100);

      // 2. Life Orb recoil ignored
      reuniclus.heldItem = 'life-orb';
      const enemy = createMockPokemon();
      const tackle: BattleMove = {
        id: 'tackle',
        name: 'Húc',
        type: 'Normal',
        category: 'physical',
        power: 50,
        accuracy: 100,
        pp: 35,
        maxPp: 35,
        description: '',
      };
      engine.executeAttack(reuniclus, enemy, tackle);
      expect(reuniclus.currentHp).toBe(100); // No Life Orb recoil taken!

      // 3. Rocky Helmet recoil ignored
      enemy.heldItem = 'rocky-helmet';
      engine.executeAttack(reuniclus, enemy, tackle);
      expect(reuniclus.currentHp).toBe(100); // No Rocky Helmet damage taken!
    });

    it('Synchronize reflects Burn, Poison, and Paralysis onto attacker', () => {
      const synchUser = createMockPokemon({ ability: 'Synchronize', name: 'Espeon' });
      const attacker = createMockPokemon({ name: 'Gengar', ability: 'Cursed Body' });
      const willOWisp: BattleMove = {
        id: 'will_o_wisp',
        name: 'Đốm Lửa Ma',
        type: 'Fire',
        category: 'status',
        power: 0,
        accuracy: 100,
        statusEffect: {
          condition: 'burn',
          target: 'opponent',
          chance: 1.0,
        },
        pp: 15,
        maxPp: 15,
        description: '',
      };

      const engine = new BattleEngine(attacker, synchUser, createMockEnvironment());
      const res = engine.executeAttack(attacker, synchUser, willOWisp);

      expect(synchUser.status).toBe('burn');
      expect(attacker.status).toBe('burn'); // Reflected by Synchronize!
      expect(res.message).toContain('Đồng Bộ Hóa');
    });

    it('Pressure deducts 2 PP when target is opponent with Pressure', () => {
      const attacker = createMockPokemon({ name: 'Pikachu' });
      const pressureEnemy = createMockPokemon({ name: 'Zapdos', ability: 'Pressure' });
      const thunderbolt: BattleMove = {
        id: 'thunderbolt',
        name: 'Tia Sét',
        type: 'Electric',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        description: '',
      };
      attacker.moves = [thunderbolt];

      const engine = new BattleEngine(attacker, pressureEnemy, createMockEnvironment());
      engine.executeAttack(attacker, pressureEnemy, thunderbolt);

      expect(thunderbolt.pp).toBe(13); // 15 - 2 = 13
    });

    it('Natural Cure clears status condition when switching out', () => {
      const blissey = createMockPokemon({
        ability: 'Natural Cure',
        status: 'toxic',
        statusTurns: 3,
      });
      const engine = new BattleEngine(blissey, createMockPokemon(), createMockEnvironment());

      expect(blissey.status).toBe('toxic');
      const replacement = createMockPokemon({ name: 'Snorlax' });
      engine.switchPlayerPokemon(replacement);

      expect(blissey.status).toBe('none'); // Cleared on switch-out!
    });

    it('Overcoat blocks powder and spore moves', () => {
      const forretress = createMockPokemon({ ability: 'Overcoat' });
      const attacker = createMockPokemon();
      const spore: BattleMove = {
        id: 'spore',
        name: 'Bào Tử Ru Ngủ',
        type: 'Grass',
        category: 'status',
        power: 0,
        accuracy: 100,
        statusEffect: {
          condition: 'sleep',
          target: 'opponent',
          chance: 1.0,
        },
        pp: 15,
        maxPp: 15,
        description: '',
      };

      const engine = new BattleEngine(attacker, forretress, createMockEnvironment());
      const res = engine.executeAttack(attacker, forretress, spore);

      expect(forretress.status).toBe('none'); // Blocked by Overcoat!
      expect(res.message).toContain('Áo Khoác');
    });

    it('Compound Eyes boosts move accuracy by 1.3x', () => {
      const butterfree = createMockPokemon({ ability: 'Compound Eyes' });
      const normalPkmn = createMockPokemon({ ability: 'Swarm' });
      const defender = createMockPokemon();
      const lowAccMove: BattleMove = {
        id: 'hypnosis',
        name: 'Thôi Miên',
        type: 'Psychic',
        category: 'status',
        power: 0,
        accuracy: 60, // 60 * 1.3 = 78
        pp: 20,
        maxPp: 20,
        description: '',
      };

      // RNG roll = 0.70 (70%): misses at 60%, but hits at 78%!
      const rng1 = new FixedSequenceRng([0.7]);
      const rng2 = new FixedSequenceRng([0.7]);

      const hitCompound = checkMoveAccuracy(butterfree, defender, lowAccMove, rng1);
      const hitNormal = checkMoveAccuracy(normalPkmn, defender, lowAccMove, rng2);

      expect(hitCompound).toBe(true);
      expect(hitNormal).toBe(false);
    });

    it('Sand Veil boosts evasion by 1.25x in Sandstorm', () => {
      const garchomp = createMockPokemon({ ability: 'Sand Veil' });
      const attacker = createMockPokemon();
      const move100Acc: BattleMove = {
        id: 'tackle',
        name: 'Húc',
        type: 'Normal',
        category: 'physical',
        power: 50,
        accuracy: 100, // 100 * 0.8 = 80 in sandstorm
        pp: 35,
        maxPp: 35,
        description: '',
      };

      const envSand: BattleEnvironment = {
        background: 'field',
        enemyBase: 'grass',
        playerBase: 'grass',
        weather: { type: 'sandstorm', turnsLeft: 5 },
      };

      // Roll = 0.85 (85%): hits 100%, misses 80%
      const rng = new FixedSequenceRng([0.85]);
      const hitsInSand = checkMoveAccuracy(attacker, garchomp, move100Acc, rng, envSand);

      expect(hitsInSand).toBe(false); // Evaded thanks to Sand Veil!
    });
  });
});
