import type { WildEntity, BehaviorProfile, WildState, WildEmoteType } from '../../model';
import type { WorldQuery } from '../../ports/world-query';
import type { PlayerQuery } from '../../ports/player-query';
import { calculateUtilityScores } from './considerations';
import { calculateHerdCohesion } from '../social/herd-controller';

export interface BrainDecision {
  nextState: WildState;
  suggestedDir?: number;
  triggerEmote?: WildEmoteType;
}

export const HYSTERESIS_MARGIN = 0.15;
export const MIN_STATE_DURATION_MS = 600;

// Direction helpers: 0: Down (y+1), 1: Left (x-1), 2: Right (x+1), 3: Up (y-1)
export function getDirectionTowards(
  fromGX: number,
  fromGY: number,
  toGX: number,
  toGY: number
): number {
  const dx = toGX - fromGX;
  const dy = toGY - fromGY;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 2 : 1;
  }
  return dy > 0 ? 0 : 3;
}

export function getDirectionAway(
  fromGX: number,
  fromGY: number,
  awayGX: number,
  awayGY: number
): number {
  const dx = fromGX - awayGX;
  const dy = fromGY - awayGY;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 2 : 1;
  }
  return dy > 0 ? 0 : 3;
}

/**
 * Utility Brain deciding the highest-utility state with hysteresis and inertia.
 * Section 6.2:
 * - Quán tính: mỗi trạng thái có thời gian tối thiểu để không rung lắc; thêm ngưỡng chuyển (hysteresis).
 */
export function decideNextAction(
  entity: WildEntity,
  profile: BehaviorProfile,
  world: WorldQuery,
  player: PlayerQuery,
  elapsedInCurrentStateMs: number,
  leader?: WildEntity
): BrainDecision {
  const scores = calculateUtilityScores(entity, profile, world, player, leader);

  // Highest score candidate
  let bestState: WildState = 'idle';
  let bestScore = -1;

  for (const [stateKey, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestState = stateKey as WildState;
    }
  }

  const currentState = entity.state as WildState;
  const currentScore = (scores as unknown as Record<string, number>)[currentState] ?? 0;

  // Urgent states bypass inertia
  const isUrgent = bestState === 'flee' || (bestState === 'alert' && scores.alert >= 0.8);

  if (!isUrgent && elapsedInCurrentStateMs < MIN_STATE_DURATION_MS) {
    bestState = currentState;
  } else if (!isUrgent && currentState !== 'idle' && bestScore < currentScore + HYSTERESIS_MARGIN) {
    bestState = currentState;
  }

  // Direction and Emote hints based on chosen state
  const pPos = player.position();
  let suggestedDir: number | undefined;
  let triggerEmote: WildEmoteType | undefined;

  switch (bestState) {
    case 'flee':
      suggestedDir = getDirectionAway(entity.gx, entity.gy, pPos.gx, pPos.gy);
      triggerEmote = 'sweat';
      break;

    case 'curious':
      suggestedDir = getDirectionTowards(entity.gx, entity.gy, pPos.gx, pPos.gy);
      triggerEmote = '?';
      break;

    case 'alert':
    case 'territorial':
    case 'chase':
      suggestedDir = getDirectionTowards(entity.gx, entity.gy, pPos.gx, pPos.gy);
      triggerEmote = '!';
      break;

    case 'return_home':
      if (leader && entity.role === 'member') {
        const cohesion = calculateHerdCohesion(entity, leader);
        suggestedDir = getDirectionTowards(
          entity.gx,
          entity.gy,
          cohesion.targetGX,
          cohesion.targetGY
        );
      } else {
        suggestedDir = getDirectionTowards(entity.gx, entity.gy, entity.homeGX, entity.homeGY);
      }
      break;

    case 'rest_sleep':
      triggerEmote = 'dots'; // Representing "z" sleeping dots
      break;

    default:
      break;
  }

  return {
    nextState: bestState,
    suggestedDir,
    triggerEmote,
  };
}
