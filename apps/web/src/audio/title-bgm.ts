/**
 * Title Screen BGM Audio Player (Nhạc Nền Màn Hình Chờ)
 * Manages background music playback for the game title screen with auto-play,
 * browser gesture unlock, volume control, and smooth fade-out.
 */

const STORAGE_KEY = 'pokemon_title_bgm_volume';
const DEFAULT_BGM_PATH =
  'Audio/Misic backgound/[Pokemon ft. Miku] きみとそらをとぶ  Littleroot Town Orchestral Arrange - Jairus Cambe.mp3';

export class TitleBgmPlayer {
  private static instance: TitleBgmPlayer;
  private currentAudio: HTMLAudioElement | null = null;
  private fadeInterval: number | null = null;
  private initialVolume = 0.6; // Mặc định 60%
  private isUnlocked = false;

  private constructor() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.initialVolume = parsed;
          }
        }
      } catch (_) {}
    }
  }

  public static getInstance(): TitleBgmPlayer {
    if (!TitleBgmPlayer.instance) {
      TitleBgmPlayer.instance = new TitleBgmPlayer();
    }
    return TitleBgmPlayer.instance;
  }

  /**
   * Start playing title screen BGM (loops continuously).
   */
  public playTitleBgm(path = DEFAULT_BGM_PATH): void {
    this.stopBgm(0);

    try {
      const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
      const parts = cleanPath.split('/');
      const filename = parts.pop() || '';
      const encodedRelativePath = [...parts, encodeURIComponent(filename)].join('/');
      const resolvedUrl =
        typeof window !== 'undefined' && window.location?.href
          ? new URL(encodedRelativePath, window.location.href).href
          : path;

      const audio = new Audio(resolvedUrl);
      audio.loop = true;
      audio.volume = this.initialVolume;

      this.currentAudio = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isUnlocked = true;
          })
          .catch((_err: unknown) => {
            // Autoplay policy prevented playback until user interaction
            if (!this.isUnlocked && typeof window !== 'undefined') {
              const unlock = () => {
                if (this.currentAudio && this.currentAudio.paused) {
                  this.currentAudio.play().catch(() => {});
                  this.isUnlocked = true;
                }
                window.removeEventListener('pointerdown', unlock);
                window.removeEventListener('keydown', unlock);
              };
              window.addEventListener('pointerdown', unlock, { once: true });
              window.addEventListener('keydown', unlock, { once: true });
            }
          });
      }
    } catch (err) {
      console.warn('[TitleBGM] Error initializing Title BGM:', err);
    }
  }

  /**
   * Stop BGM with optional smooth fade-out.
   */
  public stopBgm(fadeDurationMs = 500): void {
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
   * Set volume (0..1) and persist to localStorage.
   */
  public setVolume(volume: number): void {
    this.initialVolume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.initialVolume;
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, String(this.initialVolume));
      } catch (_) {}
    }
  }

  public getVolume(): number {
    return this.initialVolume;
  }

  public isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

export const titleBgmPlayer = TitleBgmPlayer.getInstance();
