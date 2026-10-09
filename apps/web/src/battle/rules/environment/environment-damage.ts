import type { BattlerPokemon, BattleMove, BattleEnvironment } from '../../types';
import { getWeatherDamageMultiplier } from './weather-rules';
import { getTerrainDamageMultiplier } from './terrain-rules';

/**
 * Calculates combined damage multiplier from both weather and terrain.
 */
export function getEnvironmentDamageMultiplier(
  environment?: BattleEnvironment,
  move?: BattleMove,
  attacker?: BattlerPokemon,
  defender?: BattlerPokemon
): number {
  if (!environment || !move) return 1.0;

  const weatherMult = getWeatherDamageMultiplier(environment.weather?.type, move.type);
  const terrainMult = getTerrainDamageMultiplier(
    environment.terrain?.type,
    move.type,
    attacker,
    defender,
    move.id
  );

  return weatherMult * terrainMult;
}
