/**
 * Canonical Structured Battle Events for Local Battles & LAN Multiplayer (N2)
 * Replaces unstructured string parsing with atomic, strongly-typed, verifiable event objects.
 * Compatible with WebSocket frames defined in docs/09-network-protocol.md.
 */

export type BattlerSide = 'player' | 'enemy';

export type BattleEventType =
  | 'move_declared'
  | 'charge_begin'
  | 'semi_invulnerable_enter'
  | 'protect_activated'
  | 'protect_blocked'
  | 'semi_invulnerable_miss'
  | 'accuracy_miss'
  | 'type_immune'
  | 'recharge_hindered'
  | 'status_hindered'
  | 'status_cured'
  | 'damage_dealt'
  | 'multi_hit_completed'
  | 'hp_restored'
  | 'recoil_damage'
  | 'stat_stage_changed'
  | 'status_inflicted'
  | 'fainted'
  | 'destiny_bond_triggered'
  | 'end_turn_damage';

export interface BaseBattleEvent {
  type: BattleEventType;
  message?: string;
}

export interface MoveDeclaredEvent extends BaseBattleEvent {
  type: 'move_declared';
  attackerSide: BattlerSide;
  attackerName: string;
  moveId: string;
  moveName: string;
}

export interface ChargeBeginEvent extends BaseBattleEvent {
  type: 'charge_begin';
  attackerSide: BattlerSide;
  attackerName: string;
  moveId: string;
  moveName: string;
}

export interface SemiInvulnerableEnterEvent extends BaseBattleEvent {
  type: 'semi_invulnerable_enter';
  attackerSide: BattlerSide;
  attackerName: string;
  stance: 'flying' | 'underground' | 'underwater' | 'high';
}

export interface ProtectActivatedEvent extends BaseBattleEvent {
  type: 'protect_activated';
  attackerSide: BattlerSide;
  attackerName: string;
  success: boolean;
}

export interface ProtectBlockedEvent extends BaseBattleEvent {
  type: 'protect_blocked';
  defenderSide: BattlerSide;
  defenderName: string;
  attackerName: string;
  moveName: string;
}

export interface SemiInvulnerableMissEvent extends BaseBattleEvent {
  type: 'semi_invulnerable_miss';
  defenderSide: BattlerSide;
  defenderName: string;
  stance: 'flying' | 'underground' | 'underwater' | 'high';
}

export interface AccuracyMissEvent extends BaseBattleEvent {
  type: 'accuracy_miss';
  attackerSide: BattlerSide;
  attackerName: string;
  moveName: string;
}

export interface TypeImmuneEvent extends BaseBattleEvent {
  type: 'type_immune';
  defenderSide: BattlerSide;
  defenderName: string;
  attackerName: string;
  moveName: string;
}

export interface RechargeHinderedEvent extends BaseBattleEvent {
  type: 'recharge_hindered';
  attackerSide: BattlerSide;
  attackerName: string;
}

export interface StatusHinderedEvent extends BaseBattleEvent {
  type: 'status_hindered';
  attackerSide: BattlerSide;
  attackerName: string;
  status: string;
}

export interface StatusCuredEvent extends BaseBattleEvent {
  type: 'status_cured';
  targetSide: BattlerSide;
  targetName: string;
  status: string;
}

export interface DamageDealtEvent extends BaseBattleEvent {
  type: 'damage_dealt';
  targetSide: BattlerSide;
  targetName: string;
  damage: number;
  remainingHp: number;
  maxHp: number;
  effectiveness: number;
  isCritical: boolean;
  hitsCount?: number;
}

export interface MultiHitCompletedEvent extends BaseBattleEvent {
  type: 'multi_hit_completed';
  targetSide: BattlerSide;
  hitsCount: number;
}

export interface HpRestoredEvent extends BaseBattleEvent {
  type: 'hp_restored';
  targetSide: BattlerSide;
  targetName: string;
  amount: number;
  remainingHp: number;
  maxHp: number;
  source: 'move' | 'drain' | 'item' | 'leech_seed';
}

export interface RecoilDamageEvent extends BaseBattleEvent {
  type: 'recoil_damage';
  targetSide: BattlerSide;
  targetName: string;
  damage: number;
  remainingHp: number;
}

export interface StatStageChangedEvent extends BaseBattleEvent {
  type: 'stat_stage_changed';
  targetSide: BattlerSide;
  targetName: string;
  stat: string;
  change: number;
  currentStage: number;
}

export interface StatusInflictedEvent extends BaseBattleEvent {
  type: 'status_inflicted';
  targetSide: BattlerSide;
  targetName: string;
  condition: string;
}

export interface FaintedEvent extends BaseBattleEvent {
  type: 'fainted';
  targetSide: BattlerSide;
  targetName: string;
}

export interface DestinyBondTriggeredEvent extends BaseBattleEvent {
  type: 'destiny_bond_triggered';
  sourceSide: BattlerSide;
  sourceName: string;
  targetSide: BattlerSide;
  targetName: string;
}

export interface EndTurnDamageEvent extends BaseBattleEvent {
  type: 'end_turn_damage';
  targetSide: BattlerSide;
  targetName: string;
  damage: number;
  remainingHp: number;
  source: 'burn' | 'poison' | 'toxic' | 'leech_seed';
}

export type BattleEvent =
  | MoveDeclaredEvent
  | ChargeBeginEvent
  | SemiInvulnerableEnterEvent
  | ProtectActivatedEvent
  | ProtectBlockedEvent
  | SemiInvulnerableMissEvent
  | AccuracyMissEvent
  | TypeImmuneEvent
  | RechargeHinderedEvent
  | StatusHinderedEvent
  | StatusCuredEvent
  | DamageDealtEvent
  | MultiHitCompletedEvent
  | HpRestoredEvent
  | RecoilDamageEvent
  | StatStageChangedEvent
  | StatusInflictedEvent
  | FaintedEvent
  | DestinyBondTriggeredEvent
  | EndTurnDamageEvent;
