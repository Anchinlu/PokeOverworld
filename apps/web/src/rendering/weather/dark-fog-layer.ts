import type { Camera, ViewportBounds } from '../../core/camera';
import type { Player } from '../../entities/player';
import type { TerrainField } from '../../maps/terrain-field/terrain-field';

export interface WorldMistParticle {
  x: number;
  y: number;
  vx: number;
  baseY: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  spriteIndex: number;
  scale: number;
  alpha: number;
  targetAlpha: number;
  baseAlpha: number;
}

export interface SpiritMote {
  x: number;
  y: number;
  vy: number;
  size: number;
  alpha: number;
  pulsePhase: number;
  swayPhase: number;
}

/**
 * DarkFogLayer
 * Implements a deeply atmospheric, highly saturated dark purple-black fog system
 * exclusively for the Dark Land biome to dramatically enhance exploration tension and gloom.
 *
 * Visual Features:
 * 1. Ground & Overhead World-Space Mist (Layer 1.7):
 *    - Billowing, rich purple-black clouds rolling over cursed terrain, gravestones, and ruins.
 *    - 48 high-saturation multi-lobed organic mist puff sprites pre-rendered offscreen.
 *    - Seamlessly dissipates when drifting over border boundaries.
 *
 * 2. Full-Screen Atmospheric Gloom & Sắc Độ (Screen-Space Mood Shift):
 *    - Injects a pervasive dark plum/amethyst gloom across the entire screen when entering Dark Land,
 *      suppressing blinding daylight glare and shifting the world into a cursed twilight.
 *
 * 3. Exploration Torchlight Vignette:
 *    - Tightened vision circle around Red (75px - 175px) with deep void violet-black abyss (98% opacity)
 *      encroaching on all sides, creating an intense, immersive feeling of dangerous exploration.
 *
 * 4. Multi-Layer Volumetric Fog & Amethyst Spirit Motes:
 *    - 3 drifting horizontal volumetric mist sheets undulating across screen heights.
 *    - 32 floating glowing amethyst spirit motes (spores/will-o'-the-wisps) slowly ascending from the ground.
 */
export class DarkFogLayer {
  private currentIntensity = 0;
  private targetIntensity = 0;
  private lastTime = 0;
  private hasDarkLandInBounds = false;

  // Pre-rendered offscreen canvas sprites
  private mistSprites: HTMLCanvasElement[] = [];
  private moteSprite: HTMLCanvasElement | null = null;

  // Particle pools (Zero allocations during render loop)
  private worldParticles: WorldMistParticle[] = [];
  private spiritMotes: SpiritMote[] = [];

  private readonly maxWorldParticles = 48;
  private readonly maxSpiritMotes = 32;

  constructor() {
    this.initOffscreenCanvases();
    this.initWorldParticles();
    this.initSpiritMotes();
  }

