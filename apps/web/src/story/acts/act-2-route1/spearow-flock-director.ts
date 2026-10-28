/**
 * Spearow Flock Director (Act 2 - Route 1)
 * Manages the flock of aggressive Spearow AI entities chasing Satoshi & Pikachu.
 */

import { TILE_SIZE } from '@pokemon/game-data';
import { battleSePlayer } from '../../../audio';
import { drawNPCEmoteBubble, type NPCEmoteType } from '../../../npc';

export interface SpearowFlockActor {
  id: string;
  x: number; // pixel position in world
  y: number;
  gx: number;
  gy: number;
  vx: number;
  vy: number;
  direction: 0 | 1 | 2 | 3; // 0: Down, 1: Left, 2: Right, 3: Up
  frame: number;
  baseOffsetX: number;
  baseOffsetY: number;
  flapSpeed: number;
  flightAltitude: number; // visual Y offset to simulate flying in air
  diveTimer: number;
  isDiving: boolean;
  diveTargetX?: number;
  diveTargetY?: number;
  activeEmote?: NPCEmoteType | null;
  emoteTimerMs?: number;
}

export class SpearowFlockDirector {
  private static instance: SpearowFlockDirector;
  public static getInstance(): SpearowFlockDirector {
    if (!SpearowFlockDirector.instance) {
      SpearowFlockDirector.instance = new SpearowFlockDirector();
    }
    return SpearowFlockDirector.instance;
  }

  private actors: SpearowFlockActor[] = [];
  private spriteImage: HTMLImageElement | null = null;
  private isActive = false;
  private animationClock = 0;
  private screechCooldownMs = 0;

  constructor() {
    this.loadSprite();
  }

  private loadSprite(): void {
    if (typeof Image === 'undefined') return;
    this.spriteImage = new Image();
    this.spriteImage.src = '/Graphics/Characters/Followers/SPEAROW.png';
  }

  public getActors(): SpearowFlockActor[] {
    return this.actors;
  }

  public isFlockActive(): boolean {
    return this.isActive && this.actors.length > 0;
  }

  public isActiveFlock(): boolean {
    return this.isFlockActive();
  }

  /**
   * Spawns a flock of 7 aggressive Spearow circling around the initial encounter point.
   */
  public spawnFlock(centerGX: number, centerGY: number): void {
    this.clear();
    this.isActive = true;
    this.animationClock = 0;
    this.screechCooldownMs = 2000;

    const count = 7;
    const offsets = [
      { ox: -36, oy: -50, flap: 0.22, alt: 28 },
      { ox: 34, oy: -48, flap: 0.25, alt: 32 },
      { ox: -64, oy: -20, flap: 0.20, alt: 24 },
      { ox: 62, oy: -22, flap: 0.24, alt: 30 },
      { ox: -20, oy: -80, flap: 0.26, alt: 35 },
      { ox: 25, oy: -78, flap: 0.21, alt: 36 },
      { ox: 0, oy: -95, flap: 0.23, alt: 38 },
    ];

    for (let i = 0; i < count; i++) {
      const config = offsets[i] ?? { ox: 0, oy: -40, flap: 0.2, alt: 30 };
      const startX = centerGX * TILE_SIZE + config.ox;
      const startY = centerGY * TILE_SIZE + config.oy;

      this.actors.push({
        id: `spearow_flock_${i}`,
        x: startX,
        y: startY,
        gx: Math.round(startX / TILE_SIZE),
        gy: Math.round(startY / TILE_SIZE),
        vx: 0,
        vy: 0,
        direction: 0,
        frame: 0,
        baseOffsetX: config.ox,
        baseOffsetY: config.oy,
        flapSpeed: config.flap,
        flightAltitude: config.alt,
        diveTimer: 0,
        isDiving: false,
        activeEmote: 'angry',
        emoteTimerMs: 2500,
      });
    }

    // Play screech cue
    battleSePlayer.playSound('Audio/Cries/SPEAROW.ogg', 0.9);
  }

  /**
   * Initiates a dive attack by the front-most Spearow towards Pikachu's world position.
   */
  public triggerDiveAtTarget(targetX: number, targetY: number, onImpact?: () => void): void {
    if (this.actors.length === 0) return;
    const diver = this.actors[0];
    diver.isDiving = true;
    diver.diveTargetX = targetX;
    diver.diveTargetY = targetY;
    diver.flightAltitude = 12; // swoops down low
    diver.activeEmote = 'exclamation';
    diver.emoteTimerMs = 1200;

    battleSePlayer.playSound('Audio/SE/Jump.ogg', 0.85);

    setTimeout(() => {
      onImpact?.();
    }, 450);
  }

