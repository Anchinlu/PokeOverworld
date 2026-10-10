import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { BATTLE_ASSETS } from '../src/assets';
import {
  BattleRenderer,
  WEATHER_THEMES,
} from '../src/battle/battle-renderer';
import { BattleState } from '../src/battle/battle-state';
import { BattleEngine } from '../src/battle/battle-engine';
import { createBattler } from '../src/battle/battle-factory';
import { getBattleEnvironment } from '../src/battle';
import type { BattleAssets } from '../src/battle/battle-assets';

class MockImage {
  public src: string = '';
  public complete: boolean = true;
  public naturalWidth: number = 50;
  public naturalHeight: number = 50;
  public width: number = 50;
  public height: number = 50;
}

const originalImage = globalThis.Image;
const originalDoc = globalThis.document;

beforeAll(() => {
  if (typeof globalThis.Image === 'undefined') {
    (globalThis as any).Image = MockImage;
  }
  if (typeof globalThis.document === 'undefined') {
    (globalThis as any).document = {
      createElement: (tag: string) => {
        if (tag === 'canvas') {
          return {
            getContext: () => ({
              clearRect: vi.fn(),
              drawImage: vi.fn(),
              fillRect: vi.fn(),
            }),
            width: 100,
            height: 100,
          };
        }
        return {};
      },
    };
  }
});

afterAll(() => {
  globalThis.Image = originalImage;
  globalThis.document = originalDoc;
});

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    rect: vi.fn(),
    roundRect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 50 })),
    drawImage: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;
}

function createDummyAssets(): BattleAssets {
  const dummyImg = () => {
    const img = new MockImage();
    return img as unknown as HTMLImageElement;
  };

  return {
    bg: dummyImg(),
    enemyBase: dummyImg(),
    playerBase: dummyImg(),
    enemySprite: dummyImg(),
    playerSprite: dummyImg(),
    databoxEnemy: dummyImg(),
    databoxPlayer: dummyImg(),
    abilityBar: dummyImg(),
    messageBox: dummyImg(),
    statusIcons: dummyImg(),
    fightButtons: dummyImg(),
    categoryIcon: dummyImg(),
    commandButtons: dummyImg(),
    cursorCommand: dummyImg(),
    overlayExp: dummyImg(),
    ball: dummyImg(),
    ballOpen: dummyImg(),
    thrownBall: dummyImg(),
    thrownBallOpen: dummyImg(),
    thrownBallClosed: dummyImg(),
    ballBurstRay: dummyImg(),
    ballBurstParticle: dummyImg(),
    ballBurstRing: dummyImg(),
    shinyIcon: dummyImg(),
  };
}

