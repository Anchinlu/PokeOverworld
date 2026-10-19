import type { WildRole } from '../model';

export type LevelIndicator =
  | { kind: 'level'; text: string } // e.g. "Lv.12"
  | { kind: 'unknown_red'; text: '???' }
  | { kind: 'none' };

export interface LevelIndicatorOptions {
  showLowApexAsLevel?: boolean;
  lowApexGap?: number; // default: 10
}

/**
 * Determines overhead level display based on entity role and player reference level.
 * Pure logic testable without Canvas or DOM dependencies.
 */
export function getLevelIndicator(
  entity: { level: number; role?: WildRole },
  playerRefLevel: number,
  opts?: LevelIndicatorOptions
): LevelIndicator {
  const role: WildRole = entity.role ?? 'solo';
  const isLeaderOrApex = role === 'leader' || role === 'apex';

  if (isLeaderOrApex) {
    if (opts?.showLowApexAsLevel) {
      const gap = opts.lowApexGap ?? 10;
      if (entity.level <= playerRefLevel - gap) {
        return { kind: 'level', text: `Lv.${entity.level}` };
      }
    }
    return { kind: 'unknown_red', text: '???' };
  }

  // Regular wild pokemon (solo or herd member)
  if (entity.level < playerRefLevel) {
    return { kind: 'level', text: `Lv.${entity.level}` };
  }

  return { kind: 'none' };
}
