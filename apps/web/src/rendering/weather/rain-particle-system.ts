import type { ViewportBounds } from '../../core/camera';
import type { AssetLoader } from '../asset-loader';
import type { OverworldWeather } from '../../world/overworld-weather';
import type { TerrainField } from '../../maps/terrain-field/terrain-field';

export interface RainDrop {
  groundX: number; // Map ground impact target X (world coordinate)
  groundY: number; // Map ground impact target Y (world coordinate)
  z: number;       // Current altitude above ground in pixels (falls toward 0)
  zStart: number;  // Starting altitude in pixels (100 - 160px)
  vz: number;      // Falling velocity in altitude (px/s)
  alpha: number;   // Streak opacity
  length: number;  // Streak length in pixels (24 - 42px)
  type: 'rain_1' | 'rain_2' | 'rain_3';
  active: boolean; // Active state in pool
}

export interface RainSplash {
  x: number;
  y: number;
  timer: number;
  duration: number;
  maxRadius: number;
  alpha: number;
  active: boolean;
  dropletDx1: number;
  dropletDy1: number;
  dropletDx2: number;
  dropletDy2: number;
}

/**
 * RainParticleSystem
 * 2.5D World Map Precipitation & Ground Ripple System:
 * - Each raindrop is physically anchored to a ground tile target (groundX, groundY).
 * - Rain falls from high in the sky (z > 0) diagonally down onto the map at a pronounced
 *   2.5D angle (~28° to 32°), instead of sliding flat across the computer screen glass.
 * - When a drop hits the ground (z <= 0), it triggers a prominent, expanding ground ripple
 *   ellipse and droplet splash directly on that map tile surface.
 * - Splashes render on the terrain surface (Layer 0.95 - beneath characters/trees),
 *   while falling rain streaks pass through the air above characters and flora (Layer 1.6).
 */
export class RainParticleSystem {
  private loader: AssetLoader;
  private drops: RainDrop[] = [];
  private splashes: RainSplash[] = [];
  private fallbackImgs: Map<string, HTMLImageElement> = new Map();

  private lastUpdateTime = 0;
  private readonly maxDrops = 140;
  private readonly maxSplashes = 100;

  // Pronounced 2.5D slant angle (~28 degrees from vertical: dx/dy = 0.52)
  public readonly slantX = 0.52;
  public readonly slantY = 1.00;

  // Lightning state for thunderstorm
  private lightningTimer = 0;
  private lightningNextTime = 4000 + Math.random() * 4000;
  private lightningFlashAlpha = 0;

  constructor(loader: AssetLoader) {
    this.loader = loader;
    this.initPools();
  }

  private initPools(): void {
    this.drops = [];
    for (let i = 0; i < this.maxDrops; i++) {
      this.drops.push({
        groundX: 0,
        groundY: 0,
        z: -1,
        zStart: 130,
        vz: 800,
        alpha: 0.75,
        length: 30,
        type: 'rain_2',
        active: false,
      });
    }

    this.splashes = [];
    for (let i = 0; i < this.maxSplashes; i++) {
      this.splashes.push({
        x: 0,
        y: 0,
        timer: 0,
        duration: 220,
        maxRadius: 14,
        alpha: 0,
        active: false,
        dropletDx1: 0,
        dropletDy1: 0,
        dropletDx2: 0,
        dropletDy2: 0,
      });
    }
  }

  private getTargetDropCount(weather: OverworldWeather, forceRain: boolean): number {
    if (forceRain) {
      if (weather === 'thunderstorm') return 125;
      if (weather === 'heavy_rain') return 90;
      return 60;
    }

    switch (weather) {
      case 'thunderstorm':
        return 125;
      case 'heavy_rain':
        return 90;
      case 'rain':
        return 60;
      default:
        return 0;
    }
  }

