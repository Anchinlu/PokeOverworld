import { CLIMATE_CONFIG } from './climate-config';
import { isBiomeClimateCompatible } from './climate-field';
import type { ClimateSample } from './climate-types';

export type ClimateBiomeTarget =
  | 'desert'
  | 'snow'
  | 'autumn'
  | 'dark_land'
  | 'rocky_highland';
export type ClimateTransitionZone = 'core' | 'transition' | 'blocked';

/**
 * Resolves whether a special biome is in its climate core, in a valid
 * climate transition zone (where low-frequency region noise may shape natural
 * peninsulas and borders), or strictly blocked by climate.
 */
export function getClimateTransitionZone(
  biome: ClimateBiomeTarget,
  climate: ClimateSample
): ClimateTransitionZone {
  if (isClimateBiomeCore(biome, climate)) return 'core';

  switch (biome) {
    case 'desert':
      return climate.temperature >= 0.6 && climate.moisture <= 0.45 ? 'transition' : 'blocked';
    case 'snow':
      // Two-tier snow threshold:
      // T <= 0.22 is core; 0.22 < T <= 0.36 is cold transition; T > 0.36 is blocked.
      return climate.temperature <= CLIMATE_CONFIG.snowTransitionMax ? 'transition' : 'blocked';
    case 'autumn':
      // Autumn also occupies the cold transition (0.22 < T <= 0.36) and cool temperate zone.
      return climate.temperature >= 0.2 &&
        climate.temperature <= 0.62 &&
        climate.moisture >= 0.22
        ? 'transition'
        : 'blocked';
    case 'dark_land':
      return climate.temperature >= 0.16 &&
        climate.temperature <= 0.65 &&
        climate.moisture <= 0.62
        ? 'transition'
        : 'blocked';
    case 'rocky_highland':
      return climate.temperature >= 0.22 &&
        climate.temperature <= 0.74 &&
        climate.moisture <= 0.62
        ? 'transition'
        : 'blocked';
  }
}

export function isClimateBiomeCore(biome: ClimateBiomeTarget, climate: ClimateSample): boolean {
  if (!isBiomeClimateCompatible(biome, climate)) return false;

  switch (biome) {
    case 'desert':
      return climate.temperature >= 0.7 && climate.moisture <= 0.32;
    case 'snow':
      return climate.temperature <= CLIMATE_CONFIG.snowCoreMax;
    case 'autumn':
      return (
        climate.temperature >= CLIMATE_CONFIG.snowCoreMax &&
        climate.temperature <= 0.55 &&
        climate.moisture >= 0.28
      );
    case 'dark_land':
      return (
        climate.temperature >= 0.2 &&
        climate.temperature <= CLIMATE_CONFIG.temperateMax &&
        climate.moisture <= 0.52
      );
    case 'rocky_highland':
      return (
        climate.temperature >= 0.3 &&
        climate.temperature <= 0.66 &&
        climate.moisture <= 0.48
      );
  }
}

