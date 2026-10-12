import type { CustomMoveAnimationInstance, AncientPowerAnimationConfig } from './ancient-power';
import { AncientPowerAnimation } from './ancient-power';
import { ShadowBallAnimation, type ShadowBallAnimationConfig } from './shadow-ball';
import { FlamethrowerAnimation, type FlamethrowerAnimationConfig } from './flamethrower';
import { ThunderboltAnimation, type ThunderboltAnimationConfig } from './thunderbolt';
import { HydroPumpAnimation, type HydroPumpAnimationConfig } from './hydro-pump';

export * from './ancient-power';
export * from './shadow-ball';
export * from './flamethrower';
export * from './thunderbolt';
export * from './hydro-pump';

export interface CustomMoveAnimationFactoryConfig {
  attackerSide: 'player' | 'enemy';
  attackerCenter: { x: number; y: number };
  defenderCenter: { x: number; y: number };
  onImpact: () => void;
  onComplete?: () => void;
}

/**
 * Creates a custom scripted move animation if one is registered for the move ID.
 * Returns null if no custom animation is implemented (fallback to standard VFX).
 */
export function createCustomMoveAnimation(
  moveId: string,
  config: CustomMoveAnimationFactoryConfig
): CustomMoveAnimationInstance | null {
  const normId = moveId.toUpperCase().replace(/[- ]/g, '_');

  if (normId === 'ANCIENT_POWER' || normId === 'ANCIENTPOWER') {
    return new AncientPowerAnimation(config as AncientPowerAnimationConfig);
  }

  if (normId === 'SHADOW_BALL' || normId === 'SHADOWBALL') {
    return new ShadowBallAnimation(config as ShadowBallAnimationConfig);
  }

  if (normId === 'FLAMETHROWER') {
    return new FlamethrowerAnimation(config as FlamethrowerAnimationConfig);
  }

  if (normId === 'THUNDERBOLT') {
    return new ThunderboltAnimation(config as ThunderboltAnimationConfig);
  }

  if (normId === 'HYDRO_PUMP' || normId === 'HYDROPUMP') {
    return new HydroPumpAnimation(config as HydroPumpAnimationConfig);
  }

  return null;
}
