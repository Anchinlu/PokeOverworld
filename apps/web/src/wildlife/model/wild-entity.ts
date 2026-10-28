export type WildRole = 'solo' | 'member' | 'leader' | 'apex';
export type WildRarityTier = 0 | 1 | 2 | 3 | 4;

export type WildEmoteType =
  | '!'
  | '?'
  | 'sweat'
  | 'dots'
  | 'heart'
  | 'music'
  | 'anger'
  | 'eat'
  | 'happy';

export interface WildEmote {
  type: WildEmoteType;
  timer: number;
  maxTime: number;
}

/**
 * Logical footprint used by overworld collision and local avoidance.
 * Values are expressed in tile units around the entity's tile centre.
 */
export interface WildHitbox {
  radiusX: number;
  radiusY: number;
  offsetX?: number;
  offsetY?: number;
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
  /** Unmodified speed used when weather applies a temporary multiplier. */
  baseMoveSpeed?: number;
  stepsRemaining: number;
  currentDir: number;
  lastMoveTime: number;
  idleTimer: number;
  isPecking?: boolean;
  peckStartTime?: number;
  bobY?: number;
  /** Whether this species can traverse a flat-to-hill elevation step. */
  canJumpHills?: boolean;
  isJumping?: boolean;
  jumpType?: 'jump_up' | 'drop_down' | null;
  jumpY?: number;
  frame: number;
  idleAnimTimer?: number;
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
  /** Optional species-specific footprint; runtime falls back to a safe default. */
  hitbox?: WildHitbox;
}

/** Legacy alias for backwards compatibility across older modules */
export type WildPokemonEntity = WildEntity;
