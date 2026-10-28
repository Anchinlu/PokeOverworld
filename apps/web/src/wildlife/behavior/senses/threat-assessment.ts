import type { WildEntity, BehaviorProfile } from '../../model';

export type ThreatReaction = 'flee' | 'warn' | 'territorial' | 'curious' | 'ignore';

/**
 * Evaluates threat level and behavioral reaction to perceived player.
 * Section 6.3:
 * ratio = level_hoang_da / Lp
 * ratio < fleeBelowRatio -> flee
 * ratio > warnAboveRatio or role in {leader, apex} -> warn, then territorial / chase
 * otherwise -> according to temperament (curious, ignore, skittish)
 */
export function assessThreat(
  entity: WildEntity,
  playerRefLevel: number,
  profile: BehaviorProfile
): { reaction: ThreatReaction; ratio: number } {
  const pLevel = Math.max(1, playerRefLevel);
  const ratio = entity.level / pLevel;

  // Aggressive creatures always challenge the player and never flee
  if (profile.temperament === 'aggressive') {
    return { reaction: 'warn', ratio };
  }

  // Weak creature flees
  if (ratio < profile.threat.fleeBelowRatio) {
    return { reaction: 'flee', ratio };
  }

  // Strong creature or Leader / Apex warns and holds territory
  const isLeaderOrApex = entity.role === 'leader' || entity.role === 'apex';
  if (ratio > profile.threat.warnAboveRatio || isLeaderOrApex) {
    return { reaction: 'warn', ratio };
  }

  // Temperament reaction
  if (profile.temperament === 'curious') {
    return { reaction: 'curious', ratio };
  }
  if (profile.temperament === 'skittish') {
    return { reaction: 'flee', ratio };
  }
  if (profile.temperament === 'territorial') {
    return { reaction: 'warn', ratio };
  }

  return { reaction: 'ignore', ratio };
}
