import type { BattleMove, PokemonType } from './types';
import rawMoveAnimationsDb from '@pokemon/game-data/move-animations-db.json';

export interface MoveVfxDef {
  /** Relative path to animation sprite sheet (192x192 cells) */
  spriteUrl: string;
  cellWidth: number;
  cellHeight: number;
  columns?: number;
  totalFrames: number;
  ticksPerFrame: number;
  target: 'defender' | 'attacker' | 'projectile';
  scale?: number;
  blendMode?: GlobalCompositeOperation;
  soundEffect?: string;
  screenFlash?: { color: string; durationTicks: number };
  screenShake?: { amp: number; durationTicks: number };
  yOffset?: number;
}

export interface ActiveMoveVfxState {
  image: HTMLImageElement;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  totalFrames: number;
  currentFrame: number;
  frameTick: number;
  ticksPerFrame: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  isProjectile: boolean;
  scale: number;
  blendMode: GlobalCompositeOperation;
  onImpact?: () => void;
  onComplete?: () => void;
  impactTriggered?: boolean;
}

/** Cache for preloaded animation sprite sheet images */
class MoveVfxAssetCache {
  private cache = new Map<string, HTMLImageElement>();

  public getImage(src: string): HTMLImageElement {
    let img = this.cache.get(src);
    if (!img) {
      if (typeof Image !== 'undefined') {
        img = new Image();
      } else {
        img = { src: '', complete: true, width: 960, height: 384 } as unknown as HTMLImageElement;
      }
      img.src = src;
      this.cache.set(src, img);
    }
    return img;
  }
}

export const moveVfxCache = new MoveVfxAssetCache();

