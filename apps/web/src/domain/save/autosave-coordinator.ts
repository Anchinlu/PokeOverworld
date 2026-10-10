/**
 * Autosave Coordinator (Version 3)
 * Centralized, real-time autosave orchestrator for PokéOverworld.
 *
 * Responsibilities:
 * - Single point of persistence: coordinates Party, Player, Inventory, PC Storage, and World.
 * - Non-blocking debounce (1s) & throttle (5s max wait) with zero UI hitching.
 * - Independent PC Storage partition saving only on actual PC mutations.
 * - In-battle save lock (Direction A): protects state from mid-battle volatility.
 * - Window lifecycle safety (flush on beforeunload, pagehide, visibilitychange, Tauri close).
 * - Restoring safety flags to prevent loops.
 */

import {
  saveGameRepository,
  SaveGameRepository,
} from './save-repository';
import { DEFAULT_SAVE_SLOT } from './save-state';
import { partyService, PartyService } from '../party/party-service';
import { playerService, PlayerService } from '../player/player-service';
import { inventoryService, InventoryService } from '../inventory/inventory-service';
import { pcStorageService, PcStorageService } from '../pc/pc-storage-service';

export interface AutosaveOptions {
  slotId?: string;
  debounceMs?: number;
  maxWaitMs?: number;
  tickerIntervalMs?: number;
  repository?: SaveGameRepository;
  party?: PartyService;
  player?: PlayerService;
  inventory?: InventoryService;
  pcStorage?: PcStorageService;
}

export interface SaveNotification {
  success: boolean;
  mainSaved: boolean;
  pcSaved: boolean;
  timestamp: number;
}

export class AutosaveCoordinator {
  private repository: SaveGameRepository;
  private party: PartyService;
  private player: PlayerService;
  private inventory: InventoryService;
  private pcStorage: PcStorageService;

  private slotId: string;
  private debounceMs: number;
  private maxWaitMs: number;
  private tickerIntervalMs: number;

  private isBattleLocked = false;
  private isRestoring = false;
  private mainDirty = false;
  private pcDirty = false;
  private lastSaveTimestamp = 0;

  private debounceTimer: any = null;
  private maxWaitTimer: any = null;
  private tickerTimer: any = null;

  private isInitialized = false;
  private unsubs: (() => void)[] = [];
  private lifecycleCleanups: (() => void)[] = [];
  private saveListeners: Set<(notif: SaveNotification) => void> = new Set();

  constructor(options?: AutosaveOptions) {
    this.slotId = options?.slotId ?? DEFAULT_SAVE_SLOT;
    this.debounceMs = options?.debounceMs ?? 1000;
    this.maxWaitMs = options?.maxWaitMs ?? 5000;
    this.tickerIntervalMs = options?.tickerIntervalMs ?? 10000;

    this.repository = options?.repository ?? saveGameRepository;
    this.party = options?.party ?? partyService;
    this.player = options?.player ?? playerService;
    this.inventory = options?.inventory ?? inventoryService;
    this.pcStorage = options?.pcStorage ?? pcStorageService;
  }

  /**
   * Initializes the coordinator:
   * 1. Disables direct localStorage writes across all individual services.
   * 2. Migrates legacy storage formats (if needed).
   * 3. Loads saved state into memory (if present).
   * 4. Binds reactive listeners, periodic ticker, and window close events.
   */
  public init(slotId: string = this.slotId): void {
    if (this.isInitialized) return;
    this.slotId = slotId;

    // 1. Disable legacy direct storage writes
    PartyService.disableDirectStorageWrites = true;
    PlayerService.disableDirectStorageWrites = true;
    PcStorageService.disableDirectStorageWrites = true;

    // 2. Perform legacy migration if needed
    try {
      this.repository.migrateLegacyData(this.slotId);
    } catch (migErr) {
      console.warn('[AutosaveCoordinator] Legacy migration error:', migErr);
    }

    // 3. Load initial state if available
    if (this.repository.hasSave(this.slotId)) {
      this.isRestoring = true;
      try {
        this.repository.load(this.slotId);
      } catch (loadErr) {
        console.error('[AutosaveCoordinator] Initial load failed:', loadErr);
      } finally {
        this.isRestoring = false;
      }
    }

    // 4. Attach domain subscribers
    this.unsubs.push(
      this.party.subscribe(() => {
        if (!this.isRestoring) {
          this.markMainDirty('party');
        }
      })
    );

    this.unsubs.push(
      this.player.subscribe(() => {
        if (!this.isRestoring) {
          this.markMainDirty('player');
        }
      })
    );

    this.unsubs.push(
      this.inventory.subscribe(() => {
        if (!this.isRestoring) {
          this.markMainDirty('inventory');
        }
      })
    );

    this.unsubs.push(
      this.pcStorage.subscribe(() => {
        if (!this.isRestoring) {
          this.markPcDirty('pcStorage');
        }
      })
    );

    // 5. Periodic Ticker (playtime & position updates)
    this.tickerTimer = setInterval(() => {
      this.handleTicker();
    }, this.tickerIntervalMs);

    // 6. Window / Lifecycle hooks
    this.setupLifecycleHooks();

    this.isInitialized = true;
    console.info('[AutosaveCoordinator] Initialized successfully for slot:', this.slotId);
  }

