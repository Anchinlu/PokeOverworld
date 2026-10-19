export type SocialType = 'solitary' | 'pair' | 'herd' | 'flock';

export interface Herd {
  id: string;
  speciesKey: string;
  leaderId: string;
  memberIds: string[];
  homeGX: number;
  homeGY: number;
  wanderRadius: number;
  isAlarmed?: boolean;
  alarmTimer?: number;
}
