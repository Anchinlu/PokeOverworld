export type BattleOutcome = 'caught' | 'defeated' | 'fled';

export interface WildlifeBattleEvent {
  entityId: string;
  speciesKey: string;
  outcome: BattleOutcome;
  timestamp: number;
}
