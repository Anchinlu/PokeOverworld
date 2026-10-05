/**
 * Unified Save Game Repository
 * Single Source of Truth for persisting and restoring Player, Party, Inventory, and World state.
 */

import {
  type SaveGameData,
  type SaveGameMetadata,
  CURRENT_SAVE_VERSION,
  DEFAULT_SAVE_SLOT,
} from './save-state';
import { playerService, PlayerService } from '../player/player-service';
import { partyService, PartyService } from '../party/party-service';
import { inventoryService, InventoryService } from '../inventory/inventory-service';

export interface SaveStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class BrowserLocalStorageAdapter implements SaveStorageAdapter {
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

export class SaveGameRepository {
  private adapter: SaveStorageAdapter;
  private player: PlayerService;
  private party: PartyService;
  private inventory: InventoryService;

  constructor(options?: {
    adapter?: SaveStorageAdapter;
    player?: PlayerService;
    party?: PartyService;
    inventory?: InventoryService;
  }) {
    this.adapter = options?.adapter ?? new BrowserLocalStorageAdapter();
    this.player = options?.player ?? playerService;
    this.party = options?.party ?? partyService;
    this.inventory = options?.inventory ?? inventoryService;
  }

  private getSlotStorageKey(slotId: string): string {
    return `pokemon_savegame_${slotId}`;
  }

  private getIndexStorageKey(): string {
    return `pokemon_savegame_index_v1`;
  }

  /**
   * Captures snapshot of all domain states and writes to storage.
   */
  public save(slotId: string = DEFAULT_SAVE_SLOT, worldData?: SaveGameData['world']): SaveGameData {
    const profile = this.player.getProfile();
    const party = [...this.party.getParty()];
    const inventory = this.inventory.getAllItems();
    const leader = this.party.getLeader();

    const metadata: SaveGameMetadata = {
      version: CURRENT_SAVE_VERSION,
      savedAt: Date.now(),
      slotId,
      playerName: profile.name || 'Red',
      money: profile.money,
      badgesCount: profile.badges.length,
      partyCount: party.length,
      leaderName: leader?.name || 'Trống',
      leaderLevel: leader?.level || 0,
      playTimeSeconds: profile.playTimeSeconds,
    };

    const saveData: SaveGameData = {
      metadata,
      player: {
        ...profile,
        inventory,
      },
      party,
      inventory,
      world: worldData ?? {
        position: profile.position,
      },
    };

    // 1. Write save payload
    const payload = JSON.stringify(saveData);
    this.adapter.setItem(this.getSlotStorageKey(slotId), payload);

    // 2. Update slots index
    this.updateIndex(metadata);

    return saveData;
  }

  /**
   * Loads save payload from storage, validates, and dispatches state to all domain services.
   */
  public load(slotId: string = DEFAULT_SAVE_SLOT): SaveGameData | null {
    const raw = this.adapter.getItem(this.getSlotStorageKey(slotId));
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
        this.party.loadParty(data.party);
      }
      if (data.inventory) {
        this.inventory.loadState(data.inventory);
      }

      return data;
    } catch (e) {
      console.error(`Failed to parse save game data for slot ${slotId}:`, e);
      return null;
    }
  }

  public hasSave(slotId: string = DEFAULT_SAVE_SLOT): boolean {
    return this.adapter.getItem(this.getSlotStorageKey(slotId)) !== null;
  }

  public deleteSave(slotId: string = DEFAULT_SAVE_SLOT): boolean {
    this.adapter.removeItem(this.getSlotStorageKey(slotId));
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
    return this.adapter.getItem(this.getSlotStorageKey(slotId));
  }

  public importJson(json: string, slotId: string = DEFAULT_SAVE_SLOT): boolean {
    try {
      const parsed = JSON.parse(json) as SaveGameData;
      if (!parsed.player || !parsed.party) {
        return false;
      }
      parsed.metadata.slotId = slotId;
      this.adapter.setItem(this.getSlotStorageKey(slotId), JSON.stringify(parsed));
      this.updateIndex(parsed.metadata);
      return true;
    } catch {
      return false;
    }
  }
}

// Global repository singleton
export const saveGameRepository = new SaveGameRepository();
