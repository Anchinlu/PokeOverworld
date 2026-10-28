/**
 * Story Event Registry
 * Central repository for registering, retrieving, and querying StoryEventDefinitions.
 */

import type { StoryAct, StoryEventDefinition } from '../types';
import { StoryTriggerEvaluator, type TriggerEvaluationContext } from './story-trigger-evaluator';
import type { StoryState } from './story-state';

export class StoryEventRegistry {
  private events = new Map<string, StoryEventDefinition>();

  public register(event: StoryEventDefinition): void {
    this.events.set(event.id, event);
  }

  public unregister(id: string): void {
    this.events.delete(id);
  }

  public get(id: string): StoryEventDefinition | undefined {
    return this.events.get(id);
  }

  public getAll(): StoryEventDefinition[] {
    return Array.from(this.events.values());
  }

  public getByAct(act: StoryAct): StoryEventDefinition[] {
    return this.getAll().filter((e) => e.act === act);
  }

  /**
   * Finds the first event matching the given context and passing all prerequisites.
   */
  public findTriggerable(
    context: TriggerEvaluationContext,
    state: StoryState
  ): StoryEventDefinition | undefined {
    for (const event of this.events.values()) {
      if (StoryTriggerEvaluator.canTrigger(event, state, context)) {
        return event;
      }
    }
    return undefined;
  }

  public clear(): void {
    this.events.clear();
  }
}

export const storyEventRegistry = new StoryEventRegistry();
