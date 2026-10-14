import { describe, it, expect, vi } from 'vitest';
import {
  ANIMATION_REGISTRY,
  ANIMATION_ASSETS,
  CoordinateTransformer,
  LayerManager,
  CelRenderer,
  BattleAnimationPlayer,
  getBattlerCenter,
  DEFAULT_PLAYER_GEOMETRY,
  DEFAULT_ENEMY_GEOMETRY,
  DEFAULT_ANIMATION_VIEWPORT,
  type BattleAnimationDefinition,
  type AnimationCel,
  type AnimationFocus,
} from '../src/battle/animation';
import atlasData from '../../../packages/game-data/animation-atlas.json';
import moveMapData from '../../../packages/game-data/move-animation-map.json';
import moveExtensionData from '../../../packages/game-data/move-animation-extensions.json';
import lastChanceAtlasData from '../../../packages/game-data/last-chance-animation-atlas.json';
import fallbackData from '../../../packages/game-data/animation-fallbacks.json';
import acidAnimation from '../../../packages/game-data/animations/24.json';
import absorbAnimation from '../../../packages/game-data/animations/23.json';
import bubblebeamAnimation from '../../../packages/game-data/animations/54.json';
import stealthRockAnimation from '../../../packages/game-data/animations/263.json';
import oppStealthRockAnimation from '../../../packages/game-data/animations/264.json';
import leechSeedAnimation from '../../../packages/game-data/animations/179.json';
import megaDrainAnimation from '../../../packages/game-data/animations/192.json';

