import type { AnimationCel } from './types';
import { ANIMATION_ASSETS } from './animation-assets';

export interface CelRenderPosition {
  x: number;
  y: number;
}

export class CelRenderer {
  /**
   * Renders an individual AnimationCel to the canvas context.
   */
  public static renderCel(
    ctx: CanvasRenderingContext2D,
    cel: AnimationCel,
    canvasX: number,
    canvasY: number,
    graphicName: string,
    isEnemy = false,
    canvasWidth = 512,
    canvasHeight = 288
  ): void {
    if (!cel.visible || cel.opacity <= 0 || cel.pattern < 0) {
      return;
    }

    const img = ANIMATION_ASSETS.getImage(graphicName);
    if (!img || !img.complete || img.naturalWidth === 0) {
      return;
    }

    const atlas = ANIMATION_ASSETS.getAtlas(graphicName);
    const cellWidth = atlas ? atlas.cellWidth : 192;
    const cellHeight = atlas ? atlas.cellHeight : 192;
    const columns = atlas ? atlas.columns : Math.max(1, Math.floor(img.naturalWidth / cellWidth));

    const pattern = cel.pattern;
    const col = pattern % columns;
    const row = Math.floor(pattern / columns);
    const srcX = col * cellWidth;
    const srcY = row * cellHeight;

    // Check bounds
    if (srcX + cellWidth > img.naturalWidth || srcY + cellHeight > img.naturalHeight) {
      return;
    }

    ctx.save();

    // 1. Position
    const safePosition = this.clampPositionToCanvas(
      cel,
      canvasX,
      canvasY,
      cellWidth,
      cellHeight,
      canvasWidth,
      canvasHeight
    );
    ctx.translate(safePosition.x, safePosition.y);

    // 2. Rotation (cel angle is in degrees)
    if (cel.angle !== 0) {
      const rot = (cel.angle * Math.PI) / 180;
      ctx.rotate(rot);
    }

    // 3. Mirror & Scale
    let scaleX = cel.zoomX / 100;
    const scaleY = cel.zoomY / 100;
    const shouldMirror = cel.focus === 'both' && isEnemy ? !cel.mirror : cel.mirror;
    if (shouldMirror) {
      scaleX = -scaleX;
    }
    ctx.scale(scaleX, scaleY);

    // 4. Opacity & Blend Mode
    ctx.globalAlpha = Math.max(0, Math.min(1, cel.opacity / 255));
    if (cel.blendMode === 'additive') {
      ctx.globalCompositeOperation = 'lighter';
    } else if (cel.blendMode === 'multiply') {
      ctx.globalCompositeOperation = 'multiply';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    // 5. Draw image centered on (canvasX, canvasY)
    const halfW = cellWidth / 2;
    const halfH = cellHeight / 2;
    ctx.drawImage(img, srcX, srcY, cellWidth, cellHeight, -halfW, -halfH, cellWidth, cellHeight);

    // 6. Flash effect overlay if defined
    if (cel.flash && cel.flash[3] > 0) {
      const [r, g, b, a] = cel.flash;
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, a / 255)})`;
      ctx.fillRect(-halfW, -halfH, cellWidth, cellHeight);
    }

    ctx.restore();
  }

  /**
   * Keeps a cel's visible bounds inside the battle viewport.
   *
   * Imported Essentials timelines can legitimately place a cel at x/y=0 or
   * slightly outside the virtual stage. Our canvas is smaller than the
   * source stage, so drawing those coordinates directly would visibly cut
   * the effect at the top or left edge. The position is clamped using the
   * scaled, rotated cell extent; the animation's source data is untouched.
   */
  public static clampPositionToCanvas(
    cel: AnimationCel,
    canvasX: number,
    canvasY: number,
    cellWidth: number,
    cellHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ): CelRenderPosition {
    const scaleX = Math.abs(cel.zoomX / 100);
    const scaleY = Math.abs(cel.zoomY / 100);
    const halfW = (cellWidth * scaleX) / 2;
    const halfH = (cellHeight * scaleY) / 2;
    const angle = (Math.abs(cel.angle) * Math.PI) / 180;
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const extentX = halfW * cos + halfH * sin;
    const extentY = halfW * sin + halfH * cos;

    const x =
      extentX * 2 >= canvasWidth
        ? canvasWidth / 2
        : Math.max(extentX, Math.min(canvasWidth - extentX, canvasX));
    const y =
      extentY * 2 >= canvasHeight
        ? canvasHeight / 2
        : Math.max(extentY, Math.min(canvasHeight - extentY, canvasY));

    return { x, y };
  }
}
