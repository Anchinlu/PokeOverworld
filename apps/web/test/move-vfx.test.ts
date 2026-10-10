import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveMoveVfx,
  MOVE_VFX_REGISTRY,
  TYPE_FALLBACK_VFX,
  moveVfxCache,
  isSelfTargetMove,
} from '../src/battle/move-vfx';
import { MoveAnimationManager } from '../src/battle/move-animation-manager';
import { BattleState } from '../src/battle/battle-state';
import { BattleEngine, type TurnResult } from '../src/battle/battle-engine';
import { BattleController } from '../src/battle/battle-controller';
import { createBattler } from '../src/battle/battle-factory';
import { getBattleEnvironment } from '../src/battle';
import { PokemonSpriteAnimator } from '../src/ui/pokedex/pokedex-sprite';
import type { BattleMove } from '../src/battle/types';

function defMove(move: Omit<BattleMove, 'description'> & { description?: string }): BattleMove {
  return {
    description: '',
    ...move,
  };
}

describe('Move Visual FX (VFX) & Animation Engine', () => {
  describe('resolveMoveVfx() & Registry mapping', () => {
    it('resolves dedicated move definitions with correct RPG Maker XP cell standard (192x192)', () => {
      const thunderbolt = defMove({
        id: 'thunderbolt',
        name: 'Thunderbolt',
        type: 'Electric',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
      });

      const vfx = resolveMoveVfx(thunderbolt);
      expect(vfx).toBeDefined();
      expect(vfx?.cellWidth).toBe(192);
      expect(vfx?.cellHeight).toBe(192);
      expect(vfx?.columns).toBe(5);
      expect(vfx?.totalFrames).toBe(6);
      expect(vfx?.target).toBe('defender');
      expect(vfx?.blendMode).toBe('lighter');
      expect(vfx?.screenFlash?.color).toContain('rgba(254, 240, 138');
      expect(vfx?.screenShake?.amp).toBe(5);
    });

    it('uses dedicated shock animation electric1 for thunder_shock', () => {
      const thunderShock = defMove({
        id: 'thunder_shock',
        name: 'Thunder Shock',
        type: 'Electric',
        category: 'special',
        power: 40,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
      });
      const vfx = resolveMoveVfx(thunderShock);
      expect(vfx?.spriteUrl).toBe('Graphics/Animations/electric1.png');
      expect(vfx?.columns).toBe(5);
      expect(vfx?.totalFrames).toBe(8);
    });

    it('uses dedicated battle scratch animation with 5 active frames for scratch', () => {
      const scratch = defMove({
        id: 'scratch',
        name: 'Scratch',
        type: 'Normal',
        category: 'physical',
        power: 40,
        accuracy: 100,
        pp: 35,
        maxPp: 35,
      });
      const vfx = resolveMoveVfx(scratch);
      expect(vfx?.spriteUrl).toBe('Graphics/Animations/scratchbattle.png');
      expect(vfx?.columns).toBe(5);
      expect(vfx?.totalFrames).toBe(5);
    });

    it('uses dedicated slash animation zan03 for slash', () => {
      const slash = defMove({
        id: 'slash',
        name: 'Slash',
        type: 'Normal',
        category: 'physical',
        power: 70,
        accuracy: 100,
        pp: 20,
        maxPp: 20,
      });
      const vfx = resolveMoveVfx(slash);
      expect(vfx?.spriteUrl).toBe('Graphics/Animations/zan03.png');
      expect(vfx?.columns).toBe(4);
      expect(vfx?.totalFrames).toBe(4);
    });

    it('normalizes move IDs with upper-case, spaces, and hyphens', () => {
      const testCases = ['THUNDERBOLT', 'Thunder-Bolt', 'Thunder bolt', 'thunder_bolt'];

      for (const id of testCases) {
        const move = defMove({
          id,
          name: 'Thunderbolt',
          type: 'Electric',
          category: 'special',
          power: 90,
          accuracy: 100,
          pp: 15,
          maxPp: 15,
        });
        const vfx = resolveMoveVfx(move);
        expect(vfx).toBe(MOVE_VFX_REGISTRY.thunderbolt);
      }
    });

    it('identifies projectile, melee, and healing target modes correctly', () => {
      const flameThrower = defMove({
        id: 'flamethrower',
        name: 'Flamethrower',
        type: 'Fire',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
      });
      expect(resolveMoveVfx(flameThrower)?.target).toBe('projectile');

      const ember = defMove({
        id: 'ember',
        name: 'Ember',
        type: 'Fire',
        category: 'special',
        power: 40,
        accuracy: 100,
        pp: 25,
        maxPp: 25,
      });
      expect(resolveMoveVfx(ember)?.target).toBe('projectile');
      expect(resolveMoveVfx(ember)?.spriteUrl).toBe('Graphics/Animations/Flames.png');

      const tackle = defMove({
        id: 'tackle',
        name: 'Tackle',
        type: 'Normal',
        category: 'physical',
        power: 40,
        accuracy: 100,
        pp: 35,
        maxPp: 35,
      });
      expect(resolveMoveVfx(tackle)?.target).toBe('defender');
      expect(resolveMoveVfx(tackle)?.spriteUrl).toBe('Graphics/Animations/Tackle_B.png');

      const recover = defMove({
        id: 'recover',
        name: 'Recover',
        type: 'Normal',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
      });
      expect(resolveMoveVfx(recover)?.target).toBe('attacker');
    });

    it('resolves authentic animations from Essentials database (e.g. discharge, future_sight)', () => {
      const dischargeMove = defMove({
        id: 'discharge',
        name: 'Discharge',
        type: 'Electric',
        category: 'special',
        power: 80,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
      });
      const dischargeVfx = resolveMoveVfx(dischargeMove);
      expect(dischargeVfx).toBeDefined();
      expect(dischargeVfx?.spriteUrl).toBe('Graphics/Animations/electric1.png');
      expect(dischargeVfx?.target).toBe('projectile');

      const futureSightMove = defMove({
        id: 'future_sight',
        name: 'Future Sight',
        type: 'Psychic',
        category: 'special',
        power: 120,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
      });
      const futureSightVfx = resolveMoveVfx(futureSightMove);
      expect(futureSightVfx).toBeDefined();
      expect(futureSightVfx?.spriteUrl).toBe('Graphics/Animations/face and eye.png');
    });

    it('falls back to elemental type animations when move is completely custom / unlisted', () => {
      const unlistedElectricMove = defMove({
        id: 'custom_electric_spell',
        name: 'Custom Electric Spell',
        type: 'Electric',
        category: 'special',
        power: 80,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
      });
      const electricVfx = resolveMoveVfx(unlistedElectricMove);
      expect(electricVfx).toBe(TYPE_FALLBACK_VFX.Electric);
      expect(electricVfx?.spriteUrl).toBe('Graphics/Animations/017-Thunder01.png');

      const unlistedIceMove = defMove({
        id: 'custom_ice_shards',
        name: 'Custom Ice Shards',
        type: 'Ice',
        category: 'special',
        power: 40,
        accuracy: 100,
        pp: 25,
        maxPp: 25,
      });
      const iceVfx = resolveMoveVfx(unlistedIceMove);
      expect(iceVfx).toBe(TYPE_FALLBACK_VFX.Ice);
      expect(iceVfx?.spriteUrl).toBe('Graphics/Animations/Ice1.png');
      expect(iceVfx?.columns).toBe(5);
      expect(iceVfx?.totalFrames).toBe(9);
    });

    it('returns null for an unlisted move with no registered type fallback', () => {
      const customPsychicMove = defMove({
        id: 'custom_psychic_mystery',
        name: 'Custom Psychic Mystery',
        type: 'Psychic',
        category: 'special',
        power: 120,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
      });
      expect(resolveMoveVfx(customPsychicMove)).toBeNull();
    });
  });

  describe('MoveAnimationManager integration', () => {
    let manager: MoveAnimationManager;

    beforeEach(() => {
      manager = new MoveAnimationManager();
    });

    it('attaches resolved VFX to physical, special, and status animation plans', () => {
      const tackle = defMove({
        id: 'tackle',
        name: 'Tackle',
        type: 'Normal',
        category: 'physical',
        power: 40,
        accuracy: 100,
        pp: 35,
        maxPp: 35,
      });
      const tacklePlan = manager.resolveAnimationPlan(tackle, true);
      expect(tacklePlan.category).toBe('physical');
      expect(tacklePlan.attackerLunges).toBe(true);
      expect(tacklePlan.defenderTakesHit).toBe(true);
      expect(tacklePlan.vfx?.spriteUrl).toBe('Graphics/Animations/Tackle_B.png');

      const thunderbolt = defMove({
        id: 'thunderbolt',
        name: 'Thunderbolt',
        type: 'Electric',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
      });
      const boltPlan = manager.resolveAnimationPlan(thunderbolt, true);
      expect(boltPlan.category).toBe('special');
      expect(boltPlan.attackerLunges).toBe(false);
      expect(boltPlan.defenderTakesHit).toBe(true);
      expect(boltPlan.vfx?.spriteUrl).toBe('Graphics/Animations/017-Thunder01.png');

      const recover = defMove({
        id: 'recover',
        name: 'Recover',
        type: 'Normal',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
      });
      const recoverPlan = manager.resolveAnimationPlan(recover, false);
      expect(recoverPlan.category).toBe('status');
      expect(recoverPlan.attackerLunges).toBe(false);
      expect(recoverPlan.defenderTakesHit).toBe(false);
      expect(recoverPlan.vfx?.spriteUrl).toBe('Graphics/Animations/anim sheet.png');
    });

    it('supports custom overrides while preserving VFX pipeline', () => {
      const customMove = defMove({
        id: 'CUSTOM_STRIKE',
        name: 'Custom Strike',
        type: 'Electric',
        category: 'physical',
        power: 100,
        accuracy: 100,
        pp: 5,
        maxPp: 5,
      });

      manager.registerOverride('CUSTOM_STRIKE', {
        customAnimationId: 'ORBITAL_BEAM',
      });

      const plan = manager.resolveAnimationPlan(customMove);
      expect(plan.customAnimationId).toBe('ORBITAL_BEAM');
      expect(plan.vfx).toBe(TYPE_FALLBACK_VFX.Electric);
    });
  });

  describe('Control Status Hindrance & Attack Blocking', () => {
    it('sets actionPrevented: true and generates status_hindered event when attacker is asleep', () => {
      const pika = createBattler('PIKACHU', 15, true);
      const enemy = createBattler('PIDGEY', 15, false);
      pika.status = 'sleep';
      pika.sleepTurns = 2;

      const engine = new BattleEngine(pika, enemy, getBattleEnvironment('meadow'));
      const move = pika.moves[0];
      const result: TurnResult = engine.executeAttack(pika, enemy, move);

      expect(result.actionPrevented).toBe(true);
      expect(result.damage).toBe(0);
      expect(result.events.some((e) => e.type === 'status_hindered')).toBe(true);
      expect(result.message).toContain('đang ngủ say');
    });

    it('sets actionPrevented: true when attacker must recharge', () => {
      const pika = createBattler('PIKACHU', 15, true);
      const enemy = createBattler('PIDGEY', 15, false);
      pika.mustRecharge = true;

      const engine = new BattleEngine(pika, enemy, getBattleEnvironment('meadow'));
      const move = pika.moves[0];
      const result: TurnResult = engine.executeAttack(pika, enemy, move);

      expect(result.actionPrevented).toBe(true);
      expect(result.damage).toBe(0);
      expect(result.events.some((e) => e.type === 'recharge_hindered')).toBe(true);
      expect(result.message).toContain('nạp lại năng lượng');
    });

    it('sets actionPrevented: true when attacker is flinched', () => {
      const pika = createBattler('PIKACHU', 15, true);
      const enemy = createBattler('PIDGEY', 15, false);
      pika.isFlinched = true;

      const engine = new BattleEngine(pika, enemy, getBattleEnvironment('meadow'));
      const move = pika.moves[0];
      const result: TurnResult = engine.executeAttack(pika, enemy, move);

      expect(result.actionPrevented).toBe(true);
      expect(result.damage).toBe(0);
      expect(result.events.some((e) => e.type === 'status_hindered')).toBe(true);
      expect(result.message).toContain('nao núng');
    });

    it('prevents attacker lunge motion and move VFX when executed via BattleController while incapacitated', () => {
      const state = new BattleState();
      const pika = createBattler('PIKACHU', 15, true);
      const enemy = createBattler('PIDGEY', 15, false);
      pika.status = 'sleep';
      pika.sleepTurns = 2;

      const engine = new BattleEngine(pika, enemy, getBattleEnvironment('meadow'));
      const mockCanvas = {
        addEventListener: () => {},
        removeEventListener: () => {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 512, height: 384 }),
      } as unknown as HTMLCanvasElement;

      const controller = new BattleController(state, engine, mockCanvas, () => {});
      const tackle = pika.moves.find((m) => m.id === 'tackle') ?? pika.moves[0];

      // Execute attack through controller
      (
        controller as unknown as { executePlayerAttack: (m: BattleMove, cb: () => void) => void }
      ).executePlayerAttack(tackle, () => {});

      // Attacker must NOT lunge forward or advance attackTick
      expect(state.playerAttackTick).toBe(0);
      expect(state.playerLungeX).toBe(0);
      expect(state.playerLungeY).toBe(0);

      // Move VFX must NOT be initiated
      expect(state.activeMoveVfx).toBeNull();

      // State queued the sleep notification message
      expect(state.messageText).toContain('đang ngủ say');

      controller.destroy();
    });
  });

  describe('BattleState Move VFX update loop & timing', () => {
    let state: BattleState;

    beforeEach(() => {
      state = new BattleState();
    });

    it('triggers screen flash and screen shake timers correctly', () => {
      state.triggerScreenFlash('rgba(255, 255, 255, 0.5)', 4);
      expect(state.screenFlashColor).toBe('rgba(255, 255, 255, 0.5)');
      expect(state.screenFlashTimer).toBe(4);

      state.updateTick();
      expect(state.screenFlashTimer).toBe(3);

      state.triggerScreenShake(6, 5);
      expect(state.screenShakeTimer).toBe(6);
      expect(state.screenShakeAmp).toBe(5);

      state.updateTick();
      expect(state.screenShakeTimer).toBe(5);
    });

    it('advances VFX frames and triggers onImpact midway through animation', () => {
      const onImpact = vi.fn();
      const onComplete = vi.fn();

      const mockImage = { src: 'test.png', width: 960, height: 384 } as unknown as HTMLImageElement;

      // 4 frames total, 2 ticks per frame -> total 8 ticks
      // impactFrame = floor(4 * 0.5) = 2
      state.startMoveVfx({
        image: mockImage,
        cellWidth: 192,
        cellHeight: 192,
        columns: 4,
        totalFrames: 4,
        currentFrame: 0,
        frameTick: 0,
        ticksPerFrame: 2,
        startX: 130,
        startY: 215,
        targetX: 380,
        targetY: 115,
        isProjectile: true,
        scale: 1.0,
        blendMode: 'source-over',
        onImpact,
        onComplete,
      });

      expect(state.activeMoveVfx).not.toBeNull();
      expect(onImpact).not.toHaveBeenCalled();

      // Tick 1: frameTick = 1, currentFrame = 0
      state.updateTick();
      expect(state.activeMoveVfx?.currentFrame).toBe(0);
      expect(onImpact).not.toHaveBeenCalled();

      // Tick 2: frameTick reaches 2 -> currentFrame = 1
      state.updateTick();
      expect(state.activeMoveVfx?.currentFrame).toBe(1);
      expect(onImpact).not.toHaveBeenCalled();

      // Tick 3: frameTick = 1, currentFrame = 1
      state.updateTick();

      // Tick 4: frameTick reaches 2 -> currentFrame = 2 (impactFrame)
      state.updateTick();
      expect(state.activeMoveVfx?.currentFrame).toBe(2);
      expect(onImpact).toHaveBeenCalledTimes(1);

      // Tick 5: frameTick = 1, currentFrame = 2
      state.updateTick();

      // Tick 6: frameTick reaches 2 -> currentFrame = 3
      state.updateTick();
      expect(state.activeMoveVfx?.currentFrame).toBe(3);

      // Tick 7: frameTick = 1, currentFrame = 3
      state.updateTick();

      // Tick 8: frameTick reaches 2 -> currentFrame = 4 >= totalFrames -> finish
      state.updateTick();
      expect(state.activeMoveVfx).toBeNull();
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('MoveVfxAssetCache', () => {
    it('caches and returns identical HTMLImageElement for duplicate requests', () => {
      const url = 'Graphics/Animations/017-Thunder01.png';
      const img1 = moveVfxCache.getImage(url);
      const img2 = moveVfxCache.getImage(url);

      expect(img1).toBeDefined();
      expect(img1).toBe(img2);
      expect(img1.src).toContain('017-Thunder01.png');
    });
  });

  describe('Move Animation Duration & Pacing', () => {
    it('ensures all registered moves last >= 20 ticks (>= 0.33s) and no move disappears prematurely', () => {
      for (const [key, vfx] of Object.entries(MOVE_VFX_REGISTRY)) {
        const totalDurationTicks = vfx.totalFrames * vfx.ticksPerFrame;
        expect(
          totalDurationTicks,
          `Move "${key}" duration (${totalDurationTicks} ticks) is too short!`
        ).toBeGreaterThanOrEqual(20);
        expect(vfx.ticksPerFrame).toBeGreaterThanOrEqual(3);
      }
    });

    it('ensures fast physical moves have ticksPerFrame >= 4 for visual impact', () => {
      expect(MOVE_VFX_REGISTRY.tackle.ticksPerFrame).toBe(4);
      expect(MOVE_VFX_REGISTRY.scratch.ticksPerFrame).toBe(6);
      expect(MOVE_VFX_REGISTRY.slash.ticksPerFrame).toBe(6);
      expect(MOVE_VFX_REGISTRY.quick_attack.ticksPerFrame).toBe(4);
    });

    it('ensures projectile moves have sufficient flight duration across screen', () => {
      const emberTicks =
        MOVE_VFX_REGISTRY.ember.totalFrames * MOVE_VFX_REGISTRY.ember.ticksPerFrame;
      const flamethrowerTicks =
        MOVE_VFX_REGISTRY.flamethrower.totalFrames * MOVE_VFX_REGISTRY.flamethrower.ticksPerFrame;
      const shadowBallTicks =
        MOVE_VFX_REGISTRY.shadow_ball.totalFrames * MOVE_VFX_REGISTRY.shadow_ball.ticksPerFrame;
      const waterGunTicks =
        MOVE_VFX_REGISTRY.water_gun.totalFrames * MOVE_VFX_REGISTRY.water_gun.ticksPerFrame;

      expect(emberTicks).toBeGreaterThanOrEqual(24);
      expect(flamethrowerTicks).toBeGreaterThanOrEqual(40);
      expect(shadowBallTicks).toBeGreaterThanOrEqual(35);
      expect(waterGunTicks).toBeGreaterThanOrEqual(42);
    });
  });

  describe('Shiny Pokémon Animation Pacing & Synchronization', () => {
    it('synchronizes faint frozen frame with shiny frame divisor (8 vs 4)', () => {
      const state = new BattleState();
      state.tick = 32;

      // Enemy normal: 32 / 4 = 8
      state.startEnemyFaint(undefined, false);
      expect(state.enemyFrozenFrame).toBe(8);

      // Enemy shiny: 32 / 8 = 4 (matches half-frame strip speed)
      state.startEnemyFaint(undefined, true);
      expect(state.enemyFrozenFrame).toBe(4);

      // Player normal: 32 / 4 = 8
      state.startPlayerFaint(undefined, false);
      expect(state.playerFrozenFrame).toBe(8);

      // Player shiny: 32 / 8 = 4
      state.startPlayerFaint(undefined, true);
      expect(state.playerFrozenFrame).toBe(4);
    });

    it('PokemonSpriteAnimator scales frame duration for shiny sprites to match normal cadence', () => {
      const mockCanvas = {
        getContext: () => ({ imageSmoothingEnabled: false }),
      } as unknown as HTMLCanvasElement;

      const animator = new PokemonSpriteAnimator(mockCanvas);

      // Normal sprite path
      animator.load('Graphics/Pokemon/Front/025.png');
      expect(animator.getFrameDuration()).toBe(45);

      // Shiny sprite path by URL
      animator.load('Graphics/Pokemon/Front shiny/025.png');
      expect(animator.getFrameDuration()).toBe(90);

      // Shiny explicitly provided as true
      animator.load('Graphics/Pokemon/Front/025.png', true);
      expect(animator.getFrameDuration()).toBe(90);

      // Normal explicitly provided as false
      animator.load('Graphics/Pokemon/Front shiny/025.png', false);
      expect(animator.getFrameDuration()).toBe(45);
    });
  });

  describe('Self-Targeting Move Animations (Protect, Buffs, Recovery, Screens)', () => {
    it('classifies self-targeting moves correctly with isSelfTargetMove', () => {
      const protect = defMove({ id: 'protect', name: 'Protect', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 10, maxPp: 10 });
      const detect = defMove({ id: 'detect', name: 'Detect', type: 'Fighting', category: 'status', power: 0, accuracy: 100, pp: 5, maxPp: 5 });
      const swordsDance = defMove({ id: 'swords_dance', name: 'Swords Dance', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 20, maxPp: 20 });
      const ironDefense = defMove({ id: 'iron_defense', name: 'Iron Defense', type: 'Steel', category: 'status', power: 0, accuracy: 100, pp: 15, maxPp: 15 });
      const calmMind = defMove({ id: 'calm_mind', name: 'Calm Mind', type: 'Psychic', category: 'status', power: 0, accuracy: 100, pp: 20, maxPp: 20 });
      const substitute = defMove({ id: 'substitute', name: 'Substitute', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 10, maxPp: 10 });
      const recover = defMove({ id: 'recover', name: 'Recover', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 10, maxPp: 10 });
      const tackle = defMove({ id: 'tackle', name: 'Tackle', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 35, maxPp: 35 });

      expect(isSelfTargetMove(protect)).toBe(true);
      expect(isSelfTargetMove(detect)).toBe(true);
      expect(isSelfTargetMove(swordsDance)).toBe(true);
      expect(isSelfTargetMove(ironDefense)).toBe(true);
      expect(isSelfTargetMove(calmMind)).toBe(true);
      expect(isSelfTargetMove(substitute)).toBe(true);
      expect(isSelfTargetMove(recover)).toBe(true);
      expect(isSelfTargetMove(tackle)).toBe(false);
    });

    it('resolves self moves to target: "attacker" so animations render on the user instead of opponent', () => {
      const protect = defMove({ id: 'protect', name: 'Protect', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 10, maxPp: 10 });
      const detect = defMove({ id: 'detect', name: 'Detect', type: 'Fighting', category: 'status', power: 0, accuracy: 100, pp: 5, maxPp: 5 });
      const swordsDance = defMove({ id: 'swords_dance', name: 'Swords Dance', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 20, maxPp: 20 });
      const substitute = defMove({ id: 'substitute', name: 'Substitute', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 10, maxPp: 10 });

      expect(resolveMoveVfx(protect)?.target).toBe('attacker');
      expect(resolveMoveVfx(detect)?.target).toBe('attacker');
      expect(resolveMoveVfx(swordsDance)?.target).toBe('attacker');
      expect(resolveMoveVfx(substitute)?.target).toBe('attacker');
    });

    it('positions Protect animation on the player when player casts, and on the enemy when enemy casts', () => {
      const pika = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(pika, enemy, getBattleEnvironment('meadow'));
      const state = new BattleState(engine.rng);
      const mockCanvas = {
        addEventListener: () => {},
        removeEventListener: () => {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 512, height: 384 }),
      } as unknown as HTMLCanvasElement;

      const controller = new BattleController(state, engine, mockCanvas, () => {});
      const protect = defMove({ id: 'protect', name: 'Protect', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 10, maxPp: 10 });

      // 1. Player uses Protect -> animation must be positioned at playerCenter (130, 215)
      (controller as any).playMoveVfx(protect, 'player', () => {});
      expect(state.activeMoveVfx).toBeDefined();
      expect(state.activeMoveVfx?.targetX).toBe(130);
      expect(state.activeMoveVfx?.targetY).toBe(215);

      // 2. Enemy uses Protect -> animation must be positioned at enemyCenter (380, 115)
      (controller as any).playMoveVfx(protect, 'enemy', () => {});
      expect(state.activeMoveVfx).toBeDefined();
      expect(state.activeMoveVfx?.targetX).toBe(380);
      expect(state.activeMoveVfx?.targetY).toBe(115);

      controller.destroy();
    });
  });
});
