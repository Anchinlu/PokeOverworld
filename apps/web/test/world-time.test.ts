import { describe, it, expect, vi } from 'vitest';
import { WorldClock } from '../src/core/world-clock';
import { getDayPhase, isDaytime, isNighttime } from '../src/world/day-phase';
import { getAmbientLightProfile } from '../src/world/ambient-light';
import { AmbientOverlayRenderer } from '../src/rendering/ambient-overlay-renderer';
import { GameSession } from '../src/game/game-session';
import { autosaveCoordinator } from '../src/domain/save/autosave-coordinator';
import { updateWorldTimeWidget } from '../src/ui/game-overlay';

describe('World Clock System (Giai đoạn 1)', () => {
  it('initializes with default config (08:00 Day 1, not paused)', () => {
    const clock = new WorldClock();
    const state = clock.getState();

    expect(state.minutes).toBe(480);
    expect(state.day).toBe(1);
    expect(state.isPaused).toBe(false);
    expect(clock.formatTime()).toBe('08:00');
  });

  it('initializes with custom initial minutes and day', () => {
    const clock = new WorldClock(1140, 3);
    expect(clock.getMinutes()).toBe(1140);
    expect(clock.getDay()).toBe(3);
    expect(clock.formatTime()).toBe('19:00');
  });

  it('normalizes overflow initial minutes into correct day increments', () => {
    const clock = new WorldClock(1500, 1);
    expect(clock.getMinutes()).toBe(60); // 1500 - 1440 = 60
    expect(clock.getDay()).toBe(2);
  });

  it('advances time deterministically by dtMs (1s real = 1min game)', () => {
    const clock = new WorldClock(480, 1);

    // 1000ms = 1 real second -> +1 game minute
    clock.advance(1000);
    expect(clock.getMinutes()).toBe(481);
    expect(clock.formatTime()).toBe('08:01');

    // 30,000ms = 30 real seconds -> +30 game minutes
    clock.advance(30000);
    expect(clock.getMinutes()).toBe(511);
    expect(clock.formatTime()).toBe('08:31');
  });

  it('wraps minutes from 1439 -> 0 and increments day correctly', () => {
    const clock = new WorldClock(1439, 1);
    expect(clock.getMinutes()).toBe(1439);
    expect(clock.getDay()).toBe(1);
    expect(clock.formatTime()).toBe('23:59');

    // Advance 1 game minute (1000ms real)
    clock.advance(1000);
    expect(clock.getMinutes()).toBe(0);
    expect(clock.getDay()).toBe(2);
    expect(clock.formatTime()).toBe('00:00');
  });

  it('handles multi-day advances without skipping or drifting', () => {
    const clock = new WorldClock(0, 1);
    // 24 real minutes = 24 * 60 * 1000 ms = 1,440,000 ms = 1 full game day
    clock.advance(1440000 * 3);
    expect(clock.getMinutes()).toBe(0);
    expect(clock.getDay()).toBe(4);
  });

  it('does NOT advance time when paused', () => {
    const clock = new WorldClock(480, 1);
    clock.pause('battle');
    expect(clock.isPaused()).toBe(true);

    clock.advance(5000);
    expect(clock.getMinutes()).toBe(480);
    expect(clock.getDay()).toBe(1);

    clock.resume('battle');
    expect(clock.isPaused()).toBe(false);

    clock.advance(5000);
    expect(clock.getMinutes()).toBe(485);
  });

  it('handles multiple pause reasons independently (pause stack)', () => {
    const clock = new WorldClock(480, 1);

    clock.pause('battle');
    clock.pause('world_map');
    expect(clock.isPaused()).toBe(true);
    expect(clock.getPausedReasons()).toEqual(['battle', 'world_map']);

    // Resuming one reason keeps clock paused if other reasons remain
    clock.resume('battle');
    expect(clock.isPaused()).toBe(true);
    clock.advance(2000);
    expect(clock.getMinutes()).toBe(480);

    // Resuming last reason resumes progression
    clock.resume('world_map');
    expect(clock.isPaused()).toBe(false);
    clock.advance(2000);
    expect(clock.getMinutes()).toBe(482);
  });

  it('allows manual time adjustment via setMinutes and setDay (for save/load)', () => {
    const clock = new WorldClock(480, 1);
    clock.setMinutes(360);
    clock.setDay(5);
    expect(clock.getMinutes()).toBe(360);
    expect(clock.getDay()).toBe(5);
    expect(clock.formatTime()).toBe('06:00');
  });

  it('supports speed multiplier for fast forwarding (e.g. 5x, 60x)', () => {
    const clock = new WorldClock(480, 1);
    clock.setSpeedMultiplier(5);
    expect(clock.getSpeedMultiplier()).toBe(5);

    // 1000ms real = 1 game min * 5 = +5 game minutes
    clock.advance(1000);
    expect(clock.getMinutes()).toBe(485);

    // 60x multiplier: 1s real = 1 game hour (60 min)
    clock.setSpeedMultiplier(60);
    clock.advance(1000);
    expect(clock.getMinutes()).toBe(545);
  });
});