  public update(
    now: number,
    bounds: ViewportBounds,
    weather: OverworldWeather,
    forceRain: boolean = false,
    isPaused: boolean = false,
    field?: TerrainField,
    player?: { gx: number; gy: number }
  ): void {
    if (isPaused) {
      this.lastUpdateTime = now;
      return;
    }

    if (this.lastUpdateTime === 0) {
      this.lastUpdateTime = now;
      return;
    }

    const dtMs = Math.min(Math.max(now - this.lastUpdateTime, 0), 100);
    this.lastUpdateTime = now;
    const dtSec = dtMs / 1000;

    const targetCount = this.getTargetDropCount(weather, forceRain);

    // 1. Update rain drops with 2.5D map fall trajectory
    for (let i = 0; i < this.maxDrops; i++) {
      const drop = this.drops[i];

      if (i < targetCount) {
        if (!drop.active) {
          // Initialize drop with staggered altitude
          this.spawnDrop(drop, bounds, weather, true, field);
        }

        // Descend toward ground (z decreases)
        drop.z -= drop.vz * dtSec;

        // When drop strikes the ground
        if (drop.z <= 0) {
          // Trigger prominent splash ripple right on the ground map coordinate (except desert)
          if (
            drop.groundX >= bounds.minX - 32 &&
            drop.groundX <= bounds.maxX + 32 &&
            drop.groundY >= bounds.minY - 32 &&
            drop.groundY <= bounds.maxY + 32
          ) {
            this.triggerSplash(drop.groundX, drop.groundY, field);
          }

          // Respawn at a new ground location
          this.spawnDrop(drop, bounds, weather, false, field);
        } else {
          // Check if ground target drifted far outside camera viewport
          if (
            drop.groundX < bounds.minX - 160 ||
            drop.groundX > bounds.maxX + 160 ||
            drop.groundY < bounds.minY - 160 ||
            drop.groundY > bounds.maxY + 160
          ) {
            this.spawnDrop(drop, bounds, weather, true, field);
          }
        }
      } else {
        // Naturally finish current fall and deactivate
        if (drop.active) {
          drop.z -= drop.vz * dtSec;
          if (drop.z <= 0) {
            drop.active = false;
          }
        }
      }
    }

    // 2. Update splash ripples
    for (let i = 0; i < this.splashes.length; i++) {
      const s = this.splashes[i];
      if (!s.active) continue;

      s.timer += dtMs;
      if (s.timer >= s.duration) {
        s.active = false;
      }
    }

    // 3. Lightning flash simulation for thunderstorm (strictly suppressed when player is in desert)
    const isPlayerInDesert = player ? Boolean(field?.isDesert?.(player.gx, player.gy)) : false;
    if (weather === 'thunderstorm' && !isPlayerInDesert) {
      this.lightningTimer += dtMs;
      if (this.lightningTimer >= this.lightningNextTime) {
        this.lightningTimer = 0;
        this.lightningNextTime = 4000 + Math.random() * 5000;
        this.lightningFlashAlpha = 0.75;
      }
      if (this.lightningFlashAlpha > 0) {
        this.lightningFlashAlpha = Math.max(0, this.lightningFlashAlpha - dtSec * 1.8);
      }
    } else {
      this.lightningFlashAlpha = 0;
    }
  }

  private spawnDrop(
    drop: RainDrop,
    bounds: ViewportBounds,
    weather: OverworldWeather,
    randomizeZ: boolean,
    field?: TerrainField
  ): void {
    const pad = 64;
    let targetX = 0;
    let targetY = 0;
    let isDesert = false;

    // Retry to find non-desert landing ground
    for (let attempt = 0; attempt < 6; attempt++) {
      targetX = bounds.minX - pad + Math.random() * (bounds.maxX - bounds.minX + pad * 2);
      targetY = bounds.minY - pad + Math.random() * (bounds.maxY - bounds.minY + pad * 2);
      const gx = Math.floor(targetX / 32);
      const gy = Math.floor(targetY / 32);
      isDesert = Boolean(field?.isDesert?.(gx, gy));
      if (!isDesert) break;
    }

    if (isDesert) {
      drop.active = false;
      return;
    }

    drop.groundX = targetX;
    drop.groundY = targetY;

    if (weather === 'thunderstorm') {
      drop.type = Math.random() < 0.65 ? 'rain_3' : 'rain_2';
      drop.zStart = 130 + Math.random() * 60;
      drop.vz = 880 + Math.random() * 220;
      drop.alpha = 0.82 + Math.random() * 0.18;
      drop.length = 32 + Math.random() * 10;
    } else if (weather === 'heavy_rain') {
      drop.type = Math.random() < 0.5 ? 'rain_3' : 'rain_2';
      drop.zStart = 110 + Math.random() * 50;
      drop.vz = 780 + Math.random() * 180;
      drop.alpha = 0.78 + Math.random() * 0.2;
      drop.length = 28 + Math.random() * 8;
    } else {
      // standard rain
      drop.type = Math.random() < 0.55 ? 'rain_1' : 'rain_2';
      drop.zStart = 90 + Math.random() * 45;
      drop.vz = 680 + Math.random() * 160;
      drop.alpha = 0.72 + Math.random() * 0.22;
      drop.length = 22 + Math.random() * 8;
    }

    drop.z = randomizeZ ? Math.random() * drop.zStart : drop.zStart;
    drop.active = true;
  }

