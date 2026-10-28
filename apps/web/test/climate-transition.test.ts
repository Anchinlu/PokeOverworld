import { describe, expect, it } from 'vitest';
import {
  classifyClimateBand,
  getClimateTransitionZone,
  isClimateBiomeCore,
  type ClimateSample,
} from '../src/maps/climate';

function climate(temperature: number, moisture = 0.5): ClimateSample {
  return {
    temperature,
    moisture,
    humidity: moisture,
    elevation: 0,
    climateBand: classifyClimateBand(temperature),
  };
}

describe('climate transition bands', () => {
  it('keeps a dry transition between meadow and desert', () => {
    expect(isClimateBiomeCore('desert', climate(0.8, 0.2))).toBe(true);
    expect(getClimateTransitionZone('desert', climate(0.68, 0.34))).toBe('transition');
    expect(getClimateTransitionZone('desert', climate(0.5, 0.2))).toBe('blocked');
  });

  it('keeps a two-tier cold transition around snow (core <= 0.22, transition <= 0.36)', () => {
    expect(isClimateBiomeCore('snow', climate(0.2))).toBe(true);
    expect(getClimateTransitionZone('snow', climate(0.22))).toBe('core');
    expect(getClimateTransitionZone('snow', climate(0.3))).toBe('transition');
    expect(getClimateTransitionZone('snow', climate(0.36))).toBe('transition');
    expect(getClimateTransitionZone('snow', climate(0.42))).toBe('blocked');
    expect(getClimateTransitionZone('snow', climate(0.7))).toBe('blocked');
  });

  it('does not classify transition cells as special biome core', () => {
    expect(isClimateBiomeCore('desert', climate(0.7, 0.34))).toBe(false);
    expect(isClimateBiomeCore('autumn', climate(0.2, 0.24))).toBe(false);
    expect(isClimateBiomeCore('dark_land', climate(0.6))).toBe(false);
  });

});
