import type { AnimationFocus } from './types';

export interface Point2D {
  x: number;
  y: number;
}

export interface BattlerGeometry {
  baseX: number;
  baseY: number;
  spriteHeight: number;
}

/** Standard player battler geometry (base anchor at 130, 280; sprite height 130; center at 130, 215) */
export const DEFAULT_PLAYER_GEOMETRY: BattlerGeometry = {
  baseX: 130,
  baseY: 280,
  spriteHeight: 130,
};

/** Standard enemy battler geometry (base anchor at 380, 175; sprite height 120; center at 380, 115) */
export const DEFAULT_ENEMY_GEOMETRY: BattlerGeometry = {
  baseX: 380,
  baseY: 175,
  spriteHeight: 120,
};

/** Calculates the vertical center point of a battler sprite from its geometry */
export function getBattlerCenter(geom: BattlerGeometry): Point2D {
  return {
    x: geom.baseX,
    y: Math.round(geom.baseY - geom.spriteHeight / 2),
  };
}

export class CoordinateTransformer {
  /**
   * Standard Pokémon Essentials virtual reference positions on the 512×384 canvas.
   * User (player) focal point is bottom-left (128, 224); Target (enemy) is top-right (384, 96).
   * All cel x/y coordinates in source rxdata/JSON are authored relative to these anchors.
   */
  public static readonly SRC_USER: Point2D = { x: 128, y: 224 };
  public static readonly SRC_TARGET: Point2D = { x: 384, y: 96 };
  public static readonly SRC_WIDTH = 512;
  public static readonly SRC_HEIGHT = 384;
  public static readonly DEFAULT_CANVAS_WIDTH = 512;
  public static readonly DEFAULT_CANVAS_HEIGHT = 288;

  /**
   * Linearly maps a point (px, py) from the virtual source line (src1→src2)
   * to actual canvas coordinates using the destination line (dst1→dst2).
   */
  public static transformPoint(
    src1: Point2D,
    src2: Point2D,
    dst1: Point2D,
    dst2: Point2D,
    px: number,
    py: number
  ): Point2D {
    const srcDx = src2.x - src1.x;
    const srcDy = src2.y - src1.y;

    const tx = srcDx === 0 ? 0 : (px - src1.x) / srcDx;
    const ty = srcDy === 0 ? 0 : (py - src1.y) / srcDy;

    const dstDx = dst2.x - dst1.x;
    const dstDy = dst2.y - dst1.y;

    return {
      x: dst1.x + tx * dstDx,
      y: dst1.y + ty * dstDy,
    };
  }

  /**
   * Calculates actual canvas (x, y) for an animation cel based on its focus mode:
   *
   *   focus='user'   → Anchored to user battler. Offset: (celX - SRC_USER.x, celY - SRC_USER.y)
   *   focus='target' → Anchored to target battler. Offset: (celX - SRC_TARGET.x, celY - SRC_TARGET.y)
   *   focus='both'   → Trajectory interpolating between user and target along the virtual arc
   *   focus='screen' → Absolute viewport coordinates scaled from 512×384 virtual space
   */
  public static resolveCelPosition(
    celX: number,
    celY: number,
    focus: AnimationFocus,
    userPos: Point2D,
    targetPos: Point2D,
    canvasWidth = CoordinateTransformer.DEFAULT_CANVAS_WIDTH,
    canvasHeight = CoordinateTransformer.DEFAULT_CANVAS_HEIGHT,
    _isEnemy = false,
    selfTarget = false
  ): Point2D {
    // A few source timelines (notably Swords Dance and Bulk Up) were authored
    // with target-focused cels even though the move targets its user. Resolve
    // only that focus against the user at runtime; projectile trajectories and
    // shared animation definitions remain unchanged.
    if (selfTarget && focus === 'target') {
      // Keep the source cel's target-relative offset, but attach its anchor
      // to the acting battler. Merely changing the focus label would use the
      // user source anchor (128,224) and shift the whole effect by 256/-128.
      return {
        x: userPos.x + (celX - this.SRC_TARGET.x),
        y: userPos.y + (celY - this.SRC_TARGET.y),
      };
    }

    switch (focus) {
      case 'user': {
        return {
          x: userPos.x + (celX - this.SRC_USER.x),
          y: userPos.y + (celY - this.SRC_USER.y),
        };
      }
      case 'target': {
        return {
          x: targetPos.x + (celX - this.SRC_TARGET.x),
          y: targetPos.y + (celY - this.SRC_TARGET.y),
        };
      }
      case 'both': {
        // Some imported Essentials cels omit both coordinates. The importer
        // represents those missing values as 0,0; treating that pair as a
        // literal source point extrapolates the cel into the upper-left
        // corner. In the source editor, an omitted both-focus cel is an
        // effect attached to the acting battler, so anchor only this default
        // pair at the user and preserve all authored coordinates verbatim.
        if (celX === 0 && celY === 0) return { ...userPos };
        return this.transformPoint(this.SRC_USER, this.SRC_TARGET, userPos, targetPos, celX, celY);
      }
      case 'screen':
      default: {
        const scaleX = canvasWidth / this.SRC_WIDTH;
        const scaleY = canvasHeight / this.SRC_HEIGHT;
        return {
          x: celX * scaleX,
          y: celY * scaleY,
        };
      }
    }
  }
}
