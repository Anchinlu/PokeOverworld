import type { AnimationTimingEvent } from './types';
import { battleSePlayer } from '../../audio';

export interface ActiveFlashState {
  color: [number, number, number, number];
  durationFrames: number;
  remainingFrames: number;
  scope: number; // 1=target, 2=user, 3=screen
}

function parseFlashColor(rawColor: unknown): [number, number, number, number] {
  if (Array.isArray(rawColor)) {
    const r = Math.max(0, Math.min(255, Number(rawColor[0]) || 255));
    const g = Math.max(0, Math.min(255, Number(rawColor[1]) || 255));
    const b = Math.max(0, Math.min(255, Number(rawColor[2]) || 255));
    const a = rawColor.length > 3 ? Math.max(0, Math.min(255, Number(rawColor[3]) || 255)) : 220;
    return [r, g, b, a];
  }

  if (typeof rawColor === 'string') {
    let hex = rawColor.trim().replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) || 255;
      const g = parseInt(hex.slice(2, 4), 16) || 255;
      const b = parseInt(hex.slice(4, 6), 16) || 255;
      return [r, g, b, 200];
    }
  }

  return [255, 255, 255, 200];
}

export class TimingEventManager {
  private activeFlashes: ActiveFlashState[] = [];
  private executedTimingIndices: Set<number> = new Set();

  public reset(stopSounds = false): void {
    this.activeFlashes = [];
    this.executedTimingIndices.clear();
    if (stopSounds) {
      battleSePlayer.stopAll();
    }
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
        // Clean sound name and strip leading 'Audio/SE/' if already present
        let cleanName = soundName.replace(/\\/g, '/').replace(/^\/+/, '');
        if (cleanName.toLowerCase().startsWith('audio/se/')) {
          cleanName = cleanName.slice(9);
        }
        const hasExt = /\.(ogg|wav|mp3)$/i.test(cleanName);
        // All EBDX move animations in Audio/SE/EBDX/Anim/ are .wav files on disk
        const isEbdxWav =
          !hasExt &&
          (/^EBDX\/Anim\//i.test(cleanName) || /^Anim\/eb_/i.test(cleanName));
        const sePath = hasExt
          ? `Audio/SE/${cleanName}`
          : isEbdxWav
            ? `Audio/SE/${cleanName}.wav`
            : `Audio/SE/${cleanName}.ogg`;
        battleSePlayer.playSound(sePath, volume);
      }
    } else if (event.type === 'flash') {
      const duration =
        typeof event.payload.flashDuration === 'number' ? event.payload.flashDuration : 4;
      const scope = typeof event.payload.flashScope === 'number' ? event.payload.flashScope : 1;
      const color = parseFlashColor(event.payload.flashColor);

      this.activeFlashes.push({
        color,
        durationFrames: Math.max(1, duration),
        remainingFrames: Math.max(1, duration),
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
        if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b) || !Number.isFinite(baseA)) {
          continue;
        }
        const a = Math.min(0.65, Math.max(0, (baseA / 255) * alphaFraction));
        ctx.save();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
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
