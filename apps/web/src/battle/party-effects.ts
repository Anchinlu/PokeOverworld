import type { BattlerSide } from './types';

/** Battle-facing port. Rules use this interface instead of importing PartyService. */
export interface BattlePartyEffects {
  healParty(side: BattlerSide, cureStatus: boolean): number;
  reviveOne(side: BattlerSide, hpRatio: number): boolean;
}
