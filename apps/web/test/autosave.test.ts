import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SaveGameRepository,
  type SaveStorageAdapter,
  AutosaveCoordinator,
  PartyService,
  PlayerService,
  InventoryService,
  PcStorageService,
  createDefaultParty,
  createPartyPokemon,
  createDefaultPlayerProfile,
  createDefaultInventoryState,
  CURRENT_SAVE_VERSION,
} from '../src/domain';

class MockMemoryStorageAdapter implements SaveStorageAdapter {
  public store = new Map<string, string>();
  public quotaErrorOnKeys = new Set<string>();

  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    if (this.quotaErrorOnKeys.has(key)) {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    }
    this.store.set(key, value);
  }

  public removeItem(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
    this.quotaErrorOnKeys.clear();
  }
}

describe('Autosave & Persistence System (Version 3)', () => {
  let adapter: MockMemoryStorageAdapter;
  let playerServiceInstance: PlayerService;
  let partyServiceInstance: PartyService;
  let inventoryServiceInstance: InventoryService;
  let pcStorageServiceInstance: PcStorageService;
  let repository: SaveGameRepository;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = new MockMemoryStorageAdapter();

    playerServiceInstance = new PlayerService(createDefaultPlayerProfile('Red', 'male'));
    partyServiceInstance = new PartyService(createDefaultParty());
    inventoryServiceInstance = new InventoryService(createDefaultInventoryState());
    pcStorageServiceInstance = PcStorageService.getInstance();

    repository = new SaveGameRepository({
      adapter,
      player: playerServiceInstance,
      party: partyServiceInstance,
      inventory: inventoryServiceInstance,
      pcStorage: pcStorageServiceInstance,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    adapter.clear();
  });

  describe('SaveGameRepository Partitioning & V3 Format', () => {
    it('saves lightweight main slot and updates metadata version to 3', () => {
      const saveData = repository.save('slot_1');
      expect(saveData.metadata.version).toBe(CURRENT_SAVE_VERSION);
      expect(saveData.metadata.playerName).toBe('Red');
      expect(saveData.success).toBe(true);

      const raw = adapter.getItem('pokemon_savegame_slot_1');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.metadata.version).toBe(3);
      expect(parsed.player.name).toBe('Red');
      expect(parsed.party.length).toBeGreaterThan(0);
      expect(parsed.inventory).toBeDefined();

      // PC partition is NOT saved during standard main save
      expect(adapter.getItem('pokemon_savegame_slot_1_pc')).toBeNull();
    });

    it('saves PC partition independently when requested', () => {
      const saveRes = repository.save('slot_1', { saveMain: false, savePc: true });
      expect(saveRes.success).toBe(true);
      expect(saveRes.pcSuccess).toBe(true);

      const pcRaw = adapter.getItem('pokemon_savegame_slot_1_pc');
      expect(pcRaw).not.toBeNull();
      const parsedPc = JSON.parse(pcRaw!);
      expect(parsedPc.version).toBe(CURRENT_SAVE_VERSION);
      expect(Array.isArray(parsedPc.storage.boxes)).toBe(true);
      expect(parsedPc.storage.boxes.length).toBe(24);
    });

    it('persists seed and worldGenVersion in world save payload', () => {
      repository.save('slot_1', {
        worldData: {
          seed: 4567,
          worldGenVersion: 2,
          position: { gx: 12, gy: 34, direction: 1 },
        },
      });

      const loaded = repository.load('slot_1');
      expect(loaded?.world?.seed).toBe(4567);
      expect(loaded?.world?.worldGenVersion).toBe(2);
      expect(loaded?.world?.position?.gx).toBe(12);
    });

    it('creates .bak backup and restores from .bak if main save is corrupt', () => {
      // 1. Initial valid save
      playerServiceInstance.addMoney(1000);
      repository.save('slot_1');

      // 2. Second valid save (creates .bak of initial save)
      playerServiceInstance.addMoney(2000);
      repository.save('slot_1');

      const mainRaw = adapter.getItem('pokemon_savegame_slot_1');
      const bakRaw = adapter.getItem('pokemon_savegame_slot_1.bak');
      expect(bakRaw).not.toBeNull();
      expect(JSON.parse(mainRaw!).player.money).toBe(6000);
      expect(JSON.parse(bakRaw!).player.money).toBe(4000);

      // 3. Simulate disk corruption on main slot
      adapter.store.set('pokemon_savegame_slot_1', '{ corrupted_invalid_json }');

      // 4. Load should recover from .bak
      const loaded = repository.load('slot_1');
      expect(loaded).not.toBeNull();
      expect(loaded!.player.money).toBe(4000);
      expect(playerServiceInstance.getProfile().money).toBe(4000);
    });

    it('safely handles QuotaExceededError and returns success=false instead of throwing', () => {
      adapter.quotaErrorOnKeys.add('pokemon_savegame_slot_1');
      const res = repository.save('slot_1');
      expect(res.success).toBe(false);
      expect(res.mainSuccess).toBe(false);
    });

    it('purges legacy keys to free storage quota once V3 save is stable', () => {
      adapter.setItem('pokemon_pc_storage_v1', '{"legacy": true}');
      adapter.setItem('pokemon_player_party_v1', '[]');
      adapter.setItem('pokemon_player_profile_v1', '{}');

      // Save both main and PC partitions
      repository.save('slot_1', { saveMain: true, savePc: true });

      const purged = repository.cleanupLegacyKeys('slot_1');
      expect(purged).toBe(true);

      // Obsolete legacy keys are wiped to recover quota
      expect(adapter.getItem('pokemon_pc_storage_v1')).toBeNull();
      expect(adapter.getItem('pokemon_player_party_v1')).toBeNull();
      expect(adapter.getItem('pokemon_player_profile_v1')).toBeNull();
    });
  });

  describe('Legacy Migration (V1/V2 -> V3)', () => {
    it('migrates separate legacy keys and merges with legacy slot', () => {
      // Prepare legacy data
      const legacyParty = [createPartyPokemon('CHARIZARD', 36)];
      const legacyProfile = {
        id: 'legacy_trainer',
        name: 'Blue',
        gender: 'male',
        money: 9999,
        badges: ['boulder', 'cascade'],
        playTimeSeconds: 3600,
        pokedexSeenCount: 50,
        pokedexCaughtCount: 20,
        inventory: {},
        position: { gx: 10, gy: 20, direction: 2 },
      };
      const legacySlot = {
        metadata: { version: 1, slotId: 'slot_1', playerName: 'Blue' },
        player: legacyProfile,
        party: [],
        inventory: { POKEBALL: 45, HYPERPOTION: 12 },
        world: { seed: 888, position: { gx: 10, gy: 20, direction: 2 } },
      };

      adapter.setItem('pokemon_player_party_v1', JSON.stringify(legacyParty));
      adapter.setItem('pokemon_player_profile_v1', JSON.stringify(legacyProfile));
      adapter.setItem('pokemon_savegame_slot_1', JSON.stringify(legacySlot));

      const migrated = repository.migrateLegacyData('slot_1');
      expect(migrated).toBe(true);

      // Check migration flag
      expect(adapter.getItem(SaveGameRepository.MIGRATION_FLAG_KEY)).toBe('true');

      // Check merged V3 save data
      const v3Raw = adapter.getItem('pokemon_savegame_slot_1');
      expect(v3Raw).not.toBeNull();
      const v3Data = JSON.parse(v3Raw!);
      expect(v3Data.metadata.version).toBe(3);
      expect(v3Data.metadata.playerName).toBe('Blue');
      expect(v3Data.party.length).toBe(1);
      expect(v3Data.party[0].name).toBe('Charizard');
      expect(v3Data.inventory.POKEBALL).toBe(45);
      expect(v3Data.inventory.HYPERPOTION).toBe(12);
      expect(v3Data.world.position.gx).toBe(10);
      expect(v3Data.world.seed).toBe(888);

      // Legacy keys must still exist for initial rollback safety
      expect(adapter.getItem('pokemon_player_party_v1')).not.toBeNull();
      expect(adapter.getItem('pokemon_player_profile_v1')).not.toBeNull();

      // Running migration again must do nothing
      const secondRun = repository.migrateLegacyData('slot_1');
      expect(secondRun).toBe(false);
    });

    it('prevents overwriting an existing V3 save with stale legacy data when migrated flag is missing', () => {
      // Prepare existing V3 save
      const existingV3Data = {
        metadata: { version: 3, slotId: 'slot_1', playerName: 'ActiveChampion' },
        player: createDefaultPlayerProfile('ActiveChampion'),
        party: [createPartyPokemon('DRAGONITE', 65)],
        inventory: {},
        world: { seed: 101, position: { gx: 50, gy: 50, direction: 0 } },
      };
      adapter.setItem('pokemon_savegame_slot_1', JSON.stringify(existingV3Data));

      // Obsolete legacy keys also present
      adapter.setItem('pokemon_player_party_v1', JSON.stringify([createPartyPokemon('RATTATA', 3)]));
      adapter.removeItem(SaveGameRepository.MIGRATION_FLAG_KEY); // flag was missing/cleared

      const ran = repository.migrateLegacyData('slot_1');
      expect(ran).toBe(false); // Aborted safely

      // Target slot must NOT be overwritten!
      const slotRaw = adapter.getItem('pokemon_savegame_slot_1');
      const slotData = JSON.parse(slotRaw!);
      expect(slotData.metadata.playerName).toBe('ActiveChampion');
      expect(slotData.party[0].name).toBe('Dragonite');
    });
  });

  describe('AutosaveCoordinator Orchestration', () => {
    let coordinator: AutosaveCoordinator;
    let isBattlingMock = false;

    beforeEach(() => {
      isBattlingMock = false;
      coordinator = new AutosaveCoordinator({
        slotId: 'slot_test',
        debounceMs: 500,
        maxWaitMs: 2000,
        tickerIntervalMs: 5000,
        repository,
        player: playerServiceInstance,
        party: partyServiceInstance,
        inventory: inventoryServiceInstance,
        pcStorage: pcStorageServiceInstance,
        battlingProvider: () => isBattlingMock,
      });
      coordinator.init();
    });

    afterEach(() => {
      coordinator.dispose();
    });

    it('flushes immediately on critical domain events (inventory and pc)', () => {
      expect(coordinator.getIsDirty()).toBe(false);

      // Mutating inventory flushes immediately
      inventoryServiceInstance.addItem('MASTERBALL', 3);
      expect(coordinator.getIsDirty()).toBe(false); // flushed right away!

      const raw = adapter.getItem('pokemon_savegame_slot_test');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.inventory['master-ball']).toBeGreaterThanOrEqual(3);
    });

    it('debounces player background updates and flushes after timer', () => {
      expect(coordinator.getIsDirty()).toBe(false);

      // Player service mutations without immediate flag use debouncer
      coordinator.markMainDirty('player_walk');
      expect(coordinator.getIsDirty()).toBe(true);

      // Before timer finishes: not yet written
      expect(adapter.getItem('pokemon_savegame_slot_test')).toBeNull();

      // Advance debounce timer (500ms)
      vi.advanceTimersByTime(550);

      expect(coordinator.getIsDirty()).toBe(false);
      expect(adapter.getItem('pokemon_savegame_slot_test')).not.toBeNull();
    });

    it('restores dirty flag and emits success=false when disk write fails', () => {
      let notifiedSuccess: boolean | null = null;
      coordinator.subscribeSave((notif) => {
        notifiedSuccess = notif.success;
      });

      // Cause disk write failure
      adapter.quotaErrorOnKeys.add('pokemon_savegame_slot_test');

      coordinator.markMainDirty('test');
      const flushResult = coordinator.flushSync();

      expect(flushResult).toBe(false);
      // Dirty flag is restored so data is not silently lost!
      expect(coordinator.getIsDirty()).toBe(true);
      expect(notifiedSuccess).toBe(false);
    });

    it('enforces in-battle lock (Direction A) and solidifies outcome upon unlock', () => {
      // 1. Start battle: lock coordinator
      coordinator.lockBattle();
      expect(coordinator.getIsBattleLocked()).toBe(true);

      // 2. Simulate midway battle mutations (using potions, moves, etc.)
      inventoryServiceInstance.removeItem('POTION', 2);
      coordinator.markMainDirty('battle_turn');

      // Attempting flush during battle lock must be disallowed
      const flushed = coordinator.flushSync();
      expect(flushed).toBe(false);
      expect(adapter.getItem('pokemon_savegame_slot_test')).toBeNull();

      // Even timer advance must not flush
      vi.advanceTimersByTime(3000);
      expect(adapter.getItem('pokemon_savegame_slot_test')).toBeNull();

      // 3. Conclude battle: unlock coordinator
      coordinator.unlockBattle();
      expect(coordinator.getIsBattleLocked()).toBe(false);

      // Post-battle state is immediately flushed to disk!
      const postRaw = adapter.getItem('pokemon_savegame_slot_test');
      expect(postRaw).not.toBeNull();
      const postData = JSON.parse(postRaw!);
      expect(postData.inventory['potion']).toBe(8); // Started with 10, used 2
    });

    it('watchdog auto-unlocks battle lock if session is no longer battling', () => {
      coordinator.lockBattle();
      expect(coordinator.getIsBattleLocked()).toBe(true);

      // Simulate battle ending unexpectedly without explicit unlock call
      isBattlingMock = false;

      // Advance ticker interval
      vi.advanceTimersByTime(5500);

      // Watchdog should have auto-unlocked
      expect(coordinator.getIsBattleLocked()).toBe(false);
    });

    it('ignores party cursor selection but detects any Pokemon mutation via JSON fingerprint', () => {
      expect(coordinator.getIsDirty()).toBe(false);

      // Moving cursor selection does not dirty disk
      partyServiceInstance.selectPokemon(1);
      expect(coordinator.getIsDirty()).toBe(false);

      partyServiceInstance.setSwapSource(0);
      expect(coordinator.getIsDirty()).toBe(false);

      // Mutating Pokemon moves, species, or status DOES immediately dirty and flush
      const leader = partyServiceInstance.getLeader()!;
      leader.nickname = 'Sparky';
      partyServiceInstance.notify();

      const raw = adapter.getItem('pokemon_savegame_slot_test');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.party[0].nickname).toBe('Sparky');
    });

    it('clamps playtime accumulation to prevent sleep explosion', () => {
      const initialPlaytime = playerServiceInstance.getProfile().playTimeSeconds;

      // Simulate clock jumping 8 hours (e.g. computer sleep)
      let mockTime = Date.now();
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      // Clock jumps 8 hours
      mockTime += 8 * 3600 * 1000;

      // Trigger the next single ticker interval (5,050ms)
      vi.advanceTimersByTime(5050);

      // Playtime must be clamped to at most 2 ticker intervals (10s), NOT 28,800s!
      const finalPlaytime = playerServiceInstance.getProfile().playTimeSeconds;
      expect(finalPlaytime - initialPlaytime).toBeLessThanOrEqual(20);
    });

    it('disables direct localStorage writes on individual services', () => {
      expect(PartyService.disableDirectStorageWrites).toBe(true);
      expect(PlayerService.disableDirectStorageWrites).toBe(true);
      expect(PcStorageService.disableDirectStorageWrites).toBe(true);
    });
  });
});
