/**
 * Unified Save Game Repository (Version 3)
 * Single Source of Truth for persisting and restoring Player, Party, Inventory, World, and PC Storage state.
 * Supports partition storage for PC (~1.6MB) and Main (~20KB) with backup (.bak) safety & migration.
 */

import {
  type SaveGameData,
  type SaveGameMetadata,
  type SavePCData,
  CURRENT_SAVE_VERSION,
  DEFAULT_SAVE_SLOT,
} from './save-state';
import { playerService, PlayerService } from '../player/player-service';
import { partyService, PartyService } from '../party/party-service';
import { inventoryService, InventoryService } from '../inventory/inventory-service';
import { pcStorageService, PcStorageService } from '../pc/pc-storage-service';
import { createRandomIvs, createDefaultEvs, ALL_NATURES } from '../party/pokemon-stats';
import { defaultRng } from '../../core/rng';

export interface SaveStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class BrowserLocalStorageAdapter implements SaveStorageAdapter {
  private memoryFallback: Map<string, string> = new Map();

  public getItem(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('LocalStorage not accessible, using memory fallback:', e);
    }
    return this.memoryFallback.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn('LocalStorage write failed, using memory fallback:', e);
      throw e;
    }
    this.memoryFallback.set(key, value);
  }

  public removeItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn('LocalStorage remove failed:', e);
    }
    this.memoryFallback.delete(key);
  }
}

export interface SaveOptions {
  saveMain?: boolean;
  savePc?: boolean;
  worldData?: SaveGameData['world'];
}

export class SaveGameRepository {
  private adapter: SaveStorageAdapter;
  private player: PlayerService;
  private party: PartyService;
  private inventory: InventoryService;
  private pcStorage: PcStorageService;

  public static readonly MIGRATION_FLAG_KEY = 'pokemon_savegame_migrated_v3';

  constructor(options?: {
    adapter?: SaveStorageAdapter;
    player?: PlayerService;
    party?: PartyService;
    inventory?: InventoryService;
    pcStorage?: PcStorageService;
  }) {
    this.adapter = options?.adapter ?? new BrowserLocalStorageAdapter();
    this.player = options?.player ?? playerService;
    this.party = options?.party ?? partyService;
    this.inventory = options?.inventory ?? inventoryService;
    this.pcStorage = options?.pcStorage ?? pcStorageService;
  }

  public getSlotStorageKey(slotId: string): string {
    return `pokemon_savegame_${slotId}`;
  }

  public getPcStorageKey(slotId: string): string {
    return `pokemon_savegame_${slotId}_pc`;
  }

  private getIndexStorageKey(): string {
    return `pokemon_savegame_index_v1`;
  }

  /**
   * Safely writes a payload to storage with .bak backup of valid prior payload.
   * Traps QuotaExceededError to prevent unhandled crashes.
   */
  public safeSetItem(key: string, value: string): boolean {
    try {
      const existing = this.adapter.getItem(key);
      if (existing) {
        // Only write backup if existing data is parseable JSON
        try {
          JSON.parse(existing);
          this.adapter.setItem(`${key}.bak`, existing);
        } catch {
          console.warn(`[SaveGameRepository] Existing data for ${key} was corrupt; skipped .bak update.`);
        }
      }
      this.adapter.setItem(key, value);
      return true;
    } catch (e: any) {
      if (
        e?.name === 'QuotaExceededError' ||
        e?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        e?.code === 22 ||
        e?.number === -2147024882
      ) {
        console.error(`[SaveGameRepository] Storage Quota Exceeded when saving ${key}:`, e);
      } else {
        console.error(`[SaveGameRepository] Storage write failed for ${key}:`, e);
      }
      return false;
    }
  }

  /**
   * Safely reads payload from storage with automatic fallback to .bak if corrupted.
   */
  public safeGetItem(key: string): string | null {
    const raw = this.adapter.getItem(key);
    if (raw) {
      try {
        JSON.parse(raw);
        return raw;
      } catch (e) {
        console.warn(`[SaveGameRepository] Corrupt payload in ${key}, falling back to .bak:`, e);
      }
    }

    const bak = this.adapter.getItem(`${key}.bak`);
    if (bak) {
      try {
        JSON.parse(bak);
        console.info(`[SaveGameRepository] Successfully restored ${key} from .bak backup!`);
        return bak;
      } catch (bakErr) {
        console.error(`[SaveGameRepository] Backup ${key}.bak is also corrupt:`, bakErr);
      }
    }

    return null;
  }

