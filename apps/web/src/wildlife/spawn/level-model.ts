import { spawnConfigData } from '../data/data-loader';
import type { WildRole } from '../model';

export interface LevelModelOptions {
  l0?: number;
  step?: number;
  min?: number;
  max?: number;
  startZoneCap?: number;
  startZoneRadius?: number;
}

/**
 * Calculates base wild level as a function of distance d from starter town.
 * baseLevel(d) = clamp(L0 + floor(d / STEP), LMIN, LMAX)
 */
export function calculateBaseLevel(distance: number, opts?: LevelModelOptions): number {
  const l0 = opts?.l0 ?? spawnConfigData.level.l0;
  const step = opts?.step ?? spawnConfigData.level.step;
  const min = opts?.min ?? spawnConfigData.level.min;
  const max = opts?.max ?? spawnConfigData.level.max;
  const startRadius = opts?.startZoneRadius ?? spawnConfigData.level.startZoneRadius ?? 100;
  const startCap = opts?.startZoneCap ?? spawnConfigData.level.startZoneCap ?? 5;

  if (distance <= startRadius) {
    return Math.min(startCap, Math.max(min, l0));
  }

  const raw = l0 + Math.floor(distance / step);
  return Math.max(min, Math.min(max, raw));
}

/**
 * Calculates individual level based on role and stage requirements.
 */
export function calculateEntityLevel(params: {
  baseLevel: number;
  role: WildRole;
  distance: number;
  stage?: number;
  roll01: number;
  opts?: LevelModelOptions;
}): { level: number; role: WildRole } {
  const { baseLevel, role, distance, stage = 1, roll01, opts } = params;
  const min = opts?.min ?? spawnConfigData.level.min;
  const max = opts?.max ?? spawnConfigData.level.max;
  const startRadius = opts?.startZoneRadius ?? spawnConfigData.level.startZoneRadius ?? 100;
  const startCap = opts?.startZoneCap ?? spawnConfigData.level.startZoneCap ?? 5;
  const isStartZone = distance <= startRadius;

  if (isStartZone) {
    // In starter zone, apex is strictly prohibited and cap is enforced
    const effectiveRole = role === 'apex' ? 'leader' : role;
    const bonus = effectiveRole === 'leader' ? 1 : 0;
    return {
      level: Math.min(startCap, baseLevel + bonus),
      role: effectiveRole,
    };
  }

  if (role === 'solo' || role === 'member') {
    // Small variation: -1, 0, or +1
    const variation = Math.floor(roll01 * 3) - 1;
    return {
      level: Math.max(min, Math.min(max, baseLevel + variation)),
      role,
    };
  }

  if (role === 'leader') {
    const [bMin, bMax] = spawnConfigData.leaderBonus || [3, 8];
    const bonus = bMin + Math.floor(roll01 * (bMax - bMin + 1));
    return {
      level: Math.max(min, Math.min(max, baseLevel + bonus)),
      role: 'leader',
    };
  }

  if (role === 'apex') {
    const [aMin, aMax] = spawnConfigData.apex.levelBonus || [10, 20];
    const bonus = aMin + Math.floor(roll01 * (aMax - aMin + 1));
    let apexLevel = baseLevel + bonus;

    // Minimum stage level requirement (Stage 2 >= 16, Stage 3 >= 36)
    const stageMin = stage >= 3 ? 36 : stage >= 2 ? 16 : min;
    apexLevel = Math.max(apexLevel, stageMin);

    return {
      level: Math.max(min, Math.min(max, apexLevel)),
      role: 'apex',
    };
  }

  return { level: baseLevel, role };
}
