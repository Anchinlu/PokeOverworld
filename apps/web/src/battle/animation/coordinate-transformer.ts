import type { AnimationFocus, AnimationViewport } from './types';

export interface Point2D {
  x: number;
  y: number;
}

export interface BattlerGeometry {
  baseX: number;
  baseY: number;
  spriteHeight: number;
}

export { type AnimationViewport };

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

/** Standard battle animation viewport matching battle screen render bounds */
export const DEFAULT_ANIMATION_VIEWPORT: AnimationViewport = {
  x: 0,
  y: 0,
  width: 512,
  height: 288,
};

/** Calculates the vertical center point of a battler sprite from its geometry */
export function getBattlerCenter(geom: BattlerGeometry): Point2D {
  return {
    x: geom.baseX,
    y: Math.round(geom.baseY - geom.spriteHeight / 2),
  };
}

/**
 * Determines whether flight direction between actual battlers is reversed
 * relative to the source authored trajectory (srcUser → srcTarget).
 *
 * Rules:
 * 1. Source direction is true if sourceUser.x < sourceTarget.x (left-to-right).
 * 2. Actual direction is true if actualUser.x < actualTarget.x.
 * 3. Returns true if directions differ (flight path is reversed, e.g. enemy attacking player).
 */
export function isDirectionReversed(
  sourceUser: Point2D,
  sourceTarget: Point2D,
  actualUser: Point2D,
  actualTarget: Point2D
): boolean {
  const sourceDir = sourceUser.x < sourceTarget.x;
  const actualDir = actualUser.x < actualTarget.x;
  return sourceDir !== actualDir;
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
  public static readonly DEFAULT_VIEWPORT: AnimationViewport = DEFAULT_ANIMATION_VIEWPORT;

  /**
   * Determines if flight trajectory is reversed between actual battlers.
   */
  public static isDirectionReversed(
    sourceUser: Point2D,
    sourceTarget: Point2D,
    actualUser: Point2D,
    actualTarget: Point2D
  ): boolean {
    return isDirectionReversed(sourceUser, sourceTarget, actualUser, actualTarget);
  }

  /**
   * Linearly maps a point (px, py) from the virtual source line (src1→src2)
   * to actual canvas coordinates using progress along the destination line (dst1→dst2).
   *
   * In Essentials:
   * Source progress is derived along X (px - src1.x) / sourceDx.
   * Both destination X and Y interpolate along dst1→dst2 via this progress.
   */
  public static transformPoint(
    src1: Point2D,
    src2: Point2D,
    dst1: Point2D,
    dst2: Point2D,
    px: number,
    py?: number,
    preserveCurve = false
  ): Point2D {
    const sourceDx = src2.x - src1.x;
    const progress = sourceDx === 0 ? 0 : (px - src1.x) / sourceDx;
    const linearSourceY = src1.y + progress * (src2.y - src1.y);
    const curveOffset = preserveCurve && py !== undefined ? py - linearSourceY : 0;

    return {
      x: dst1.x + progress * (dst2.x - dst1.x),
      y: dst1.y + progress * (dst2.y - dst1.y) + curveOffset,
    };
  }

  /**
   * Calculates actual canvas (x, y) for an animation cel based on its focus mode:
   *
   *   focus='user'   → Anchored to user battler. Offset: (celX - SRC_USER.x, celY - SRC_USER.y)
   *   focus='target' → Anchored to target battler. Offset: (celX - SRC_TARGET.x, celY - SRC_TARGET.y)
   *   focus='both'   → Trajectory interpolating between user and target along the virtual flight line
   *   focus='screen' → Scaled from 512×384 virtual space into battle viewport
   */
  public static resolveCelPosition(
    celX: number,
    celY: number,
    focus: AnimationFocus,
    userPos: Point2D,
    targetPos: Point2D,
    viewportOrWidth: AnimationViewport | number = DEFAULT_ANIMATION_VIEWPORT,
    canvasHeightOrEnemy?: number | boolean,
    isEnemyOrSelfTarget = false,
    selfTargetParam = false,
    preserveCurve = false
  ): Point2D {
    let viewport: AnimationViewport;
    let selfTarget: boolean;

    if (typeof viewportOrWidth === 'object' && viewportOrWidth !== null) {
      viewport = viewportOrWidth;
      selfTarget =
        selfTargetParam || (typeof isEnemyOrSelfTarget === 'boolean' && isEnemyOrSelfTarget);
    } else {
      const width =
        typeof viewportOrWidth === 'number' ? viewportOrWidth : this.DEFAULT_CANVAS_WIDTH;
      const height =
        typeof canvasHeightOrEnemy === 'number' ? canvasHeightOrEnemy : this.DEFAULT_CANVAS_HEIGHT;
      viewport = { x: 0, y: 0, width, height };
      selfTarget = selfTargetParam;
    }

    // A few source timelines (notably Swords Dance and Bulk Up) were authored
    // with target-focused cels even though the move targets its user. Resolve
    // only that focus against the user at runtime; projectile trajectories and
    // shared animation definitions remain unchanged.
    if (selfTarget && focus === 'target') {
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
        // Some imported Essentials cels omit both coordinates (0, 0).
        // In the source editor, an omitted both-focus cel is an effect attached
        // to the acting battler, so anchor only this default pair at the user.
        if (celX === 0 && celY === 0) return { ...userPos };
        return this.transformPoint(
          this.SRC_USER,
          this.SRC_TARGET,
          userPos,
          targetPos,
          celX,
          celY,
          preserveCurve
        );
      }
      case 'screen':
      default: {
        const scaleX = viewport.width / this.SRC_WIDTH;
        const scaleY = viewport.height / this.SRC_HEIGHT;
        return {
          x: viewport.x + celX * scaleX,
          y: viewport.y + celY * scaleY,
        };
      }
    }
  }
}