describe('Day Phase Resolver (Giai đoạn 2)', () => {
  it('correctly categorizes all phase bounds: dawn, day, dusk, night', () => {
    // Dawn: 05:00 - 07:00 (300..419 min)
    expect(getDayPhase(300)).toBe('dawn'); // 05:00
    expect(getDayPhase(360)).toBe('dawn'); // 06:00
    expect(getDayPhase(419)).toBe('dawn'); // 06:59

    // Day: 07:00 - 17:00 (420..1019 min)
    expect(getDayPhase(420)).toBe('day'); // 07:00
    expect(getDayPhase(720)).toBe('day'); // 12:00
    expect(getDayPhase(1019)).toBe('day'); // 16:59

    // Dusk: 17:00 - 19:00 (1020..1139 min)
    expect(getDayPhase(1020)).toBe('dusk'); // 17:00
    expect(getDayPhase(1080)).toBe('dusk'); // 18:00
    expect(getDayPhase(1139)).toBe('dusk'); // 18:59

    // Night: 19:00 - 05:00 (1140..1439 min, 0..299 min)
    expect(getDayPhase(1140)).toBe('night'); // 19:00
    expect(getDayPhase(1300)).toBe('night'); // 21:40
    expect(getDayPhase(1439)).toBe('night'); // 23:59
    expect(getDayPhase(0)).toBe('night'); // 00:00
    expect(getDayPhase(180)).toBe('night'); // 03:00
    expect(getDayPhase(299)).toBe('night'); // 04:59
  });

  it('evaluates isDaytime and isNighttime predicates correctly', () => {
    expect(isDaytime(720)).toBe(true);
    expect(isDaytime(360)).toBe(true); // Dawn counts towards daytime light
    expect(isDaytime(1200)).toBe(false);

    expect(isNighttime(0)).toBe(true);
    expect(isNighttime(1200)).toBe(true);
    expect(isNighttime(720)).toBe(false);
  });
});

describe('Ambient Light & Interpolation Profile (Giai đoạn 2)', () => {
  it('returns pure clear profile during midday', () => {
    const profile = getAmbientLightProfile(720); // 12:00
    expect(profile.alpha).toBe(0.0);
    expect(profile.blendMode).toBe('source-over');
  });

  it('returns deep blue night profile at midnight', () => {
    const profile = getAmbientLightProfile(0); // 00:00
    expect(profile.alpha).toBeCloseTo(0.38, 2);
    expect(profile.color).toContain('24, 35, 90');
  });

  it('returns warm peach dawn profile near 06:00', () => {
    const profile = getAmbientLightProfile(360); // 06:00
    expect(profile.alpha).toBeGreaterThan(0.08);
    expect(profile.alpha).toBeLessThanOrEqual(0.16);
    expect(profile.color).toContain('255, 150, 105');
  });

  it('returns moody purple dusk profile near 18:00', () => {
    const profile = getAmbientLightProfile(1080); // 18:00
    expect(profile.alpha).toBeGreaterThan(0.1);
    expect(profile.alpha).toBeLessThanOrEqual(0.2);
    expect(profile.color).toContain('170, 90, 190');
  });

  it('guarantees alpha is strictly bounded within [0, 1] across all 1440 minutes', () => {
    for (let m = 0; m < 1440; m++) {
      const profile = getAmbientLightProfile(m);
      expect(profile.alpha).toBeGreaterThanOrEqual(0.0);
      expect(profile.alpha).toBeLessThanOrEqual(1.0);
    }
  });

  it('is completely deterministic (same minute produces identical profile)', () => {
    const p1 = getAmbientLightProfile(555.5);
    const p2 = getAmbientLightProfile(555.5);
    expect(p1.alpha).toBe(p2.alpha);
    expect(p1.color).toBe(p2.color);
    expect(p1.blendMode).toBe(p2.blendMode);
  });
});

