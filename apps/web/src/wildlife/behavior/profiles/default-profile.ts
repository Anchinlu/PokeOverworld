import type { BehaviorProfile } from '../../model';

export const DEFAULT_BEHAVIOR_PROFILE: BehaviorProfile = {
  id: 'curious_rodent',
  temperament: 'curious',
  social: 'herd',
  activity: 'all_day',
  senses: {
    detectRadius: 5,
    runNoiseMult: 1.5,
    grassStealthMult: 0.6,
  },
  needs: {
    hungerRate: 0.002,
    energyRate: 0.0015,
  },
  anchors: ['burrow', 'tall_grass'],
  threat: {
    fleeBelowRatio: 0.7,
    warnAboveRatio: 1.3,
  },
  weights: {
    wander: 0.3,
    forage: 0.3,
    rest: 0.15,
    curious: 0.2,
    alert: 0.05,
  },
};