  /**
   * Migrates legacy independent keys into unified Version 3 format:
   * - Party: 'pokemon_player_party_v1'
   * - Profile: 'pokemon_player_profile_v1'
   * - PC: 'pokemon_pc_storage_v1'
   * - Legacy Slot: 'pokemon_savegame_${slotId}' (to harvest inventory and position)
   * Does NOT delete legacy keys, sets migration flag 'pokemon_savegame_migrated_v3'.
   */
  public migrateLegacyData(slotId: string = DEFAULT_SAVE_SLOT): boolean {
    const migrated = this.adapter.getItem(SaveGameRepository.MIGRATION_FLAG_KEY);
    if (migrated === 'true') {
      return false;
    }

    const legacyPartyRaw = this.adapter.getItem('pokemon_player_party_v1');
    const legacyProfileRaw = this.adapter.getItem('pokemon_player_profile_v1');
    const legacyPcRaw = this.adapter.getItem('pokemon_pc_storage_v1');
    const legacySlotRaw = this.adapter.getItem(this.getSlotStorageKey(slotId));

    if (!legacyPartyRaw && !legacyProfileRaw && !legacyPcRaw && !legacySlotRaw) {
      // Clean slate - mark as migrated
      this.adapter.setItem(SaveGameRepository.MIGRATION_FLAG_KEY, 'true');
      return false;
    }

    console.info('[SaveGameRepository] Starting legacy migration to Version 3...');

    let legacySlotData: any = null;
    if (legacySlotRaw) {
      try {
        legacySlotData = JSON.parse(legacySlotRaw);
      } catch {
        // legacy slot invalid
      }
    }

    // 1. Party: prefer active pokemon_player_party_v1, fallback to legacy slot party
    let party = this.party.getParty();
    if (legacyPartyRaw) {
      try {
        const parsedParty = JSON.parse(legacyPartyRaw);
        if (Array.isArray(parsedParty) && parsedParty.length > 0) {
          party = parsedParty;
        }
      } catch {}
    } else if (legacySlotData && Array.isArray(legacySlotData.party) && legacySlotData.party.length > 0) {
      party = legacySlotData.party;
    }

    // 2. Profile: prefer active pokemon_player_profile_v1, fallback to legacy slot player
    let profile = this.player.getProfile();
    if (legacyProfileRaw) {
      try {
        const parsedProfile = JSON.parse(legacyProfileRaw);
        if (parsedProfile && parsedProfile.name) {
          profile = { ...profile, ...parsedProfile };
        }
      } catch {}
    } else if (legacySlotData && legacySlotData.player) {
      profile = { ...profile, ...legacySlotData.player };
    }

    // 3. Inventory: legacy slot was the only place saving inventory properly
    let inventory = this.inventory.getAllItems();
    if (legacySlotData?.inventory && Object.keys(legacySlotData.inventory).length > 0) {
      inventory = legacySlotData.inventory;
    } else if (legacySlotData?.player?.inventory && Object.keys(legacySlotData.player.inventory).length > 0) {
      inventory = legacySlotData.player.inventory;
    } else if (profile.inventory && Object.keys(profile.inventory).length > 0) {
      inventory = profile.inventory;
    }

    // 4. Position: legacy slot world position, fallback to player position
    const position =
      legacySlotData?.world?.position ||
      legacySlotData?.player?.position ||
      profile.position || { gx: 0, gy: 0, direction: 0 };
    profile = { ...profile, position };

    // 5. PC Storage Partition: migrate legacy pokemon_pc_storage_v1
    let pcSavedAt = 0;
    let pcCount = this.pcStorage.getTotalStoredCount();
    if (legacyPcRaw) {
      try {
        const parsedPc = JSON.parse(legacyPcRaw);
        if (parsedPc && Array.isArray(parsedPc.boxes)) {
          const pcData: SavePCData = {
            slotId,
            version: CURRENT_SAVE_VERSION,
            savedAt: Date.now(),
            storage: parsedPc,
          };
          this.safeSetItem(this.getPcStorageKey(slotId), JSON.stringify(pcData));
          pcSavedAt = pcData.savedAt;

          let count = 0;
          for (const box of parsedPc.boxes) {
            if (Array.isArray(box?.slots)) {
              for (const s of box.slots) {
                if (s !== null) count++;
              }
            }
          }
          pcCount = count;
        }
      } catch (err) {
        console.warn('[SaveGameRepository] Failed to migrate legacy PC data:', err);
      }
    }

    // 6. Write Unified Main Slot
    const leader = party[0];
    const metadata: SaveGameMetadata = {
      version: CURRENT_SAVE_VERSION,
      savedAt: Date.now(),
      slotId,
      playerName: profile.name || 'Red',
      money: profile.money,
      badgesCount: profile.badges?.length || 0,
      partyCount: party.length,
      pcCount,
      leaderName: leader?.name || 'Trống',
      leaderLevel: leader?.level || 0,
      playTimeSeconds: profile.playTimeSeconds || 0,
      pcSavedAt: pcSavedAt > 0 ? pcSavedAt : undefined,
    };

    const saveData: SaveGameData = {
      metadata,
      player: {
        ...profile,
        inventory,
        position,
      },
      party: [...party],
      inventory,
      world: {
        position,
      },
    };

    this.safeSetItem(this.getSlotStorageKey(slotId), JSON.stringify(saveData));
    this.updateIndex(metadata);

    // Set migration flag
    this.adapter.setItem(SaveGameRepository.MIGRATION_FLAG_KEY, 'true');
    console.info('[SaveGameRepository] Legacy migration to Version 3 completed successfully.');
    return true;
  }

