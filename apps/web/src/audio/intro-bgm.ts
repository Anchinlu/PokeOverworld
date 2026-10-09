/**
 * Intro BGM Audio Player (Opening Movie Audio)
 * Plays 'Audio/Misic backgound/01. Opening Movie.mp3' during the cinematic intro.
 */

const INTRO_BGM_PATH = 'Audio/Misic backgound/01. Opening Movie.mp3';

export class IntroBgmPlayer {
  private static instance: IntroBgmPlayer;
  private currentAudio: HTMLAudioElement | null = null;
  private fadeInterval: number | null = null;
  private volume = 0.65;
  private isUnlocked = false;

  private constructor() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('pokemon_title_bgm_volume');
        if (saved !== null) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.volume = parsed;
          }
        }
      } catch (_) {}
    }
  }

  public static getInstance(): IntroBgmPlayer {
    if (!IntroBgmPlayer.instance) {
      IntroBgmPlayer.instance = new IntroBgmPlayer();
    }
    return IntroBgmPlayer.instance;
  }

  public playIntroBgm(path = INTRO_BGM_PATH): void {
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
      audio.loop = false;
      audio.volume = this.volume;
      this.currentAudio = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isUnlocked = true;
          })
          .catch(() => {
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
      console.warn('[IntroBGM] Error initializing Intro BGM:', err);
    }
  }

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

  public isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

export const introBgmPlayer = IntroBgmPlayer.getInstance();
