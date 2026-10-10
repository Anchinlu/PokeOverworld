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
      repository.save('slot_1', { saveMain: false, savePc: true });

      const pcRaw = adapter.getItem('pokemon_savegame_slot_1_pc');
      expect(pcRaw).not.toBeNull();
      const parsedPc = JSON.parse(pcRaw!);
      expect(parsedPc.version).toBe(CURRENT_SAVE_VERSION);
      expect(Array.isArray(parsedPc.storage.boxes)).toBe(true);
      expect(parsedPc.storage.boxes.length).toBe(24);
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

    it('safely handles QuotaExceededError without throwing an exception', () => {
      adapter.quotaErrorOnKeys.add('pokemon_savegame_slot_1');
      expect(() => {
        const success = repository.safeSetItem('pokemon_savegame_slot_1', '{"test":true}');
        expect(success).toBe(false);
      }).not.toThrow();
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
        world: { position: { gx: 10, gy: 20, direction: 2 } },
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

      // Legacy keys must still exist for rollback safety
      expect(adapter.getItem('pokemon_player_party_v1')).not.toBeNull();
      expect(adapter.getItem('pokemon_player_profile_v1')).not.toBeNull();

      // Running migration again must do nothing
      const secondRun = repository.migrateLegacyData('slot_1');
      expect(secondRun).toBe(false);
    });
  });

  describe('AutosaveCoordinator Orchestration', () => {
    let coordinator: AutosaveCoordinator;

    beforeEach(() => {
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
      });
      coordinator.init();
    });

    afterEach(() => {
      coordinator.dispose();
    });

    it('debounces domain mutations and flushes to disk automatically', () => {
      expect(coordinator.getIsDirty()).toBe(false);

      // 1. Mutate inventory
      inventoryServiceInstance.addItem('MASTERBALL', 3);
      expect(coordinator.getIsDirty()).toBe(true);

      // Before debounce completes: not yet written
      expect(adapter.getItem('pokemon_savegame_slot_test')).toBeNull();

      // Fast-forward debounce timer (500ms)
      vi.advanceTimersByTime(550);

      // Now written!
      expect(coordinator.getIsDirty()).toBe(false);
      const raw = adapter.getItem('pokemon_savegame_slot_test');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.inventory['master-ball']).toBeGreaterThanOrEqual(3);
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

    it('tracks playtime and position via periodic ticker', () => {
      const initialPlaytime = playerServiceInstance.getProfile().playTimeSeconds;
      playerServiceInstance.updatePosition(42, 88, 1);

      // Advance 5s ticker
      vi.advanceTimersByTime(5050);

      expect(playerServiceInstance.getProfile().playTimeSeconds).toBe(initialPlaytime + 5);

      // Advance debounce to write to disk
      vi.advanceTimersByTime(600);

      const raw = adapter.getItem('pokemon_savegame_slot_test');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.player.position.gx).toBe(42);
      expect(parsed.player.position.gy).toBe(88);
    });

    it('disables direct localStorage writes on individual services', () => {
      expect(PartyService.disableDirectStorageWrites).toBe(true);
      expect(PlayerService.disableDirectStorageWrites).toBe(true);
      expect(PcStorageService.disableDirectStorageWrites).toBe(true);
    });
  });
});