  /**
   * Captures snapshot of domain states and writes to storage.
   * By default, saves the lightweight main payload (~20KB).
   * PC partition (~1.6MB) is only written when options.savePc is explicitly true.
   */
  public save(
    slotId: string = DEFAULT_SAVE_SLOT,
    optionsOrWorld?: SaveOptions | SaveGameData['world']
  ): SaveGameData {
    let options: SaveOptions = { saveMain: true, savePc: false };
    if (optionsOrWorld) {
      if ('saveMain' in optionsOrWorld || 'savePc' in optionsOrWorld || 'worldData' in optionsOrWorld) {
        options = {
          saveMain: optionsOrWorld.saveMain ?? true,
          savePc: optionsOrWorld.savePc ?? false,
          worldData: optionsOrWorld.worldData,
        };
      } else {
        options = {
          saveMain: true,
          savePc: false,
          worldData: optionsOrWorld as SaveGameData['world'],
        };
      }
    }

    const profile = this.player.getProfile();
    const party = [...this.party.getParty()];
    const inventory = this.inventory.getAllItems();
    const leader = this.party.getLeader();
    const pcCount = this.pcStorage.getTotalStoredCount();
    let pcSavedAt = Date.now();

    // 1. Write PC partition if requested
    if (options.savePc) {
      const pcState = this.pcStorage.getState();
      const pcPayload: SavePCData = {
        slotId,
        version: CURRENT_SAVE_VERSION,
        savedAt: pcSavedAt,
        storage: pcState,
      };
      this.safeSetItem(this.getPcStorageKey(slotId), JSON.stringify(pcPayload));
    } else {
      // Retain existing pcSavedAt from metadata if known
      const existing = this.listSaves().find((m) => m.slotId === slotId);
      if (existing?.pcSavedAt) {
        pcSavedAt = existing.pcSavedAt;
      }
    }

    // 2. Write Main Partition
    const metadata: SaveGameMetadata = {
      version: CURRENT_SAVE_VERSION,
      savedAt: Date.now(),
      slotId,
      playerName: profile.name || 'Red',
      money: profile.money,
      badgesCount: profile.badges.length,
      partyCount: party.length,
      pcCount,
      leaderName: leader?.name || 'Trống',
      leaderLevel: leader?.level || 0,
      playTimeSeconds: profile.playTimeSeconds,
      pcSavedAt,
    };

    const saveData: SaveGameData = {
      metadata,
      player: {
        ...profile,
        inventory,
      },
      party,
      inventory,
      world: options.worldData ?? {
        position: profile.position,
      },
    };

    if (options.saveMain !== false) {
      const payload = JSON.stringify(saveData);
      this.safeSetItem(this.getSlotStorageKey(slotId), payload);
      this.updateIndex(metadata);
    }

    return saveData;
  }

