import type { AnimationCel, BattleAnimationDefinition } from './types';

const SOURCE_USER = { x: 128, y: 224 };
const SOURCE_TARGET = { x: 384, y: 96 };

function createEnergyBallCel(
  pattern: number,
  x: number,
  y: number,
  zoom: number,
  focus: AnimationCel['focus']
): AnimationCel {
  return {
    pattern,
    x,
    y,
    zoomX: zoom,
    zoomY: zoom,
    angle: 0,
    mirror: false,
    opacity: 255,
    blendMode: 'additive',
    visible: true,
    priority: 1,
    focus,
  };
}

/**
 * The imported Energy Ball timeline only contained a target-side impact.
 * Keep the original atlas, but author the projectile path explicitly so the
 * same correction is used by the real battle and the visual QA gallery.
 */
export function createEnergyBallAnimationOverride(): BattleAnimationDefinition {
  const frameCount = 10;
  const frames = Array.from({ length: frameCount }, (_, index) => {
    const progress = index / (frameCount - 1);
    const x = SOURCE_USER.x + (SOURCE_TARGET.x - SOURCE_USER.x) * progress;
    const y = SOURCE_USER.y + (SOURCE_TARGET.y - SOURCE_USER.y) * progress;
    const zoom = 70 + 30 * progress;

    return {
      cels: [
        createEnergyBallCel(-1, SOURCE_USER.x, SOURCE_USER.y, 100, 'user'),
        createEnergyBallCel(-2, SOURCE_TARGET.x, SOURCE_TARGET.y, 100, 'target'),
        createEnergyBallCel(index, x, y, zoom, 'both'),
      ],
    };
  });

  return {
    id: '98',
    name: 'Move:ENERGYBALL',
    graphic: 'fly copy',
    hue: 0,
    position: 1,
    fps: 20,
    frames,
    timings: [],
  };
}

export const ANIMATION_OVERRIDES: Readonly<Record<string, BattleAnimationDefinition>> = {
  '98': createEnergyBallAnimationOverride(),
};
