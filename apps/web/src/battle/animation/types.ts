/**
 * Shared Battle Animation Types for Timeline & Cel-based Engine
 */

export type AnimationFocus = 'user' | 'target' | 'both' | 'screen';

export type AnimationBlendMode = 'normal' | 'additive' | 'multiply';

export interface AnimationCel {
  /** Optional per-cel spritesheet override for layered effects. */
  graphic?: string;
  /** Flip this cel only when the Enemy is the attacker. */
  mirrorOnEnemy?: boolean;
  /** Mirror authored screen-space X coordinates when the Enemy attacks. */
  mirrorPositionOnEnemy?: boolean;
  pattern: number;
  x: number;
  y: number;
  zoomX: number;
  zoomY: number;
  angle: number;
  mirror: boolean;
  opacity: number;
  blendMode: AnimationBlendMode;
  visible: boolean;
  priority: number;
  focus: AnimationFocus;
  /** Preserve the authored Y offset for a curved user-to-target trajectory. */
  curve?: 'arc';
  color?: [number, number, number, number];
  flash?: [number, number, number, number];
}

export interface AnimationFrame {
  cels: AnimationCel[];
}

export type AnimationTimingType = 'sound' | 'flash' | 'background' | 'foreground';

export interface AnimationTimingEvent {
  frame: number;
  type: AnimationTimingType;
  payload: Record<string, string | number | boolean | number[]>;
}

export interface BattleAnimationDefinition {
  id: string;
  name: string;
  graphic: string;
  hue: number;
  position: number;
  fps: number;
  frames: AnimationFrame[];
  timings: AnimationTimingEvent[];
  sourcePack?: string;
  sourceAnimationId?: number;
}

export interface AnimationAtlasEntry {
  assetKey: string;
  file: string;
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: number;
  maxPattern: number;
  missingOnDisk?: boolean;
}

export interface AnimationViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BattleAnimationRequest {
  moveId: string;
  userSide: 'player' | 'enemy';
  userPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  /**
   * The move affects its user rather than the opposing battler.
   * Some imported Essentials timelines encode self-buff cels with
   * focus="target", so this flag lets the renderer resolve that focus
   * against the acting battler without mutating shared animation data.
   */
  selfTarget?: boolean;
  moveType?: string;
  moveCategory?: 'physical' | 'special' | 'status';
  hitNum?: number;
  viewport?: AnimationViewport;
  onHit?: () => void;
  onComplete?: () => void;
}

export interface BattleAnimationInstance {
  id: string;
  definition: BattleAnimationDefinition;
  request: BattleAnimationRequest;
  isPlaying: boolean;
  currentFrame: number;
  elapsedMs: number;
  totalDurationMs: number;
}