  private triggerSplash(x: number, y: number, field?: TerrainField): void {
    const gx = Math.floor(x / 32);
    const gy = Math.floor(y / 32);
    if (field?.isDesert?.(gx, gy)) {
      return; // No rain splashes on desert sand
    }

    for (let i = 0; i < this.splashes.length; i++) {
      const s = this.splashes[i];
      if (!s.active) {
        s.active = true;
        s.x = x;
        s.y = y;
        s.timer = 0;
        s.duration = 200 + Math.random() * 70;
        s.maxRadius = 11 + Math.random() * 6;
        s.alpha = 0.85 + Math.random() * 0.15;
        // 2 droplet sparks bouncing from ground impact
        s.dropletDx1 = (Math.random() - 0.5) * 14;
        s.dropletDy1 = 7 + Math.random() * 5;
        s.dropletDx2 = (Math.random() - 0.5) * 16;
        s.dropletDy2 = 8 + Math.random() * 6;
        return;
      }
    }
  }

  /**
   * Renders water ripples on ground surface (Layer 0.95, beneath characters/trees)
   */
  public renderSplashes(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    field?: TerrainField
  ): void {
    const splashImg = this.getImage('rain_4');
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < this.splashes.length; i++) {
      const s = this.splashes[i];
      if (!s.active) continue;

      if (
        s.x < bounds.minX - 32 ||
        s.x > bounds.maxX + 32 ||
        s.y < bounds.minY - 32 ||
        s.y > bounds.maxY + 32
      ) {
        continue;
      }

      // Do not render splashes on desert terrain
      if (field?.isDesert?.(Math.floor(s.x / 32), Math.floor(s.y / 32))) {
        continue;
      }

      const progress = s.timer / s.duration; // 0.0 -> 1.0
      const curAlpha = s.alpha * (1 - progress * progress); // smooth quadratic fade

      // 1. Expanding 2.5D ground ripple ellipse (ratio 2.2:1)
      const rx = 3 + (s.maxRadius - 3) * progress;
      const ry = rx * 0.45;

      ctx.save();
      ctx.strokeStyle = `rgba(224, 242, 254, ${(curAlpha * 0.9).toFixed(3)})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(Math.round(s.x), Math.round(s.y), rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary inner ripple
      if (progress > 0.15) {
        const p2 = (progress - 0.15) / 0.85;
        const rx2 = s.maxRadius * 0.55 * p2;
        ctx.strokeStyle = `rgba(186, 230, 253, ${(curAlpha * 0.5).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(Math.round(s.x), Math.round(s.y), rx2, rx2 * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2. Center splash sprite rain_4 (first 60% of animation)
      if (splashImg && splashImg.complete && splashImg.naturalWidth > 0 && progress < 0.6) {
        const spriteAlpha = curAlpha * (1 - progress / 0.6);
        ctx.globalAlpha = Math.max(0, Math.min(spriteAlpha, 1.0));
        ctx.drawImage(splashImg, Math.round(s.x - 8), Math.round(s.y - 12), 16, 16);
      }

      // 3. Two tiny bouncing droplet particles jumping up from the ground
      if (progress < 0.75) {
        const jumpArc = Math.sin(progress * Math.PI);
        ctx.fillStyle = `rgba(240, 249, 255, ${(curAlpha * 0.95).toFixed(3)})`;
        const px1 = Math.round(s.x + s.dropletDx1 * progress);
        const py1 = Math.round(s.y - jumpArc * s.dropletDy1);
        ctx.fillRect(px1, py1, 1.5, 1.5);

        const px2 = Math.round(s.x + s.dropletDx2 * progress);
        const py2 = Math.round(s.y - jumpArc * s.dropletDy2);
        ctx.fillRect(px2, py2, 1.5, 1.5);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Renders falling raindrops through air (Layer 1.6, in front of characters/trees)
   */
  public renderDrops(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    canvasWidth: number,
    canvasHeight: number,
    weather: OverworldWeather = 'rain',
    field?: TerrainField,
    player?: { gx: number; gy: number }
  ): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const isPlayerInDesert = player ? Boolean(field?.isDesert?.(player.gx, player.gy)) : false;
    const centerGx = Math.floor((bounds.minX + bounds.maxX) / 64);
    const centerGy = Math.floor((bounds.minY + bounds.maxY) / 64);
    const isCenterInDesert = field ? Boolean(field?.isDesert?.(centerGx, centerGy)) : false;
    const isDesert = isPlayerInDesert || isCenterInDesert;

    // Atmospheric cool rainy haze over viewport (strictly suppressed over desert terrain)
    if (!isDesert) {
      if (weather === 'thunderstorm') {
        ctx.save();
        ctx.fillStyle = 'rgba(12, 22, 45, 0.16)';
        ctx.fillRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        ctx.restore();
      } else if (weather === 'heavy_rain') {
        ctx.save();
        ctx.fillStyle = 'rgba(18, 32, 55, 0.11)';
        ctx.fillRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        ctx.restore();
      } else if (weather === 'rain') {
        ctx.save();
        ctx.fillStyle = 'rgba(25, 42, 65, 0.06)';
        ctx.fillRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        ctx.restore();
      }
    }

    for (let i = 0; i < this.maxDrops; i++) {
      const drop = this.drops[i];
      if (!drop.active || drop.z < 0) continue;

      // Project 2.5D position: drop falls diagonally down-right toward groundX, groundY
      const currentX = drop.groundX - drop.z * this.slantX;
      const currentY = drop.groundY - drop.z * this.slantY;

      // Frustum culling
      if (
        currentX < bounds.minX - 48 ||
        currentX > bounds.maxX + 48 ||
        currentY < bounds.minY - 48 ||
        currentY > bounds.maxY + 48
      ) {
        continue;
      }

      // Do not render raindrops falling on desert ground or in desert air
      if (field?.isDesert?.(Math.floor(drop.groundX / 32), Math.floor(drop.groundY / 32)) ||
          field?.isDesert?.(Math.floor(currentX / 32), Math.floor(currentY / 32))) {
        continue;
      }

      // Calculate streak vector
      const tailX = currentX - drop.length * this.slantX;
      const tailY = currentY - drop.length * this.slantY;

      // Render crisp, glowing needle raindrop
      const grad = ctx.createLinearGradient(tailX, tailY, currentX, currentY);
      grad.addColorStop(0, 'rgba(186, 230, 253, 0.05)');
      grad.addColorStop(0.5, `rgba(215, 238, 255, ${(drop.alpha * 0.65).toFixed(2)})`);
      grad.addColorStop(1.0, `rgba(255, 255, 255, ${(drop.alpha * 0.95).toFixed(2)})`);

      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = drop.type === 'rain_3' ? 2.0 : drop.type === 'rain_2' ? 1.6 : 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(Math.round(tailX), Math.round(tailY));
      ctx.lineTo(Math.round(currentX), Math.round(currentY));
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Occasional thunderstorm lightning flash (strictly suppressed in desert terrain)
    if (!isDesert && this.lightningFlashAlpha > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(240, 248, 255, ${this.lightningFlashAlpha.toFixed(3)})`;
      ctx.fillRect(bounds.minX - 64, bounds.minY - 64, canvasWidth * 3, canvasHeight * 3);
      ctx.restore();
    }
  }

  /**
   * Combined render method for backward compatibility
   */
  public render(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    this.renderSplashes(ctx, bounds);
    this.renderDrops(ctx, bounds, canvasWidth, canvasHeight);
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
}
