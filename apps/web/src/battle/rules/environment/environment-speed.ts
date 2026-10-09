import type { BattlerPokemon, BattleEnvironment } from '../../types';
import { AbilityEngine } from '../ability-engine';

/**
 * Calculates speed multiplier applied from weather and terrain abilities.
 * Authentic Gen 7 ability modifiers:
 * - Swift Swim: 2.0x in Rain
 * - Chlorophyll: 2.0x in Sun
 * - Sand Rush: 2.0x in Sandstorm
 * - Slush Rush: 2.0x in Hail
 * - Surge Surfer: 2.0x in Electric Terrain
 */
export function getEnvironmentSpeedMultiplier(
  battler: BattlerPokemon,
  environment?: BattleEnvironment
): number {
  if (!environment) return 1.0;

  const ability = AbilityEngine.normalize(battler.ability);
  const weatherType = environment.weather?.type;
  const terrainType = environment.terrain?.type;

  // Weather-based speed multipliers
  if (weatherType === 'rain' && ability === 'swiftswim') {
    return 2.0;
  }
  if (weatherType === 'sun' && ability === 'chlorophyll') {
    return 2.0;
  }
  if (weatherType === 'sandstorm' && ability === 'sandrush') {
    return 2.0;
  }
  if (weatherType === 'hail' && ability === 'slushrush') {
    return 2.0;
  }

  // Terrain-based speed multipliers
  if (terrainType === 'electric' && ability === 'surgesurfer') {
    return 2.0;
  }

  return 1.0;
}
