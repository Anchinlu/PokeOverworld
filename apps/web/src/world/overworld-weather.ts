import type { WeatherType } from '../wildlife/ports/world-query';

export type OverworldWeather =
  'clear' | 'sun' | 'rain' | 'heavy_rain' | 'sand' | 'snow' | 'fog' | 'thunderstorm';

/**
 * Deterministic world weather. A weather cell lasts six in-game hours, so
 * AI, spawn selection and save/load all observe the same result for a seed.
 */
export function getOverworldWeather(seed: number, day: number, minutes: number): OverworldWeather {
  const cell = Math.floor((((minutes % 1440) + 1440) % 1440) / 360);
  const roll = hashWeather(seed, day, cell);

  if (roll < 0.5) return 'clear';
  if (roll < 0.62) return 'sun';
  if (roll < 0.77) return 'rain';
  if (roll < 0.83) return 'heavy_rain';
  if (roll < 0.89) return 'fog';
  if (roll < 0.94) return 'sand';
  if (roll < 0.98) return 'snow';
  return 'thunderstorm';
}

function hashWeather(seed: number, day: number, cell: number): number {
  let value = (seed ^ Math.imul(day + 1, 0x45d9f3b) ^ Math.imul(cell + 11, 0x27d4eb2d)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
  return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
}

export function isOverworldWeather(value: string): value is WeatherType {
  return ['clear', 'sun', 'rain', 'heavy_rain', 'sand', 'snow', 'fog', 'thunderstorm'].includes(
    value
  );
}
