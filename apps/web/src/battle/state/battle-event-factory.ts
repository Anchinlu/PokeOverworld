import type { BattleEvent, BattlerSide, StatusCondition } from '../types';

export const BattleEventFactory = {
  moveDeclared(
    attackerSide: BattlerSide,
    attackerName: string,
    moveId: string,
    moveName: string
  ): BattleEvent {
    return {
      type: 'move_declared',
      attackerSide,
      attackerName,
      moveId,
      moveName,
    };
  },

  rechargeHindered(attackerSide: BattlerSide, attackerName: string, message: string): BattleEvent {
    return {
      type: 'recharge_hindered',
      attackerSide,
      attackerName,
      message,
    };
  },

  statusHindered(
    attackerSide: BattlerSide,
    attackerName: string,
    status: StatusCondition,
    message: string
  ): BattleEvent {
    return {
      type: 'status_hindered',
      attackerSide,
      attackerName,
      status,
      message,
    };
  },

  statusCured(
    targetSide: BattlerSide,
    targetName: string,
    status: StatusCondition,
    message: string
  ): BattleEvent {
    return {
      type: 'status_cured',
      targetSide,
      targetName,
      status,
      message,
    };
  },

  protectActivated(
    attackerSide: BattlerSide,
    attackerName: string,
    success: boolean,
    message: string
  ): BattleEvent {
    return {
      type: 'protect_activated',
      attackerSide,
      attackerName,
      success,
      message,
    };
  },

  chargeBegin(
    attackerSide: BattlerSide,
    attackerName: string,
    moveId: string,
    moveName: string,
    message: string
  ): BattleEvent {
    return {
      type: 'charge_begin',
      attackerSide,
      attackerName,
      moveId,
      moveName,
      message,
    };
  },

  semiInvulnerableEnter(
    attackerSide: BattlerSide,
    attackerName: string,
    stance: 'flying' | 'underground' | 'underwater' | 'high',
    message: string
  ): BattleEvent {
    return {
      type: 'semi_invulnerable_enter',
      attackerSide,
      attackerName,
      stance,
      message,
    };
  },

  protectBlocked(
    defenderSide: BattlerSide,
    defenderName: string,
    attackerName: string,
    moveName: string,
    message: string
  ): BattleEvent {
    return {
      type: 'protect_blocked',
      defenderSide,
      defenderName,
      attackerName,
      moveName,
      message,
    };
  },

  semiInvulnerableMiss(
    defenderSide: BattlerSide,
    defenderName: string,
    stance: 'flying' | 'underground' | 'underwater' | 'high',
    message: string
  ): BattleEvent {
    return {
      type: 'semi_invulnerable_miss',
      defenderSide,
      defenderName,
      stance,
      message,
    };
  },

  accuracyMiss(
    attackerSide: BattlerSide,
    attackerName: string,
    moveName: string,
    message: string
  ): BattleEvent {
    return {
      type: 'accuracy_miss',
      attackerSide,
      attackerName,
      moveName,
      message,
    };
  },

  typeImmune(
    defenderSide: BattlerSide,
    defenderName: string,
    attackerName: string,
    moveName: string,
    message: string
  ): BattleEvent {
    return {
      type: 'type_immune',
      defenderSide,
      defenderName,
      attackerName,
      moveName,
      message,
    };
  },

  damageDealt(
    targetSide: BattlerSide,
    targetName: string,
    damage: number,
    remainingHp: number,
    maxHp: number,
    effectiveness: number,
    isCritical: boolean,
    hitsCount: number = 1,
    message: string = ''
  ): BattleEvent {
    return {
      type: 'damage_dealt',
      targetSide,
      targetName,
      damage,
      remainingHp,
      maxHp,
      effectiveness,
      isCritical,
      hitsCount,
      message,
    };
  },

  multiHitCompleted(targetSide: BattlerSide, hitsCount: number, message: string): BattleEvent {
    return {
      type: 'multi_hit_completed',
      targetSide,
      hitsCount,
      message,
    };
  },

  hpRestored(
    targetSide: BattlerSide,
    targetName: string,
    amount: number,
    remainingHp: number,
    maxHp: number,
    source: 'move' | 'item' | 'drain' | 'leech_seed',
    message: string
  ): BattleEvent {
    return {
      type: 'hp_restored',
      targetSide,
      targetName,
      amount,
      remainingHp,
      maxHp,
      source,
      message,
    };
  },

  recoilDamage(
    targetSide: BattlerSide,
    targetName: string,
    damage: number,
    remainingHp: number,
    message: string
  ): BattleEvent {
    return {
      type: 'recoil_damage',
      targetSide,
      targetName,
      damage,
      remainingHp,
      message,
    };
  },

  fainted(targetSide: BattlerSide, targetName: string, message: string): BattleEvent {
    return {
      type: 'fainted',
      targetSide,
      targetName,
      message,
    };
  },

  destinyBondTriggered(
    sourceSide: BattlerSide,
    sourceName: string,
    targetSide: BattlerSide,
    targetName: string,
    message: string
  ): BattleEvent {
    return {
      type: 'destiny_bond_triggered',
      sourceSide,
      sourceName,
      targetSide,
      targetName,
      message,
    };
  },

  statusInflicted(
    targetSide: BattlerSide,
    targetName: string,
    condition: StatusCondition,
    message: string
  ): BattleEvent {
    return {
      type: 'status_inflicted',
      targetSide,
      targetName,
      condition,
      message,
    };
  },

  statStageChanged(
    targetSide: BattlerSide,
    targetName: string,
    stat: string,
    change: number,
    currentStage: number,
    message: string
  ): BattleEvent {
    return {
      type: 'stat_stage_changed',
      targetSide,
      targetName,
      stat,
      change,
      currentStage,
      message,
    };
  },

  endTurnDamage(
    targetSide: BattlerSide,
    targetName: string,
    damage: number,
    remainingHp: number,
    source: 'burn' | 'poison' | 'toxic' | 'leech_seed',
    message: string
  ): BattleEvent {
    return {
      type: 'end_turn_damage',
      targetSide,
      targetName,
      damage,
      remainingHp,
      source,
      message,
    };
  },
};
