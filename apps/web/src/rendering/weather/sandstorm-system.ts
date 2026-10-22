import type { Camera, ViewportBounds } from '../../core/camera';
import type { Player } from '../../entities/player';
import type { TerrainField } from '../../maps/terrain-field/terrain-field';
import type { AssetLoader } from '../asset-loader';
import type { OverworldWeather } from '../../world/overworld-weather';

export type SandSpriteKey = 'sandstorm_1' | 'sandstorm_2' | 'sandstorm_3' | 'sandstorm_4';

export interface SandParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseY: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  scale: number;
  alpha: number;
  targetAlpha: number;
  baseAlpha: number;
  type: SandSpriteKey;
  angle: number;
  rotSpeed: number;
}

/**
 * SandstormSystem
 * Implements an authentic desert weather & atmosphere system:
 *
 * 1. Normal Days (Thường ngày):
 *    - Replaces falling leaves with gentle drifting sand specks (sandstorm_1 & sandstorm_2)
 *      carried along the warm desert breeze over arid terrain.
 *
 * 2. Storm Weather (Khi chuyển mưa / bão):
 *    - Converts global rain/storms into a furious desert Sandstorm (Bão cát):
 *    - High-velocity swirling sand particles (sandstorm_1..4) whipping diagonally down-right.
 *    - Rapid tumbling rotation and horizontal wind gust surges.
 *    - Atmospheric amber-tan sandstorm haze, sand veil, and sandy vignette.
 *
 * 3. Biome Boundaries:
 *    - Rain never falls on desert tiles; leaves never tumble over desert dunes.
 *    - Sandstorm/sand specks smoothly fade out when crossing beyond the desert border.
 */
export class SandstormSystem {
  private loader: AssetLoader;
  private fallbackImgs: Map<string, HTMLImageElement> = new Map();

  private currentIntensity = 0;
  private targetIntensity = 0;
  private lastTime = 0;
  private hasDesertInBounds = false;

  private particles: SandParticle[] = [];
  private readonly maxParticles = 140;

  // Gust cycle simulation (periodic sandstorm wind surges)
  private gustTimer = 0;
  private gustStrength = 1.0;

