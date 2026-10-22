import type { OverworldWeather } from '../../world/overworld-weather';

export interface CloudWeatherProfile {
  readonly shadowOpacity: number;
  readonly shadowSpeedX: number;
  readonly shadowSpeedY: number;
  readonly shadowBlendMode: GlobalCompositeOperation;
}

export const CLOUD_WEATHER_PROFILES: Record<string, CloudWeatherProfile> = {
  clear: {
    shadowOpacity: 0.18,
    shadowSpeedX: 18,
    shadowSpeedY: 6,
    shadowBlendMode: 'multiply',
  },
  sun: {
    shadowOpacity: 0.14,
    shadowSpeedX: 14,
    shadowSpeedY: 5,
    shadowBlendMode: 'multiply',
  },
  rain: {
    shadowOpacity: 0.28,
    shadowSpeedX: 30,
    shadowSpeedY: 10,
    shadowBlendMode: 'multiply',
  },
  heavy_rain: {
    shadowOpacity: 0.34,
    shadowSpeedX: 38,
    shadowSpeedY: 14,
    shadowBlendMode: 'multiply',
  },
  thunderstorm: {
    shadowOpacity: 0.4,
    shadowSpeedX: 46,
    shadowSpeedY: 18,
    shadowBlendMode: 'multiply',
  },
  fog: {
    shadowOpacity: 0.08,
    shadowSpeedX: 8,
    shadowSpeedY: 3,
    shadowBlendMode: 'multiply',
  },
  sand: {
    shadowOpacity: 0.2,
    shadowSpeedX: 36,
    shadowSpeedY: 10,
    shadowBlendMode: 'multiply',
  },
  snow: {
    shadowOpacity: 0.12,
    shadowSpeedX: 12,
    shadowSpeedY: 8,
    shadowBlendMode: 'multiply',
  },
};

/**
 * WeatherCloudController
 * Controls drifting speed, opacity and seamless modulo wrapping for ground cloud
 * shadows according to the prevailing overworld weather.
 */
export class WeatherCloudController {
  public static readonly BASE_TEXTURE_SIZE = 1024;
  public static readonly DEFAULT_WORLD_SIZE = 1024;

  private weather: OverworldWeather = 'clear';
  private cloudWorldSize = WeatherCloudController.DEFAULT_WORLD_SIZE;

  private shadowX = 0;
  private shadowY = 0;

  private isPaused = false;
  private lastUpdateTime = 0;

  // Optional manual overrides for debugging / custom scenes
  private speedMultiplier = 1.0;
  private shadowOpacityOverride: number | null = null;

  constructor(initialWeather: OverworldWeather = 'clear') {
    this.weather = initialWeather;
  }

  public setWeather(weather: OverworldWeather): void {
    this.weather = weather;
  }

  public getWeather(): OverworldWeather {
    return this.weather;
  }

  public getProfile(): CloudWeatherProfile {
    return CLOUD_WEATHER_PROFILES[this.weather] ?? CLOUD_WEATHER_PROFILES.clear;
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public setSpeedMultiplier(mult: number): void {
    this.speedMultiplier = Math.max(0, mult);
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public setShadowOpacityOverride(val: number | null): void {
    this.shadowOpacityOverride = val !== null ? Math.max(0, Math.min(1, val)) : null;
  }

  public getShadowOpacity(): number {
    if (this.shadowOpacityOverride !== null) return this.shadowOpacityOverride;
    return this.getProfile().shadowOpacity;
  }

  public getCloudWorldSize(): number {
    return this.cloudWorldSize;
  }

  public setCloudWorldSize(size: number): void {
    this.cloudWorldSize = Math.max(64, size);
  }

  public getShadowOffsetX(): number {
    return this.shadowX;
  }

  public getShadowOffsetY(): number {
    return this.shadowY;
  }

  /** Sets coordinates directly (useful for deterministic tests). */
  public setOffsets(shadowX: number, shadowY: number): void {
    this.shadowX = this.wrap(shadowX, this.cloudWorldSize);
    this.shadowY = this.wrap(shadowY, this.cloudWorldSize);
  }

  /**
   * Advances the cloud positions according to elapsed time.
   * If nowTimestamp is provided, delta time is computed automatically.
   */
  public update(nowTimestampOrDt: number, isDtInSeconds = false): void {
    if (this.isPaused) {
      if (!isDtInSeconds) {
        this.lastUpdateTime = nowTimestampOrDt;
      }
      return;
    }

    let dtSec = 0;
    if (isDtInSeconds) {
      dtSec = nowTimestampOrDt;
    } else {
      if (this.lastUpdateTime > 0 && nowTimestampOrDt > this.lastUpdateTime) {
        dtSec = Math.min((nowTimestampOrDt - this.lastUpdateTime) / 1000, 0.25);
      }
      this.lastUpdateTime = nowTimestampOrDt;
    }

    if (dtSec <= 0) return;

    const profile = this.getProfile();
    const mult = this.speedMultiplier;

    // Advance ground shadow coordinates (faster, world-space)
    const dShadowX = profile.shadowSpeedX * mult * dtSec;
    const dShadowY = profile.shadowSpeedY * mult * dtSec;
    this.shadowX = this.wrap(this.shadowX + dShadowX, this.cloudWorldSize);
    this.shadowY = this.wrap(this.shadowY + dShadowY, this.cloudWorldSize);
  }

  /** Seamless wrapping modulo so offsets remain bounded within [0, size). */
  private wrap(val: number, size: number): number {
    if (size <= 0) return 0;
    return ((val % size) + size) % size;
  }
}
