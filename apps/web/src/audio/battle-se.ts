/**
 * Battle Sound Effects (SE) Player
 * Handles playing authentic audio sound effects for battle interactions:
 * Pokéball throwing, ball impact, Pokémon capture absorption, bounce/drop,
 * shaking wobbles, catch success click & fanfare, and escape break/recall.
 */

export class BattleSePlayer {
  private static instance: BattleSePlayer;
  private volume = 0.7;
  private activeSounds: Set<HTMLAudioElement> = new Set();
  private static readonly MAX_CONCURRENT_SOUNDS = 8;

  private constructor() {}

  public static getInstance(): BattleSePlayer {
    if (!BattleSePlayer.instance) {
      BattleSePlayer.instance = new BattleSePlayer();
    }
    return BattleSePlayer.instance;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.volume;
  }

  private failedSoundPaths: Set<string> = new Set();

  /**
   * Safely disposes an Audio element, removing all listeners BEFORE resetting src
   * to strictly prevent Chrome from emitting synthetic error events or decoder leaks.
   */
  private disposeAudio(audio: HTMLAudioElement): void {
    audio.onended = null;
    audio.onerror = null;
    audio.onpause = null;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      audio.load();
    } catch {
      // ignore
    }
    this.activeSounds.delete(audio);
  }

  /**
   * Immediately stops and disposes all currently playing sound effects.
   * Useful when switching animations, looping, or resetting battle state.
   */
  public stopAll(): void {
    const audios = Array.from(this.activeSounds);
    for (const audio of audios) {
      this.disposeAudio(audio);
    }
    this.activeSounds.clear();
  }

  /**
   * Retries an alternative audio format (ogg <-> wav <-> mp3) at most once.
   */
  private retryAlternativeFormat(cleanPath: string, volumeScale: number): void {
    let altPath: string | null = null;
    if (cleanPath.endsWith('.ogg')) {
      altPath = cleanPath.slice(0, -4) + '.wav';
    } else if (cleanPath.endsWith('.wav')) {
      altPath = cleanPath.slice(0, -4) + '.ogg';
    } else if (cleanPath.endsWith('.mp3')) {
      altPath = cleanPath.slice(0, -4) + '.ogg';
    }

    if (altPath && !this.failedSoundPaths.has(altPath)) {
      this.playSound(altPath, volumeScale, true);
    }
  }

  /**
   * Play any sound effect file safely with relative URL resolution.
   * Handles browser autoplay policies and audio errors gracefully without decoder starvation.
   */
  public playSound(path: string, volumeScale = 1.0, isRetry = false): HTMLAudioElement | null {
    try {
      if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;

      const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
      if (this.failedSoundPaths.has(cleanPath)) {
        return null;
      }

      const parts = cleanPath.split('/');
      const filename = parts.pop() || '';
      const encodedPath = '/' + [...parts, encodeURIComponent(filename)].join('/');
      const resolvedUrl = new URL(encodedPath, window.location.origin || window.location.href).href;

      // Limit concurrent sound effects cleanly by disarming before discarding
      while (this.activeSounds.size >= BattleSePlayer.MAX_CONCURRENT_SOUNDS) {
        const oldest = this.activeSounds.values().next().value;
        if (oldest) {
          this.disposeAudio(oldest);
        } else {
          break;
        }
      }

      const audio = new Audio(resolvedUrl);
      audio.volume = Math.max(0, Math.min(1, this.volume * volumeScale));
      this.activeSounds.add(audio);

      let isCleanedUp = false;
      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        this.activeSounds.delete(audio);
      };

      const onEnded = () => {
        cleanup();
      };

      const onError = () => {
        cleanup();
        this.failedSoundPaths.add(cleanPath);
        if (!isRetry) {
          this.retryAlternativeFormat(cleanPath, volumeScale);
        }
      };

      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);

      audio.play().catch((err: unknown) => {
        cleanup();
        if (err instanceof DOMException && err.name === 'AbortError') return;
        this.failedSoundPaths.add(cleanPath);
        if (!isRetry) {
          this.retryAlternativeFormat(cleanPath, volumeScale);
        }
      });

      return audio;
    } catch (err) {
      console.warn('[BattleSE] Error creating audio element for:', path, err);
      return null;
    }
  }

  /**
   * Sound: Trainer throws Pokéball into battle
   */
  public playBallThrow(isCritical = false): void {
    const file = isCritical
      ? 'Audio/SE/Battle critical catch throw.ogg'
      : 'Audio/SE/Battle throw.ogg';
    this.playSound(file);
  }

  /**
   * Sound: Ball hits target Pokémon
   */
  public playBallHit(): void {
    this.playSound('Audio/SE/Battle ball hit.ogg');
  }

  /**
   * Sound: Pokémon is pulled/absorbed into the open ball
   */
  public playJumpToBall(): void {
    this.playSound('Audio/SE/Battle jump to ball.ogg');
  }

  /**
   * Sound: Ball drops and bounces on the battlefield ground
   */
  public playBallDrop(): void {
    this.playSound('Audio/SE/Battle ball drop.ogg');
  }

  /**
   * Sound: Ball wobbles / shakes on the ground
   */
  public playBallShake(): void {
    this.playSound('Audio/SE/Battle ball shake.ogg');
  }

  /**
   * Sound: Catch successfully confirmed!
   * Plays the mechanical click lock, followed by sparkle sound and capture success fanfare.
   */
  public playCatchSuccess(): void {
    this.playSound('Audio/SE/Battle catch click.ogg');
    setTimeout(() => {
      this.playSound('Audio/SE/Shiny sparkle.ogg', 0.6);
      this.playSound('Audio/SE/Battle capture success.ogg', 0.85);
    }, 250);
  }

  /**
   * Sound: Pokémon breaks out / ball pops open on failed capture
   */
  public playBallBreak(): void {
    this.playSound('Audio/SE/Battle recall.ogg');
  }

  /**
   * Sound: PC boot / startup sound when opening storage
   */
  public playPcOpen(): void {
    this.playSound('Audio/SE/PC open.ogg');
  }

  /**
   * Sound: PC access sound when switching boxes / selecting Pokémon
   */
  public playPcAccess(): void {
    this.playSound('Audio/SE/PC access.ogg');
  }

  /**
   * Sound: PC logout / shutdown sound when closing storage
   */
  public playPcClose(): void {
    this.playSound('Audio/SE/PC close.ogg');
  }

  /**
   * Sound: Shiny Pokémon appears into battle with authentic chime & sparkle
   */
  public playShinyAppear(): void {
    this.playSound('Audio/SE/shiny-pokemon.mp3', 0.95);
  }

  /**
   * Sound effect when summoning a Follower Pokémon to the overworld:
   * Pokéball open pop sound + Pokémon species cry (+ Shiny sparkle if shiny).
   */
  public playFollowerSummon(speciesKey: string, isShiny = false): void {
    this.playSound('Audio/SE/Battle recall.ogg', 0.8);
    const cleanKey = speciesKey.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setTimeout(() => {
      this.playSound(`Audio/Cries/${cleanKey}.ogg`, 0.85);
    }, 100);
    if (isShiny) {
      setTimeout(() => {
        this.playSound('Audio/SE/Shiny sparkle.ogg', 0.7);
      }, 220);
    }
  }
}

export const battleSePlayer = BattleSePlayer.getInstance();
