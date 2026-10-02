/**
 * 2D Camera system for seamless world tracking.
 * Locks zoom at 1.0x to preserve retro Pokémon GBA pixel aesthetics.
 */

export interface CameraTarget {
  x: number;
  y: number;
}

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class Camera {
  public x = 0;
  public y = 0;
  public readonly zoom = 1.0;

  private smoothFactor = 0.12;

  constructor(initialX = 0, initialY = 0) {
    this.x = initialX;
    this.y = initialY;
  }

  /**
   * Instantly teleport camera center to target position.
   */
  public snapTo(target: CameraTarget): void {
    this.x = target.x + 32;
    this.y = target.y + 48;
  }

  /**
   * Smoothly interpolates camera toward target with delta-time scaling.
   */
  public update(target: CameraTarget, dtScale = 1.0): void {
    const targetCenterX = target.x + 32;
    const targetCenterY = target.y + 48;
    const factor = Math.min(1.0, this.smoothFactor * dtScale);

    this.x += (targetCenterX - this.x) * factor;
    this.y += (targetCenterY - this.y) * factor;
  }

  /**
   * Calculates the current visible bounding box in world pixel coordinates (used for chunk/entity culling).
   */
  public getVisibleBounds(canvasWidth: number, canvasHeight: number, margin = 64): ViewportBounds {
    const viewW = canvasWidth / this.zoom;
    const viewH = canvasHeight / this.zoom;
    const left = Math.round(this.x - viewW / 2);
    const top = Math.round(this.y - viewH / 2);

    return {
      minX: left - margin,
      maxX: left + viewW + margin,
      minY: top - margin,
      maxY: top + viewH + margin,
    };
  }

  /**
   * Applies camera translation and zoom matrix to 2D Canvas context.
   */
  public applyTransform(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const viewW = canvasWidth / this.zoom;
    const viewH = canvasHeight / this.zoom;

    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-Math.round(this.x - viewW / 2), -Math.round(this.y - viewH / 2));
  }

  /**
   * Converts a screen pixel coordinate (e.g. mouse click) into world pixel coordinates.
   */
  public screenToWorld(
    screenX: number,
    screenY: number,
    canvasWidth: number,
    canvasHeight: number
  ): { worldX: number; worldY: number } {
    const viewW = canvasWidth / this.zoom;
    const viewH = canvasHeight / this.zoom;
    const cameraLeft = Math.round(this.x - viewW / 2);
    const cameraTop = Math.round(this.y - viewH / 2);

    return {
      worldX: cameraLeft + screenX / this.zoom,
      worldY: cameraTop + screenY / this.zoom,
    };
  }
}
