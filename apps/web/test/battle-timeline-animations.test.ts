import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  ANIMATION_REGISTRY,
  ANIMATION_ASSETS,
  CoordinateTransformer,
  LayerManager,
  CelRenderer,
  BattleAnimationPlayer,
  battleAnimationPlayer,
  getBattlerCenter,
  DEFAULT_PLAYER_GEOMETRY,
  DEFAULT_ENEMY_GEOMETRY,
  DEFAULT_ANIMATION_VIEWPORT,
  isOppMoveTrajectoryReversed,
  OPP_MOVE_TRAJECTORY_REVERSED_IDS,
  type BattleAnimationDefinition,
  type AnimationCel,
  type AnimationFocus,
} from '../src/battle/animation';
import { shouldPreserveAnimationCurve } from '../src/battle/animation/animation-overrides';
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
      expect(ANIMATION_REGISTRY.resolveAnimationId('tackle')).toBe(7247);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flamethrower')).toBe(116);
      expect(ANIMATION_REGISTRY.resolveAnimationId('absorb')).toBe(23);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hydro_pump')).toBe(159);
      expect(ANIMATION_REGISTRY.resolveAnimationId('thunderbolt')).toBe(7299);
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

      const playerArmThrust = ANIMATION_REGISTRY.resolveAnimationId('arm_thrust', false);
      const enemyArmThrust = ANIMATION_REGISTRY.resolveAnimationId('arm_thrust', true);
      expect(playerArmThrust).toBe(6314);
      expect(enemyArmThrust).toBe(6320);
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

      // Completely unmapped move with unknown type -> fallback to tackle (7247)
      const defaultAnim = ANIMATION_REGISTRY.resolveAnimationId('unknown_glitch_move');
      expect(defaultAnim).toBe(7247);
    });

    it('contains all standard moves and opponent variants in mapping files', () => {
      const regKeys = Object.keys(moveMapData.moves);
      const oppKeys = Object.keys(moveMapData.opponentMoves);
      expect(regKeys.length).toBeGreaterThanOrEqual(212);
      expect(oppKeys.length).toBeGreaterThanOrEqual(18);
      expect(Object.keys(fallbackData).length).toBe(18);
    });

    it('resolves newly added extended moves from EBDX / Last Chance extension', async () => {
      expect(ANIMATION_REGISTRY.resolveAnimationId('tackle')).toBe(7247);
      expect(ANIMATION_REGISTRY.resolveAnimationId('earthquake')).toBe(662);
      expect(ANIMATION_REGISTRY.resolveAnimationId('surf')).toBe(7231);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ice_beam')).toBe(6479);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hyper_beam')).toBe(6476);
      expect(ANIMATION_REGISTRY.resolveAnimationId('aura_sphere')).toBe(6330);
      expect(ANIMATION_REGISTRY.resolveAnimationId('draco_meteor')).toBe(6397);
      expect(ANIMATION_REGISTRY.resolveAnimationId('play_rough')).toBe(6956);
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

      // Stealth Rock: upgraded to 7192 (Player) and 7193 (Opponent)
      expect(ANIMATION_REGISTRY.resolveAnimationId('stealth_rock', false)).toBe(7192);
      expect(ANIMATION_REGISTRY.resolveAnimationId('stealth_rock', true)).toBe(7193);

      // Non-replaced moves remain at base mapping
      expect(ANIMATION_REGISTRY.resolveAnimationId('ember')).toBe(6820);
      expect(ANIMATION_REGISTRY.isReplacedMove('ember')).toBe(false);
    });

    it('falls back to play_rough for unmapped physical Fairy moves via extended fallback', () => {
      const fairyPhysicalAnim = ANIMATION_REGISTRY.resolveAnimationId(
        'custom_pixie_bash',
        false,
        'FAIRY',
        'physical'
      );
      expect(fairyPhysicalAnim).toBe(6956); // play_rough from P-group import
    });

    it('does not expose rejected source timelines as playable definitions', () => {
      expect(ANIMATION_REGISTRY.hasDefinition(6052)).toBe(false);
      expect(ANIMATION_REGISTRY.hasDefinition(6637)).toBe(false);
    });

    it('resolves optimized Unbreakable Ties A-group moves correctly', () => {
      expect(ANIMATION_REGISTRY.resolveAnimationId('amnesia')).toBe(33);
      expect(ANIMATION_REGISTRY.resolveAnimationId('arm_thrust', false)).toBe(6314);
      expect(ANIMATION_REGISTRY.resolveAnimationId('arm_thrust', true)).toBe(6320);
      expect(ANIMATION_REGISTRY.resolveAnimationId('aromatherapy')).toBe(36);
      expect(ANIMATION_REGISTRY.resolveAnimationId('aromatic_mist')).toBe(6698);
      expect(ANIMATION_REGISTRY.resolveAnimationId('assist')).toBe(6326);
      expect(ANIMATION_REGISTRY.resolveAnimationId('assurance')).toBe(6327);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ancient_power')).toBe(34);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ancientpower')).toBe(34);
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

    it('corrects Acid Spray impact droplets to target focus so poison scatters outward instead of flattening into a diagonal line', async () => {
      const acidSpray = await ANIMATION_REGISTRY.getDefinition(26);
      expect(acidSpray).not.toBeNull();
      expect(acidSpray?.name).toBe('Move:ACIDSPRAY');

      // 1. Flight phase (frames 0..9): projectile must have focus="both" to fly from user to target
      for (let f = 0; f < 10; f++) {
        const frame = acidSpray!.frames[f];
        const projectileCel = frame.cels.find((c) => c.pattern >= 0);
        expect(projectileCel?.focus).toBe('both');
      }

      // 2. Splash / impact phase (frames 10..25): all poison droplets must have focus="target"
      for (let f = 10; f <= 25; f++) {
        const frame = acidSpray!.frames[f];
        const dropletCels = frame.cels.filter((c) => c.pattern >= 0);
        expect(dropletCels.length).toBeGreaterThan(0);
        for (const cel of dropletCels) {
          expect(cel.focus).toBe('target');
        }
      }

      // 3. Transformation verification: droplets must scatter horizontally and vertically around enemyCenter
      // rather than collapsing onto a collinear diagonal line with playerCenter
      const frame18 = acidSpray!.frames[18];
      const dropletCelsF18 = frame18.cels.filter((c) => c.pattern >= 0);
      const positions = dropletCelsF18.map((cel) =>
        CoordinateTransformer.resolveCelPosition(
          cel.x,
          cel.y,
          cel.focus,
          playerCenter,
          enemyCenter
        )
      );

      // Verify horizontal scatter across the enemy (both left and right of enemy center x=380)
      const xs = positions.map((p) => p.x);
      expect(Math.min(...xs)).toBeLessThan(enemyCenter.x - 50); // Droplet to the left
      expect(Math.max(...xs)).toBeGreaterThan(enemyCenter.x + 30); // Droplet to the right

      // Verify vertical spread
      const ys = positions.map((p) => p.y);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(30);

      // Verify that positions are NOT strictly collinear with (playerCenter -> enemyCenter)
      // On the collinear line, (y - 215) = -0.4 * (x - 130), so y + 0.4*x - 267 = 0.
      const lineDeviations = positions.map((p) => Math.abs(p.y + 0.4 * p.x - 267));
      expect(Math.max(...lineDeviations)).toBeGreaterThan(15);
    });

    it('corrects Accelerock rock shards to target focus so rocks burst outward radially in 360 degrees instead of aligning on a diagonal line', async () => {
      expect(ANIMATION_REGISTRY.resolveAnimationId('accelerock')).toBe(6711);

      const accelerock = await ANIMATION_REGISTRY.getDefinition(6711);
      expect(accelerock).not.toBeNull();
      expect(accelerock?.name).toBe('Move:ACCELEROCK');

      // 1. All rock shard cels (patterns 3, 4, 5) and impact effects (pattern 0) in frames 8..15 must have focus="target"
      for (let f = 8; f <= 15; f++) {
        const frame = accelerock!.frames[f];
        const effectCels = frame.cels.filter((c) => c.pattern >= 0);
        expect(effectCels.length).toBeGreaterThan(0);
        for (const cel of effectCels) {
          expect(cel.focus).toBe('target');
        }
      }

      // 2. Transformation verification at Frame 15: rock shards explode in 360 degrees across all 4 quadrants around enemyCenter
      const frame15 = accelerock!.frames[15];
      const shardCels = frame15.cels.filter((c) => [3, 4, 5].includes(c.pattern));
      expect(shardCels.length).toBe(9);

      const positions = shardCels.map((cel) =>
        CoordinateTransformer.resolveCelPosition(
          cel.x,
          cel.y,
          cel.focus,
          playerCenter,
          enemyCenter
        )
      );

      // Verify shards exist in all 4 quadrants relative to enemyCenter (380, 115)
      const topLeft = positions.filter((p) => p.x < enemyCenter.x && p.y < enemyCenter.y);
      const topRight = positions.filter((p) => p.x > enemyCenter.x && p.y < enemyCenter.y);
      const bottomLeft = positions.filter((p) => p.x < enemyCenter.x && p.y > enemyCenter.y);
      const bottomRight = positions.filter((p) => p.x > enemyCenter.x && p.y > enemyCenter.y);

      expect(topLeft.length).toBeGreaterThan(0);
      expect(topRight.length).toBeGreaterThan(0);
      expect(bottomLeft.length).toBeGreaterThan(0);
      expect(bottomRight.length).toBeGreaterThan(0);

      // Verify large 2D radial bounding box
      const xs = positions.map((p) => p.x);
      const ys = positions.map((p) => p.y);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(150);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(140);

      // Verify massive perpendicular deviation from the collinear flight line
      const lineDeviations = positions.map((p) => Math.abs(p.y + 0.4 * p.x - 267));
      expect(Math.max(...lineDeviations)).toBeGreaterThan(50);
    });

    it('positions Arm Thrust opponent variant (6320) directly on the player battler without clipping off-screen', async () => {
      const oppArmThrust = await ANIMATION_REGISTRY.getDefinition(6320);
      expect(oppArmThrust).not.toBeNull();
      expect(oppArmThrust?.name).toBe('OppMove:ARMTHRUST');

      // Test Frame 6 where palm (pattern 14) and impact (pattern 0) strike
      const frame6 = oppArmThrust!.frames[6];
      const effectCels = frame6.cels.filter((c) => c.pattern >= 0);
      expect(effectCels.length).toBeGreaterThan(0);

      // When enemy attacks player: userPos is enemyCenter, targetPos is playerCenter
      const positionsWithOpp = effectCels.map((cel) =>
        CoordinateTransformer.resolveCelPosition(
          cel.x,
          cel.y,
          cel.focus,
          enemyCenter,
          playerCenter,
          DEFAULT_ANIMATION_VIEWPORT,
          undefined,
          false,
          false,
          false,
          true // isOppMove: true
        )
      );

      const positions = effectCels.map((cel) =>
        CoordinateTransformer.resolveCelPosition(
          cel.x,
          cel.y,
          cel.focus,
          enemyCenter,
          playerCenter
        )
      );

      // Verify all cels are centered on the player battler (playerCenter: x=130, y=215)
      // and NOT rendered off-screen (previously x was -126 and y was 343)
      for (const pos of [...positions, ...positionsWithOpp]) {
        expect(pos.x).toBeGreaterThan(0);
        expect(pos.x).toBeLessThan(DEFAULT_ANIMATION_VIEWPORT.width);
        expect(pos.y).toBeGreaterThan(0);
        expect(pos.y).toBeLessThan(DEFAULT_ANIMATION_VIEWPORT.height);

        // Within 25px of playerCenter
        expect(Math.abs(pos.x - playerCenter.x)).toBeLessThan(25);
        expect(Math.abs(pos.y - playerCenter.y)).toBeLessThan(25);
      }
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
      // Comet Punch base is 6795, has variants 6796 (hit 1), 6797 (hit 2), 6798 (hit 3), 6799 (hit 4)
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('comet_punch', false, undefined, undefined, 0)
      ).toBe(6795);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('comet_punch', false, undefined, undefined, 1)
      ).toBe(6796);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('comet_punch', false, undefined, undefined, 2)
      ).toBe(6797);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('comet_punch', false, undefined, undefined, 3)
      ).toBe(6798);
      expect(
        ANIMATION_REGISTRY.resolveAnimationId('comet_punch', false, undefined, undefined, 4)
      ).toBe(6799);

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
      // Tackle base is 7247; variant 7247 + 999 does not exist
      const resolved = ANIMATION_REGISTRY.resolveAnimationId(
        'tackle',
        false,
        undefined,
        undefined,
        999
      );
      expect(resolved).toBe(7247);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Multi-hit variant ID 8246 not found for move 'tackle'")
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

  describe('Status Condition Animations (Common / Status Effects)', () => {
    it('correctly resolves status animation IDs for all major status conditions', () => {
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('sleep')).toBe(4);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('asleep')).toBe(4);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('poison')).toBe(5);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('toxic')).toBe(6);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('burn')).toBe(7);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('paralysis')).toBe(8);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('paralyzed')).toBe(8);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('freeze')).toBe(9);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('frozen')).toBe(9);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('confusion')).toBe(10);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('confused')).toBe(10);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('leech_seed')).toBe(179);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('stat_up')).toBe(2);
      expect(ANIMATION_REGISTRY.resolveStatusAnimationId('stat_down')).toBe(3);
    });

    it('resolves direct numeric IDs and Common: prefixed strings via resolveAnimationId', () => {
      expect(ANIMATION_REGISTRY.resolveAnimationId('4')).toBe(4);
      expect(ANIMATION_REGISTRY.resolveAnimationId('8')).toBe(8);
      expect(ANIMATION_REGISTRY.resolveAnimationId('Common:Sleep')).toBe(4);
      expect(ANIMATION_REGISTRY.resolveAnimationId('Common:Paralysis')).toBe(8);
      expect(ANIMATION_REGISTRY.resolveAnimationId('status:burn')).toBe(7);
    });

    it('loads status animation definitions with valid frames and PRAS- Status graphic', async () => {
      const paraDef = await ANIMATION_REGISTRY.getDefinition(8);
      expect(paraDef).not.toBeNull();
      expect(paraDef?.name).toBe('Common:Paralysis');
      expect(paraDef?.graphic).toBe('PRAS- Status');
      expect(paraDef?.frames.length).toBeGreaterThan(0);

      const burnDef = await ANIMATION_REGISTRY.getDefinition(7);
      expect(burnDef).not.toBeNull();
      expect(burnDef?.name).toBe('Common:Burn');
      expect(burnDef?.graphic).toBe('PRAS- Status');
      expect(burnDef?.frames.length).toBeGreaterThan(0);

      const sleepDef = await ANIMATION_REGISTRY.getDefinition(4);
      expect(sleepDef).not.toBeNull();
      expect(sleepDef?.name).toBe('Common:Sleep');
      expect(sleepDef?.graphic).toBe('PRAS- Status');

      const poisonDef = await ANIMATION_REGISTRY.getDefinition(5);
      expect(poisonDef).not.toBeNull();
      expect(poisonDef?.name).toBe('Common:Poison');

      const confuseDef = await ANIMATION_REGISTRY.getDefinition(10);
      expect(confuseDef).not.toBeNull();
      expect(confuseDef?.name).toBe('Common:Confusion');
    });

    it('plays status condition animation on player battler and ticks to completion', async () => {
      let hitCalled = false;
      let completeCalled = false;

      const inst = await battleAnimationPlayer.play({
        moveId: '8',
        animId: 8,
        userSide: 'player',
        userPos: { x: 130, y: 215 },
        targetPos: { x: 130, y: 215 },
        selfTarget: true,
        moveCategory: 'status',
        onHit: () => {
          hitCalled = true;
        },
        onComplete: () => {
          completeCalled = true;
        },
      });

      expect(inst).not.toBeNull();
      expect(battleAnimationPlayer.isPlaying()).toBe(true);

      // Advance frames across the full duration
      battleAnimationPlayer.update(500);
      expect(hitCalled).toBe(true);

      battleAnimationPlayer.update(1000);
      expect(completeCalled).toBe(true);
      expect(battleAnimationPlayer.isPlaying()).toBe(false);
    });

    it('plays status condition animation on enemy battler and ticks to completion', async () => {
      let completeCalled = false;

      const inst = await battleAnimationPlayer.play({
        moveId: '7',
        animId: 7,
        userSide: 'enemy',
        userPos: { x: 380, y: 115 },
        targetPos: { x: 380, y: 115 },
        selfTarget: true,
        moveCategory: 'status',
        onComplete: () => {
          completeCalled = true;
        },
      });

      expect(inst).not.toBeNull();
      expect(battleAnimationPlayer.isPlaying()).toBe(true);

      battleAnimationPlayer.update(1000);
      expect(completeCalled).toBe(true);
      expect(battleAnimationPlayer.isPlaying()).toBe(false);
    });
  });

  describe('12. Essentials OppMove Enemy Animation & Coordinate Transformer Parity', () => {
    it('correctly detects opponent move animations', () => {
      expect(ANIMATION_REGISTRY.isOpponentAnimation(1175, 'OppMove:ALLOUTPUMMELING')).toBe(true);
      expect(ANIMATION_REGISTRY.isOpponentAnimation(1108, 'OppMove:AURORAVEIL')).toBe(true);
      expect(ANIMATION_REGISTRY.isOpponentAnimation(6320, 'OppMove:ARMTHRUST')).toBe(true);
      expect(ANIMATION_REGISTRY.isOpponentAnimation(117, 'OppMove:FLAMETHROWER')).toBe(true);
      expect(ANIMATION_REGISTRY.isOpponentAnimation(275, 'Move:TACKLE')).toBe(false);
    });

    it('resolves type fallbacks for enemy to opponent moves when available', () => {
      // Enemy using Fire special move (e.g. Armor Cannon) falls back to OppMove:FLAMETHROWER (117)
      const enemyFireId = ANIMATION_REGISTRY.resolveAnimationId(
        'armor_cannon',
        true,
        'Fire',
        'special'
      );
      expect(enemyFireId).toBe(117);

      // Player using Fire special move falls back to Move:FLAMETHROWER (116)
      const playerFireId = ANIMATION_REGISTRY.resolveAnimationId(
        'armor_cannon',
        false,
        'Fire',
        'special'
      );
      expect(playerFireId).toBe(116);
    });

    it('defaults nil/omitted (0, 0) coordinates to effective battler anchors', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // Target focus with omitted coordinates (0, 0)
      const targetDefault = CoordinateTransformer.resolveCelPosition(
        0,
        0,
        'target',
        playerCenter,
        enemyCenter
      );
      expect(targetDefault).toEqual(enemyCenter);

      // User focus with omitted coordinates (0, 0)
      const userDefault = CoordinateTransformer.resolveCelPosition(
        0,
        0,
        'user',
        playerCenter,
        enemyCenter
      );
      expect(userDefault).toEqual(playerCenter);

      // Both focus with omitted coordinates (0, 0)
      const bothDefault = CoordinateTransformer.resolveCelPosition(
        0,
        0,
        'both',
        playerCenter,
        enemyCenter
      );
      expect(bothDefault).toEqual(playerCenter);
    });

    it('correctly maps enemy-cast OppMove animations to target (player)', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // In Arm Thrust OppMove (6320), target hit cel is authored at (392, 109) near target anchor (384, 96).
      // When enemy attacks, targetPos is playerCenter so it resolves near the player.
      const hitPos = CoordinateTransformer.resolveCelPosition(
        392,
        109,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true // isOppMove (unused, kept for API compat)
      );

      // Should land on the defending player in-bounds
      expect(hitPos.x).toBeGreaterThan(0);
      expect(hitPos.x).toBeLessThan(512);
      expect(hitPos.y).toBeGreaterThan(0);
      expect(hitPos.y).toBeLessThan(288);
      expect(hitPos.x).toBe(138); // 130 + (392 - 384) = 138
      expect(hitPos.y).toBe(228); // 215 + (109 - 96) = 228
    });

    it('plays enemy OppMove animations in battleAnimationPlayer without out-of-bounds error', async () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      const inst = await battleAnimationPlayer.play({
        moveId: 'arm_thrust',
        animId: 6320,
        userSide: 'enemy',
        userPos: enemyCenter,
        targetPos: playerCenter,
        moveCategory: 'physical',
      });

      expect(inst).not.toBeNull();
      expect(inst?.isOppMove).toBe(true);
      expect(battleAnimationPlayer.isPlaying()).toBe(true);

      battleAnimationPlayer.update(500);
      expect(battleAnimationPlayer.isPlaying()).toBe(false);
    });

    it('correctly resolves all Batch 1 C-moves to dedicated Unbreakable Ties animations', () => {
      // 10 Batch 1 moves - Player resolution
      expect(ANIMATION_REGISTRY.resolveAnimationId('calm_mind', false)).toBe(424);
      expect(ANIMATION_REGISTRY.resolveAnimationId('charge_beam', false)).toBe(595);
      expect(ANIMATION_REGISTRY.resolveAnimationId('chatter', false)).toBe(889);
      expect(ANIMATION_REGISTRY.resolveAnimationId('clamp', false)).toBe(1054);
      expect(ANIMATION_REGISTRY.resolveAnimationId('coil', false)).toBe(918);
      expect(ANIMATION_REGISTRY.resolveAnimationId('conversion', false)).toBe(789);
      expect(ANIMATION_REGISTRY.resolveAnimationId('crabhammer', false)).toBe(1030);
      expect(ANIMATION_REGISTRY.resolveAnimationId('cross_chop', false)).toBe(499);
      expect(ANIMATION_REGISTRY.resolveAnimationId('cross_poison', false)).toBe(759);
      expect(ANIMATION_REGISTRY.resolveAnimationId('crush_grip', false)).toBe(999);
      expect(ANIMATION_REGISTRY.resolveAnimationId('close_combat', false)).toBe(6790);

      // Opponent variants
      expect(ANIMATION_REGISTRY.resolveAnimationId('charge_beam', true)).toBe(596);
      expect(ANIMATION_REGISTRY.resolveAnimationId('chatter', true)).toBe(890);
      expect(ANIMATION_REGISTRY.resolveAnimationId('crabhammer', true)).toBe(1031);
      expect(ANIMATION_REGISTRY.resolveAnimationId('cross_poison', true)).toBe(760);
      expect(ANIMATION_REGISTRY.resolveAnimationId('crush_grip', true)).toBe(1000);
      expect(ANIMATION_REGISTRY.resolveAnimationId('close_combat', true)).toBe(6791);
    });

    it('correctly maps Batch 1 C-move enemy OppMove animations onto defending player without out-of-bounds', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // In Crabhammer OppMove (1031), cel at frame 6 hits at normalized (312, 138)
      const crabPos = CoordinateTransformer.resolveCelPosition(
        312,
        138,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true
      );
      expect(crabPos.x).toBeGreaterThan(0);
      expect(crabPos.x).toBeLessThan(512);
      expect(crabPos.y).toBeGreaterThan(0);
      expect(crabPos.y).toBeLessThan(288);
      // Distance from player center is within 80px
      const crabDist = Math.hypot(crabPos.x - playerCenter.x, crabPos.y - playerCenter.y);
      expect(crabDist).toBeLessThan(85);

      // In Crush Grip OppMove (1000), squeezing cel at frame 12 lands on target
      const crushPos = CoordinateTransformer.resolveCelPosition(
        400,
        72,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true
      );
      expect(crushPos.x).toBeGreaterThan(0);
      expect(crushPos.x).toBeLessThan(512);
      expect(crushPos.y).toBeGreaterThan(0);
      expect(crushPos.y).toBeLessThan(288);
      const crushDist = Math.hypot(crushPos.x - playerCenter.x, crushPos.y - playerCenter.y);
      expect(crushDist).toBeLessThan(35);

      // In Close Combat OppMove (6791), normalized punch at frame 10 (344, 124) hits defending player
      const ccPos = CoordinateTransformer.resolveCelPosition(
        344,
        124,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true
      );
      expect(ccPos.x).toBeGreaterThan(0);
      expect(ccPos.x).toBeLessThan(512);
      expect(ccPos.y).toBeGreaterThan(0);
      expect(ccPos.y).toBeLessThan(288);
      const ccDist = Math.hypot(ccPos.x - playerCenter.x, ccPos.y - playerCenter.y);
      expect(ccDist).toBeLessThan(50);

      // In Charge Beam OppMove (596), Frame 0 charge cel (148, 212) with focus 'both'
      // starts directly at Enemy user (around 360, 123) and NOT at Player (130, 215)
      const chargeBeamEnemy = CoordinateTransformer.resolveCelPosition(
        148,
        212,
        'both',
        enemyCenter,
        playerCenter
      );
      expect(chargeBeamEnemy.x).toBeGreaterThan(340);
      expect(chargeBeamEnemy.x).toBeLessThan(380);
      expect(chargeBeamEnemy.y).toBeGreaterThan(110);
      expect(chargeBeamEnemy.y).toBeLessThan(140);
      const enemyChargeDist = Math.hypot(chargeBeamEnemy.x - enemyCenter.x, chargeBeamEnemy.y - enemyCenter.y);
      expect(enemyChargeDist).toBeLessThan(30);

      // And beam impact cel (370, 117) lands directly on Player defender
      const chargeBeamHit = CoordinateTransformer.resolveCelPosition(
        370,
        117,
        'both',
        enemyCenter,
        playerCenter
      );
      expect(chargeBeamHit.x).toBeGreaterThan(120);
      expect(chargeBeamHit.x).toBeLessThan(160);
      expect(chargeBeamHit.y).toBeGreaterThan(190);
      expect(chargeBeamHit.y).toBeLessThan(230);
      const playerHitDist = Math.hypot(chargeBeamHit.x - playerCenter.x, chargeBeamHit.y - playerCenter.y);
      expect(playerHitDist).toBeLessThan(30);
    });

    it('correctly resolves all Batch 2 C-moves to dedicated Unbreakable Ties animations', () => {
      // 20 Batch 2 moves
      expect(ANIMATION_REGISTRY.resolveAnimationId('camouflage', false)).toBe(925);
      expect(ANIMATION_REGISTRY.resolveAnimationId('captivate', false)).toBe(919);
      expect(ANIMATION_REGISTRY.resolveAnimationId('catastropika', false)).toBe(1206);
      expect(ANIMATION_REGISTRY.resolveAnimationId('celebrate', false)).toBe(1240);
      expect(ANIMATION_REGISTRY.resolveAnimationId('chip_away', false)).toBe(645);
      expect(ANIMATION_REGISTRY.resolveAnimationId('circle_throw', false)).toBe(646);
      expect(ANIMATION_REGISTRY.resolveAnimationId('clanging_scales', false)).toBe(1354);
      expect(ANIMATION_REGISTRY.resolveAnimationId('clangorous_soul', false)).toBe(1255);
      expect(ANIMATION_REGISTRY.resolveAnimationId('coaching', false)).toBe(1301);
      expect(ANIMATION_REGISTRY.resolveAnimationId('confide', false)).toBe(834);
      expect(ANIMATION_REGISTRY.resolveAnimationId('confusion', false)).toBe(528);
      expect(ANIMATION_REGISTRY.resolveAnimationId('constrict', false)).toBe(618);
      expect(ANIMATION_REGISTRY.resolveAnimationId('conversion_2', false)).toBe(790);
      expect(ANIMATION_REGISTRY.resolveAnimationId('copycat', false)).toBe(1355);
      expect(ANIMATION_REGISTRY.resolveAnimationId('core_enforcer', false)).toBe(1356);
      expect(ANIMATION_REGISTRY.resolveAnimationId('corrosive_gas', false)).toBe(1302);
      expect(ANIMATION_REGISTRY.resolveAnimationId('cosmic_power', false)).toBe(475);
      expect(ANIMATION_REGISTRY.resolveAnimationId('court_change', false)).toBe(1256);
      expect(ANIMATION_REGISTRY.resolveAnimationId('covet', false)).toBe(524);
      expect(ANIMATION_REGISTRY.resolveAnimationId('crafty_shield', false)).toBe(943);

      // Opponent variants
      expect(ANIMATION_REGISTRY.resolveAnimationId('conversion_2', true)).toBe(791);
      expect(ANIMATION_REGISTRY.resolveAnimationId('crafty_shield', true)).toBe(944);
    });

    it('correctly maps Batch 2 enemy OppMove animations onto defending player and user', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // In Crafty Shield Opponent (944), protective shield renders around enemy user
      const shieldPos = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'user',
        enemyCenter,
        playerCenter,
        512,
        288,
        true,
        true,
        false,
        true
      );
      expect(shieldPos.x).toBe(enemyCenter.x);
      expect(shieldPos.y).toBe(enemyCenter.y);

      // In Catastropika (1206), thunder impact lands on target player
      const catastroPos = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        false
      );
      expect(catastroPos.x).toBe(playerCenter.x);
      expect(catastroPos.y).toBe(playerCenter.y);
    });

    it('correctly resolves all Batch 3 C-moves to dedicated PRAS animations without collisions', () => {
      // 12 Batch 3 moves
      expect(ANIMATION_REGISTRY.resolveAnimationId('charge', false)).toBe(6792);
      expect(ANIMATION_REGISTRY.resolveAnimationId('charm', false)).toBe(6793);
      expect(ANIMATION_REGISTRY.resolveAnimationId('clear_smog', false)).toBe(6794);
      expect(ANIMATION_REGISTRY.resolveAnimationId('comet_punch', false)).toBe(6795);
      expect(ANIMATION_REGISTRY.resolveAnimationId('confuse_ray', false)).toBe(6800);
      expect(ANIMATION_REGISTRY.resolveAnimationId('cotton_guard', false)).toBe(6801);
      expect(ANIMATION_REGISTRY.resolveAnimationId('cotton_spore', false)).toBe(6802);
      expect(ANIMATION_REGISTRY.resolveAnimationId('counter', false)).toBe(6803);
      expect(ANIMATION_REGISTRY.resolveAnimationId('crunch', false)).toBe(6804);
      expect(ANIMATION_REGISTRY.resolveAnimationId('crush_claw', false)).toBe(6805);
      expect(ANIMATION_REGISTRY.resolveAnimationId('curse', false)).toBe(6807);
      expect(ANIMATION_REGISTRY.resolveAnimationId('cut', false)).toBe(6809);

      // Opponent variant
      expect(ANIMATION_REGISTRY.resolveAnimationId('crush_claw', true)).toBe(6806);
    });

    it('correctly maps Batch 3 enemy OppMove animations onto defending player without out-of-bounds', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // In Crush Claw Opponent (6806), slash lands directly on player
      const clawPos = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true
      );
      expect(clawPos.x).toBe(playerCenter.x);
      expect(clawPos.y).toBe(playerCenter.y);

      // In Cut (6809), slash lands on player
      const cutPos = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        false
      );
      expect(cutPos.x).toBe(playerCenter.x);
      expect(cutPos.y).toBe(playerCenter.y);
    });

    it('correctly resolves Batch 1 D-moves to dedicated PRAS animations without collisions', () => {
      // Moves with dedicated OppMove
      expect(ANIMATION_REGISTRY.resolveAnimationId('dark_pulse', false)).toBe(665);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dark_pulse', true)).toBe(666);
      expect(ANIMATION_REGISTRY.resolveAnimationId('destiny_bond', false)).toBe(515);
      expect(ANIMATION_REGISTRY.resolveAnimationId('destiny_bond', true)).toBe(516);
      expect(ANIMATION_REGISTRY.resolveAnimationId('detect', false)).toBe(407);
      expect(ANIMATION_REGISTRY.resolveAnimationId('detect', true)).toBe(408);
      expect(ANIMATION_REGISTRY.resolveAnimationId('devastating_drake', false)).toBe(1200);
      expect(ANIMATION_REGISTRY.resolveAnimationId('devastating_drake', true)).toBe(1201);
      expect(ANIMATION_REGISTRY.resolveAnimationId('disable', false)).toBe(373);
      expect(ANIMATION_REGISTRY.resolveAnimationId('disable', true)).toBe(374);
      expect(ANIMATION_REGISTRY.resolveAnimationId('disarming_voice', false)).toBe(685);
      expect(ANIMATION_REGISTRY.resolveAnimationId('disarming_voice', true)).toBe(686);
      expect(ANIMATION_REGISTRY.resolveAnimationId('double_hit', false)).toBe(799);
      expect(ANIMATION_REGISTRY.resolveAnimationId('double_hit', true)).toBe(801);

      // Re-mapped moves avoiding old collisions
      expect(ANIMATION_REGISTRY.resolveAnimationId('defense_curl', false)).toBe(6810);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dizzy_punch', false)).toBe(6811);
      expect(ANIMATION_REGISTRY.resolveAnimationId('double_edge', false)).toBe(6812);
      expect(ANIMATION_REGISTRY.resolveAnimationId('double_team', false)).toBe(6813);

      // Other canonical moves
      expect(ANIMATION_REGISTRY.resolveAnimationId('dig', false)).toBe(563);
      expect(ANIMATION_REGISTRY.resolveAnimationId('discharge', false)).toBe(710);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dive', false)).toBe(654);
      expect(ANIMATION_REGISTRY.resolveAnimationId('double_kick', false)).toBe(335);
      expect(ANIMATION_REGISTRY.resolveAnimationId('double_slap', false)).toBe(356);
      expect(ANIMATION_REGISTRY.resolveAnimationId('doubleslap', false)).toBe(356);
    });

    it('correctly maps Batch 1 D-moves enemy OppMove animations onto defending player without out-of-bounds', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // Double Hit Opponent (801): normalized target cels anchor onto player
      const doubleHitPos = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true
      );
      expect(doubleHitPos.x).toBe(playerCenter.x);
      expect(doubleHitPos.y).toBe(playerCenter.y);

      // Devastating Drake Opponent (1201): normalized target cels anchor onto player
      const drakePos = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true
      );
      expect(drakePos.x).toBe(playerCenter.x);
      expect(drakePos.y).toBe(playerCenter.y);
    });

    it('correctly resolves Batch 2 D-moves to dedicated PRAS animations without collisions', () => {
      // Re-mapped moves avoiding old collisions
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_breath', false)).toBe(6814);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_breath', true)).toBe(6815);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragonbreath', false)).toBe(6814);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragonbreath', true)).toBe(6815);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_claw', false)).toBe(6816);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_claw', true)).toBe(6817);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_rage', false)).toBe(6818);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dynamic_punch', false)).toBe(6819);

      // Moves with dedicated OppMove
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_darts', false)).toBe(1258);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_darts', true)).toBe(1260);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_pulse', false)).toBe(565);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_pulse', true)).toBe(566);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_tail', false)).toBe(937);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_tail', true)).toBe(938);
      expect(ANIMATION_REGISTRY.resolveAnimationId('drain_punch', false)).toBe(573);
      expect(ANIMATION_REGISTRY.resolveAnimationId('drain_punch', true)).toBe(574);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dream_eater', false)).toBe(891);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dream_eater', true)).toBe(892);
      expect(ANIMATION_REGISTRY.resolveAnimationId('drill_run', false)).toBe(950);
      expect(ANIMATION_REGISTRY.resolveAnimationId('drill_run', true)).toBe(951);
      expect(ANIMATION_REGISTRY.resolveAnimationId('drum_beating', false)).toBe(1266);
      expect(ANIMATION_REGISTRY.resolveAnimationId('drum_beating', true)).toBe(1267);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dual_chop', false)).toBe(895);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dual_chop', true)).toBe(897);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dual_wingbeat', false)).toBe(1303);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dual_wingbeat', true)).toBe(1305);

      // Other canonical moves
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_ascent', false)).toBe(902);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_dance', false)).toBe(330);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_energy', false)).toBe(1344);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_hammer', false)).toBe(1362);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dragon_rush', false)).toBe(510);
      expect(ANIMATION_REGISTRY.resolveAnimationId('draining_kiss', false)).toBe(633);
      expect(ANIMATION_REGISTRY.resolveAnimationId('drill_peck', false)).toBe(656);
      expect(ANIMATION_REGISTRY.resolveAnimationId('dynamax_cannon', false)).toBe(1268);
    });

    it('correctly maps Batch 2 D-moves enemy OppMove animations onto defending player without out-of-bounds', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // Dragon Tail (938), Drill Run (951), Dual Chop (897), Dual Wingbeat (1305)
      for (const moveName of ['dragon_tail', 'drill_run', 'dual_chop', 'dual_wingbeat']) {
        const pos = CoordinateTransformer.resolveCelPosition(
          384,
          96,
          'target',
          enemyCenter,
          playerCenter,
          512,
          288,
          false,
          false,
          false,
          true
        );
        expect(pos.x).toBe(playerCenter.x);
        expect(pos.y).toBe(playerCenter.y);
      }
    });

    it('validates that all D-group moves have valid sound timings and existing audio files on disk', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const publicSeDir = path.resolve(__dirname, '../public/Audio/SE');

      const dMoveKeys = [
        'dark_pulse', 'dark_void', 'darkest_lariat', 'dazzling_gleam', 'decorate',
        'defend_order', 'defense_curl', 'defog', 'destiny_bond', 'detect',
        'devastating_drake', 'diamond_storm', 'dig', 'disable', 'disarming_voice',
        'discharge', 'dive', 'dizzy_punch', 'doom_desire', 'double_edge',
        'double_hit', 'double_iron_bash', 'double_kick', 'double_slap', 'double_team',
        'draco_meteor', 'dragon_ascent', 'dragon_breath', 'dragon_claw', 'dragon_dance',
        'dragon_darts', 'dragon_energy', 'dragon_hammer', 'dragon_pulse', 'dragon_rage',
        'dragon_rush', 'dragon_tail', 'drain_punch', 'draining_kiss', 'dream_eater',
        'drill_peck', 'drill_run', 'drum_beating', 'dual_chop', 'dual_wingbeat',
        'dynamax_cannon', 'dynamic_punch'
      ];

      let totalSoundEvents = 0;
      for (const move of dMoveKeys) {
        const animId = ANIMATION_REGISTRY.resolveAnimationId(move, false);
        expect(animId).toBeGreaterThan(0);
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def).not.toBeNull();

        const soundTimings = (def?.timings || []).filter((t) => t.type === 'sound');
        for (const st of soundTimings) {
          totalSoundEvents++;
          const soundName = st.payload?.sound as string;
          expect(typeof soundName).toBe('string');
          expect(soundName.length).toBeGreaterThan(0);
          expect(/\.(png|jpe?g|bmp)$/i.test(soundName)).toBe(false);

          // Verify file presence
          const filePath = path.join(publicSeDir, soundName);
          const animFilePath = path.join(publicSeDir, 'Anim', soundName);
          const exists = fs.existsSync(filePath) || fs.existsSync(animFilePath);
          expect(exists).toBe(true);
        }
      }
      expect(totalSoundEvents).toBeGreaterThan(50);
    }, 20000);

    it('accurately resolves isOppMoveTrajectoryReversed for whitelisted opponent moves', () => {
      const expectedIds = ['686', '6401', '6815', '666', '566', '1260', '1201', '574', '892'];
      for (const id of expectedIds) {
        expect(isOppMoveTrajectoryReversed(id)).toBe(true);
        expect(isOppMoveTrajectoryReversed(Number(id))).toBe(true);
        expect(OPP_MOVE_TRAJECTORY_REVERSED_IDS.has(id)).toBe(true);
      }
      expect(isOppMoveTrajectoryReversed('99999')).toBe(false);
      expect(isOppMoveTrajectoryReversed(undefined)).toBe(false);
    });

    it('mirrors trajectory for D-moves OppMove with focus="both" so enemy casts travel toward player', () => {
      const enemyCenter = { x: 380, y: 115 };
      const playerCenter = { x: 130, y: 215 };

      // Dark Pulse (666): authored start at x=368, end at x=152
      const darkPulseStart = CoordinateTransformer.resolveCelPosition(
        368,
        101,
        'both',
        enemyCenter,
        playerCenter,
        512,
        true, // isEnemy
        false,
        false,
        false,
        true, // _isOppMove
        666
      );
      const darkPulseEnd = CoordinateTransformer.resolveCelPosition(
        152,
        213,
        'both',
        enemyCenter,
        playerCenter,
        512,
        true, // isEnemy
        false,
        false,
        false,
        true, // _isOppMove
        666
      );

      // Start should be near enemy (380), end should be near player (130)
      expect(darkPulseStart.x).toBeGreaterThan(300);
      expect(darkPulseEnd.x).toBeLessThan(200);

      // Dragon Pulse (566): authored start at x=352, end at x=152
      const dragonPulseStart = CoordinateTransformer.resolveCelPosition(
        352,
        113,
        'both',
        enemyCenter,
        playerCenter,
        512,
        true,
        false,
        false,
        false,
        true,
        566
      );
      const dragonPulseEnd = CoordinateTransformer.resolveCelPosition(
        152,
        217,
        'both',
        enemyCenter,
        playerCenter,
        512,
        true,
        false,
        false,
        false,
        true,
        566
      );
      expect(dragonPulseStart.x).toBeGreaterThan(300);
      expect(dragonPulseEnd.x).toBeLessThan(200);
    });

    it('correctly anchors Dig (563) hole under user to userPos and hole under target to targetPos without OOB', async () => {
      const enemyCenter = { x: 380, y: 115 };
      const playerCenter = { x: 130, y: 215 };
      const def = await ANIMATION_REGISTRY.getDefinition(563);
      expect(def).not.toBeNull();

      for (const frame of def!.frames) {
        for (const cel of frame.cels) {
          if (cel.pattern < 0) continue;
          const pos = CoordinateTransformer.resolveCelPosition(
            cel.x,
            cel.y,
            cel.focus,
            enemyCenter,
            playerCenter,
            512,
            true, // isEnemy
            false,
            false,
            false,
            false,
            563
          );
          expect(pos.x).toBeGreaterThanOrEqual(0);
          expect(pos.x).toBeLessThanOrEqual(512);
          expect(pos.y).toBeGreaterThanOrEqual(0);
          expect(pos.y).toBeLessThanOrEqual(320);
        }
      }
    });

    it('correctly re-anchors Dragon Dance (330) onto user battler when cast by enemy', () => {
      const enemyCenter = { x: 380, y: 115 };
      const playerCenter = { x: 130, y: 215 };

      // Dragon Dance has authored target-focused cels at x=312, y=118
      const pos = CoordinateTransformer.resolveCelPosition(
        312,
        118,
        'target',
        enemyCenter,
        playerCenter,
        512,
        true, // isEnemy
        false, // selfTarget
        false,
        false,
        false,
        330
      );
      // Must resolve around Enemy (x=380 + (312-384) = 308, y=115 + (118-96) = 137), NOT Player
      expect(Math.abs(pos.x - enemyCenter.x)).toBeLessThan(100);
      expect(Math.abs(pos.x - playerCenter.x)).toBeGreaterThan(150);
    });

    it('correctly resolves Battler Flash for each side based on attackerSide and selfTarget', async () => {
      const player = new BattleAnimationPlayer();

      // Test 1: Enemy attacks Player with move having scope 1 (target flash) and scope 2 (user flash)
      const mockTimeline: BattleAnimationDefinition = {
        id: 9999,
        name: 'Move:TEST',
        graphic: '',
        hue: 0,
        position: 1,
        fps: 20,
        frames: [{ cels: [] }, { cels: [] }],
        timings: [
          {
            frame: 0,
            type: 'flash',
            scope: 1, // Target flash (red)
            payload: { flashColor: [255, 0, 0, 255], flashDuration: 10, flashScope: 1 },
          },
          {
            frame: 0,
            type: 'flash',
            scope: 2, // User flash (blue)
            payload: { flashColor: [0, 0, 255, 255], flashDuration: 10, flashScope: 2 },
          },
        ],
      };

      vi.spyOn(ANIMATION_REGISTRY, 'getDefinition').mockResolvedValue(mockTimeline);

      // Enemy attacks Player
      await player.play({
        moveId: 'test_attack',
        userSide: 'enemy',
        userPos: { x: 380, y: 115 },
        targetPos: { x: 130, y: 215 },
        selfTarget: false,
      });

      // Target is Player -> Player should receive scope 1 (red)
      const playerFlash = player.getBattlerFlashColorForSide('player');
      expect(playerFlash).toEqual([255, 0, 0, 255]);

      // Attacker is Enemy -> Enemy should receive scope 2 (blue)
      const enemyFlash = player.getBattlerFlashColorForSide('enemy');
      expect(enemyFlash).toEqual([0, 0, 255, 255]);

      // Test 2: Enemy uses Self-Target buff
      await player.play({
        moveId: 'dragon_dance',
        userSide: 'enemy',
        userPos: { x: 380, y: 115 },
        targetPos: { x: 380, y: 115 },
        selfTarget: true,
      });

      // Enemy is self-buffing -> Enemy gets flash
      expect(player.getBattlerFlashColorForSide('enemy')).not.toBeNull();
      // Player is NOT targeted -> Player gets null
      expect(player.getBattlerFlashColorForSide('player')).toBeNull();
    });

    it('correctly resolves all Batch 1 E-moves to dedicated Unbreakable Ties animations', () => {
      // 12 Batch 1 moves with dedicated animations (14 moves total, 2 Gen 9 fallbacks)
      expect(ANIMATION_REGISTRY.resolveAnimationId('earth_power', false)).toBe(518);
      expect(ANIMATION_REGISTRY.resolveAnimationId('earthquake', false)).toBe(662);
      expect(ANIMATION_REGISTRY.resolveAnimationId('echoed_voice', false)).toBe(1001);
      expect(ANIMATION_REGISTRY.resolveAnimationId('eerie_impulse', false)).toBe(1363);
      expect(ANIMATION_REGISTRY.resolveAnimationId('eerie_spell', false)).toBe(1345);
      expect(ANIMATION_REGISTRY.resolveAnimationId('egg_bomb', false)).toBe(803);
      expect(ANIMATION_REGISTRY.resolveAnimationId('electric_terrain', false)).toBe(441);
      expect(ANIMATION_REGISTRY.resolveAnimationId('electrify', false)).toBe(775);
      expect(ANIMATION_REGISTRY.resolveAnimationId('electro_ball', false)).toBe(647);
      expect(ANIMATION_REGISTRY.resolveAnimationId('electroweb', false)).toBe(866);
      expect(ANIMATION_REGISTRY.resolveAnimationId('embargo', false)).toBe(777);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ember', false)).toBe(6820);

      // Opponent variants
      expect(ANIMATION_REGISTRY.resolveAnimationId('eerie_impulse', true)).toBe(1364);
      expect(ANIMATION_REGISTRY.resolveAnimationId('egg_bomb', true)).toBe(804);
      expect(ANIMATION_REGISTRY.resolveAnimationId('electrify', true)).toBe(776);
      expect(ANIMATION_REGISTRY.resolveAnimationId('electro_ball', true)).toBe(648);
    });

    it('mirrors trajectory for E-moves OppMove with focus="both" so enemy casts travel toward player', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // 1. Check whitelist
      expect(CoordinateTransformer.isOppMoveTrajectoryReversed('1364')).toBe(true);
      expect(CoordinateTransformer.isOppMoveTrajectoryReversed('804')).toBe(true);
      expect(CoordinateTransformer.isOppMoveTrajectoryReversed('776')).toBe(true);
      expect(CoordinateTransformer.isOppMoveTrajectoryReversed('648')).toBe(true);

      // 2. Eerie Impulse OppMove (1364):
      // Frame 0 start: celX = 384. With reversal, mirrors to 512 - 384 = 128 (progress 0 = enemy)
      const eerieStart = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true, // isOppMove
        1364
      );
      expect(eerieStart.x).toBeCloseTo(enemyCenter.x, 0);
      expect(eerieStart.y).toBeCloseTo(enemyCenter.y, 0);

      // Frame 19 end: celX = 128. With reversal, mirrors to 512 - 128 = 384 (progress 1 = player)
      const eerieEnd = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true, // isOppMove
        1364
      );
      expect(eerieEnd.x).toBeCloseTo(playerCenter.x, 0);
      expect(eerieEnd.y).toBeCloseTo(playerCenter.y, 0);

      // 3. Egg Bomb OppMove (804):
      // Frame 0 start: celX = 377
      const eggStart = CoordinateTransformer.resolveCelPosition(
        377,
        105,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        804
      );
      expect(Math.abs(eggStart.x - enemyCenter.x)).toBeLessThan(20);

      // Frame 16 impact: celX = 153 -> mirrors to 359 (progress ~ 0.90 -> near player)
      const eggImpact = CoordinateTransformer.resolveCelPosition(
        153,
        217,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        804
      );
      expect(Math.abs(eggImpact.x - playerCenter.x)).toBeLessThan(30);

      // 4. Electro Ball OppMove (648):
      // Frame 0 start: celX = 362
      const ballStart = CoordinateTransformer.resolveCelPosition(
        362,
        112,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        648
      );
      expect(Math.abs(ballStart.x - enemyCenter.x)).toBeLessThan(25);

      // Frame 32 end: celX = 136 -> near player
      const ballEnd = CoordinateTransformer.resolveCelPosition(
        136,
        250,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        648
      );
      expect(Math.abs(ballEnd.x - playerCenter.x)).toBeLessThan(25);
    });

    it('validates that all Batch 1 E-group moves have valid sound timings and existing audio files on disk', async () => {
      const eAnimIds = [518, 662, 1001, 1363, 1364, 1345, 803, 804, 441, 775, 776, 647, 648, 866, 777, 6820];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of eAnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('correctly resolves all Batch 2 E-moves to dedicated Unbreakable Ties animations', () => {
      // 12 Batch 2 moves with dedicated animations (13 keys with alias, 1 Gen 9 fallback)
      expect(ANIMATION_REGISTRY.resolveAnimationId('encore', false)).toBe(6821);
      expect(ANIMATION_REGISTRY.resolveAnimationId('endeavor', false)).toBe(683);
      expect(ANIMATION_REGISTRY.resolveAnimationId('endure', false)).toBe(817);
      expect(ANIMATION_REGISTRY.resolveAnimationId('energy_ball', false)).toBe(6823);
      expect(ANIMATION_REGISTRY.resolveAnimationId('entrainment', false)).toBe(835);
      expect(ANIMATION_REGISTRY.resolveAnimationId('eruption', false)).toBe(6825);
      expect(ANIMATION_REGISTRY.resolveAnimationId('eternabeam', false)).toBe(1269);
      expect(ANIMATION_REGISTRY.resolveAnimationId('expanding_force', false)).toBe(1307);
      expect(ANIMATION_REGISTRY.resolveAnimationId('explosion', false)).toBe(6827);
      expect(ANIMATION_REGISTRY.resolveAnimationId('extrasensory', false)).toBe(651);
      expect(ANIMATION_REGISTRY.resolveAnimationId('extreme_evoboost', false)).toBe(1210);
      expect(ANIMATION_REGISTRY.resolveAnimationId('extreme_speed', false)).toBe(463);
      expect(ANIMATION_REGISTRY.resolveAnimationId('extremespeed', false)).toBe(463);

      // Opponent variants
      expect(ANIMATION_REGISTRY.resolveAnimationId('encore', true)).toBe(6822);
      expect(ANIMATION_REGISTRY.resolveAnimationId('energy_ball', true)).toBe(6824);
      expect(ANIMATION_REGISTRY.resolveAnimationId('eruption', true)).toBe(6826);
      expect(ANIMATION_REGISTRY.resolveAnimationId('extreme_speed', true)).toBe(464);
      expect(ANIMATION_REGISTRY.resolveAnimationId('extremespeed', true)).toBe(464);
    });

    it('mirrors trajectory for Batch 2 E-moves OppMove with focus="both" so enemy casts travel toward player', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // 1. Check whitelist
      expect(CoordinateTransformer.isOppMoveTrajectoryReversed('6824')).toBe(true);
      expect(CoordinateTransformer.isOppMoveTrajectoryReversed('6826')).toBe(true);

      // 2. Energy Ball OppMove (6824):
      // Frame 0 start: celX = 317. With reversal, mirrors to 512 - 317 = 195 (progress ~ 0.26 = near enemy)
      const ebStart = CoordinateTransformer.resolveCelPosition(
        317,
        103,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true, // isOppMove
        6824
      );
      expect(Math.abs(ebStart.x - enemyCenter.x)).toBeLessThan(80);

      // Frame 30 impact: celX = 128. With reversal, mirrors to 512 - 128 = 384 (progress 1.0 = player)
      const ebEnd = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6824
      );
      expect(ebEnd.x).toBeCloseTo(playerCenter.x, 0);
      expect(ebEnd.y).toBeCloseTo(playerCenter.y, 0);

      // 3. Eruption OppMove (6826):
      // Volcanic embers at frame 3 (celX = 384) -> with reversal mirrors to 128 (enemy side)
      const erupStart = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6826
      );
      expect(erupStart.x).toBeCloseTo(enemyCenter.x, 0);

      // Falling meteors at frame 33 (celX = 128) -> with reversal mirrors to 384 (player side)
      const erupImpact = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6826
      );
      expect(erupImpact.x).toBeCloseTo(playerCenter.x, 0);

      // 4. Encore OppMove (6822):
      // Frame 0: normalized cels at (70, 220) with focus="user" resolve right beside Enemy
      const encorePos = CoordinateTransformer.resolveCelPosition(
        70,
        220,
        'user',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6822
      );
      expect(Math.abs(encorePos.x - enemyCenter.x)).toBeLessThan(70);
      expect(Math.abs(encorePos.y - enemyCenter.y)).toBeLessThan(30);
    });

    it('validates that all Batch 2 E-group moves have valid sound timings and existing audio files on disk', async () => {
      const e2AnimIds = [6821, 6822, 683, 817, 6823, 6824, 835, 6825, 6826, 1269, 1307, 6827, 651, 1210, 463, 464];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of e2AnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('resolves correct canonical animation IDs and OppMove variants for Batch 1 F-group moves', () => {
      // 1. Standard single-variant moves
      expect(ANIMATION_REGISTRY.resolveAnimationId('facade')).toBe(722);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fairy_lock')).toBe(844);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fairy_wind')).toBe(6765);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fake_out')).toBe(6828);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fake_tears')).toBe(6829);
      expect(ANIMATION_REGISTRY.resolveAnimationId('false_swipe')).toBe(867);
      expect(ANIMATION_REGISTRY.resolveAnimationId('feather_dance')).toBe(958);
      expect(ANIMATION_REGISTRY.resolveAnimationId('featherdance')).toBe(958);
      expect(ANIMATION_REGISTRY.resolveAnimationId('feint_attack')).toBe(668);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fiery_wrath')).toBe(1346);
      expect(ANIMATION_REGISTRY.resolveAnimationId('final_gambit')).toBe(328);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fire_fang')).toBe(6834);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fire_lash')).toBe(1084);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fire_punch')).toBe(6837);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fire_spin')).toBe(321);
      expect(ANIMATION_REGISTRY.resolveAnimationId('first_impression')).toBe(1365);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fishious_rend')).toBe(1272);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fissure')).toBe(1072);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flail')).toBe(6838);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flare_blitz')).toBe(1056);

      // 2. Dual-variant moves with dedicated OppMove
      expect(ANIMATION_REGISTRY.resolveAnimationId('false_surrender', false)).toBe(1270);
      expect(ANIMATION_REGISTRY.resolveAnimationId('false_surrender', true)).toBe(1271);

      expect(ANIMATION_REGISTRY.resolveAnimationId('feint', false)).toBe(859);
      expect(ANIMATION_REGISTRY.resolveAnimationId('feint', true)).toBe(860);

      expect(ANIMATION_REGISTRY.resolveAnimationId('fell_stinger', false)).toBe(1024);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fell_stinger', true)).toBe(1025);

      expect(ANIMATION_REGISTRY.resolveAnimationId('fiery_dance', false)).toBe(6830);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fiery_dance', true)).toBe(6831);

      expect(ANIMATION_REGISTRY.resolveAnimationId('fire_blast', false)).toBe(6832);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fire_blast', true)).toBe(6833);

      expect(ANIMATION_REGISTRY.resolveAnimationId('fire_pledge', false)).toBe(6835);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fire_pledge', true)).toBe(6836);

      expect(ANIMATION_REGISTRY.resolveAnimationId('flame_burst', false)).toBe(386);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flame_burst', true)).toBe(387);

      expect(ANIMATION_REGISTRY.resolveAnimationId('flame_charge', false)).toBe(6839);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flame_charge', true)).toBe(6840);

      expect(ANIMATION_REGISTRY.resolveAnimationId('flame_wheel', false)).toBe(6841);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flame_wheel', true)).toBe(6842);

      expect(ANIMATION_REGISTRY.resolveAnimationId('flamethrower', false)).toBe(116);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flamethrower', true)).toBe(117);
    });

    it('correctly transforms trajectories for Batch 1 F-group OppMove animations', () => {
      // 1. Fire Blast OppMove (6833):
      // Authored starting at (404, 51) and moving to (204, 303).
      // With trajectory reversed, frame 0 should start near Enemy and end near Player.
      const fbStart = CoordinateTransformer.resolveCelPosition(
        404,
        51,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6833
      );
      expect(Math.abs(fbStart.x - enemyCenter.x)).toBeLessThan(80);

      const fbEnd = CoordinateTransformer.resolveCelPosition(
        204,
        303,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6833
      );
      expect(Math.abs(fbEnd.x - playerCenter.x)).toBeLessThan(80);

      // 2. Flame Charge OppMove (6840):
      // Authored starting at (368, 114) and dashing to (123, 227).
      // With trajectory reversed, start should be near Enemy and impact near Player.
      const fcStart = CoordinateTransformer.resolveCelPosition(
        368,
        114,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6840
      );
      expect(Math.abs(fcStart.x - enemyCenter.x)).toBeLessThan(50);

      const fcImpact = CoordinateTransformer.resolveCelPosition(
        123,
        227,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6840
      );
      expect(Math.abs(fcImpact.x - playerCenter.x)).toBeLessThan(50);
    });

    it('validates that all Batch 1 F-group moves have valid sound timings and existing audio files on disk', async () => {
      const f1AnimIds = [
        722, 844, 667, 6828, 6829, 1270, 1271, 867, 958, 859, 860, 668,
        1024, 1025, 6830, 6831, 1346, 328, 6832, 6833, 6834, 1084, 6835, 6836,
        6837, 321, 1365, 1272, 1072, 6838, 386, 387, 6839, 6840, 6841, 6842, 1056
      ];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of f1AnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('resolves correct canonical animation IDs and OppMove variants for Batch 2 F-group moves', () => {
      // 1. Standard single-variant moves
      expect(ANIMATION_REGISTRY.resolveAnimationId('flash')).toBe(118);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flash_cannon')).toBe(420);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flatter')).toBe(734);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fleur_cannon')).toBe(1366);
      expect(ANIMATION_REGISTRY.resolveAnimationId('floral_healing')).toBe(1093);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flower_shield')).toBe(781);
      expect(ANIMATION_REGISTRY.resolveAnimationId('focus_blast')).toBe(517);
      expect(ANIMATION_REGISTRY.resolveAnimationId('focus_energy')).toBe(6843);
      expect(ANIMATION_REGISTRY.resolveAnimationId('foresight')).toBe(124);
      expect(ANIMATION_REGISTRY.resolveAnimationId('forests_curse')).toBe(816);
      expect(ANIMATION_REGISTRY.resolveAnimationId('foul_play')).toBe(873);
      expect(ANIMATION_REGISTRY.resolveAnimationId('freeze_dry')).toBe(1032);
      expect(ANIMATION_REGISTRY.resolveAnimationId('freeze_shock')).toBe(852);
      expect(ANIMATION_REGISTRY.resolveAnimationId('freezing_glare')).toBe(1347);
      expect(ANIMATION_REGISTRY.resolveAnimationId('frustration')).toBe(875);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fury_cutter')).toBe(299);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fury_swipes')).toBe(137);
      expect(ANIMATION_REGISTRY.resolveAnimationId('future_sight')).toBe(142);

      // 2. Dual-variant moves with dedicated OppMove
      expect(ANIMATION_REGISTRY.resolveAnimationId('fling', false)).toBe(740);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fling', true)).toBe(741);

      expect(ANIMATION_REGISTRY.resolveAnimationId('flip_turn', false)).toBe(1308);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flip_turn', true)).toBe(1309);

      expect(ANIMATION_REGISTRY.resolveAnimationId('fly', false)).toBe(309);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fly', true)).toBe(311);

      expect(ANIMATION_REGISTRY.resolveAnimationId('flying_press', false)).toBe(742);
      expect(ANIMATION_REGISTRY.resolveAnimationId('flying_press', true)).toBe(743);

      expect(ANIMATION_REGISTRY.resolveAnimationId('focus_punch', false)).toBe(589);
      expect(ANIMATION_REGISTRY.resolveAnimationId('focus_punch', true)).toBe(590);

      expect(ANIMATION_REGISTRY.resolveAnimationId('follow_me', false)).toBe(6844);
      expect(ANIMATION_REGISTRY.resolveAnimationId('follow_me', true)).toBe(6845);

      expect(ANIMATION_REGISTRY.resolveAnimationId('force_palm', false)).toBe(537);
      expect(ANIMATION_REGISTRY.resolveAnimationId('force_palm', true)).toBe(538);

      expect(ANIMATION_REGISTRY.resolveAnimationId('frenzy_plant', false)).toBe(6846);
      expect(ANIMATION_REGISTRY.resolveAnimationId('frenzy_plant', true)).toBe(6847);

      expect(ANIMATION_REGISTRY.resolveAnimationId('frost_breath', false)).toBe(567);
      expect(ANIMATION_REGISTRY.resolveAnimationId('frost_breath', true)).toBe(568);

      expect(ANIMATION_REGISTRY.resolveAnimationId('fury_attack', false)).toBe(375);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fury_attack', true)).toBe(380);

      expect(ANIMATION_REGISTRY.resolveAnimationId('fusion_bolt', false)).toBe(1367);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fusion_bolt', true)).toBe(1368);

      expect(ANIMATION_REGISTRY.resolveAnimationId('fusion_flare', false)).toBe(1046);
      expect(ANIMATION_REGISTRY.resolveAnimationId('fusion_flare', true)).toBe(1047);
    });

    it('correctly transforms trajectories for Batch 2 F-group OppMove animations', () => {
      // 1. Fling OppMove (741):
      // Authored starting at (368, 117) and moving to (144, 225).
      // With trajectory reversed, start should be near Enemy and impact near Player.
      const flingStart = CoordinateTransformer.resolveCelPosition(
        368,
        117,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        741
      );
      expect(Math.abs(flingStart.x - enemyCenter.x)).toBeLessThan(50);

      const flingEnd = CoordinateTransformer.resolveCelPosition(
        144,
        225,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        741
      );
      expect(Math.abs(flingEnd.x - playerCenter.x)).toBeLessThan(50);

      // 2. Frost Breath OppMove (568):
      // Authored starting at (360, 93) and moving to (109, 231).
      const frostStart = CoordinateTransformer.resolveCelPosition(
        360,
        93,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        568
      );
      expect(Math.abs(frostStart.x - enemyCenter.x)).toBeLessThan(50);

      const frostEnd = CoordinateTransformer.resolveCelPosition(
        109,
        231,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        568
      );
      expect(Math.abs(frostEnd.x - playerCenter.x)).toBeLessThan(50);

      // 3. Follow Me OppMove (6845):
      // With selfTarget=true, target-focus cels authored at (372, 34) anchor right on Enemy.
      const followMePos = CoordinateTransformer.resolveCelPosition(
        372,
        34,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        true,
        true,
        false,
        true,
        6845
      );
      expect(Math.abs(followMePos.x - enemyCenter.x)).toBeLessThan(40);
      expect(Math.abs(followMePos.y - enemyCenter.y)).toBeLessThan(70);

      // 4. False Surrender OppMove (1271) & Focus Punch OppMove (590):
      // Re-anchored from user to targetPos (Player) so strike effect lands on Player.
      const falseSurrenderPos = CoordinateTransformer.resolveCelPosition(
        180,
        270,
        'user',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        1271
      );
      expect(Math.abs(falseSurrenderPos.x - playerCenter.x)).toBeLessThan(60);
      expect(Math.abs(falseSurrenderPos.y - playerCenter.y)).toBeLessThan(60);

      const focusPunchPos = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'user',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        590
      );
      expect(Math.abs(focusPunchPos.x - playerCenter.x)).toBeLessThan(5);
      expect(Math.abs(focusPunchPos.y - playerCenter.y)).toBeLessThan(15);

      // 5. Fiery Dance OppMove (6831):
      // Both-focus explosion cel at (128, 224) mirrored to land on Player.
      const fieryDanceEnd = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6831
      );
      expect(Math.abs(fieryDanceEnd.x - playerCenter.x)).toBeLessThan(5);
      expect(Math.abs(fieryDanceEnd.y - playerCenter.y)).toBeLessThan(5);

      // 6. Fissure Full-Screen Backdrop (1072):
      // Row 1 (celY=96) and Row 2 (celY=288) map directly without vertical 0.75 compression,
      // covering y=0..192 and y=192..288 (100% of the 512×288 battle screen).
      const fissureRow1 = CoordinateTransformer.resolveCelPosition(
        96,
        96,
        'screen',
        playerCenter,
        enemyCenter,
        512,
        288,
        false,
        false,
        false,
        false,
        1072
      );
      expect(fissureRow1.y).toBe(96);

      const fissureRow2 = CoordinateTransformer.resolveCelPosition(
        95,
        288,
        'screen',
        playerCenter,
        enemyCenter,
        512,
        288,
        false,
        false,
        false,
        false,
        1072
      );
      expect(fissureRow2.y).toBe(288);
    });

    it('validates that all Batch 2 F-group moves have valid sound timings and existing audio files on disk', async () => {
      const f2AnimIds = [
        118, 420, 734, 1366, 740, 741, 1308, 1309, 1093, 781, 309, 311,
        742, 743, 517, 6843, 589, 590, 6844, 6845, 537, 538, 124, 816,
        873, 1032, 852, 1347, 6846, 6847, 567, 568, 875, 375, 380, 299,
        361, 1367, 1368, 1046, 1047, 142
      ];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of f2AnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('verifies G-group Batch 1 move mappings, dynamic type fallbacks, and user targets', () => {
      // 1. Dedicated animations
      expect(ANIMATION_REGISTRY.resolveAnimationId('gastro_acid')).toBe(388);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gear_grind', false)).toBe(1033);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gear_grind', true)).toBe(1035);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gear_up', false)).toBe(1103);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gear_up', true)).toBe(1104);
      expect(ANIMATION_REGISTRY.resolveAnimationId('geomancy')).toBe(1124);
      expect(ANIMATION_REGISTRY.resolveAnimationId('giga_drain', false)).toBe(6848);
      expect(ANIMATION_REGISTRY.resolveAnimationId('giga_drain', true)).toBe(6849);
      expect(ANIMATION_REGISTRY.resolveAnimationId('giga_impact', false)).toBe(1048);
      expect(ANIMATION_REGISTRY.resolveAnimationId('giga_impact', true)).toBe(1049);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gigavolt_havoc', false)).toBe(1194);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gigavolt_havoc', true)).toBe(1195);
      expect(ANIMATION_REGISTRY.resolveAnimationId('glacial_lance', false)).toBe(1348);
      expect(ANIMATION_REGISTRY.resolveAnimationId('glacial_lance', true)).toBe(1349);
      expect(ANIMATION_REGISTRY.resolveAnimationId('glaciate')).toBe(1064);
      expect(ANIMATION_REGISTRY.resolveAnimationId('glare', false)).toBe(6850);
      expect(ANIMATION_REGISTRY.resolveAnimationId('glare', true)).toBe(6851);
      expect(ANIMATION_REGISTRY.resolveAnimationId('grass_knot')).toBe(519);
      expect(ANIMATION_REGISTRY.resolveAnimationId('grass_pledge')).toBe(476);

      // 2. Dynamic Type Fallbacks
      expect(ANIMATION_REGISTRY.resolveAnimationId('genesis_supernova', false, 'PSYCHIC', 'special')).toBe(6991);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gigaton_hammer', false, 'STEEL', 'physical')).toBe(6869); // iron_head
      expect(ANIMATION_REGISTRY.resolveAnimationId('glaive_rush', false, 'DRAGON', 'physical')).toBe(6816);
      expect(ANIMATION_REGISTRY.resolveAnimationId('glitzy_glow', false, 'PSYCHIC', 'special')).toBe(6991);

      // 3. User targets in moves-db.json
      const movesDbPath = path.resolve(__dirname, '../../../packages/game-data/moves-db.json');
      const movesDb = JSON.parse(fs.readFileSync(movesDbPath, 'utf-8'));
      expect(movesDb.moves.gear_up?.target).toBe('user');
      expect(movesDb.moves.geomancy?.target).toBe('user');
    });

    it('verifies G-group Batch 1 coordinate transformations and trajectory reversals', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // 1. Gear Grind OppMove (1035): Trajectory reversed starts at enemy side and travels to player
      const gearGrindStart = CoordinateTransformer.resolveCelPosition(
        352,
        76,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        1035
      );
      // Mirrored 352 -> 160 (near userPos=enemy)
      expect(gearGrindStart.x).toBeGreaterThan(300);

      const gearGrindHit = CoordinateTransformer.resolveCelPosition(
        112,
        187,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        1035
      );
      // Mirrored 112 -> 400 (near targetPos=player)
      expect(gearGrindHit.x).toBeLessThan(150);

      // 2. Glacial Lance OppMove (1349): Trajectory reversed starts at enemy and lands on player
      const glacialLanceStart = CoordinateTransformer.resolveCelPosition(
        463,
        147,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        1349
      );
      expect(glacialLanceStart.x).toBeGreaterThan(350);

      const glacialLanceEnd = CoordinateTransformer.resolveCelPosition(
        146,
        239,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        1349
      );
      expect(glacialLanceEnd.x).toBeLessThan(160);

      // 3. Giga Drain OppMove (6849):
      // Opening vine cel (124, 227, 'user') re-anchored to targetPos (Player)
      const gigaDrainVine = CoordinateTransformer.resolveCelPosition(
        124,
        227,
        'user',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6849
      );
      expect(Math.abs(gigaDrainVine.x - playerCenter.x)).toBeLessThan(10);
      expect(Math.abs(gigaDrainVine.y - playerCenter.y)).toBeLessThan(10);

      // Absorption orbs (both) travel from player to enemy
      const gigaDrainOrbStart = CoordinateTransformer.resolveCelPosition(
        187,
        187,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6849
      );
      expect(gigaDrainOrbStart.x).toBeLessThan(200);

      const gigaDrainOrbEnd = CoordinateTransformer.resolveCelPosition(
        349,
        109,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6849
      );
      expect(gigaDrainOrbEnd.x).toBeGreaterThan(330);

      // 4. Giga Impact OppMove (1049):
      // Impact cel at (128, 224, 'user') re-anchored to targetPos (Player)
      const gigaImpactHit = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'user',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        1049
      );
      expect(gigaImpactHit.x).toBe(playerCenter.x);
      expect(gigaImpactHit.y).toBe(playerCenter.y);

      // 5. Glare OppMove (6851):
      // Snake eyes at (378, 103, 'target') re-anchored to userPos (Enemy)
      const glareEyes = CoordinateTransformer.resolveCelPosition(
        378,
        103,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6851
      );
      expect(Math.abs(glareEyes.x - enemyCenter.x)).toBeLessThan(10);
      expect(Math.abs(glareEyes.y - enemyCenter.y)).toBeLessThan(15);

      // 6. Gear Up (1103):
      // Spinning gears with focus 'both' re-anchored around userPos (Player)
      const gearUpCel = CoordinateTransformer.resolveCelPosition(
        100,
        184,
        'both',
        playerCenter,
        enemyCenter,
        512,
        288,
        false,
        false,
        false,
        false,
        1103
      );
      expect(gearUpCel.x).toBe(playerCenter.x - 28);
      expect(gearUpCel.y).toBe(playerCenter.y - 40);

      // 7. Gigavolt Havoc OppMove (1195):
      // User charging lightning on enemy, thunder crash on player
      const gvhCharge = CoordinateTransformer.resolveCelPosition(
        360,
        127,
        'user',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        1195
      );
      expect(Math.abs(gvhCharge.x - (enemyCenter.x - 24))).toBeLessThan(5);

      const gvhStrike = CoordinateTransformer.resolveCelPosition(
        128,
        8,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        1195
      );
      expect(gvhStrike.x).toBe(playerCenter.x);
    });

    it('validates that all Batch 1 G-group moves have valid sound timings and existing audio files on disk', async () => {
      const g1AnimIds = [
        388, 1033, 1035, 1103, 1104, 1124, 6848, 6849, 1048, 1049,
        1194, 1195, 1348, 1349, 1064, 6850, 6851, 519, 476
      ];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of g1AnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('verifies G-group Batch 2 move mappings, dynamic type fallbacks, and user targets', () => {
      // 1. Dedicated animations
      expect(ANIMATION_REGISTRY.resolveAnimationId('grass_whistle', false)).toBe(6852);
      expect(ANIMATION_REGISTRY.resolveAnimationId('grass_whistle', true)).toBe(6853);
      expect(ANIMATION_REGISTRY.resolveAnimationId('grasswhistle', false)).toBe(6852);
      expect(ANIMATION_REGISTRY.resolveAnimationId('grasswhistle', true)).toBe(6853);
      expect(ANIMATION_REGISTRY.resolveAnimationId('grassy_terrain')).toBe(443);
      expect(ANIMATION_REGISTRY.resolveAnimationId('grav_apple', false)).toBe(6856);
      expect(ANIMATION_REGISTRY.resolveAnimationId('grav_apple', true)).toBe(6857);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gravity')).toBe(946);
      expect(ANIMATION_REGISTRY.resolveAnimationId('growl', false)).toBe(148);
      expect(ANIMATION_REGISTRY.resolveAnimationId('growl', true)).toBe(149);
      expect(ANIMATION_REGISTRY.resolveAnimationId('growth')).toBe(428);
      expect(ANIMATION_REGISTRY.resolveAnimationId('grudge')).toBe(6854);
      expect(ANIMATION_REGISTRY.resolveAnimationId('guard_split', false)).toBe(1060);
      expect(ANIMATION_REGISTRY.resolveAnimationId('guard_split', true)).toBe(1061);
      expect(ANIMATION_REGISTRY.resolveAnimationId('guard_swap', false)).toBe(822);
      expect(ANIMATION_REGISTRY.resolveAnimationId('guard_swap', true)).toBe(823);
      expect(ANIMATION_REGISTRY.resolveAnimationId('guillotine')).toBe(952);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gunk_shot', false)).toBe(669);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gunk_shot', true)).toBe(670);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gust', false)).toBe(151);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gust', true)).toBe(152);
      expect(ANIMATION_REGISTRY.resolveAnimationId('gyro_ball')).toBe(634);

      // 2. Dynamic Type Fallbacks
      expect(ANIMATION_REGISTRY.resolveAnimationId('grassy_glide', false, 'GRASS', 'physical')).toBe(7022);
      expect(ANIMATION_REGISTRY.resolveAnimationId('guardian_of_alola', false, 'FAIRY', 'special')).toBe(273);

      // 3. User targets in moves-db.json
      const movesDbPath = path.resolve(__dirname, '../../../packages/game-data/moves-db.json');
      const movesDb = JSON.parse(fs.readFileSync(movesDbPath, 'utf-8'));
      expect(movesDb.moves.grassy_terrain?.target).toBe('user');
      expect(movesDb.moves.growth?.target).toBe('user');
      expect(movesDb.moves.grudge?.target).toBe('user');
      expect(movesDb.moves.gravity?.target).toBe('user');
    });

    it('verifies G-group Batch 2 coordinate transformations and trajectory reversals', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // 1. Grass Whistle OppMove (6853): Trajectory reversed starts at enemy side and travels to player
      const gwStart = CoordinateTransformer.resolveCelPosition(
        416,
        144,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6853
      );
      // Mirrored 416 -> 96 (near userPos=enemy)
      expect(gwStart.x).toBeGreaterThan(320);

      const gwEnd = CoordinateTransformer.resolveCelPosition(
        216,
        255,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6853
      );
      // Mirrored 216 -> 296 (near targetPos=player)
      expect(gwEnd.x).toBeLessThan(250);

      // 2. Grav Apple OppMove (6857): Trajectory reversed starts at enemy and lands on player
      const gravAppleStart = CoordinateTransformer.resolveCelPosition(
        385,
        90,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6857
      );
      expect(gravAppleStart.x).toBeGreaterThan(340);

      const gravAppleEnd = CoordinateTransformer.resolveCelPosition(
        176,
        192,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6857
      );
      expect(gravAppleEnd.x).toBeLessThan(200);

      // 3. Gunk Shot OppMove (670): Trajectory reversed starts on enemy and falls on player
      const gunkStart = CoordinateTransformer.resolveCelPosition(
        376,
        110,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        670
      );
      expect(Math.abs(gunkStart.x - enemyCenter.x)).toBeLessThan(15);

      const gunkFall = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        670
      );
      expect(Math.abs(gunkFall.x - playerCenter.x)).toBeLessThan(10);
    });

    it('validates that all Batch 2 G-group moves have valid sound timings and existing audio files on disk', async () => {
      const g2AnimIds = [
        6852, 6853, 443, 6856, 6857, 946, 148, 149,
        428, 6854, 1060, 1061, 822, 823, 952, 669, 670, 151, 152, 634
      ];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of g2AnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('verifies H-group Batch 1 move mappings, dynamic type fallbacks, and user targets', () => {
      // 1. Dedicated 1:1 animations
      expect(ANIMATION_REGISTRY.resolveAnimationId('hail')).toBe(6858);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hammer_arm')).toBe(488);
      expect(ANIMATION_REGISTRY.resolveAnimationId('harden')).toBe(6859);
      expect(ANIMATION_REGISTRY.resolveAnimationId('haze')).toBe(529);
      expect(ANIMATION_REGISTRY.resolveAnimationId('head_charge')).toBe(805);
      expect(ANIMATION_REGISTRY.resolveAnimationId('head_smash')).toBe(792);
      expect(ANIMATION_REGISTRY.resolveAnimationId('headbutt', false)).toBe(395);
      expect(ANIMATION_REGISTRY.resolveAnimationId('headbutt', true)).toBe(396);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heal_bell', false)).toBe(434);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heal_bell', true)).toBe(435);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heal_block')).toBe(744);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heal_order')).toBe(757);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heal_pulse')).toBe(963);
      expect(ANIMATION_REGISTRY.resolveAnimationId('healing_wish')).toBe(868);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heart_stamp', false)).toBe(465);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heart_stamp', true)).toBe(466);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heart_swap')).toBe(824);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heat_crash')).toBe(778);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heat_wave', false)).toBe(6860);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heat_wave', true)).toBe(6861);
      expect(ANIMATION_REGISTRY.resolveAnimationId('heavy_slam')).toBe(584);
      expect(ANIMATION_REGISTRY.resolveAnimationId('helping_hand')).toBe(643);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hex')).toBe(500);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hidden_power')).toBe(688);

      // 2. Dynamic Type Fallbacks
      expect(ANIMATION_REGISTRY.resolveAnimationId('happy_hour', false, 'Normal', 'status')).toBe(148); // growl
      expect(ANIMATION_REGISTRY.resolveAnimationId('hard_press', false, 'Steel', 'physical')).toBe(6869); // iron_head
      expect(ANIMATION_REGISTRY.resolveAnimationId('headlong_rush', false, 'Ground', 'physical')).toBe(7075); // sandattack (upgraded to 7075)

      // 3. User target checks
      const movesDbPath = path.resolve(__dirname, '../../../packages/game-data/moves-db.json');
      const movesDb = JSON.parse(fs.readFileSync(movesDbPath, 'utf-8'));
      const selfTargetMoves = [
        'hail', 'happy_hour', 'harden', 'haze',
        'heal_bell', 'heal_order', 'healing_wish', 'helping_hand'
      ];
      for (const stm of selfTargetMoves) {
        expect(movesDb.moves[stm]?.target).toBe('user');
      }
    });

    it('validates H-group Batch 1 OppMove coordinate transformations and battler focus', () => {
      const enemyCenter = { x: 384, y: 96 };
      const playerCenter = { x: 128, y: 224 };

      // 1. Headbutt OppMove (396): impact cel authored at (128, 224) with focus='user'
      // must re-anchor to playerCenter (targetPos) so the strike hits the player
      const hbImpact = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'user',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        396
      );
      expect(hbImpact.x).toBe(playerCenter.x);
      expect(hbImpact.y).toBe(playerCenter.y);

      // 2. Heal Bell OppMove (435): chiming bells authored at (296, 77) with focus='target'
      // must re-anchor to enemyCenter (userPos) so bells ring on the enemy
      const hbBell = CoordinateTransformer.resolveCelPosition(
        296,
        77,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        435
      );
      expect(hbBell.x).toBe(enemyCenter.x + (296 - CoordinateTransformer.SRC_TARGET.x));
      expect(hbBell.y).toBe(enemyCenter.y + (77 - CoordinateTransformer.SRC_TARGET.y));

      // 3. Heart Stamp OppMove (466): traveling heart cel authored relative to SRC_USER
      // must re-anchor to targetPos using SRC_USER offset
      const hsHit = CoordinateTransformer.resolveCelPosition(
        152,
        212,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        466
      );
      expect(hsHit.x).toBe(playerCenter.x + (152 - CoordinateTransformer.SRC_USER.x));
      expect(hsHit.y).toBe(playerCenter.y + (212 - CoordinateTransformer.SRC_USER.y));
    });

    it('validates that all Batch 1 H-group moves have valid sound timings and existing audio files on disk', async () => {
      const h1AnimIds = [
        6858, 488, 6859, 529, 805, 792, 395, 396, 434, 435,
        744, 757, 963, 868, 465, 466, 824, 778, 6860, 6861, 584,
        643, 500, 688
      ];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of h1AnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('validates H-group Batch 2 move resolution, fallbacks, and user targeting', () => {
      // 1. Direct and OppMove resolutions
      expect(ANIMATION_REGISTRY.resolveAnimationId('high_horsepower', false)).toBe(1126);
      expect(ANIMATION_REGISTRY.resolveAnimationId('high_horsepower', true)).toBe(1127);
      expect(ANIMATION_REGISTRY.resolveAnimationId('high_jump_kick', false)).toBe(1371);
      expect(ANIMATION_REGISTRY.resolveAnimationId('high_jump_kick', true)).toBe(1372);
      expect(ANIMATION_REGISTRY.resolveAnimationId('highjumpkick', false)).toBe(1371);
      expect(ANIMATION_REGISTRY.resolveAnimationId('highjumpkick', true)).toBe(1372);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hold_back', false)).toBe(1373);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hold_back', true)).toBe(1374);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hold_hands')).toBe(1375);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hone_claws')).toBe(494);
      expect(ANIMATION_REGISTRY.resolveAnimationId('horn_attack', false)).toBe(315);
      expect(ANIMATION_REGISTRY.resolveAnimationId('horn_attack', true)).toBe(316);
      expect(ANIMATION_REGISTRY.resolveAnimationId('horn_drill', false)).toBe(1002);
      expect(ANIMATION_REGISTRY.resolveAnimationId('horn_drill', true)).toBe(1003);
      expect(ANIMATION_REGISTRY.resolveAnimationId('horn_leech', false)).toBe(926);
      expect(ANIMATION_REGISTRY.resolveAnimationId('horn_leech', true)).toBe(927);
      expect(ANIMATION_REGISTRY.resolveAnimationId('howl')).toBe(585);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hurricane', false)).toBe(1004);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hurricane', true)).toBe(1005);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hydro_cannon', false)).toBe(1062);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hydro_cannon', true)).toBe(1063);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hydro_pump')).toBe(159);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hydro_vortex', false)).toBe(1190);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hydro_vortex', true)).toBe(1191);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hyper_beam')).toBe(6476);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hyper_fang', false)).toBe(6862);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hyper_fang', true)).toBe(6863);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hyper_voice', false)).toBe(678);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hyper_voice', true)).toBe(679);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hyperspace_fury')).toBe(1131);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hyperspace_hole')).toBe(920);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hypnosis', false)).toBe(575);
      expect(ANIMATION_REGISTRY.resolveAnimationId('hypnosis', true)).toBe(576);

      // 2. Dynamic Type Fallbacks
      expect(ANIMATION_REGISTRY.resolveAnimationId('hydro_steam', false, 'Water', 'special')).toBe(291); // water_gun
      expect(ANIMATION_REGISTRY.resolveAnimationId('hyper_drill', false, 'Normal', 'physical')).toBe(7247); // tackle

      // 3. User target checks
      const movesDbPath = path.resolve(__dirname, '../../../packages/game-data/moves-db.json');
      const movesDb = JSON.parse(fs.readFileSync(movesDbPath, 'utf-8'));
      const selfTargetMoves = ['hold_hands', 'hone_claws', 'howl'];
      for (const stm of selfTargetMoves) {
        expect(movesDb.moves[stm]?.target).toBe('user');
      }
    });

    it('validates H-group Batch 2 OppMove coordinate transformations and battler focus', () => {
      const enemyCenter = { x: 384, y: 96 };
      const playerCenter = { x: 128, y: 224 };

      // High Jump Kick OppMove (1372): impact cel authored at (44, 224) with focus='target'
      // must re-anchor to playerCenter (targetPos) so the strike hits the player
      const hjkImpact = CoordinateTransformer.resolveCelPosition(
        44,
        224,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        1372
      );
      expect(hjkImpact.x).toBe(playerCenter.x + (44 - CoordinateTransformer.SRC_USER.x));
      expect(hjkImpact.y).toBe(playerCenter.y + (224 - CoordinateTransformer.SRC_USER.y));

      // Horn Attack OppMove (316): impact cel authored at (304, 123) with focus='target'
      const haImpact = CoordinateTransformer.resolveCelPosition(
        304,
        123,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        316
      );
      expect(haImpact.x).toBe(playerCenter.x + (304 - CoordinateTransformer.SRC_TARGET.x));
      expect(haImpact.y).toBe(playerCenter.y + (123 - CoordinateTransformer.SRC_TARGET.y));
    });

    it('validates that all Batch 2 H-group moves have valid sound timings and existing audio files on disk', async () => {
      const h2AnimIds = [
        1126, 1127, 1371, 1372, 1373, 1374, 1375, 494, 315, 316,
        1002, 1003, 926, 927, 585, 1004, 1005, 1062, 1063, 1190,
        1191, 6862, 6863, 678, 679, 1131, 920, 575, 576
      ];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of h2AnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('validates I-group Batch 1 move resolution, fallbacks, and user targeting', () => {
      // 1. Direct and OppMove resolutions
      expect(ANIMATION_REGISTRY.resolveAnimationId('ice_ball')).toBe(6864);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ice_beam')).toBe(6479);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ice_burn')).toBe(1128);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ice_fang')).toBe(6865);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ice_hammer')).toBe(1086);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ice_punch')).toBe(6866);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ice_shard', false)).toBe(609);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ice_shard', true)).toBe(610);
      expect(ANIMATION_REGISTRY.resolveAnimationId('icicle_crash')).toBe(876);
      expect(ANIMATION_REGISTRY.resolveAnimationId('icicle_spear', false)).toBe(346);
      expect(ANIMATION_REGISTRY.resolveAnimationId('icicle_spear', true)).toBe(351);
      expect(ANIMATION_REGISTRY.resolveAnimationId('icy_wind')).toBe(6867);
      expect(ANIMATION_REGISTRY.resolveAnimationId('imprison')).toBe(836);

      // 2. Dynamic Type Fallback (Gen 9 Ice Physical)
      expect(ANIMATION_REGISTRY.resolveAnimationId('ice_spinner', false, 'Ice', 'physical')).toBe(6866); // ice_punch

      // 3. User target check
      const movesDbPath = path.resolve(__dirname, '../../../packages/game-data/moves-db.json');
      const movesDb = JSON.parse(fs.readFileSync(movesDbPath, 'utf-8'));
      expect(movesDb.moves['imprison']?.target).toBe('user');
    });

    it('validates I-group Batch 1 OppMove coordinate transformations and battler focus', () => {
      const enemyCenter = { x: 384, y: 96 };
      const playerCenter = { x: 128, y: 224 };

      // Ice Shard OppMove (610): cel at (400, 88) with focus='target'
      const isHit = CoordinateTransformer.resolveCelPosition(
        400,
        88,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        610
      );
      expect(isHit.x).toBe(playerCenter.x + (400 - CoordinateTransformer.SRC_TARGET.x));
      expect(isHit.y).toBe(playerCenter.y + (88 - CoordinateTransformer.SRC_TARGET.y));

      // Icicle Spear OppMove (351): cel at (368, 94) with focus='target'
      const spearHit = CoordinateTransformer.resolveCelPosition(
        368,
        94,
        'target',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        351
      );
      expect(spearHit.x).toBe(playerCenter.x + (368 - CoordinateTransformer.SRC_TARGET.x));
      expect(spearHit.y).toBe(playerCenter.y + (94 - CoordinateTransformer.SRC_TARGET.y));
    });

    it('validates that all Batch 1 I-group moves have valid sound timings and existing audio files on disk', async () => {
      const i1AnimIds = [
        6864, 6479, 1128, 6865, 1086, 6866, 609, 610, 876, 346, 351, 6867, 836
      ];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of i1AnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('validates I-group Batch 2 move resolution, fallbacks, and user targeting', () => {
      // 1. Direct and OppMove resolutions
      expect(ANIMATION_REGISTRY.resolveAnimationId('incinerate')).toBe(458);
      expect(ANIMATION_REGISTRY.resolveAnimationId('inferno')).toBe(6868);
      expect(ANIMATION_REGISTRY.resolveAnimationId('infestation')).toBe(726);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ingrain')).toBe(436);
      expect(ANIMATION_REGISTRY.resolveAnimationId('instruct')).toBe(1137);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ion_deluge')).toBe(953);
      expect(ANIMATION_REGISTRY.resolveAnimationId('iron_defense')).toBe(484);
      expect(ANIMATION_REGISTRY.resolveAnimationId('iron_head', false)).toBe(6869);
      expect(ANIMATION_REGISTRY.resolveAnimationId('iron_head', true)).toBe(6870);
      expect(ANIMATION_REGISTRY.resolveAnimationId('iron_tail')).toBe(588);

      // 2. Dynamic Type Fallbacks
      expect(ANIMATION_REGISTRY.resolveAnimationId('infernal_parade', false, 'Ghost', 'special')).toBe(241); // shadow_ball
      expect(ANIMATION_REGISTRY.resolveAnimationId('inferno_overdrive', false, 'Fire', 'physical')).toBe(6837); // fire_punch
      expect(ANIMATION_REGISTRY.resolveAnimationId('ivy_cudgel', false, 'Grass', 'physical')).toBe(7022); // razor_leaf

      // 3. User target checks
      const movesDbPath = path.resolve(__dirname, '../../../packages/game-data/moves-db.json');
      const movesDb = JSON.parse(fs.readFileSync(movesDbPath, 'utf-8'));
      const selfTargetMoves = ['ingrain', 'ion_deluge', 'iron_defense'];
      for (const stm of selfTargetMoves) {
        expect(movesDb.moves[stm]?.target).toBe('user');
      }
    });

    it('validates I-group Batch 2 OppMove coordinate transformations and battler focus', () => {
      const enemyCenter = { x: 384, y: 96 };
      const playerCenter = { x: 128, y: 224 };

      // Iron Head OppMove (6870): impact cel at (128, 224) with focus='both'
      // must re-anchor to playerCenter (targetPos) so the strike hits the player
      const ihImpact = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'both',
        enemyCenter,
        playerCenter,
        512,
        288,
        false,
        false,
        false,
        true,
        6870
      );
      expect(ihImpact.x).toBe(playerCenter.x);
      expect(ihImpact.y).toBe(playerCenter.y);
    });

    it('validates that all Batch 2 I-group moves have valid sound timings and existing audio files on disk', async () => {
      const i2AnimIds = [
        458, 6868, 726, 436, 1137, 953, 484, 6869, 6870, 588
      ];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of i2AnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('validates J and K group move resolution, benchmark preservation, and user targeting', () => {
      // 1. J & K move IDs resolution
      expect(ANIMATION_REGISTRY.resolveAnimationId('jaw_lock')).toBe(1275);
      expect(ANIMATION_REGISTRY.resolveAnimationId('jet_punch')).toBe(6751);
      expect(ANIMATION_REGISTRY.resolveAnimationId('judgment')).toBe(870);
      expect(ANIMATION_REGISTRY.resolveAnimationId('jump_kick', false)).toBe(6871);
      expect(ANIMATION_REGISTRY.resolveAnimationId('jump_kick', true)).toBe(6872);
      expect(ANIMATION_REGISTRY.resolveAnimationId('jumpkick', false)).toBe(6871);
      expect(ANIMATION_REGISTRY.resolveAnimationId('jumpkick', true)).toBe(6872);
      expect(ANIMATION_REGISTRY.resolveAnimationId('jungle_healing')).toBe(1311);
      expect(ANIMATION_REGISTRY.resolveAnimationId('karate_chop')).toBe(6873);
      expect(ANIMATION_REGISTRY.resolveAnimationId('kinesis', false)).toBe(6874);
      expect(ANIMATION_REGISTRY.resolveAnimationId('kinesis', true)).toBe(6875);
      expect(ANIMATION_REGISTRY.resolveAnimationId('kings_shield', false)).toBe(467);
      expect(ANIMATION_REGISTRY.resolveAnimationId('kings_shield', true)).toBe(468);
      expect(ANIMATION_REGISTRY.resolveAnimationId('knock_off')).toBe(501);

      // 2. Benchmark move protection
      expect(ANIMATION_REGISTRY.resolveAnimationId('lovely_kiss')).toBe(185);
      expect(ANIMATION_REGISTRY.resolveAnimationId('swift', false)).toBe(273);
      expect(ANIMATION_REGISTRY.resolveAnimationId('swords_dance')).toBe(274);

      // 3. User targeting validation in moves-db
      const movesDbPath = path.resolve(__dirname, '../../../packages/game-data/moves-db.json');
      const movesDb = JSON.parse(fs.readFileSync(movesDbPath, 'utf-8'));
      expect(movesDb.moves.jungle_healing?.target).toBe('user');
      expect(movesDb.moves.kings_shield?.target).toBe('user');
    });

    it('validates that all J and K group moves have valid sound timings and existing audio files on disk', async () => {
      const jkAnimIds = [
        1275, 870, 6871, 6872, 1311, 6873, 6874, 6875, 467, 468, 501
      ];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of jkAnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('validates L group move resolution, benchmark preservation, and user targeting', () => {
      // 1. Batch 1 L move IDs resolution
      expect(ANIMATION_REGISTRY.resolveAnimationId('lands_wrath')).toBe(1376);
      expect(ANIMATION_REGISTRY.resolveAnimationId('laser_focus')).toBe(1081);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lash_out', false)).toBe(1312);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lash_out', true)).toBe(1313);
      expect(ANIMATION_REGISTRY.resolveAnimationId('last_resort', false)).toBe(1050);
      expect(ANIMATION_REGISTRY.resolveAnimationId('last_resort', true)).toBe(1051);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lava_plume')).toBe(489);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leaf_blade', false)).toBe(393);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leaf_blade', true)).toBe(394);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leaf_storm', false)).toBe(728);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leaf_storm', true)).toBe(729);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leaf_tornado')).toBe(1065);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leafage', false)).toBe(1082);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leafage', true)).toBe(1083);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leech_life')).toBe(6876);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leech_seed', false)).toBe(6877);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leech_seed', true)).toBe(6878);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leechseed', false)).toBe(6877);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leechseed', true)).toBe(6878);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leer', false)).toBe(344);
      expect(ANIMATION_REGISTRY.resolveAnimationId('leer', true)).toBe(345);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lick', false)).toBe(6879);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lick', true)).toBe(6880);

      // 2. Batch 2 L move IDs resolution
      expect(ANIMATION_REGISTRY.resolveAnimationId('life_dew')).toBe(1276);
      expect(ANIMATION_REGISTRY.resolveAnimationId('light_of_ruin')).toBe(1377);
      expect(ANIMATION_REGISTRY.resolveAnimationId('light_screen', false)).toBe(6490); // replacedMove 6490
      expect(ANIMATION_REGISTRY.resolveAnimationId('light_screen', true)).toBe(6882);
      expect(ANIMATION_REGISTRY.resolveAnimationId('liquidation')).toBe(1109);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lock_on', false)).toBe(6883);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lock_on', true)).toBe(6884);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lovely_kiss')).toBe(185); // Preserved benchmark!
      expect(ANIMATION_REGISTRY.resolveAnimationId('low_kick', false)).toBe(6885);
      expect(ANIMATION_REGISTRY.resolveAnimationId('low_kick', true)).toBe(6886);
      expect(ANIMATION_REGISTRY.resolveAnimationId('low_sweep')).toBe(583);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lucky_chant')).toBe(6887);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lunar_blessing')).toBe(1276);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lunar_dance')).toBe(755);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lunge', false)).toBe(1378);
      expect(ANIMATION_REGISTRY.resolveAnimationId('lunge', true)).toBe(1379);
      expect(ANIMATION_REGISTRY.resolveAnimationId('luster_purge')).toBe(1066);

      // 3. Benchmark protection verification
      expect(ANIMATION_REGISTRY.resolveAnimationId('thunder_punch')).toBe(7293); // Upgraded THUNDERPUNCH 7293
      expect(ANIMATION_REGISTRY.resolveAnimationId('supersonic')).toBe(270);   // Preserved SUPERSONIC 270
      expect(ANIMATION_REGISTRY.resolveAnimationId('future_sight')).toBe(142); // Preserved FUTURESIGHT 142
      expect(ANIMATION_REGISTRY.resolveAnimationId('hydro_pump')).toBe(159);   // Preserved HYDROPUMP 159
      expect(ANIMATION_REGISTRY.resolveAnimationId('pay_day')).toBe(6940);      // Standardized PAYDAY 6940

      // 4. User targeting in moves-db
      const movesDbPath = path.resolve(__dirname, '../../../packages/game-data/moves-db.json');
      const movesDb = JSON.parse(fs.readFileSync(movesDbPath, 'utf-8'));
      expect(movesDb.moves.laser_focus?.target).toBe('user');
      expect(movesDb.moves.life_dew?.target).toBe('user');
      expect(movesDb.moves.light_screen?.target).toBe('user');
      expect(movesDb.moves.lucky_chant?.target).toBe('user');
      expect(movesDb.moves.lunar_blessing?.target).toBe('user');
      expect(movesDb.moves.lunar_dance?.target).toBe('user');
    });

    it('validates that all L group moves have valid sound timings and existing audio files on disk', async () => {
      const lAnimIds = [
        1376, 1081, 1312, 1313, 1050, 1051, 489, 393, 394, 728, 729, 1065, 1082, 1083,
        6876, 6877, 6878, 344, 345, 6879, 6880, 1276, 1377, 6881, 6882, 1109,
        6883, 6884, 185, 6885, 6886, 583, 6887, 755, 1378, 1379, 1066
      ];
      const audioDir = path.resolve(__dirname, '../public/Audio/SE');
      const animAudioDir = path.resolve(audioDir, 'Anim');

      for (const animId of lAnimIds) {
        const def = await ANIMATION_REGISTRY.getDefinition(animId);
        expect(def, `Animation ${animId} definition should exist`).toBeDefined();
        if (!def) continue;

        const soundTimings = def.timings.filter(t => t.type === 'sound');
        for (const timing of soundTimings) {
          const soundName = (timing as any).payload?.sound;
          expect(soundName, `Timing in anim ${animId} must have a sound payload`).toBeTruthy();

          const inSe = fs.existsSync(path.join(audioDir, soundName));
          const inAnim = fs.existsSync(path.join(animAudioDir, soundName));
          expect(
            inSe || inAnim,
            `Audio file "${soundName}" referenced in anim ${animId} must exist on disk`
          ).toBe(true);
        }
      }
    });

    it('validates L-group OppMove coordinate transformations and battler focus for enemy casts', () => {
      // 1. Last Resort (1051): Charge on Enemy, Blast on Player
      const lrCharge = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true, // isEnemy
        false,
        false,
        false,
        true, // isOppMove
        '1051'
      );
      expect(lrCharge.x).toBe(enemyCenter.x);
      expect(lrCharge.y).toBe(enemyCenter.y);

      const lrBlast = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'user',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '1051'
      );
      expect(lrBlast.x).toBe(playerCenter.x);
      expect(lrBlast.y).toBe(playerCenter.y);

      // 2. Leaf Blade (394): Slashes from Enemy to Player
      expect(isOppMoveTrajectoryReversed('394')).toBe(true);
      const lbStart = CoordinateTransformer.resolveCelPosition(
        414,
        115,
        'both',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '394'
      );
      expect(lbStart.x).toBeGreaterThan(350); // Near enemy (380)

      const lbHit = CoordinateTransformer.resolveCelPosition(
        129,
        308,
        'both',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '394'
      );
      expect(lbHit.x).toBeLessThan(150); // Near player (130)

      // 3. Leaf Storm (729): Vortex starts at Enemy and engulfs Player
      expect(isOppMoveTrajectoryReversed('729')).toBe(true);
      const lsStart = CoordinateTransformer.resolveCelPosition(
        398,
        86,
        'both',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '729'
      );
      expect(lsStart.x).toBeGreaterThan(350);

      const lsEnd = CoordinateTransformer.resolveCelPosition(
        87,
        249,
        'both',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '729'
      );
      expect(lsEnd.x).toBeLessThan(150);

      // 4. Leech Seed (6878): Launches from Enemy and sprouts on Player with arc
      const seedLaunch = CoordinateTransformer.resolveCelPosition(
        368,
        98,
        'user',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6878'
      );
      expect(seedLaunch.x).toBeCloseTo(364.4, 0);
      expect(seedLaunch.y).toBeCloseTo(109.4, 0); // Arc offset applied: seed flies higher

      const seedSprout = CoordinateTransformer.resolveCelPosition(
        120,
        258,
        'user',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6878'
      );
      expect(seedSprout.x).toBeCloseTo(122.2, 0); // Near player center (130)
      expect(seedSprout.y).toBeGreaterThan(200); // Low on player sprite

      // Frame 12 seed 1 (cel 2) flight check: stays on screen and flies toward Player
      const seed1F12 = CoordinateTransformer.resolveCelPosition(
        278,
        130,
        'user',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6878'
      );
      expect(seed1F12.x).toBeGreaterThan(playerCenter.x);
      expect(seed1F12.x).toBeLessThan(enemyCenter.x);
      expect(seed1F12.y).toBeGreaterThan(100);
      expect(seed1F12.y).toBeLessThan(DEFAULT_ANIMATION_VIEWPORT.height);

      // Player Leech Seed (6877): preserves curve so flight arcs and sprouts horizontally
      const plSeedMidFlight = CoordinateTransformer.resolveCelPosition(
        256,
        92,
        'both',
        playerCenter,
        enemyCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        false,
        false,
        false,
        false,
        false,
        '6877'
      );
      // Linear interpolation without curve would give y = 215 + 0.5 * (115 - 215) = 165
      // With preserveCurve, it arcs high in the air (y = 97)
      expect(plSeedMidFlight.y).toBeLessThan(120);

      const plSprout1 = CoordinateTransformer.resolveCelPosition(
        344,
        132,
        'both',
        playerCenter,
        enemyCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        false,
        false,
        false,
        false,
        false,
        '6877'
      );
      const plSprout3 = CoordinateTransformer.resolveCelPosition(
        424,
        131,
        'both',
        playerCenter,
        enemyCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        false,
        false,
        false,
        false,
        false,
        '6877'
      );
      // Sprout cels form a horizontal cluster near enemy base (~147..154), not a tilted diagonal
      expect(Math.abs(plSprout1.y - plSprout3.y)).toBeLessThan(12);

      // 5. Leer (345): Glaring eyes appear in front of Enemy facing Player
      const leerEyes = CoordinateTransformer.resolveCelPosition(
        318,
        64,
        'both',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '345'
      );
      expect(leerEyes.x).toBe(314); // 380 - 66, right in front of enemy
      expect(leerEyes.y).toBe(83);  // 115 - 32, eye level

      // 6. Lock-On (6884): Crosshair converges on Player
      const lockOnTarget = CoordinateTransformer.resolveCelPosition(
        128,
        224,
        'user',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6884'
      );
      expect(lockOnTarget.x).toBe(playerCenter.x);
      expect(lockOnTarget.y).toBe(playerCenter.y);

      // 7. Low Kick (6886): Foot sweeps under Player's feet
      const kickSweep = CoordinateTransformer.resolveCelPosition(
        144,
        262,
        'both',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6886'
      );
      expect(kickSweep.x).toBe(playerCenter.x + 16);
      expect(kickSweep.y).toBe(playerCenter.y + 38);
    });

    it('resolves authentic animations and opponent transformations for M Group Batch 1 moves', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // 1. Safe ID allocations & Player / Opponent ID resolution
      expect(ANIMATION_REGISTRY.resolveAnimationId('mach_punch', false)).toBe(6888);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magic_coat', false)).toBe(6889);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magic_coat', true)).toBe(6890);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magic_powder', false)).toBe(1277);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magic_room', false)).toBe(129);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magical_leaf', false)).toBe(437);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magical_leaf', true)).toBe(438);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magical_torque', false)).toBe(667);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magma_storm', false)).toBe(1006);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magnet_bomb', false)).toBe(611);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magnet_rise', false)).toBe(779);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magnetic_flux', false)).toBe(954);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magnetic_flux', true)).toBe(955);
      expect(ANIMATION_REGISTRY.resolveAnimationId('magnitude', false)).toBe(671);
      expect(ANIMATION_REGISTRY.resolveAnimationId('make_it_rain', false)).toBe(118);
      expect(ANIMATION_REGISTRY.resolveAnimationId('malicious_moonsault', false)).toBe(83);
      expect(ANIMATION_REGISTRY.resolveAnimationId('malignant_chain', false)).toBe(249);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mat_block', false)).toBe(854);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mat_block', true)).toBe(855);
      expect(ANIMATION_REGISTRY.resolveAnimationId('matcha_gotcha', false)).toBe(124);
      expect(ANIMATION_REGISTRY.resolveAnimationId('moonblast', false)).toBe(425);
      expect(ANIMATION_REGISTRY.resolveAnimationId('moonblast', true)).toBe(426);

      // 2. Max Moves (Gen 8 Dynamax)
      const maxMoves: Record<string, number> = {
        max_airstream: 6907,
        max_darkness: 83,
        max_flare: 116,
        max_flutterby: 57,
        max_geyser: 159,
        max_guard: 218,
        max_hailstorm: 46,
        max_knuckle: 70,
        max_lightning: 280,
        max_mindstorm: 220,
        max_ooze: 249,
        max_overgrowth: 106,
        max_phantasm: 241,
        max_quake: 97,
        max_rockfall: 266,
        max_starfall: 425,
        max_steelspike: 118,
        max_strike: 160,
        max_wyrmwind: 6905,
      };
      for (const [moveKey, expectedId] of Object.entries(maxMoves)) {
        expect(ANIMATION_REGISTRY.resolveAnimationId(moveKey, false)).toBe(expectedId);
      }
      expect(ANIMATION_REGISTRY.resolveAnimationId('max_airstream', true)).toBe(6908);
      expect(ANIMATION_REGISTRY.resolveAnimationId('max_wyrmwind', true)).toBe(6906);

      // 3. Trajectory reversal for OppMoves
      expect(isOppMoveTrajectoryReversed('438')).toBe(true); // magical_leaf
      expect(isOppMoveTrajectoryReversed('426')).toBe(true); // moonblast

      // 4. OppMove Self-Move Re-anchoring around userPos (Enemy)
      // Magic Coat (6890): cel at (374, 95) around SRC_TARGET (384, 96) -> userPos (380, 115)
      const magicCoatCel = CoordinateTransformer.resolveCelPosition(
        374,
        95,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6890'
      );
      expect(magicCoatCel.x).toBe(380 + (374 - 384)); // 370
      expect(magicCoatCel.y).toBe(115 + (95 - 96));   // 114

      // Magnetic Flux (955): cel at (451, 56) around SRC_TARGET (384, 96) -> userPos (380, 115)
      const magFluxCel = CoordinateTransformer.resolveCelPosition(
        451,
        56,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '955'
      );
      expect(magFluxCel.x).toBe(380 + (451 - 384)); // 447
      expect(magFluxCel.y).toBe(115 + (56 - 96));   // 75

      // Mat Block (855): cel at (387, 100) around SRC_TARGET (384, 96) -> userPos (380, 115)
      const matBlockCel = CoordinateTransformer.resolveCelPosition(
        387,
        100,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '855'
      );
      expect(matBlockCel.x).toBe(380 + (387 - 384)); // 383
      expect(matBlockCel.y).toBe(115 + (100 - 96));  // 119
    });

    it('resolves authentic animations and opponent transformations for M Group Batch 2 moves', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // 1. Safe ID allocations & Player / Opponent ID resolution (30 moves + moongeist_beam)
      expect(ANIMATION_REGISTRY.resolveAnimationId('me_first', false)).toBe(991);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mean_look', false)).toBe(6891);
      expect(ANIMATION_REGISTRY.resolveAnimationId('meditate', false)).toBe(635);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mega_drain', false)).toBe(6892);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mega_drain', true)).toBe(6893);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mega_kick', false)).toBe(6894);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mega_kick', true)).toBe(6895);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mega_punch', false)).toBe(6896);
      expect(ANIMATION_REGISTRY.resolveAnimationId('megahorn', false)).toBe(338);
      expect(ANIMATION_REGISTRY.resolveAnimationId('megahorn', true)).toBe(339);
      expect(ANIMATION_REGISTRY.resolveAnimationId('memento', false)).toBe(921);
      expect(ANIMATION_REGISTRY.resolveAnimationId('menacing_moonraze_maelstrom', false)).toBe(1382);
      expect(ANIMATION_REGISTRY.resolveAnimationId('metal_burst', false)).toBe(959);
      expect(ANIMATION_REGISTRY.resolveAnimationId('metal_burst', true)).toBe(960);
      expect(ANIMATION_REGISTRY.resolveAnimationId('metal_claw', false)).toBe(6897);
      expect(ANIMATION_REGISTRY.resolveAnimationId('metal_sound', false)).toBe(649);
      expect(ANIMATION_REGISTRY.resolveAnimationId('metal_sound', true)).toBe(650);
      expect(ANIMATION_REGISTRY.resolveAnimationId('meteor_assault', false)).toBe(1278);
      expect(ANIMATION_REGISTRY.resolveAnimationId('meteor_assault', true)).toBe(1279);
      expect(ANIMATION_REGISTRY.resolveAnimationId('meteor_beam', false)).toBe(1314);
      expect(ANIMATION_REGISTRY.resolveAnimationId('meteor_mash', false)).toBe(6898);
      expect(ANIMATION_REGISTRY.resolveAnimationId('metronome', false)).toBe(6899);
      expect(ANIMATION_REGISTRY.resolveAnimationId('metronome', true)).toBe(6900);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mighty_cleave', false)).toBe(266);
      expect(ANIMATION_REGISTRY.resolveAnimationId('milk_drink', false)).toBe(847);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mimic', false)).toBe(806);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mind_blown', false)).toBe(1114);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mind_blown', true)).toBe(1115);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mind_reader', false)).toBe(1037);
      expect(ANIMATION_REGISTRY.resolveAnimationId('minimize', false)).toBe(485);
      expect(ANIMATION_REGISTRY.resolveAnimationId('miracle_eye', false)).toBe(502);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mirror_coat', false)).toBe(930);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mirror_coat', true)).toBe(931);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mirror_move', false)).toBe(1380);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mirror_move', true)).toBe(1381);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mirror_shot', false)).toBe(597);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mirror_shot', true)).toBe(598);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mist', false)).toBe(6901);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mist_ball', false)).toBe(6902);
      expect(ANIMATION_REGISTRY.resolveAnimationId('misty_explosion', false)).toBe(1315);
      expect(ANIMATION_REGISTRY.resolveAnimationId('misty_terrain', false)).toBe(439);
      expect(ANIMATION_REGISTRY.resolveAnimationId('moongeist_beam', false)).toBe(1382);
      expect(ANIMATION_REGISTRY.resolveAnimationId('moongeist_beam', true)).toBe(1383);

      // 2. Trajectory reversal for OppMoves
      expect(isOppMoveTrajectoryReversed('6893')).toBe(true); // mega_drain
      expect(isOppMoveTrajectoryReversed('650')).toBe(true);  // metal_sound
      expect(isOppMoveTrajectoryReversed('598')).toBe(true);  // mirror_shot
      expect(isOppMoveTrajectoryReversed('1383')).toBe(true); // moongeist_beam

      // 3. Attack OppMoves re-anchoring around SRC_USER (128, 224) to targetPos (Player)
      // Mega Kick (6895): cel at (144, 248) -> playerCenter (130, 215) + (16, 24) = (146, 239)
      const megaKickCel = CoordinateTransformer.resolveCelPosition(
        144,
        248,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6895'
      );
      expect(megaKickCel.x).toBe(130 + (144 - 128)); // 146
      expect(megaKickCel.y).toBe(215 + (248 - 224)); // 239

      // Megahorn (339): cel at (160, 196) -> playerCenter (130, 215) + (32, -28) = (162, 187)
      const megahornCel = CoordinateTransformer.resolveCelPosition(
        160,
        196,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '339'
      );
      expect(megahornCel.x).toBe(130 + (160 - 128)); // 162
      expect(megahornCel.y).toBe(215 + (196 - 224)); // 187

      // 4. Self-Move OppMoves re-anchoring around SRC_TARGET (384, 96) to userPos (Enemy)
      // Metal Burst (960): cel at (417, 130) -> enemyCenter (380, 115) + (33, 34) = (413, 149)
      const metalBurstCel = CoordinateTransformer.resolveCelPosition(
        417,
        130,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '960'
      );
      expect(metalBurstCel.x).toBe(380 + (417 - 384)); // 413
      expect(metalBurstCel.y).toBe(115 + (130 - 96));  // 149

      // Metronome (6900): cel at (342, 128) -> enemyCenter (380, 115) + (-42, 32) = (338, 147)
      const metronomeCel = CoordinateTransformer.resolveCelPosition(
        342,
        128,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6900'
      );
      expect(metronomeCel.x).toBe(380 + (342 - 384)); // 338
      expect(metronomeCel.y).toBe(115 + (128 - 96));  // 147

      // Mirror Coat (931): cel at (384, 95) -> enemyCenter (380, 115) + (0, -1) = (380, 114)
      const mirrorCoatCel = CoordinateTransformer.resolveCelPosition(
        384,
        95,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '931'
      );
      expect(mirrorCoatCel.x).toBe(380 + (384 - 384)); // 380
      expect(mirrorCoatCel.y).toBe(115 + (95 - 96));   // 114

      // Mirror Move (1381): cel at (330, 118) -> enemyCenter (380, 115) + (-54, 22) = (326, 137)
      const mirrorMoveCel = CoordinateTransformer.resolveCelPosition(
        330,
        118,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '1381'
      );
      expect(mirrorMoveCel.x).toBe(380 + (330 - 384)); // 326
      expect(mirrorMoveCel.y).toBe(115 + (118 - 96));  // 137
    });

    it('resolves authentic animations and opponent transformations for M Group Batch 3 moves', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // 1. Safe ID allocations & Player / Opponent ID resolution (Batch 3 Final)
      expect(ANIMATION_REGISTRY.resolveAnimationId('moonlight', false)).toBe(6903);
      expect(ANIMATION_REGISTRY.resolveAnimationId('morning_sun', false)).toBe(6904);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mortal_spin', false)).toBe(215);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mountain_gale', false)).toBe(163);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mud_bomb', false)).toBe(672);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mud_bomb', true)).toBe(673);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mud_shot', false)).toBe(714);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mud_shot', true)).toBe(715);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mud_sport', false)).toBe(682);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mud_slap', false)).toBe(735);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mudslap', false)).toBe(735);
      expect(ANIMATION_REGISTRY.resolveAnimationId('muddy_water', false)).toBe(793);
      expect(ANIMATION_REGISTRY.resolveAnimationId('muddy_water', true)).toBe(794);
      expect(ANIMATION_REGISTRY.resolveAnimationId('multi_attack', false)).toBe(1133);
      expect(ANIMATION_REGISTRY.resolveAnimationId('multi_attack', true)).toBe(1134);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mystical_fire', false)).toBe(478);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mystical_fire', true)).toBe(479);
      expect(ANIMATION_REGISTRY.resolveAnimationId('mystical_power', false)).toBe(220);

      // 2. Trajectory reversal for OppMoves
      expect(isOppMoveTrajectoryReversed('673')).toBe(true); // mud_bomb
      expect(isOppMoveTrajectoryReversed('715')).toBe(true); // mud_shot
      expect(isOppMoveTrajectoryReversed('479')).toBe(true); // mystical_fire

      // 3. Multi-Attack (1134) OppMove dual-phase re-anchoring
      // Phase 1 (charging on Enemy): target focus cel at (363, 79) -> enemyCenter (380, 115) + (-21, -17) = (359, 98)
      const multiAtkChargeCel = CoordinateTransformer.resolveCelPosition(
        363,
        79,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '1134'
      );
      expect(multiAtkChargeCel.x).toBe(380 + (363 - 384)); // 359
      expect(multiAtkChargeCel.y).toBe(115 + (79 - 96));   // 98

      // Phase 2 (slashing on Player): user focus cel at (118, 200) -> playerCenter (130, 215) + (-10, -24) = (120, 191)
      const multiAtkSlashCel = CoordinateTransformer.resolveCelPosition(
        118,
        200,
        'user',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '1134'
      );
      expect(multiAtkSlashCel.x).toBe(130 + (118 - 128)); // 120
      expect(multiAtkSlashCel.y).toBe(215 + (200 - 224)); // 191
    });

    it('validates complete 1:1 coverage and trajectory parity for N-group battle animations (14 moves)', () => {
      // 1. Player animation mappings
      expect(ANIMATION_REGISTRY.resolveAnimationId('nasty_plot', false)).toBe(6520);
      expect(ANIMATION_REGISTRY.resolveAnimationId('natural_gift', false)).toBe(6521);
      expect(ANIMATION_REGISTRY.resolveAnimationId('nature_power', false)).toBe(6706);
      expect(ANIMATION_REGISTRY.resolveAnimationId('natures_madness', false)).toBe(6909);
      expect(ANIMATION_REGISTRY.resolveAnimationId('needle_arm', false)).toBe(6522);
      expect(ANIMATION_REGISTRY.resolveAnimationId('never_ending_nightmare', false)).toBe(6910);
      expect(ANIMATION_REGISTRY.resolveAnimationId('night_daze', false)).toBe(6523);
      expect(ANIMATION_REGISTRY.resolveAnimationId('night_shade', false)).toBe(6524);
      expect(ANIMATION_REGISTRY.resolveAnimationId('night_slash', false)).toBe(6525);
      expect(ANIMATION_REGISTRY.resolveAnimationId('nightmare', false)).toBe(204);
      expect(ANIMATION_REGISTRY.resolveAnimationId('no_retreat', false)).toBe(6913);
      expect(ANIMATION_REGISTRY.resolveAnimationId('noble_roar', false)).toBe(6736);
      expect(ANIMATION_REGISTRY.resolveAnimationId('noxious_torque', false)).toBe(6916);
      expect(ANIMATION_REGISTRY.resolveAnimationId('nuzzle', false)).toBe(6526);

      // 2. Opponent animation mappings
      expect(ANIMATION_REGISTRY.resolveAnimationId('night_daze', true)).toBe(6911);
      expect(ANIMATION_REGISTRY.resolveAnimationId('noble_roar', true)).toBe(6914);
      expect(ANIMATION_REGISTRY.resolveAnimationId('noxious_torque', true)).toBe(6917);
      expect(ANIMATION_REGISTRY.resolveAnimationId('nuzzle', true)).toBe(6915);

      // 3. Opponent detection
      expect(ANIMATION_REGISTRY.isOpponentAnimation(6911, 'OppMove:NIGHTDAZE')).toBe(true);
      expect(ANIMATION_REGISTRY.isOpponentAnimation(6914, 'OppMove:NOBLEROAR')).toBe(true);
      expect(ANIMATION_REGISTRY.isOpponentAnimation(6915, 'OppMove:NUZZLE')).toBe(true);
      expect(ANIMATION_REGISTRY.isOpponentAnimation(6917, 'OppMove:NOXIOUSTORQUE')).toBe(true);

      // 4. OppMove Coordinate Normalization & Trajectory Parity Verification
      // A. Night Daze (6911): F00 charging orb at enemy (384, 96) -> Enemy center (380, 115)
      const ndChargeCel = CoordinateTransformer.resolveCelPosition(
        384,
        96,
        'both',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6911'
      );
      expect(ndChargeCel.x).toBe(380);
      expect(ndChargeCel.y).toBe(115);

      // B. Night Daze (6911): F41 shockwave cel at player (32, 171) -> Player center (130, 215) + (-96, -53) = (34, 162)
      const ndBlastCel = CoordinateTransformer.resolveCelPosition(
        32,
        171,
        'both',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6911'
      );
      expect(ndBlastCel.x).toBe(130 + (32 - 128)); // 34
      expect(ndBlastCel.y).toBe(215 + (171 - 224)); // 162

      // C. Noble Roar (6914): Roar mouth cel at (368, 96) -> Enemy center (380, 115) + (-16, 0) = (364, 115)
      const nrRoarCel = CoordinateTransformer.resolveCelPosition(
        368,
        96,
        'user',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6914'
      );
      expect(nrRoarCel.x).toBe(380 + (368 - 384)); // 364
      expect(nrRoarCel.y).toBe(115 + (96 - 96));   // 115

      // D. Nuzzle (6915): Electric spark cel at (124, 219) -> Player center (130, 215) + (-4, -5) = (126, 210)
      const nuzzleSparkCel = CoordinateTransformer.resolveCelPosition(
        124,
        219,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6915'
      );
      expect(nuzzleSparkCel.x).toBe(130 + (124 - 128)); // 126
      expect(nuzzleSparkCel.y).toBe(215 + (219 - 224)); // 210

      // E. Cross Poison / Noxious Torque (6917): Cross slash cel at (126, 235) -> Player center (130, 215) + (-2, +11) = (128, 226)
      const cpSlashCel = CoordinateTransformer.resolveCelPosition(
        126,
        235,
        'both',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6917'
      );
      expect(cpSlashCel.x).toBe(130 + (126 - 128)); // 128
      expect(cpSlashCel.y).toBe(215 + (235 - 224)); // 226
    });

    it('correctly resolves all O-group moves to dedicated PRAS/Essentials animations without collisions', () => {
      expect(ANIMATION_REGISTRY.resolveAnimationId('oblivion_wing', false)).toBe(6918);
      expect(ANIMATION_REGISTRY.resolveAnimationId('oblivion_wing', true)).toBe(6919);
      expect(ANIMATION_REGISTRY.resolveAnimationId('obstruct', false)).toBe(6920);
      expect(ANIMATION_REGISTRY.resolveAnimationId('obstruct', true)).toBe(6921);
      expect(ANIMATION_REGISTRY.resolveAnimationId('oceanic_operetta', false)).toBe(6922);
      expect(ANIMATION_REGISTRY.resolveAnimationId('oceanic_operetta', true)).toBe(6923);
      expect(ANIMATION_REGISTRY.resolveAnimationId('octazooka', false)).toBe(6924);
      expect(ANIMATION_REGISTRY.resolveAnimationId('octazooka', true)).toBe(6925);
      expect(ANIMATION_REGISTRY.resolveAnimationId('octolock', false)).toBe(6926);
      expect(ANIMATION_REGISTRY.resolveAnimationId('odor_sleuth', false)).toBe(6927);
      expect(ANIMATION_REGISTRY.resolveAnimationId('ominous_wind', false)).toBe(6928);
      expect(ANIMATION_REGISTRY.resolveAnimationId('order_up', false)).toBe(6818);
      expect(ANIMATION_REGISTRY.resolveAnimationId('origin_pulse', false)).toBe(6929);
      expect(ANIMATION_REGISTRY.resolveAnimationId('origin_pulse', true)).toBe(6930);
      expect(ANIMATION_REGISTRY.resolveAnimationId('outrage', false)).toBe(6931);
      expect(ANIMATION_REGISTRY.resolveAnimationId('outrage', true)).toBe(6932);
      expect(ANIMATION_REGISTRY.resolveAnimationId('overdrive', false)).toBe(6933);
      expect(ANIMATION_REGISTRY.resolveAnimationId('overheat', false)).toBe(6934);
      expect(ANIMATION_REGISTRY.resolveAnimationId('overheat', true)).toBe(6935);
    });

    it('correctly maps O-group enemy OppMove animations onto defending player and enemy user without out-of-bounds', () => {
      const playerCenter = { x: 130, y: 215 };
      const enemyCenter = { x: 380, y: 115 };

      // 1. Obstruct (6921): Shield cel authored at (360, 90) re-anchors to Enemy attacker (380, 115) + (-24, -6) = (356, 109)
      const obstructCel = CoordinateTransformer.resolveCelPosition(
        360,
        90,
        'target',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6921'
      );
      expect(obstructCel.x).toBe(380 + (360 - 384)); // 356
      expect(obstructCel.y).toBe(115 + (90 - 96));   // 109

      // 2. Octazooka (6925): Ink splat cel authored at (128, 288) focus 'user' re-anchors to Player (130, 215) + (0, 64) = (130, 279)
      const octazookaCel = CoordinateTransformer.resolveCelPosition(
        128,
        288,
        'user',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6925'
      );
      expect(octazookaCel.x).toBe(130 + (128 - 128)); // 130
      expect(octazookaCel.y).toBe(215 + (288 - 224)); // 279

      // 3. Overheat (6935): Fire burst cel authored at (512, 125) focus 'both' re-anchors relative to Enemy attacker (380, 115) + (128, 29) = (508, 144)
      const overheatCel = CoordinateTransformer.resolveCelPosition(
        512,
        125,
        'both',
        enemyCenter,
        playerCenter,
        DEFAULT_ANIMATION_VIEWPORT,
        true,
        false,
        false,
        false,
        true,
        '6935'
      );
      expect(overheatCel.x).toBe(380 + (512 - 384)); // 508
      // 4. Overheat Player (6934 / 206): Fire burst cels expand in 360-degree circle around Player (130, 215)
      // Top flame at (128, 179) -> (130, 170), bottom flame at (130, 298) -> (132, 289)
      for (const ovId of ['6934', '206']) {
        const topFlame = CoordinateTransformer.resolveCelPosition(
          128,
          179,
          'both',
          playerCenter,
          enemyCenter,
          DEFAULT_ANIMATION_VIEWPORT,
          false,
          false,
          false,
          false,
          false,
          ovId
        );
        const bottomFlame = CoordinateTransformer.resolveCelPosition(
          130,
          298,
          'both',
          playerCenter,
          enemyCenter,
          DEFAULT_ANIMATION_VIEWPORT,
          false,
          false,
          false,
          false,
          false,
          ovId
        );
        expect(topFlame.x).toBe(130);
        expect(topFlame.y).toBe(215 + (179 - 224)); // 170 (above player, NOT collapsed onto line y=215)
        expect(bottomFlame.x).toBe(132);
        expect(bottomFlame.y).toBe(215 + (298 - 224)); // 289 (below player, NOT collapsed onto line y=215)
      }
    });

    it('Oblivion Wing enemy OppMove (6919): defender stays grounded and beam connects Enemy -> Player diagonally', async () => {
      const def = JSON.parse(
        fs.readFileSync(
          path.resolve(process.cwd(), '../../packages/game-data/animations/6919.json'),
          'utf-8'
        )
      ) as { frames: { cels: AnimationCel[] }[] };

      const frames = def.frames;
      expect(frames.length).toBe(35);
      // Attacker (pat -1 / user) is the one that ascends; defender (pat -2 / target) stays on the ground.
      const skyCels = frames[15].cels;
      const attackerCel = skyCels.find((c) => c.pattern === -1)!;
      const defenderCel = skyCels.find((c) => c.pattern === -2)!;
      expect(attackerCel.focus).toBe('user');
      expect(defenderCel.focus).toBe('target');
      const attackerPos = CoordinateTransformer.resolveCelPosition(
        attackerCel.x, attackerCel.y, attackerCel.focus, enemyCenter, playerCenter,
        DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6919', attackerCel.pattern
      );
      const defenderPos = CoordinateTransformer.resolveCelPosition(
        defenderCel.x, defenderCel.y, defenderCel.focus, enemyCenter, playerCenter,
        DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6919', defenderCel.pattern
      );
      expect(attackerPos.y).toBeLessThan(0);
      expect(attackerPos.x).toBe(enemyCenter.x);
      expect(Math.abs(defenderPos.y - playerCenter.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(defenderPos.x - playerCenter.x)).toBeLessThanOrEqual(10);

      // Battlers do not fly in the engine, so the beam must sit midway between the REAL
      // Enemy and Player and run along that up-right diagonal (not the old down-right slant).
      const beamCel = frames[20].cels.find((c) => c.pattern >= 0)!;
      const beamPos = CoordinateTransformer.resolveCelPosition(
        beamCel.x, beamCel.y, beamCel.focus, enemyCenter, playerCenter,
        DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6919', beamCel.pattern
      );
      expect(beamPos.x).toBeCloseTo((enemyCenter.x + playerCenter.x) / 2, 5);
      expect(beamPos.y).toBeCloseTo((enemyCenter.y + playerCenter.y) / 2, 5);
      const lineAngle =
        ((Math.atan2(playerCenter.y - enemyCenter.y, playerCenter.x - enemyCenter.x) * 180) / Math.PI + 360) % 180;
      expect(Math.abs((beamCel.angle % 180) - lineAngle)).toBeLessThan(2);
    });

    it('O-group OppMoves authored from x=384 (attacker) to x=128 (defender) travel Enemy -> Player', () => {
      for (const id of ['6923', '6925', '6932']) {
        expect(isOppMoveTrajectoryReversed(id)).toBe(true);
      }
      const resolve = (x: number, y: number, id: string) =>
        CoordinateTransformer.resolveCelPosition(
          x, y, 'both', enemyCenter, playerCenter,
          DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, id
        );

      // Octazooka projectile: F0 at authored (384, 96) -> starts on the Enemy; F7 at (128, 224) -> ends on the Player.
      const octaStart = resolve(384, 96, '6925');
      const octaEnd = resolve(128, 224, '6925');
      expect(octaStart.x).toBeCloseTo(enemyCenter.x, 5);
      expect(octaStart.y).toBeCloseTo(enemyCenter.y, 5);
      expect(octaEnd.x).toBeCloseTo(playerCenter.x, 5);
      expect(octaEnd.y).toBeCloseTo(playerCenter.y, 5);

      // Oceanic Operetta: opening wave (329) is on the Enemy side; closing splash (128) is on the Player.
      expect(resolve(329, 109, '6923').x).toBeGreaterThan(300);
      expect(resolve(128, 131, '6923').x).toBeCloseTo(playerCenter.x, 5);

      // Outrage: final impact cels (x 128..192) land on the Player side, opening burst (x ~384+) on the Enemy side.
      expect(resolve(128, 224, '6932').x).toBeCloseTo(playerCenter.x, 5);
      expect(resolve(392, 90, '6932').x).toBeGreaterThan(enemyCenter.x - 10);
    });

    describe('13. P-Group (Batch 1) Unbreakable Ties Move Animations & Coordinate Parity', () => {
      it('correctly resolves all 16 P-Group Batch 1 moves to dedicated animations', () => {
        // Player moves
        expect(ANIMATION_REGISTRY.resolveAnimationId('pain_split', false)).toBe(6936);
        expect(ANIMATION_REGISTRY.resolveAnimationId('parabolic_charge', false)).toBe(6937);
        expect(ANIMATION_REGISTRY.resolveAnimationId('parting_shot', false)).toBe(6938);
        expect(ANIMATION_REGISTRY.resolveAnimationId('pay_day', false)).toBe(6940);
        expect(ANIMATION_REGISTRY.resolveAnimationId('payback', false)).toBe(6942);
        expect(ANIMATION_REGISTRY.resolveAnimationId('peck', false)).toBe(6943);
        expect(ANIMATION_REGISTRY.resolveAnimationId('perish_song', false)).toBe(6944);
        expect(ANIMATION_REGISTRY.resolveAnimationId('petal_blizzard', false)).toBe(6945);
        expect(ANIMATION_REGISTRY.resolveAnimationId('petal_dance', false)).toBe(6947);
        expect(ANIMATION_REGISTRY.resolveAnimationId('phantom_force', false)).toBe(6949);
        expect(ANIMATION_REGISTRY.resolveAnimationId('photon_geyser', false)).toBe(6950);
        expect(ANIMATION_REGISTRY.resolveAnimationId('pin_missile', false)).toBe(6952);
        expect(ANIMATION_REGISTRY.resolveAnimationId('plasma_fists', false)).toBe(6954);
        expect(ANIMATION_REGISTRY.resolveAnimationId('play_nice', false)).toBe(6955);
        expect(ANIMATION_REGISTRY.resolveAnimationId('play_rough', false)).toBe(6956);
        expect(ANIMATION_REGISTRY.resolveAnimationId('pluck', false)).toBe(6957);

        // Opponent variants
        expect(ANIMATION_REGISTRY.resolveAnimationId('parting_shot', true)).toBe(6939);
        expect(ANIMATION_REGISTRY.resolveAnimationId('pay_day', true)).toBe(6941);
        expect(ANIMATION_REGISTRY.resolveAnimationId('petal_blizzard', true)).toBe(6946);
        expect(ANIMATION_REGISTRY.resolveAnimationId('petal_dance', true)).toBe(6948);
        expect(ANIMATION_REGISTRY.resolveAnimationId('photon_geyser', true)).toBe(6951);
        expect(ANIMATION_REGISTRY.resolveAnimationId('pin_missile', true)).toBe(6953);
        expect(ANIMATION_REGISTRY.resolveAnimationId('pluck', true)).toBe(6958);
      });

      it('preserves animation curves for radial and screenwide P-moves without collapsing into 1D lines', () => {
        // Curve preservation is active for Parabolic Charge, Pay Day, Petal Dance Opp, and Plasma Fists
        for (const id of ['6937', '6940', '6941', '6948', '6954']) {
          expect(shouldPreserveAnimationCurve(id, { focus: 'both' })).toBe(true);
        }

        // Pay Day (6940) raining coins: two cels at different vertical positions must not flatten to the same line
        const highCoin = CoordinateTransformer.resolveCelPosition(
          200, 10, 'both', playerCenter, enemyCenter,
          DEFAULT_ANIMATION_VIEWPORT, false, false, false, true, false, '6940'
        );
        const lowCoin = CoordinateTransformer.resolveCelPosition(
          200, 250, 'both', playerCenter, enemyCenter,
          DEFAULT_ANIMATION_VIEWPORT, false, false, false, true, false, '6940'
        );
        expect(highCoin.y).toBeLessThan(lowCoin.y - 150);

        // Plasma Fists (6954): upper and lower spherical burst points around the target
        const topBurst = CoordinateTransformer.resolveCelPosition(
          384, -20, 'both', playerCenter, enemyCenter,
          DEFAULT_ANIMATION_VIEWPORT, false, false, false, true, false, '6954'
        );
        const bottomBurst = CoordinateTransformer.resolveCelPosition(
          384, 210, 'both', playerCenter, enemyCenter,
          DEFAULT_ANIMATION_VIEWPORT, false, false, false, true, false, '6954'
        );
        expect(topBurst.y).toBeLessThan(enemyCenter.y - 100);
        expect(bottomBurst.y).toBeGreaterThan(enemyCenter.y + 80);
      });

      it('Parting Shot OppMove (6939): Attacker (Enemy) flees, Defender (Player) stays and shakes, shouting originates at Enemy', () => {
        const def = JSON.parse(
          fs.readFileSync(
            path.resolve(process.cwd(), '../../packages/game-data/animations/6939.json'),
            'utf-8'
          )
        ) as { frames: { cels: AnimationCel[] }[] };

        // F15: Attacker (pattern: -1) flees off screen to top right (x=624, y=32);
        // Defender (pattern: -2) stays at (128, 224) and shakes
        const f15 = def.frames[15].cels;
        const fleeAttacker = f15.find((c) => c.pattern === -1)!;
        const targetDefender = f15.find((c) => c.pattern === -2)!;
        expect(fleeAttacker.x).toBeGreaterThan(500);
        expect(targetDefender.x).toBe(128);
        expect(targetDefender.y).toBe(224);

        // Shouting sound cels in F02: resolved around userPos (Enemy at 380, 115)
        const shoutCel = def.frames[2].cels.find((c) => c.focus === 'user' && c.pattern >= 0)!;
        const shoutPos = CoordinateTransformer.resolveCelPosition(
          shoutCel.x, shoutCel.y, shoutCel.focus, enemyCenter, playerCenter,
          DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6939', shoutCel.pattern
        );
        expect(shoutPos.x).toBeGreaterThan(280);
        expect(shoutPos.x).toBeLessThan(enemyCenter.x);
        expect(Math.abs(shoutPos.y - enemyCenter.y)).toBeLessThan(50);
      });

      it('Photon Geyser OppMove (6951): travels Enemy -> Player, geyser erupts on Player, Player is lifted', () => {
        expect(isOppMoveTrajectoryReversed('6951')).toBe(true);

        const def = JSON.parse(
          fs.readFileSync(
            path.resolve(process.cwd(), '../../packages/game-data/animations/6951.json'),
            'utf-8'
          )
        ) as { frames: { cels: AnimationCel[] }[] };

        // Sphere flight F26: travels from Enemy to Player
        const sphereF26 = def.frames[26].cels.find((c) => c.focus === 'both' && c.pattern >= 0)!;
        const spherePos = CoordinateTransformer.resolveCelPosition(
          sphereF26.x, sphereF26.y, sphereF26.focus, enemyCenter, playerCenter,
          DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6951', sphereF26.pattern
        );
        expect(spherePos.x).toBeLessThan(enemyCenter.x);
        expect(spherePos.x).toBeGreaterThan(playerCenter.x);

        // Geyser impact F30+: erupts on Player side (target)
        const geyserCel = def.frames[30].cels.find((c) => c.focus === 'target' && c.pattern >= 0)!;
        const geyserPos = CoordinateTransformer.resolveCelPosition(
          geyserCel.x, geyserCel.y, geyserCel.focus, enemyCenter, playerCenter,
          DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6951', geyserCel.pattern
        );
        expect(Math.abs(geyserPos.x - playerCenter.x)).toBeLessThan(60);

        // Battler roles in F45: Defender (pattern: -2) is lifted up by geyser; Attacker (pattern: -1) stays at Enemy anchor
        const f45 = def.frames[45].cels;
        const liftedDefender = f45.find((c) => c.pattern === -2)!;
        const enemyAttacker = f45.find((c) => c.pattern === -1)!;
        expect(liftedDefender.y).toBeLessThan(224);
        expect(enemyAttacker.x).toBe(384);
        expect(enemyAttacker.y).toBe(96);
      });

      it('Petal Blizzard OppMove (6946): opening petals swirl around Enemy user, not Player target', () => {
        const def = JSON.parse(
          fs.readFileSync(
            path.resolve(process.cwd(), '../../packages/game-data/animations/6946.json'),
            'utf-8'
          )
        ) as { frames: { cels: AnimationCel[] }[] };

        const openCel = def.frames[5].cels.find((c) => c.pattern >= 0)!;
        expect(openCel.focus).toBe('user');
        const openPos = CoordinateTransformer.resolveCelPosition(
          openCel.x, openCel.y, openCel.focus, enemyCenter, playerCenter,
          DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6946', openCel.pattern
        );
        expect(openPos.x).toBeGreaterThan(250);
        expect(Math.abs(openPos.y - enemyCenter.y)).toBeLessThan(40);
      });

      it('Petal Dance OppMove (6948): Enemy dances, Player stands still, petals swirl around Enemy and fly into Player', () => {
        const def = JSON.parse(
          fs.readFileSync(
            path.resolve(process.cwd(), '../../packages/game-data/animations/6948.json'),
            'utf-8'
          )
        ) as { frames: { cels: AnimationCel[] }[] };

        // 1. In dancing frames (e.g. F05), Attacker (pattern: -1) dances around Enemy pos;
        // Defender (pattern: -2) stands motionless at Player pos (130, 215).
        const f05 = def.frames[5].cels;
        const dancingAttacker = f05.find((c) => c.pattern === -1)!;
        const stationaryDefender = f05.find((c) => c.pattern === -2)!;

        expect(dancingAttacker.focus).toBe('user');
        const attackerPos = CoordinateTransformer.resolveCelPosition(
          dancingAttacker.x, dancingAttacker.y, dancingAttacker.focus, enemyCenter, playerCenter,
          DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6948', dancingAttacker.pattern
        );
        expect(attackerPos.x).toBeGreaterThan(330);
        expect(attackerPos.x).toBeLessThan(430);
        expect(attackerPos.y).toBeGreaterThan(80);
        expect(attackerPos.y).toBeLessThan(160);

        expect(stationaryDefender.focus).toBe('target');
        const defenderPos = CoordinateTransformer.resolveCelPosition(
          stationaryDefender.x, stationaryDefender.y, stationaryDefender.focus, enemyCenter, playerCenter,
          DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6948', stationaryDefender.pattern
        );
        expect(defenderPos.x).toBeCloseTo(playerCenter.x, 1);
        expect(defenderPos.y).toBeCloseTo(playerCenter.y, 1);

        // 2. Opening petals (F05) swirl around Enemy (user focus, x > 250)
        const openingPetal = f05.find((c) => c.pattern >= 0 && c.focus === 'user')!;
        const petalPos = CoordinateTransformer.resolveCelPosition(
          openingPetal.x, openingPetal.y, openingPetal.focus, enemyCenter, playerCenter,
          DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6948', openingPetal.pattern
        );
        expect(petalPos.x).toBeGreaterThan(250);

        // 3. Flight petals (F35) strike into defending Player
        const f35Petals = def.frames[35].cels.filter((c) => c.pattern >= 0 && c.focus === 'both');
        expect(f35Petals.length).toBeGreaterThan(0);
        const resolvedF35 = f35Petals.map((p) =>
          CoordinateTransformer.resolveCelPosition(
            p.x, p.y, p.focus, enemyCenter, playerCenter,
            DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6948', p.pattern
          )
        );
        // All petals swept across from Enemy (380) into Player zone (x <= 230, x >= -50)
        for (const pos of resolvedF35) {
          expect(pos.x).toBeLessThan(230);
          expect(pos.x).toBeGreaterThan(-50);
        }
        // At least some petals directly engulf Player position (130, 215)
        const directHits = resolvedF35.filter((pos) => Math.abs(pos.x - playerCenter.x) < 50);
        expect(directHits.length).toBeGreaterThan(0);
      });

      it('validates that all P-Group Batch 1 moves have valid sound timings and existing audio files on disk', () => {
        const pMoveIds = [
          '6936', '6937', '6938', '6939', '6940', '6941', '6942', '6943',
          '6944', '6945', '6946', '6947', '6948', '6949', '6950', '6951',
          '6952', '6953', '6954', '6955', '6956', '6957', '6958'
        ];

        for (const id of pMoveIds) {
          const animDefPath = path.resolve(process.cwd(), `../../packages/game-data/animations/${id}.json`);
          expect(fs.existsSync(animDefPath)).toBe(true);
          const def = JSON.parse(fs.readFileSync(animDefPath, 'utf-8'));
          expect(def.timings).toBeDefined();

          for (const timing of def.timings) {
            if (timing.type === 'sound' && timing.payload?.sound) {
              const soundPath = timing.payload.sound;
              const directAudioPath = path.resolve(process.cwd(), `public/Audio/SE/${soundPath}`);
              const baseName = path.basename(soundPath);
              const fallbackAnimPath = path.resolve(process.cwd(), `public/Audio/SE/Anim/${baseName}`);
              const fallbackDirect = path.resolve(process.cwd(), `public/Audio/SE/${baseName}`);

              const exists =
                fs.existsSync(directAudioPath) ||
                fs.existsSync(fallbackAnimPath) ||
                fs.existsSync(fallbackDirect);
              expect(exists, `Audio file for ${id} missing: ${soundPath}`).toBe(true);
            }
          }
        }
      });

      describe('14. P-Group (Batch 2) Unbreakable Ties Move Animations & Coordinate Parity', () => {
        const batch2Moves = [
          'poison_fang', 'poison_gas', 'poison_jab', 'poison_powder', 'poison_sting',
          'poison_tail', 'pollen_puff', 'poltergeist', 'pound', 'powder',
          'powder_snow', 'power_gem', 'power_split', 'power_swap', 'power_trick',
          'power_trip', 'power_up_punch', 'power_whip', 'precipice_blades', 'present',
          'prismatic_laser', 'protect'
        ];

        it('correctly resolves all 22 P-Group Batch 2 moves to dedicated animations', () => {
          for (const moveKey of batch2Moves) {
            const animId = ANIMATION_REGISTRY.resolveAnimationId(moveKey, false);
            expect(animId).toBeDefined();
            expect(Number(animId)).toBeGreaterThanOrEqual(6959);
            expect(Number(animId)).toBeLessThanOrEqual(6987);
          }
        });

        it('preserves 2D clusters for Powder Snow, Power Swap, and Precipice Blades without collapsing into 1D line', () => {
          const snowDef = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/6973.json'), 'utf-8')
          );
          const snowCel = snowDef.frames[5].cels.find((c: AnimationCel) => c.focus === 'both')!;
          expect(shouldPreserveAnimationCurve('6973', snowCel)).toBe(true);

          const swapDef = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/6977.json'), 'utf-8')
          );
          const swapCel = swapDef.frames[5].cels.find((c: AnimationCel) => c.focus === 'both')!;
          expect(shouldPreserveAnimationCurve('6977', swapCel)).toBe(true);

          const bladesDef = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/6982.json'), 'utf-8')
          );
          const bladeCel = bladesDef.frames[5].cels.find((c: AnimationCel) => c.focus === 'both')!;
          expect(shouldPreserveAnimationCurve('6982', bladeCel)).toBe(true);
        });

        it('Poison Jab OppMove (6962): Defender (Player) is lifted up by strike, Attacker (Enemy) stays grounded, fisting cels target Player', () => {
          const def = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/6962.json'), 'utf-8')
          );

          // F12: Defender (pattern: -2) lifted up (y < 224); Attacker (pattern: -1) stays at ground anchor
          const f12 = def.frames[12].cels;
          const liftedDefender = f12.find((c: AnimationCel) => c.pattern === -2)!;
          const groundedAttacker = f12.find((c: AnimationCel) => c.pattern === -1)!;
          expect(liftedDefender.y).toBeLessThan(224);
          expect(groundedAttacker.x).toBe(128);
          expect(groundedAttacker.y).toBe(224);

          // Attack strike cels are target-focused around Player
          const strikeCel = f12.find((c: AnimationCel) => c.pattern >= 0)!;
          expect(strikeCel.focus).toBe('target');
        });

        it('Pollen Puff OppMove (6969): Attacker (Enemy) recoils, Defender (Player) stands still, puff launches from Enemy to Player', () => {
          const def = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/6969.json'), 'utf-8')
          );

          // F03: Attacker (pattern: -1) recoils at Enemy pos; Defender (pattern: -2) stands motionless at Player anchor (384, 96)
          const f03 = def.frames[3].cels;
          const recoilingAttacker = f03.find((c: AnimationCel) => c.pattern === -1)!;
          const stationaryDefender = f03.find((c: AnimationCel) => c.pattern === -2)!;
          expect(recoilingAttacker.focus).toBe('user');
          expect(stationaryDefender.focus).toBe('target');
          expect(stationaryDefender.x).toBe(384);
          expect(stationaryDefender.y).toBe(96);

          // Flight puff F07: launches near Enemy (x > 300)
          const puffF07 = def.frames[7].cels.find((c: AnimationCel) => c.focus === 'both' && c.pattern >= 0)!;
          const posF07 = CoordinateTransformer.resolveCelPosition(
            puffF07.x, puffF07.y, puffF07.focus, enemyCenter, playerCenter,
            DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6969', puffF07.pattern
          );
          expect(posF07.x).toBeGreaterThan(300);

          // Flight puff F18: impacts near Player (x < 220)
          const puffF18 = def.frames[18].cels.find((c: AnimationCel) => c.focus === 'both' && c.pattern >= 0)!;
          const posF18 = CoordinateTransformer.resolveCelPosition(
            puffF18.x, puffF18.y, puffF18.focus, enemyCenter, playerCenter,
            DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6969', puffF18.pattern
          );
          expect(posF18.x).toBeLessThan(220);
        });

        it('Protect OppMove (6987): protective shield forms directly in front of Enemy, not Player', () => {
          const def = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/6987.json'), 'utf-8')
          );

          const shieldCel = def.frames[5].cels.find((c: AnimationCel) => c.pattern >= 0)!;
          expect(shieldCel.focus).toBe('user');
          const shieldPos = CoordinateTransformer.resolveCelPosition(
            shieldCel.x, shieldCel.y, shieldCel.focus, enemyCenter, playerCenter,
            DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6987', shieldCel.pattern
          );
          // Shield appears in front of Enemy (near 380, 115)
          expect(Math.abs(shieldPos.x - enemyCenter.x)).toBeLessThan(60);
          expect(Math.abs(shieldPos.y - enemyCenter.y)).toBeLessThan(60);
        });

        it('Poison Sting (6965) and Present (6984) OppMoves travel from Enemy toward Player', () => {
          expect(isOppMoveTrajectoryReversed('6965')).toBe(true);
          expect(isOppMoveTrajectoryReversed('6984')).toBe(true);

          const stingDef = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/6965.json'), 'utf-8')
          );
          const stingF00 = stingDef.frames[0].cels.find((c: AnimationCel) => c.focus === 'both')!;
          const posSting00 = CoordinateTransformer.resolveCelPosition(
            stingF00.x, stingF00.y, stingF00.focus, enemyCenter, playerCenter,
            DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6965', stingF00.pattern
          );
          expect(posSting00.x).toBeGreaterThan(300);

          const stingF10 = stingDef.frames[10].cels.find((c: AnimationCel) => c.focus === 'both')!;
          const posSting10 = CoordinateTransformer.resolveCelPosition(
            stingF10.x, stingF10.y, stingF10.focus, enemyCenter, playerCenter,
            DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6965', stingF10.pattern
          );
          expect(posSting10.x).toBeLessThan(200);
        });

        it('Poison Tail OppMove (6967) strikes and bubbles directly engulf defending Player', () => {
          const def = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/6967.json'), 'utf-8')
          );

          // All impact cels in F10 resolved against Player
          const f10Cels = def.frames[10].cels.filter((c: AnimationCel) => c.pattern >= 0);
          expect(f10Cels.length).toBeGreaterThan(0);
          for (const cel of f10Cels) {
            const pos = CoordinateTransformer.resolveCelPosition(
              cel.x, cel.y, cel.focus, enemyCenter, playerCenter,
              DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6967', cel.pattern
            );
            expect(Math.abs(pos.x - playerCenter.x)).toBeLessThan(100);
            expect(Math.abs(pos.y - playerCenter.y)).toBeLessThan(100);
          }
        });

        it('validates that all P-Group Batch 2 moves have valid sound timings and existing audio files on disk', () => {
          for (let id = 6959; id <= 6987; id++) {
            const animDefPath = path.resolve(process.cwd(), `../../packages/game-data/animations/${id}.json`);
            expect(fs.existsSync(animDefPath)).toBe(true);
            const def = JSON.parse(fs.readFileSync(animDefPath, 'utf-8'));
            expect(def.timings).toBeDefined();

            for (const timing of def.timings) {
              if (timing.type === 'sound') {
                const soundPath = timing.sound?.file || timing.payload?.sound;
                if (!soundPath) continue;
                const directAudioPath = path.resolve(process.cwd(), `public/Audio/SE/${soundPath}`);
                const baseName = path.basename(soundPath);
                const fallbackAnimPath = path.resolve(process.cwd(), `public/Audio/SE/Anim/${baseName}`);
                const fallbackDirect = path.resolve(process.cwd(), `public/Audio/SE/${baseName}`);

                const exists =
                  fs.existsSync(directAudioPath) ||
                  fs.existsSync(fallbackAnimPath) ||
                  fs.existsSync(fallbackDirect);
                expect(exists, `Audio file for ${id} missing: ${soundPath}`).toBe(true);
              }
            }
          }
        });
      });

      describe('15. P-Group (Batch 3) Unbreakable Ties Move Animations & Coordinate Parity', () => {
        const enemyCenter = { x: 380, y: 115 };
        const playerCenter = { x: 130, y: 215 };

        it('has all 24 definitions exported with valid non-empty frames', () => {
          for (let id = 6988; id <= 7011; id++) {
            const animDefPath = path.resolve(process.cwd(), `../../packages/game-data/animations/${id}.json`);
            expect(fs.existsSync(animDefPath), `Definition ${id}.json must exist`).toBe(true);
            const def = JSON.parse(fs.readFileSync(animDefPath, 'utf-8'));
            expect(def.frames.length).toBeGreaterThan(0);
            expect(def.id).toBe(String(id));
          }
        });

        it('correctly maps all 17 Batch 3 moves and fallbacks in move-animation-map.json', () => {
          const mapPath = path.resolve(process.cwd(), '../../packages/game-data/move-animation-map.json');
          const animMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));

          const expectedBatch3 = {
            psybeam: { pl: 6988, opp: 6989 },
            psyblade: { pl: 6996, opp: 6997 },
            psych_up: { pl: 6990, opp: undefined },
            psychic: { pl: 6991, opp: undefined },
            psychic_fangs: { pl: 6992, opp: undefined },
            psychic_noise: { pl: 7001, opp: 7002 },
            psychic_terrain: { pl: 6993, opp: undefined },
            psycho_boost: { pl: 6994, opp: 6995 },
            psycho_cut: { pl: 6996, opp: 6997 },
            psycho_shift: { pl: 6998, opp: undefined },
            psyshield_bash: { pl: 6999, opp: undefined },
            psyshock: { pl: 6999, opp: undefined },
            psystrike: { pl: 7000, opp: undefined },
            psywave: { pl: 7001, opp: 7002 },
            pulverizing_pancake: { pl: 7003, opp: undefined },
            punishment: { pl: 7004, opp: undefined },
            purify: { pl: 7005, opp: 7006 },
            pursuit: { pl: 7007, opp: 7008 },
            pyro_ball: { pl: 7009, opp: 7010 },
            shattered_psyche: { pl: 7011, opp: undefined },
          };

          for (const [move, mapping] of Object.entries(expectedBatch3)) {
            expect(animMap.moves[move], `moves[${move}] mapping`).toBe(mapping.pl);
            if (mapping.opp !== undefined) {
              expect(animMap.opponentMoves[move], `opponentMoves[${move}] mapping`).toBe(mapping.opp);
            }
          }
        });

        it('reverses OppMove trajectories for whitelisted Batch 3 projectile/beam moves', () => {
          const oppReversedIds = ['6989', '6995', '6997', '7002', '7006', '7008', '7010'];
          for (const id of oppReversedIds) {
            expect(isOppMoveTrajectoryReversed(id), `isOppMoveTrajectoryReversed(${id})`).toBe(true);
            expect(isOppMoveTrajectoryReversed(Number(id)), `isOppMoveTrajectoryReversed(Number(${id}))`).toBe(true);
            expect(OPP_MOVE_TRAJECTORY_REVERSED_IDS.has(id)).toBe(true);
          }
        });

        it('Psybeam OppMove (6989) fires beam rings from Enemy toward Player', () => {
          const def = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/6989.json'), 'utf-8')
          );
          const f02Cel = def.frames[2].cels.find((c: AnimationCel) => c.focus === 'both')!;
          const posStart = CoordinateTransformer.resolveCelPosition(
            f02Cel.x, f02Cel.y, f02Cel.focus, enemyCenter, playerCenter,
            DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6989', f02Cel.pattern
          );
          expect(posStart.x).toBeGreaterThan(250);

          const f19Cel = def.frames[19].cels.find((c: AnimationCel) => c.focus === 'both')!;
          const posEnd = CoordinateTransformer.resolveCelPosition(
            f19Cel.x, f19Cel.y, f19Cel.focus, enemyCenter, playerCenter,
            DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6989', f19Cel.pattern
          );
          expect(posEnd.x).toBeLessThan(200);
        });

        it('Psycho Boost OppMove (6995) launches blast from Enemy and swirls on defending Player', () => {
          const def = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/6995.json'), 'utf-8')
          );
          const f00Cel = def.frames[0].cels.find((c: AnimationCel) => c.focus === 'both')!;
          const posStart = CoordinateTransformer.resolveCelPosition(
            f00Cel.x, f00Cel.y, f00Cel.focus, enemyCenter, playerCenter,
            DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6995', f00Cel.pattern
          );
          expect(posStart.x).toBeGreaterThan(250);

          // Impact swirls at frame 35
          const f35Cels = def.frames[35].cels.filter((c: AnimationCel) => c.pattern >= 0);
          expect(f35Cels.length).toBeGreaterThan(0);
          for (const cel of f35Cels) {
            const pos = CoordinateTransformer.resolveCelPosition(
              cel.x, cel.y, cel.focus, enemyCenter, playerCenter,
              DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '6995', cel.pattern
            );
            expect(Math.abs(pos.x - playerCenter.x)).toBeLessThan(120);
            expect(Math.abs(pos.y - playerCenter.y)).toBeLessThan(120);
          }
        });

        it('Pursuit OppMove (7008) dark strike lands directly on defending Player', () => {
          const def = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/7008.json'), 'utf-8')
          );
          const f10Cels = def.frames[10].cels.filter((c: AnimationCel) => c.pattern >= 0);
          expect(f10Cels.length).toBeGreaterThan(0);
          for (const cel of f10Cels) {
            const pos = CoordinateTransformer.resolveCelPosition(
              cel.x, cel.y, cel.focus, enemyCenter, playerCenter,
              DEFAULT_ANIMATION_VIEWPORT, true, false, false, false, true, '7008', cel.pattern
            );
            expect(Math.abs(pos.x - playerCenter.x)).toBeLessThan(50);
          }
        });

        it('Pyro Ball (7009 / 7010) preserves juggling vertical spreads and flight curve', () => {
          // Check shouldPreserveAnimationCurve
          const testCel: AnimationCel = {
            pattern: 1, x: 224, y: 192, zoomX: 100, zoomY: 100,
            angle: 0, mirror: false, opacity: 255, blendMode: 'normal',
            visible: true, priority: 1, focus: 'both'
          };
          expect(shouldPreserveAnimationCurve('7009', testCel)).toBe(true);
          expect(shouldPreserveAnimationCurve('7010', testCel)).toBe(true);

          // In frame 30 of PL (7009), juggling ball at x=184, y=168 preserves vertical offset
          const def7009 = JSON.parse(
            fs.readFileSync(path.resolve(process.cwd(), '../../packages/game-data/animations/7009.json'), 'utf-8')
          );
          const f30Cel = def7009.frames[30].cels.find((c: AnimationCel) => c.pattern >= 0)!;
          const posCurve = CoordinateTransformer.resolveCelPosition(
            f30Cel.x, f30Cel.y, f30Cel.focus, playerCenter, enemyCenter,
            DEFAULT_ANIMATION_VIEWPORT, false, false, false, true, false, '7009', f30Cel.pattern
          );
          // Compare with a baseline definition that doesn't have curve preserved
          const posFlat = CoordinateTransformer.resolveCelPosition(
            f30Cel.x, f30Cel.y, f30Cel.focus, playerCenter, enemyCenter,
            DEFAULT_ANIMATION_VIEWPORT, false, false, false, false, false, '99999', f30Cel.pattern
          );
          // Vertical juggling arc offset must be retained (28px difference from linear diagonal)
          expect(Math.abs(posCurve.y - posFlat.y)).toBeGreaterThan(10);
        });

        it('validates that all P-Group Batch 3 moves have valid sound timings and existing audio files on disk', () => {
          for (let id = 6988; id <= 7011; id++) {
            const animDefPath = path.resolve(process.cwd(), `../../packages/game-data/animations/${id}.json`);
            expect(fs.existsSync(animDefPath)).toBe(true);
            const def = JSON.parse(fs.readFileSync(animDefPath, 'utf-8'));
            expect(def.timings).toBeDefined();

            for (const timing of def.timings) {
              if (timing.type === 'sound') {
                const soundPath = timing.sound?.file || timing.payload?.sound;
                if (!soundPath) continue;
                const directAudioPath = path.resolve(process.cwd(), `public/Audio/SE/${soundPath}`);
                const baseName = path.basename(soundPath);
                const fallbackAnimPath = path.resolve(process.cwd(), `public/Audio/SE/Anim/${baseName}`);
                const fallbackDirect = path.resolve(process.cwd(), `public/Audio/SE/${baseName}`);

                const exists =
                  fs.existsSync(directAudioPath) ||
                  fs.existsSync(fallbackAnimPath) ||
                  fs.existsSync(fallbackDirect);
                expect(exists, `Audio file for ${id} missing: ${soundPath}`).toBe(true);
              }
            }
          }
        });
        it('validates T-Group Batch 1 move animations (IDs 7247..7296) and Fallbacks', () => {
          // 1. Primary Move Resolution
          expect(ANIMATION_REGISTRY.resolveAnimationId('tackle', false)).toBe(7247);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tackle', true)).toBe(7248);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tail_glow', false)).toBe(7249);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tail_glow', true)).toBe(7250);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tail_slap', false)).toBe(7251);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tail_slap', true)).toBe(7252);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tail_whip', false)).toBe(7253);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tail_whip', true)).toBe(7254);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tailwind', false)).toBe(7255);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tailwind', true)).toBe(7256);
          expect(ANIMATION_REGISTRY.resolveAnimationId('take_down', false)).toBe(7257);
          expect(ANIMATION_REGISTRY.resolveAnimationId('take_down', true)).toBe(7258);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tar_shot', false)).toBe(7259);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tar_shot', true)).toBe(7260);
          expect(ANIMATION_REGISTRY.resolveAnimationId('taunt', false)).toBe(7261);
          expect(ANIMATION_REGISTRY.resolveAnimationId('taunt', true)).toBe(7262);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tearful_look', false)).toBe(7263);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tearful_look', true)).toBe(7264);
          expect(ANIMATION_REGISTRY.resolveAnimationId('teatime', false)).toBe(7265);
          expect(ANIMATION_REGISTRY.resolveAnimationId('teatime', true)).toBe(7266);
          expect(ANIMATION_REGISTRY.resolveAnimationId('techno_blast', false)).toBe(7267);
          expect(ANIMATION_REGISTRY.resolveAnimationId('techno_blast', true)).toBe(7268);
          expect(ANIMATION_REGISTRY.resolveAnimationId('teeter_dance', false)).toBe(7269);
          expect(ANIMATION_REGISTRY.resolveAnimationId('teeter_dance', true)).toBe(7270);
          expect(ANIMATION_REGISTRY.resolveAnimationId('telekinesis', false)).toBe(7271);
          expect(ANIMATION_REGISTRY.resolveAnimationId('telekinesis', true)).toBe(7272);
          expect(ANIMATION_REGISTRY.resolveAnimationId('teleport', false)).toBe(7273);
          expect(ANIMATION_REGISTRY.resolveAnimationId('teleport', true)).toBe(7274);
          expect(ANIMATION_REGISTRY.resolveAnimationId('terrain_pulse', false)).toBe(7275);
          expect(ANIMATION_REGISTRY.resolveAnimationId('terrain_pulse', true)).toBe(7276);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thief', false)).toBe(7277);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thief', true)).toBe(7278);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thousand_arrows', false)).toBe(7279);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thousand_arrows', true)).toBe(7280);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thousand_waves', false)).toBe(7281);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thousand_waves', true)).toBe(7282);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thrash', false)).toBe(7283);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thrash', true)).toBe(7284);
          expect(ANIMATION_REGISTRY.resolveAnimationId('throat_chop', false)).toBe(7285);
          expect(ANIMATION_REGISTRY.resolveAnimationId('throat_chop', true)).toBe(7286);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder', false)).toBe(7287);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder', true)).toBe(7288);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder_cage', false)).toBe(7289);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder_cage', true)).toBe(7290);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder_fang', false)).toBe(7291);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder_fang', true)).toBe(7292);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder_punch', false)).toBe(7293);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder_punch', true)).toBe(7294);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder_shock', false)).toBe(7295);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder_shock', true)).toBe(7296);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thundershock', false)).toBe(7295);

          // 2. Fallbacks
          expect(ANIMATION_REGISTRY.resolveAnimationId('tachyon_cutter', false)).toBe(6897);
          expect(ANIMATION_REGISTRY.resolveAnimationId('take_heart', false)).toBe(424);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tectonic_rage', false)).toBe(518);
          expect(ANIMATION_REGISTRY.resolveAnimationId('temper_flare', false)).toBe(6786);
          expect(ANIMATION_REGISTRY.resolveAnimationId('temper_flare', true)).toBe(6787);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tera_blast', false)).toBe(7240);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tera_blast', true)).toBe(7241);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tera_starstorm', false)).toBe(6476);
        });

        it('validates T-Group Batch 2 move animations (IDs 7297..7338), Fallbacks, and Trajectories', () => {
          // 1. Primary Dedicated Move Resolutions
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder_wave', false)).toBe(7297);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunder_wave', true)).toBe(7298);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunderbolt', false)).toBe(7299);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunderbolt', true)).toBe(7300);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunderous_kick', false)).toBe(7301);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunderous_kick', true)).toBe(7302);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tickle', false)).toBe(7303);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tickle', true)).toBe(7304);
          expect(ANIMATION_REGISTRY.resolveAnimationId('topsy_turvy', false)).toBe(7305);
          expect(ANIMATION_REGISTRY.resolveAnimationId('topsy_turvy', true)).toBe(7306);
          expect(ANIMATION_REGISTRY.resolveAnimationId('torment', false)).toBe(7307);
          expect(ANIMATION_REGISTRY.resolveAnimationId('torment', true)).toBe(7308);
          expect(ANIMATION_REGISTRY.resolveAnimationId('toxic', false)).toBe(7309);
          expect(ANIMATION_REGISTRY.resolveAnimationId('toxic', true)).toBe(7310);
          expect(ANIMATION_REGISTRY.resolveAnimationId('toxic_spikes', false)).toBe(7311);
          expect(ANIMATION_REGISTRY.resolveAnimationId('toxic_spikes', true)).toBe(7312);
          expect(ANIMATION_REGISTRY.resolveAnimationId('toxic_thread', false)).toBe(7313);
          expect(ANIMATION_REGISTRY.resolveAnimationId('toxic_thread', true)).toBe(7314);
          expect(ANIMATION_REGISTRY.resolveAnimationId('transform', false)).toBe(7315);
          expect(ANIMATION_REGISTRY.resolveAnimationId('transform', true)).toBe(7316);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tri_attack', false)).toBe(7317);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tri_attack', true)).toBe(7318);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trick', false)).toBe(7319);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trick', true)).toBe(7320);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trick_or_treat', false)).toBe(7321);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trick_or_treat', true)).toBe(7322);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trick_room', false)).toBe(7323);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trick_room', true)).toBe(7324);
          expect(ANIMATION_REGISTRY.resolveAnimationId('triple_axel', false)).toBe(7325);
          expect(ANIMATION_REGISTRY.resolveAnimationId('triple_axel', true)).toBe(7326);
          expect(ANIMATION_REGISTRY.resolveAnimationId('triple_kick', false)).toBe(7327);
          expect(ANIMATION_REGISTRY.resolveAnimationId('triple_kick', true)).toBe(7328);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trop_kick', false)).toBe(7329);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trop_kick', true)).toBe(7330);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trump_card', false)).toBe(7331);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trump_card', true)).toBe(7332);
          expect(ANIMATION_REGISTRY.resolveAnimationId('twineedle', false)).toBe(7333);
          expect(ANIMATION_REGISTRY.resolveAnimationId('twineedle', true)).toBe(7334);
          expect(ANIMATION_REGISTRY.resolveAnimationId('twinkle_tackle', false)).toBe(7335);
          expect(ANIMATION_REGISTRY.resolveAnimationId('twinkle_tackle', true)).toBe(7336);
          expect(ANIMATION_REGISTRY.resolveAnimationId('twister', false)).toBe(7337);
          expect(ANIMATION_REGISTRY.resolveAnimationId('twister', true)).toBe(7338);

          // 2. Fallbacks
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunderclap', false)).toBe(7299);
          expect(ANIMATION_REGISTRY.resolveAnimationId('thunderclap', true)).toBe(7300);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tidy_up', false)).toBe(7016);
          expect(ANIMATION_REGISTRY.resolveAnimationId('tidy_up', true)).toBe(7017);
          expect(ANIMATION_REGISTRY.resolveAnimationId('torch_song', false)).toBe(6830);
          expect(ANIMATION_REGISTRY.resolveAnimationId('torch_song', true)).toBe(6831);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trailblaze', false)).toBe(6786);
          expect(ANIMATION_REGISTRY.resolveAnimationId('trailblaze', true)).toBe(6787);
          expect(ANIMATION_REGISTRY.resolveAnimationId('triple_arrows', false)).toBe(7279);
          expect(ANIMATION_REGISTRY.resolveAnimationId('triple_arrows', true)).toBe(7280);
          expect(ANIMATION_REGISTRY.resolveAnimationId('triple_dive', false)).toBe(7233);
          expect(ANIMATION_REGISTRY.resolveAnimationId('triple_dive', true)).toBe(7233);
          expect(ANIMATION_REGISTRY.resolveAnimationId('twin_beam', false)).toBe(6988);
          expect(ANIMATION_REGISTRY.resolveAnimationId('twin_beam', true)).toBe(6989);

          // 3. Trajectory-reversed OppMove IDs
          expect(CoordinateTransformer.isOppMoveTrajectoryReversed('7318')).toBe(true);
          expect(CoordinateTransformer.isOppMoveTrajectoryReversed('7322')).toBe(true);
          expect(CoordinateTransformer.isOppMoveTrajectoryReversed('7328')).toBe(true);
        });

        it('verifies Tackle (7247 & 7248) correctly targets defending battler and has PRSFX- Tackle.wav', () => {
          const plTacklePath = path.resolve(process.cwd(), '../../packages/game-data/animations/7247.json');
          const oppTacklePath = path.resolve(process.cwd(), '../../packages/game-data/animations/7248.json');
          const plTackle: BattleAnimationDefinition = JSON.parse(fs.readFileSync(plTacklePath, 'utf-8'));
          const oppTackle: BattleAnimationDefinition = JSON.parse(fs.readFileSync(oppTacklePath, 'utf-8'));

          // Sounds
          expect(plTackle.timings.some((t) => t.payload?.sound === 'PRSFX- Tackle.wav')).toBe(true);
          expect(oppTackle.timings.some((t) => t.payload?.sound === 'PRSFX- Tackle.wav')).toBe(true);

          // Player Tackle impact star (frame 1, pattern 0)
          const plStar = plTackle.frames[1].cels.find((c) => c.pattern === 0);
          expect(plStar?.focus).toBe('target');
          const plPos = CoordinateTransformer.resolveCelPosition(
            plStar!.x,
            plStar!.y,
            plStar!.focus,
            playerCenter,
            enemyCenter
          );
          // Lands on enemy defender (around x=380, y=115)
          expect(Math.abs(plPos.x - enemyCenter.x)).toBeLessThan(20);
          expect(Math.abs(plPos.y - enemyCenter.y)).toBeLessThan(20);

          // Opponent Tackle impact star (frame 1, pattern 0)
          const oppStar = oppTackle.frames[1].cels.find((c) => c.pattern === 0);
          expect(oppStar?.focus).toBe('target');
          const oppPos = CoordinateTransformer.resolveCelPosition(
            oppStar!.x,
            oppStar!.y,
            oppStar!.focus,
            enemyCenter,
            playerCenter,
            undefined,
            true,
            false,
            false,
            false,
            true,
            7248,
            0
          );
          // Lands on player defender (around x=130, y=215), NOT on enemy!
          expect(Math.abs(oppPos.x - playerCenter.x)).toBeLessThan(20);
          expect(Math.abs(oppPos.y - playerCenter.y)).toBeLessThan(20);
        });

        it('verifies Tearful Look (7263 & 7264) correctly anchors teary eyes on the acting user with PRSFX- Tearful Look sounds', () => {
          const plDefPath = path.resolve(process.cwd(), '../../packages/game-data/animations/7263.json');
          const oppDefPath = path.resolve(process.cwd(), '../../packages/game-data/animations/7264.json');
          const plDef: BattleAnimationDefinition = JSON.parse(fs.readFileSync(plDefPath, 'utf-8'));
          const oppDef: BattleAnimationDefinition = JSON.parse(fs.readFileSync(oppDefPath, 'utf-8'));

          // Sounds
          expect(plDef.timings.some((t) => t.payload?.sound === 'PRSFX- Tearful Look1.wav')).toBe(true);
          expect(oppDef.timings.some((t) => t.payload?.sound === 'PRSFX- Tearful Look1.wav')).toBe(true);

          // Player cast: teary eyes land on Player
          const plEye = plDef.frames[0].cels.find((c) => c.pattern === 15);
          expect(plEye?.focus).toBe('user');
          const plPos = CoordinateTransformer.resolveCelPosition(
            plEye!.x,
            plEye!.y,
            plEye!.focus,
            playerCenter,
            enemyCenter
          );
          expect(Math.abs(plPos.x - playerCenter.x)).toBeLessThan(35);
          expect(Math.abs(plPos.y - (playerCenter.y - 66))).toBeLessThan(20);

          // Opponent cast: teary eyes land on Enemy user, NOT Player
          const oppEye = oppDef.frames[0].cels.find((c) => c.pattern === 15);
          expect(oppEye?.focus).toBe('user');
          const oppPos = CoordinateTransformer.resolveCelPosition(
            oppEye!.x,
            oppEye!.y,
            oppEye!.focus,
            enemyCenter,
            playerCenter
          );
          expect(Math.abs(oppPos.x - enemyCenter.x)).toBeLessThan(35);
          expect(Math.abs(oppPos.y - (enemyCenter.y - 66))).toBeLessThan(20);
        });

        it('validates that all T-group moves have valid sound timings and existing audio files on disk', () => {
          const tMoves = Object.keys(moveMapData.moves).filter((m) =>
            m.startsWith('t')
          );
          for (const m of tMoves) {
            const plId = ANIMATION_REGISTRY.resolveAnimationId(m, false);
            const oppId = ANIMATION_REGISTRY.resolveAnimationId(m, true);
            const plDefPath = path.resolve(process.cwd(), `../../packages/game-data/animations/${plId}.json`);
            const oppDefPath = path.resolve(process.cwd(), `../../packages/game-data/animations/${oppId}.json`);
            expect(fs.existsSync(plDefPath)).toBe(true);
            expect(fs.existsSync(oppDefPath)).toBe(true);
            const plDef: BattleAnimationDefinition = JSON.parse(fs.readFileSync(plDefPath, 'utf-8'));
            const oppDef: BattleAnimationDefinition = JSON.parse(fs.readFileSync(oppDefPath, 'utf-8'));
            expect(plDef.timings.length).toBeGreaterThan(0);
            expect(oppDef.timings.length).toBeGreaterThan(0);
          }
        });

        it('validates that all U & V group moves resolve cleanly, have audio, and valid bounds', () => {
          const uvMoves = Object.keys(moveMapData.moves).filter((m) =>
            m.startsWith('u') || m.startsWith('v')
          );
          expect(uvMoves.length).toBeGreaterThanOrEqual(15);
          for (const m of uvMoves) {
            const plId = ANIMATION_REGISTRY.resolveAnimationId(m, false);
            const oppId = ANIMATION_REGISTRY.resolveAnimationId(m, true);
            expect(plId).toBeDefined();
            expect(oppId).toBeDefined();

            const plDefPath = path.resolve(process.cwd(), `../../packages/game-data/animations/${plId}.json`);
            const oppDefPath = path.resolve(process.cwd(), `../../packages/game-data/animations/${oppId}.json`);
            expect(fs.existsSync(plDefPath)).toBe(true);
            expect(fs.existsSync(oppDefPath)).toBe(true);

            const plDef: BattleAnimationDefinition = JSON.parse(fs.readFileSync(plDefPath, 'utf-8'));
            const oppDef: BattleAnimationDefinition = JSON.parse(fs.readFileSync(oppDefPath, 'utf-8'));
            expect(plDef.frames.length).toBeGreaterThan(0);
            expect(oppDef.frames.length).toBeGreaterThan(0);

            // Check sound timings exist on disk
            for (const t of [...plDef.timings, ...oppDef.timings]) {
              if (t.type === 'sound' && t.payload?.sound) {
                const sname = t.payload.sound.replace(/\\/g, '/').split('/').pop()!;
                const p1 = path.resolve(process.cwd(), `public/Audio/SE/${sname}`);
                const p2 = path.resolve(process.cwd(), `public/Audio/SE/Anim/${sname}`);
                expect(fs.existsSync(p1) || fs.existsSync(p2)).toBe(true);
              }
            }
          }

          // Specific verification for Vacuum Wave, U-Turn, and Volt Switch
          const vacOppId = ANIMATION_REGISTRY.resolveAnimationId('vacuum_wave', true);
          expect(vacOppId).toBe(7346);

          const uturnOppId = ANIMATION_REGISTRY.resolveAnimationId('u_turn', true);
          expect(uturnOppId).toBe(7340);

          const voltOppId = ANIMATION_REGISTRY.resolveAnimationId('volt_switch', true);
          expect(voltOppId).toBe(7358);

          // Verify U-Turn OppMove resolves from enemy attacker to player defender
          const enemyPos = { x: 384, y: 96 };
          const playerPos = { x: 130, y: 215 };
          const uTurnStart = CoordinateTransformer.resolveCelPosition(
            384,
            224,
            'both',
            enemyPos,
            playerPos,
            undefined,
            undefined,
            false,
            false,
            false,
            true,
            7340
          );
          expect(uTurnStart.x).toBe(enemyPos.x);

          const uTurnHit = CoordinateTransformer.resolveCelPosition(
            128,
            96,
            'both',
            enemyPos,
            playerPos,
            undefined,
            undefined,
            false,
            false,
            false,
            true,
            7340
          );
          expect(uTurnHit.x).toBe(playerPos.x);
        });

        it('verifies Upper Hand maps to authentic Force Palm (537 PL / 538 OPP) and targets defending battler', () => {
          expect(ANIMATION_REGISTRY.resolveAnimationId('upper_hand', false)).toBe(537);
          expect(ANIMATION_REGISTRY.resolveAnimationId('upper_hand', true)).toBe(538);

          const enemyPos = { x: 384, y: 96 };
          const playerPos = { x: 130, y: 215 };

          // Enemy uses Upper Hand on Player
          const oppHit = CoordinateTransformer.resolveCelPosition(
            136,
            226,
            'target',
            enemyPos,
            playerPos,
            undefined,
            undefined,
            false,
            false,
            false,
            true,
            538
          );
          expect(oppHit.x).toBe(138);
          expect(oppHit.y).toBe(217);

          // Player uses Upper Hand on Enemy
          const plHit = CoordinateTransformer.resolveCelPosition(
            384,
            114,
            'target',
            playerPos,
            enemyPos,
            undefined,
            undefined,
            false,
            false,
            false,
            false,
            537
          );
          expect(plHit.x).toBe(384);
          expect(plHit.y).toBe(114);
        });

        it('verifies Vital Throw (7355 PL / 7356 OPP) strike cels land squarely on defending battler', () => {
          expect(ANIMATION_REGISTRY.resolveAnimationId('vital_throw', false)).toBe(7355);
          expect(ANIMATION_REGISTRY.resolveAnimationId('vital_throw', true)).toBe(7356);

          const enemyPos = { x: 384, y: 96 };
          const playerPos = { x: 130, y: 215 };

          // Enemy uses Vital Throw on Player
          const oppHit = CoordinateTransformer.resolveCelPosition(
            384,
            96,
            'target',
            enemyPos,
            playerPos,
            undefined,
            undefined,
            false,
            false,
            false,
            true,
            7356
          );
          expect(oppHit.x).toBe(playerPos.x);
          expect(oppHit.y).toBe(playerPos.y);

          // Player uses Vital Throw on Enemy
          const plHit = CoordinateTransformer.resolveCelPosition(
            384,
            96,
            'target',
            playerPos,
            enemyPos,
            undefined,
            undefined,
            false,
            false,
            false,
            false,
            7355
          );
          expect(plHit.x).toBe(enemyPos.x);
          expect(plHit.y).toBe(enemyPos.y);
        });
      });
    });
  });
});