  /**
   * Pre-renders deeply saturated organic mist textures and luminous spirit motes.
   */
  private initOffscreenCanvases(): void {
    if (typeof document === 'undefined') return;

    // Sprite 0: Large billowing dark violet-plum mist cloud (260x260) - dense & saturated
    this.mistSprites.push(
      this.createMultiLobedMistCanvas(260, [
        { offsetX: 0, offsetY: 0, radius: 105, color: 'rgba(42, 8, 68, 0.65)' },
        { offsetX: -40, offsetY: -25, radius: 75, color: 'rgba(25, 3, 42, 0.60)' },
        { offsetX: 45, offsetY: 20, radius: 80, color: 'rgba(58, 12, 92, 0.62)' },
        { offsetX: -20, offsetY: 35, radius: 70, color: 'rgba(32, 5, 52, 0.55)' },
        { offsetX: 30, offsetY: -35, radius: 65, color: 'rgba(70, 16, 110, 0.50)' },
      ])
    );

    // Sprite 1: Medium ethereal mist puff (190x190)
    this.mistSprites.push(
      this.createMultiLobedMistCanvas(190, [
        { offsetX: 0, offsetY: 0, radius: 78, color: 'rgba(52, 10, 84, 0.68)' },
        { offsetX: -30, offsetY: 18, radius: 58, color: 'rgba(34, 5, 56, 0.62)' },
        { offsetX: 32, offsetY: -20, radius: 56, color: 'rgba(68, 15, 108, 0.58)' },
        { offsetX: -12, offsetY: -30, radius: 48, color: 'rgba(24, 3, 40, 0.52)' },
      ])
    );

    // Sprite 2: Small spirit mist wisp (130x130)
    this.mistSprites.push(
      this.createMultiLobedMistCanvas(130, [
        { offsetX: 0, offsetY: 0, radius: 52, color: 'rgba(78, 18, 122, 0.72)' },
        { offsetX: -20, offsetY: -15, radius: 38, color: 'rgba(45, 8, 72, 0.65)' },
        { offsetX: 22, offsetY: 12, radius: 36, color: 'rgba(92, 22, 145, 0.58)' },
      ])
    );

    // Glowing amethyst spirit mote sprite (28x28)
    const moteCanvas = document.createElement('canvas');
    moteCanvas.width = 28;
    moteCanvas.height = 28;
    const mctx = moteCanvas.getContext('2d');
    if (mctx) {
      const grad = mctx.createRadialGradient(14, 14, 1, 14, 14, 13);
      grad.addColorStop(0, 'rgba(255, 240, 255, 1.0)');
      grad.addColorStop(0.25, 'rgba(216, 145, 255, 0.90)');
      grad.addColorStop(0.55, 'rgba(168, 85, 247, 0.55)');
      grad.addColorStop(0.85, 'rgba(126, 34, 206, 0.25)');
      grad.addColorStop(1, 'rgba(88, 28, 135, 0)');
      mctx.fillStyle = grad;
      mctx.beginPath();
      mctx.arc(14, 14, 13, 0, Math.PI * 2);
      mctx.fill();
    }
    this.moteSprite = moteCanvas;
  }

