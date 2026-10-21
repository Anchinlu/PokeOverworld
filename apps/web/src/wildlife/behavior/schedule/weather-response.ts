import type { WeatherType } from '../../ports/world-query';
import { getSpeciesBehaviorDefinition } from '../profiles/profile-registry';

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
  const normalized = normalizeWeather(weather);
  const definition = getSpeciesBehaviorDefinition(speciesKey);
  const tags = new Set(definition?.tags ?? []);
  const affinity = definition?.weather?.[normalized] ?? 1;
  const isWater = tags.has('water') || tags.has('water_dweller');
  const isShelterSensitive = tags.has('shelter_sensitive');
  const isNative =
    (normalized === 'rain' && (isWater || tags.has('moisture_affinity'))) ||
    (normalized === 'sun' && tags.has('sun_affinity')) ||
    (normalized === 'sand' && tags.has('sand_native')) ||
    (normalized === 'snow' && tags.has('cold_affinity')) ||
    (normalized === 'fog' && tags.has('fog_affinity')) ||
    (normalized === 'thunderstorm' && tags.has('storm_affinity'));

  const prefersShelter =
    ((normalized === 'rain' || normalized === 'heavy_rain') &&
      !isWater &&
      (isShelterSensitive || affinity < 0.75)) ||
    (normalized === 'sand' && !tags.has('sand_native') && affinity < 0.8) ||
    (normalized === 'snow' && !tags.has('cold_affinity') && affinity < 0.8);

  return {
    moveSpeedMultiplier: prefersShelter ? 0.7 : isNative ? 1.15 : 0.95,
    activityMultiplier: Math.max(0.35, Math.min(1.6, affinity * (isNative ? 1.15 : 1))),
    prefersShelter,
  };
}

function normalizeWeather(weather: WeatherType): string {
  const value = weather.toLowerCase().replace(/[\s-]/g, '_');
  if (value === 'sandstorm') return 'sand';
  if (value === 'hail' || value === 'blizzard') return 'snow';
  if (value === 'storm') return 'thunderstorm';
  return value;
}
