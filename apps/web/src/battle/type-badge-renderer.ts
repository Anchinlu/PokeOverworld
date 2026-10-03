import { TYPE_ICO_INDICES } from './type-chart';

export class TypeBadgeRenderer {
  private static img: HTMLImageElement | null = null;
  private static isLoaded = false;
  private static pendingCallbacks: (() => void)[] = [];

  public static init(): void {
    if (!TypeBadgeRenderer.img) {
      const img = new Image();
      img.src = '/assets/types_ico.png';
      img.onload = () => {
        TypeBadgeRenderer.isLoaded = true;
        TypeBadgeRenderer.pendingCallbacks.forEach((cb) => cb());
        TypeBadgeRenderer.pendingCallbacks = [];
      };
      TypeBadgeRenderer.img = img;
    }
  }

  /**
   * Draws a 24x28 type icon onto target Canvas 2D context at (dx, dy)
   * with optional scale.
   */
  public static drawTypeIcon(
    ctx: CanvasRenderingContext2D,
    typeName: string,
    dx: number,
    dy: number,
    scale = 1
  ): void {
    TypeBadgeRenderer.init();
    const index = TYPE_ICO_INDICES[typeName] ?? TYPE_ICO_INDICES['Normal'];
    const sw = 24;
    const sh = 28;
    const sx = 0;
    const sy = index * 28;

    if (TypeBadgeRenderer.isLoaded && TypeBadgeRenderer.img) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(TypeBadgeRenderer.img, sx, sy, sw, sh, dx, dy, sw * scale, sh * scale);
    } else {
      TypeBadgeRenderer.pendingCallbacks.push(() => {
        if (TypeBadgeRenderer.img) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(TypeBadgeRenderer.img, sx, sy, sw, sh, dx, dy, sw * scale, sh * scale);
        }
      });
    }
  }

  /**
   * Creates an HTMLCanvasElement rendering the type icon badge.
   */
  public static createTypeBadgeCanvas(typeName: string, scale = 1): HTMLCanvasElement {
    TypeBadgeRenderer.init();
    const canvas = document.createElement('canvas');
    canvas.width = 24 * scale;
    canvas.height = 28 * scale;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      TypeBadgeRenderer.drawTypeIcon(ctx, typeName, 0, 0, scale);
    }
    return canvas;
  }
}