  /**
   * Creates an organic multi-lobed cloud canvas from overlapping radial gradients.
   */
  private createMultiLobedMistCanvas(
    size: number,
    lobes: Array<{ offsetX: number; offsetY: number; radius: number; color: string }>
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const center = size / 2;

    for (const lobe of lobes) {
      const lx = center + lobe.offsetX;
      const ly = center + lobe.offsetY;
      const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lobe.radius);
      grad.addColorStop(0, lobe.color);
      grad.addColorStop(0.45, lobe.color.replace(/[\d.]+\)$/, '0.40)'));
      grad.addColorStop(0.8, lobe.color.replace(/[\d.]+\)$/, '0.14)'));
      grad.addColorStop(1, 'rgba(12, 1, 20, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, lobe.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  }

  /**
   * Initializes static pool for world-space mist particles.
   */
  private initWorldParticles(): void {
    this.worldParticles = [];
    for (let i = 0; i < this.maxWorldParticles; i++) {
      this.worldParticles.push({
        x: 0,
        y: 0,
        vx: 12 + Math.random() * 16,
        baseY: 0,
        swayAmp: 12 + Math.random() * 18,
        swayFreq: 0.9 + Math.random() * 0.9,
        swayPhase: Math.random() * Math.PI * 2,
        spriteIndex: i % 3,
        scale: 0.95 + Math.random() * 0.55,
        alpha: 0,
        targetAlpha: 0,
        baseAlpha: 0.55 + Math.random() * 0.40,
      });
    }
  }

  /**
   * Initializes static pool for screen-space floating spirit motes.
   */
  private initSpiritMotes(): void {
    this.spiritMotes = [];
    for (let i = 0; i < this.maxSpiritMotes; i++) {
      this.spiritMotes.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        vy: 16 + Math.random() * 26,
        size: 16 + Math.random() * 12,
        alpha: 0.3 + Math.random() * 0.7,
        pulsePhase: Math.random() * Math.PI * 2,
        swayPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * Updates proximity interpolation, world-space mist drifting, and spirit motes.
   */
  public update(
    now: number,
    player: Player,
    field: TerrainField,
    bounds: ViewportBounds,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (this.lastTime === 0) {
      this.lastTime = now;
    }
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // 1. Calculate Target Fog Intensity based on Player's Proximity to Dark Land
    const isPlayerInDark = Boolean(field.isDarkLand && field.isDarkLand(player.gx, player.gy));
    let darkLandSampleCount = 0;
    const sampleRadius = 4; // 9x9 sample area around player
    const totalSamples = (sampleRadius * 2 + 1) * (sampleRadius * 2 + 1); // 81 tiles

    if (field.isDarkLand) {
      for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
        for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
          if (field.isDarkLand(player.gx + dx, player.gy + dy)) {
            darkLandSampleCount++;
          }
        }
      }
    }

    if (isPlayerInDark) {
      // Inside Dark Land: deep immersion
      const depthRatio = darkLandSampleCount / totalSamples;
      this.targetIntensity = 0.85 + 0.15 * depthRatio;
    } else if (darkLandSampleCount > 0) {
      // Near Dark Land border: gradual ominous buildup
      const nearRatio = darkLandSampleCount / totalSamples;
      this.targetIntensity = Math.min(0.70, nearRatio * 1.3);
    } else {
      // Outside Dark Land: completely clear
      this.targetIntensity = 0.0;
    }

    // Responsive exponential lerp (fades in quickly, dissipates smoothly)
    const lerpSpeed = this.targetIntensity > this.currentIntensity ? 2.2 : 1.2;
    this.currentIntensity += (this.targetIntensity - this.currentIntensity) * Math.min(1.0, dt * lerpSpeed);

    // 2. Check if visible viewport contains ANY Dark Land tiles
    this.hasDarkLandInBounds = false;
    if (field.isDarkLand) {
      const minGX = Math.floor(bounds.minX / 32);
      const maxGX = Math.ceil(bounds.maxX / 32);
      const minGY = Math.floor(bounds.minY / 32);
      const maxGY = Math.ceil(bounds.maxY / 32);

      // Fast coarse sampling (every 2 tiles) to check for Dark Land presence
      for (let gy = minGY; gy <= maxGY; gy += 2) {
        for (let gx = minGX; gx <= maxGX; gx += 2) {
          if (field.isDarkLand(gx, gy)) {
            this.hasDarkLandInBounds = true;
            break;
          }
        }
        if (this.hasDarkLandInBounds) break;
      }
    }

    // 3. Update World-Space Mist Particles if Dark Land is in bounds or nearby
    if (this.hasDarkLandInBounds || this.currentIntensity > 0.01) {
      const boundsWidth = bounds.maxX - bounds.minX;
      const boundsHeight = bounds.maxY - bounds.minY;

      for (let i = 0; i < this.worldParticles.length; i++) {
        const p = this.worldParticles[i];

        // First-time placement
        if (p.x === 0 && p.y === 0) {
          p.x = bounds.minX + Math.random() * boundsWidth;
          p.baseY = bounds.minY + Math.random() * boundsHeight;
        }

        // Horizontal drift with sinusoidal vertical sway
        p.x += p.vx * dt;
        p.y = p.baseY + Math.sin(now * 0.001 * p.swayFreq + p.swayPhase) * p.swayAmp;

        // Check tile beneath particle
        const gx = Math.floor(p.x / 32);
        const gy = Math.floor(p.y / 32);
        const isDarkTile = Boolean(field.isDarkLand && field.isDarkLand(gx, gy));

        // If particle moves out of viewport bounds, respawn on windward side
        if (p.x > bounds.maxX + 130) {
          p.x = bounds.minX - 130;
          p.baseY = bounds.minY + Math.random() * boundsHeight;
          p.alpha = 0;
        } else if (p.x < bounds.minX - 150) {
          p.x = bounds.maxX + 130;
          p.baseY = bounds.minY + Math.random() * boundsHeight;
          p.alpha = 0;
        }

        // Target alpha fades to 0 if drifting outside Dark Land
        if (isDarkTile) {
          p.targetAlpha = p.baseAlpha;
        } else if (this.currentIntensity > 0.2) {
          // If player is deep in dark fog, allow edge bleeding
          p.targetAlpha = p.baseAlpha * 0.45;
        } else {
          p.targetAlpha = 0;
        }

        p.alpha += (p.targetAlpha - p.alpha) * Math.min(1.0, dt * 2.8);
      }
    }

    // 4. Update Screen-Space Spirit Motes
    if (this.currentIntensity > 0.005) {
      for (let i = 0; i < this.spiritMotes.length; i++) {
        const m = this.spiritMotes[i];
        m.y -= m.vy * dt;
        m.x += Math.sin(now * 0.002 + m.swayPhase) * (18 * dt);

        if (m.y < -20) {
          m.y = canvasHeight + 15;
          m.x = Math.random() * canvasWidth;
        }
      }
    }
  }

  /**
   * Renders drifting dark violet mist wisps in world coordinates (Layer 1.7).
   */
  public renderWorld(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    _field: TerrainField
  ): void {
    if (!this.hasDarkLandInBounds && this.currentIntensity <= 0.01) return;
    if (this.mistSprites.length === 0) return;

    ctx.save();
    ctx.imageSmoothingEnabled = true;

    for (let i = 0; i < this.worldParticles.length; i++) {
      const p = this.worldParticles[i];
      if (p.alpha <= 0.005) continue;

      // Viewport culling with margin
      if (p.x < bounds.minX - 180 || p.x > bounds.maxX + 180 ||
          p.y < bounds.minY - 180 || p.y > bounds.maxY + 180) {
        continue;
      }

      const sprite = this.mistSprites[p.spriteIndex % this.mistSprites.length];
      const drawW = sprite.width * p.scale;
      const drawH = sprite.height * p.scale;

      ctx.globalAlpha = p.alpha;
      ctx.drawImage(sprite, p.x - drawW / 2, p.y - drawH / 2, drawW, drawH);
    }

    ctx.restore();
  }

  /**
   * Renders screen-space atmospheric gloom, torchlight vignette, volumetric sheets, and spirit motes.
   */
  public renderScreen(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: Camera,
    player: Player
  ): void {
    if (this.currentIntensity <= 0.005) return;

    ctx.save();

    // 1. Full-Screen Atmospheric Gloom & Sắc Độ (Suppresses bright daytime glare & introduces cursed twilight)
    const gloomAlpha = 0.42 * this.currentIntensity;
    ctx.fillStyle = `rgba(16, 2, 28, ${gloomAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, width, height);

    // Rich Cursed Violet Saturation Layer
    const saturationAlpha = 0.24 * this.currentIntensity;
    ctx.fillStyle = `rgba(54, 10, 86, ${saturationAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, width, height);

    // Calculate player center on screen
    const { screenX, screenY } = camera.worldToScreen(player.x + 16, player.y + 16, width, height);

    // 2. Dynamic Exploration Torchlight Vignette
    const timeSec = this.lastTime * 0.001;
    const pulse = Math.sin(timeSec * 1.5) * 6;
    const innerRadius = Math.max(15, 80 + pulse);
    const midRadius = Math.max(innerRadius + 45, 175 + pulse * 1.2);
    const outerRadius = Math.max(width, height) * 0.70;
    const midStop = Math.min(0.60, Math.max(0.28, midRadius / outerRadius));

    const vignette = ctx.createRadialGradient(
      screenX,
      screenY,
      innerRadius,
      screenX,
      screenY,
      outerRadius
    );

    // Rich saturated dark purple-black gradient stops
    vignette.addColorStop(0, `rgba(24, 4, 38, ${(0.08 * this.currentIntensity).toFixed(3)})`);
    vignette.addColorStop(0.22, `rgba(38, 6, 60, ${(0.38 * this.currentIntensity).toFixed(3)})`);
    vignette.addColorStop(midStop, `rgba(58, 10, 92, ${(0.76 * this.currentIntensity).toFixed(3)})`);
    vignette.addColorStop(0.75, `rgba(26, 3, 42, ${(0.92 * this.currentIntensity).toFixed(3)})`);
    vignette.addColorStop(1.0, `rgba(8, 1, 14, ${(0.98 * this.currentIntensity).toFixed(3)})`);

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // 3. Multi-Layer Volumetric Drifting Mist Sheets
    const sheetAlpha = 0.26 * this.currentIntensity;
    if (sheetAlpha > 0.01) {
      // Sheet 1: High drift (drifting downwards right)
      const offY1 = (timeSec * 11) % height;
      const sheetGrad1 = ctx.createLinearGradient(0, offY1 - 90, 0, offY1 + 90);
      sheetGrad1.addColorStop(0, 'rgba(30, 4, 46, 0)');
      sheetGrad1.addColorStop(0.5, `rgba(68, 14, 110, ${sheetAlpha.toFixed(3)})`);
      sheetGrad1.addColorStop(1, 'rgba(30, 4, 46, 0)');
      ctx.fillStyle = sheetGrad1;
      ctx.fillRect(0, offY1 - 90, width, 180);

      // Sheet 2: Opposing low drift (drifting upwards left)
      const offY2 = (height - ((timeSec * 15) % height));
      const sheetGrad2 = ctx.createLinearGradient(0, offY2 - 100, 0, offY2 + 100);
      sheetGrad2.addColorStop(0, 'rgba(18, 2, 28, 0)');
      sheetGrad2.addColorStop(0.5, `rgba(48, 8, 78, ${(sheetAlpha * 0.9).toFixed(3)})`);
      sheetGrad2.addColorStop(1, 'rgba(18, 2, 28, 0)');
      ctx.fillStyle = sheetGrad2;
      ctx.fillRect(0, offY2 - 100, width, 200);

      // Sheet 3: Center atmospheric band
      const offY3 = ((timeSec * 7 + height * 0.5) % height);
      const sheetGrad3 = ctx.createLinearGradient(0, offY3 - 80, 0, offY3 + 80);
      sheetGrad3.addColorStop(0, 'rgba(25, 3, 38, 0)');
      sheetGrad3.addColorStop(0.5, `rgba(88, 18, 140, ${(sheetAlpha * 0.75).toFixed(3)})`);
      sheetGrad3.addColorStop(1, 'rgba(25, 3, 38, 0)');
      ctx.fillStyle = sheetGrad3;
      ctx.fillRect(0, offY3 - 80, width, 160);
    }

    // 4. Luminous Amethyst Spirit Motes (Will-o'-the-Wisps)
    if (this.moteSprite && this.currentIntensity > 0.05) {
      for (let i = 0; i < this.spiritMotes.length; i++) {
        const m = this.spiritMotes[i];
        const pulse = 0.70 + 0.30 * Math.sin(timeSec * 3.2 + m.pulsePhase);
        const moteAlpha = m.alpha * pulse * this.currentIntensity;

        if (moteAlpha <= 0.02) continue;

        ctx.globalAlpha = moteAlpha;
        ctx.drawImage(this.moteSprite, m.x - m.size / 2, m.y - m.size / 2, m.size, m.size);
      }
    }

    ctx.restore();
  }

  /**
   * Returns the current smoothed fog intensity [0.0 - 1.0].
   */
  public getIntensity(): number {
    return this.currentIntensity;
  }

  /**
   * Returns whether Dark Land is currently active in the visible bounds.
   */
  public isDarkLandActive(): boolean {
    return this.hasDarkLandInBounds || this.currentIntensity > 0.01;
  }
}
