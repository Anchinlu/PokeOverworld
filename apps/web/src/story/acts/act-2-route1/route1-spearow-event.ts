/**
 * Route 1 Spearow Encounter & Flock Chase Event (Act 2 - Route 1)
 *
 * Faithfully adapts anime episode 1:
 * 1. Solo Spearow placed far north on Route 1 (wild spawns suppressed).
 * 2. Story Battle: Satoshi & Pikachu Lv 5 vs Spearow Lv 1 (isUncatchable = true, one-hit win).
 * 3. Post-battle: Spearow remains on map, shrieks and summons flock.
 * 4. Chase sequence: Flock pursues Satoshi & Pikachu.
 * 5. Attack & Counter-Shock: Spearow attacks Pikachu, Pikachu shocks Spearow with Thunder, flock swarms in.
 * 6. Final Sprint & Plunge: Pikachu runs ahead, Satoshi shouts, both plunge into the waterfall, screen fades to black!
 */

import { TILE_SIZE } from '@pokemon/game-data';
import { playerService, partyService, partyPokemonToBattler } from '../../../domain';
import { battleSePlayer } from '../../../audio';
import { getStartVillagePlacement } from '../../../maps/terrain-field/start-village';
import { ROUTE1_STORY_ASSETS, STARTER_LAB_ASSETS } from '../../../assets/asset-registry';
import { showBerryToast } from '../../../ui/toast';
import { getVillagePlacement, type VillagePlacement } from '../../../maps/village-rules';
import { getNearbySettlements } from '../../../maps/terrain-field/settlement-sites';
import { drawNPCEmoteBubble, type CutsceneActor } from '../../../npc';
import { palletPrologueEventManager } from '../act-1-pallet/pallet-prologue-event';
import { spearowFlockDirector } from './spearow-flock-director';
import { storyState, storyManager, storyLockManager } from '../../core';
import { autoWalkNavigator } from '../../../ui/quest-tracker/auto-walk-navigator';
import type { GameSession } from '../../../game/game-session';

export type Route1EventPhase =
  | 'idle'
  | 'spearow_spotted'
  | 'in_battle'
  | 'spearow_defeated'
  | 'chase'
  | 'pikachu_shock'
  | 'waterfall_sprint'
  | 'completed';

export class Route1SpearowEventManager {
  private static instance: Route1SpearowEventManager;
  public static getInstance(): Route1SpearowEventManager {
    if (!Route1SpearowEventManager.instance) {
      Route1SpearowEventManager.instance = new Route1SpearowEventManager();
    }
    return Route1SpearowEventManager.instance;
  }

  public isRunning = false;
  public phase: Route1EventPhase = 'idle';
  public soloSpearowActor: CutsceneActor | null = null;
  public escapeStepsTaken = 0;
  private lastPlayerGX = 0;
  private lastPlayerGY = 0;
  private spriteImage: HTMLImageElement | null = null;
  public isShocking = false;
  public shockTimerMs = 0;
  public shockSource: { x: number; y: number } | null = null;
  public shockTarget: { x: number; y: number } | null = null;

  // Natural idle wander & animation state
  public homeGX = 0;
  public homeGY = 0;
  public isMoving = false;
  public fromGX = 0;
  public fromGY = 0;
  public toGX = 0;
  public toGY = 0;
  public stepProgress = 0;
  public wanderCooldownMs = 1500;
  public idleAnimTimerMs = 1200;
  public hopTimerMs = 0;

  constructor() {
    this.loadSprite();
  }

  private loadSprite(): void {
    if (typeof Image === 'undefined') return;
    this.spriteImage = new Image();
    this.spriteImage.src = '/Graphics/Characters/Followers/SPEAROW.png';
  }

  public reset(): void {
    this.isRunning = false;
    this.phase = 'idle';
    this.soloSpearowActor = null;
    this.escapeStepsTaken = 0;
    this.isShocking = false;
    this.shockTimerMs = 0;
    this.shockSource = null;
    this.shockTarget = null;
    this.isMoving = false;
    this.stepProgress = 0;
    this.wanderCooldownMs = 1500;
    this.idleAnimTimerMs = 1200;
    this.hopTimerMs = 0;
    this.homeGX = 0;
    this.homeGY = 0;
    spearowFlockDirector.clear();
    storyManager.getCameraPort().reset();
    storyLockManager.releaseAllForOwner('act2.route1.spearow_encounter');
  }

  private triggerScreenShake(durationMs = 800): void {
    storyManager.getCameraPort().shakeScreen(1, durationMs);
  }