  private handleTicker(): void {
    if (this.isRestoring) return;
    const seconds = Math.round(this.tickerIntervalMs / 1000);
    this.player.addPlayTime(seconds);
    // Mark main dirty to preserve elapsed playtime and position
    this.markMainDirty('ticker');
  }

  private setupLifecycleHooks(): void {
    if (typeof window === 'undefined') return;

    const onUnload = () => {
      this.flushSync();
    };

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        this.flushSync();
      }
    };

    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);

    this.lifecycleCleanups.push(() => {
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });

    // Tauri-specific close request listener if present
    const tauriWindow = (window as any)?.__TAURI__?.window?.appWindow;
    if (tauriWindow && typeof tauriWindow.onCloseRequested === 'function') {
      try {
        tauriWindow.onCloseRequested(async () => {
          this.flushSync();
        });
      } catch (tErr) {
        console.warn('[AutosaveCoordinator] Tauri onCloseRequested hook warning:', tErr);
      }
    }
  }

  /**
   * Marks main save partition dirty and schedules debounced flush.
   */
  public markMainDirty(_reason?: string): void {
    this.mainDirty = true;
    if (!this.isBattleLocked && !this.isRestoring) {
      this.scheduleSave();
    }
  }

  /**
   * Marks PC storage partition dirty and schedules debounced flush.
   */
  public markPcDirty(_reason?: string): void {
    this.pcDirty = true;
    if (!this.isBattleLocked && !this.isRestoring) {
      this.scheduleSave();
    }
  }

  private scheduleSave(): void {
    if (this.isBattleLocked || this.isRestoring) return;
    if (!this.mainDirty && !this.pcDirty) return;

    // Reset debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.flushSync();
    }, this.debounceMs);

    // Ensure throttle max wait
    if (!this.maxWaitTimer) {
      this.maxWaitTimer = setTimeout(() => {
        this.flushSync();
      }, this.maxWaitMs);
    }
  }

  /**
   * Immediately flushes any pending changes to disk synchronously.
   * Safe to call during window unload or before major game events.
   */
  public flushSync(): boolean {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.maxWaitTimer) {
      clearTimeout(this.maxWaitTimer);
      this.maxWaitTimer = null;
    }

    if (this.isBattleLocked) {
      // Disallowed while battle lock is active
      return false;
    }

    if (!this.mainDirty && !this.pcDirty) {
      return false;
    }

    const saveMain = this.mainDirty;
    const savePc = this.pcDirty;
    this.mainDirty = false;
    this.pcDirty = false;

    let pcSuccess = true;
    let mainSuccess = true;

    try {
      if (savePc) {
        pcSuccess = this.repository.savePcOnly(this.slotId);
      }

      if (saveMain) {
        this.repository.save(this.slotId, {
          saveMain: true,
          savePc: false,
        });
      }

      this.lastSaveTimestamp = Date.now();
      const notif: SaveNotification = {
        success: pcSuccess && mainSuccess,
        mainSaved: saveMain,
        pcSaved: savePc,
        timestamp: this.lastSaveTimestamp,
      };

      this.saveListeners.forEach((fn) => {
        try {
          fn(notif);
        } catch (e) {
          console.error('[AutosaveCoordinator] Save listener error:', e);
        }
      });

      return true;
    } catch (err) {
      console.error('[AutosaveCoordinator] Error during flushSync:', err);
      // Restore dirty flags if write failed
      if (saveMain) this.mainDirty = true;
      if (savePc) this.pcDirty = true;
      return false;
    }
  }

  /**
   * Locks autosave during an ongoing battle (Direction A).
   * First flushes any pre-battle state cleanly, then prevents in-battle disk writes.
   */
  public lockBattle(): void {
    // Flush cleanly before battle begins
    this.flushSync();
    this.isBattleLocked = true;
  }

  /**
   * Unlocks autosave once battle is fully concluded.
   * Restores battle-sync changes and immediately flushes the final outcome to disk.
   */
  public unlockBattle(): void {
    this.isBattleLocked = false;
    this.mainDirty = true;
    this.flushSync();
  }

  public getIsBattleLocked(): boolean {
    return this.isBattleLocked;
  }

  public getIsRestoring(): boolean {
    return this.isRestoring;
  }

  public getIsDirty(): boolean {
    return this.mainDirty || this.pcDirty;
  }

  public getLastSaveTimestamp(): number {
    return this.lastSaveTimestamp;
  }

  public subscribeSave(listener: (notif: SaveNotification) => void): () => void {
    this.saveListeners.add(listener);
    return () => this.saveListeners.delete(listener);
  }

  /**
   * Cleanup all listeners and timers.
   */
  public dispose(): void {
    this.flushSync();

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.maxWaitTimer) clearTimeout(this.maxWaitTimer);
    if (this.tickerTimer) clearInterval(this.tickerTimer);

    this.unsubs.forEach((unsub) => unsub());
    this.unsubs = [];

    this.lifecycleCleanups.forEach((cleanup) => cleanup());
    this.lifecycleCleanups = [];

    this.saveListeners.clear();
    this.isInitialized = false;
  }
}

// Global coordinator singleton
export const autosaveCoordinator = new AutosaveCoordinator();
