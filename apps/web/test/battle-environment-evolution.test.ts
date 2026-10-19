import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BattleAtmosphereManager } from '../src/battle/animation/battle-atmosphere';
import { BattleCameraManager } from '../src/battle/animation/battle-camera';
import { battleAnimationPlayer } from '../src/battle/animation/animation-player';

describe('Battle Environment Evolution (EBDX Atmosphere & Camera Systems)', () => {
  describe('BattleAtmosphereManager (fp["bg"] & Defocus Vignette)', () => {
    let atmosphere: BattleAtmosphereManager;

    beforeEach(() => {
      atmosphere = new BattleAtmosphereManager();
      atmosphere.reset();
    });

    it('maps elemental types to authentic EBDX signature colors', () => {
      // EBDX signature dark color from Bite/Crunch/Dark Pulse: Color.new(66, 60, 81)
      const darkTheme = atmosphere.getTheme('dark');
      expect(darkTheme.r).toBe(66);
      expect(darkTheme.g).toBe(60);
      expect(darkTheme.b).toBe(81);
      expect(darkTheme.maxAlpha).toBeCloseTo(0.62, 2);

      // EBDX signature fire color: Color.new(130, 52, 42)
      const fireTheme = atmosphere.getTheme('fire');
      expect(fireTheme.r).toBe(130);
      expect(fireTheme.g).toBe(52);
      expect(fireTheme.b).toBe(42);

      // Water abyssal blue
      const waterTheme = atmosphere.getTheme('water');
      expect(waterTheme.r).toBe(20);
      expect(waterTheme.g).toBe(55);
      expect(waterTheme.b).toBe(95);

      // Fallback for undefined/unknown type
      const defaultTheme = atmosphere.getTheme(undefined);
      expect(defaultTheme.r).toBe(25);
      expect(defaultTheme.g).toBe(25);
      expect(defaultTheme.b).toBe(30);
    });

    it('follows an authentic EBDX alpha envelope (fade-in -> sustain -> fade-out)', () => {
      const maxAlpha = 0.6;

      // At start (progress 0): alpha is 0
      const atStart = atmosphere.computeAlphaFromProgress(0, maxAlpha);
      expect(atStart).toBe(0);

      // Mid fade-in (progress 0.08): alpha ramping up
      const midFadeIn = atmosphere.computeAlphaFromProgress(0.08, maxAlpha);
      expect(midFadeIn).toBeGreaterThan(0);
      expect(midFadeIn).toBeLessThan(maxAlpha);

      // Sustained peak (progress 0.30 - 0.70): alpha at peak
      const peakEarly = atmosphere.computeAlphaFromProgress(0.3, maxAlpha);
      const peakLate = atmosphere.computeAlphaFromProgress(0.6, maxAlpha);
      expect(peakEarly).toBe(maxAlpha);
      expect(peakLate).toBe(maxAlpha);

      // Fade-out (progress 0.90): alpha decreasing
      const fading = atmosphere.computeAlphaFromProgress(0.9, maxAlpha);
      expect(fading).toBeLessThan(maxAlpha);
      expect(fading).toBeGreaterThan(0);

      // End (progress 1.0): alpha reaches 0
      const atEnd = atmosphere.computeAlphaFromProgress(1.0, maxAlpha);
      expect(atEnd).toBe(0);
    });

    it('renders dimming and vignette to canvas without throwing', () => {
      const fillRectMock = vi.fn();
      const createRadialGradientMock = vi.fn(() => ({
        addColorStop: vi.fn(),
      }));

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillStyle: '',
        fillRect: fillRectMock,
        createRadialGradient: createRadialGradientMock,
      } as unknown as CanvasRenderingContext2D;

      atmosphere.renderBehind(mockCtx, 512, 288, true, 'dark', 0.4);

      // Should fill rect for full screen atmosphere tint and defocus vignette
      expect(mockCtx.save).toHaveBeenCalled();
      expect(fillRectMock).toHaveBeenCalledTimes(2);
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('smoothly fades out when animation stops', () => {
      // Warm up atmosphere
      atmosphere.update(true, 'fire', 0.5);
      const activeAlpha = atmosphere.getCurrentAlpha();
      expect(activeAlpha).toBeGreaterThan(0);

      // Stop animation
      atmosphere.update(false, 'fire', 0);
      const stoppingAlpha = atmosphere.getCurrentAlpha();
      expect(stoppingAlpha).toBeLessThan(activeAlpha);
    });
  });

  describe('BattleCameraManager (3D Vector Dynamics & Shake Engine)', () => {
    let camera: BattleCameraManager;

    beforeEach(() => {
      camera = new BattleCameraManager();
      camera.reset();
    });

    it('provides subtle steadicam breathing sway when idle', () => {
      const t1 = camera.getTransform(100, false, 0, 0, false);
      const t2 = camera.getTransform(200, false, 0, 0, false);

      // Scale should be hovering very close to 1.0 with subtle organic breathing (+/- 0.3%)
      expect(t1.scale).toBeCloseTo(1.0, 2);
      expect(t2.scale).toBeCloseTo(1.0, 2);

      // Pan should have subtle non-zero sway
      expect(t1.panX).not.toBe(0);
      expect(t1.panY).not.toBe(0);
    });

    it('tracks attacker and defender dynamically during move animation', () => {
      const userCenter = { x: 130, y: 220 }; // Player Pokémon center
      const targetCenter = { x: 380, y: 115 }; // Enemy Pokémon center

      // Phase 1 (progress 0.15): Zoomed towards attacker
      const p1 = camera.getTransform(0, false, 0, 0, true, 0.15, userCenter, targetCenter);
      expect(p1.scale).toBeGreaterThan(1.0);
      // Attacker is to the left (x: 130 < 256), so panX should be negative
      expect(p1.panX).toBeLessThan(0);

      // Phase 2 (progress 0.50): Impact tracking towards target
      // Target is to the right (x: 380 > 256), so panX should shift towards positive
      const p2 = camera.getTransform(0, false, 0, 0, true, 0.5, userCenter, targetCenter);
      expect(p2.panX).toBeGreaterThan(p1.panX);
    });

    it('triggers and damps impact screen shake', () => {
      camera.triggerImpactShake(8, 'horizontal');

      const shake1 = camera.getTransform(0, false, 0, 0, false);
      expect(Math.abs(shake1.shakeX)).toBeGreaterThan(0);

      // After multiple ticks, shake should damp towards zero
      for (let i = 0; i < 15; i++) {
        camera.getTransform(0, false, 0, 0, false);
      }

      const shakeEnded = camera.getTransform(0, false, 0, 0, false);
      expect(shakeEnded.shakeX).toBe(0);
      expect(shakeEnded.shakeY).toBe(0);
    });

    it('preserves intro zoom and capture zoom seamlessly', () => {
      // Intro zoom start
      const intro = camera.getTransform(0, true, 0.2, 0, false);
      expect(intro.scale).toBeCloseTo(1.1, 1);
      expect(intro.panX).toBeLessThan(0);

      // Capture zoom
      const capture = camera.getTransform(0, false, 0, 0.8, false);
      expect(capture.scale).toBeGreaterThan(1.0);
      expect(capture.panX).toBeLessThan(0);
    });
  });

  describe('BattleAnimationPlayer Integration', () => {
    it('provides accurate progress and active move information', () => {
      expect(battleAnimationPlayer.getProgress()).toBe(0);
      expect(battleAnimationPlayer.getActiveMoveType()).toBeUndefined();
      expect(battleAnimationPlayer.getActiveUserSide()).toBeUndefined();
    });
  });
});
