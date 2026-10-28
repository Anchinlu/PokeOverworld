/**
 * Unified NPC Behavior, Movement, Schedule & Emote Controller
 * Shared across Overworld (Village/Town NPCs) and Interior Rooms.
 */

import type { Direction } from '@pokemon/shared-types';
import { getStepFrame } from '../entities/player';
import type {
  NPCEmoteType,
  NPCMovementMode,
  NPCRuntimeState,
  NPCScheduleRule,
  NPCTimeBand,
  NPCWeatherType,
} from './npc-types';

export interface NPCBehaviorConfig {
  id: string;
  gx: number;
  gy: number;
  direction: Direction;
  idleBehavior?: 'stationary' | 'turn_random' | 'turn_cycle';
  movementMode?: NPCMovementMode;
  turnCycle?: Direction[];
  turnIntervalMs?: number;
  wanderRadius?: number;
  patrolPath?: Array<{ gx: number; gy: number }>;
  moveIntervalMs?: number;
  moveSpeedTilesPerSec?: number;
  lookAtPlayerRadius?: number;
  ambientEmotePool?: NPCEmoteType[];
  schedule?: NPCScheduleRule[];
}

export interface NPCWorldContext {
  dtMs: number;
  playerGX: number;
  playerGY: number;
  followerGX?: number;
  followerGY?: number;
  isDialogueActiveWithThisNPC?: boolean;
  timeBand?: NPCTimeBand;
  weather?: NPCWeatherType;
  isTileWalkable?: (targetGX: number, targetGY: number, fromGX: number, fromGY: number) => boolean;
  isTileOccupiedByOtherNPC?: (targetGX: number, targetGY: number, selfId: string) => boolean;
}

const DEFAULT_TURN_CYCLE: Direction[] = [0, 1, 2, 3];

export function createNPCRuntimeState(
  config: Pick<NPCBehaviorConfig, 'gx' | 'gy' | 'direction' | 'id'>,
  tileSize = 32
): NPCRuntimeState {
  // Deterministic staggered initial timers based on NPC id hash
  let hash = 0;
  for (let i = 0; i < config.id.length; i++) {
    hash = (hash * 31 + config.id.charCodeAt(i)) | 0;
  }
  const absHash = Math.abs(hash);

  return {
    gx: config.gx,
    gy: config.gy,
    homeGX: config.gx,
    homeGY: config.gy,
    fromGX: config.gx,
    fromGY: config.gy,
    toGX: config.gx,
    toGY: config.gy,
    x: config.gx * tileSize,
    y: config.gy * tileSize,
    direction: config.direction,
    initialDirection: config.direction,
    isMoving: false,
    stepProgress: 0,
    stepCount: 0,
    frame: 0, // Strictly 0 when standing still
    turnTimerMs: (absHash % 1200),
    turnCycleIndex: 0,
    patrolIndex: 0,
    patrolForward: true,
    moveCooldownMs: 1800 + (absHash % 2200),
    activeEmote: null,
    emoteTimerMs: 0,
    ambientEmoteCooldownMs: 4500 + (absHash % 5000),
    isLookingAtPlayer: false,
    visible: true,
  };
}

export function triggerNPCEmote(
  state: NPCRuntimeState,
  emote: NPCEmoteType,
  durationMs = 2000
): void {
  state.activeEmote = emote;
  state.emoteTimerMs = durationMs;
}

export function resolveActiveScheduleRule(
  schedule: NPCScheduleRule[] | undefined,
  timeBand: NPCTimeBand = 'day',
  weather: NPCWeatherType = 'clear'
): NPCScheduleRule | null {
  if (!schedule || schedule.length === 0) return null;
  for (const rule of schedule) {
    const matchTime = !rule.timeBands || rule.timeBands.length === 0 || rule.timeBands.includes(timeBand);
    const matchWeather = !rule.weather || rule.weather.length === 0 || rule.weather.includes(weather);
    if (matchTime && matchWeather) {
      return rule;
    }
  }
  return null;
}

export function getDirectionToward(
  fromGX: number,
  fromGY: number,
  toGX: number,
  toGY: number,
  fallback: Direction = 0
): Direction {
  const dx = toGX - fromGX;
  const dy = toGY - fromGY;
  if (dx === 0 && dy === 0) return fallback;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 2 : 1;
  }
  return dy > 0 ? 0 : 3;
}

