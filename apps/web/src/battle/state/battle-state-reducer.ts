import type { BattlerPokemon, BattleMove, StatStages, StatusCondition } from '../types';

export type PokemonBattleStat = keyof StatStages;

export const STAT_NAME_VI: Record<string, string> = {
  attack: 'Tấn công',
  defense: 'Phòng thủ',
  spAtk: 'Công ĐB',
  spDef: 'Thủ ĐB',
  speed: 'Tốc độ',
  accuracy: 'Độ chính xác',
  evasion: 'Né tránh',
  hp: 'HP',
};

export const STATUS_NAME_VI: Record<string, string> = {
  burn: 'bỏng',
  poison: 'nhiễm độc',
  toxic: 'trúng độc cực mạnh',
  paralysis: 'tê liệt',
  sleep: 'ngủ say',
  freeze: 'đóng băng',
};

/** Official Pokémon stat stage multipliers (-6 to +6) */
export function getStatMultiplier(stage: number): number {
  const clamped = Math.max(-6, Math.min(6, stage));
  return clamped >= 0 ? (2 + clamped) / 2 : 2 / (2 - clamped);
}

/** Accuracy/Evasion stage multipliers */
export function getAccuracyMultiplier(accStage: number, evaStage: number): number {
  const diff = Math.max(-6, Math.min(6, accStage - evaStage));
  return diff >= 0 ? (3 + diff) / 3 : 3 / (3 - diff);
}

export function getMoveDisplayName(move: BattleMove): string {
  return (move.nameVi || move.name).replace(/^[^(]+\(([^)]+)\)$/, '$1').trim();
}

/**
 * Initializes and ensures all dynamic combat fields are present on a BattlerPokemon.
 */
export function ensureBattlerState(battler: BattlerPokemon): void {
  battler.statStages ??= {
    attack: 0,
    defense: 0,
    spAtk: 0,
    spDef: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0,
  };
  battler.status ??= 'none';
  battler.sleepTurns ??= 0;
  battler.statusTurns ??= 0;
  battler.protectSuccessiveUses ??= 0;
  battler.isProtected ??= false;
  battler.mustRecharge ??= false;
  battler.isSeeded ??= false;
  battler.destinyBond ??= false;
  battler.isFlinched ??= false;
  battler.confusionTurns ??= 0;
  battler.hasActedThisRound ??= false;
  battler.firstTurnInBattle ??= true;
  battler.hasAquaRing ??= false;
  battler.isIngrained ??= false;
  battler.safeguardTurns ??= 0;
  battler.isTrapped ??= false;
  battler.tauntTurns ??= 0;
  battler.isTormented ??= false;
  battler.throatChopTurns ??= 0;
  battler.uproarTurns ??= 0;
}

/**
 * Resets per-round combat flags and flinch status after both battlers conclude the round.
 */
export function resetRoundCombatFlags(player: BattlerPokemon, enemy: BattlerPokemon): void {
  player.isFlinched = false;
  player.hasActedThisRound = false;
  player.firstTurnInBattle = false;
  player.isProtected = false;

  enemy.isFlinched = false;
  enemy.hasActedThisRound = false;
  enemy.firstTurnInBattle = false;
  enemy.isProtected = false;
}

/**
 * Modifies a Pokémon's stat stage clamped to [-6, +6].
 * Returns the effective stage change.
 */
export function applyStatStageChange(
  battler: BattlerPokemon,
  stat: PokemonBattleStat,
  changeDelta: number
): number {
  ensureBattlerState(battler);
  const stages = battler.statStages!;
  const prev = stages[stat];
  stages[stat] = Math.max(-6, Math.min(6, prev + changeDelta));
  return stages[stat] - prev;
}

/**
 * Resets all temporary in-battle stat changes to neutral (0).
 */
export function resetStatStages(battler: BattlerPokemon): void {
  ensureBattlerState(battler);
  battler.statStages = {
    attack: 0,
    defense: 0,
    spAtk: 0,
    spDef: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0,
  };
}

/**
 * Applies HP damage to a battler and returns actual damage dealt and whether it fainted.
 */
export function applyDamage(
  battler: BattlerPokemon,
  damageAmount: number
): { actualDamage: number; fainted: boolean } {
  ensureBattlerState(battler);
  const prevHp = battler.currentHp;
  battler.currentHp = Math.max(0, battler.currentHp - damageAmount);
  const actualDamage = prevHp - battler.currentHp;
  const fainted = battler.currentHp <= 0;
  if (fainted) {
    battler.isFainted = true;
  }
  return { actualDamage, fainted };
}

/**
 * Restores HP to a battler and returns actual amount healed.
 */
export function restoreHp(battler: BattlerPokemon, healAmount: number): number {
  ensureBattlerState(battler);
  const prevHp = battler.currentHp;
  battler.currentHp = Math.min(battler.maxHp, battler.currentHp + healAmount);
  return battler.currentHp - prevHp;
}

/**
 * Sets a battler's primary status condition.
 */
export function setStatusCondition(
  battler: BattlerPokemon,
  condition: StatusCondition,
  initialSleepTurns: number = 0
): void {
  ensureBattlerState(battler);
  battler.status = condition;
  battler.statusTurns = 0;
  battler.sleepTurns = initialSleepTurns;
}

/**
 * Clears primary status condition.
 */
export function clearStatusCondition(battler: BattlerPokemon): void {
  ensureBattlerState(battler);
  battler.status = 'none';
  battler.statusTurns = 0;
  battler.sleepTurns = 0;
}