describe('Weather HUD Indicator (Top Center Battle Screen)', () => {
  describe('BATTLE_ASSETS.getWeatherIcon()', () => {
    it('maps all standard and special battle weather types to authentic Graphics/weather icons', () => {
      expect(BATTLE_ASSETS.getWeatherIcon('sun')).toContain('SongSun.png');
      expect(BATTLE_ASSETS.getWeatherIcon('sunny')).toContain('SongSun.png');
      expect(BATTLE_ASSETS.getWeatherIcon('rain')).toContain('SongRain.png');
      expect(BATTLE_ASSETS.getWeatherIcon('heavy_rain')).toContain('SongHeavyRain.png');
      expect(BATTLE_ASSETS.getWeatherIcon('storm')).toContain('SongStorm.png');
      expect(BATTLE_ASSETS.getWeatherIcon('sandstorm')).toContain('SongSandstorm.png');
      expect(BATTLE_ASSETS.getWeatherIcon('hail')).toContain('SongBlizzard.png');
      expect(BATTLE_ASSETS.getWeatherIcon('blizzard')).toContain('SongBlizzard.png');
      expect(BATTLE_ASSETS.getWeatherIcon('snow')).toContain('SongSnow.png');
      expect(BATTLE_ASSETS.getWeatherIcon('fog')).toContain('SongFog.png');
      expect(BATTLE_ASSETS.getWeatherIcon('clear')).toContain('SongClearing.png');
      expect(BATTLE_ASSETS.getWeatherIcon('clearing')).toContain('SongClearing.png');
    });
  });

  describe('WEATHER_THEMES Configuration', () => {
    it('provides localized Vietnamese labels and styling tokens for each weather', () => {
      expect(WEATHER_THEMES.sun.labelVi).toBe('NẮNG');
      expect(WEATHER_THEMES.rain.labelVi).toBe('MƯA');
      expect(WEATHER_THEMES.heavy_rain.labelVi).toBe('MƯA LỚN');
      expect(WEATHER_THEMES.storm.labelVi).toBe('BÃO SẤM');
      expect(WEATHER_THEMES.sandstorm.labelVi).toBe('BÃO CÁT');
      expect(WEATHER_THEMES.hail.labelVi).toBe('MƯA ĐÁ');
      expect(WEATHER_THEMES.snow.labelVi).toBe('TUYẾT');
      expect(WEATHER_THEMES.fog.labelVi).toBe('SƯƠNG MÙ');

      for (const [key, theme] of Object.entries(WEATHER_THEMES)) {
        expect(theme.labelVi.length, `Label for ${key}`).toBeGreaterThan(0);
        expect(theme.badgeBorder).toMatch(/^#/);
        expect(theme.badgeGlow).toMatch(/^rgba/);
        expect(theme.textColor).toMatch(/^#/);
        expect(theme.bgGradient).toHaveLength(2);
      }
    });
  });

  describe('BattleRenderer.drawWeatherIndicator()', () => {
    it('does NOT render when weather is none or undefined', () => {
      const ctx = createMockContext();
      const assets = createDummyAssets();
      const env = getBattleEnvironment('meadow');
      env.weather = undefined;

      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, env);
      const renderer = new BattleRenderer(ctx, assets, engine);

      const state = new BattleState();
      state.enemyDataboxProgress = 1.0;

      renderer.drawWeatherIndicator(ctx, state);
      expect(ctx.fillText).not.toHaveBeenCalled();

      // Test with weather.type = 'none'
      engine.environment.weather = { type: 'none', turnsLeft: 0 };
      renderer.drawWeatherIndicator(ctx, state);
      expect(ctx.fillText).not.toHaveBeenCalled();
    });

    it('does NOT render during early intro shutter before databoxes slide in', () => {
      const ctx = createMockContext();
      const assets = createDummyAssets();
      const env = getBattleEnvironment('meadow');
      env.weather = { type: 'sun', turnsLeft: 5 };

      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, env);
      const renderer = new BattleRenderer(ctx, assets, engine);

      const state = new BattleState();
      state.enemyDataboxProgress = 0; // Databoxes haven't appeared

      renderer.drawWeatherIndicator(ctx, state);
      expect(ctx.fillText).not.toHaveBeenCalled();
    });

    it('renders capsule badge centered at top of screen with icon and turn count when weather is active', () => {
      const ctx = createMockContext();
      const assets = createDummyAssets();
      const env = getBattleEnvironment('meadow');
      env.weather = { type: 'sun', turnsLeft: 5 };

      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, env);
      const renderer = new BattleRenderer(ctx, assets, engine);

      const state = new BattleState();
      state.enemyDataboxProgress = 1.0;

      renderer.drawWeatherIndicator(ctx, state);

      // Verify pill dimensions: centered at CANVAS_W/2 = 256 (width 98, so bx = 207)
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.roundRect).toHaveBeenCalledWith(207, 6, 98, 28, 14);

      // Verify text rendered: weather name & turn count
      const textCalls = (ctx.fillText as any).mock.calls.map((call: any[]) => call[0]);
      expect(textCalls).toContain('NẮNG');
      expect(textCalls).toContain('5 LƯỢT');
    });

    it('handles warning alert pulse when weather has 1 turn left', () => {
      const ctx = createMockContext();
      const assets = createDummyAssets();
      const env = getBattleEnvironment('meadow');
      env.weather = { type: 'rain', turnsLeft: 1 };

      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, env);
      const renderer = new BattleRenderer(ctx, assets, engine);

      const state = new BattleState();
      state.enemyDataboxProgress = 1.0;
      state.tick = 10;

      renderer.drawWeatherIndicator(ctx, state);

      const textCalls = (ctx.fillText as any).mock.calls.map((call: any[]) => call[0]);
      expect(textCalls).toContain('MƯA');
      expect(textCalls).toContain('1 LƯỢT');
    });

    it('renders correctly for sandstorm, hail, and snow without throwing', () => {
      const weathers: Array<{ type: any; label: string }> = [
        { type: 'sandstorm', label: 'BÃO CÁT' },
        { type: 'hail', label: 'MƯA ĐÁ' },
        { type: 'snow', label: 'TUYẾT' },
        { type: 'heavy_rain', label: 'MƯA LỚN' },
        { type: 'storm', label: 'BÃO SẤM' },
        { type: 'fog', label: 'SƯƠNG MÙ' },
      ];

      for (const w of weathers) {
        const ctx = createMockContext();
        const assets = createDummyAssets();
        const env = getBattleEnvironment('meadow');
        env.weather = { type: w.type, turnsLeft: 4 };

        const player = createBattler('PIKACHU', 50, true);
        const enemy = createBattler('SNORLAX', 50, false);
        const engine = new BattleEngine(player, enemy, env);
        const renderer = new BattleRenderer(ctx, assets, engine);

        const state = new BattleState();
        state.enemyDataboxProgress = 1.0;

        expect(() => renderer.drawWeatherIndicator(ctx, state)).not.toThrow();
        const textCalls = (ctx.fillText as any).mock.calls.map((call: any[]) => call[0]);
        expect(textCalls).toContain(w.label);
        expect(textCalls).toContain('4 LƯỢT');
      }
    });

    it('caches weather icon images cleanly in getWeatherIconImage', () => {
      const ctx = createMockContext();
      const assets = createDummyAssets();
      const env = getBattleEnvironment('meadow');
      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, env);
      const renderer = new BattleRenderer(ctx, assets, engine);

      const img1 = renderer.getWeatherIconImage('sun');
      const img2 = renderer.getWeatherIconImage('sun');
      expect(img1).toBe(img2);
      expect(img1.src).toContain('SongSun.png');

      const imgRain = renderer.getWeatherIconImage('rain');
      expect(imgRain.src).toContain('SongRain.png');
      expect(imgRain).not.toBe(img1);
    });
  });
});
