/**
 * Configuration and Tuning Constants for World Gen v3
 * (Asymmetric Valley with Natural Opening Corridors)
 *
 * Implements organic noise modulation and 3 directional corridors
 * without transcendental functions (STRICT INVARIANT I3).
 */

import { fbm2, valueNoise2 } from './noise';
import { smoothstep } from './v0-config';

export const V3_CONFIG = {
  // Continentality (Macro ocean / continent structure)
  CONT_SCALE: 400,
  CONT_SALT: 101,
  SEA_LEVEL: 0.48,

  // Start Village & Valley Anchors
  START_ANCHOR_GX: 0,
  START_ANCHOR_GY: 0,

  // Strict 100% safe flat land core (covers Twinleaf Hamlet with a compact margin)
  // Keep the protected area small so natural terrain begins close to the starter village.
  SAFE_CORE_R: 20,

  // Organic valley transition envelope
  VALLEY_R0: 72, // Inside this, valley is predominantly land
  VALLEY_R1: 128, // Transition back to natural continentality
  LAND_BOOST: 0.15,

  // Low-frequency organic border distortion
  ORGANIC_NOISE_SCALE: 96,
  ORGANIC_NOISE_SALT: 303,
  ORGANIC_NOISE_WEIGHT: 0.22, // Up to ±22% radial boundary warping

  // Coastal Beach Sand Fringe
  BEACH_WIDTH: 5,

  // Elevation & Mountain Plateaus framing the valley
  ELEV_SCALE: 160,
  ELEV_SALT: 202,
  HILL_T: 0.58,
  CALM_R0: 48, // Zero hills within safe village core
  CALM_R1: 110, // Smooth ramp-up of hills framing the valley

  // Spatial Partitioning & Caching
  CHUNK_TILES: 16,
  PLAN_MARGIN: 16,
  MAX_CACHED_PLANS: 128,

  // Settlements (S6)
  REGION_TILES: 96,
  MIN_VILLAGE_DIST: 120, // Reduced from 160 to allow closer neighbors in next valley
  MIN_OCEAN_DIST: 12,
  VILLAGE_PROB: 0.70,
  VILLAGE_MARGIN: 6,
  VILLAGE_SALT: 777,
  VILLAGE_SALT_X: 778,
  VILLAGE_SALT_Y: 779,
  VILLAGE_SALT_TIER: 780,

  // Directional Corridors (Exact Pythagorean unit vectors, 0 transcendentals)
  CORRIDORS: [
    {
      id: 'corridor_ne',
      name: 'Route 1 (North-East)',
      // Unit vector: (3/5, -4/5) = (0.6, -0.8)
      dirX: 0.6,
      dirY: -0.8,
      perpX: 0.8,
      perpY: 0.6,
      maxLength: 240,
      fadeStart: 160,
      baseHalfWidth: 20,
      salt: 401,
    },
    {
      id: 'corridor_wsw',
      name: 'Verdant Wilds & Lake (West-South-West)',
      // Unit vector: (-4/5, 3/5) = (-0.8, 0.6)
      dirX: -0.8,
      dirY: 0.6,
      perpX: -0.6,
      perpY: -0.8,
      maxLength: 220,
      fadeStart: 140,
      baseHalfWidth: 18,
      salt: 402,
    },
    {
      id: 'corridor_sse',
      name: 'Frontier Valley (South-South-East)',
      // Unit vector: (7/25, 24/25) = (0.28, 0.96)
      dirX: 0.28,
      dirY: 0.96,
      perpX: -0.96,
      perpY: 0.28,
      maxLength: 210,
      fadeStart: 130,
      baseHalfWidth: 16,
      salt: 403,
    },
  ],
} as const;

export interface CorridorInfluenceResult {
  maxInfluence: number;
  corridorIndex: number;
}

/**
 * Computes directional corridor influence in [0, 1] for a tile (gx, gy).
 * Uses pure vector dot products and low-frequency noise for subtle curving.
 * STRICT INVARIANT I3: 0 transcendental functions.
 */
