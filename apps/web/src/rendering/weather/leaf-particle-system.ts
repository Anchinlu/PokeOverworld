import type { ViewportBounds } from '../../core/camera';
import type { AssetLoader } from '../asset-loader';
import type { TimeBand } from '../../wildlife/ports/world-query';
import type { TerrainField } from '../../maps/terrain-field/terrain-field';

export interface LeafParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  frame: number;
  frameTimer: number;
  frameDuration: number;
  scale: number;
  alpha: number;
  timeBand: TimeBand;
}

/**
 * LeafParticleSystem
 * Simulates gentle drifting leaves tumbling through the wind across the overworld.
 *
 * Features:
 * - 5-frame tumbling leaf animation from 80x16 spritesheet (16x16 per frame).
 * - Drifts along wind direction with organic sinusoidal flutter and rotation.
 * - Dynamic Day-Phase Color Adaptation:
 *   - Day: Fresh vibrant green (leaf_wind_day / leaf_wind_strip)
 *   - Dusk: Rich autumn golden amber / fiery orange-red (leaf_wind_dusk)
 *   - Night: Luminous moonlit teal / jade (leaf_wind_night)
 *   - Dawn: Dewy peach-rose gold (leaf_wind_dawn)
 * - Seamless boundary respawn along windward edges.
 * - Zero GC allocation in render loop.
 */
export class LeafParticleSystem {
  private loader: AssetLoader;
  private particles: LeafParticle[] = [];
  private fallbackImgs: Map<string, HTMLImageElement> = new Map();
  private lastUpdateTime: number = 0;
  private readonly maxParticles: number = 28;

  constructor(loader: AssetLoader) {
    this.loader = loader;
  }

  private initParticles(bounds: ViewportBounds, timeBand: TimeBand): void {
    this.particles = [];
    const width = Math.max(bounds.maxX - bounds.minX, 320);
    const height = Math.max(bounds.maxY - bounds.minY, 240);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: bounds.minX + Math.random() * width,
        y: bounds.minY + Math.random() * height,
        vx: 55 + Math.random() * 35,
        vy: 22 + Math.random() * 20,
        swayAmp: 14 + Math.random() * 16,
        swayFreq: 2.2 + Math.random() * 1.8,
        swayPhase: Math.random() * Math.PI * 2,
        frame: Math.floor(Math.random() * 5),
        frameTimer: Math.random() * 100,
        frameDuration: 95 + Math.random() * 35,
        scale: 0.85 + Math.random() * 0.35,
        alpha: 0.82 + Math.random() * 0.18,
        timeBand,
      });
    }
  }

  public update(
    now: number,
    bounds: ViewportBounds,
    timeBand: TimeBand,
    windMultiplier: number = 1.0,
    isPaused: boolean = false
  ): void {
    if (isPaused) {
      this.lastUpdateTime = now;
      return;
    }

    if (this.lastUpdateTime === 0) {
      this.lastUpdateTime = now;
      this.initParticles(bounds, timeBand);
      return;
    }

    const dtMs = Math.min(Math.max(now - this.lastUpdateTime, 0), 100);
    this.lastUpdateTime = now;

    if (this.particles.length === 0) {
      this.initParticles(bounds, timeBand);
    }

    const margin = 48;
    const leftBound = bounds.minX - margin;
    const rightBound = bounds.maxX + margin;
    const topBound = bounds.minY - margin;
    const bottomBound = bounds.maxY + margin;
    const width = rightBound - leftBound;
    const height = bottomBound - topBound;

    const timeSec = now / 1000;
    const dtSec = dtMs / 1000;
    const speedMult = Math.max(0.4, Math.min(windMultiplier, 3.0));

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // 1. Advance tumbling frame animation
      p.frameTimer += dtMs;
      if (p.frameTimer >= p.frameDuration) {
        p.frameTimer = 0;
        p.frame = (p.frame + 1) % 5;
      }

      // 2. Sinusoidal flutter sway and wind motion
      const sway = Math.sin(timeSec * p.swayFreq + p.swayPhase);
      p.x += (p.vx * speedMult + sway * p.swayAmp * 0.7) * dtSec;
      p.y += (p.vy * speedMult + Math.abs(sway) * p.swayAmp * 0.35) * dtSec;

      // 3. Boundary check: respawn at windward edges (top or left)
      if (p.x > rightBound || p.y > bottomBound || p.x < leftBound - 64 || p.y < topBound - 64) {
        if (Math.random() < 0.5) {
          // Windward top edge
          p.x = leftBound + Math.random() * width;
          p.y = topBound + (Math.random() * 24 - 12);
        } else {
          // Windward left edge
          p.x = leftBound + (Math.random() * 24 - 12);
          p.y = topBound + Math.random() * height;
        }

        p.swayPhase = Math.random() * Math.PI * 2;
        p.timeBand = timeBand; // Seamlessly update leaf color palette to current day phase!
        p.alpha = 0.82 + Math.random() * 0.18;
        p.scale = 0.85 + Math.random() * 0.35;
        p.frame = Math.floor(Math.random() * 5);
        p.frameTimer = 0;
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    now: number,
    field?: TerrainField
  ): void {
    if (this.particles.length === 0) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const timeSec = now / 1000;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Frustum culling
      if (
        p.x < bounds.minX - 24 ||
        p.x > bounds.maxX + 24 ||
        p.y < bounds.minY - 24 ||
        p.y > bounds.maxY + 24
      ) {
        continue;
      }

      // Do not render falling leaves over desert terrain
      if (field?.isDesert?.(Math.floor(p.x / 32), Math.floor(p.y / 32))) {
        continue;
      }

      const img = this.getImageForPhase(p.timeBand);
      if (!img || !img.complete || img.naturalWidth === 0) continue;

      const sx = p.frame * 16;
      const sy = 0;
      const sw = 16;
      const sh = 16;

      const sway = Math.sin(timeSec * p.swayFreq + p.swayPhase);
      const angle = sway * 0.42;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(Math.round(p.x), Math.round(p.y));
      ctx.rotate(angle);
      const dw = Math.round(16 * p.scale);
      const dh = Math.round(16 * p.scale);
      ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }

    ctx.restore();
  }

  private getImageForPhase(phase: TimeBand): HTMLImageElement | undefined {
    const key = `leaf_wind_${phase}`;
    let img = this.loader.getImage(key);

    if (!img || !img.complete || img.naturalWidth === 0) {
      img = this.loader.getImage('leaf_wind_strip');
    }

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
}
