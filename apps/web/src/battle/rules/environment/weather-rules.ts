import type { BattlerPokemon, PokemonType } from '../../types';
import { AbilityEngine } from '../ability-engine';

/**
 * Calculates damage multiplier for move type based on active battle weather.
 * Authenticated against Gen 7 mechanics:
 * - Rain: 1.5x Water damage, 0.5x Fire damage.
 * - Sun: 1.5x Fire damage, 0.5x Water damage.
 */
export function getWeatherDamageMultiplier(weatherType?: string, moveType?: PokemonType): number {
  if (!weatherType || !moveType) return 1.0;

  if (weatherType === 'rain') {
    if (moveType === 'Water') return 1.5;
    if (moveType === 'Fire') return 0.5;
  } else if (weatherType === 'sun') {
    if (moveType === 'Fire') return 1.5;
    if (moveType === 'Water') return 0.5;
  }

  return 1.0;
}

/**
 * Checks if a Pokémon is immune to Sandstorm or Hail damage through typing or abilities.
 */
export function isWeatherDamageImmune(
  battler: BattlerPokemon,
  weatherType: 'sandstorm' | 'hail'
): boolean {
  const ability = AbilityEngine.normalize(battler.ability);

  // Magic Guard and Overcoat provide universal weather immunity
  if (ability === 'magicguard' || ability === 'overcoat') {
    return true;
  }

  if (weatherType === 'sandstorm') {
    // Rock, Ground, Steel are naturally immune to Sandstorm damage
    if (
      battler.types.includes('Rock') ||
      battler.types.includes('Ground') ||
      battler.types.includes('Steel')
    ) {
      return true;
    }
  } else if (weatherType === 'hail') {
    // Ice-types are naturally immune to Hail damage
    if (battler.types.includes('Ice')) {
      return true;
    }
  }

  return false;
}

export interface EndTurnWeatherDamageResult {
  damage: number;
  message: string;
  weatherType: 'sandstorm' | 'hail';
}

/**
 * Calculates end-of-turn weather damage (1/16 max HP) for Sandstorm and Hail.
 */
export function calculateEndTurnWeatherDamage(
  battler: BattlerPokemon,
  weatherType?: string
): EndTurnWeatherDamageResult | null {
  if (!weatherType || (weatherType !== 'sandstorm' && weatherType !== 'hail')) {
    return null;
  }

  if (battler.currentHp <= 0 || battler.isFainted) {
    return null;
  }

  if (isWeatherDamageImmune(battler, weatherType)) {
    return null;
  }

  const damage = Math.max(1, Math.floor(battler.maxHp / 16));
  const message =
    weatherType === 'sandstorm'
      ? `Bão cát quất mạnh làm ${battler.name} bị thương!`
      : `Mưa đá rơi trúng làm ${battler.name} bị thương!`;

  return {
    damage,
    message,
    weatherType,
  };
}

export interface WeatherAccuracyOverride {
  isNeverMiss?: boolean;
  fixedAccuracy?: number;
}

/**
 * Modifies move accuracy based on weather (Thunder/Hurricane in rain, Blizzard in hail).
 */
export function getWeatherAccuracyOverride(
  weatherType?: string,
  moveId?: string
): WeatherAccuracyOverride | null {
  if (!weatherType || !moveId) return null;
  const id = moveId.toLowerCase();

  if (id === 'thunder' || id === 'hurricane') {
    if (weatherType === 'rain') return { isNeverMiss: true };
    if (weatherType === 'sun') return { fixedAccuracy: 50 };
  } else if (id === 'blizzard') {
    if (weatherType === 'hail') return { isNeverMiss: true };
  }

  return null;
}

/**
 * Modifies base move power for moves hindered by weather (Solar Beam / Solar Blade).
 */
export function getWeatherMovePowerMultiplier(weatherType?: string, moveId?: string): number {
  if (!weatherType || !moveId) return 1.0;
  const id = moveId.toLowerCase();

  if (id === 'solar_beam' || id === 'solarbeam' || id === 'solar_blade') {
    if (weatherType === 'rain' || weatherType === 'sandstorm' || weatherType === 'hail') {
      return 0.5;
    }
  }

  return 1.0;
}

/**
 * Returns the Gen 7 recovery multiplier for weather-dependent recovery moves.
 * The move database already stores the neutral 1/2 recovery amount, so this
 * function returns a multiplier relative to that base amount. Favorable
 * weather changes 1/2 to 2/3 (4/3x), while harsh weather changes it to 1/4
 * (1/2x).
 */
export function getWeatherRecoveryMultiplier(weatherType?: string, moveId?: string): number {
  const id = moveId?.toLowerCase();
  if (!id) return 1.0;

  if (id === 'shore_up') {
    return weatherType === 'sandstorm' ? 4 / 3 : 1;
  }

  if (id === 'synthesis' || id === 'moonlight' || id === 'morning_sun') {
    if (weatherType === 'sun') return 4 / 3;
    if (weatherType === 'rain' || weatherType === 'sandstorm' || weatherType === 'hail') {
      return 1 / 2;
    }
  }

  return 1;
}
