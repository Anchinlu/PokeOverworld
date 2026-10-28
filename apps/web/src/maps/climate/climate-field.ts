import { fbm2 } from '../terrain-field/noise';
import { CLIMATE_CONFIG, clampClimateValue } from './climate-config';
import type {
  ClimateAnchor,
  ClimateBand,
  ClimateContextOptions,
  ClimateSample,
  WhittakerBiome,
} from './climate-types';

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
 * Classifies the primary visual climate biome using a Whittaker-style
 * Temperature × Moisture diagram. Low-frequency region noise later shapes
 * the organic boundary inside the allowed core/transition zones.
 */
export function classifyWhittakerBiome(
  temperature: number,
  moisture: number,
  humidity = moisture
): WhittakerBiome {
  if (temperature <= CLIMATE_CONFIG.snowCoreMax) {
    return 'snow';
  }
  if (temperature <= CLIMATE_CONFIG.snowTransitionMax) {
    if (moisture >= 0.42) return 'autumn';
    return 'meadow';
  }
  if (temperature >= 0.68 && moisture <= 0.35) {
    return 'desert';
  }
  if (temperature <= CLIMATE_CONFIG.temperateMax && moisture <= 0.36 && humidity <= 0.46) {
    return 'dark_land';
  }
  if (moisture >= 0.72) {
    return 'wetland';
  }
  if (temperature >= 0.28 && temperature <= 0.56 && moisture >= 0.5) {
    return 'autumn';
  }
  if (moisture >= 0.54) {
    return 'forest';
  }
  return 'meadow';
}

function applySoftClimateAnchors(
  gx: number,
  gy: number,
  baseTemperature: number,
  baseMoisture: number,
  anchors: readonly ClimateAnchor[]
): { temperature: number; moisture: number } {
  let temperature = baseTemperature;
  let moisture = baseMoisture;

  for (const anchor of anchors) {
    const dx = gx - anchor.sourceGX;
    const dy = gy - anchor.sourceGY;
    const distSq = dx * dx + dy * dy;
    const radiusSq = anchor.radius * anchor.radius;
    if (distSq >= radiusSq) continue;

    const normalizedRemaining = 1 - Math.sqrt(distSq) / anchor.radius;
    // Smoothstep falloff (3t^2 - 2t^3) avoids sharp circular rings.
    const smoothFalloff =
      normalizedRemaining * normalizedRemaining * (3 - 2 * normalizedRemaining);
    const influence = clampClimateValue(smoothFalloff * anchor.maxInfluence);

    temperature = temperature + (anchor.targetTemperature - temperature) * influence;
    moisture = moisture + (anchor.targetMoisture - moisture) * influence;
  }

  return {
    temperature: clampClimateValue(temperature),
    moisture: clampClimateValue(moisture),
  };
}

/**
 * Samples the permanent climate layer. This function is pure: the same seed
 * and coordinate always return the same result, regardless of chunk load order.
 */
export function sampleClimate(
  gx: number,
  gy: number,
  seed: number,
  elevationOrOptions: number | ClimateContextOptions = 0
): ClimateSample {
  const options: ClimateContextOptions =
    typeof elevationOrOptions === 'number'
      ? { elevation: elevationOrOptions }
      : elevationOrOptions;

  const elevation = clampClimateValue(options.elevation ?? 0);
  const continentality =
    options.continentality !== undefined ? clampClimateValue(options.continentality) : undefined;
  const nearFreshwater = options.nearFreshwater ?? false;

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
  const blendedTemperature =
    macroTemperature * CLIMATE_CONFIG.macroWeight +
    detailTemperature * CLIMATE_CONFIG.detailWeight +
    latitudeTemperature * CLIMATE_CONFIG.latitudeWeight;

  // Expand climate contrast around temperate 0.5. Continental interiors have
  // slightly stronger thermal contrast than coastal margins.
  const contrastFactor =
    continentality !== undefined ? 1.52 + continentality * 0.18 : 1.6;
  let temperature = clampClimateValue(
    0.5 + (blendedTemperature - 0.5) * contrastFactor - elevation * 0.08
  );

  const rawMoisture = fbm2(
    gx / CLIMATE_CONFIG.moistureScale,
    gy / CLIMATE_CONFIG.moistureScale,
    seed,
    CLIMATE_CONFIG.moistureSalt,
    3
  );
  const coastalMoistureBonus =
    continentality !== undefined ? (1 - continentality) * 0.06 : 0;
  const freshwaterMoistureBonus = nearFreshwater ? 0.08 : 0;
  let moisture = clampClimateValue(rawMoisture + coastalMoistureBonus + freshwaterMoistureBonus);

  if (options.anchors && options.anchors.length > 0) {
    const anchored = applySoftClimateAnchors(gx, gy, temperature, moisture, options.anchors);
    temperature = anchored.temperature;
    moisture = anchored.moisture;
  }

  const humidity = clampClimateValue(
    fbm2(
      gx / CLIMATE_CONFIG.humidityScale,
      gy / CLIMATE_CONFIG.humidityScale,
      seed,
      CLIMATE_CONFIG.humiditySalt,
      3
    ) *
      0.85 +
      moisture * 0.15
  );

  return {
    temperature,
    moisture,
    humidity,
    elevation,
    ...(continentality !== undefined ? { continentality } : {}),
    climateBand: classifyClimateBand(temperature),
    whittakerBiome: classifyWhittakerBiome(temperature, moisture, humidity),
  };
}

export function isBiomeClimateCompatible(
  biome: 'desert' | 'snow' | 'autumn' | 'dark_land' | 'rocky_highland' | 'meadow' | 'wetland',
  climate: ClimateSample
): boolean {
  switch (biome) {
    case 'desert':
      return climate.temperature >= 0.62 && climate.moisture <= 0.42;
    case 'snow':
      return climate.temperature <= CLIMATE_CONFIG.snowTransitionMax;
    case 'autumn':
      return (
        climate.temperature >= 0.2 &&
        climate.temperature <= 0.58 &&
        climate.moisture >= 0.22
      );
    case 'dark_land':
      return (
        (climate.climateBand === 'arctic' ||
          climate.climateBand === 'cold' ||
          climate.climateBand === 'temperate') &&
        climate.moisture <= 0.62
      );
    case 'rocky_highland':
      return (
        climate.temperature >= 0.24 &&
        climate.temperature <= 0.72 &&
        climate.moisture <= 0.58
      );
    case 'meadow':
    case 'wetland':
      return true;
  }
}

