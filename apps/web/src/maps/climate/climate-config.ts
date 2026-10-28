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
  coldMax: 0.44,
  // Two-tier snow climate thresholds:
  // - T <= snowCoreMax (0.22): Snow core.
  // - snowCoreMax < T <= snowTransitionMax (0.36): Cold transition (Snow salient, Autumn, or cold meadow).
  // - T > snowTransitionMax (0.36): Snow is strictly blocked.
  snowCoreMax: 0.22,
  snowTransitionMax: 0.36,
  snowMax: 0.36,
  temperateMax: 0.55,
  warmMax: 0.72,
  temperatureSalt: 5101,
  temperatureDetailSalt: 5104,
  moistureSalt: 5102,
  humiditySalt: 5105,

  // Soft climate anchor parameters
  anchorMinContinentCells: 180,
  anchorMinClearanceCells: 2,
  anchorMinStartDistanceCells: 8,
  anchorMaxStartDistanceCells: 28,
  anchorMinSeparationCells: 10,
  anchorRadiusTiles: 620,
  anchorSecondaryRadiusTiles: 520,
  anchorMaxInfluence: 0.85,
  anchorSecondaryMaxInfluence: 0.74,
} as const;

export function clampClimateValue(value: number): number {
  return Math.max(0, Math.min(1, value));
}

