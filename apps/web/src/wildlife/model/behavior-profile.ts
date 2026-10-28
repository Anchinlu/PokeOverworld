import type { SocialType } from './herd';

export type Temperament =
  'skittish' | 'aggressive' | 'curious' | 'passive' | 'territorial' | 'dormant';

export type ActivityRhythm = 'diurnal' | 'nocturnal' | 'crepuscular' | 'all_day';

export interface SensoryProfile {
  detectRadius: number;
  runNoiseMult: number;
  grassStealthMult: number;
}

export interface NeedProfile {
  hungerRate: number;
  energyRate: number;
}

export interface ThreatProfile {
  fleeBelowRatio: number;
  warnAboveRatio: number;
}

export interface StateWeights {
  wander: number;
  forage: number;
  rest: number;
  curious: number;
  alert: number;
  [key: string]: number;
}

export interface LocomotionProfile {
  wanderSpeed?: number;
  fleeSpeed?: number;
  chaseSpeed?: number;
}

export interface BehaviorProfile {
  id: string;
  temperament: Temperament;
  social: SocialType;
  activity: ActivityRhythm;
  senses: SensoryProfile;
  needs: NeedProfile;
  anchors: string[];
  threat: ThreatProfile;
  weights: StateWeights;
  moveSpeed?: number;
  locomotion?: LocomotionProfile;
  /** Data-driven tags used by weather and habitat modifiers. */
  tags?: readonly string[];
  /** Optional spawn/AI affinity multipliers by normalized weather key. */
  weather?: Readonly<Record<string, number>>;
}
