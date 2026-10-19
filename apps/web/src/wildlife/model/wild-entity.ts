export type WildRole = 'solo' | 'member' | 'leader' | 'apex';
export type WildRarityTier = 0 | 1 | 2 | 3 | 4;

export type WildEmoteType = '!' | '?' | 'sweat' | 'dots';

export interface WildEmote {
  type: WildEmoteType;
  timer: number;
  maxTime: number;
}

export type WildState =
  | 'idle'
  | 'wander'
  | 'forage'
  | 'rest_sleep'
  | 'groom_play'
  | 'alert'
  | 'curious'
  | 'flee'
  | 'fleeing'
  | 'territorial'
  | 'chase'
  | 'return_home';

export type WildTimeBand = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * Core entity model for all overworld wild creatures.
 * Fully backwards-compatible with legacy WildPokemonEntity.
 */
export interface WildEntity {
  id?: string;
  gx: number;
  gy: number;
  x: number;
  y: number;
  speciesKey: string;
  name: string;
  level: number;
  isShiny?: boolean;
  behavior: string;
  dir: number;
  homeGX: number;
  homeGY: number;
  wanderRadius: number;
  state: WildState | string;
  isMoving: boolean;
  fromX: number;
  fromY: number;
  targetGX: number;
  targetGY: number;
  targetX: number;
  targetY: number;
  stepProgress: number;
  moveSpeed: number;
  stepsRemaining: number;
  currentDir: number;
  lastMoveTime: number;
  idleTimer: number;
  isPecking?: boolean;
  peckStartTime?: number;
  bobY?: number;
  frame: number;
  emote?: WildEmote | null;
  seed: number;
  chunkCx: number;
  chunkCy: number;

  // Wildlife System extensions (Section 4 & 5)
  role?: WildRole;
  /** Rarity tier selected when this entity was generated. */
  rarityTier?: WildRarityTier;
  /** Time bands in which this species is awake and eligible to appear. */
  activeTime?: WildTimeBand[];
  herdId?: string;
  gender?: 'M' | 'F' | 'genderless';
  isSwimming?: boolean;
  isWaterDweller?: boolean;
}

/** Legacy alias for backwards compatibility across older modules */
export type WildPokemonEntity = WildEntity;