function directionToDelta(dir: Direction): { dx: number; dy: number } {
  if (dir === 0) return { dx: 0, dy: 1 };
  if (dir === 1) return { dx: -1, dy: 0 };
  if (dir === 2) return { dx: 1, dy: 0 };
  return { dx: 0, dy: -1 };
}

/**
 * Updates a single NPC's runtime state for one frame.
 * Guarantees `state.frame = 0` whenever `state.isMoving === false`.
 */
export function updateNPCBehavior(
  config: NPCBehaviorConfig,
  state: NPCRuntimeState,
  ctx: NPCWorldContext,
  tileSize = 32
): void {
  // 1. Evaluate Day/Night & Weather schedule
  const activeRule = resolveActiveScheduleRule(config.schedule, ctx.timeBand, ctx.weather);
  state.visible = activeRule?.visible ?? true;
  if (!state.visible) {
    state.isMoving = false;
    state.frame = 0;
    return;
  }

  // 2. Update active emote timer
  if (state.activeEmote) {
    state.emoteTimerMs -= ctx.dtMs;
    if (state.emoteTimerMs <= 0) {
      state.activeEmote = null;
      state.emoteTimerMs = 0;
    }
  }

  // 3. If currently in dialogue with player, stay still on frame 0
  if (ctx.isDialogueActiveWithThisNPC) {
    if (!state.isMoving) {
      state.frame = 0;
      state.x = state.gx * tileSize;
      state.y = state.gy * tileSize;
      return;
    }
  }

  // 4. Advance ongoing tile-to-tile step if moving
  if (state.isMoving) {
    const speedTilesPerSec = config.moveSpeedTilesPerSec ?? 2.15;
    state.stepProgress += (ctx.dtMs / 1000) * speedTilesPerSec;

    if (state.stepProgress >= 1) {
      state.gx = state.toGX;
      state.gy = state.toGY;
      state.fromGX = state.gx;
      state.fromGY = state.gy;
      state.x = state.gx * tileSize;
      state.y = state.gy * tileSize;
      state.isMoving = false;
      state.stepProgress = 0;
      state.frame = 0; // Reset to standing neutral frame 0
      state.moveCooldownMs = (config.moveIntervalMs ?? 2600) + Math.floor(Math.random() * 1400);
    } else {
      const interpGX = state.fromGX + (state.toGX - state.fromGX) * state.stepProgress;
      const interpGY = state.fromGY + (state.toGY - state.fromGY) * state.stepProgress;
      state.x = interpGX * tileSize;
      state.y = interpGY * tileSize;
      state.frame = getStepFrame(state.stepCount, state.stepProgress);
    }
    return;
  }

  // Always enforce neutral standing frame 0 when stationary
  state.frame = 0;
  state.x = state.gx * tileSize;
  state.y = state.gy * tileSize;

  // 5. Check player proximity for look-at-player & ambient emotes
  const distToPlayer = Math.hypot(ctx.playerGX - state.gx, ctx.playerGY - state.gy);
  const lookRadius = config.lookAtPlayerRadius ?? 2.2;

  if (distToPlayer <= 10) {
    state.ambientEmoteCooldownMs -= ctx.dtMs;
    if (state.ambientEmoteCooldownMs <= 0) {
      state.ambientEmoteCooldownMs = 6500 + Math.floor(Math.random() * 5500);
      const overrideEmote = activeRule?.overrideEmote;
      if (overrideEmote && !state.activeEmote) {
        triggerNPCEmote(state, overrideEmote, 2200);
      } else if (
        config.ambientEmotePool &&
        config.ambientEmotePool.length > 0 &&
        !state.activeEmote &&
        Math.random() < 0.65
      ) {
        const idx = Math.floor(Math.random() * config.ambientEmotePool.length);
        triggerNPCEmote(state, config.ambientEmotePool[idx], 2200);
      }
    }
  }

  // If player is very close (<= lookRadius), turn toward player and pause wandering
  if (distToPlayer > 0 && distToPlayer <= lookRadius) {
    const faceDir = getDirectionToward(state.gx, state.gy, ctx.playerGX, ctx.playerGY, state.direction);
    if (!state.isLookingAtPlayer) {
      state.isLookingAtPlayer = true;
      state.direction = faceDir;
      if (!state.activeEmote && config.ambientEmotePool && config.ambientEmotePool.length > 0) {
        triggerNPCEmote(state, config.ambientEmotePool[0], 1800);
      }
    } else {
      state.direction = faceDir;
    }
    return;
  } else if (state.isLookingAtPlayer) {
    state.isLookingAtPlayer = false;
  }

  // 6. Determine effective movement mode (schedule rule -> movementMode -> idleBehavior)
  const effectiveMode: NPCMovementMode =
    activeRule?.overrideMovementMode ??
    config.movementMode ??
    config.idleBehavior ??
    'stationary';

  // 7. Handle walking modes: wander_box or patrol_path
  if (effectiveMode === 'wander_box' || effectiveMode === 'patrol_path') {
    state.moveCooldownMs -= ctx.dtMs;
    if (state.moveCooldownMs <= 0) {
      const nextStep =
        effectiveMode === 'patrol_path'
          ? pickNextPatrolStep(config, state)
          : pickNextWanderStep(config, state);

      if (nextStep && canNPCStepTo(config.id, state.gx, state.gy, nextStep.gx, nextStep.gy, ctx)) {
        state.fromGX = state.gx;
        state.fromGY = state.gy;
        state.toGX = nextStep.gx;
        state.toGY = nextStep.gy;
        state.direction = nextStep.dir;
        state.isMoving = true;
        state.stepProgress = 0;
        state.stepCount = (state.stepCount + 1) % 1000;
        state.frame = getStepFrame(state.stepCount, 0);
        return;
      } else {
        // Blocked or pausing: reset cooldown and fall through to idle turn behavior
        state.moveCooldownMs = 1500 + Math.floor(Math.random() * 1200);
      }
    }
  }

  // 8. Handle stationary turning modes (also runs between steps when wandering)
  const turnMode = config.idleBehavior ?? (effectiveMode === 'turn_random' ? 'turn_random' : effectiveMode === 'turn_cycle' ? 'turn_cycle' : 'stationary');
  const interval = config.turnIntervalMs ?? 2400;

  if (turnMode === 'turn_cycle') {
    const cycle =
      config.turnCycle && config.turnCycle.length > 0 ? config.turnCycle : DEFAULT_TURN_CYCLE;
    state.turnTimerMs += ctx.dtMs;
    if (state.turnTimerMs >= interval) {
      state.turnTimerMs %= interval;
      state.turnCycleIndex = (state.turnCycleIndex + 1) % cycle.length;
      state.direction = cycle[state.turnCycleIndex];
    }
  } else if (turnMode === 'turn_random') {
    state.turnTimerMs += ctx.dtMs;
    if (state.turnTimerMs >= interval) {
      state.turnTimerMs %= interval;
      const dirs: Direction[] = [0, 1, 2, 3];
      state.direction = dirs[Math.floor(Math.random() * dirs.length)];
    }
  }
}