export function computeV3CorridorInfluence(
  gx: number,
  gy: number,
  seed: number
): CorridorInfluenceResult {
  const dx = gx - V3_CONFIG.START_ANCHOR_GX;
  const dy = gy - V3_CONFIG.START_ANCHOR_GY;

  let maxInf = 0;
  let bestIdx = -1;

  for (let i = 0; i < V3_CONFIG.CORRIDORS.length; i++) {
    const c = V3_CONFIG.CORRIDORS[i];

    // Longitudinal projection along corridor ray
    const t = dx * c.dirX + dy * c.dirY;
    if (t <= 0 || t >= c.maxLength) {
      continue;
    }

    // Perpendicular lateral distance
    const latDist = dx * c.perpX + dy * c.perpY;

    // Subtle organic curve using low-frequency noise along corridor length
    const curveNoise = valueNoise2(t / 64, 0, seed, c.salt) - 0.5; // [-0.5, 0.5]
    const curvedLatDist = Math.abs(latDist - curveNoise * 14);

    // Longitudinal taper factor
    const longFactor = 1 - smoothstep(c.fadeStart, c.maxLength, t);

    // Dynamic width tapering smoothly with distance
    const halfWidth = c.baseHalfWidth * (0.6 + 0.4 * longFactor);

    if (curvedLatDist < halfWidth) {
      const latFactor = 1 - curvedLatDist / halfWidth;
      const inf = latFactor * longFactor;
      if (inf > maxInf) {
        maxInf = inf;
        bestIdx = i;
      }
    }
  }

  return { maxInfluence: maxInf, corridorIndex: bestIdx };
}

/**
 * Computes organic effective distance from the village anchor.
 * Modulated by low-frequency noise and corridor influence.
 *
 * Points along corridors have reduced effective distance (extending land outward).
 * Points between corridors reach outer natural terrain earlier.
 */
export function computeV3EffectiveDistance(
  gx: number,
  gy: number,
  seed: number
): { effectiveDist: number; corridorInfluence: number; radialDist: number } {
  const dx = gx - V3_CONFIG.START_ANCHOR_GX;
  const dy = gy - V3_CONFIG.START_ANCHOR_GY;
  const radialDist = Math.hypot(dx, dy);

  // Hard safe core is untouched
  if (radialDist <= V3_CONFIG.SAFE_CORE_R) {
    return { effectiveDist: radialDist, corridorInfluence: 1, radialDist };
  }

  // 1. Low-frequency organic noise distortion
  const noiseVal = fbm2(
    gx / V3_CONFIG.ORGANIC_NOISE_SCALE,
    gy / V3_CONFIG.ORGANIC_NOISE_SCALE,
    seed,
    V3_CONFIG.ORGANIC_NOISE_SALT,
    3
  ); // [0, 1]
  const organicFactor = 1 + (noiseVal - 0.5) * (V3_CONFIG.ORGANIC_NOISE_WEIGHT * 2);
  const organicDist = radialDist * organicFactor;

  // 2. Corridors extend land outward by reducing effective distance
  const { maxInfluence } = computeV3CorridorInfluence(gx, gy, seed);
  const corridorDilation = 1 - 0.46 * maxInfluence;

  const effectiveDist = Math.max(0, organicDist * corridorDilation);

  return { effectiveDist, corridorInfluence: maxInfluence, radialDist };
}

/**
 * Calculates safety / land preservation metric in [0, 1].
 * 1.0 = 100% safe village core, 0.0 = completely wild natural terrain.
 */
export function computeV3SafetyLevel(gx: number, gy: number, seed: number): number {
  const { effectiveDist, radialDist } = computeV3EffectiveDistance(gx, gy, seed);
  if (radialDist <= V3_CONFIG.SAFE_CORE_R) return 1.0;
  const w = smoothstep(V3_CONFIG.VALLEY_R0, V3_CONFIG.VALLEY_R1, effectiveDist);
  return 1.0 - w;
}