describe('Ambient Overlay Renderer (Giai đoạn 2)', () => {
  it('skips rendering when alpha <= 0.001 (e.g. daytime)', () => {
    const renderer = new AmbientOverlayRenderer();
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D;

    renderer.render(ctx, 800, 600, {
      color: 'rgba(255, 255, 255, 0)',
      alpha: 0.0,
      blendMode: 'source-over',
    });

    expect(ctx.fillRect).not.toHaveBeenCalled();
    expect(ctx.save).not.toHaveBeenCalled();
  });

  it('renders a single full-screen overlay when alpha > 0.001', () => {
    const renderer = new AmbientOverlayRenderer();
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D;

    renderer.render(ctx, 1024, 768, {
      color: 'rgba(24, 35, 90, 0.38)',
      alpha: 0.38,
      blendMode: 'source-over',
    });

    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 1024, 768);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });
});

describe('GameSession & Lifecycle Integration', () => {
  it('initializes GameSession with WorldClock and provides ambient light helpers', () => {
    const session = new GameSession(101, 2, { initialMinutes: 360, initialDay: 2 });
    expect(session.worldClock.getMinutes()).toBe(360);
    expect(session.worldClock.getDay()).toBe(2);
    expect(session.getDayPhase()).toBe('dawn');

    const light = session.getAmbientLight();
    expect(light.alpha).toBeGreaterThan(0);
  });

  it('advances world clock during session update when not battling', () => {
    const session = new GameSession(101, 2, { initialMinutes: 480, initialDay: 1 });
    // Update by 60 frames (1 second real time at 60fps)
    session.update(60.0, false);
    expect(session.worldClock.getMinutes()).toBe(481);
  });

  it('pauses world clock progression when isBattling is true', () => {
    const session = new GameSession(101, 2, { initialMinutes: 480, initialDay: 1 });
    session.isBattling = true;

    session.update(60.0, false);
    expect(session.worldClock.isPaused()).toBe(true);
    expect(session.worldClock.getMinutes()).toBe(480);
  });

  it('serializes world time into autosave world data provider', () => {
    const session = new GameSession(101, 2, { initialMinutes: 1080, initialDay: 4 });
    const provider = (autosaveCoordinator as unknown as { worldDataProvider?: () => Record<string, unknown> })
      .worldDataProvider;

    expect(provider).toBeDefined();
    if (provider) {
      const data = provider();
      expect(data.worldTimeMinutes).toBe(1080);
      expect(data.worldDay).toBe(4);
      expect(typeof data.lastWorldTimestamp).toBe('number');
    }
  });
});

describe('World Time HUD Widget UI', () => {
  it('updates DOM elements in on-screen widget accurately', () => {
    const elements: Record<string, { innerText: string; querySelector?: (sel: string) => unknown }> = {
      '#worldTimeWidget': {
        innerText: '',
        querySelector: (sel: string) => elements[sel] ?? null,
      },
      '#worldTimeIcon': { innerText: '☀️' },
      '#worldTimeText': { innerText: '08:00' },
      '#worldTimePhase': { innerText: 'Ban ngày' },
      '#worldTimeDay': { innerText: 'Ngày 1' },
    };

    const prevDoc = (globalThis as unknown as { document?: unknown }).document;
    (globalThis as unknown as { document: { querySelector: (sel: string) => unknown } }).document = {
      querySelector: (sel: string) => elements[sel] ?? null,
    };

    try {
      updateWorldTimeWidget(360, 'dawn', 2, false);
      expect(elements['#worldTimeIcon'].innerText).toBe('🌅');
      expect(elements['#worldTimeText'].innerText).toBe('06:00');
      expect(elements['#worldTimePhase'].innerText).toBe('Bình minh');
      expect(elements['#worldTimeDay'].innerText).toBe('Ngày 2');

      updateWorldTimeWidget(0, 'night', 3, true);
      expect(elements['#worldTimeIcon'].innerText).toBe('🌙');
      expect(elements['#worldTimeText'].innerText).toBe('00:00');
      expect(elements['#worldTimePhase'].innerText).toContain('Ban đêm (⏸️)');
      expect(elements['#worldTimeDay'].innerText).toBe('Ngày 3');
    } finally {
      if (prevDoc === undefined) {
        delete (globalThis as unknown as { document?: unknown }).document;
      } else {
        (globalThis as unknown as { document?: unknown }).document = prevDoc;
      }
    }
  });
});
