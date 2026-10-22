import type { ViewportBounds } from '../../core/camera';
import type { TerrainField } from '../../maps/terrain-field/terrain-field';
import type { OverworldWeather } from '../../world/overworld-weather';
import type { AssetLoader } from '../asset-loader';

export type BlizzardSpriteKey = 'blizzard_1' | 'blizzard_2' | 'blizzard_3' | 'blizzard_4';
export type SnowWeatherMode = 'auto' | 'normal' | 'blizzard' | 'severe_blizzard' | 'off';

export interface Snowflake {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  size: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  alpha: number;
  baseAlpha: number;
  type: BlizzardSpriteKey;
  angle: number;
  rotSpeed: number;
  scale: number;
}

/**
 * SnowParticleSystem
 * Simulates atmospheric falling snowflakes and multi-tier blizzard storms across the overworld
 * using authentic 16x16 pixel blizzard sprites (blizzard_1..4.png).
 *
 * Tiers / Levels of Intensity:
 * 1. Bình thường (Normal / Gentle Snowfall):
 *    - Always active whenever inside the snow biome ("lúc nào vùng này cũng sẽ có").
 *    - Gentle drifting snowflakes with organic sinusoidal swaying (~50-60 particles).
 *    - Dominated by small/needle flakes (blizzard_3, blizzard_4).
 *
 * 2. Bão tuyết (Snowstorm / Blizzard):
 *    - Triggered during rain/snow/heavy_rain weather or manual mode ("tăng số lượt hạt tuyết và bay nhanh hơn").
 *    - Denser flurry (~140-160 particles), higher diagonal velocities, wind gust surges.
 *    - Mixed sprites with rotating snowflakes (blizzard_1..4).
 *
 * 3. Bão tuyết cuồng nộ (Severe Blizzard):
 *    - Triggered during thunderstorm or extreme weather.
 *    - Maximum density (~220-250 particles) whipping diagonally across screen.
 *    - Turbulent gust cycles and soft frost atmospheric haze.
 *
 * Zero garbage-collection allocation during update & render loops.
 */
export class SnowParticleSystem {
  private loader?: AssetLoader;
  private fallbackImgs: Map<string, HTMLImageElement> = new Map();

  private particles: Snowflake[] = [];
  private readonly maxParticles = 240;
  private lastUpdateTime = 0;
  private gustTimer = 0;
  private gustStrength = 1.0;
  private currentIntensity = 0; // 0..1 smooth blend

  private manualMode: SnowWeatherMode = 'auto';

  constructor(loader?: AssetLoader) {
    this.loader = loader;
  }

  public setMode(mode: SnowWeatherMode): void {
    this.manualMode = mode;
  }

  public getMode(): SnowWeatherMode {
    return this.manualMode;
  }

  public getIntensity(): number {
    return this.currentIntensity;
  }

  public getIntensityTier(): 'none' | 'normal' | 'blizzard' | 'severe_blizzard' {
    if (this.currentIntensity <= 0.05) return 'none';
    if (this.currentIntensity < 0.65) return 'normal';
    if (this.currentIntensity < 0.9) return 'blizzard';
    return 'severe_blizzard';
  }

  private getImage(type: BlizzardSpriteKey): HTMLImageElement | undefined {
    if (this.loader) {
      const img = this.loader.getImage(type);
      if (img && img.complete && img.naturalWidth > 0) return img;
    }

    if (!this.fallbackImgs.has(type)) {
      const img = new Image();
      img.src = `/assets/weather/${type}.png`;
      this.fallbackImgs.set(type, img);
    }
    const fallback = this.fallbackImgs.get(type);
    if (fallback && fallback.complete && fallback.naturalWidth > 0) return fallback;
    return undefined;
  }

