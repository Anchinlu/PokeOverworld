import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OverworldShinyAudio } from '../src/audio/overworld-shiny-audio';
import type { WorldChunk } from '../src/maps/chunk';

describe('Overworld Shiny Spatial Audio', () => {
  let playMock: ReturnType<typeof vi.fn>;
  let pauseMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    playMock = vi.fn().mockResolvedValue(undefined);
    pauseMock = vi.fn();

    // Stub window and Audio constructor
    vi.stubGlobal('window', { location: { href: 'http://localhost/' } });

    class MockAudio {
      play = playMock;
      pause = pauseMock;
      volume = 1;
      loop = false;
      currentTime = 0;
    }
    vi.stubGlobal('Audio', MockAudio);
  });

  function createMockChunk(cx: number, cy: number, wildPokemon: any[] = []): WorldChunk {
    return {
      cx,
      cy,
      wildPokemon,
    } as unknown as WorldChunk;
  }

  it('plays audio when a shiny pokemon is within 3x3 chunks (dx<=1, dy<=1)', () => {
    const audio = OverworldShinyAudio.getInstance();
    const shiny = {
      speciesKey: 'PIKACHU',
      gx: 20,
      gy: 20,
      isShiny: true,
    };
    const chunk = createMockChunk(1, 1, [shiny]);

    // Player at (18, 18) -> playerChunk (1, 1) -> distance is small (~2.83 tiles)
    for (let i = 0; i < 15; i++) {
      audio.update(18, 18, 1, 1, [chunk], false);
    }

    expect(audio.isAudioPlaying()).toBe(true);
    expect(audio.getCurrentVolume()).toBeGreaterThan(0.5);
  });

  it('stops audio immediately when player is in battle', () => {
    const audio = OverworldShinyAudio.getInstance();
    const shiny = {
      speciesKey: 'CHARIZARD',
      gx: 20,
      gy: 20,
      chunkCx: 1,
      chunkCy: 1,
      isShiny: true,
    };
    const chunk = createMockChunk(1, 1, [shiny]);

    audio.update(20, 20, 1, 1, [chunk], true); // isBattling = true
    expect(audio.isAudioPlaying()).toBe(false);
  });

  it('stops audio when shiny pokemon is farther than 3x3 chunk range (cx diff > 1 or cy diff > 1)', () => {
    const audio = OverworldShinyAudio.getInstance();
    const shiny = {
      speciesKey: 'GENGAR',
      gx: 60, // chunk cx = 3
      gy: 60, // chunk cy = 3
      chunkCx: 3,
      chunkCy: 3,
      isShiny: true,
    };
    const chunk = createMockChunk(3, 3, [shiny]);

    // Player at chunk cx = 0, cy = 0 -> cdx = 3 > 1 (outside 3x3 range)
    audio.update(5, 5, 0, 0, [chunk], false);
    expect(audio.isAudioPlaying()).toBe(false);
  });

  it('adjusts volume proportionally: closer pokemon is louder than distant pokemon', () => {
    const audio = OverworldShinyAudio.getInstance();
    const shiny = {
      speciesKey: 'EEVEE',
      gx: 20,
      gy: 20,
      chunkCx: 1,
      chunkCy: 1,
      isShiny: true,
    };
    const chunk = createMockChunk(1, 1, [shiny]);

    // Very close: player at (20, 21)
    audio.stop();
    for (let i = 0; i < 15; i++) {
      audio.update(20, 21, 1, 1, [chunk], false);
    }
    const closeVolume = audio.getCurrentVolume();

    // Farther away: player at (32, 32)
    audio.stop();
    for (let i = 0; i < 15; i++) {
      audio.update(32, 32, 1, 1, [chunk], false);
    }
    const distantVolume = audio.getCurrentVolume();

    expect(closeVolume).toBeGreaterThan(distantVolume);
  });
});
