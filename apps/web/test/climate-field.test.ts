import { describe, expect, it } from 'vitest';
import { classifyClimateBand, isBiomeClimateCompatible, sampleClimate } from '../src/maps/climate';

describe('deterministic climate field', () => {
  it('returns the same permanent climate for the same seed and coordinate', () => {
    const first = sampleClimate(128, -256, 20261022, 0.2);
    const second = sampleClimate(128, -256, 20261022, 0.2);

    expect(second).toEqual(first);
  });

  it('keeps climate values within the normalized range', () => {
    for (const point of [
      [0, 0],
      [1024, -512],
      [-2048, 1536],
    ] as const) {
      const climate = sampleClimate(point[0], point[1], 101, 1);

      expect(climate.temperature).toBeGreaterThanOrEqual(0);
      expect(climate.temperature).toBeLessThanOrEqual(1);
      expect(climate.moisture).toBeGreaterThanOrEqual(0);
      expect(climate.moisture).toBeLessThanOrEqual(1);
      expect(climate.humidity).toBeGreaterThanOrEqual(0);
      expect(climate.humidity).toBeLessThanOrEqual(1);
      expect(climate.elevation).toBe(1);
    }
  });

  it('classifies the configured temperature bands', () => {
    expect(classifyClimateBand(0.1)).toBe('arctic');
    expect(classifyClimateBand(0.3)).toBe('cold');
    expect(classifyClimateBand(0.5)).toBe('temperate');
    expect(classifyClimateBand(0.65)).toBe('warm');
    expect(classifyClimateBand(0.9)).toBe('hot');
  });

  it('blocks incompatible special biomes at the climate rule layer', () => {
    const cold = sampleClimate(128, -256, 20261022);
    const hot = sampleClimate(128, -256, 20261022);
    cold.temperature = 0.2;
    cold.climateBand = classifyClimateBand(cold.temperature);
    hot.temperature = 0.8;
    hot.moisture = 0.2;
    hot.climateBand = classifyClimateBand(hot.temperature);

    expect(isBiomeClimateCompatible('desert', cold)).toBe(false);
    expect(isBiomeClimateCompatible('snow', hot)).toBe(false);
    expect(isBiomeClimateCompatible('snow', cold)).toBe(true);
    expect(isBiomeClimateCompatible('desert', hot)).toBe(true);
  });
});
