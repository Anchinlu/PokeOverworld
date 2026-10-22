import type { AmbientLightProfile } from '@pokemon/shared-types';
import type { OverworldWeather } from './overworld-weather';

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
 * dusk:  rgba(200,  75, 150, 0.38)
 * night: rgba(  8,  14,  48, 0.72)
 */
export const LIGHT_KEYFRAMES: readonly LightKeyframe[] = [
  { minute: 0,    r: 8,   g: 14,  b: 48,  alpha: 0.72 }, // 00:00 Midnight (Deep dark night)
  { minute: 270,  r: 8,   g: 14,  b: 48,  alpha: 0.72 }, // 04:30 Late Night
  { minute: 330,  r: 18,  g: 24,  b: 64,  alpha: 0.45 }, // 05:30 Pre-Dawn transition
  { minute: 360,  r: 255, g: 150, b: 105, alpha: 0.16 }, // 06:00 Mid Dawn
  { minute: 420,  r: 255, g: 255, b: 255, alpha: 0.00 }, // 07:00 Full Day
  { minute: 720,  r: 255, g: 255, b: 255, alpha: 0.00 }, // 12:00 Noon
  { minute: 1020, r: 255, g: 255, b: 255, alpha: 0.00 }, // 17:00 Sunset Begins
  { minute: 1050, r: 240, g: 110, b: 50,  alpha: 0.28 }, // 17:30 Golden Hour Amber
  { minute: 1080, r: 200, g: 75,  b: 150, alpha: 0.38 }, // 18:00 Peak Dusk (Rich Magenta-Violet)
  { minute: 1110, r: 130, g: 50,  b: 145, alpha: 0.44 }, // 18:30 Twilight Purple
  { minute: 1155, r: 25,  g: 30,  b: 75,  alpha: 0.58 }, // 19:15 Deep Twilight
  { minute: 1200, r: 10,  g: 16,  b: 52,  alpha: 0.70 }, // 20:00 Night Settles
  { minute: 1440, r: 8,   g: 14,  b: 48,  alpha: 0.72 }, // 24:00 Wrap
] as const;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Resolves the smoothly interpolated AmbientLightProfile for any in-game minute,
 * with authentic storm overcast and darkening when raining.
 * Never creates abrupt visual jumps or alpha values outside [0..1].
 */
export function getAmbientLightProfile(
  minutes: number,
  weather?: OverworldWeather
): AmbientLightProfile {
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

  let r = Math.round(lerp(k1.r, k2.r, t));
  let g = Math.round(lerp(k1.g, k2.g, t));
  let b = Math.round(lerp(k1.b, k2.b, t));
  let alpha = Number(clamp(lerp(k1.alpha, k2.alpha, t), 0, 1).toFixed(3));

  // Dynamic Weather Overcast & Darkening
  if (weather === 'thunderstorm') {
    // Severe dark storm indigo gloom
    const stormMinAlpha = 0.58;
    const blendFactor = 0.75;
    r = Math.round(lerp(r, 8, blendFactor));
    g = Math.round(lerp(g, 14, blendFactor));
    b = Math.round(lerp(b, 36, blendFactor));
    alpha = Number(clamp(Math.max(alpha, stormMinAlpha) + 0.08, 0, 0.88).toFixed(3));
  } else if (weather === 'heavy_rain') {
    // Heavy rain dark downpour overcast
    const rainMinAlpha = 0.44;
    const blendFactor = 0.65;
    r = Math.round(lerp(r, 14, blendFactor));
    g = Math.round(lerp(g, 24, blendFactor));
    b = Math.round(lerp(b, 48, blendFactor));
    alpha = Number(clamp(Math.max(alpha, rainMinAlpha) + 0.05, 0, 0.82).toFixed(3));
  } else if (weather === 'rain') {
    // Moody rain overcast gloom
    const rainMinAlpha = 0.32;
    const blendFactor = 0.55;
    r = Math.round(lerp(r, 20, blendFactor));
    g = Math.round(lerp(g, 32, blendFactor));
    b = Math.round(lerp(b, 56, blendFactor));
    alpha = Number(clamp(Math.max(alpha, rainMinAlpha) + 0.04, 0, 0.78).toFixed(3));
  }

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