  constructor(loader: AssetLoader) {
    this.loader = loader;
    this.initParticles();
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: 0,
        y: 0,
        vx: 60,
        vy: 20,
        baseY: 0,
        swayAmp: 6 + Math.random() * 12,
        swayFreq: 1.2 + Math.random() * 1.5,
        swayPhase: Math.random() * Math.PI * 2,
        scale: 0.85 + Math.random() * 0.45,
        alpha: 0,
        targetAlpha: 0,
        baseAlpha: 0.70 + Math.random() * 0.30,
        type: 'sandstorm_1',
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4,
      });
    }
  }

  public update(
    now: number,
    player: Player,
    field: TerrainField,
    bounds: ViewportBounds,
    weather: OverworldWeather = 'clear'
  ): void {
    if (this.lastTime === 0) {
      this.lastTime = now;
    }
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    const isStorming = weather === 'rain' || weather === 'heavy_rain' || weather === 'thunderstorm' || weather === 'sand';

    // 1. Calculate Target Desert Intensity based on Player's Proximity to Desert
    const isPlayerInDesert = Boolean(field.isDesert && field.isDesert(player.gx, player.gy));
    let desertSampleCount = 0;
    const sampleRadius = 4; // 9x9 grid around player
    const totalSamples = (sampleRadius * 2 + 1) * (sampleRadius * 2 + 1); // 81 tiles

    if (field.isDesert) {
      for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
        for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
          if (field.isDesert(player.gx + dx, player.gy + dy)) {
            desertSampleCount++;
          }
        }
      }
    }

    if (isPlayerInDesert) {
      const depthRatio = desertSampleCount / totalSamples;
      this.targetIntensity = 0.85 + 0.15 * depthRatio;
    } else if (desertSampleCount > 0) {
      const nearRatio = desertSampleCount / totalSamples;
      this.targetIntensity = Math.min(0.70, nearRatio * 1.3);
    } else {
      this.targetIntensity = 0.0;
    }

    // Smooth exponential lerp
    const lerpSpeed = this.targetIntensity > this.currentIntensity ? 2.2 : 1.2;
    this.currentIntensity += (this.targetIntensity - this.currentIntensity) * Math.min(1.0, dt * lerpSpeed);

    // 2. Check if visible bounds contains ANY desert tiles
    this.hasDesertInBounds = false;
    if (field.isDesert) {
      const minGX = Math.floor(bounds.minX / 32);
      const maxGX = Math.ceil(bounds.maxX / 32);
      const minGY = Math.floor(bounds.minY / 32);
      const maxGY = Math.ceil(bounds.maxY / 32);

      for (let gy = minGY; gy <= maxGY; gy += 2) {
        for (let gx = minGX; gx <= maxGX; gx += 2) {
          if (field.isDesert(gx, gy)) {
            this.hasDesertInBounds = true;
            break;
          }
        }
        if (this.hasDesertInBounds) break;
      }
    }

    // 3. Periodic Wind Gust Surges during Sandstorm
    if (isStorming) {
      this.gustTimer += dt;
      // Surge every 3.5s with sine wave oscillation
      this.gustStrength = 1.0 + 0.45 * Math.sin(this.gustTimer * 1.8);
    } else {
      this.gustStrength = 1.0;
    }

    // 4. Update Particle Pool
    if (this.hasDesertInBounds || this.currentIntensity > 0.01) {
      const boundsWidth = bounds.maxX - bounds.minX;
      const boundsHeight = bounds.maxY - bounds.minY;

      // Determine active particle limit based on storm condition
      const activeCount = isStorming ? 135 : 42;

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];

        if (i < activeCount) {
          // Initialize particle if unplaced
          if (p.x === 0 && p.y === 0) {
            p.x = bounds.minX - 32 + Math.random() * (boundsWidth + 64);
            p.baseY = bounds.minY - 32 + Math.random() * (boundsHeight + 64);
            this.configureParticle(p, isStorming, weather);
          }

          // Advance motion
          p.x += p.vx * this.gustStrength * dt;
          p.baseY += p.vy * this.gustStrength * dt;
          p.y = p.baseY + Math.sin(now * 0.001 * p.swayFreq + p.swayPhase) * p.swayAmp;
          p.angle += p.rotSpeed * dt;

          // Check tile beneath particle
          const gx = Math.floor(p.x / 32);
          const gy = Math.floor(p.y / 32);
          const isDesertTile = Boolean(field.isDesert && field.isDesert(gx, gy));

          // Windward edge respawn
          if (p.x > bounds.maxX + 96 || p.y > bounds.maxY + 96) {
            if (Math.random() < 0.6) {
              p.x = bounds.minX - 64;
              p.baseY = bounds.minY + Math.random() * boundsHeight;
            } else {
              p.x = bounds.minX + Math.random() * boundsWidth;
              p.baseY = bounds.minY - 64;
            }
            p.alpha = 0;
            this.configureParticle(p, isStorming, weather);
          }

          // Alpha fade out if blown outside desert
          if (isDesertTile) {
            p.targetAlpha = p.baseAlpha;
          } else if (this.currentIntensity > 0.25) {
            p.targetAlpha = p.baseAlpha * 0.35;
          } else {
            p.targetAlpha = 0;
          }

          p.alpha += (p.targetAlpha - p.alpha) * Math.min(1.0, dt * 3.0);
        } else {
          // Deactivate particles outside active count
          p.alpha = Math.max(0, p.alpha - dt * 2.0);
        }
      }
    }
  }

  private configureParticle(p: SandParticle, isStorming: boolean, weather: OverworldWeather): void {
    if (isStorming) {
      // Furious sandstorm velocities
      if (weather === 'thunderstorm') {
        p.vx = 420 + Math.random() * 220;
        p.vy = 160 + Math.random() * 90;
        p.type = Math.random() < 0.45 ? 'sandstorm_4' : Math.random() < 0.7 ? 'sandstorm_3' : 'sandstorm_2';
      } else if (weather === 'heavy_rain') {
        p.vx = 340 + Math.random() * 180;
        p.vy = 130 + Math.random() * 70;
        p.type = Math.random() < 0.35 ? 'sandstorm_4' : Math.random() < 0.65 ? 'sandstorm_3' : 'sandstorm_2';
      } else {
        // Standard sandstorm
        p.vx = 260 + Math.random() * 150;
        p.vy = 100 + Math.random() * 55;
        p.type = Math.random() < 0.5 ? 'sandstorm_2' : Math.random() < 0.8 ? 'sandstorm_3' : 'sandstorm_1';
      }
      p.rotSpeed = (Math.random() - 0.5) * 14;
      p.scale = 0.90 + Math.random() * 0.55;
      p.baseAlpha = 0.75 + Math.random() * 0.25;
    } else {
      // Normal Day: Gentle sand specks floating in air
      p.vx = 48 + Math.random() * 42;
      p.vy = 14 + Math.random() * 18;
      p.type = Math.random() < 0.65 ? 'sandstorm_1' : 'sandstorm_2';
      p.rotSpeed = (Math.random() - 0.5) * 3;
      p.scale = 0.75 + Math.random() * 0.35;
      p.baseAlpha = 0.55 + Math.random() * 0.35;
    }
  }

  /**
   * Renders sand particles in world space (Layer 1.6 - in air above terrain/trees).
   */
  public renderWorld(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    _field: TerrainField,
    _weather: OverworldWeather = 'clear'
  ): void {
    if (!this.hasDesertInBounds && this.currentIntensity <= 0.005) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.alpha <= 0.01) continue;

      // Frustum culling
      if (
        p.x < bounds.minX - 32 ||
        p.x > bounds.maxX + 32 ||
        p.y < bounds.minY - 32 ||
        p.y > bounds.maxY + 32
      ) {
        continue;
      }

      const img = this.getImage(p.type);
      if (!img || !img.complete || img.naturalWidth === 0) continue;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(Math.round(p.x), Math.round(p.y));
      ctx.rotate(p.angle);

      const dw = Math.round(16 * p.scale);
      const dh = Math.round(16 * p.scale);
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Renders screen-space sandstorm atmospherics, amber dust haze, and wind streaks.
   */
  public renderScreen(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: Camera,
    player: Player,
    weather: OverworldWeather = 'clear'
  ): void {
    if (this.currentIntensity <= 0.005) return;

    const isStorming = weather === 'rain' || weather === 'heavy_rain' || weather === 'thunderstorm' || weather === 'sand';
    ctx.save();

    // 1. Screen-Wide Atmospheric Dust Tint
    if (isStorming) {
      // Full Sandstorm squall tint: warm amber-orange desert overcast
      const baseAlpha = (weather === 'thunderstorm' ? 0.44 : weather === 'heavy_rain' ? 0.35 : 0.28) * this.currentIntensity;
      ctx.fillStyle = `rgba(168, 118, 48, ${baseAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);

      // Warm contrast enhancement
      ctx.fillStyle = `rgba(138, 88, 28, ${(baseAlpha * 0.55).toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Normal Day: Gentle warm desert air glow
      const heatAlpha = 0.09 * this.currentIntensity;
      ctx.fillStyle = `rgba(215, 168, 85, ${heatAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Sandy Exploration Vignette
    const { screenX, screenY } = camera.worldToScreen(player.x + 16, player.y + 16, width, height);
    const timeSec = this.lastTime * 0.001;
    const pulse = Math.sin(timeSec * 2.0) * 8;

    const innerRadius = isStorming ? Math.max(20, 110 + pulse) : Math.max(30, 160 + pulse);
    const outerRadius = Math.max(width, height) * 0.72;

    const vignette = ctx.createRadialGradient(
      screenX,
      screenY,
      innerRadius,
      screenX,
      screenY,
      outerRadius
    );

    if (isStorming) {
      vignette.addColorStop(0, 'rgba(150, 105, 45, 0)');
      vignette.addColorStop(0.35, `rgba(175, 125, 55, ${(0.22 * this.currentIntensity).toFixed(3)})`);
      vignette.addColorStop(0.70, `rgba(145, 95, 35, ${(0.55 * this.currentIntensity).toFixed(3)})`);
      vignette.addColorStop(1.0, `rgba(105, 65, 20, ${(0.82 * this.currentIntensity).toFixed(3)})`);
    } else {
      vignette.addColorStop(0, 'rgba(210, 165, 85, 0)');
      vignette.addColorStop(0.55, `rgba(195, 145, 70, ${(0.10 * this.currentIntensity).toFixed(3)})`);
      vignette.addColorStop(1.0, `rgba(165, 115, 50, ${(0.28 * this.currentIntensity).toFixed(3)})`);
    }

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // 3. Fast Swirling Diagonal Sand Gust Streaks (during Sandstorm)
    if (isStorming) {
      const gustAlpha = 0.22 * this.currentIntensity;
      ctx.save();
      ctx.strokeStyle = `rgba(235, 192, 115, ${gustAlpha.toFixed(3)})`;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';

      const streakCount = 14;
      for (let i = 0; i < streakCount; i++) {
        const speed = 400 + (i % 5) * 80;
        const seedOffset = i * 73.17;
        const sx = ((timeSec * speed + seedOffset) % (width + 200)) - 100;
        const sy = ((timeSec * speed * 0.42 + seedOffset * 1.6) % (height + 150)) - 75;
        const len = 35 + (i % 4) * 20;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + len, sy + len * 0.42);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  private getImage(key: string): HTMLImageElement | undefined {
    let img = this.loader.getImage(key);
    if (!img || !img.complete || img.naturalWidth === 0) {
      if (!this.fallbackImgs.has(key) && typeof Image !== 'undefined') {
        const fallback = new Image();
        fallback.src = `/assets/weather/${key}.png`;
        this.fallbackImgs.set(key, fallback);
      }
      img = this.fallbackImgs.get(key);
    }
    return img;
  }

  public getIntensity(): number {
    return this.currentIntensity;
  }
}
