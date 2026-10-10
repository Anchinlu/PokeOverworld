// Type indices in Graphics/Pokedex/icon_types.png (18 types, 32px height each)
export const TYPE_INDICES: Record<string, number> = {
  Normal: 0,
  Fighting: 1,
  Flying: 2,
  Poison: 3,
  Ground: 4,
  Rock: 5,
  Bug: 6,
  Ghost: 7,
  Steel: 8,
  Fire: 10,
  Water: 11,
  Grass: 12,
  Electric: 13,
  Psychic: 14,
  Ice: 15,
  Dragon: 16,
  Dark: 17,
  Fairy: 18,
};

import { POKEMON_ASSETS } from '../../assets';

// Canvas Pixel-Perfect Type Badge Renderer for types.png
export class TypeBadgeRenderer {
  private static img: HTMLImageElement | null = null;
  private static isLoaded = false;
  private static pendingCallbacks: (() => void)[] = [];

  public static init(): void {
    if (!TypeBadgeRenderer.img) {
      const img = new Image();
      img.src = POKEMON_ASSETS.typeBadgesSheet;
      img.onload = () => {
        TypeBadgeRenderer.isLoaded = true;
        TypeBadgeRenderer.pendingCallbacks.forEach((cb) => cb());
        TypeBadgeRenderer.pendingCallbacks = [];
      };
      TypeBadgeRenderer.img = img;
    }
  }

  public static renderBadge(canvas: HTMLCanvasElement, typeIndex: number): void {
    TypeBadgeRenderer.init();
    const w = 64;
    const h = 28;
    canvas.width = w;
    canvas.height = h;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !TypeBadgeRenderer.img) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(TypeBadgeRenderer.img, 17, typeIndex * 32 + 2, 64, 28, 0, 0, w, h);
    };

    if (TypeBadgeRenderer.isLoaded) {
      draw();
    } else {
      TypeBadgeRenderer.pendingCallbacks.push(draw);
    }
  }
}

export interface AnimatorOptions {
  fixedWidth?: number;
  fixedHeight?: number;
  groundY?: number;
}

// Canvas Animated Sprite Manager for EBS Generation 5 horizontal strip sprites
export class PokemonSpriteAnimator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private img: HTMLImageElement | null = null;
  private animFrameId: number | null = null;
  private currentFrame = 0;
  private totalFrames = 1;
  private frameWidth = 0;
  private frameHeight = 0;
  private lastTime = 0;
  private frameDuration = 45; // ~22 FPS
  private options?: AnimatorOptions;
  private destX = 0;
  private destY = 0;
  private destW = 0;
  private destH = 0;

  constructor(canvas: HTMLCanvasElement, options?: AnimatorOptions) {
    this.canvas = canvas;
    this.options = options;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  getFrameDuration(): number {
    return this.frameDuration;
  }

  load(src: string, isShiny?: boolean): void {
    this.stop();
    const shiny = isShiny ?? /shiny/i.test(src);
    this.frameDuration = shiny ? 90 : 45;
    const img =
      typeof Image !== 'undefined'
        ? new Image()
        : ({ src: '', complete: true, width: 960, height: 96 } as unknown as HTMLImageElement);
    img.src = src;
    img.onload = () => {
      this.img = img;
      this.frameHeight = img.height;
      this.frameWidth = img.height; // Square frame
      this.totalFrames = Math.max(1, Math.floor(img.width / img.height));
      this.currentFrame = 0;

      if (this.options?.fixedWidth && this.options?.fixedHeight) {
        this.canvas.width = this.options.fixedWidth;
        this.canvas.height = this.options.fixedHeight;

        // Scan non-transparent bounding box of frame 0
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.frameWidth;
        tempCanvas.height = this.frameHeight;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        let minX = this.frameWidth;
        let maxX = 0;
        let maxY = 0;

        if (tempCtx) {
          tempCtx.drawImage(
            this.img,
            0,
            0,
            this.frameWidth,
            this.frameHeight,
            0,
            0,
            this.frameWidth,
            this.frameHeight
          );
          const imgData = tempCtx.getImageData(0, 0, this.frameWidth, this.frameHeight).data;
          for (let y = 0; y < this.frameHeight; y++) {
            for (let x = 0; x < this.frameWidth; x++) {
              const alpha = imgData[(y * this.frameWidth + x) * 4 + 3];
              if (alpha > 20) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
              }
            }
          }
        }

        if (minX > maxX) {
          minX = 0;
          maxX = this.frameWidth - 1;
          maxY = this.frameHeight - 1;
        }

        const contentCenterX = (minX + maxX) / 2.0;
        const contentBottomY = maxY;
        // Option 3: Preserve exact 1:1 original pixel art size without fractional stretching
        const scale = 1.0;
        const groundY = this.options.groundY ?? 128;

        this.destW = Math.round(this.frameWidth * scale);
        this.destH = Math.round(this.frameHeight * scale);
        this.destX = Math.round(this.options.fixedWidth / 2.0 - contentCenterX * scale);
        this.destY = Math.round(groundY - contentBottomY * scale);
      } else {
        this.canvas.width = this.frameWidth;
        this.canvas.height = this.frameHeight;
        this.destX = 0;
        this.destY = 0;
        this.destW = this.frameWidth;
        this.destH = this.frameHeight;
      }

      this.draw();
      if (this.totalFrames > 1) {
        this.start();
      }
    };
  }

  private draw(): void {
    if (!this.img) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.imageSmoothingEnabled = false;
    const sx = this.currentFrame * this.frameWidth;
    this.ctx.drawImage(
      this.img,
      sx,
      0,
      this.frameWidth,
      this.frameHeight,
      this.destX,
      this.destY,
      this.destW,
      this.destH
    );
  }

  private loop = (time: number) => {
    if (time - this.lastTime >= this.frameDuration) {
      this.lastTime = time;
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.draw();
    }
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  start(): void {
    if (!this.animFrameId && this.totalFrames > 1) {
      this.lastTime = performance.now();
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  }

  stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
