export const CLIMATE_CONFIG = {
  temperatureMacroScale: 1500,
  temperatureDetailScale: 520,
  moistureScale: 1100,
  humidityScale: 760,
  latitudeScale: 4200,
  macroWeight: 0.7,
  detailWeight: 0.2,
  latitudeWeight: 0.1,
  arcticMax: 0.2,
  coldMax: 0.38,
  temperateMax: 0.55,
  warmMax: 0.72,
  temperatureSalt: 5101,
  temperatureDetailSalt: 5104,
  moistureSalt: 5102,
  humiditySalt: 5105,
} as const;

export function clampClimateValue(value: number): number {
  return Math.max(0, Math.min(1, value));
}
