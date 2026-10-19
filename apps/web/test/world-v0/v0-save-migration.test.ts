import { describe, it, expect, beforeEach } from 'vitest';
import { GameSession } from '../../src/game/game-session';
import { SaveGameRepository } from '../../src/domain/save/save-repository';
import type { StorageAdapter } from '../../src/domain/save/storage-adapter';

class MockMemoryStorageAdapter implements StorageAdapter {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

describe('World Gen v0 - S7 Save Migration & Version Flag Parity', () => {
  let adapter: MockMemoryStorageAdapter;
  let repo: SaveGameRepository;

  beforeEach(() => {
    adapter = new MockMemoryStorageAdapter();
    repo = new SaveGameRepository({ adapter });
  });

  it('new game creation defaults to worldGenVersion = 2 and startTown', () => {
    const session = new GameSession(101);
    expect(session.field.version).toBe(2);

    const saveResult = repo.save('slot_1', {
      saveMain: true,
      savePc: false,
      worldData: {
        seed: session.seed,
        worldGenVersion: session.field.version,
        position: { gx: session.player.gx, gy: session.player.gy, direction: session.player.direction },
        startTown: {
          name: 'Twinleaf Hamlet',
          gx: 0,
          gy: 0,
          tier: 0,
        },
      },
    });

    expect(saveResult.success).toBe(true);
    expect(saveResult.world?.worldGenVersion).toBe(2);
    expect(saveResult.world?.startTown?.name).toBe('Twinleaf Hamlet');
    expect(repo.getSavedWorldGenVersion('slot_1')).toBe(2);
  });

  it('legacy save with worldGenVersion = 1 opens with LegacyStripField', () => {
    // Simulate an existing save from previous version
    const legacySave = {
      metadata: {
        version: 3,
        savedAt: 1600000000,
        slotId: 'slot_1',
        playerName: 'Ash',
        money: 500,
        badgesCount: 0,
        partyCount: 1,
        pcCount: 0,
        leaderName: 'Pikachu',
        leaderLevel: 5,
        playTimeSeconds: 100,
      },
      player: {
        name: 'Ash',
        money: 500,
        badges: [],
        playTimeSeconds: 100,
        position: { gx: 10, gy: 20, direction: 0 },
        inventory: {},
      },
      party: [],
      inventory: {},
      world: {
        seed: 101,
        worldGenVersion: 1,
        position: { gx: 10, gy: 20, direction: 0 },
      },
    };

    adapter.setItem('pokemon_savegame_slot_1', JSON.stringify(legacySave));

    const loaded = repo.load('slot_1');
    expect(loaded).not.toBeNull();
    expect(loaded?.world?.worldGenVersion).toBe(1);
    expect(repo.getSavedWorldGenVersion('slot_1')).toBe(1);

    // Initialize session with loaded version
    const session = new GameSession(loaded!.world!.seed!, loaded!.world!.worldGenVersion!);
    expect(session.field.version).toBe(1);
  });

  it('GameSession.regenerate seamlessly reconfigures chunk manager and field', () => {
    const session = new GameSession(101, 1);
    expect(session.field.version).toBe(1);

    session.regenerate(202, 2);
    expect(session.seed).toBe(202);
    expect(session.field.version).toBe(2);
    expect(session.chunkManager.field.version).toBe(2);
  });
});