  private initParticles(bounds: ViewportBounds): void {
    this.particles = [];
    const width = Math.max(bounds.maxX - bounds.minX, 320);
    const height = Math.max(bounds.maxY - bounds.minY, 240);

    for (let i = 0; i < this.maxParticles; i++) {
      // Distribution: 15% large (1), 25% medium (2), 35% small (3), 25% flurry needle (4)
      const roll = Math.random();
      let type: BlizzardSpriteKey;
      let scale: number;
      let size: number;

      if (roll < 0.15) {
        type = 'blizzard_1';
        scale = 0.85 + Math.random() * 0.35;
        size = 3;
      } else if (roll < 0.4) {
        type = 'blizzard_2';
        scale = 0.75 + Math.random() * 0.3;
        size = 2;
      } else if (roll < 0.75) {
        type = 'blizzard_3';
        scale = 0.6 + Math.random() * 0.35;
        size = 1;
      } else {
        type = 'blizzard_4';
        scale = 0.7 + Math.random() * 0.3;
        size = 2;
      }

      const baseAlpha = 0.55 + Math.random() * 0.42;

      this.particles.push({
        x: bounds.minX + Math.random() * width,
        y: bounds.minY + Math.random() * height,
        vx: 15 + Math.random() * 25,
        vy: 28 + Math.random() * 32,
        baseVx: 15 + Math.random() * 25,
        baseVy: 28 + Math.random() * 32,
        size,
        swayAmp: 10 + Math.random() * 16,
        swayFreq: 1.5 + Math.random() * 1.8,
        swayPhase: Math.random() * Math.PI * 2,
        alpha: baseAlpha,
        baseAlpha,
        type,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.5,
        scale,
      });
    }
  }