/** Dedicated move animation definitions */
export const MOVE_VFX_REGISTRY: Record<string, MoveVfxDef> = {
  // --- 1. Electric Moves ---
  thunderbolt: {
    spriteUrl: 'Graphics/Animations/017-Thunder01.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 6,
    ticksPerFrame: 6,
    target: 'defender',
    blendMode: 'lighter',
    scale: 1.15,
    screenFlash: { color: 'rgba(254, 240, 138, 0.45)', durationTicks: 14 },
    screenShake: { amp: 5, durationTicks: 16 },
  },
  thunder_shock: {
    spriteUrl: 'Graphics/Animations/electric1.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'defender',
    blendMode: 'lighter',
    scale: 1.0,
    screenFlash: { color: 'rgba(254, 240, 138, 0.3)', durationTicks: 12 },
    screenShake: { amp: 3, durationTicks: 12 },
  },
  thunder: {
    spriteUrl: 'Graphics/Animations/Trovao.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 6,
    target: 'defender',
    blendMode: 'lighter',
    scale: 1.3,
    screenFlash: { color: 'rgba(255, 255, 255, 0.65)', durationTicks: 18 },
    screenShake: { amp: 7, durationTicks: 20 },
  },
  spark: {
    spriteUrl: 'Graphics/Animations/electric1.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'defender',
    blendMode: 'lighter',
    scale: 1.0,
    screenFlash: { color: 'rgba(254, 240, 138, 0.3)', durationTicks: 10 },
    screenShake: { amp: 3, durationTicks: 10 },
  },
  electro_ball: {
    spriteUrl: 'Graphics/Animations/PRAS- Electro Ball.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'projectile',
    blendMode: 'lighter',
    scale: 1.1,
    screenFlash: { color: 'rgba(254, 240, 138, 0.35)', durationTicks: 12 },
    screenShake: { amp: 4, durationTicks: 12 },
  },

  // --- 2. Fire Moves ---
  ember: {
    spriteUrl: 'Graphics/Animations/Flames.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'projectile',
    blendMode: 'lighter',
    scale: 0.95,
    screenFlash: { color: 'rgba(249, 115, 22, 0.3)', durationTicks: 10 },
    screenShake: { amp: 3, durationTicks: 10 },
  },
  flamethrower: {
    spriteUrl: 'Graphics/Animations/Flames.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 12,
    ticksPerFrame: 4,
    target: 'projectile',
    blendMode: 'lighter',
    scale: 1.2,
    screenShake: { amp: 4, durationTicks: 14 },
    screenFlash: { color: 'rgba(249, 115, 22, 0.35)', durationTicks: 12 },
  },
  fire_blast: {
    spriteUrl: 'Graphics/Animations/fire blast.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 11,
    ticksPerFrame: 4,
    target: 'defender',
    blendMode: 'lighter',
    scale: 1.25,
    screenFlash: { color: 'rgba(249, 115, 22, 0.5)', durationTicks: 16 },
    screenShake: { amp: 6, durationTicks: 18 },
  },
  fire_spin: {
    spriteUrl: 'Graphics/Animations/grass2.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'defender',
    blendMode: 'lighter',
    scale: 1.15,
    screenShake: { amp: 3, durationTicks: 12 },
    screenFlash: { color: 'rgba(249, 115, 22, 0.3)', durationTicks: 10 },
  },

  // --- 3. Water Moves ---
  water_gun: {
    spriteUrl: 'Graphics/Animations/fly copy.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 11,
    ticksPerFrame: 4,
    target: 'projectile',
    scale: 1.0,
    screenShake: { amp: 3, durationTicks: 12 },
  },
  water_pulse: {
    spriteUrl: 'Graphics/Animations/Water pulse.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'defender',
    scale: 1.1,
    screenShake: { amp: 3, durationTicks: 12 },
    screenFlash: { color: 'rgba(56, 189, 248, 0.3)', durationTicks: 10 },
  },
  surf: {
    spriteUrl: 'Graphics/Animations/SurfSpec.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 5,
    target: 'defender',
    scale: 1.25,
    screenShake: { amp: 5, durationTicks: 18 },
    screenFlash: { color: 'rgba(56, 189, 248, 0.35)', durationTicks: 14 },
  },
  hydro_pump: {
    spriteUrl: 'Graphics/Animations/icewater.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 12,
    ticksPerFrame: 4,
    target: 'projectile',
    scale: 1.3,
    screenShake: { amp: 6, durationTicks: 18 },
    screenFlash: { color: 'rgba(56, 189, 248, 0.4)', durationTicks: 14 },
  },

  // --- 4. Physical Impact & Melee Moves ---
  tackle: {
    spriteUrl: 'Graphics/Animations/Tackle_B.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 1.0,
    screenShake: { amp: 4, durationTicks: 12 },
  },
  quick_attack: {
    spriteUrl: 'Graphics/Animations/Tackle_B.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 6,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 0.9,
    screenShake: { amp: 3, durationTicks: 10 },
  },
  scratch: {
    spriteUrl: 'Graphics/Animations/scratchbattle.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 5,
    ticksPerFrame: 6,
    target: 'defender',
    scale: 1.0,
    screenShake: { amp: 3, durationTicks: 10 },
  },
  slash: {
    spriteUrl: 'Graphics/Animations/zan03.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 4,
    totalFrames: 4,
    ticksPerFrame: 6,
    target: 'defender',
    scale: 1.15,
    screenShake: { amp: 4, durationTicks: 14 },
  },
  shadow_claw: {
    spriteUrl: 'Graphics/Animations/009-Weapon04.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 1.05,
    screenShake: { amp: 4, durationTicks: 12 },
  },
  bite: {
    spriteUrl: 'Graphics/Animations/Crunch.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 4,
    totalFrames: 6,
    ticksPerFrame: 5,
    target: 'defender',
    scale: 1.05,
    screenShake: { amp: 3, durationTicks: 12 },
  },
  crunch: {
    spriteUrl: 'Graphics/Animations/teeth.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 1.2,
    screenShake: { amp: 5, durationTicks: 14 },
  },
  slam: {
    spriteUrl: 'Graphics/Animations/003-Attack01.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 1.1,
    screenShake: { amp: 5, durationTicks: 14 },
  },
  body_slam: {
    spriteUrl: 'Graphics/Animations/003-Attack01.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 1.2,
    screenShake: { amp: 6, durationTicks: 16 },
  },
  rock_smash: {
    spriteUrl: 'Graphics/Animations/rockice.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 1.1,
    screenShake: { amp: 5, durationTicks: 14 },
  },

  // --- 5. Ghost & Dark Energy Moves ---
  shadow_ball: {
    spriteUrl: 'Graphics/Animations/009-Weapon04.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'projectile',
    scale: 1.1,
    screenShake: { amp: 4, durationTicks: 14 },
    screenFlash: { color: 'rgba(147, 51, 234, 0.3)', durationTicks: 10 },
  },
  dark_pulse: {
    spriteUrl: 'Graphics/Animations/022-Darkness01.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'defender',
    scale: 1.15,
    screenShake: { amp: 4, durationTicks: 12 },
    screenFlash: { color: 'rgba(107, 114, 128, 0.3)', durationTicks: 10 },
  },

  // --- 6. Grass & Nature Moves ---
  energy_ball: {
    spriteUrl: 'Graphics/Animations/fly copy.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 4,
    target: 'projectile',
    blendMode: 'lighter',
    scale: 1.1,
    screenShake: { amp: 4, durationTicks: 12 },
    screenFlash: { color: 'rgba(74, 222, 128, 0.35)', durationTicks: 12 },
  },
  magical_leaf: {
    spriteUrl: 'Graphics/Animations/More2.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 1.0,
    screenShake: { amp: 3, durationTicks: 10 },
  },

  // --- 7. Psychic, Poison & Ice Moves ---
  psybeam: {
    spriteUrl: 'Graphics/Animations/efftest4.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'projectile',
    blendMode: 'lighter',
    scale: 1.1,
    screenFlash: { color: 'rgba(236, 72, 153, 0.35)', durationTicks: 12 },
    screenShake: { amp: 3, durationTicks: 10 },
  },
  sludge_bomb: {
    spriteUrl: 'Graphics/Animations/poison4.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'projectile',
    scale: 1.05,
    screenShake: { amp: 4, durationTicks: 12 },
    screenFlash: { color: 'rgba(168, 85, 247, 0.3)', durationTicks: 10 },
  },
  frost_breath: {
    spriteUrl: 'Graphics/Animations/Ice1.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'projectile',
    scale: 1.1,
    screenFlash: { color: 'rgba(186, 230, 253, 0.35)', durationTicks: 12 },
    screenShake: { amp: 3, durationTicks: 12 },
  },
  ice_beam: {
    spriteUrl: 'Graphics/Animations/Ice1.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'projectile',
    scale: 1.2,
    screenFlash: { color: 'rgba(186, 230, 253, 0.45)', durationTicks: 14 },
    screenShake: { amp: 4, durationTicks: 14 },
  },

  // --- 8. Dragon Moves ---
  dragon_pulse: {
    spriteUrl: 'Graphics/Animations/015-Fire01.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 1.15,
    screenShake: { amp: 4, durationTicks: 14 },
    screenFlash: { color: 'rgba(99, 102, 241, 0.3)', durationTicks: 12 },
  },
  dragon_claw: {
    spriteUrl: 'Graphics/Animations/poison.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'defender',
    scale: 1.15,
    screenShake: { amp: 4, durationTicks: 12 },
  },

  // --- 9. Healing & Status Support Moves ---
  recover: {
    spriteUrl: 'Graphics/Animations/anim sheet.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.05,
    screenFlash: { color: 'rgba(52, 211, 153, 0.4)', durationTicks: 16 },
  },
  roost: {
    spriteUrl: 'Graphics/Animations/Firebird.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.1,
    screenFlash: { color: 'rgba(52, 211, 153, 0.35)', durationTicks: 14 },
  },
  protect: {
    spriteUrl: 'Graphics/Animations/anim sheet.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.15,
    screenFlash: { color: 'rgba(96, 165, 250, 0.4)', durationTicks: 14 },
  },
  detect: {
    spriteUrl: 'Graphics/Animations/anim sheet.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.1,
    screenFlash: { color: 'rgba(234, 179, 8, 0.4)', durationTicks: 14 },
  },
  substitute: {
    spriteUrl: 'Graphics/Animations/PRAS- Substitute.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 2,
    totalFrames: 2,
    ticksPerFrame: 10,
    target: 'attacker',
    scale: 1.0,
  },
  swords_dance: {
    spriteUrl: 'Graphics/Animations/fly copy.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.15,
    screenFlash: { color: 'rgba(239, 68, 68, 0.35)', durationTicks: 14 },
  },
  dragon_dance: {
    spriteUrl: 'Graphics/Animations/electric1.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.15,
    screenFlash: { color: 'rgba(168, 85, 247, 0.4)', durationTicks: 14 },
  },
  light_screen: {
    spriteUrl: 'Graphics/Animations/normal2.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.1,
    screenFlash: { color: 'rgba(253, 224, 71, 0.4)', durationTicks: 14 },
  },
  reflect: {
    spriteUrl: 'Graphics/Animations/normal2.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.1,
    screenFlash: { color: 'rgba(244, 114, 182, 0.4)', durationTicks: 14 },
  },
  barrier: {
    spriteUrl: 'Graphics/Animations/anim sheet.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.1,
    screenFlash: { color: 'rgba(147, 197, 253, 0.4)', durationTicks: 14 },
  },
  safeguard: {
    spriteUrl: 'Graphics/Animations/007-Weapon02.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.1,
    screenFlash: { color: 'rgba(52, 211, 153, 0.4)', durationTicks: 14 },
  },
  harden: {
    spriteUrl: 'Graphics/Animations/anim sheet.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.0,
  },
  iron_defense: {
    spriteUrl: 'Graphics/Animations/anim sheet.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.0,
  },
  calm_mind: {
    spriteUrl: 'Graphics/Animations/018-Water01.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.0,
  },
  bulk_up: {
    spriteUrl: 'Graphics/Animations/animsheet.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.0,
  },
  baton_pass: {
    spriteUrl: 'Graphics/Animations/Cups + Musical Notes.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 4,
    totalFrames: 6,
    ticksPerFrame: 5,
    target: 'attacker',
    scale: 1.0,
  },
  teleport: {
    spriteUrl: 'Graphics/Animations/!.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 4,
    totalFrames: 4,
    ticksPerFrame: 6,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.05,
    screenFlash: { color: 'rgba(192, 132, 252, 0.4)', durationTicks: 14 },
  },
  synthesis: {
    spriteUrl: 'Graphics/Animations/anim sheet.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 4,
    target: 'attacker',
    blendMode: 'lighter',
    scale: 1.1,
    screenFlash: { color: 'rgba(52, 211, 153, 0.4)', durationTicks: 16 },
  },
};