  private setScreenZap(active: boolean): void {
    storyManager.getCameraPort().setScreenZap(active);
  }

  /**
   * Deterministically calculates the northern Route 1 coordinates for the solo Spearow encounter.
   * Far away from Pallet Town, in an outer northern chunk.
   */
  public getTargetCoordinates(session?: GameSession): { gx: number; gy: number } {
    const seed = session?.seed ?? 101;
    const villagePlacement = getStartVillagePlacement(seed);
    const centerGX = Math.round((villagePlacement.bounds.minGX + villagePlacement.bounds.maxGX) / 2);
    // Position 22 tiles north of village boundary
    const targetGY = villagePlacement.bounds.minGY - 22;
    return { gx: centerGX, gy: targetGY };
  }

  /**
   * Ensures the solo event Spearow is placed on Route 1 once the player leaves Pallet Town.
   */
  public ensureSoloSpearowSpawned(session: GameSession): CutsceneActor {
    session.chunkManager?.clearRoute1ClearingTrees?.();
    if (this.soloSpearowActor) return this.soloSpearowActor;

    const coords = this.getTargetCoordinates(session);
    this.homeGX = coords.gx;
    this.homeGY = coords.gy;
    this.fromGX = coords.gx;
    this.fromGY = coords.gy;
    this.toGX = coords.gx;
    this.toGY = coords.gy;
    this.isMoving = false;
    this.stepProgress = 0;
    this.wanderCooldownMs = 1200;
    this.idleAnimTimerMs = 1500;
    this.hopTimerMs = 0;

    this.soloSpearowActor = {
      id: 'route1_solo_spearow',
      name: 'Onisuzume',
      spriteKey: 'char_spearow',
      gx: coords.gx,
      gy: coords.gy,
      x: coords.gx * TILE_SIZE - 16,
      y: coords.gy * TILE_SIZE - 16,
      direction: 0,
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
      hopY: 0,
    };

    return this.soloSpearowActor;
  }

  /**
   * Checks if player has walked close to the solo Spearow to initiate encounter.
   */
  public checkProximityTrigger(session: GameSession): boolean {
    if (
      !playerService.hasFlag('pallet_crowd_mom_farewell_done') ||
      playerService.hasFlag('route1_flock_escaped') ||
      this.isRunning ||
      this.phase !== 'idle'
    ) {
      return false;
    }

    const spearow = this.ensureSoloSpearowSpawned(session);
    const dist = Math.hypot(session.player.gx - spearow.gx, session.player.gy - spearow.gy);
    return dist <= 1.8;
  }

  public shouldTrigger(session: GameSession): boolean {
    return this.checkProximityTrigger(session);
  }

  public trigger(session: GameSession): void {
    void this.triggerEncounter(session);
  }

  /**
   * True while a scripted beat owns the player. The `chase` phase is excluded
   * on purpose: the player has to physically run away from the flock to
   * advance the event (see `escapeStepsTaken`).
   */
  public isInputLocked(): boolean {
    return this.isRunning && this.phase !== 'chase';
  }

  /**
   * Turns an actor or entity toward a target grid coordinate.
   */
  public faceEntity(entity: { direction: number; gx: number; gy: number }, targetGX: number, targetGY: number): void {
    const dx = targetGX - entity.gx;
    const dy = targetGY - entity.gy;
    if (Math.abs(dx) > Math.abs(dy)) {
      entity.direction = dx > 0 ? 2 : 1; // 2: right, 1: left
    } else {
      entity.direction = dy > 0 ? 0 : 3; // 0: down, 3: up
    }
  }

  /**
   * Step 1: Initiates overworld Thunder Shock encounter with Spearow (no battle screen).
   */
  public async triggerEncounter(session: GameSession): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.phase = 'spearow_spotted';

    // Clear trees in large clearing around Route 1 encounter
    session.chunkManager?.clearRoute1ClearingTrees?.();

    const spearow = this.ensureSoloSpearowSpawned(session);

    // Stop wandering immediately and snap to grid
    this.isMoving = false;
    spearow.x = spearow.gx * TILE_SIZE - 16;
    spearow.y = spearow.gy * TILE_SIZE - 16;
    spearow.hopY = 0;
    spearow.frame = 0;

