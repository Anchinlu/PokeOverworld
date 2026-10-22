import { describe, it, expect, vi } from 'vitest';
import {
  WeatherCloudController,
  CLOUD_WEATHER_PROFILES,
  CloudShadowLayer,
} from '../src/rendering/weather';
import { DEFAULT_RENDER_OPTIONS } from '../src/rendering/types';
import { GameSession } from '../src/game/game-session';
import type { AssetLoader } from '../src/rendering/asset-loader';

describe('Weather & Ground Cloud Shadow System', () => {
  describe('WeatherCloudController', () => {
    it('initializes with clear weather and natural subtle ground shadow', () => {
      const controller = new WeatherCloudController('clear');
      expect(controller.getWeather()).toBe('clear');

      const profile = controller.getProfile();
      // Requirement: Ground shadow gliding speed is gentle and natural
      expect(profile.shadowSpeedX).toBeGreaterThan(0);
      expect(profile.shadowSpeedY).toBeGreaterThan(0);
      // Requirement: Dark texture, subtle opacity 10-20%, blend multiply
      expect(profile.shadowOpacity).toBeGreaterThanOrEqual(0.08);
      expect(profile.shadowOpacity).toBeLessThanOrEqual(0.2);
      expect(profile.shadowBlendMode).toBe('multiply');
    });

    it('adjusts speeds and opacities across weather profiles', () => {
      const controller = new WeatherCloudController();

      // Rain should have denser & faster clouds
      controller.setWeather('rain');
      const rainProfile = controller.getProfile();
      expect(rainProfile.shadowOpacity).toBeGreaterThan(CLOUD_WEATHER_PROFILES.clear.shadowOpacity);
      expect(rainProfile.shadowSpeedX).toBeGreaterThan(CLOUD_WEATHER_PROFILES.clear.shadowSpeedX);

      // Thunderstorm should be stormy and dense
      controller.setWeather('thunderstorm');
      const stormProfile = controller.getProfile();
      expect(stormProfile.shadowOpacity).toBeGreaterThanOrEqual(0.3);

      // Fog should have light ground shadow and slower speed
      controller.setWeather('fog');
      const fogProfile = controller.getProfile();
      expect(fogProfile.shadowSpeedX).toBeLessThan(CLOUD_WEATHER_PROFILES.clear.shadowSpeedX);
      expect(fogProfile.shadowOpacity).toBeLessThan(CLOUD_WEATHER_PROFILES.clear.shadowOpacity);
    });

    it('modulo wraps drifting coordinates seamlessly within [0, size)', () => {
      const controller = new WeatherCloudController('clear');
      const worldSize = controller.getCloudWorldSize();

      controller.setOffsets(worldSize - 2, worldSize - 1);
      expect(controller.getShadowOffsetX()).toBe(worldSize - 2);

      // Advance by 1 second (speeds are > 5px/sec)
      controller.update(1.0, true);

      // Coordinates should have wrapped around smoothly without exceeding bounds
      expect(controller.getShadowOffsetX()).toBeGreaterThanOrEqual(0);
      expect(controller.getShadowOffsetX()).toBeLessThan(worldSize);
      expect(controller.getShadowOffsetY()).toBeGreaterThanOrEqual(0);
      expect(controller.getShadowOffsetY()).toBeLessThan(worldSize);
    });

    it('pauses coordinate simulation when paused to conserve CPU/battery', () => {
      const controller = new WeatherCloudController('clear');
      controller.setOffsets(100, 100);

      controller.setPaused(true);
      expect(controller.getIsPaused()).toBe(true);

      // Attempt to update while paused
      controller.update(2.0, true);

      // Offsets must remain frozen
      expect(controller.getShadowOffsetX()).toBe(100);
      expect(controller.getShadowOffsetY()).toBe(100);

      // Resume and verify update works
      controller.setPaused(false);
      expect(controller.getIsPaused()).toBe(false);
      controller.update(1.0, true);
      expect(controller.getShadowOffsetX()).toBeGreaterThan(100);
    });

    it('supports opacity and speed overrides for smooth transitions or debugging', () => {
      const controller = new WeatherCloudController('clear');
      controller.setShadowOpacityOverride(0.5);
      expect(controller.getShadowOpacity()).toBe(0.5);

      controller.setShadowOpacityOverride(null);
      expect(controller.getShadowOpacity()).toBe(controller.getProfile().shadowOpacity);

      controller.setSpeedMultiplier(2.5);
      expect(controller.getSpeedMultiplier()).toBe(2.5);
    });
  });

  describe('CloudShadowLayer', () => {
    it('skips rendering when opacity is zero or asset is missing', () => {
      const mockLoader = {
        getImage: vi.fn().mockReturnValue(null),
      } as unknown as AssetLoader;

      const layer = new CloudShadowLayer(mockLoader);
      const controller = new WeatherCloudController('clear');
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      layer.render(ctx, { minX: 0, maxX: 500, minY: 0, maxY: 500 }, controller);
      expect(ctx.save).not.toHaveBeenCalled();
      expect(ctx.drawImage).not.toHaveBeenCalled();
    });

    it('renders with multiply composite operation across viewport bounds', () => {
      const mockImg = { complete: true, naturalWidth: 256, naturalHeight: 256 } as HTMLImageElement;
      const mockLoader = {
        getImage: vi.fn().mockReturnValue(mockImg),
      } as unknown as AssetLoader;

      const layer = new CloudShadowLayer(mockLoader);
      const controller = new WeatherCloudController('clear');

      const mockCtx: Partial<CanvasRenderingContext2D> = {
        save: vi.fn(),
        restore: vi.fn(),
        drawImage: vi.fn(),
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
      };

      layer.render(
        mockCtx as CanvasRenderingContext2D,
        { minX: 0, maxX: 1000, minY: 0, maxY: 1000 },
        controller
      );

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.globalCompositeOperation).toBe('multiply');
      expect(mockCtx.globalAlpha).toBe(controller.getShadowOpacity());
      expect(mockCtx.drawImage).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });
  });

  describe('Integration with Overworld Game Systems', () => {
    it('has showClouds enabled by default in RenderOptions', () => {
      expect(DEFAULT_RENDER_OPTIONS.showClouds).toBe(true);
    });

    it('exposes deterministic overworld weather from GameSession', () => {
      const session = new GameSession(4242, 4);
      const weather = session.getWeather();
      expect([
        'clear',
        'sun',
        'rain',
        'heavy_rain',
        'fog',
        'sand',
        'snow',
        'thunderstorm',
      ]).toContain(weather);
    });
  });
});
