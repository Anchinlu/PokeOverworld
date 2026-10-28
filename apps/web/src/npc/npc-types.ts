/**
 * NPC AI, Behavior, Story Script, Trainer & Cutscene Type Definitions
 */

import type { Direction } from '@pokemon/shared-types';

export type NPCMovementMode =
  | 'stationary'
  | 'turn_random'
  | 'turn_cycle'
  | 'wander_box'
  | 'patrol_path';

export type NPCEmoteType =
  | 'exclamation' // !
  | 'exclamation_double' // !!
  | 'question' // ?
  | 'question_exclamation' // !?
  | 'music' // ♪
  | 'heart' // ❤️
  | 'sweat' // 💧
  | 'sparkle' // ✨
  | 'chat' // 💬
  | 'sleep' // Zzz
  | 'angry' // 💢
  | 'happy' // ^_^
  | 'poison' // ☠️
  | 'dizzy'; // @.@

export type NPCTimeBand = 'morning' | 'day' | 'evening' | 'night';

export type NPCWeatherType =
  | 'clear'
  | 'sun'
  | 'rain'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'sandstorm'
  | 'sand';

export interface NPCScheduleRule {
  timeBands?: NPCTimeBand[];
  weather?: NPCWeatherType[];
  overrideDialogue?: string[];
  overrideMovementMode?: NPCMovementMode;
  overrideEmote?: NPCEmoteType;
  visible?: boolean;
}

export interface NPCStoryCondition {
  flag?: string;
  flagEquals?: boolean | number | string;
  flagNotSet?: string;
  questId?: string;
  questStageMin?: number;
  questStageMax?: number;
  trainerDefeated?: string;
  trainerNotDefeated?: string;
}

export type NPCEventAction =
  | { type: 'HEAL_PARTY'; message?: string }
  | { type: 'GIVE_ITEM'; itemId: string; count: number; flagToSet?: string; message?: string }
  | {
      type: 'GIVE_POKEMON';
      speciesKey: string;
      level: number;
      isShiny?: boolean;
      flagToSet?: string;
      message?: string;
    }
  | { type: 'GIVE_MONEY'; amount: number; flagToSet?: string; message?: string }
  | { type: 'SET_FLAG'; key: string; value: boolean | number | string }
  | { type: 'ADVANCE_QUEST'; questId: string; stage: number; completed?: boolean }
  | { type: 'EMOTE'; emote: NPCEmoteType; durationMs?: number }
  | { type: 'START_TRAINER_BATTLE'; trainerId: string }
  | { type: 'RUN_CUTSCENE'; cutsceneId: string };

export interface NPCDialogueChoice {
  label: string;
  responseLines?: string[];
  actions?: NPCEventAction[];
  nextBranchId?: string;
}

export interface NPCDialogueBranch {
  id?: string;
  condition?: NPCStoryCondition;
  lines: string[];
  emoteOnOpen?: NPCEmoteType;
  choicesPrompt?: string;
  choices?: NPCDialogueChoice[];
  actionsOnComplete?: NPCEventAction[];
}

export interface NPCStoryScript {
  scriptId: string;
  speakerName?: string;
  branches: NPCDialogueBranch[];
  defaultLines: string[];
}

export interface NPCTrainerPokemonSpec {
  speciesKey: string;
  level: number;
  isShiny?: boolean;
}

export interface NPCTrainerProfile {
  trainerId: string;
  trainerClass: string;
  name: string;
  spriteKey: string;
  prizeMoney: number;
  party: NPCTrainerPokemonSpec[];
  preBattleLines: string[];
  defeatToast: string;
  postBattleLines: string[];
  rewardItem?: { itemId: string; count: number };
  flagOnWin?: string;
  questAdvanceOnWin?: { questId: string; stage: number; completed?: boolean };
}

export type CutsceneStep =
  | { type: 'LOCK_INPUT' }
  | { type: 'EMOTE'; targetId: 'player' | string; emote: NPCEmoteType; durationMs: number }
  | { type: 'FACE'; targetId: 'player' | string; direction: Direction }
  | { type: 'MOVE_STEPS'; targetId: 'player' | string; steps: Direction[] }
  | { type: 'DIALOGUE'; speaker: string; lines: string[] }
  | { type: 'ACTION'; action: NPCEventAction }
  | { type: 'WAIT'; durationMs: number }
  | { type: 'UNLOCK_INPUT' };

export interface CutsceneDefinition {
  cutsceneId: string;
  steps: CutsceneStep[];
}

export interface CutsceneActor {
  id: string;
  name: string;
  spriteKey: string;
  gx: number;
  gy: number;
  x: number;
  y: number;
  direction: Direction;
  frame: number;
  visible: boolean;
  activeEmote?: NPCEmoteType | null;
  emoteTimerMs?: number;
  hopY?: number;
}

export interface NPCRuntimeState {
  gx: number;
  gy: number;
  homeGX: number;
  homeGY: number;
  fromGX: number;
  fromGY: number;
  toGX: number;
  toGY: number;
  x: number;
  y: number;
  direction: Direction;
  initialDirection: Direction;
  isMoving: boolean;
  stepProgress: number;
  stepCount: number;
  /** Strictly 0 when stationary; 4-frame walk cycle (1, 0, 3, 0) only while isMoving === true */
  frame: number;
  turnTimerMs: number;
  turnCycleIndex: number;
  patrolIndex: number;
  patrolForward: boolean;
  moveCooldownMs: number;
  activeEmote: NPCEmoteType | null;
  emoteTimerMs: number;
  ambientEmoteCooldownMs: number;
  isLookingAtPlayer: boolean;
  visible: boolean;
}