    // Fail-safe physical separation: if player is on the exact same tile as Spearow,
    // separate them by 1 tile so they stand face-to-face ("mặt đối mặt")
    if (session.player.gx === spearow.gx && session.player.gy === spearow.gy) {
      session.player.gx = spearow.gx;
      session.player.gy = spearow.gy + 1;
      if ((session.player as any).snapTo) {
        session.player.snapTo(session.player.gx, session.player.gy, 3);
      } else {
        session.player.fromGX = session.player.gx;
        session.player.fromGY = session.player.gy;
        session.player.targetGX = session.player.gx;
        session.player.targetGY = session.player.gy;
      }
    }

    // Stop player movement & snap to grid
    session.player.isMoving = false;
    session.player.x = session.player.gx * TILE_SIZE - 16;
    session.player.y = session.player.gy * TILE_SIZE - 32;
    session.player.frame = 0;

    // Turn both player and Spearow toward each other face-to-face
    this.faceEntity(spearow, session.player.gx, session.player.gy);
    this.faceEntity(session.player, spearow.gx, spearow.gy);

    // Cancel auto-walk if still active
    if (autoWalkNavigator.isAutoWalking()) {
      autoWalkNavigator.cancel(true);
    }

    // Position Follower Pikachu neatly behind Satoshi (opposite direction of player facing)
    if (session.follower) {
      session.follower.isMoving = false;
      let pikaGX = session.player.gx;
      let pikaGY = session.player.gy;
      if (session.player.direction === 3) pikaGY += 1; // Facing UP -> Pikachu is DOWN
      else if (session.player.direction === 0) pikaGY -= 1; // Facing DOWN -> Pikachu is UP
      else if (session.player.direction === 1) pikaGX += 1; // Facing LEFT -> Pikachu is RIGHT
      else if (session.player.direction === 2) pikaGX -= 1; // Facing RIGHT -> Pikachu is LEFT

      if (session.follower.snapTo) {
        session.follower.snapTo(pikaGX, pikaGY);
      } else {
        session.follower.gx = pikaGX;
        session.follower.gy = pikaGY;
        session.follower.x = pikaGX * TILE_SIZE - 16;
        session.follower.y = pikaGY * TILE_SIZE - 32;
      }
      session.follower.direction = session.player.direction;
      session.follower.frame = 0;
      session.follower.visible = true;
    }

    session.player.activeEmote = 'exclamation';
    session.player.emoteTimerMs = 1500;
    spearow.activeEmote = 'exclamation';
    spearow.emoteTimerMs = 1500;

    battleSePlayer.playSound('Audio/Cries/SPEAROW.ogg', 0.95);

    await new Promise((r) => setTimeout(r, 600));

    // Pikachu steps up to protect Satoshi and attack
    if (session.follower) {
      session.follower.jumpY = -12;
    }
    battleSePlayer.playSound('Audio/Cries/PIKACHU.ogg', 1.0);

    const ashShockedPortrait = STARTER_LAB_ASSETS.portraitAshShocked;
    await palletPrologueEventManager.showDialogue(
      'Satoshi',
      ['Pikachu, dùng Giật Điện (Thunder Shock)!'],
      ashShockedPortrait,
      'right'
    );

    if (session.follower) {
      session.follower.jumpY = 0;
    }

    // Step 2: Overworld Thunder Shock on Spearow!
    const pikaX = session.follower ? session.follower.x + 16 : session.player.x + 16;
    const pikaY = session.follower ? session.follower.y + 16 : session.player.y + 16;
    const targetX = spearow.x + 32;
    const targetY = spearow.y + 32;

    this.isShocking = true;
    this.shockTimerMs = 1200;
    this.shockSource = { x: pikaX, y: pikaY };
    this.shockTarget = { x: targetX, y: targetY };

    this.setScreenZap(true);
    battleSePlayer.playSound('Audio/SE/Thunder3.ogg', 1.0);
    battleSePlayer.playSound('Audio/SE/Anim/Thundershock.wav', 1.0);

    // Spearow is hit by lightning
    spearow.activeEmote = 'sweat';
    spearow.emoteTimerMs = 1400;

    await new Promise((r) => setTimeout(r, 1200));

    this.setScreenZap(false);
    this.isShocking = false;

    // Grant story EXP to Pikachu / active pokemon
    const activePk = partyService.getFirstAlivePokemon() ?? partyService.getLeader();
    if (activePk) {
      partyService.syncBattleResult(partyPokemonToBattler(activePk), 100);
    }

