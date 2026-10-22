import { fbm2 } from '../terrain-field/noise';
import { CLIMATE_CONFIG, clampClimateValue } from './climate-config';
import type { ClimateBand, ClimateSample } from './climate-types';

function getLatitudeTemperature(gy: number): number {
  const latitude = Math.min(1, Math.abs(gy) / CLIMATE_CONFIG.latitudeScale);
  return clampClimateValue(0.5 - latitude * 0.5);
}

export function classifyClimateBand(temperature: number): ClimateBand {
  if (temperature <= CLIMATE_CONFIG.arcticMax) return 'arctic';
  if (temperature <= CLIMATE_CONFIG.coldMax) return 'cold';
  if (temperature <= CLIMATE_CONFIG.temperateMax) return 'temperate';
  if (temperature <= CLIMATE_CONFIG.warmMax) return 'warm';
  return 'hot';
}

/**
 * Samples the permanent climate layer. This function is pure: the same seed
 * and coordinate always return the same result, regardless of chunk load order.
 */
export function sampleClimate(gx: number, gy: number, seed: number, elevation = 0): ClimateSample {
  const macroTemperature = fbm2(
    gx / CLIMATE_CONFIG.temperatureMacroScale,
    gy / CLIMATE_CONFIG.temperatureMacroScale,
    seed,
    CLIMATE_CONFIG.temperatureSalt,
    3
  );
  const detailTemperature = fbm2(
    gx / CLIMATE_CONFIG.temperatureDetailScale,
    gy / CLIMATE_CONFIG.temperatureDetailScale,
    seed,
    CLIMATE_CONFIG.temperatureDetailSalt,
    2
  );
  const latitudeTemperature = getLatitudeTemperature(gy);
  const temperature = clampClimateValue(
    macroTemperature * CLIMATE_CONFIG.macroWeight +
      detailTemperature * CLIMATE_CONFIG.detailWeight +
      latitudeTemperature * CLIMATE_CONFIG.latitudeWeight -
      clampClimateValue(elevation) * 0.08
  );

  const moisture = clampClimateValue(
    fbm2(
      gx / CLIMATE_CONFIG.moistureScale,
      gy / CLIMATE_CONFIG.moistureScale,
      seed,
      CLIMATE_CONFIG.moistureSalt,
      3
    )
  );
  const humidity = clampClimateValue(
    fbm2(
      gx / CLIMATE_CONFIG.humidityScale,
      gy / CLIMATE_CONFIG.humidityScale,
      seed,
      CLIMATE_CONFIG.humiditySalt,
      3
    )
  );

  return {
    temperature,
    moisture,
    humidity,
    elevation: clampClimateValue(elevation),
    climateBand: classifyClimateBand(temperature),
  };
}

export function isBiomeClimateCompatible(
  biome: 'desert' | 'snow' | 'autumn' | 'dark_land' | 'meadow' | 'wetland',
  climate: ClimateSample
): boolean {
  switch (biome) {
    case 'desert':
      return climate.temperature >= 0.68 && climate.moisture <= 0.35;
    case 'snow':
      return climate.temperature <= 0.32;
    case 'autumn':
      return climate.temperature >= 0.28 && climate.temperature <= 0.58;
    case 'dark_land':
      return (
        climate.climateBand === 'arctic' ||
        climate.climateBand === 'cold' ||
        climate.climateBand === 'temperate'
      );
    case 'meadow':
    case 'wetland':
      return true;
  }
}
