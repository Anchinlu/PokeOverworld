import type { BattlerPokemon, PokemonType, StatusCondition } from '../../types';
import { AbilityEngine } from '../ability-engine';

/**
 * Determines whether a Pokémon is grounded on the battle terrain.
 * A Pokémon is ungrounded if:
 * - It is Flying-type
 * - It has the Levitate ability
 * - It holds the Air Balloon item
 * (Unless holding an Iron Ball which forces grounding)
 */
export function isGrounded(battler: BattlerPokemon): boolean {
  const heldItem = (battler.heldItem ?? '').toLowerCase();
  if (heldItem === 'iron-ball') {
    return true;
  }

  if (battler.types.includes('Flying')) {
    return false;
  }

  const ability = AbilityEngine.normalize(battler.ability);
  if (ability === 'levitate') {
    return false;
  }

  if (heldItem === 'air-balloon') {
    return false;
  }

  return true;
}

const EARTHQUAKE_MOVES = new Set(['earthquake', 'magnitude', 'bulldoze']);

/**
 * Calculates damage multiplier for move type and special move interactions on terrain.
 * Gen 7 mechanics:
 * - Electric Terrain: 1.5x Electric attacks (used by grounded attacker).
 * - Grassy Terrain: 1.5x Grass attacks (used by grounded attacker); halves Earthquake, Magnitude, Bulldoze against grounded target.
 * - Psychic Terrain: 1.5x Psychic attacks (used by grounded attacker).
 * - Misty Terrain: Halves Dragon damage against grounded target.
 */
export function getTerrainDamageMultiplier(
  terrainType?: string,
  moveType?: PokemonType,
  attacker?: BattlerPokemon,
  target?: BattlerPokemon,
  moveId?: string
): number {
  if (!terrainType || !moveType) return 1.0;

  const attackerGrounded = attacker ? isGrounded(attacker) : true;
  const targetGrounded = target ? isGrounded(target) : true;
  const id = moveId ? moveId.toLowerCase() : '';

  if (terrainType === 'electric') {
    if (moveType === 'Electric' && attackerGrounded) {
      return 1.5;
    }
  } else if (terrainType === 'grassy') {
    if (moveType === 'Grass' && attackerGrounded) {
      return 1.5;
    }
    if (targetGrounded && EARTHQUAKE_MOVES.has(id)) {
      return 0.5;
    }
  } else if (terrainType === 'psychic') {
    if (moveType === 'Psychic' && attackerGrounded) {
      return 1.5;
    }
  } else if (terrainType === 'misty') {
    if (moveType === 'Dragon' && targetGrounded) {
      return 0.5;
    }
  }

  return 1.0;
}

/**
 * Determines whether a status condition can be inflicted on a Pokémon under the current terrain.
 * - Electric Terrain: grounded Pokémon cannot be put to sleep or rest.
 * - Misty Terrain: grounded Pokémon cannot be inflicted with any major status condition.
 */
export function canApplyStatusInTerrain(
  terrainType?: string,
  condition?: StatusCondition,
  target?: BattlerPokemon
): boolean {
  if (!terrainType || !condition || condition === 'none') {
    return true;
  }

  if (target && !isGrounded(target)) {
    return true;
  }

  if (terrainType === 'electric' && condition === 'sleep') {
    return false;
  }

  if (terrainType === 'misty' && condition !== 'none') {
    return false;
  }

  return true;
}

/**
 * Checks whether a priority move can be used against a target under terrain.
 * - Psychic Terrain: blocks priority moves (priority > 0) targeting grounded Pokémon.
 */
export function canUsePriorityMoveInTerrain(
  terrainType?: string,
  movePriority?: number,
  target?: BattlerPokemon
): boolean {
  if (!terrainType || terrainType !== 'psychic') {
    return true;
  }

  const priority = movePriority ?? 0;
  if (priority <= 0) {
    return true;
  }

  // If target is grounded, priority moves cannot hit it in Psychic Terrain
  if (target && isGrounded(target)) {
    return false;
  }

  return true;
}

export interface EndTurnTerrainHealingResult {
  healAmount: number;
  message: string;
}

/**
 * Calculates end-of-turn HP restoration from Grassy Terrain (1/16 max HP for grounded Pokémon).
 */
export function calculateEndTurnTerrainHealing(
  battler: BattlerPokemon,
  terrainType?: string
): EndTurnTerrainHealingResult | null {
  if (terrainType !== 'grassy') {
    return null;
  }

  if (battler.currentHp <= 0 || battler.isFainted) {
    return null;
  }

  if (battler.currentHp >= battler.maxHp) {
    return null;
  }

  if (!isGrounded(battler)) {
    return null;
  }

  const healAmount = Math.max(1, Math.floor(battler.maxHp / 16));
  const message = `Thảm cỏ tươi tốt giúp ${battler.name} hồi phục ${healAmount} HP!`;

  return {
    healAmount,
    message,
  };
}