  /**
   * Updates positions, swooping physics, and flock chase behaviors.
   */
  public update(
    dtScale: number,
    playerX: number,
    playerY: number,
    targetSpeedMultiplier = 1.0
  ): void {
    if (!this.isActive || this.actors.length === 0) return;

    const dtMs = (1000 / 60) * dtScale;
    this.animationClock += dtMs;

    if (this.screechCooldownMs > 0) {
      this.screechCooldownMs -= dtMs;
      if (this.screechCooldownMs <= 0 && Math.random() < 0.35) {
        battleSePlayer.playSound('Audio/Cries/SPEAROW.ogg', 0.6);
        this.screechCooldownMs = 4000 + Math.random() * 3000;
      }
    }

    for (let i = 0; i < this.actors.length; i++) {
      const bird = this.actors[i];

      // Update emote timer
      if (bird.emoteTimerMs && bird.emoteTimerMs > 0) {
        bird.emoteTimerMs -= dtMs;
        if (bird.emoteTimerMs <= 0) {
          bird.activeEmote = null;
        }
      }

      // Flapping wing cycle (4-frame loop: 0, 1, 2, 3)
      bird.frame = Math.floor((this.animationClock * bird.flapSpeed) / 100) % 4;

      if (bird.isDiving && bird.diveTargetX !== undefined && bird.diveTargetY !== undefined) {
        // Fast dive toward target
        const dx = bird.diveTargetX - bird.x;
        const dy = bird.diveTargetY - bird.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 8) {
          bird.x += (dx / dist) * 7.5 * dtScale;
          bird.y += (dy / dist) * 7.5 * dtScale;
        } else {
          bird.isDiving = false;
          bird.flightAltitude = 30; // ascend back up
        }
      } else {
        // Swarm hovering around player with wave oscillation
        const waveX = Math.sin(this.animationClock * 0.003 + i * 1.2) * 18;
        const waveY = Math.cos(this.animationClock * 0.004 + i * 0.9) * 14;

        const targetX = playerX + bird.baseOffsetX + waveX;
        const targetY = playerY + bird.baseOffsetY + waveY;

        const dx = targetX - bird.x;
        const dy = targetY - bird.y;

        const moveSpeed = 3.6 * targetSpeedMultiplier * dtScale;
        bird.x += dx * 0.08 * moveSpeed;
        bird.y += dy * 0.08 * moveSpeed;

        // Facing direction based on velocity
        if (Math.abs(dx) > Math.abs(dy)) {
          bird.direction = dx > 0 ? 2 : 1; // 2: Right, 1: Left
        } else {
          bird.direction = dy > 0 ? 0 : 3; // 0: Down, 3: Up
        }
      }

      bird.gx = Math.round(bird.x / TILE_SIZE);
      bird.gy = Math.round(bird.y / TILE_SIZE);
    }
  }

  /**
   * Renders shadows on ground and flying Spearow sprites with bobbing flight heights.
   */
  public render(ctx: CanvasRenderingContext2D, _camera?: { x: number; y: number }): void {
    if (!this.isActive || this.actors.length === 0) return;

    const img = this.spriteImage;

    // ctx already carries the camera transform: draw in WORLD coordinates.
    for (const bird of this.actors) {
      const screenX = Math.round(bird.x);
      const groundScreenY = Math.round(bird.y);
      const flyingScreenY = groundScreenY - bird.flightAltitude;

      // 1. Draw ground shadow
      const shadowScale = Math.max(0.4, 1 - bird.flightAltitude / 70);
      ctx.fillStyle = `rgba(0, 0, 0, ${(0.28 * shadowScale).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(screenX + 32, groundScreenY + 48, 12 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw flying bird sprite (64x64 frame from 4x4 follower sheet)
      if (img && img.complete && img.naturalWidth > 0) {
        const frameW = img.naturalWidth / 4;
        const frameH = img.naturalHeight / 4;
        ctx.drawImage(
          img,
          bird.frame * frameW,
          bird.direction * frameH,
          frameW,
          frameH,
          screenX,
          flyingScreenY,
          64,
          64
        );
      } else {
        // Fallback procedural placeholder
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(screenX + 32, flyingScreenY + 32, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw active emote if any
      if (bird.activeEmote && bird.emoteTimerMs && bird.emoteTimerMs > 0) {
        drawNPCEmoteBubble(ctx, screenX + 32, flyingScreenY + 12, bird.activeEmote, bird.emoteTimerMs);
      }
    }
  }

  /**
   * Clears all flock entities and resets active state.
   */
  public clear(): void {
    this.actors = [];
    this.isActive = false;
  }

  public reset(): void {
    this.clear();
  }
}

export const spearowFlockDirector = SpearowFlockDirector.getInstance();
