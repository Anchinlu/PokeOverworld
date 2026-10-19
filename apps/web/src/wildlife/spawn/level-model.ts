import { speciesSpawnData, spawnConfigData } from '../data/data-loader';
import type { WildEntity, WildRole } from '../model';
import type { RarityTier } from './rarity';

export interface LevelModelOptions {
  l0?: number;
  step?: number;
  min?: number;
  max?: number;
  startZoneCap?: number;
  startZoneRadius?: number;
}

const DEFAULT_PLAYER_MAX_OWNED_LEVEL = 5;

function getRarityBonus(tier: RarityTier, roll01: number): number {
  const [min, max] = spawnConfigData.rarityLevelBonus[tier] ?? [1, 6];
  return min + Math.floor(Math.max(0, Math.min(0.999999, roll01)) * (max - min + 1));
}

function getRarityLevelCap(tier: RarityTier, configuredMax: number): number {
  const rarityCap = spawnConfigData.rarityLevelCap[tier] ?? configuredMax;
  return Math.max(1, Math.min(configuredMax, rarityCap));
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
  rarityTier?: RarityTier;
  playerMaxOwnedLevel?: number;
  roll01: number;
  opts?: LevelModelOptions;
}): { level: number; role: WildRole } {
  const {
    baseLevel,
    role,
    distance,
    stage = 1,
    rarityTier = 0,
    playerMaxOwnedLevel = DEFAULT_PLAYER_MAX_OWNED_LEVEL,
    roll01,
    opts,
  } = params;
  const min = opts?.min ?? spawnConfigData.level.min;
  const configuredMax = opts?.max ?? spawnConfigData.level.max;
  const max = getRarityLevelCap(rarityTier, configuredMax);
  const startRadius = opts?.startZoneRadius ?? spawnConfigData.level.startZoneRadius ?? 100;
  const isStartZone = distance <= startRadius;

  const ownedLevel = Math.max(min, Math.min(max, Math.floor(playerMaxOwnedLevel)));
  const levelAnchor = Math.max(baseLevel, ownedLevel);
  const rarityBonus = getRarityBonus(rarityTier, roll01);

  if (isStartZone) {
    // Apex is still prohibited near the starting area, but normal encounters
    // scale with the strongest Pokémon the player owns.
    const effectiveRole = role === 'apex' ? 'leader' : role;
    const roleBonus = effectiveRole === 'leader' ? 1 : 0;
    return {
      level: Math.min(max, levelAnchor + rarityBonus + roleBonus),
      role: effectiveRole,
    };
  }

  if (role === 'solo' || role === 'member') {
    // Small variation: -1, 0, or +1
    const variation = Math.floor(roll01 * 3) - 1;
    return {
      level: Math.max(min, Math.min(max, levelAnchor + rarityBonus + variation)),
      role,
    };
  }

  if (role === 'leader') {
    const [bMin, bMax] = spawnConfigData.leaderBonus || [3, 8];
    const bonus = bMin + Math.floor(roll01 * (bMax - bMin + 1));
    return {
      level: Math.max(min, Math.min(max, levelAnchor + rarityBonus + bonus)),
      role: 'leader',
    };
  }

  if (role === 'apex') {
    const [aMin, aMax] = spawnConfigData.apex.levelBonus || [10, 20];
    const bonus = aMin + Math.floor(roll01 * (aMax - aMin + 1));
    let apexLevel = levelAnchor + rarityBonus + bonus;

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

/**
 * Re-evaluates only the level of an already spawned entity after the player's
 * strongest owned Pokémon changes. Species, position, herd membership and
 * deterministic spawn identity remain untouched.
 */
export function rescaleWildEntityLevel(
  entity: Pick<WildEntity, 'speciesKey' | 'role' | 'rarityTier' | 'seed'>,
  distance: number,
  playerMaxOwnedLevel: number
): number {
  const species = speciesSpawnData[entity.speciesKey];
  const { level } = calculateEntityLevel({
    baseLevel: calculateBaseLevel(distance),
    role: entity.role ?? 'solo',
    distance,
    stage: species?.stage ?? 1,
    rarityTier: entity.rarityTier ?? 0,
    playerMaxOwnedLevel,
    roll01: Math.max(0, Math.min(0.999999, entity.seed / 1_000_000)),
  });
  return level;
}