/** Themed elemental fallbacks for any unlisted move based on type */
export const TYPE_FALLBACK_VFX: Partial<Record<PokemonType, MoveVfxDef>> = {
  Electric: {
    spriteUrl: 'Graphics/Animations/017-Thunder01.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 6,
    ticksPerFrame: 6,
    target: 'defender',
    blendMode: 'lighter',
    scale: 1.0,
    screenFlash: { color: 'rgba(254, 240, 138, 0.35)', durationTicks: 12 },
    screenShake: { amp: 4, durationTicks: 12 },
  },
  Fire: {
    spriteUrl: 'Graphics/Animations/Flames.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 4,
    target: 'defender',
    blendMode: 'lighter',
    scale: 1.0,
    screenFlash: { color: 'rgba(249, 115, 22, 0.3)', durationTicks: 12 },
  },
  Water: {
    spriteUrl: 'Graphics/Animations/icewater.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 12,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 1.0,
    screenShake: { amp: 4, durationTicks: 14 },
  },
  Ice: {
    spriteUrl: 'Graphics/Animations/Ice1.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 9,
    ticksPerFrame: 5,
    target: 'defender',
    scale: 1.0,
    screenFlash: { color: 'rgba(186, 230, 253, 0.35)', durationTicks: 12 },
    screenShake: { amp: 4, durationTicks: 14 },
  },
  Normal: {
    spriteUrl: 'Graphics/Animations/003-Attack01.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 0.95,
    screenShake: { amp: 4, durationTicks: 12 },
  },
  Fighting: {
    spriteUrl: 'Graphics/Animations/003-Attack01.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 1.05,
    screenShake: { amp: 5, durationTicks: 14 },
  },
  Grass: {
    spriteUrl: 'Graphics/Animations/grass.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 0.95,
    screenFlash: { color: 'rgba(74, 222, 128, 0.35)', durationTicks: 14 },
  },
  Dark: {
    spriteUrl: 'Graphics/Animations/022-Darkness01.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'defender',
    scale: 1.0,
    screenShake: { amp: 4, durationTicks: 12 },
  },
  Ghost: {
    spriteUrl: 'Graphics/Animations/009-Weapon04.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 8,
    ticksPerFrame: 5,
    target: 'defender',
    scale: 1.0,
    screenShake: { amp: 4, durationTicks: 12 },
  },
  Dragon: {
    spriteUrl: 'Graphics/Animations/015-Fire01.png',
    cellWidth: 192,
    cellHeight: 192,
    columns: 5,
    totalFrames: 10,
    ticksPerFrame: 4,
    target: 'defender',
    scale: 1.0,
    screenShake: { amp: 4, durationTicks: 14 },
  },
};

