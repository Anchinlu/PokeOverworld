import type {
  BattlerSide,
  StatusCondition,
  MoveDeclaredEvent,
  RechargeHinderedEvent,
  StatusHinderedEvent,
  StatusCuredEvent,
  ProtectActivatedEvent,
  ProtectBlockedEvent,
  ChargeBeginEvent,
  SemiInvulnerableEnterEvent,
  SemiInvulnerableMissEvent,
  AccuracyMissEvent,
  TypeImmuneEvent,
  DamageDealtEvent,
  MultiHitCompletedEvent,
  HpRestoredEvent,
  RecoilDamageEvent,
  StatStageChangedEvent,
  StatusInflictedEvent,
  FaintedEvent,
  DestinyBondTriggeredEvent,
  EndTurnDamageEvent,
  AbilityTriggeredEvent,
} from '../types';

export const BattleEventFactory = {
  moveDeclared(
    attackerSide: BattlerSide,
    attackerName: string,
    moveId: string,
    moveName: string
  ): MoveDeclaredEvent {
    return {
      type: 'move_declared',
      attackerSide,
      attackerName,
      moveId,
      moveName,
    };
  },

  rechargeHindered(
    attackerSide: BattlerSide,
    attackerName: string,
    message: string
  ): RechargeHinderedEvent {
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
    status: StatusCondition | string,
    message: string
  ): StatusHinderedEvent {
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
    status: StatusCondition | string,
    message: string
  ): StatusCuredEvent {
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
  ): ProtectActivatedEvent {
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
  ): ChargeBeginEvent {
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
  ): SemiInvulnerableEnterEvent {
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
  ): ProtectBlockedEvent {
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
  ): SemiInvulnerableMissEvent {
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
  ): AccuracyMissEvent {
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
  ): TypeImmuneEvent {
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
  ): DamageDealtEvent {
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

  multiHitCompleted(
    targetSide: BattlerSide,
    hitsCount: number,
    message: string
  ): MultiHitCompletedEvent {
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
    source: 'move' | 'item' | 'drain' | 'leech_seed' | 'terrain' | 'held_item',
    message: string
  ): HpRestoredEvent {
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
  ): RecoilDamageEvent {
    return {
      type: 'recoil_damage',
      targetSide,
      targetName,
      damage,
      remainingHp,
      message,
    };
  },

  fainted(targetSide: BattlerSide, targetName: string, message: string): FaintedEvent {
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
  ): DestinyBondTriggeredEvent {
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
    condition: StatusCondition | string,
    message: string
  ): StatusInflictedEvent {
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
  ): StatStageChangedEvent {
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
    source: 'burn' | 'poison' | 'toxic' | 'leech_seed' | 'sandstorm' | 'hail' | 'bind' | string,
    message: string
  ): EndTurnDamageEvent {
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

  abilityTriggered(
    targetSide: BattlerSide,
    targetName: string,
    ability: string,
    abilityNameVi: string,
    effect: string,
    message: string
  ): AbilityTriggeredEvent {
    return {
      type: 'ability_triggered',
      targetSide,
      targetName,
      ability,
      abilityNameVi,
      effect,
      message,
    };
  },
};