function canNPCStepTo(
  selfId: string,
  fromGX: number,
  fromGY: number,
  targetGX: number,
  targetGY: number,
  ctx: NPCWorldContext
): boolean {
  // Never step onto the player or follower
  if (targetGX === Math.round(ctx.playerGX) && targetGY === Math.round(ctx.playerGY)) {
    return false;
  }
  if (
    ctx.followerGX !== undefined &&
    ctx.followerGY !== undefined &&
    targetGX === Math.round(ctx.followerGX) &&
    targetGY === Math.round(ctx.followerGY)
  ) {
    return false;
  }
  if (ctx.isTileOccupiedByOtherNPC && ctx.isTileOccupiedByOtherNPC(targetGX, targetGY, selfId)) {
    return false;
  }
  if (ctx.isTileWalkable && !ctx.isTileWalkable(targetGX, targetGY, fromGX, fromGY)) {
    return false;
  }
  return true;
}

function pickNextWanderStep(
  config: NPCBehaviorConfig,
  state: NPCRuntimeState
): { gx: number; gy: number; dir: Direction } | null {
  const radius = config.wanderRadius ?? 2;
  const candidateDirs: Direction[] = [0, 1, 2, 3];
  // Shuffle candidate directions
  for (let i = candidateDirs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = candidateDirs[i];
    candidateDirs[i] = candidateDirs[j];
    candidateDirs[j] = tmp;
  }

  for (const dir of candidateDirs) {
    const { dx, dy } = directionToDelta(dir);
    const nextGX = state.gx + dx;
    const nextGY = state.gy + dy;
    if (
      Math.abs(nextGX - state.homeGX) <= radius &&
      Math.abs(nextGY - state.homeGY) <= radius
    ) {
      return { gx: nextGX, gy: nextGY, dir };
    }
  }
  return null;
}

