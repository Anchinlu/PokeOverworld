import type { Direction, Point } from './api-contract';

/**
 * Shared Player domain contracts.
 *
 * These types describe the intended boundary between the overworld client,
 * persistence, and a future authoritative server. They are contracts only;
 * they do not replace the current Player entity or PlayerService yet.
 */

export type PlayerGender = 'male' | 'female';
export type PlayerSpeedMode = 'classic' | 'brisk' | 'run';
export type PlayerMovementStatus = 'idle' | 'moving' | 'blocked';
export type PlayerAnimationState = 'standing' | 'walking' | 'idle_special';

export interface PlayerIdentity {
  playerId: string;
  displayName: string;
  gender: PlayerGender;
}

export interface PlayerAppearance {
  trainerSpriteKey: string;
  paletteKey?: string;
  outfitKey?: string;
  accessoryKey?: string;
}

export interface PlayerProgression {
  money: number;
  badges: string[];
  playTimeSeconds: number;
  pokedexSeenCount: number;
  pokedexCaughtCount: number;
  storyFlags: Record<string, boolean>;
  questFlags: Record<string, boolean>;
}

export interface PlayerWorldPosition extends Point {
  direction: Direction;
}

export interface PlayerMovementState {
  status: PlayerMovementStatus;
  speedMode: PlayerSpeedMode;
  from: PlayerWorldPosition;
  target: PlayerWorldPosition;
  progress: number;
}

export interface PlayerAnimationStateData {
  state: PlayerAnimationState;
  frame: number;
  stepCount: number;
  idleElapsedMs: number;
}

/** Serializable runtime state used by client snapshots and future networking. */
export interface PlayerRuntimeState {
  position: PlayerWorldPosition;
  movement: PlayerMovementState;
  animation: PlayerAnimationStateData;
}

/** Intended aggregate boundary for a complete player profile. */
export interface PlayerDomainState {
  schemaVersion: 1;
  identity: PlayerIdentity;
  appearance: PlayerAppearance;
  progression: PlayerProgression;
  runtime: PlayerRuntimeState;
}

export type PlayerMovementCommand =
  | { type: 'move'; direction: Direction }
  | { type: 'face'; direction: Direction }
  | { type: 'set_speed_mode'; speedMode: PlayerSpeedMode }
  | { type: 'stop' };

export interface PlayerInteractionRequest {
  type: 'interact';
  actor: PlayerWorldPosition;
  target: Point;
}

export interface PlayerMovementPort {
  dispatch(command: PlayerMovementCommand): void;
  snapshot(): PlayerRuntimeState;
}

export interface PlayerPersistencePort {
  load(playerId: string): Promise<PlayerDomainState | null>;
  save(state: PlayerDomainState): Promise<void>;
}

export interface PlayerInteractionPort {
  interact(request: PlayerInteractionRequest): void;
}