  /**
   * Dedicated method to save only the PC storage partition.
   */
  public savePcOnly(slotId: string = DEFAULT_SAVE_SLOT): boolean {
    const pcState = this.pcStorage.getState();
    const pcCount = this.pcStorage.getTotalStoredCount();
    const now = Date.now();
    const pcPayload: SavePCData = {
      slotId,
      version: CURRENT_SAVE_VERSION,
      savedAt: now,
      storage: pcState,
    };
    const success = this.safeSetItem(this.getPcStorageKey(slotId), JSON.stringify(pcPayload));

    // Update metadata in index if available
    const saves = this.listSaves();
    const meta = saves.find((m) => m.slotId === slotId);
    if (meta) {
      meta.pcCount = pcCount;
      meta.pcSavedAt = now;
      this.adapter.setItem(this.getIndexStorageKey(), JSON.stringify(saves));
    }
    return success;
  }

  /**
   * Loads save payload from storage, validates, and dispatches state to all domain services.
   * Also loads PC Storage partition if present.
   */
  public load(slotId: string = DEFAULT_SAVE_SLOT): SaveGameData | null {
    const raw = this.safeGetItem(this.getSlotStorageKey(slotId));
    if (!raw) return null;

    try {
      const data = JSON.parse(raw) as SaveGameData;
      if (!data || !data.player || !data.party) {
        console.warn(`Corrupted save data for slot ${slotId}`);
        return null;
      }

      // Dispatch to domain services
      if (data.player) {
        this.player.loadProfile(data.player);
      }
      if (Array.isArray(data.party) && data.party.length > 0) {
        // IVs, EVs, Nature migration
        for (const pk of data.party) {
          if (!pk.ivs) pk.ivs = createRandomIvs(defaultRng);
          if (!pk.evs) pk.evs = createDefaultEvs();
          if (!pk.nature) pk.nature = ALL_NATURES[defaultRng.nextInt(0, ALL_NATURES.length - 1)];
        }
        this.party.loadParty(data.party);
      }
      if (data.inventory) {
        this.inventory.loadState(data.inventory);
      }

      // Dispatch PC partition if present
      const pcRaw = this.safeGetItem(this.getPcStorageKey(slotId));
      if (pcRaw) {
        try {
          const pcData = JSON.parse(pcRaw) as SavePCData;
          if (pcData && pcData.storage) {
            this.pcStorage.loadFromState(pcData.storage);
          }
        } catch (pcErr) {
          console.warn(`[SaveGameRepository] Failed to load PC partition for slot ${slotId}:`, pcErr);
        }
      }

      return data;
    } catch (e) {
      console.error(`Failed to parse save game data for slot ${slotId}:`, e);
      return null;
    }
  }

  public hasSave(slotId: string = DEFAULT_SAVE_SLOT): boolean {
    return this.safeGetItem(this.getSlotStorageKey(slotId)) !== null;
  }

  public deleteSave(slotId: string = DEFAULT_SAVE_SLOT): boolean {
    const mainKey = this.getSlotStorageKey(slotId);
    const pcKey = this.getPcStorageKey(slotId);

    this.adapter.removeItem(mainKey);
    this.adapter.removeItem(`${mainKey}.bak`);
    this.adapter.removeItem(pcKey);
    this.adapter.removeItem(`${pcKey}.bak`);

    const all = this.listSaves().filter((m) => m.slotId !== slotId);
    this.adapter.setItem(this.getIndexStorageKey(), JSON.stringify(all));
    return true;
  }

  public listSaves(): SaveGameMetadata[] {
    const raw = this.adapter.getItem(this.getIndexStorageKey());
    if (!raw) return [];
    try {
      return JSON.parse(raw) as SaveGameMetadata[];
    } catch {
      return [];
    }
  }

  private updateIndex(meta: SaveGameMetadata): void {
    const current = this.listSaves().filter((m) => m.slotId !== meta.slotId);
    current.push(meta);
    this.adapter.setItem(this.getIndexStorageKey(), JSON.stringify(current));
  }

  public exportJson(slotId: string = DEFAULT_SAVE_SLOT): string | null {
    return this.safeGetItem(this.getSlotStorageKey(slotId));
  }

  public importJson(json: string, slotId: string = DEFAULT_SAVE_SLOT): boolean {
    try {
      const parsed = JSON.parse(json) as SaveGameData;
      if (!parsed.player || !parsed.party) {
        return false;
      }
      parsed.metadata.slotId = slotId;
      const success = this.safeSetItem(this.getSlotStorageKey(slotId), JSON.stringify(parsed));
      if (success) {
        this.updateIndex(parsed.metadata);
      }
      return success;
    } catch {
      return false;
    }
  }
}

// Global repository singleton
export const saveGameRepository = new SaveGameRepository();