export interface MoveAnimationDbEntry {
  moveId: string;
  name: string;
  type: string;
  category: string;
  graphic: string;
  hasGraphicFile: boolean;
  soundEffects: string[];
}

export const MOVE_ANIMATIONS_DB: Record<string, MoveAnimationDbEntry> =
  rawMoveAnimationsDb as unknown as Record<string, MoveAnimationDbEntry>;

const PROJECTILE_KEYWORDS = [
  'ball',
  'beam',
  'pulse',
  'gun',
  'pump',
  'bomb',
  'blast',
  'throw',
  'shot',
  'cannon',
  'bullet',
  'wave',
  'breath',
  'burst',
  'blaster',
  'spit',
  'spray',
  'missile',
  'cutter',
  'star',
  'orbs',
  'energy',
  'ember',
  'sludge',
  'arrow',
  'shuriken',
  'flamethrower',
  'sting',
];

/**
 * Master set of move IDs that target the user / self or the user's field.
 * Any animation played for these moves MUST appear on the attacker, not the defender!
 */
export const SELF_TARGET_MOVE_IDS = new Set<string>([
  // 1. Protection & Defensive stances
  'protect',
  'detect',
  'spiky_shield',
  'baneful_bunker',
  'kings_shield',
  'obstruct',
  'silk_trap',
  'wide_guard',
  'quick_guard',
  'mat_block',
  'endure',
  'burning_bulwark',
  'crafty_shield',

  // 2. Recovery & Healing moves
  'recover',
  'roost',
  'softboiled',
  'soft_boiled',
  'milk_drink',
  'slack_off',
  'wish',
  'synthesis',
  'moonlight',
  'morning_sun',
  'rest',
  'shore_up',
  'heal_order',
  'swallow',
  'refresh',
  'purify',
  'life_dew',
  'jungle_healing',
  'floral_healing',
  'heal_bell',
  'aromatherapy',

  // 3. Stat Boosts & Setup Moves
  'swords_dance',
  'dragon_dance',
  'quiver_dance',
  'bulk_up',
  'calm_mind',
  'nasty_plot',
  'agility',
  'rock_polish',
  'autotomize',
  'shift_gear',
  'shell_smash',
  'geomancy',
  'belly_drum',
  'work_up',
  'hone_claws',
  'growth',
  'coil',
  'tail_glow',
  'cotton_guard',
  'iron_defense',
  'acid_armor',
  'barrier',
  'amnesia',
  'cosmic_power',
  'defense_curl',
  'harden',
  'withdraw',
  'minimize',
  'double_team',
  'focus_energy',
  'sharpen',
  'meditate',
  'howl',
  'charge',
  'stockpile',
  'acupressure',
  'no_retreat',
  'victory_dance',
  'tidy_up',
  'take_heart',
  'fillet_away',
  'clangorous_soul',
  'stuff_cheeks',
  'gear_up',
  'magnetic_flux',
  'power_trick',
  'power_shift',
  'clanging_scales',
  'coaching',
  'dragon_cheer',
  'celebrate',

  // 4. Team Screens & Field Buff Auras
  'light_screen',
  'reflect',
  'aurora_veil',
  'safeguard',
  'mist',
  'tailwind',
  'lucky_chant',

  // 5. Self Status / Volatile / Escapes / Utility
  'substitute',
  'aqua_ring',
  'ingrain',
  'magnet_rise',
  'destiny_bond',
  'grudge',
  'snatch',
  'magic_coat',
  'baton_pass',
  'teleport',
  'shed_tail',
  'metronome',
  'transform',
  'conversion',
  'conversion_2',
  'recycle',
  'mimic',
  'sketch',
  'assist',
  'copycat',
  'mirror_move',
  'me_first',
  'follow_me',
  'rage_powder',
  'ally_switch',
  'camouflage',
  'splash',
]);

