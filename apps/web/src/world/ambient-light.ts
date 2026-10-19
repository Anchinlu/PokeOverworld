import type { AmbientLightProfile } from '@pokemon/shared-types';

interface LightKeyframe {
  minute: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
}

/**
 * Keyframes across the 24-hour (1440 minute) cycle.
 *
 * dawn:  rgba(255, 150, 105, 0.16)
 * day:   rgba(255, 255, 255, 0.00)
 * dusk:  rgba(170,  90, 190, 0.20)
 * night: rgba( 24,  35,  90, 0.38)
 */
export const LIGHT_KEYFRAMES: readonly LightKeyframe[] = [
  { minute: 0,    r: 24,  g: 35,  b: 90,  alpha: 0.38 }, // 00:00 Midnight
  { minute: 270,  r: 24,  g: 35,  b: 90,  alpha: 0.38 }, // 04:30 Late Night
  { minute: 360,  r: 255, g: 150, b: 105, alpha: 0.16 }, // 06:00 Mid Dawn
  { minute: 420,  r: 255, g: 255, b: 255, alpha: 0.00 }, // 07:00 Full Day
  { minute: 720,  r: 255, g: 255, b: 255, alpha: 0.00 }, // 12:00 Noon
  { minute: 1020, r: 255, g: 255, b: 255, alpha: 0.00 }, // 17:00 Sunset Begins
  { minute: 1080, r: 170, g: 90,  b: 190, alpha: 0.20 }, // 18:00 Mid Dusk
  { minute: 1170, r: 24,  g: 35,  b: 90,  alpha: 0.38 }, // 19:30 Night Settles
  { minute: 1440, r: 24,  g: 35,  b: 90,  alpha: 0.38 }, // 24:00 Wrap
] as const;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Resolves the smoothly interpolated AmbientLightProfile for any in-game minute.
 * Never creates abrupt visual jumps or alpha values outside [0..1].
 */
export function getAmbientLightProfile(minutes: number): AmbientLightProfile {
  const m = ((minutes % 1440) + 1440) % 1440;

  let k1 = LIGHT_KEYFRAMES[0];
  let k2 = LIGHT_KEYFRAMES[LIGHT_KEYFRAMES.length - 1];

  for (let i = 0; i < LIGHT_KEYFRAMES.length - 1; i++) {
    if (m >= LIGHT_KEYFRAMES[i].minute && m <= LIGHT_KEYFRAMES[i + 1].minute) {
      k1 = LIGHT_KEYFRAMES[i];
      k2 = LIGHT_KEYFRAMES[i + 1];
      break;
    }
  }

  const span = k2.minute - k1.minute;
  const progress = span > 0 ? (m - k1.minute) / span : 0;
  const t = clamp(progress, 0, 1);

  const r = Math.round(lerp(k1.r, k2.r, t));
  const g = Math.round(lerp(k1.g, k2.g, t));
  const b = Math.round(lerp(k1.b, k2.b, t));
  const alpha = Number(clamp(lerp(k1.alpha, k2.alpha, t), 0, 1).toFixed(3));

  const color = `rgba(${r}, ${g}, ${b}, ${alpha})`;

  return {
    color,
    r,
    g,
    b,
    alpha,
    blendMode: 'source-over',
  };
}
