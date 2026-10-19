import type { AmbientLightProfile } from '@pokemon/shared-types';

/**
 * AmbientOverlayRenderer
 * Renders a single screen-covering ambient lighting overlay layer across the canvas.
 *
 * Rules:
 * - Covers the entire canvas in a single draw call.
 * - Does not tint individual tiles or entities.
 * - Skips rendering when alpha <= 0.001 to maximize rendering budget.
 */
export class AmbientOverlayRenderer {
  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    profile?: AmbientLightProfile
  ): void {
    if (!profile || profile.alpha <= 0.001) {
      return;
    }

    ctx.save();
    if (profile.blendMode && profile.blendMode !== 'source-over') {
      ctx.globalCompositeOperation = profile.blendMode;
    }
    ctx.fillStyle = profile.color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
