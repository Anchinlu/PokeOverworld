import type { WildEntity, BehaviorProfile } from '../../model';
import type { PlayerQuery } from '../../ports/player-query';

export interface PerceptionResult {
  isDetected: boolean;
  distanceTiles: number;
  effectiveRadius: number;
}

/**
 * Evaluates whether a wild creature perceives the player.
 * Section 6.3:
 * effectiveRadius = detectRadius * (playerRunning ? runNoiseMult : 1) * (inGrass ? grassStealthMult : 1)
 */
export function evaluatePlayerPerception(
  entity: WildEntity,
  player: PlayerQuery,
  profile: BehaviorProfile
): PerceptionResult {
  const pPos = player.position();
  const dx = pPos.gx - entity.gx;
  const dy = pPos.gy - entity.gy;
  const dist = Math.hypot(dx, dy);

  const noiseMult = player.isRunning() ? profile.senses.runNoiseMult : 1.0;
  const stealthMult = player.inTallGrass() ? profile.senses.grassStealthMult : 1.0;
  const effectiveRadius = profile.senses.detectRadius * noiseMult * stealthMult;

  // Vision / hearing detection
  const isDetected = dist <= effectiveRadius;

  return {
    isDetected,
    distanceTiles: dist,
    effectiveRadius,
  };
}
