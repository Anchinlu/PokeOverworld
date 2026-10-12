/**
 * Battle Environment Presets & Configuration
 * Provides rich multi-layered environment configs for Battlebacks
 * (Field, Forest, Water, Mountain) with dynamic animation layers.
 */

import type { BattleEnvironment, BattleEnvPresetId } from './types';

export interface BattleEnvPresetConfig {
  id: BattleEnvPresetId;
  nameVi: string;
  background: string;
  enemyBase: string;
  playerBase: string;
  foregroundOverlay?: string;
  hasSun: boolean;
  hasClouds: boolean;
  hasForestShade: boolean;
  hasPineTrees: boolean;
  hasWaterShimmer: boolean;
  hasBubbles: boolean;
  hasMountainRidge: boolean;
  ambientParticleType: 'pollen' | 'spores' | 'bubbles' | 'wind_dust';
}

export const BATTLE_ENV_PRESETS: Record<BattleEnvPresetId, BattleEnvPresetConfig> = {
  field: {
    id: 'field',
    nameVi: 'Cánh đồng / Đồng cỏ',
    background: 'Field.png',
    enemyBase: 'FieldGrass.png',
    playerBase: 'FieldGrass.png',
    foregroundOverlay: 'grass_field',
    hasSun: true,
    hasClouds: true,
    hasForestShade: false,
    hasPineTrees: false,
    hasWaterShimmer: false,
    hasBubbles: false,
    hasMountainRidge: false,
    ambientParticleType: 'pollen',
  },
  forest: {
    id: 'forest',
    nameVi: 'Rừng rậm',
    background: 'Forest.png',
    enemyBase: 'ForestGrass.png',
    playerBase: 'ForestGrass.png',
    foregroundOverlay: undefined,
    hasSun: false,
    hasClouds: false,
    hasForestShade: false,
    hasPineTrees: true,
    hasWaterShimmer: false,
    hasBubbles: false,
    hasMountainRidge: false,
    ambientParticleType: 'spores',
  },
  water: {
    id: 'water',
    nameVi: 'Sông biển / Mặt nước',
    background: 'Water.png',
    enemyBase: 'Water.png',
    playerBase: 'Water.png',
    foregroundOverlay: 'water_rough',
    hasSun: false,
    hasClouds: true,
    hasForestShade: false,
    hasPineTrees: false,
    hasWaterShimmer: true,
    hasBubbles: true,
    hasMountainRidge: false,
    ambientParticleType: 'bubbles',
  },
  mountain: {
    id: 'mountain',
    nameVi: 'Núi non / Đồi núi',
    background: 'Mountain.png',
    enemyBase: 'Mountain.png',
    playerBase: 'Mountain.png',
    foregroundOverlay: 'mountain_rocks',
    hasSun: false,
    hasClouds: true,
    hasForestShade: false,
    hasPineTrees: false,
    hasWaterShimmer: false,
    hasBubbles: false,
    hasMountainRidge: true,
    ambientParticleType: 'wind_dust',
  },
};

/**
 * Get configuration for a specific preset ID.
 */
export function getPresetConfig(presetId: BattleEnvPresetId): BattleEnvPresetConfig {
  return BATTLE_ENV_PRESETS[presetId] ?? BATTLE_ENV_PRESETS.field;
}

/**
 * Automatically determine which preset applies to a given BattleEnvironment.
 */
export function detectPresetFromEnvironment(env: BattleEnvironment): BattleEnvPresetConfig {
  if (env.preset && BATTLE_ENV_PRESETS[env.preset]) {
    return BATTLE_ENV_PRESETS[env.preset];
  }

  const bgLower = (env.background || '').toLowerCase();
  if (bgLower.includes('forest')) {
    return BATTLE_ENV_PRESETS.forest;
  }
  if (bgLower.includes('water')) {
    return BATTLE_ENV_PRESETS.water;
  }
  if (bgLower.includes('mountain')) {
    return BATTLE_ENV_PRESETS.mountain;
  }
  return BATTLE_ENV_PRESETS.field;
}
