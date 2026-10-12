import type { AnimationTimingEvent } from './types';
import { battleSePlayer } from '../../audio';

export interface ActiveFlashState {
  color: [number, number, number, number];
  durationFrames: number;
  remainingFrames: number;
  scope: number; // 1=target, 2=user, 3=screen
}

export class TimingEventManager {
  private activeFlashes: ActiveFlashState[] = [];
  private executedTimingIndices: Set<number> = new Set();

  public reset(): void {
    this.activeFlashes = [];
    this.executedTimingIndices.clear();
  }

  /**
   * Processes timing events at the specified frame.
   */
  public triggerFrameTimings(currentFrame: number, timings: AnimationTimingEvent[]): void {
    for (let i = 0; i < timings.length; i++) {
      const event = timings[i];
      if (event.frame === currentFrame && !this.executedTimingIndices.has(i)) {
        this.executedTimingIndices.add(i);
        this.executeEvent(event);
      }
    }
  }

  private executeEvent(event: AnimationTimingEvent): void {
    if (event.type === 'sound') {
      const soundName = event.payload.sound as string;
      if (soundName) {
        const volume = typeof event.payload.volume === 'number' ? event.payload.volume / 100 : 0.8;
        // Sound paths can be .ogg, .wav, or .mp3
        const sePath = `Audio/SE/${soundName}.ogg`;
        battleSePlayer.playSound(sePath, volume);
      }
    } else if (event.type === 'flash') {
      const duration =
        typeof event.payload.flashDuration === 'number' ? event.payload.flashDuration : 5;
      const scope = typeof event.payload.flashScope === 'number' ? event.payload.flashScope : 3;
      const color = (event.payload.flashColor as [number, number, number, number]) || [
        255, 255, 255, 200,
      ];

      this.activeFlashes.push({
        color,
        durationFrames: duration,
        remainingFrames: duration,
        scope,
      });
    }
  }

  /**
   * Updates flash countdowns per frame.
   */
  public updateFlashes(): void {
    for (let i = this.activeFlashes.length - 1; i >= 0; i--) {
      this.activeFlashes[i].remainingFrames -= 1;
      if (this.activeFlashes[i].remainingFrames <= 0) {
        this.activeFlashes.splice(i, 1);
      }
    }
  }

  /**
   * Renders screen flash if active.
   */
  public renderScreenFlash(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    for (const flash of this.activeFlashes) {
      if (flash.scope === 3 || flash.scope === 0) {
        const alphaFraction = flash.remainingFrames / flash.durationFrames;
        const [r, g, b, baseA] = flash.color;
        const a = (baseA / 255) * alphaFraction;
        ctx.save();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, a))})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }
  }

  public getActiveBattlerFlashes(isTarget: boolean): [number, number, number, number] | null {
    for (const flash of this.activeFlashes) {
      if ((isTarget && flash.scope === 1) || (!isTarget && flash.scope === 2)) {
        return flash.color;
      }
    }
    return null;
  }
}
