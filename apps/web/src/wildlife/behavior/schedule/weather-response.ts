import type { WeatherType } from '../../ports/world-query';

export interface WeatherBehaviorModifiers {
  moveSpeedMultiplier: number;
  activityMultiplier: number;
  prefersShelter: boolean;
}

/**
 * Calculates behavioral adjustments due to prevailing weather.
 * Section 6.5:
 * - Mưa: bọ trốn (prefers shelter), loài nước tăng hoạt động.
 */
export function getWeatherBehaviorModifiers(
  speciesKey: string,
  weather: WeatherType
): WeatherBehaviorModifiers {
  if (weather === 'rain') {
    // Water species thrive in rain
    const isWaterSpecies = ['MAGIKARP', 'POLIWAG', 'PSYDUCK', 'GOLDEEN', 'TENTACOOL', 'SQUIRTLE', 'SLOWPOKE'].includes(speciesKey);
    if (isWaterSpecies) {
      return {
        moveSpeedMultiplier: 1.25,
        activityMultiplier: 1.5,
        prefersShelter: false,
      };
    }

    // Bug species seek shelter and slow down
    const isBugSpecies = ['CATERPIE', 'METAPOD', 'BUTTERFREE', 'WEEDLE', 'KAKUNA', 'BEEDRILL', 'PARAS', 'VENONAT'].includes(speciesKey);
    if (isBugSpecies) {
      return {
        moveSpeedMultiplier: 0.6,
        activityMultiplier: 0.4,
        prefersShelter: true,
      };
    }

    return {
      moveSpeedMultiplier: 0.9,
      activityMultiplier: 0.85,
      prefersShelter: false,
    };
  }

  if (weather === 'sand') {
    return {
      moveSpeedMultiplier: 0.8,
      activityMultiplier: 0.7,
      prefersShelter: true,
    };
  }

  // Clear or other standard weather
  return {
    moveSpeedMultiplier: 1.0,
    activityMultiplier: 1.0,
    prefersShelter: false,
  };
}
