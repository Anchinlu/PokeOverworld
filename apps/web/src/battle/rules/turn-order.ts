import type { BattlerPokemon, BattleMove } from '../types';
import type { BattleRng } from '../battle-rng';
import { getStatMultiplier } from '../state/battle-state-reducer';

import { PROTECT_MOVE_IDS } from './move-effect-engine';

import { HeldItemEngine } from './held-item-engine';

/**
 * Calculates effective combat speed of a battler, taking into account stat stages, paralysis, and held items.
 */
export function calculateEffectiveSpeed(battler: BattlerPokemon): number {
  const baseSpeed = battler.stats.speed;
  const speedStage = battler.statStages?.speed ?? 0;
  const stageMultiplier = getStatMultiplier(speedStage);
  const paralysisMultiplier = battler.status === 'paralysis' ? 0.5 : 1.0;
  const heldItemMultiplier = HeldItemEngine.getStatMultiplier(battler, 'speed');

  return baseSpeed * stageMultiplier * paralysisMultiplier * heldItemMultiplier;
}

/**
 * Determines whether the player or enemy attacks first.
 */
export function determineTurnOrder(
  playerPokemon: BattlerPokemon,
  playerMove: BattleMove,
  enemyPokemon: BattlerPokemon,
  enemyMove: BattleMove,
  rng: BattleRng
): 'player' | 'enemy' {
  let pPri = playerMove.priority ?? 0;
  let ePri = enemyMove.priority ?? 0;

  if (PROTECT_MOVE_IDS.has(playerMove.id.toLowerCase())) pPri = 4;
  if (PROTECT_MOVE_IDS.has(enemyMove.id.toLowerCase())) ePri = 4;

  if (pPri !== ePri) {
    return pPri > ePri ? 'player' : 'enemy';
  }

  const pSpeed = calculateEffectiveSpeed(playerPokemon);
  const eSpeed = calculateEffectiveSpeed(enemyPokemon);

  if (pSpeed === eSpeed) {
    return rng.next() < 0.5 ? 'player' : 'enemy';
  }

  return pSpeed > eSpeed ? 'player' : 'enemy';
}