function pickNextPatrolStep(
  config: NPCBehaviorConfig,
  state: NPCRuntimeState
): { gx: number; gy: number; dir: Direction } | null {
  const path = config.patrolPath;
  if (!path || path.length === 0) {
    return pickNextWanderStep(config, state);
  }

  let targetWaypoint = path[state.patrolIndex];
  if (!targetWaypoint || (state.gx === targetWaypoint.gx && state.gy === targetWaypoint.gy)) {
    if (state.patrolForward) {
      if (state.patrolIndex + 1 < path.length) {
        state.patrolIndex++;
      } else if (path.length > 1) {
        state.patrolForward = false;
        state.patrolIndex--;
      }
    } else {
      if (state.patrolIndex - 1 >= 0) {
        state.patrolIndex--;
      } else if (path.length > 1) {
        state.patrolForward = true;
        state.patrolIndex++;
      }
    }
    targetWaypoint = path[state.patrolIndex];
  }

  if (!targetWaypoint) return null;
  const dx = targetWaypoint.gx - state.gx;
  const dy = targetWaypoint.gy - state.gy;
  if (dx === 0 && dy === 0) return null;

  let dir: Direction;
  if (Math.abs(dx) >= Math.abs(dy)) {
    dir = dx > 0 ? 2 : 1;
  } else {
    dir = dy > 0 ? 0 : 3;
  }
  const delta = directionToDelta(dir);
  return {
    gx: state.gx + delta.dx,
    gy: state.gy + delta.dy,
    dir,
  };
}

const EMOTE_LABELS: Record<NPCEmoteType, { symbol: string; color: string }> = {
  exclamation: { symbol: '!', color: '#ef4444' },
  exclamation_double: { symbol: '!!', color: '#ef4444' },
  question: { symbol: '?', color: '#3b82f6' },
  question_exclamation: { symbol: '!?', color: '#3b82f6' },
  music: { symbol: '♪', color: '#10b981' },
  heart: { symbol: '♥', color: '#f43f5e' },
  sweat: { symbol: '💧', color: '#0ea5e9' },
  sparkle: { symbol: '✦', color: '#eab308' },
  chat: { symbol: '•••', color: '#475569' },
  sleep: { symbol: 'Zzz', color: '#6366f1' },
  angry: { symbol: '💢', color: '#dc2626' },
  happy: { symbol: '^_^', color: '#16a34a' },
  poison: { symbol: '☠', color: '#9333ea' },
  dizzy: { symbol: '@@', color: '#8b5cf6' },
};

let emoteSheetImage: HTMLImageElement | null = null;
let emoteSheetLoaded = false;

/**
 * Returns the cached authentic Pokémon GBA/NDS emote spritesheet image if loaded.
 */
export function getEmoteSheetImage(): HTMLImageElement | null {
  if (typeof document === 'undefined') return null;
  if (!emoteSheetImage) {
    emoteSheetImage = new Image();
    emoteSheetImage.src = '/assets/ui/emotes.png';
    emoteSheetImage.onload = () => {
      emoteSheetLoaded = true;
    };
  }
  return emoteSheetLoaded && emoteSheetImage.complete && emoteSheetImage.naturalWidth > 0
    ? emoteSheetImage
    : null;
}

interface EmoteSpriteCoord {
  row: number;
  col: number;
}

/**
 * Resolves the spritesheet row and column for the given emote and elapsed time.
 */
