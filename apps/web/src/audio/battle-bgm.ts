/**
 * Battle BGM Audio Player
 * Manages background music playback for wild Pokémon battles with loop, dynamic volume ducking, and smooth fade-out.
 */

export class BattleBgmPlayer {
  private static instance: BattleBgmPlayer;
  private currentAudio: HTMLAudioElement | null = null;
  private fadeInterval: number | null = null;
  private initialVolume = 0.7;

  private constructor() {}

  public static getInstance(): BattleBgmPlayer {
    if (!BattleBgmPlayer.instance) {
      BattleBgmPlayer.instance = new BattleBgmPlayer();
    }
    return BattleBgmPlayer.instance;
  }

  /**
   * Start playing the wild battle BGM (loops continuously).
   * Starts with full intro impact volume (default 0.70).
   * @param path Path to battle music (default: 'Audio/Battle/Battle wild.ogg')
   */
  public playWildBattleBgm(path = 'Audio/Battle/Battle wild.ogg'): void {
    this.stopBgm(0);

    try {
      const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
      const parts = cleanPath.split('/');
      const filename = parts.pop() || '';
      const encodedRelativePath = [...parts, encodeURIComponent(filename)].join('/');
      const resolvedUrl = new URL(encodedRelativePath, window.location.href).href;

      const audio = new Audio(resolvedUrl);
      audio.loop = true;
      audio.volume = this.initialVolume;

      this.currentAudio = audio;

      audio.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        console.warn('[BattleBGM] Auto-play blocked or failed to play BGM:', err);
      });
    } catch (err) {
      console.error('[BattleBGM] Error initializing battle BGM:', err);
    }
  }

  /**
   * Smoothly duck / reduce volume down to a ratio (e.g. 60% = 0.6) of initial volume.
   * Called when wild Pokémon is clearly revealed on the battlefield.
   * @param ratio Multiplier of initial volume (default: 0.60 = 60%)
   * @param durationMs Duration of volume reduction transition in ms (default: 800ms)
   */
  public reduceVolume(ratio = 0.6, durationMs = 800): void {
    if (!this.currentAudio) return;
    const targetVolume = this.initialVolume * Math.max(0, Math.min(1, ratio));
    this.fadeVolumeTo(targetVolume, durationMs);
  }

  /**
   * Smoothly fade volume to a target absolute level.
   * @param targetVolume Destination volume level (0..1)
   * @param durationMs Duration of volume transition in ms
   */
  public fadeVolumeTo(targetVolume: number, durationMs = 800): void {
    if (this.fadeInterval !== null) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (!this.currentAudio) return;

    const audio = this.currentAudio;
    const clampedTarget = Math.max(0, Math.min(1, targetVolume));
    const startVolume = audio.volume;
    const diff = clampedTarget - startVolume;

    if (Math.abs(diff) < 0.01 || durationMs <= 0) {
      audio.volume = clampedTarget;
      return;
    }

    const steps = 20;
    const stepTime = durationMs / steps;
    const stepDelta = diff / steps;
    let stepCount = 0;

    this.fadeInterval = window.setInterval(() => {
      stepCount++;
      if (stepCount >= steps) {
        if (this.fadeInterval !== null) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
        audio.volume = clampedTarget;
      } else {
        audio.volume = Math.max(0, Math.min(1, audio.volume + stepDelta));
      }
    }, stepTime);
  }

  /**
   * Stop currently playing BGM with optional fade out.
   * @param fadeDurationMs Duration of fade out in milliseconds (default: 600ms)
   */
  public stopBgm(fadeDurationMs = 600): void {
    if (this.fadeInterval !== null) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (!this.currentAudio) return;

    const audio = this.currentAudio;
    this.currentAudio = null;

    if (fadeDurationMs <= 0 || audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    const startVolume = audio.volume;
    const steps = 15;
    const stepTime = fadeDurationMs / steps;
    const volumeStep = startVolume / steps;

    this.fadeInterval = window.setInterval(() => {
      if (audio.volume > volumeStep) {
        audio.volume = Math.max(0, audio.volume - volumeStep);
      } else {
        if (this.fadeInterval !== null) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
        audio.pause();
        audio.currentTime = 0;
      }
    }, stepTime);
  }

  /**
   * Set global initial BGM volume (0..1)
   */
  public setVolume(volume: number): void {
    this.initialVolume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.initialVolume;
    }
  }

  public getVolume(): number {
    return this.currentAudio ? this.currentAudio.volume : this.initialVolume;
  }

  public isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

export const battleBgmPlayer = BattleBgmPlayer.getInstance();
