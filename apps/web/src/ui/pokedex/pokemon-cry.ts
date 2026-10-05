/**
 * Pokemon Cry Audio Player
 * Manages playing Pokemon cry sounds from Audio/Cries directory
 */

export class PokemonCryPlayer {
  private currentAudio: HTMLAudioElement | null = null;
  private static instance: PokemonCryPlayer;

  private constructor() {}

  public static getInstance(): PokemonCryPlayer {
    if (!PokemonCryPlayer.instance) {
      PokemonCryPlayer.instance = new PokemonCryPlayer();
    }
    return PokemonCryPlayer.instance;
  }

  private volume = 0.6;

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Play Pokemon cry from sprite data
   * @param cryPath - Path to cry audio file (e.g., "Audio/Cries/PIKACHU.ogg")
   */
  public play(cryPath: string | undefined): void {
    if (!cryPath) {
      return;
    }

    // Stop current audio if playing
    this.stop();

    try {
      // Normalize path to prevent double slashes or Windows backslashes
      const cleanPath = cryPath.replace(/\\/g, '/').replace(/^\/+/, '');
      const parts = cleanPath.split('/');
      const filename = parts.pop() || '';
      const encodedRelativePath = [...parts, encodeURIComponent(filename)].join('/');
      const resolvedUrl = new URL(encodedRelativePath, window.location.href).href;

      const audio = new Audio(resolvedUrl);
      this.currentAudio = audio;
      audio.volume = this.volume;

      // Play the cry
      audio.play().catch((error: unknown) => {
        // Ignore expected AbortError when user switches Pokemon before previous cry loads/finishes
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error(`[PokemonCry] Failed to play: ${cryPath}`, error);
      });

      // Auto cleanup when finished (guard against race condition with newer audio)
      audio.addEventListener('ended', () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      });
    } catch (error) {
      console.error(`[PokemonCry] Error loading: ${cryPath}`, error);
    }
  }

  /**
   * Stop currently playing cry
   */
  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Check if a cry is currently playing
   */
  public isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

// Export singleton instance
export const pokemonCryPlayer = PokemonCryPlayer.getInstance();