  public update(
    now: number,
    bounds: ViewportBounds,
    field?: TerrainField,
    weather?: OverworldWeather,
    isPaused: boolean = false
  ): void {
    if (isPaused) {
      this.lastUpdateTime = now;
      return;
    }

    if (this.lastUpdateTime === 0) {
      this.lastUpdateTime = now;
      this.initParticles(bounds);
      return;
    }

    const dtMs = Math.min(Math.max(now - this.lastUpdateTime, 0), 100);
    const dt = dtMs / 1000;
    this.lastUpdateTime = now;

    if (this.particles.length === 0) {
      this.initParticles(bounds);
    }

    // 1. Determine Snow Presence in Viewport
    let hasSnowInBounds = false;
    if (field?.isSnow) {
      const minGx = Math.floor(bounds.minX / 32);
      const maxGx = Math.ceil(bounds.maxX / 32);
      const minGy = Math.floor(bounds.minY / 32);
      const maxGy = Math.ceil(bounds.maxY / 32);

      const stepX = Math.max(1, Math.floor((maxGx - minGx) / 4));
      const stepY = Math.max(1, Math.floor((maxGy - minGy) / 4));
      for (let gy = minGy; gy <= maxGy; gy += stepY) {
        for (let gx = minGx; gx <= maxGx; gx += stepX) {
          if (field.isSnow(gx, gy)) {
            hasSnowInBounds = true;
            break;
          }
        }
        if (hasSnowInBounds) break;
      }
    } else {
      // Default fallback for test environments without field
      hasSnowInBounds = true;
    }

    // 2. Calculate Target Intensity based on mode & weather
    let targetIntensity = 0;
    let isBlizzardTier = false;
    let isSevereTier = false;

    if (this.manualMode === 'off') {
      targetIntensity = 0;
    } else if (this.manualMode === 'normal') {
      targetIntensity = 0.45;
    } else if (this.manualMode === 'blizzard') {
      targetIntensity = 0.8;
      isBlizzardTier = true;
    } else if (this.manualMode === 'severe_blizzard') {
      targetIntensity = 1.0;
      isSevereTier = true;
      isBlizzardTier = true;
    } else {
      // Automatic Mode (auto):
      // Level 1 (Bình thường): Snow biome ALWAYS has gentle snow falling
      if (hasSnowInBounds) {
        if (weather === 'thunderstorm') {
          // Level 3: Bão tuyết cuồng nộ
          targetIntensity = 1.0;
          isSevereTier = true;
          isBlizzardTier = true;
        } else if (weather === 'rain' || weather === 'heavy_rain' || weather === 'snow') {
          // Level 2: Bão tuyết bay nhanh hơn, tăng hạt tuyết
          targetIntensity = 0.8;
          isBlizzardTier = true;
        } else {
          // Level 1: Bình thường, tuyết rơi êm đềm
          targetIntensity = 0.45;
        }
      }
    }

    // Smooth intensity interpolation
    const blendRate = 2.0 * dt;
    if (this.currentIntensity < targetIntensity) {
      this.currentIntensity = Math.min(this.currentIntensity + blendRate, targetIntensity);
    } else if (this.currentIntensity > targetIntensity) {
      this.currentIntensity = Math.max(this.currentIntensity - blendRate, targetIntensity);
    }

    if (this.currentIntensity <= 0.01) {
      return;
    }

    // 3. Wind Gust Cycles
    this.gustTimer += dt;
    if (this.gustTimer > 4.2) {
      this.gustTimer = 0;
    }
    const gustCycle = Math.sin((this.gustTimer / 4.2) * Math.PI * 2);
    const gustFactor = isSevereTier ? 2.2 : isBlizzardTier ? 1.6 : 0.4;
    this.gustStrength = 1.0 + Math.max(0, gustCycle) * gustFactor;

    // 4. Particle Velocity & Motion Parameters per Tier
    let speedMultX = 1.0;
    let speedMultY = 1.0;
    if (isSevereTier) {
      speedMultX = 4.5;
      speedMultY = 2.4;
    } else if (isBlizzardTier) {
      speedMultX = 3.0;
      speedMultY = 1.8;
    }

    const margin = 32;
    const leftBound = bounds.minX - margin;
    const rightBound = bounds.maxX + margin;
    const topBound = bounds.minY - margin;
    const bottomBound = bounds.maxY + margin;
    const width = rightBound - leftBound;
    const height = bottomBound - topBound;

    // 5. Update Particle Simulation
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Sinusoidal wind sway
      const sway = Math.sin(now * 0.002 * p.swayFreq + p.swayPhase) * p.swayAmp;
      const currentVx = (p.baseVx + sway) * this.gustStrength * speedMultX;
      const currentVy = p.baseVy * this.gustStrength * speedMultY;

      p.x += currentVx * dt;
      p.y += currentVy * dt;
      p.angle += p.rotSpeed * (isBlizzardTier ? 2.5 : 1.0) * dt;

      // Wrap-around boundaries
      if (p.x > rightBound) {
        p.x = leftBound + Math.random() * 24;
        p.y = topBound + Math.random() * height;
      } else if (p.x < leftBound) {
        p.x = rightBound - Math.random() * 24;
      }

      if (p.y > bottomBound) {
        p.y = topBound + Math.random() * 16;
        p.x = leftBound + Math.random() * width;
      } else if (p.y < topBound) {
        p.y = bottomBound - Math.random() * 16;
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    _now: number,
    field?: TerrainField
  ): void {
    if (this.currentIntensity <= 0.02) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Active particle count scales with intensity (Tier 1: ~60, Tier 2: ~150, Tier 3: ~240)
    const activeCount = Math.floor(this.particles.length * this.currentIntensity);

    for (let i = 0; i < activeCount; i++) {
      const p = this.particles[i];

      // Fade out if outside snow terrain
      let tileAlpha = 1.0;
      if (field?.isSnow) {
        const gx = Math.floor(p.x / 32);
        const gy = Math.floor(p.y / 32);
        if (!field.isSnow(gx, gy)) {
          tileAlpha = 0.35;
        }
      }

      const alpha = p.baseAlpha * this.currentIntensity * tileAlpha;
      if (alpha <= 0.01) continue;

      const img = this.getImage(p.type);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(Math.round(p.x), Math.round(p.y));
        ctx.rotate(p.angle);

        const dw = Math.round(16 * p.scale);
        const dh = Math.round(16 * p.scale);
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      } else {
        // Pixel fallback
        ctx.fillStyle =
          p.size >= 3 ? `rgba(255, 255, 255, ${alpha})` : `rgba(235, 248, 255, ${alpha})`;
        if (p.size === 1) {
          ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
        } else if (p.size === 2) {
          ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
        } else {
          const rx = Math.round(p.x);
          const ry = Math.round(p.y);
          ctx.fillRect(rx + 1, ry, 1, 3);
          ctx.fillRect(rx, ry + 1, 3, 1);
        }
      }
    }

    // Optional atmospheric frost haze during heavy blizzard
    if (this.currentIntensity > 0.65) {
      const hazeAlpha = (this.currentIntensity - 0.65) * 0.16;
      ctx.fillStyle = `rgba(224, 242, 254, ${hazeAlpha.toFixed(3)})`;
      ctx.fillRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    }

    ctx.restore();
  }
}
