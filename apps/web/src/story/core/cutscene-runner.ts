/**
 * Cutscene Runner
 * Asynchronous interpreter for cutscene sequences with abort-safety and engine isolation.
 */

import type { CutsceneStep } from '../types';
import type { StoryContext } from '../types/story-context';

export class CutsceneRunner {
  private isRunning = false;

  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Executes a sequence of cutscene steps sequentially.
   * If abortSignal is triggered, execution stops immediately and cleans up.
   */
  public async runSteps(steps: CutsceneStep[], context: StoryContext): Promise<void> {
    if (this.isRunning) {
      console.warn('[CutsceneRunner] Another cutscene sequence is already running.');
      return;
    }

    this.isRunning = true;
    try {
      for (const step of steps) {
        if (context.abortSignal.aborted) {
          console.log('[CutsceneRunner] Cutscene aborted by signal.');
          break;
        }
        await this.executeStep(step, context);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async executeStep(step: CutsceneStep, context: StoryContext): Promise<void> {
    if (context.abortSignal.aborted) return;

    switch (step.type) {
      case 'LOCK_INPUT':
        context.game.lockInput();
        break;

      case 'UNLOCK_INPUT':
        context.game.unlockInput();
        break;

      case 'WAIT':
        await context.delay(step.durationMs);
        break;

      case 'FACE':
        if (step.targetId === 'player') {
          context.game.setPlayerDirection(step.direction);
        } else {
          context.game.setActorDirection(step.targetId, step.direction);
        }
        break;

      case 'MOVE_STEPS':
        await context.game.moveActor(step.targetId, step.steps, step.speed);
        break;

      case 'SNAP_POSITION':
        if (step.targetId === 'player') {
          context.game.snapPlayer(step.gx, step.gy, step.direction);
        } else if (step.targetId === 'follower') {
          context.game.snapFollower(step.gx, step.gy, step.direction);
        } else {
          context.game.snapActor(step.targetId, step.gx, step.gy, step.direction);
        }
        break;

      case 'SET_VISIBLE':
        if (step.targetId === 'follower') {
          context.game.setFollowerVisible(step.visible);
        } else {
          context.game.setActorVisible(step.targetId, step.visible);
        }
        break;

      case 'EMOTE':
        if (step.targetId === 'player') {
          context.game.setPlayerEmote(step.emote, step.durationMs);
        } else {
          context.game.setActorEmote(step.targetId, step.emote, step.durationMs);
        }
        break;

      case 'DIALOGUE':
        await context.dialogue.showDialogue(step.speaker, step.lines, step.options);
        break;

      case 'PLAY_SOUND':
        context.audio.playSound(step.sfxPath, step.volume);
        break;

      case 'PLAY_CRY':
        context.audio.playCry(step.cryPath, step.volume);
        break;

      case 'CAMERA_PAN':
        await context.camera.panTo(step.targetGX, step.targetGY, step.durationMs);
        break;

      case 'SCREEN_FLASH':
        await context.camera.flashScreen(step.color, step.durationMs);
        break;

      case 'SCREEN_SHAKE':
        context.camera.shakeScreen(step.intensity, step.durationMs);
        break;

      case 'SET_FLAG':
        context.state.setFlag(step.flag, step.value);
        break;

      case 'CUSTOM':
        await step.action();
        break;
    }
  }
}

export const cutsceneRunner = new CutsceneRunner();
