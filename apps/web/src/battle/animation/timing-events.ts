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
    const numR = Number(rawColor[0]);
    const numG = Number(rawColor[1]);
    const numB = Number(rawColor[2]);
    const numA = rawColor.length > 3 ? Number(rawColor[3]) : 220;

    const r = Math.max(0, Math.min(255, Number.isFinite(numR) ? numR : 255));
    const g = Math.max(0, Math.min(255, Number.isFinite(numG) ? numG : 255));
    const b = Math.max(0, Math.min(255, Number.isFinite(numB) ? numB : 255));
    const a = Math.max(0, Math.min(255, Number.isFinite(numA) ? numA : 220));
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
    if (!timings || !Array.isArray(timings)) return;
    for (let i = 0; i < timings.length; i++) {
      const event = timings[i];
      if (event.frame === currentFrame && !this.executedTimingIndices.has(i)) {
        this.executedTimingIndices.add(i);
        this.executeEvent(event);
      }
    }
  }

  private executeEvent(event: AnimationTimingEvent): void {
    // 1. Sound event handling (supporting standard {type: 'sound', payload: {sound: ...}}, {sound: {file: ...}}, and legacy {se: ...})
    let soundName: string | undefined;
    let volume = 0.8;

    const rawSoundObj = (event as unknown as { sound?: { file?: string; sound?: string; name?: string; volume?: number } }).sound;
    if (event.type === 'sound' && event.payload) {
      soundName = (event.payload.sound || event.payload.file || event.payload.name || rawSoundObj?.file || rawSoundObj?.sound || rawSoundObj?.name) as string;
      if (typeof event.payload.volume === 'number') {
        volume = event.payload.volume / 100;
      } else if (typeof rawSoundObj?.volume === 'number') {
        volume = rawSoundObj.volume / 100;
      }
    } else if (event.type === 'sound' && rawSoundObj) {
      soundName = rawSoundObj.file || rawSoundObj.sound || rawSoundObj.name;
      if (typeof rawSoundObj.volume === 'number') {
        volume = rawSoundObj.volume / 100;
      }
    } else if ((event as unknown as { se?: unknown }).se) {
      const rawObj = event as unknown as { se: unknown; volume?: number };
      const rawSe = rawObj.se;
      if (typeof rawSe === 'string') {
        soundName = rawSe;
      } else if (typeof rawSe === 'object' && rawSe !== null) {
        const seObj = rawSe as Record<string, unknown>;
        soundName = (seObj.name || seObj['@name'] || seObj.file || seObj.sound) as string;
      }
      if (typeof rawObj.volume === 'number') {
        volume = rawObj.volume / 100;
      }
    }

    if (soundName && typeof soundName === 'string') {
      // Ignore graphic assets accidentally authored into timing SE
      if (!/\.(png|jpe?g|bmp|gif)$/i.test(soundName)) {
        // Clean sound name and strip leading 'Audio/SE/' if already present
        let cleanName = soundName.replace(/\\/g, '/').replace(/^\/+/, '');
        if (cleanName.toLowerCase().startsWith('audio/se/')) {
          cleanName = cleanName.slice(9);
        }
        const hasExt = /\.(ogg|wav|mp3)$/i.test(cleanName);
        // EBDX and PRSFX move animations are .wav files on disk
        const isWav =
          !hasExt &&
          (/^EBDX\/Anim\//i.test(cleanName) ||
            /^Anim\/eb_/i.test(cleanName) ||
            /^Anim\/PRSFX-/i.test(cleanName) ||
            /^PRSFX-/i.test(cleanName));
        const sePath = hasExt
          ? `Audio/SE/${cleanName}`
          : isWav
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
