/**
 * Story Trigger Evaluator
 * Evaluates whether a story event's trigger condition matches the current world context.
 */

import type { StoryEventDefinition, StoryTriggerRule } from '../types';
import type { StoryState } from './story-state';
import { storyAnchorRegistry } from './story-anchor-registry';

export interface TriggerEvaluationContext {
  playerGX: number;
  playerGY: number;
  npcId?: string;
  roomId?: string;
  buildingType?: string;
}

export class StoryTriggerEvaluator {
  /**
   * Evaluates both prerequisites and trigger rules for a StoryEventDefinition.
   */
  public static canTrigger(
    event: StoryEventDefinition,
    state: StoryState,
    context: TriggerEvaluationContext
  ): boolean {
    // 1. Check prerequisites (flags, quest stages, trainer status)
    if (!state.evaluateAll(event.prerequisites)) {
      return false;
    }

    // 2. Check trigger rule against evaluation context
    return StoryTriggerEvaluator.matchesTrigger(event.trigger, context);
  }

  /**
   * Matches a single trigger rule against current context.
   */
  public static matchesTrigger(
    trigger: StoryTriggerRule,
    context: TriggerEvaluationContext
  ): boolean {
    switch (trigger.type) {
      case 'anchor_proximity': {
        const coord = storyAnchorRegistry.resolve(trigger.anchorId);
        if (!coord) return false;
        const radius = trigger.radius ?? 2;
        const dx = Math.abs(context.playerGX - coord.gx);
        const dy = Math.abs(context.playerGY - coord.gy);
        return dx <= radius && dy <= radius;
      }

      case 'step_proximity': {
        const rx = trigger.radiusX ?? 1;
        const ry = trigger.radiusY ?? 1;
        const dx = Math.abs(context.playerGX - trigger.targetGX);
        const dy = Math.abs(context.playerGY - trigger.targetGY);
        return dx <= rx && dy <= ry;
      }

      case 'npc_interaction': {
        return !!context.npcId && context.npcId === trigger.npcId;
      }

      case 'room_warp': {
        if (trigger.roomId && trigger.roomId !== context.roomId) return false;
        if (trigger.buildingType && trigger.buildingType !== context.buildingType) return false;
        return true;
      }

      case 'condition_auto': {
        return true;
      }

      default:
        return false;
    }
  }
}
