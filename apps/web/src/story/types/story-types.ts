/**
 * Story System Core Types & Event Contracts
 * Standardized contracts for Acts, Scenes, Events, Triggers, and Checkpoints.
 */

import type { StoryContext } from './story-context';

export type StoryAct = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface StoryCondition {
  flag?: string;
  flagEquals?: boolean | number | string;
  flagNotSet?: string;
  questId?: string;
  questStageMin?: number;
  questStageMax?: number;
  trainerDefeated?: string;
  trainerNotDefeated?: string;
}

export type StoryTriggerType =
  | 'step_proximity'
  | 'anchor_proximity'
  | 'npc_interaction'
  | 'room_warp'
  | 'condition_auto';

export interface StepProximityTrigger {
  type: 'step_proximity';
  targetGX: number;
  targetGY: number;
  radiusX?: number;
  radiusY?: number;
}

export interface AnchorProximityTrigger {
  type: 'anchor_proximity';
  anchorId: string;
  radius?: number;
}

export interface NpcInteractionTrigger {
  type: 'npc_interaction';
  npcId: string;
}

export interface RoomWarpTrigger {
  type: 'room_warp';
  buildingType?: string;
  roomId?: string;
}

export interface ConditionAutoTrigger {
  type: 'condition_auto';
}

export type StoryTriggerRule =
  | StepProximityTrigger
  | AnchorProximityTrigger
  | NpcInteractionTrigger
  | RoomWarpTrigger
  | ConditionAutoTrigger;

export type StoryEventLifecycleState =
  | 'idle'
  | 'triggered'
  | 'preparing'
  | 'running'
  | 'committing'
  | 'completed'
  | 'aborting'
  | 'aborted';

export interface StoryEventDefinition {
  /** Stable unique identifier (e.g., 'act1.pallet.prologue') */
  id: string;
  /** Numerical Act/Story Chapter (1: Pallet, 2: Route 1, 3: Viridian City, etc.) */
  act: StoryAct;
  /** Relative priority when multiple events trigger simultaneously (higher = first) */
  priority?: number;
  /** Human-readable scene description or stable code */
  scene: string;
  /** Trigger rule determining how the event is activated */
  trigger: StoryTriggerRule;
  /** Prerequisites required before the event can trigger */
  prerequisites?: StoryCondition[];
  /** Optional world/resource preparation before run (does NOT grant rewards) */
  prepare?(context: StoryContext): Promise<void>;
  /** Execution logic for the cutscene event */
  run(context: StoryContext): Promise<void>;
  /** Atomic commit of rewards, flags, and progression */
  commit?(context: StoryContext): Promise<void>;
  /** Post-execution or post-abort cleanup */
  cleanup?(context: StoryContext): Promise<void>;
  /** Checkpoint key saved to prevent lost progress */
  checkpoint?: string;
  /** Clean abortion handler if the game is paused, reset, or save slot changed */
  onAbort?: (context: StoryContext) => void | Promise<void>;
}

export interface StoryCheckpointRecord {
  checkpointId: string;
  eventId: string;
  act: StoryAct;
  savedAtTimestamp: number;
  metadata?: Record<string, unknown>;
}