function resolveEmoteSpriteFrame(emote: NPCEmoteType, elapsedMs: number): EmoteSpriteCoord | null {
  switch (emote) {
    case 'exclamation': {
      if (elapsedMs < 70) return { row: 1, col: 1 };
      if (elapsedMs < 140) return { row: 1, col: 2 };
      return { row: 1, col: 3 };
    }
    case 'exclamation_double': {
      if (elapsedMs < 70) return { row: 1, col: 4 };
      if (elapsedMs < 140) return { row: 1, col: 5 };
      return { row: 1, col: 6 };
    }
    case 'question': {
      if (elapsedMs < 70) return { row: 2, col: 1 };
      if (elapsedMs < 140) return { row: 2, col: 2 };
      return { row: 2, col: 3 };
    }
    case 'question_exclamation': {
      if (elapsedMs < 70) return { row: 2, col: 4 };
      if (elapsedMs < 140) return { row: 2, col: 5 };
      return { row: 2, col: 6 };
    }
    case 'heart': {
      const cols = [1, 2, 3, 4, 5, 6];
      const idx = Math.floor(elapsedMs / 110) % cols.length;
      return { row: 3, col: cols[idx] };
    }
    case 'music': {
      const seq = [1, 2, 3, 2];
      const idx = Math.floor(elapsedMs / 140) % seq.length;
      return { row: 4, col: seq[idx] };
    }
    case 'chat': {
      const cols = [3, 4, 5, 6];
      const idx = Math.floor(elapsedMs / 150) % cols.length;
      return { row: 0, col: cols[idx] };
    }
    case 'sweat': {
      const cols = [10, 11, 12];
      const idx = Math.floor(elapsedMs / 180) % cols.length;
      return { row: 0, col: cols[idx] };
    }
    case 'angry': {
      const cols = [7, 8, 9];
      const idx = Math.floor(elapsedMs / 150) % cols.length;
      return { row: 1, col: cols[idx] };
    }
    case 'happy': {
      const cols = [7, 8, 9];
      const idx = Math.floor(elapsedMs / 180) % cols.length;
      return { row: 4, col: cols[idx] };
    }
    case 'poison': {
      const cols = [1, 2, 3];
      const idx = Math.floor(elapsedMs / 160) % cols.length;
      return { row: 5, col: cols[idx] };
    }
    case 'dizzy': {
      const cols = [7, 8, 9];
      const idx = Math.floor(elapsedMs / 160) % cols.length;
      return { row: 5, col: cols[idx] };
    }
    default:
      return null;
  }
}

/**
 * Fallback vector procedural emote bubble for headless tests or unmapped emotes.
 */
function drawProceduralEmoteBubble(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  headTopY: number,
  emote: NPCEmoteType,
  emoteTimerMs: number
): void {
  const meta = EMOTE_LABELS[emote];
  if (!meta) return;

  const bounce = Math.sin(emoteTimerMs * 0.012) * 2;
  const bubbleW = 22;
  const bubbleH = 18;
  const bx = Math.round(centerX - bubbleW / 2);
  const by = Math.round(headTopY - bubbleH - 4 + bounce);

  ctx.save();

  // Outer dark border
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(bx - 1, by - 1, bubbleW + 2, bubbleH + 2, 5);
  ctx.fill();

  // Inner white speech bubble
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(bx, by, bubbleW, bubbleH, 4);
  ctx.fill();

  // Pointer triangle at bottom center
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(centerX - 4, by + bubbleH + 1);
  ctx.lineTo(centerX + 4, by + bubbleH + 1);
  ctx.lineTo(centerX, by + bubbleH + 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(centerX - 3, by + bubbleH);
  ctx.lineTo(centerX + 3, by + bubbleH);
  ctx.lineTo(centerX, by + bubbleH + 3.5);
  ctx.closePath();
  ctx.fill();

  // Symbol text
  ctx.fillStyle = meta.color;
  ctx.font = 'bold 11px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(meta.symbol, centerX, by + bubbleH / 2 + 0.5);

  ctx.restore();
}

/**
 * Draws an animated pixel-art style emote bubble above an NPC's head.
 * Uses authentic Pokémon GBA/NDS spritesheet when available, falling back gracefully
 * to procedural canvas vector rendering when running headless or while loading.
 */
export function drawNPCEmoteBubble(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  headTopY: number,
  emote: NPCEmoteType | null | undefined,
  emoteTimerMs = 1000
): void {
  if (!emote) return;

  const sheet = getEmoteSheetImage();
  const elapsedMs = Math.max(0, 1000 - emoteTimerMs);
  const frame = resolveEmoteSpriteFrame(emote, elapsedMs);

  if (sheet && frame) {
    const srcX = frame.col * 33 + 1;
    const srcY = frame.row * 33 + 5;
    const srcW = 32;
    const srcH = 28;

    // Subtle gentle float bounce
    const bounce = Math.sin(emoteTimerMs * 0.012) * 1.5;
    // Align bubble bottom center pointer tip (center at relative x = 16) directly above head
    const destX = Math.round(centerX - 16);
    const destY = Math.round(headTopY - 28 + bounce);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, srcX, srcY, srcW, srcH, destX, destY, srcW, srcH);
    ctx.restore();
    return;
  }

  // Graceful procedural fallback
  drawProceduralEmoteBubble(ctx, centerX, headTopY, emote, emoteTimerMs);
}