/**
 * Checks whether a given move is used on oneself / self-targeting.
 */
export function isSelfTargetMove(move: BattleMove): boolean {
  const normKey = move.id.toLowerCase().replace(/[- ]/g, '_');
  const normKeyClean = normKey.replace(/_/g, '');

  if (SELF_TARGET_MOVE_IDS.has(normKey) || SELF_TARGET_MOVE_IDS.has(normKeyClean)) {
    return true;
  }

  // Pure status move that buffs self stats
  if (
    move.category === 'status' &&
    move.statChanges &&
    move.statChanges.length > 0 &&
    move.statChanges.every((sc) => sc.target === 'self')
  ) {
    return true;
  }

  // Pure status healing move
  if (move.category === 'status' && move.healPercent !== undefined && move.healPercent > 0) {
    return true;
  }

  // Pure status move with self status effect
  if (move.category === 'status' && move.statusEffect?.target === 'self') {
    return true;
  }

  // Status move keyword heuristic
  if (move.category === 'status') {
    const selfKeywords = [
      'protect',
      'shield',
      'detect',
      'guard',
      'endure',
      'barrier',
      'armor',
      'defense',
      'harden',
      'curl',
      'dance',
      'mind',
      'agility',
      'heal',
      'recover',
      'roost',
      'synthesis',
      'wish',
      'rest',
      'substitute',
      'screen',
      'veil',
      'mist',
      'tailwind',
      'ingrain',
      'aqua_ring',
      'stockpile',
      'swallow',
      'baton_pass',
      'teleport',
      'boost',
    ];
    if (selfKeywords.some((kw) => normKey.includes(kw))) {
      return true;
    }
  }

  return false;
}

