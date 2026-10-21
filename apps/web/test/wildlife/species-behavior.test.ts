import { describe, expect, it } from 'vitest';
import pokemonDbJson from '@pokemon/game-data/pokemon-db.json';
import {
  getBehaviorProfileForSpecies,
  getSpeciesBehaviorCoverage,
} from '../../src/wildlife/behavior/profiles/profile-registry';
import { getWeatherBehaviorModifiers } from '../../src/wildlife/behavior/schedule/weather-response';
import { getOverworldWeather } from '../../src/world/overworld-weather';

describe('Species behavior registry and overworld weather', () => {
  it('covers every Gen 1 species exactly once', () => {
    const database = pokemonDbJson as { pokemon: Record<string, { speciesKey: string }> };
    const databaseKeys = Object.values(database.pokemon).map((entry) => entry.speciesKey);
    const coveredKeys = getSpeciesBehaviorCoverage();

    expect(new Set(coveredKeys).size).toBe(151);
    expect(new Set(coveredKeys)).toEqual(new Set(databaseKeys));
  });

  it('resolves species-specific profiles instead of the generic fallback', () => {
    expect(getBehaviorProfileForSpecies('PIKACHU').tags).toContain('storm_affinity');
    expect(getBehaviorProfileForSpecies('GASTLY').activity).toBe('nocturnal');
    expect(getBehaviorProfileForSpecies('METAPOD').id).toBe('cocoon');
  });

  it('changes utility modifiers according to species and weather', () => {
    const clearWater = getWeatherBehaviorModifiers('MAGIKARP', 'clear');
    const rainyWater = getWeatherBehaviorModifiers('MAGIKARP', 'rain');
    const rainyFire = getWeatherBehaviorModifiers('CHARMANDER', 'heavy_rain');
    const stormElectric = getWeatherBehaviorModifiers('PIKACHU', 'thunderstorm');

    expect(rainyWater.activityMultiplier).toBeGreaterThan(clearWater.activityMultiplier);
    expect(rainyFire.prefersShelter).toBe(true);
    expect(stormElectric.activityMultiplier).toBeGreaterThan(1);
  });

  it('generates stable six-hour weather cells from seed and day', () => {
    expect(getOverworldWeather(101, 3, 720)).toBe(getOverworldWeather(101, 3, 899));
    expect(['clear', 'sun', 'rain', 'heavy_rain', 'sand', 'snow', 'fog', 'thunderstorm']).toContain(
      getOverworldWeather(102, 3, 720)
    );
  });
});
