/**
 * Lightweight Asynchronous Cutscene & Event Script Runner
 */

import type { Direction } from '@pokemon/shared-types';
import type {
  CutsceneDefinition,
  CutsceneStep,
  NPCEmoteType,
  NPCEventAction,
} from './npc-types';
import { executeNPCEventActions, type StoryExecutionCallbacks } from './story-script-registry';

export interface CutsceneHostContext {
  setInputLocked: (locked: boolean) => void;
  triggerEntityEmote: (targetId: 'player' | string, emote: NPCEmoteType, durationMs: number) => void;
  setEntityDirection: (targetId: 'player' | string, direction: Direction) => void;
  stepEntity: (targetId: 'player' | string, direction: Direction) => Promise<void>;
  showScriptDialogue: (speaker: string, lines: string[]) => Promise<void>;
  storyCallbacks?: StoryExecutionCallbacks;
}

const cutsceneRegistry = new Map<string, CutsceneDefinition>();

export function registerCutscene(def: CutsceneDefinition): void {
  cutsceneRegistry.set(def.cutsceneId, def);
}

export function getCutscene(cutsceneId: string): CutsceneDefinition | undefined {
  return cutsceneRegistry.get(cutsceneId);
}

export class CutsceneRunner {
  private isRunning = false;

  public isActive(): boolean {
    return this.isRunning;
  }

  public async runCutscene(
    cutsceneOrId: string | CutsceneDefinition,
    host: CutsceneHostContext
  ): Promise<void> {
    if (this.isRunning) return;
    const def =
      typeof cutsceneOrId === 'string' ? cutsceneRegistry.get(cutsceneOrId) : cutsceneOrId;
    if (!def) return;

    this.isRunning = true;
    try {
      for (const step of def.steps) {
        await this.executeStep(step, host);
      }
    } finally {
      host.setInputLocked(false);
      this.isRunning = false;
    }
  }

  private async executeStep(step: CutsceneStep, host: CutsceneHostContext): Promise<void> {
    switch (step.type) {
      case 'LOCK_INPUT':
        host.setInputLocked(true);
        break;

      case 'UNLOCK_INPUT':
        host.setInputLocked(false);
        break;

      case 'EMOTE':
        host.triggerEntityEmote(step.targetId, step.emote, step.durationMs);
        break;

      case 'FACE':
        host.setEntityDirection(step.targetId, step.direction);
        break;

      case 'MOVE_STEPS':
        for (const dir of step.steps) {
          await host.stepEntity(step.targetId, dir);
        }
        break;

      case 'DIALOGUE':
        await host.showScriptDialogue(step.speaker, step.lines);
        break;

      case 'ACTION':
        executeNPCEventActions([step.action as NPCEventAction], host.storyCallbacks);
        break;

      case 'WAIT':
        await new Promise<void>((resolve) => setTimeout(resolve, step.durationMs));
        break;
    }
  }
}

export const cutsceneRunner = new CutsceneRunner();