export function buildVfxDefFromDbEntry(
  entry: MoveAnimationDbEntry,
  isSelfTarget = false
): MoveVfxDef {
  const normKey = entry.moveId.toLowerCase().replace(/[- ]/g, '_');

  let target: 'projectile' | 'defender' | 'attacker' = 'defender';
  if (
    isSelfTarget ||
    SELF_TARGET_MOVE_IDS.has(normKey) ||
    normKey.includes('heal') ||
    normKey.includes('recover') ||
    normKey.includes('rest')
  ) {
    target = 'attacker';
  } else if (
    entry.category === 'special' ||
    PROJECTILE_KEYWORDS.some((kw) => normKey.includes(kw))
  ) {
    target = 'projectile';
  }

  let cellWidth = 192;
  let cellHeight = 192;
  let columns = 5;
  let totalFrames = 8;
  const scale = target === 'projectile' ? 1.1 : 1.0;

  if (
    entry.graphic.includes('zan03') ||
    entry.graphic.includes('Crunch') ||
    entry.graphic.includes('Cups') ||
    entry.graphic === '!.png'
  ) {
    columns = 4;
    totalFrames = 6;
  } else if (entry.graphic.includes('Trovao') || entry.graphic.includes('SurfSpec')) {
    columns = 5;
    totalFrames = 10;
  } else if (entry.graphic.includes('Flames') || entry.graphic.includes('icewater')) {
    columns = 5;
    totalFrames = 12;
  } else if (entry.graphic.includes('Dragon Claw')) {
    columns = 7;
    totalFrames = 7;
  } else if (entry.graphic.includes('Psychic BG')) {
    cellWidth = 256;
    cellHeight = 195;
    columns = 2;
    totalFrames = 4;
  } else if (entry.graphic.includes('Giga Drain BG')) {
    cellWidth = 256;
    cellHeight = 288;
    columns = 2;
    totalFrames = 2;
  } else if (entry.graphic.includes('Substitute')) {
    columns = 2;
    totalFrames = 2;
  }

  return {
    spriteUrl: `Graphics/Animations/${entry.graphic}`,
    cellWidth,
    cellHeight,
    columns,
    totalFrames,
    ticksPerFrame: 4,
    target,
    scale,
    soundEffect: entry.soundEffects?.[0],
    screenShake: target === 'defender' ? { amp: 4, durationTicks: 12 } : undefined,
  };
}

