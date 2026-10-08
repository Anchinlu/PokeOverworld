import { describe, it, expect } from 'vitest';
import {
  calculateDamage,
  calculateSingleHitBaseDamage,
  getTypeEffectiveness,
  isTypeImmune,
  checkPreTurnStatus,
  processEndTurnEffects,
  determineTurnOrder,
  calculateEffectiveSpeed,
  checkMoveAccuracy,
  checkSemiInvulnerableHit,
  applyStatStageChange,
  resetStatStages,
  BattleEventFactory,
  createBattler,
  type BattleRng,
  type BattleMove,
} from '../src/battle';

function createMockRng(values: number[]): BattleRng {
  let idx = 0;
  return {
    next: () => {
      const val = values[idx % values.length] ?? 0.5;
      idx++;
      return val;
    },
    nextInt: (min: number, max: number) => {
      const val = values[idx % values.length] ?? 0.5;
      idx++;
      return Math.floor(min + val * (max - min + 1));
    },
  };
}

describe('Battle Rules Engine Isolation', () => {
  const tackle: BattleMove = {
    id: 'tackle',
    name: 'Tackle',
    type: 'Normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: 'A full-body charge attack.',
  };

  const flamethrower: BattleMove = {
    id: 'flamethrower',
    name: 'Flamethrower',
    type: 'Fire',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    maxPp: 15,
    description: 'Scorches the target with fire.',
  };

  describe('Type Effectiveness Rule', () => {
    it('calculates standard type advantages and immunities', () => {
      expect(getTypeEffectiveness('Fire', ['Grass'])).toBe(2);
      expect(getTypeEffectiveness('Water', ['Fire'])).toBe(2);
      expect(getTypeEffectiveness('Normal', ['Ghost'])).toBe(0);
      expect(isTypeImmune('Normal', ['Ghost'])).toBe(true);
      expect(isTypeImmune('Electric', ['Ground'])).toBe(true);
      expect(isTypeImmune('Fire', ['Grass'])).toBe(false);
    });

    it('calculates dual-type compound multipliers', () => {
      expect(getTypeEffectiveness('Fire', ['Grass', 'Bug'])).toBe(4);
      expect(getTypeEffectiveness('Grass', ['Water', 'Ground'])).toBe(4);
      expect(getTypeEffectiveness('Fire', ['Water', 'Rock'])).toBe(0.25);
    });
  });

  describe('Turn Order & Speed Rule', () => {
    it('ranks priority moves ahead of normal moves', () => {
      const slowMon = createBattler('bulbasaur', 50);
      slowMon.stats.speed = 10;
      const fastMon = createBattler('pikachu', 50);
      fastMon.stats.speed = 200;
      const quickAttack: BattleMove = { ...tackle, id: 'quick_attack', priority: 1 };
      const rng = createMockRng([0.1]);

      const first = determineTurnOrder(slowMon, quickAttack, fastMon, tackle, rng);
      expect(first).toBe('player');
    });

    it('accounts for paralysis speed debuff (-50%)', () => {
      const player = createBattler('bulbasaur', 50);
      player.stats.speed = 100;
      const enemy = createBattler('charmander', 50);
      enemy.stats.speed = 60;

      expect(calculateEffectiveSpeed(player)).toBe(100);
      player.status = 'paralysis';
      expect(calculateEffectiveSpeed(player)).toBe(50);

      const rng = createMockRng([0.1]);
      const first = determineTurnOrder(player, tackle, enemy, tackle, rng);
      expect(first).toBe('enemy');
    });
  });

  describe('Damage Calculator Rule', () => {
    it('calculates deterministic physical damage with Gen 7 floor rules', () => {
      const attacker = createBattler('bulbasaur', 50);
      attacker.stats.attack = 100;
      const defender = createBattler('charmander', 50);
      defender.stats.defense = 100;
      const rng = createMockRng([0.5, 0.5]); // no crit, middle damage roll

      const result = calculateDamage(attacker, defender, tackle, rng);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.isCritical).toBe(false);
      expect(result.typeEffectiveness).toBe(1.0);
    });

    it('calculates base damage scaling for special attack', () => {
      const attacker = createBattler('charmander', 50);
      attacker.stats.spAtk = 150;
      const defender = createBattler('bulbasaur', 50);
      defender.stats.spDef = 80;

      const { baseDmg } = calculateSingleHitBaseDamage(attacker, defender, flamethrower, 90);
      expect(baseDmg).toBeGreaterThan(30);
    });
  });

  describe('Status Engine Rule', () => {
    it('applies burn and poison end-turn damage', () => {
      const burned = createBattler('bulbasaur', 50);
      burned.maxHp = 160;
      burned.currentHp = 160;
      burned.status = 'burn';

      const burnResult = processEndTurnEffects(burned, 'player');
      expect(burnResult).not.toBeNull();
      expect(burnResult!.damage).toBe(10); // 160 / 16 = 10
      expect(burned.currentHp).toBe(150);

      const poisoned = createBattler('charmander', 50);
      poisoned.maxHp = 160;
      poisoned.currentHp = 160;
      poisoned.status = 'poison';

      const psnResult = processEndTurnEffects(poisoned, 'enemy');
      expect(psnResult).not.toBeNull();
      expect(psnResult!.damage).toBe(20); // 160 / 8 = 20
      expect(poisoned.currentHp).toBe(140);
    });

    it('hinders pokemon turn when frozen unless thawed', () => {
      const frozen = createBattler('bulbasaur', 50);
      frozen.status = 'freeze';

      const rngNoThaw = createMockRng([0.5]); // > 0.2 -> frozen
      const resHindered = checkPreTurnStatus(frozen, 'player', rngNoThaw);
      expect(resHindered.canAct).toBe(false);
      expect(frozen.status).toBe('freeze');

      const rngThaw = createMockRng([0.1]); // < 0.2 -> thawed
      const resThawed = checkPreTurnStatus(frozen, 'player', rngThaw);
      expect(resThawed.canAct).toBe(true);
      expect(frozen.status).toBe('none');
    });
  });

  describe('Move Effect Engine & State Reducer', () => {
    it('modifies stat stages within [-6, +6] bounds', () => {
      const mon = createBattler('bulbasaur', 50);
      const delta1 = applyStatStageChange(mon, 'attack', 2);
      expect(delta1).toBe(2);
      expect(mon.statStages?.attack).toBe(2);

      const delta2 = applyStatStageChange(mon, 'attack', 5);
      expect(delta2).toBe(4); // clamped to 6
      expect(mon.statStages?.attack).toBe(6);

      resetStatStages(mon);
      expect(mon.statStages?.attack).toBe(0);
    });

    it('evaluates move accuracy and semi-invulnerable bypasses', () => {
      const attacker = createBattler('bulbasaur', 50);
      const defender = createBattler('charmander', 50);
      const rngHit = createMockRng([0.5]); // roll 50% vs 100% -> hit

      expect(checkMoveAccuracy(attacker, defender, tackle, rngHit)).toBe(true);

      defender.semiInvulnerable = 'flying';
      const groundCheck = checkSemiInvulnerableHit(defender, 'earthquake');
      expect(groundCheck.canHit).toBe(false);

      const thunderCheck = checkSemiInvulnerableHit(defender, 'thunder');
      expect(thunderCheck.canHit).toBe(true);
    });

    it('creates typed events with BattleEventFactory', () => {
      const evt = BattleEventFactory.damageDealt(
        'enemy',
        'Charmander',
        25,
        75,
        100,
        2.0,
        true,
        1,
        'Critical hit!'
      );
      expect(evt.type).toBe('damage_dealt');
      expect(evt.damage).toBe(25);
      expect(evt.isCritical).toBe(true);
    });
  });
});
