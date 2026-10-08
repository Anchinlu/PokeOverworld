import { describe, it, expect } from 'vitest';
import { createBattler, getBattleEnvironment, BattleEngine } from '../src/battle';
import type { BattleMove } from '../src/battle/types';
import type {
  MoveDeclaredEvent,
  DamageDealtEvent,
  RechargeHinderedEvent,
  SemiInvulnerableEnterEvent,
  SemiInvulnerableMissEvent,
  MultiHitCompletedEvent,
  StatStageChangedEvent,
  ProtectActivatedEvent,
  ProtectBlockedEvent,
  EndTurnDamageEvent,
  FaintedEvent,
} from '@pokemon/shared-types';

describe('Structured Battle Events System (Step 6)', () => {
  const env = getBattleEnvironment('meadow');

  const tackleMove: BattleMove = {
    id: 'tackle',
    name: 'Tackle (Húc Đầu)',
    nameVi: 'Húc Đầu',
    type: 'Normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: 'Tấn công đối thủ bằng toàn bộ cơ thể.',
  };

  const protectMove: BattleMove = {
    id: 'protect',
    name: 'Protect (Bảo Vệ)',
    nameVi: 'Bảo Vệ',
    type: 'Normal',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 10,
    maxPp: 10,
    priority: 4,
    description: 'Bảo vệ bản thân khỏi mọi đòn tấn công.',
  };

  const hyperBeam: BattleMove = {
    id: 'hyper_beam',
    name: 'Hyper Beam (Tia Hủy Diệt)',
    nameVi: 'Tia Hủy Diệt',
    type: 'Normal',
    category: 'special',
    power: 150,
    accuracy: 90,
    pp: 5,
    maxPp: 5,
    description: 'Bắn tia hủy diệt cực mạnh, phải nghỉ lượt sau.',
  };

  const flyMove: BattleMove = {
    id: 'fly',
    name: 'Fly (Bay Lên)',
    nameVi: 'Bay Lên',
    type: 'Flying',
    category: 'physical',
    power: 90,
    accuracy: 95,
    pp: 15,
    maxPp: 15,
    description: 'Bay lên trời trong lượt đầu và tấn công vào lượt kế.',
  };

  const doubleSlap: BattleMove = {
    id: 'double_slap',
    name: 'Double Slap (Vỗ Hai Lần)',
    nameVi: 'Vỗ Hai Lần',
    type: 'Normal',
    category: 'physical',
    power: 15,
    accuracy: 85,
    pp: 10,
    maxPp: 10,
    description: 'Tát liên hoàn 2-5 lần.',
  };

  const growlMove: BattleMove = {
    id: 'growl',
    name: 'Growl (Gầm Gừ)',
    nameVi: 'Gầm Gừ',
    type: 'Normal',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 40,
    maxPp: 40,
    description: 'Gầm gừ làm giảm Tấn Công của mục tiêu.',
    statChanges: [{ stat: 'attack', stages: -1, target: 'enemy' }],
  };

  it('generates move_declared and damage_dealt events for basic attack', () => {
    const player = createBattler('PIKACHU', 50, true);
    const enemy = createBattler('RATTATA', 50, false);
    const engine = new BattleEngine(player, enemy, env);

    const result = engine.executeAttack(player, enemy, tackleMove);
    expect(result.events).toBeDefined();
    expect(result.events.length).toBeGreaterThanOrEqual(2);

    const declared = result.events.find((e) => e.type === 'move_declared') as
      MoveDeclaredEvent | undefined;
    expect(declared).toBeDefined();
    expect(declared?.attackerSide).toBe('player');
    expect(declared?.attackerName).toBe('Pikachu');
    expect(declared?.moveId).toBe('tackle');

    const damageEvent = result.events.find((e) => e.type === 'damage_dealt') as
      DamageDealtEvent | undefined;
    expect(damageEvent).toBeDefined();
    expect(damageEvent?.targetSide).toBe('enemy');
    expect(damageEvent?.damage).toBe(result.damage);
    expect(damageEvent?.remainingHp).toBe(enemy.currentHp);
  });

  it('generates protect_activated and protect_blocked events', () => {
    const player = createBattler('BULBASAUR', 50, true);
    const enemy = createBattler('CHARMANDER', 50, false);
    const engine = new BattleEngine(player, enemy, env);

    // Bulb uses Protect
    const protectRes = engine.executeAttack(player, enemy, protectMove);
    const protectAct = protectRes.events.find((e) => e.type === 'protect_activated') as
      ProtectActivatedEvent | undefined;
    expect(protectAct).toBeDefined();
    expect(protectAct?.attackerSide).toBe('player');
    expect(protectAct?.success).toBe(true);

    // Charmander attacks with Tackle -> Blocked
    const attackRes = engine.executeAttack(enemy, player, tackleMove);
    expect(attackRes.damage).toBe(0);
    const blocked = attackRes.events.find((e) => e.type === 'protect_blocked') as
      ProtectBlockedEvent | undefined;
    expect(blocked).toBeDefined();
    expect(blocked?.defenderSide).toBe('player');
    expect(blocked?.defenderName).toBe('Bulbasaur');
  });

  it('generates recharge_hindered event on recharge turn', () => {
    const player = createBattler('SNORLAX', 50, true);
    const enemy = createBattler('RATTATA', 50, false);
    enemy.currentHp = 999;
    enemy.stats.hp = 999;
    const engine = new BattleEngine(player, enemy, env);

    // Turn 1: Hyper beam
    engine.executeAttack(player, enemy, hyperBeam);
    expect(player.mustRecharge).toBe(true);

    // Turn 2: Must recharge
    const rechargeRes = engine.executeAttack(player, enemy, tackleMove);
    expect(rechargeRes.damage).toBe(0);
    expect(player.mustRecharge).toBe(false);

    const hindered = rechargeRes.events.find((e) => e.type === 'recharge_hindered') as
      RechargeHinderedEvent | undefined;
    expect(hindered).toBeDefined();
    expect(hindered?.attackerSide).toBe('player');
    expect(hindered?.attackerName).toBe('Snorlax');
  });

  it('generates semi_invulnerable_enter and semi_invulnerable_miss events for Fly', () => {
    const player = createBattler('PIDGEY', 50, true);
    const enemy = createBattler('RATTATA', 50, false);
    const engine = new BattleEngine(player, enemy, env);

    // Turn 1: Player flies up
    const flyTurn1 = engine.executeAttack(player, enemy, flyMove);
    const enterEvent = flyTurn1.events.find((e) => e.type === 'semi_invulnerable_enter') as
      SemiInvulnerableEnterEvent | undefined;
    expect(enterEvent).toBeDefined();
    expect(enterEvent?.attackerSide).toBe('player');
    expect(enterEvent?.stance).toBe('flying');

    // Enemy tackles -> misses due to semi-invulnerable
    const enemyAttack = engine.executeAttack(enemy, player, tackleMove);
    expect(enemyAttack.damage).toBe(0);
    const missEvent = enemyAttack.events.find((e) => e.type === 'semi_invulnerable_miss') as
      SemiInvulnerableMissEvent | undefined;
    expect(missEvent).toBeDefined();
    expect(missEvent?.defenderSide).toBe('player');
    expect(missEvent?.stance).toBe('flying');
  });

  it('generates multi_hit_completed event with accurate hitsCount', () => {
    const player = createBattler('JIGGLYPUFF', 50, true);
    const enemy = createBattler('RATTATA', 50, false);
    enemy.currentHp = 999;
    enemy.stats.hp = 999;
    const engine = new BattleEngine(player, enemy, env);

    const multiRes = engine.executeAttack(player, enemy, doubleSlap);
    const multiEvent = multiRes.events.find((e) => e.type === 'multi_hit_completed') as
      MultiHitCompletedEvent | undefined;
    expect(multiEvent).toBeDefined();
    expect(multiEvent?.targetSide).toBe('enemy');
    expect(multiEvent?.hitsCount).toBeGreaterThanOrEqual(2);
    expect(multiEvent?.hitsCount).toBeLessThanOrEqual(5);
  });

  it('generates stat_stage_changed event for debuff moves', () => {
    const player = createBattler('BULBASAUR', 50, true);
    const enemy = createBattler('PIDGEY', 50, false);
    const engine = new BattleEngine(player, enemy, env);

    const growlRes = engine.executeAttack(player, enemy, growlMove);
    const statEvent = growlRes.events.find((e) => e.type === 'stat_stage_changed') as
      StatStageChangedEvent | undefined;
    expect(statEvent).toBeDefined();
    expect(statEvent?.targetSide).toBe('enemy');
    expect(statEvent?.targetName).toBe('Pidgey');
    expect(statEvent?.stat).toBe('attack');
    expect(statEvent?.change).toBe(-1);
  });

  it('generates fainted event when target HP reaches zero', () => {
    const player = createBattler('CHARIZARD', 100, true);
    const enemy = createBattler('CATERPIE', 1, false);
    enemy.currentHp = 1;
    enemy.stats.hp = 1;
    const engine = new BattleEngine(player, enemy, env);

    const result = engine.executeAttack(player, enemy, tackleMove);
    expect(result.defenderFainted).toBe(true);

    const faintedEvent = result.events.find((e) => e.type === 'fainted') as
      FaintedEvent | undefined;
    expect(faintedEvent).toBeDefined();
    expect(faintedEvent?.targetSide).toBe('enemy');
    expect(faintedEvent?.targetName).toBe('Caterpie');
  });

  it('generates end_turn_damage event during applyEndTurnEffects', () => {
    const player = createBattler('BULBASAUR', 50, true);
    const enemy = createBattler('PIDGEY', 50, false);
    const engine = new BattleEngine(player, enemy, env);

    player.status = 'burn';
    const endTurnRes = engine.applyEndTurnEffects(player, enemy);
    expect(endTurnRes).not.toBeNull();
    expect(endTurnRes?.events).toBeDefined();

    const burnEvent = endTurnRes?.events.find((e) => e.type === 'end_turn_damage') as
      EndTurnDamageEvent | undefined;
    expect(burnEvent).toBeDefined();
    expect(burnEvent?.targetSide).toBe('player');
    expect(burnEvent?.source).toBe('burn');
    expect(burnEvent?.damage).toBeGreaterThan(0);
  });
});