/**
 * Resolves the visual animation VFX definition for a move,
 * checking the explicit registry first, then the Essentials move animations database,
 * and finally falling back to elemental type.
 */
export function resolveMoveVfx(move: BattleMove): MoveVfxDef | null {
  const rawKey = move.id.toLowerCase().trim();
  const moveKeyWithUnderscore = rawKey.replace(/[- ]/g, '_');
  const moveKeyWithoutUnderscore = rawKey.replace(/[- _]/g, '');

  const isSelf = isSelfTargetMove(move);

  // 1. Explicit handcrafted registry takes highest precedence
  let vfx: MoveVfxDef | null =
    MOVE_VFX_REGISTRY[rawKey] ??
    MOVE_VFX_REGISTRY[moveKeyWithUnderscore] ??
    MOVE_VFX_REGISTRY[moveKeyWithoutUnderscore] ??
    null;

  // 2. Comprehensive Pokémon Essentials animations database (892+ moves)
  if (!vfx) {
    const dbEntry =
      MOVE_ANIMATIONS_DB[rawKey] ??
      MOVE_ANIMATIONS_DB[moveKeyWithUnderscore] ??
      MOVE_ANIMATIONS_DB[moveKeyWithoutUnderscore];
    if (dbEntry?.hasGraphicFile && dbEntry.graphic) {
      vfx = buildVfxDefFromDbEntry(dbEntry, isSelf);
    }
  }

  // 3. Themed elemental fallback
  if (!vfx) {
    vfx = TYPE_FALLBACK_VFX[move.type] ?? null;
  }

  if (!vfx) return null;

  // CRITICAL GUARANTEE: If a move is used on oneself / self-targeting (e.g. Protect, Detect, Swords Dance),
  // the visual animation MUST be positioned on the attacker (the Pokémon using the move),
  // NEVER on the opponent/defender!
  if (isSelf && vfx.target !== 'attacker') {
    return {
      ...vfx,
      target: 'attacker',
      screenShake: undefined,
    };
  }

  return vfx;
}

