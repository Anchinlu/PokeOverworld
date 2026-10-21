import type { WildEntity, BehaviorProfile } from '../../model';
import type { WorldQuery } from '../../ports/world-query';
import type { PlayerQuery } from '../../ports/player-query';
import { evaluatePlayerPerception } from '../senses/perception';
import { assessThreat } from '../senses/threat-assessment';
import { isCreatureNaturallySleeping, isStartledAwake } from '../schedule/daily-rhythm';
import { calculateHerdCohesion } from '../social/herd-controller';
import { getWeatherBehaviorModifiers } from '../schedule/weather-response';

export interface UtilityScores {
  idle: number;
  wander: number;
  forage: number;
  rest_sleep: number;
  groom_play: number;
  alert: number;
  curious: number;
  flee: number;
  territorial: number;
  chase: number;
  return_home: number;
}

/**
 * Calculates utility considerations across all candidate behaviors for a wild entity.
 * Section 6.2:
 * - Mỗi nhịp tính điểm cho từng trạng thái từ nhu cầu (đói, năng lượng, sợ hãi),
 *   kích thích (khoảng cách người chơi, đi bộ hay chạy, giờ, thời tiết, loài khác)
 *   và trọng số hồ sơ.
 */
export function calculateUtilityScores(
  entity: WildEntity,
  profile: BehaviorProfile,
  world: WorldQuery,
  player: PlayerQuery,
  leader?: WildEntity
): UtilityScores {
  const scores: UtilityScores = {
    idle: 0.15,
    wander: profile.weights.wander ?? 0.25,
    forage: profile.weights.forage ?? 0.25,
    // Rest/sleep is event-driven. The daily rhythm or severe weather can
    // raise it explicitly; it must not beat ordinary patrol/forage scores
    // during a clear active period.
    rest_sleep: profile.temperament === 'dormant' ? (profile.weights.rest ?? 0.1) : 0.0,
    groom_play: 0.05,
    // Alert is event-driven. A high alert weight must not make territorial
    // species freeze permanently when no threat is actually perceived.
    alert: 0.0,
    curious: profile.weights.curious ?? 0.1,
    flee: 0.0,
    territorial: 0.0,
    chase: 0.0,
    return_home: 0.0,
  };

  // 1. Sensory evaluation of player
  const perception = evaluatePlayerPerception(entity, player, profile);
  const pRefLevel = player.referenceLevel();

  // 2. Circadian rhythm (Daily sleep vs wake)
  const isSleeping = isCreatureNaturallySleeping(profile.activity, world.timeBand());
  if (isSleeping) {
    if (isStartledAwake(perception.distanceTiles)) {
      // Startled awake! Alert and ready to react
      scores.alert = Math.max(scores.alert, 0.8);
      scores.rest_sleep = 0.0;
    } else {
      // Sleep soundly
      scores.rest_sleep = 0.95;
    }
  }

  // Weather changes motivation rather than forcing a hard-coded state.
  const weather = getWeatherBehaviorModifiers(entity.speciesKey, world.weather());
  scores.wander *= weather.activityMultiplier;
  scores.forage *= weather.activityMultiplier;
  scores.curious *= weather.activityMultiplier;
  if (weather.prefersShelter) {
    scores.return_home = Math.max(scores.return_home, 0.65);
    scores.rest_sleep = Math.max(scores.rest_sleep, 0.3);
  }

  // 3. Player detection and threat reaction
  if (perception.isDetected) {
    scores.alert = profile.weights.alert ?? 0.05;
    const { reaction } = assessThreat(entity, pRefLevel, profile);

    if (reaction === 'flee') {
      // High urgency fear
      scores.flee = 0.95;
    } else if (reaction === 'warn') {
      scores.alert = 0.85;
      if (profile.temperament === 'aggressive' || profile.temperament === 'territorial') {
        scores.territorial = 0.8;
        if (perception.distanceTiles <= 3.0) {
          scores.chase = 0.9;
        }
      }
    } else if (reaction === 'curious') {
      scores.curious = 0.75;
    }
  }

  // 4. Herd Cohesion (Return home / follow leader)
  if (leader && leader.id !== entity.id && entity.role === 'member') {
    const cohesion = calculateHerdCohesion(entity, leader);
    if (cohesion.shouldPull || cohesion.shouldPush) {
      scores.return_home = 0.8;
    }
  }

  // 5. Wander radius boundary check
  const distFromHome = Math.hypot(entity.gx - entity.homeGX, entity.gy - entity.homeGY);
  if (distFromHome > entity.wanderRadius) {
    scores.return_home = Math.max(scores.return_home, 0.75);
  }

  return scores;
}
