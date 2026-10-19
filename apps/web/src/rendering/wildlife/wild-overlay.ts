import type { WildPokemonEntity } from '../../wildlife/model';
import { getLevelIndicator, type LevelIndicatorOptions } from '../../wildlife/indicators/level-indicator';

export interface OverlayOptions extends LevelIndicatorOptions {
  maxTileDistance?: number; // default: 7 tiles
}

/**
 * Draws overhead level indicator badge above a wild pokemon if within player proximity.
 * Follows Section 5.1 & 5.2 visual specifications.
 */
export function drawWildOverheadIndicator(
  ctx: CanvasRenderingContext2D,
  wp: WildPokemonEntity,
  playerRefLevel: number,
  playerPos: { gx: number; gy: number },
  opts?: OverlayOptions
): void {
  const maxTiles = opts?.maxTileDistance ?? 7;
  const dx = wp.gx - playerPos.gx;
  const dy = wp.gy - playerPos.gy;
  if (dx * dx + dy * dy > maxTiles * maxTiles) {
    return;
  }

  const indicator = getLevelIndicator(wp, playerRefLevel, opts);
  if (indicator.kind === 'none') {
    return;
  }

  const drawY = wp.y + (wp.bobY || 0);
  const cx = Math.round(wp.x + 32);

  // Position badge above sprite head; raise slightly if an emote bubble is active
  const cy = wp.emote && wp.emote.timer > 0 ? Math.round(drawY + 4) : Math.round(drawY + 12);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const text = indicator.text;
  const isUnknown = indicator.kind === 'unknown_red';
  const isApex = wp.role === 'apex';

  // Badge dimensions
  const paddingX = 4;
  const badgeHeight = 12;
  ctx.font = isUnknown ? 'bold 9px monospace, sans-serif' : 'bold 9px sans-serif';
  const textWidth = ctx.measureText(text).width;
  const badgeWidth = Math.max(26, Math.round(textWidth + paddingX * 2));
  const bx = Math.round(cx - badgeWidth / 2);
  const by = Math.round(cy - badgeHeight / 2);

  // Draw pill background
  if (isUnknown) {
    // Pulse animation for ??? red threat
    const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.008);
    ctx.fillStyle = `rgba(185, 28, 28, ${pulse.toFixed(2)})`;
    ctx.strokeStyle = '#fecaca';
  } else if (isApex) {
    ctx.fillStyle = 'rgba(67, 20, 7, 0.9)';
    ctx.strokeStyle = '#f59e0b';
  } else {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
  }

  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, badgeWidth, badgeHeight, 3);
  } else {
    ctx.rect(bx, by, badgeWidth, badgeHeight);
  }
  ctx.fill();
  ctx.stroke();

  // Draw text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isUnknown ? '#ffffff' : isApex ? '#fef08a' : '#f8fafc';
  ctx.fillText(text, cx, cy);

  ctx.restore();
}
