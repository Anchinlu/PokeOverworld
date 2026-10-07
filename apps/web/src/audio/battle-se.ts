/**
 * Battle Sound Effects (SE) Player
 * Handles playing authentic audio sound effects for battle interactions:
 * Pokéball throwing, ball impact, Pokémon capture absorption, bounce/drop,
 * shaking wobbles, catch success click & fanfare, and escape break/recall.
 */

export class BattleSePlayer {
  private static instance: BattleSePlayer;
  private volume = 0.7;

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

  /**
   * Play any sound effect file safely with relative URL resolution.
   * Handles browser autoplay policies and audio errors gracefully.
   */
  public playSound(path: string, volumeScale = 1.0): HTMLAudioElement | null {
    try {
      if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;

      const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
      const parts = cleanPath.split('/');
      const filename = parts.pop() || '';
      const encodedRelativePath = [...parts, encodeURIComponent(filename)].join('/');
      const resolvedUrl = new URL(encodedRelativePath, window.location.href).href;

      const audio = new Audio(resolvedUrl);
      audio.volume = Math.max(0, Math.min(1, this.volume * volumeScale));

      audio.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('[BattleSE] Auto-play blocked or failed to play SE:', path, err);
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
}

export const battleSePlayer = BattleSePlayer.getInstance();
