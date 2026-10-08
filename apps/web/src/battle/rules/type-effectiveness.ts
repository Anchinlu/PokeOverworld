import type { PokemonType } from '@pokemon/shared-types';
import { getTypeEffectiveness as getBaseTypeEffectiveness, TYPE_CHART } from '../type-chart';

export { TYPE_CHART };

/**
 * Returns the damage multiplier based on attack type and defender types.
 * Multipliers: 0 (immune), 0.25 (doubly resisted), 0.5 (resisted), 1 (neutral), 2 (super effective), 4 (doubly effective)
 */
export function getTypeEffectiveness(attackType: PokemonType, defenseTypes: PokemonType[]): number {
  return getBaseTypeEffectiveness(attackType, defenseTypes);
}

/**
 * Checks if the defending Pokémon is completely immune (0x damage) to an attack type.
 */
export function isTypeImmune(attackType: PokemonType, defenseTypes: PokemonType[]): boolean {
  return getTypeEffectiveness(attackType, defenseTypes) === 0;
}