    // Spearow defeated -> screeches and summons the flock!
    await this.onSpearowDefeated(session);
  }

  /**
   * Step 2: Spearow defeated on Overworld -> screeches and summons the flock!
   */
  public async onSpearowDefeated(session: GameSession): Promise<void> {
    this.phase = 'spearow_defeated';

    const spearow = this.soloSpearowActor;
    if (spearow) {
      spearow.activeEmote = 'angry';
      spearow.emoteTimerMs = 3500;
      spearow.direction = 3; // Facing up screaming
    }

    battleSePlayer.playSound('Audio/Cries/SPEAROW.ogg', 1.0);

    // Screen tremor
    this.triggerScreenShake(1200);

    await new Promise((r) => setTimeout(r, 1400));

    // Spawn flock surrounding player & Spearow
    const centerGX = spearow ? spearow.gx : session.player.gx;
    const centerGY = spearow ? spearow.gy : session.player.gy;
    spearowFlockDirector.spawnFlock(centerGX, centerGY);

    this.phase = 'chase';
    this.escapeStepsTaken = 0;
    this.lastPlayerGX = session.player.gx;
    this.lastPlayerGY = session.player.gy;
  }

  /**
   * Main per-frame update loop hooked to GameSession.update
   */
  public update(dtScale: number, session: GameSession): void {
    if (this.phase === 'idle') {
      if (
        playerService.hasFlag('pallet_crowd_mom_farewell_done') &&
        !playerService.hasFlag('route1_flock_escaped')
      ) {
        this.ensureSoloSpearowSpawned(session);
        this.updateIdleWander(dtScale, session);
      }
      return;
    }

    // Update shock timer
    if (this.shockTimerMs > 0) {
      const dtMs = (1000 / 60) * dtScale;
      this.shockTimerMs -= dtMs;
      if (this.shockTimerMs <= 0) {
        this.isShocking = false;
      }
    }

    // Update solo Spearow actor emotes
    if (this.soloSpearowActor && this.soloSpearowActor.emoteTimerMs && this.soloSpearowActor.emoteTimerMs > 0) {
      const dtMs = (1000 / 60) * dtScale;
      this.soloSpearowActor.emoteTimerMs -= dtMs;
      if (this.soloSpearowActor.emoteTimerMs <= 0) {
        this.soloSpearowActor.activeEmote = null;
      }
    }

    // Keep flock active and animating during chase, shock, and waterfall sprint
    if (
      (this.phase === 'chase' || this.phase === 'pikachu_shock' || this.phase === 'waterfall_sprint') &&
      spearowFlockDirector.isFlockActive()
    ) {
      spearowFlockDirector.update(dtScale, session.player.x, session.player.y, 1.05);

      if (this.phase === 'chase') {
        // Track movement steps away from encounter
        if (session.player.gx !== this.lastPlayerGX || session.player.gy !== this.lastPlayerGY) {
          this.escapeStepsTaken++;
          this.lastPlayerGX = session.player.gx;
          this.lastPlayerGY = session.player.gy;

          // After fleeing 8 steps, trigger Pikachu attack & lightning counter!
          if (this.escapeStepsTaken >= 8) {
            this.runScene_PikachuShockAndSwarm(session);
          }
        }
      }
    }
  }

  /**
   * Updates natural wandering, hopping, and looking around behaviors for solo Spearow while idle.
   */
  private updateIdleWander(dtScale: number, session: GameSession): void {
    const spearow = this.soloSpearowActor;
    if (!spearow || !spearow.visible) return;

    const dtMs = (1000 / 60) * dtScale;

    // 1. Proximity trigger: if player gets close, initiate encounter!
    const distToPlayer = Math.hypot(session.player.gx - spearow.gx, session.player.gy - spearow.gy);
    if (distToPlayer <= 1.8) {
      this.isMoving = false;
      spearow.x = spearow.gx * TILE_SIZE - 16;
      spearow.y = spearow.gy * TILE_SIZE - 16;
      spearow.hopY = 0;
      spearow.frame = 0;
      this.faceEntity(spearow, session.player.gx, session.player.gy);
      void this.triggerEncounter(session);
      return;
    }

    // 2. Update emote timer
    if (spearow.emoteTimerMs && spearow.emoteTimerMs > 0) {
      spearow.emoteTimerMs -= dtMs;
      if (spearow.emoteTimerMs <= 0) {
        spearow.activeEmote = null;
      }
    }

    // 3. Movement stepping & hopping interpolation
    if (this.isMoving) {
      const moveSpeedTilesPerSec = 1.6;
      this.stepProgress += (dtMs / 1000) * moveSpeedTilesPerSec;

      if (this.stepProgress >= 1) {
        // Step finished
        spearow.gx = this.toGX;
        spearow.gy = this.toGY;
        spearow.x = this.toGX * TILE_SIZE - 16;
        spearow.y = this.toGY * TILE_SIZE - 16;
        spearow.hopY = 0;
        spearow.frame = 0;
        this.isMoving = false;
        this.stepProgress = 0;
        // Pause between wanders: 1.5s to 3.5s
        this.wanderCooldownMs = 1500 + Math.random() * 2000;
      } else {
        const curGX = this.fromGX + (this.toGX - this.fromGX) * this.stepProgress;
        const curGY = this.fromGY + (this.toGY - this.fromGY) * this.stepProgress;
        spearow.x = curGX * TILE_SIZE - 16;
        spearow.y = curGY * TILE_SIZE - 16;

        // Bird hopping arc as it steps
        spearow.hopY = -Math.sin(this.stepProgress * Math.PI) * 4;

        // Animate walk frames 0, 1, 2, 3
        spearow.frame = Math.floor(this.stepProgress * 4) % 4;
      }
      return;
    }

    // 4. Idle behaviors when stationary
    spearow.frame = 0;
    spearow.x = spearow.gx * TILE_SIZE - 16;
    spearow.y = spearow.gy * TILE_SIZE - 16;

    // Small hopping timer
    if (this.hopTimerMs > 0) {
      this.hopTimerMs -= dtMs;
      const t = Math.max(0, this.hopTimerMs / 220);
      spearow.hopY = -Math.sin(t * Math.PI) * 5;
      spearow.frame = this.hopTimerMs > 0 ? 1 : 0;
    } else {
      spearow.hopY = 0;
    }

    // Idle random looking around or quick bird hop
    this.idleAnimTimerMs -= dtMs;
    if (this.idleAnimTimerMs <= 0) {
      this.idleAnimTimerMs = 1200 + Math.random() * 1800;
      const roll = Math.random();
      if (roll < 0.45) {
        const dirs: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];
        spearow.direction = dirs[Math.floor(Math.random() * dirs.length)];
      } else if (roll < 0.70) {
        this.hopTimerMs = 220;
      }
    }

    // Check if cooldown expired to start next step
    this.wanderCooldownMs -= dtMs;
    if (this.wanderCooldownMs <= 0) {
      this.pickNextWanderStep(session);
    }
  }

  /**
   * Selects the next adjacent grid tile within wanderRadius for Spearow to wander.
   */
  private pickNextWanderStep(session: GameSession): void {
    const spearow = this.soloSpearowActor;
    if (!spearow) return;

    const wanderRadius = 3;
    const dirs: Array<{ dir: 0 | 1 | 2 | 3; dx: number; dy: number }> = [
      { dir: 0, dx: 0, dy: 1 },
      { dir: 1, dx: -1, dy: 0 },
      { dir: 2, dx: 1, dy: 0 },
      { dir: 3, dx: 0, dy: -1 },
    ];

    // Shuffle directions
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = dirs[i];
      dirs[i] = dirs[j];
      dirs[j] = temp;
    }

    for (const d of dirs) {
      const nextGX = spearow.gx + d.dx;
      const nextGY = spearow.gy + d.dy;

      // Keep within wander box around homeGX, homeGY
      if (
        Math.abs(nextGX - this.homeGX) > wanderRadius ||
        Math.abs(nextGY - this.homeGY) > wanderRadius
      ) {
        continue;
      }

      // Check field collisions if field available
      if (session.field) {
        if (session.field.isWater(nextGX, nextGY) || session.field.isHill(nextGX, nextGY)) {
          continue;
        }
      }

      // Do not step onto player, player target tile, or follower
      const pTargetGX = (session.player as any)?.targetGX ?? session.player.gx;
      const pTargetGY = (session.player as any)?.targetGY ?? session.player.gy;
      if (
        (nextGX === session.player.gx && nextGY === session.player.gy) ||
        (nextGX === pTargetGX && nextGY === pTargetGY) ||
        (session.follower && nextGX === session.follower.gx && nextGY === session.follower.gy)
      ) {
        continue;
      }

      // Valid step!
      this.fromGX = spearow.gx;
      this.fromGY = spearow.gy;
      this.toGX = nextGX;
      this.toGY = nextGY;
      this.stepProgress = 0;
      this.isMoving = true;
      spearow.direction = d.dir;
      return;
    }

    // If no valid step found, wait and try again
    this.wanderCooldownMs = 1200 + Math.random() * 1000;
  }

  /**
   * Step 3: Spearow attacks Pikachu -> Satoshi stops -> Pikachu shocks Spearow -> Swarm intensifies.
   */
  public async runScene_PikachuShockAndSwarm(session: GameSession): Promise<void> {
    this.phase = 'pikachu_shock';

    const pikaX = session.follower.x;
    const pikaY = session.follower.y;

    // 1. Spearow swoops in and attacks Pikachu
    spearowFlockDirector.triggerDiveAtTarget(pikaX, pikaY, () => {
      // Pikachu gets knocked back / cries
      battleSePlayer.playSound('Audio/Cries/PIKACHU.ogg', 0.9);
      if (session.follower) {
        session.follower.jumpY = -8;
      }
    });

    await new Promise((r) => setTimeout(r, 600));
    if (session.follower) session.follower.jumpY = 0;

    // 2. Satoshi stops: "Pikachu!"
    session.player.activeEmote = 'exclamation';
    session.player.emoteTimerMs = 2500;
    const ashShockedPortrait = STARTER_LAB_ASSETS.portraitAshShocked;

    await palletPrologueEventManager.showDialogue(
      'Satoshi',
      ['Pikachu!'],
      ashShockedPortrait,
      'right'
    );

    // 3. Pikachu retaliates with lightning shock!
    this.setScreenZap(true);
    battleSePlayer.playSound('Audio/SE/Thunder3.ogg', 1.0);
    battleSePlayer.playSound('Audio/SE/pikachu.mp3', 0.95);

    await new Promise((r) => setTimeout(r, 1200));

    this.setScreenZap(false);

    // 4. Satoshi: "Được rồi!"
    session.player.activeEmote = 'sparkle';
    await palletPrologueEventManager.showDialogue(
      'Satoshi',
      ['Được rồi!'],
      ashShockedPortrait,
      'right'
    );

    // 5. Onisuzume calls whole massive swarm
    battleSePlayer.playSound('Audio/Cries/SPEAROW.ogg', 1.0);
    this.triggerScreenShake(800);

    const ashRunningPortrait = STARTER_LAB_ASSETS.portraitAshRunning;
    await palletPrologueEventManager.showDialogue(
      'Satoshi',
      ['Chạy sao? Cố lên Pikachu, chắc chắn tớ sẽ cứu cậu!'],
      ashRunningPortrait,
      'right'
    );

    // 6. Final sprint to the waterfall
    await this.runScene_SprintAndWaterfall(session);
  }

  /**
   * Step 4: Pikachu sprints ahead faster, Satoshi follows, and both plunge into the waterfall!
   */
  public async runScene_SprintAndWaterfall(session: GameSession): Promise<void> {
    this.phase = 'waterfall_sprint';
    const ashRunningPortrait = STARTER_LAB_ASSETS.portraitAshRunning;

    // Pikachu runs ahead of Satoshi
    if (session.follower) {
      session.follower.snapTo(session.player.gx, session.player.gy - 3, 3);
    }

    // Satoshi dialogue
    await palletPrologueEventManager.showDialogue(
      'Satoshi',
      ['Tớ nói là tớ sẽ cứu cậu mà! Dừng lại, Onisuzume! Pikachu!'],
      ashRunningPortrait,
      'right'
    );

    // Both jump into the waterfall / water plunge
    battleSePlayer.playSound('Audio/SE/Waterfall.ogg', 1.0);

    // Screen fades completely to black via camera port
    await storyManager.getCameraPort().fadeScreen('out', '#000000', 1200);

    // ==========================================
    // MANGA CUTSCENE PAGE 1: Gặp gỡ Kasumi & Dòng Nước Lũ
    // ==========================================
    await palletPrologueEventManager.showMangaPage({
      badge: 'Chương 2: Gặp Gỡ Kasumi & Dòng Nước Lũ',
      imageSrc: ROUTE1_STORY_ASSETS.mangaPage1,
      lines: [
        {
          speaker: 'Kasumi',
          text: 'Ô kìa, cần câu giật mạnh quá! Con cá này to thật đấy... Hả?! Là một cậu nhóc và Pikachu?!',
          sfx: 'Audio/SE/Waterfall.ogg',
        },
        {
          speaker: 'Kasumi',
          text: 'Này! Cậu đi đứng kiểu gì mà để Pikachu bị thương nặng thế này hả?! Cậu không biết thương Pokemon à?!',
          sfx: 'Audio/SE/Exclaim.ogg',
        },
        {
          speaker: 'Satoshi',
          text: 'Tớ xin lỗi... Nhưng đàn Onisuzume... chúng đang đuổi theo bọn tớ kìa!!',
          sfx: 'Audio/SE/Thunder3.ogg',
        },
      ],
    });

    // ==========================================
    // MANGA CUTSCENE PAGE 2: Chiếc Xe Đạp & Cú Sét Định Mệnh Của Pikachu
    // ==========================================
    await palletPrologueEventManager.showMangaPage({
      badge: 'Chương 2: Sức Mạnh Định Mệnh Của Pikachu',
      imageSrc: ROUTE1_STORY_ASSETS.mangaPage2,
      lines: [
        {
          speaker: 'Satoshi',
          text: 'Cho tớ mượn chiếc xe đạp nhé! Pikachu, bám chắc vào!',
          sfx: 'Audio/SE/Select.ogg',
        },
        {
          speaker: 'Satoshi',
          text: 'Aaa! Xe bị trượt bánh rồi!! Pikachu!',
          sfx: 'Audio/SE/Battle flee.ogg',
        },
        {
          speaker: 'Satoshi',
          text: 'Lũ Onisuzume kia! Ta là Satoshi của thị trấn Masara! Hãy tấn công ta đi, đừng đụng vào Pikachu!',
          sfx: 'Audio/SE/Exclaim.ogg',
        },
        {
          speaker: 'Pikachu',
          text: 'Pika... CHUUUUUUUUUUUUUUUUUUUUUUU!!!!!!',
          sfx: 'Audio/SE/Thunder3.ogg',
        },
        {
          speaker: 'Satoshi',
          text: 'Chúng ta... làm được rồi, Pikachu. Từ giờ chúng ta là bạn thân nhất của nhau nhé!',
          sfx: 'Audio/Cries/PIKACHU.ogg',
        },
      ],
    });

    // ==========================================
    // DỊCH CHUYỂN NHÂN VẬT TỚI LỐI VÀO THÀNH PHỐ TIẾP THEO (CITY ENTRANCE)
    // ==========================================
    const nextVillage = this.getNextSettlement(session);
    // Player teleports to the entrance road of the city to naturally explore
    const targetGX = nextVillage.entranceGX ?? nextVillage.centerGX;
    const targetGY = nextVillage.entranceGY ?? nextVillage.centerGY;

    session.player.snapTo(targetGX, targetGY, 3);
    if (session.follower) {
      session.follower.snapTo(targetGX, targetGY + 1, 3);
      session.follower.visible = true;
    }
    session.camera.snapTo(session.player);
    session.chunkManager?.update?.(session.player.x, session.player.y);
    playerService.updatePosition(targetGX, targetGY, 3);

    // Fade camera back in via camera port
    await storyManager.getCameraPort().fadeScreen('in', '#000000', 1200);
    showBerryToast(`Chào mừng bạn đến với ${nextVillage.name}!`, '#38bdf8');

    // Register completion flags via atomic transaction per STORY_ARCHITECTURE_CONTRACT
    const tx = storyState.beginTransaction('act2.route1.spearow_encounter');
    tx.setFlag('act2.route1.spearow.defeated', true);
    tx.setFlag('act2.route1.flock.escaped', true);
    tx.setFlag('act2.route1.completed', true);
    tx.setFlag('act2.route1.arrived_next_village', true);
    tx.setFlag('story_wild_spawns_suppressed', false);
    await tx.commit();

    storyLockManager.releaseAllForOwner('act2.route1.spearow_encounter');
    spearowFlockDirector.clear();
    this.phase = 'completed';
    this.isRunning = false;

    // Satoshi dialogue when arriving at the city entrance
    await palletPrologueEventManager.showDialogue(
      'Satoshi',
      ['Pikachu, chúng ta tới Thành phố rồi! Nhìn kìa, Trung tâm Pokémon và Đồn Cảnh Sát ở ngay phía trước! Mau vào thôi!'],
      STARTER_LAB_ASSETS.portraitAshShocked,
      'right'
    );
  }

  /**
   * Resolves the next settlement along Route 1 heading north (Verdant Town / Viridian City).
   */
  public getNextSettlement(session: GameSession): VillagePlacement {
    const seed = session.seed;
    const field = session.field;
    const startVillage = getStartVillagePlacement(seed);
    const playerGY = session.player.gy;

    // 1. Dynamic open-world settlements north of Route 1 (field.continentPlan / V4 / V5)
    if (field) {
      const settlements = getNearbySettlements(session.player.gx, playerGY - 96, field);
      const northSettlements = settlements.filter(
        (s) => s.name !== startVillage.name && s.bounds.maxGY < startVillage.bounds.minGY
      );
      if (northSettlements.length > 0) {
        // Pick the closest north settlement to player's current position
        northSettlements.sort((a, b) => {
          const distA = Math.hypot(a.centerGX - session.player.gx, a.centerGY - playerGY);
          const distB = Math.hypot(b.centerGX - session.player.gx, b.centerGY - playerGY);
          return distA - distB;
        });
        return northSettlements[0];
      }
    }

    // 2. Legacy highway cycle settlements (k = -1, -2...)
    for (let k = -1; k >= -5; k--) {
      const v = getVillagePlacement(k, seed);
      if (v && v.centerGY < startVillage.bounds.minGY) {
        return v;
      }
    }

    // 3. Fallback: cycle 0 or start village
    return getVillagePlacement(0, seed) ?? startVillage;
  }

  /**
   * Renders solo Spearow and flock AI in overworld canvas.
   */
  public render(ctx: CanvasRenderingContext2D, camera?: { x: number; y: number }): void {
    // NOTE: the renderer already applied `camera.applyTransform(ctx)`, so all
    // drawing here happens in WORLD coordinates (do not subtract camera.x/y).
    // Render solo Spearow if active
    if (this.soloSpearowActor && this.soloSpearowActor.visible && !playerService.hasFlag('route1_flock_escaped')) {
      const shakeX = this.isShocking ? (Math.random() - 0.5) * 8 : 0;
      const shakeY = this.isShocking ? (Math.random() - 0.5) * 8 : 0;
      const hopY = this.soloSpearowActor.hopY ?? 0;
      const screenX = Math.round(this.soloSpearowActor.x + shakeX);
      const screenY = Math.round(this.soloSpearowActor.y + hopY + shakeY);

      // Shadow stays grounded under the bird
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(screenX + 32, Math.round(this.soloSpearowActor.y + 54), 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sprite
      const img = this.spriteImage;
      if (img && img.complete && img.naturalWidth > 0) {
        const frameW = img.naturalWidth / 4;
        const frameH = img.naturalHeight / 4;
        ctx.drawImage(
          img,
          this.soloSpearowActor.frame * frameW,
          this.soloSpearowActor.direction * frameH,
          frameW,
          frameH,
          screenX,
          screenY,
          64,
          64
        );
      } else {
        // Fallback procedural placeholder
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(screenX + 32, screenY + 32, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Emote
      if (this.soloSpearowActor.activeEmote && this.soloSpearowActor.emoteTimerMs && this.soloSpearowActor.emoteTimerMs > 0) {
        drawNPCEmoteBubble(
          ctx,
          screenX + 32,
          screenY + 14,
          this.soloSpearowActor.activeEmote,
          this.soloSpearowActor.emoteTimerMs
        );
      }
    }

    // Render overworld lightning bolts during shock
    if (this.isShocking && this.shockSource && this.shockTarget) {
      this.renderLightningStrike(ctx, this.shockSource, this.shockTarget);
    }

    // Render Spearow flock
    spearowFlockDirector.render(ctx, camera);
  }

  private renderLightningStrike(
    ctx: CanvasRenderingContext2D,
    src: { x: number; y: number },
    dst: { x: number; y: number }
  ): void {
    ctx.save();

    const dx = dst.x - src.x;
    const dy = dst.y - src.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      ctx.restore();
      return;
    }

    const segments = 8;
    const nx = -dy / dist;
    const ny = dx / dist;

    // Draw 3 branching electric arcs
    for (let bolt = 0; bolt < 3; bolt++) {
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);

      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const jitter = (Math.random() - 0.5) * 36;
        const px = src.x + dx * t + nx * jitter;
        const py = src.y + dy * t + ny * jitter;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(dst.x, dst.y);

      // Outer electric glow
      ctx.strokeStyle = bolt === 1 ? '#67e8f9' : '#facc15';
      ctx.lineWidth = bolt === 0 ? 5 : 3;
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#fef08a';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Inner white core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#ffffff';
      ctx.stroke();
    }

    // Electric sparks around Spearow
    for (let s = 0; s < 6; s++) {
      const angle = Math.random() * Math.PI * 2;
      const sparkDist = 6 + Math.random() * 24;
      const sx = dst.x + Math.cos(angle) * sparkDist;
      const sy = dst.y + Math.sin(angle) * sparkDist;

      ctx.fillStyle = s % 2 === 0 ? '#fef08a' : '#67e8f9';
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export const route1SpearowEventManager = Route1SpearowEventManager.getInstance();
