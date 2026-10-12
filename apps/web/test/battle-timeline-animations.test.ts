import { describe, it, expect } from 'vitest';
import {
  ANIMATION_REGISTRY,
  CoordinateTransformer,
  LayerManager,
  CelRenderer,
  BattleAnimationPlayer,
  getBattlerCenter,
  DEFAULT_PLAYER_GEOMETRY,
  DEFAULT_ENEMY_GEOMETRY,
  type BattleAnimationDefinition,
  type AnimationCel,
} from '../src/battle/animation';
import atlasData from '../../../packages/game-data/animation-atlas.json';
import moveMapData from '../../../packages/game-data/move-animation-map.json';
import fallbackData from '../../../packages/game-data/animation-fallbacks.json';
import acidAnimation from '../../../packages/game-data/animations/24.json';

describe('Battle Timeline Animation System (Essentials/EBDX Engine)', () => {
  describe('1. Move to Animation Mapping & Opponent Variants', () => {
    it('resolves correct canonical animation ID for standard moves', () => {
      expect(ANIMATION_REGISTRY.resolveAnimationId('tackle')).toBe(275);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flamethrower')).toBe(116);
      expect(ANIMATION_REGISTRY.resolveAnimationId('absorb')).toBe(23);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hydro_pump')).toBe(159);
      expect(ANIMATION_REGISTRY.resolveAnimationId('thunderbolt')).toBe(280);
      expect(ANIMATION_REGISTRY.resolveAnimationId('shadow_ball')).toBe(241);
    });

    it('resolves specialized OppMove variant when used by enemy battlers', () => {
      // Regular player variant vs enemy OppMove variant
      const playerFlamethrower = ANIMATION_REGISTRY.resolveAnimationId('flamethrower', false);
      const enemyFlamethrower = ANIMATION_REGISTRY.resolveAnimationId('flamethrower', true);
      expect(playerFlamethrower).toBe(116);
      expect(enemyFlamethrower).toBe(117);

      const playerWaterGun = ANIMATION_REGISTRY.resolveAnimationId('water_gun', false);
      const enemyWaterGun = ANIMATION_REGISTRY.resolveAnimationId('water_gun', true);
      expect(playerWaterGun).toBe(291);
      expect(enemyWaterGun).toBe(292);

      const playerGrowl = ANIMATION_REGISTRY.resolveAnimationId('growl', false);
      const enemyGrowl = ANIMATION_REGISTRY.resolveAnimationId('growl', true);
      expect(playerGrowl).toBe(148);
      expect(enemyGrowl).toBe(149);
    });

    it('falls back gracefully by Type and Category when a move has no direct animation', () => {
      // Unmapped move with Type 'Water' and Category 'special' -> fallback to watergun (291)
      const animId = ANIMATION_REGISTRY.resolveAnimationId(
        'custom_bubble_blast',
        false,
        'WATER',
        'special'
      );
      expect(animId).toBe(291);

      // Unmapped move with Type 'Fire' and Category 'status' -> fallback to willowisp (295)
      const fireStatusAnim = ANIMATION_REGISTRY.resolveAnimationId(
        'custom_heat_dance',
        false,
        'FIRE',
        'status'
      );
      expect(fireStatusAnim).toBe(295);

      // Completely unmapped move with unknown type -> fallback to tackle (275)
      const defaultAnim = ANIMATION_REGISTRY.resolveAnimationId('unknown_glitch_move');
      expect(defaultAnim).toBe(275);
    });

    it('contains all 212 standard moves and 18 opponent variants in mapping files', () => {
      const regKeys = Object.keys(moveMapData.moves);
      const oppKeys = Object.keys(moveMapData.opponentMoves);
      expect(regKeys.length).toBe(212);
      expect(oppKeys.length).toBe(18);
      expect(Object.keys(fallbackData).length).toBe(17);
    });
  });

  describe('2. Atlas Metadata & Spritesheet Dimension Validity', () => {
    it('verifies atlas entries have positive dimensions and valid grid geometry', () => {
      const entries = Object.entries(atlasData);
      expect(entries.length).toBeGreaterThanOrEqual(95);

      for (const [_name, meta] of entries) {
        expect(meta.width).toBeGreaterThan(0);
        expect(meta.height).toBeGreaterThan(0);
        expect(meta.cellWidth).toBeGreaterThan(0);
        expect(meta.cellHeight).toBeGreaterThan(0);
        expect(meta.columns).toBeGreaterThanOrEqual(1);
        expect(meta.rows).toBeGreaterThanOrEqual(1);
        expect(meta.maxPattern).toBe(meta.columns * meta.rows);
        expect(meta.assetKey).toContain('animation.');
        expect(meta.file.toLowerCase()).toContain('.png');
      }
    });

    it('imports missing both-focus coordinates as an in-battle trajectory', () => {
      const bothFocusCels = acidAnimation.frames.flatMap((frame) =>
        frame.cels.filter((cel) => cel.focus === 'both')
      );

      expect(bothFocusCels.length).toBeGreaterThan(0);
      expect(bothFocusCels.every((cel) => cel.x !== 0 && cel.y !== 0)).toBe(true);
      expect(bothFocusCels[0]).toMatchObject({ x: 128, y: 224 });
      expect(Math.max(...bothFocusCels.map((cel) => cel.x))).toBeGreaterThan(320);
    });

    it('uses a corrected Energy Ball projectile path for battle and gallery', async () => {
      const energyBall = await ANIMATION_REGISTRY.getDefinition(98);
      expect(energyBall).not.toBeNull();
      expect(energyBall?.graphic).toBe('fly copy');

      const projectileCels = (energyBall?.frames ?? [])
        .map((frame) => frame.cels.find((cel) => cel.pattern >= 0))
        .filter((cel): cel is AnimationCel => cel !== undefined);

      expect(projectileCels).toHaveLength(10);
      expect(projectileCels.map((cel) => cel.pattern)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(projectileCels.every((cel) => cel.focus === 'both')).toBe(true);
      expect(projectileCels[0]).toMatchObject({ x: 128, y: 224 });
      expect(projectileCels[projectileCels.length - 1]).toMatchObject({ x: 384, y: 96 });
      expect(projectileCels[projectileCels.length - 1].x).toBeGreaterThan(projectileCels[0].x);
    });
  });

  describe('3. Coordinate Transformation & Perspective Projection', () => {
    const playerCenter = getBattlerCenter(DEFAULT_PLAYER_GEOMETRY); // { x: 130, y: 215 }
    const enemyCenter = getBattlerCenter(DEFAULT_ENEMY_GEOMETRY); // { x: 380, y: 115 }

    it('validates standard battler geometry centers match battle layout', () => {
      expect(playerCenter).toEqual({ x: 130, y: 215 });
      expect(enemyCenter).toEqual({ x: 380, y: 115 });
    });

    it('calculates animation centers from each sprite frame height', () => {
      expect(getBattlerCenter({ baseX: 130, baseY: 280, spriteHeight: 76 })).toEqual({
        x: 130,
        y: 242,
      });
      expect(getBattlerCenter({ baseX: 380, baseY: 175, spriteHeight: 182 })).toEqual({
        x: 380,
        y: 84,
      });
    });

    it('positions user-focus cels anchored directly to user without projecting through target', () => {
      // User placeholder at (128, 224) should map exactly to userPos
      const posSelf = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'user',
        playerCenter,
        enemyCenter
      );
      expect(posSelf.x).toBe(130);
      expect(posSelf.y).toBe(215);

      // User cel with offset (+20, -10) relative to SRC_USER (128, 224)
      const posOffset = CoordinateTransformer.resolveCelPosition(
        148,
        214,
        'user',
        playerCenter,
        enemyCenter
      );
      expect(posOffset.x).toBe(150);
      expect(posOffset.y).toBe(205);
    });

    it('positions target-focus cels anchored directly to target (e.g. Thunderbolt and Bite)', () => {
      // Thunderbolt: cel (384, 54), focus='target'
      // Offset from SRC_TARGET (384, 96) is dx=0, dy=-42 (directly above target head)
      const thunderboltPlayer = CoordinateTransformer.resolveCelPosition(
        384,
        54,
        'target',
        playerCenter,
        enemyCenter
      );
      expect(thunderboltPlayer.x).toBe(380);
      expect(thunderboltPlayer.y).toBe(73); // 115 - 42

      // Enemy casting Thunderbolt on Player:
      const thunderboltEnemy = CoordinateTransformer.resolveCelPosition(
        384,
        54,
        'target',
        enemyCenter,
        playerCenter
      );
      expect(thunderboltEnemy.x).toBe(130);
      expect(thunderboltEnemy.y).toBe(173); // 215 - 42

      // Bite: cel (385, 97), focus='target' -> exactly on target
      const bitePos = CoordinateTransformer.resolveCelPosition(
        385,
        97,
        'target',
        playerCenter,
        enemyCenter
      );
      expect(bitePos.x).toBe(381);
      expect(bitePos.y).toBe(116);
    });

    it('remaps target-focused self-buff cels to the acting battler', () => {
      const playerSelfBuff = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'target',
        playerCenter,
        enemyCenter,
        512,
        288,
        false,
        true
      );
      expect(playerSelfBuff).toEqual(playerCenter);

      const enemySelfBuff = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        true,
        true
      );
      expect(enemySelfBuff).toEqual(enemyCenter);

      // Normal offensive target cels must still resolve to the defender.
      const offensiveTarget = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'target',
        playerCenter,
        enemyCenter
      );
      expect(offensiveTarget).toEqual(enemyCenter);
    });

    it('handles Flamethrower trajectory authored with target focus from near user to target', () => {
      // Flamethrower Frame 0 Cel 2: x=165, y=215, focus='target'
      // In Essentials, offset from target (384, 96) is (165 - 384 = -219, 215 - 96 = +119)
      // When player attacks: 380 - 219 = 161, 115 + 119 = 234 (right in front of player at 130, 215)
      const flameStart = CoordinateTransformer.resolveCelPosition(
        165,
        215,
        'target',
        playerCenter,
        enemyCenter
      );
      expect(flameStart.x).toBe(161);
      expect(flameStart.y).toBe(234);

      // Flamethrower Frame 8 Cel 4: x=379, y=72, focus='target'
      // 380 + (379 - 384) = 375, 115 + (72 - 96) = 91 (at enemy)
      const flameEnd = CoordinateTransformer.resolveCelPosition(
        379,
        72,
        'target',
        playerCenter,
        enemyCenter
      );
      expect(flameEnd.x).toBe(375);
      expect(flameEnd.y).toBe(91);
    });

    it('interpolates projectile moves with focus="both" (e.g. Water Gun and Absorb)', () => {
      // Water Gun Frame 0: cel (160, 200), focus='both'
      // tx = (160 - 128)/256 = 0.125, ty = (200 - 224)/(-128) = 0.1875
      // Player -> Enemy: x = 130 + 0.125*(380 - 130) = 161.25, y = 215 + 0.1875*(115 - 215) = 196.25
      const wgPlayer = CoordinateTransformer.resolveCelPosition(
        160,
        200,
        'both',
        playerCenter,
        enemyCenter
      );
      expect(wgPlayer.x).toBeCloseTo(161.25, 2);
      expect(wgPlayer.y).toBeCloseTo(196.25, 2);

      // Enemy -> Player (reversed trajectory):
      // x = 380 + 0.125*(130 - 380) = 348.75, y = 115 + 0.1875*(215 - 115) = 133.75
      const wgEnemy = CoordinateTransformer.resolveCelPosition(
        160,
        200,
        'both',
        enemyCenter,
        playerCenter
      );
      expect(wgEnemy.x).toBeCloseTo(348.75, 2);
      expect(wgEnemy.y).toBeCloseTo(133.75, 2);

      // Absorb Frame 0: cel (358.4, 91.7), focus='both'
      // tx = (358.4 - 128)/256 = 0.9 (starts 90% along the path, near enemy)
      const absorbStart = CoordinateTransformer.resolveCelPosition(
        358.4,
        91.7,
        'both',
        playerCenter,
        enemyCenter
      );
      expect(absorbStart.x).toBeCloseTo(355, 1);
      expect(absorbStart.y).toBeCloseTo(111.64, 1);
    });

    it('keeps default 0,0 both-focus cels on the battler path', () => {
      // Imported Essentials animations can omit x/y and serialize those
      // fields as 0. Outrage uses this form; it must anchor at the user
      // instead of extrapolating into the upper-left corner.
      const defaultCel = CoordinateTransformer.resolveCelPosition(
        0,
        0,
        'both',
        playerCenter,
        enemyCenter
      );
      expect(defaultCel).toEqual(playerCenter);

      // Authored coordinates continue to use the original source projection;
      // only the missing/default pair is normalized.
      const authoredCel = CoordinateTransformer.resolveCelPosition(
        160,
        200,
        'both',
        playerCenter,
        enemyCenter
      );
      expect(authoredCel).toEqual({ x: 161.25, y: 196.25 });
    });

    it('scales absolute viewport coordinates for screen focus without centering offset', () => {
      // Cel at center of 512x384: (256, 192)
      // When scaled to 512x288 battlefield viewport:
      const screenPos = CoordinateTransformer.resolveCelPosition(
        256,
        192,
        'screen',
        playerCenter,
        enemyCenter,
        512,
        288
      );
      expect(screenPos.x).toBe(256);
      expect(screenPos.y).toBe(144); // 192 * (288 / 384) = 144
    });

    it('keeps large or edge-positioned cels fully inside the battle viewport', () => {
      const edgeCel: AnimationCel = {
        pattern: 0,
        x: 0,
        y: 0,
        zoomX: 100,
        zoomY: 100,
        angle: 0,
        mirror: false,
        opacity: 255,
        blendMode: 'normal',
        visible: true,
        priority: 1,
        focus: 'user',
      };

      expect(CelRenderer.clampPositionToCanvas(edgeCel, 2, -9, 192, 192, 512, 288)).toEqual({
        x: 96,
        y: 96,
      });

      const rotatedCel = { ...edgeCel, angle: 45, zoomX: 150, zoomY: 150 };
      const safeRotated = CelRenderer.clampPositionToCanvas(
        rotatedCel,
        500,
        280,
        192,
        192,
        512,
        288
      );
      expect(safeRotated.x).toBeGreaterThanOrEqual(0);
      expect(safeRotated.x).toBeLessThanOrEqual(512);
      expect(safeRotated.y).toBeGreaterThanOrEqual(0);
      expect(safeRotated.y).toBeLessThanOrEqual(288);
    });

    it('does not invert X globally for enemy casts', () => {
      // An enemy casting a user-focus self effect at (128, 224)
      const enemySelf = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'user',
        enemyCenter,
        playerCenter,
        512,
        288,
        true
      );
      expect(enemySelf.x).toBe(380);
      expect(enemySelf.y).toBe(115);
    });

    it('interpolates trajectory smoothly along both focus line helper', () => {
      const pMid = CoordinateTransformer.transformPoint(
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        { x: 400, y: 400 },
        50,
        50
      );
      expect(pMid.x).toBe(300);
      expect(pMid.y).toBe(300);
    });
  });

  describe('4. Layer Manager & Cel Depth Sorting', () => {
    it('separates background cels from foreground cels accurately', () => {
      const cels: AnimationCel[] = [
        {
          pattern: 0,
          x: 0,
          y: 0,
          zoomX: 100,
          zoomY: 100,
          angle: 0,
          mirror: false,
          opacity: 255,
          blendMode: 'normal',
          visible: true,
          priority: 0, // Behind battlers
          focus: 'target',
        },
        {
          pattern: 1,
          x: 0,
          y: 0,
          zoomX: 100,
          zoomY: 100,
          angle: 0,
          mirror: false,
          opacity: 255,
          blendMode: 'normal',
          visible: true,
          priority: 1, // Front
          focus: 'target',
        },
        {
          pattern: 2,
          x: 0,
          y: 0,
          zoomX: 100,
          zoomY: 100,
          angle: 0,
          mirror: false,
          opacity: 0, // Invisible
          blendMode: 'normal',
          visible: true,
          priority: 1,
          focus: 'target',
        },
      ];

      const { behindBattlers, aboveBattlers } = LayerManager.categorizeCels(cels);
      expect(behindBattlers.length).toBe(1);
      expect(behindBattlers[0].pattern).toBe(0);
      expect(aboveBattlers.length).toBe(1);
      expect(aboveBattlers[0].pattern).toBe(1);
    });
  });

  describe('5. Timeline Player Delta Updates & Frame Independence', () => {
    it('progresses smoothly across elapsed time regardless of tick step sizes (60Hz vs 120Hz vs 144Hz)', async () => {
      const mockDef: BattleAnimationDefinition = {
        id: '999',
        name: 'Mock Tackle',
        graphic: 'Hit',
        hue: 0,
        position: 1,
        fps: 20, // 20 fps -> 50ms per frame
        frames: [
          { cels: [] }, // frame 0: 0-50ms
          { cels: [] }, // frame 1: 50-100ms
          { cels: [] }, // frame 2: 100-150ms
          { cels: [] }, // frame 3: 150-200ms
        ],
        timings: [],
      };

      ANIMATION_REGISTRY.registerDefinition('999', mockDef);

      const player = new BattleAnimationPlayer();
      let completed = false;
      let hitCalled = false;

      await player.play({
        moveId: 'mock_tackle',
        userSide: 'player',
        userPos: { x: 100, y: 200 },
        targetPos: { x: 500, y: 150 },
        onHit: () => {
          hitCalled = true;
        },
        onComplete: () => {
          completed = true;
        },
      });

      // Override instance definition for isolation test
      const inst = player.getCurrentInstance();
      expect(inst).toBeDefined();
      if (inst) {
        inst.definition = mockDef;
        inst.totalDurationMs = (4 / 20) * 1000; // 200ms
      }

      expect(player.isPlaying()).toBe(true);
      expect(inst?.currentFrame).toBe(0);

      // Advance by 60ms (~1 frame at 20fps)
      player.update(60);
      expect(inst?.currentFrame).toBe(1);

      // Advance by another 60ms (total 120ms -> frame 2, hits triggered at >40% duration)
      player.update(60);
      expect(inst?.currentFrame).toBe(2);
      expect(hitCalled).toBe(true);

      // Advance to end (>200ms)
      player.update(100);
      expect(completed).toBe(true);
      expect(player.isPlaying()).toBe(false);
    });
  });
});