describe('Battle Timeline Animation System (Essentials/EBDX Engine)', () => {
  const playerCenter = getBattlerCenter(DEFAULT_PLAYER_GEOMETRY); // { x: 130, y: 215 }
  const enemyCenter = getBattlerCenter(DEFAULT_ENEMY_GEOMETRY); // { x: 380, y: 115 }

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
      expect(Object.keys(fallbackData).length).toBe(18);
    });

    it('resolves newly added extended moves from EBDX / Last Chance extension', async () => {
      expect(ANIMATION_REGISTRY.resolveAnimationId('tackle')).toBe(275);
      expect(ANIMATION_REGISTRY.resolveAnimationId('earthquake')).toBe(6416);
      expect(ANIMATION_REGISTRY.resolveAnimationId('surf')).toBe(6642);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ice_beam')).toBe(6479);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hyper_beam')).toBe(6476);
      expect(ANIMATION_REGISTRY.resolveAnimationId('aura_sphere')).toBe(6330);
      expect(ANIMATION_REGISTRY.resolveAnimationId('draco_meteor')).toBe(6397);
      expect(ANIMATION_REGISTRY.resolveAnimationId('play_rough')).toBe(6539);
      expect(ANIMATION_REGISTRY.resolveAnimationId('air_slash')).toBe(
        moveExtensionData.moves.air_slash
      );
      expect(ANIMATION_REGISTRY.hasDefinition(moveExtensionData.moves.air_slash)).toBe(true);

      const dracoMeteor = await ANIMATION_REGISTRY.getDefinition(
        moveExtensionData.moves.draco_meteor
      );
      expect(dracoMeteor?.sourcePack).toBe('Pokémon Last Chance 1.22');
      expect(dracoMeteor?.graphic).toBe('last-chance/015-Fire01.png');

      const airSlash = await ANIMATION_REGISTRY.getDefinition(moveExtensionData.moves.air_slash);
      expect(['Pokémon Last Chance 1.22', 'Reunion EBDX 1:1 Parity']).toContain(
        airSlash?.sourcePack
      );
    });

    it('resolves replaced moves with updated/superior animations over older animations', () => {
      // Screech: replaced 239 (Growl placeholder) with 6731 (Hypnosis+Lock on ultrasonic rings)
      expect(ANIMATION_REGISTRY.resolveAnimationId('screech')).toBe(6731);
      expect(ANIMATION_REGISTRY.isReplacedMove('screech')).toBe(true);

      // Light Screen: replaced 183 with 6490 (normal2 hexagonal barrier)
      expect(ANIMATION_REGISTRY.resolveAnimationId('light_screen')).toBe(6490);

      // Whirlwind: replaced 294 with 6688 (water3 cyclone vortex)
      expect(ANIMATION_REGISTRY.resolveAnimationId('whirlwind')).toBe(6688);

      // Stealth Rock: replaced 263 with 6260, and opponent variant 264 with 6261
      expect(ANIMATION_REGISTRY.resolveAnimationId('stealth_rock', false)).toBe(6260);
      expect(ANIMATION_REGISTRY.resolveAnimationId('stealth_rock', true)).toBe(6261);

      // Non-replaced moves remain at base mapping
      expect(ANIMATION_REGISTRY.resolveAnimationId('ember')).toBe(96);
      expect(ANIMATION_REGISTRY.isReplacedMove('ember')).toBe(false);
    });

    it('falls back to play_rough for unmapped physical Fairy moves via extended fallback', () => {
      const fairyPhysicalAnim = ANIMATION_REGISTRY.resolveAnimationId(
        'custom_pixie_bash',
        false,
        'FAIRY',
        'physical'
      );
      expect(fairyPhysicalAnim).toBe(6539); // play_rough from extension
    });

    it('does not expose rejected source timelines as playable definitions', () => {
      expect(ANIMATION_REGISTRY.hasDefinition(6052)).toBe(false);
      expect(ANIMATION_REGISTRY.hasDefinition(6637)).toBe(false);
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

    it('registers the Last Chance namespaced atlas without overwriting existing assets', () => {
      const [graphicName, atlasEntry] = Object.entries(lastChanceAtlasData)[0];
      expect(ANIMATION_ASSETS.hasAtlas(graphicName)).toBe(true);
      expect(ANIMATION_ASSETS.getAtlas(graphicName)).toMatchObject(atlasEntry);
      expect(ANIMATION_ASSETS.getImagePath(graphicName)).toContain(
        '/Graphics/Animations/LastChance/'
      );
      expect(ANIMATION_ASSETS.getAtlas('Flames')?.file).not.toContain('LastChance');
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
      // Source engine formula: progress = (160 - 128) / (384 - 128) = 32 / 256 = 0.125
      // Both X and Y use the exact same progress along destination vector:
      // Player -> Enemy:
      // x = 130 + 0.125 * (380 - 130) = 161.25
      // y = 215 + 0.125 * (115 - 215) = 202.5
      const wgPlayer = CoordinateTransformer.resolveCelPosition(
        160,
        200,
        'both',
        playerCenter,
        enemyCenter
      );
      expect(wgPlayer.x).toBeCloseTo(161.25, 2);
      expect(wgPlayer.y).toBeCloseTo(202.5, 2);

      // Enemy -> Player (reversed trajectory):
      // x = 380 + 0.125 * (130 - 380) = 348.75
      // y = 115 + 0.125 * (215 - 115) = 127.5
      const wgEnemy = CoordinateTransformer.resolveCelPosition(
        160,
        200,
        'both',
        enemyCenter,
        playerCenter
      );
      expect(wgEnemy.x).toBeCloseTo(348.75, 2);
      expect(wgEnemy.y).toBeCloseTo(127.5, 2);

      // Absorb Frame 0: cel (358.4, 91.7), focus='both'
      // progress = (358.4 - 128) / 256 = 0.9 (starts 90% along the path, near enemy)
      // x = 130 + 0.9 * (380 - 130) = 355
      // y = 215 + 0.9 * (115 - 215) = 125
      const absorbStart = CoordinateTransformer.resolveCelPosition(
        358.4,
        91.7,
        'both',
        playerCenter,
        enemyCenter
      );
      expect(absorbStart.x).toBeCloseTo(355, 1);
      expect(absorbStart.y).toBeCloseTo(125, 1);
    });

    it('keeps Absorb recovery particles around the user after the drain phase', () => {
      expect(absorbAnimation.fps).toBe(12);

      const recoveryCels = absorbAnimation.frames
        .slice(8)
        .flatMap((frame) => frame.cels.filter((cel) => cel.pattern >= 5 && cel.pattern <= 8));

      expect(recoveryCels.length).toBeGreaterThan(0);
      expect(recoveryCels.every((cel) => cel.focus === 'user')).toBe(true);
      expect(recoveryCels.every((cel) => cel.x >= 80 && cel.x <= 180)).toBe(true);
      expect(recoveryCels.every((cel) => cel.y >= 180 && cel.y <= 260)).toBe(true);

      const lastFrameBlue = absorbAnimation.frames[17].cels.find((cel) => cel.pattern === 8);
      expect(lastFrameBlue).toMatchObject({ focus: 'user', x: 128, y: 224 });
      expect(
        CoordinateTransformer.resolveCelPosition(
          lastFrameBlue?.x ?? 0,
          lastFrameBlue?.y ?? 0,
          (lastFrameBlue?.focus as AnimationFocus) ?? 'user',
          playerCenter,
          enemyCenter
        )
      ).toEqual(playerCenter);
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
      expect(authoredCel).toEqual({ x: 161.25, y: 202.5 });
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

  describe('6. Direction-Based Mirror Rules (Essentials Engine Parity)', () => {
    it('detects direction reversal based on actual battler positions vs source reference', () => {
      const srcUser = { x: 128, y: 224 };
      const srcTarget = { x: 384, y: 96 };

      // Player attacking Enemy: (130, 215) -> (380, 115) [left to right]
      // Source reference is (128, 224) -> (384, 96) [left to right]
      // Direction is NOT reversed.
      expect(
        CoordinateTransformer.isDirectionReversed(srcUser, srcTarget, playerCenter, enemyCenter)
      ).toBe(false);

      // Enemy attacking Player: (380, 115) -> (130, 215) [right to left]
      // Source is left-to-right, actual is right-to-left -> direction IS reversed.
      expect(
        CoordinateTransformer.isDirectionReversed(srcUser, srcTarget, enemyCenter, playerCenter)
      ).toBe(true);
    });

    it('inverts mirror flag for focus="both" projectiles when flight direction is reversed', () => {
      const normalProjectileCel: AnimationCel = {
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
        focus: 'both',
      };

      // Player attacking (not reversed) keeps authored mirror (false)
      expect(CelRenderer.shouldMirrorCel(normalProjectileCel, false)).toBe(false);

      // Enemy attacking (reversed) inverts mirror (false -> true)
      expect(CelRenderer.shouldMirrorCel(normalProjectileCel, true)).toBe(true);

      // An authored cel with mirror=true does not get double-mirrored (true -> false when reversed)
      const authoredMirroredCel: AnimationCel = {
        ...normalProjectileCel,
        mirror: true,
      };
      expect(CelRenderer.shouldMirrorCel(authoredMirroredCel, false)).toBe(true);
      expect(CelRenderer.shouldMirrorCel(authoredMirroredCel, true)).toBe(false);
    });

    it('does not invert mirror for user, target, or screen focus cels', () => {
      const userCel: AnimationCel = {
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
      const targetCel: AnimationCel = { ...userCel, focus: 'target', mirror: true };
      const screenCel: AnimationCel = { ...userCel, focus: 'screen', mirror: false };

      // Flight reversal should NEVER affect non-both cels
      expect(CelRenderer.shouldMirrorCel(userCel, true)).toBe(false);
      expect(CelRenderer.shouldMirrorCel(targetCel, true)).toBe(true);
      expect(CelRenderer.shouldMirrorCel(screenCel, true)).toBe(false);
    });
  });

  describe('7. Multi-hit Variant Resolution (hitNum Support)', () => {
    it('resolves sequential animation variants for multi-hit moves', () => {
      // Comet Punch base is 66, has variants 67 (hit 1), 68 (hit 2), 69 (hit 3), 70 (hit 4)
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('comet_punch', false, undefined, undefined, 0)
      ).toBe(66);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('comet_punch', false, undefined, undefined, 1)
      ).toBe(67);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('comet_punch', false, undefined, undefined, 2)
      ).toBe(68);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('comet_punch', false, undefined, undefined, 3)
      ).toBe(69);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('comet_punch', false, undefined, undefined, 4)
      ).toBe(70);

      // Fury Swipes base is 137, has variants 138 (hit 2), 139 (hit 3), 140 (hit 4), 141 (hit 5)
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('fury_swipes', false, undefined, undefined, 0)
      ).toBe(137);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('fury_swipes', false, undefined, undefined, 1)
      ).toBe(138);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('fury_swipes', false, undefined, undefined, 2)
      ).toBe(139);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('fury_swipes', false, undefined, undefined, 3)
      ).toBe(140);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('fury_swipes', false, undefined, undefined, 4)
      ).toBe(141);
    });

    it('falls back to base animation and warns when hit variant does not exist', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Tackle base is 275; variant 275 + 999 does not exist
      const resolved = ANIMATION_REGISTRY.resolveAnimationId(
        'tackle',
        false,
        undefined,
        undefined,
        999
      );
      expect(resolved).toBe(275);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Multi-hit variant ID 1274 not found for move 'tackle'")
      );
      warnSpy.mockRestore();
    });

    it('does not apply hitNum offset to fallback type animations', () => {
      // Unmapped move with Type 'Water' and Category 'special' falls back to watergun (291)
      // Even with hitNum = 2, fallback animation ID must NOT be incremented
      const fallbackId = ANIMATION_REGISTRY.resolveAnimationId(
        'custom_bubble_burst',
        false,
        'WATER',
        'special',
        2
      );
      expect(fallbackId).toBe(291);
    });
  });

  describe('8. Atlas Validation & Pattern Limits', () => {
    it('ensures previously out-of-range moves have all patterns strictly within atlas bounds', () => {
      // Absorb (23) -> Leech Seed atlas maxPattern = 12 (patterns 0..11)
      const leechSeedMax = (atlasData as Record<string, { maxPattern: number }>)['leech-seed']
        .maxPattern;
      for (const frame of absorbAnimation.frames) {
        for (const cel of frame.cels) {
          if (cel.pattern >= 0) {
            expect(cel.pattern).toBeLessThan(leechSeedMax);
          }
        }
      }

      // Bubblebeam (54) -> 018-Water01 atlas maxPattern = 14 (patterns 0..13)
      const waterMax = (atlasData as Record<string, { maxPattern: number }>)['018-Water01']
        .maxPattern;
      for (const frame of bubblebeamAnimation.frames) {
        for (const cel of frame.cels) {
          if (cel.pattern >= 0) {
            expect(cel.pattern).toBeLessThan(waterMax);
          }
        }
      }

      // Stealth Rock (263 & 264) -> Rock Tomb atlas maxPattern = 8 (patterns 0..7)
      const rockTombMax = (atlasData as Record<string, { maxPattern: number }>)['Rock Tomb']
        .maxPattern;
      for (const frame of stealthRockAnimation.frames) {
        for (const cel of frame.cels) {
          if (cel.pattern >= 0) {
            expect(cel.pattern).toBeLessThan(rockTombMax);
          }
        }
      }
      for (const frame of oppStealthRockAnimation.frames) {
        for (const cel of frame.cels) {
          if (cel.pattern >= 0) {
            expect(cel.pattern).toBeLessThan(rockTombMax);
          }
        }
      }

      // Leech Seed (179) and Mega Drain (192)
      for (const frame of leechSeedAnimation.frames) {
        for (const cel of frame.cels) {
          if (cel.pattern >= 0) {
            expect(cel.pattern).toBeLessThan(leechSeedMax);
          }
        }
      }
      for (const frame of megaDrainAnimation.frames) {
        for (const cel of frame.cels) {
          if (cel.pattern >= 0) {
            expect(cel.pattern).toBeLessThan(leechSeedMax);
          }
        }
      }
    });
  });

  describe('9. Viewport Standardization & Geometry Alignment', () => {
    it('uses standard 512x288 default animation viewport', () => {
      expect(DEFAULT_ANIMATION_VIEWPORT).toEqual({
        x: 0,
        y: 0,
        width: 512,
        height: 288,
      });
    });

    it('scales screen coordinates accurately across different viewport dimensions', () => {
      // 512x384 center point is (256, 192)
      // Custom 400x300 viewport
      const customPos = CoordinateTransformer.resolveCelPosition(
        256,
        192,
        'screen',
        playerCenter,
        enemyCenter,
        400,
        300
      );
      expect(customPos.x).toBeCloseTo(256 * (400 / 512), 2);
      expect(customPos.y).toBeCloseTo(192 * (300 / 384), 2);
    });

    it('does not artificially clamp cel coordinates before canvas clipping', () => {
      // An animation cel with coordinates intentionally outside the screen
      // must retain its exact position for the canvas clip rect to handle natively
      const farOutCel = CoordinateTransformer.resolveCelPosition(
        -50,
        -100,
        'user',
        playerCenter,
        enemyCenter
      );
      // userCenter is (130, 215), -50 - 128 = -178 -> 130 - 178 = -48
      expect(farOutCel.x).toBeLessThan(0);
      expect(farOutCel.y).toBeLessThan(playerCenter.y);
    });
  });

  describe('10. Animation Player Callback Invariance & Asset Safety', () => {
    it('guarantees onHit and onComplete are invoked at most once even across multiple updates', async () => {
      const mockDef: BattleAnimationDefinition = {
        id: '998',
        name: 'Single Callback Test',
        graphic: 'Hit',
        hue: 0,
        position: 1,
        fps: 20,
        frames: [{ cels: [] }, { cels: [] }],
        timings: [],
      };
      ANIMATION_REGISTRY.registerDefinition('998', mockDef);

      const player = new BattleAnimationPlayer();
      let hitCount = 0;
      let completeCount = 0;

      await player.play({
        moveId: 'single_cb_test',
        userSide: 'player',
        userPos: { x: 100, y: 200 },
        targetPos: { x: 400, y: 150 },
        onHit: () => {
          hitCount++;
        },
        onComplete: () => {
          completeCount++;
        },
      });

      const inst = player.getCurrentInstance();
      if (inst) {
        inst.definition = mockDef;
        inst.totalDurationMs = 100;
      }

      // Update past duration multiple times
      player.update(60);
      player.update(60);
      player.update(100);
      player.update(100);

      expect(hitCount).toBe(1);
      expect(completeCount).toBe(1);
      expect(player.isPlaying()).toBe(false);
    });
  });

  describe('11. Regression Check for Key Visual Moves', () => {
    it('resolves valid animations for Acid, Energy Ball, Growl, Outrage, Water Gun, Stealth Rock, Eruption, and Fairy Wind', () => {
      const moves = ['acid', 'energy_ball', 'growl', 'outrage', 'water_gun', 'stealth_rock', 'eruption', 'fairy_wind'];
      for (const m of moves) {
        const playerAnimId = ANIMATION_REGISTRY.resolveAnimationId(m, false);
        const enemyAnimId = ANIMATION_REGISTRY.resolveAnimationId(m, true);
        expect(playerAnimId).toBeGreaterThan(0);
        expect(enemyAnimId).toBeGreaterThan(0);
        expect(ANIMATION_REGISTRY.hasDefinition(playerAnimId)).toBe(true);
        expect(ANIMATION_REGISTRY.hasDefinition(enemyAnimId)).toBe(true);
      }
    });

    it('verifies Player and Enemy Water Gun trajectories stay within valid battle view bounds', () => {
      // Water Gun Frame 0: (160, 200)
      const pWater = CoordinateTransformer.resolveCelPosition(
        160,
        200,
        'both',
        playerCenter,
        enemyCenter
      );
      const eWater = CoordinateTransformer.resolveCelPosition(
        160,
        200,
        'both',
        enemyCenter,
        playerCenter
      );

      // Player water starts near player (130, 215) headed toward enemy (380, 115)
      expect(pWater.x).toBeGreaterThan(playerCenter.x);
      expect(pWater.x).toBeLessThan(enemyCenter.x);
      expect(pWater.y).toBeLessThan(playerCenter.y);
      expect(pWater.y).toBeGreaterThan(enemyCenter.y);

      // Enemy water starts near enemy (380, 115) headed toward player (130, 215)
      expect(eWater.x).toBeLessThan(enemyCenter.x);
      expect(eWater.x).toBeGreaterThan(playerCenter.x);
      expect(eWater.y).toBeGreaterThan(enemyCenter.y);
      expect(eWater.y).toBeLessThan(playerCenter.y);
    });

    it('verifies Eruption features falling sky meteors descending onto target for player and enemy', async () => {
      const eruption = await ANIMATION_REGISTRY.getDefinition(99);
      expect(eruption).not.toBeNull();
      expect(eruption?.graphic).toBe('eb642');
      expect(eruption?.frames.length).toBe(18);

      // Verify that falling meteor cels (focus="target") start high in the sky (y < 0) and descend to target (y ~ 96)
      const targetCels = (eruption?.frames ?? []).flatMap((f) =>
        f.cels.filter((c) => c.focus === 'target' && c.pattern >= 0)
      );
      expect(targetCels.length).toBeGreaterThan(10);
      const skyCels = targetCels.filter((c) => c.y < 0);
      expect(skyCels.length).toBeGreaterThan(0);
      const impactCels = targetCels.filter((c) => c.y >= 90);
      expect(impactCels.length).toBeGreaterThan(0);
    });

    it('verifies Fairy Wind features multi-particle fairy gale sweeping battlefield and swirling target', async () => {
      const fairyWindId = ANIMATION_REGISTRY.resolveAnimationId('fairy_wind');
      expect(fairyWindId).toBe(6765);
      const fairyWind = await ANIMATION_REGISTRY.getDefinition(fairyWindId);
      expect(fairyWind).not.toBeNull();
      expect(fairyWind?.graphic).toBe('eb611_2');
      expect(fairyWind?.frames.length).toBe(16);

      // Check both-focus flight stream cels
      const bothCels = (fairyWind?.frames ?? []).flatMap((f) =>
        f.cels.filter((c) => c.focus === 'both')
      );
      expect(bothCels.length).toBeGreaterThan(15);

      // Check target-focus swirling vortex cels
      const targetCels = (fairyWind?.frames ?? []).flatMap((f) =>
        f.cels.filter((c) => c.focus === 'target' && c.pattern >= 0)
      );
      expect(targetCels.length).toBeGreaterThan(20);
    });
  });
});
