import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  BATTLE_ENV_PRESETS,
  detectPresetFromEnvironment,
} from '../src/battle/battle-environment-presets';
import { getBattleEnvironment } from '../src/battle/battle-factory';
import { createBattleAssets } from '../src/battle/battle-assets';

class MockImage {
  public src: string = '';
  public complete: boolean = true;
  public naturalWidth: number = 50;
  public naturalHeight: number = 50;
  public width: number = 50;
  public height: number = 50;
}

const originalImage = globalThis.Image;

beforeAll(() => {
  if (typeof globalThis.Image === 'undefined') {
    (globalThis as any).Image = MockImage;
  }
});

afterAll(() => {
  (globalThis as any).Image = originalImage;
});

describe('Battle Environment Presets (Battlebacks)', () => {
  it('defines 4 basic presets with complete configurations', () => {
    expect(BATTLE_ENV_PRESETS.field).toBeDefined();
    expect(BATTLE_ENV_PRESETS.forest).toBeDefined();
    expect(BATTLE_ENV_PRESETS.water).toBeDefined();
    expect(BATTLE_ENV_PRESETS.mountain).toBeDefined();

    // Field configuration
    expect(BATTLE_ENV_PRESETS.field.background).toBe('Field.png');
    expect(BATTLE_ENV_PRESETS.field.hasSun).toBe(true);
    expect(BATTLE_ENV_PRESETS.field.hasClouds).toBe(true);
    expect(BATTLE_ENV_PRESETS.field.ambientParticleType).toBe('pollen');

    // Forest configuration
    expect(BATTLE_ENV_PRESETS.forest.background).toBe('Forest.png');
    expect(BATTLE_ENV_PRESETS.forest.hasForestShade).toBe(false);
    expect(BATTLE_ENV_PRESETS.forest.hasPineTrees).toBe(true);
    expect(BATTLE_ENV_PRESETS.forest.ambientParticleType).toBe('spores');

    // Water configuration
    expect(BATTLE_ENV_PRESETS.water.background).toBe('Water.png');
    expect(BATTLE_ENV_PRESETS.water.hasWaterShimmer).toBe(true);
    expect(BATTLE_ENV_PRESETS.water.hasBubbles).toBe(true);
    expect(BATTLE_ENV_PRESETS.water.ambientParticleType).toBe('bubbles');

    // Mountain configuration
    expect(BATTLE_ENV_PRESETS.mountain.background).toBe('Mountain.png');
    expect(BATTLE_ENV_PRESETS.mountain.hasMountainRidge).toBe(true);
    expect(BATTLE_ENV_PRESETS.mountain.ambientParticleType).toBe('wind_dust');
  });

  it('detects presets correctly from preset field or background string', () => {
    expect(
      detectPresetFromEnvironment({ background: 'Field.png', enemyBase: '', playerBase: '' }).id
    ).toBe('field');
    expect(
      detectPresetFromEnvironment({ background: 'Forest.png', enemyBase: '', playerBase: '' }).id
    ).toBe('forest');
    expect(
      detectPresetFromEnvironment({ background: 'Water.png', enemyBase: '', playerBase: '' }).id
    ).toBe('water');
    expect(
      detectPresetFromEnvironment({ background: 'Mountain.png', enemyBase: '', playerBase: '' }).id
    ).toBe('mountain');

    // Explicit preset takes precedence
    expect(
      detectPresetFromEnvironment({
        preset: 'forest',
        background: 'Field.png',
        enemyBase: '',
        playerBase: '',
      }).id
    ).toBe('forest');
  });

  it('maps ecology zones to the 4 battle environment presets correctly', () => {
    // Meadow -> Field
    const meadowEnv = getBattleEnvironment('meadow', false, false);
    expect(meadowEnv.preset).toBe('field');
    expect(meadowEnv.background).toBe('Field.png');

    // Dense Forest -> Forest
    const forestEnv = getBattleEnvironment('dense_forest', false, false);
    expect(forestEnv.preset).toBe('forest');
    expect(forestEnv.background).toBe('Forest.png');

    // Wetland / Near Water -> Water
    const waterEnv = getBattleEnvironment('meadow', true, false);
    expect(waterEnv.preset).toBe('water');
    expect(waterEnv.background).toBe('Water.png');

    const wetlandEnv = getBattleEnvironment('wetland', false, false);
    expect(wetlandEnv.preset).toBe('water');
    expect(wetlandEnv.background).toBe('Water.png');

    // Hill Edge -> Mountain
    const mountainEnv = getBattleEnvironment('hill_edge', false, false);
    expect(mountainEnv.preset).toBe('mountain');
    expect(mountainEnv.background).toBe('Mountain.png');
    expect(mountainEnv.enemyBase).toBe('Mountain.png');
  });

  it('preloads environment elements based on preset flags', () => {
    const fieldEnv = getBattleEnvironment('meadow', false, false);
    const fieldAssets = createBattleAssets(fieldEnv, '/front.png', '/back.png');
    expect(fieldAssets.envElements).toBeDefined();
    expect(fieldAssets.envElements?.sun).toBeDefined();
    expect(fieldAssets.envElements?.cloud).toBeDefined();
    expect(fieldAssets.envElements?.forestShade).toBeUndefined();

    const forestEnv = getBattleEnvironment('dense_forest', false, false);
    const forestAssets = createBattleAssets(forestEnv, '/front.png', '/back.png');
    expect(forestAssets.envElements?.forestShade).toBeUndefined();
    expect(forestAssets.envElements?.treePine).toBeDefined();
    expect(forestAssets.envElements?.sun).toBeUndefined();

    const waterEnv = getBattleEnvironment('wetland', false, false);
    const waterAssets = createBattleAssets(waterEnv, '/front.png', '/back.png');
    expect(waterAssets.envElements?.water0).toBeDefined();
    expect(waterAssets.envElements?.water1).toBeDefined();
    expect(waterAssets.envElements?.bubble).toBeDefined();

    const mtnEnv = getBattleEnvironment('hill_edge', false, false);
    const mtnAssets = createBattleAssets(mtnEnv, '/front.png', '/back.png');
    expect(mtnAssets.envElements?.mountain).toBeDefined();
    expect(mtnAssets.envElements?.fog).toBeDefined();
    expect(mtnAssets.envElements?.rocks).toBeDefined();
  });
});
