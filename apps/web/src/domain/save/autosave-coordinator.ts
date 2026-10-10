/**
 * Autosave Coordinator (Version 3)
 * Centralized, real-time autosave orchestrator for PokéOverworld.
 *
 * Responsibilities:
 * - Single point of persistence: coordinates Party, Player, Inventory, PC Storage, and World.
 * - Non-blocking debounce (1s) & throttle (5s max wait) with zero UI hitching.
 * - Immediate flush capability for critical actions (items, healing, PC operations).
 * - Safe write failure detection & retry: restores dirty flags if QuotaExceeded occurs.
 * - Independent PC Storage partition saving only on actual PC mutations.
 * - In-battle save lock (Direction A) with watchdog escape route.
 * - Tauri v2 & browser lifecycle hooks (beforeunload, pagehide, visibilitychange, onCloseRequested).
 * - Restoring safety flags to prevent loops.
 * - Fingerprinted party listener to prevent UI cursor movements from dirtying disk.
 */

import {
  saveGameRepository,
  SaveGameRepository,
} from './save-repository';
import { DEFAULT_SAVE_SLOT, type SaveGameData } from './save-state';
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
  battlingProvider?: () => boolean;
  worldDataProvider?: () => SaveGameData['world'];
}

export interface SaveNotification {
  success: boolean;
  mainSaved: boolean;
  pcSaved: boolean;
  timestamp: number;
  error?: string;
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
  private saveSuccessCount = 0;

  private debounceTimer: any = null;
  private maxWaitTimer: any = null;
  private tickerTimer: any = null;
  private retryTimer: any = null;
  private retryAttempts = 0;

  private lastPlaytimeTimestamp = Date.now();
  private lastPartyFingerprint = '';

  private isInitialized = false;
  private unsubs: (() => void)[] = [];
  private lifecycleCleanups: (() => void)[] = [];
  private saveListeners: Set<(notif: SaveNotification) => void> = new Set();
  private battlingProvider: (() => boolean) | null = null;
  private worldDataProvider: (() => SaveGameData['world']) | null = null;

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

    if (options?.battlingProvider) {
      this.battlingProvider = options.battlingProvider;
    }
    if (options?.worldDataProvider) {
      this.worldDataProvider = options.worldDataProvider;
    }
  }

  public setBattlingProvider(fn: () => boolean): void {
    this.battlingProvider = fn;
  }

  public setWorldDataProvider(fn: () => SaveGameData['world']): void {
    this.worldDataProvider = fn;
    this.repository.setWorldDataProvider(fn);
  }

  /**
   * Initializes the coordinator:
   * 1. Disables direct localStorage writes across individual services.
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

    // Capture initial party fingerprint
    this.lastPartyFingerprint = this.getPartyFingerprint();

    // 4. Attach domain subscribers
    this.unsubs.push(
      this.party.subscribe(() => {
        if (this.isRestoring) return;
        // Check if actual Pokemon data changed vs pure UI selection index
        const currentFp = this.getPartyFingerprint();
        if (currentFp !== this.lastPartyFingerprint) {
          this.lastPartyFingerprint = currentFp;
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

    // 5. Periodic Ticker (playtime & watchdog)
    this.lastPlaytimeTimestamp = Date.now();
    this.tickerTimer = setInterval(() => {
      this.handleTicker();
    }, this.tickerIntervalMs);

    // 6. Window / Lifecycle hooks
    this.setupLifecycleHooks();

    this.isInitialized = true;
    console.info('[AutosaveCoordinator] Initialized successfully for slot:', this.slotId);
  }

  private getPartyFingerprint(): string {
    const party = this.party.getParty();
    return party
      .map(
        (p) =>
          `${p.uid}:${p.currentHp}:${p.level}:${p.exp}:${p.heldItem ?? ''}:${(p.moves ?? [])
            .map((m) => m.pp)
            .join(',')}`
      )
      .join('|');
  }

  private handleTicker(): void {
    if (this.isRestoring) return;

    // 1. Compute exact elapsed playtime (only if window is active)
    const now = Date.now();
    const elapsed = now - this.lastPlaytimeTimestamp;
    this.lastPlaytimeTimestamp = now;

    const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    if (!isHidden && elapsed > 0) {
      const seconds = Math.floor(elapsed / 1000);
      if (seconds > 0) {
        this.player.addPlayTime(seconds);
        this.markMainDirty('ticker_playtime');
      }
    }

    // 2. Watchdog: check if battle locked while battle is actually over
    if (this.isBattleLocked && this.battlingProvider && !this.battlingProvider()) {
      console.warn('[AutosaveCoordinator] Watchdog detected orphaned battle lock! Force unlocking.');
      this.unlockBattle();
    }
  }

  private setupLifecycleHooks(): void {
    if (typeof window === 'undefined') return;

    const onUnload = () => {
      this.flushSync('window_unload');
    };

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        this.flushSync('visibility_hidden');
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

    // Tauri v2 Window Close Requested Hook
    const isTauri = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
    if (isTauri) {
      import('@tauri-apps/api/window')
        .then(({ getCurrentWindow }) => {
          const win = getCurrentWindow();
          return win.onCloseRequested(async () => {
            this.flushSync('tauri_onCloseRequested');
          });
        })
        .then((unlisten) => {
          if (typeof unlisten === 'function') {
            this.lifecycleCleanups.push(unlisten);
          }
        })
        .catch((tErr) => {
          console.warn('[AutosaveCoordinator] Tauri onCloseRequested hook registration notice:', tErr);
        });
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
      this.flushSync('debounced');
    }, this.debounceMs);

    // Ensure throttle max wait
    if (!this.maxWaitTimer) {
      this.maxWaitTimer = setTimeout(() => {
        this.flushSync('max_wait_throttle');
      }, this.maxWaitMs);
    }
  }

  /**
   * Immediately flushes any pending changes without debounce wait.
   * Ideal for critical events (item use, evolution, PC operations).
   */
  public flushImmediate(reason?: string): boolean {
    return this.flushSync(reason ?? 'immediate');
  }

  /**
   * Synchronously flushes any pending changes to disk.
   * Handles QuotaExceededError by restoring dirty flags and scheduling retry with backoff.
   */
  public flushSync(_reason?: string): boolean {
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

    let pcSuccess = true;
    let mainSuccess = true;

    try {
      if (savePc) {
        pcSuccess = this.repository.savePcOnly(this.slotId);
        if (pcSuccess) {
          this.pcDirty = false;
        } else {
          // Restore dirty flag on failure!
          this.pcDirty = true;
        }
      }

      if (saveMain) {
        const worldData = this.worldDataProvider ? this.worldDataProvider() : undefined;
        const res = this.repository.save(this.slotId, {
          saveMain: true,
          savePc: false,
          worldData,
        });
        mainSuccess = res.mainSuccess;
        if (mainSuccess) {
          this.mainDirty = false;
        } else {
          // Restore dirty flag on failure!
          this.mainDirty = true;
        }
      }

      const overallSuccess = (savePc ? pcSuccess : true) && (saveMain ? mainSuccess : true);

      if (overallSuccess) {
        this.retryAttempts = 0;
        if (this.retryTimer) {
          clearTimeout(this.retryTimer);
          this.retryTimer = null;
        }
        this.lastSaveTimestamp = Date.now();
        this.saveSuccessCount++;

        // Once confirmed stable with at least 2 successful saves, purge legacy keys to free quota
        if (this.saveSuccessCount >= 2) {
          this.repository.cleanupLegacyKeys(this.slotId);
        }
      } else {
        console.warn(`[AutosaveCoordinator] Save write failed (main: ${mainSuccess}, pc: ${pcSuccess}). Scheduling retry.`);
        this.scheduleRetry();
      }

      const notif: SaveNotification = {
        success: overallSuccess,
        mainSaved: saveMain,
        pcSaved: savePc,
        timestamp: Date.now(),
        error: overallSuccess ? undefined : 'Storage write failed (QuotaExceeded or I/O error)',
      };

      this.saveListeners.forEach((fn) => {
        try {
          fn(notif);
        } catch (e) {
          console.error('[AutosaveCoordinator] Save listener error:', e);
        }
      });

      return overallSuccess;
    } catch (err) {
      console.error('[AutosaveCoordinator] Error during flushSync:', err);
      // Restore dirty flags if write failed
      if (saveMain) this.mainDirty = true;
      if (savePc) this.pcDirty = true;
      this.scheduleRetry();
      return false;
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimer) return;
    this.retryAttempts++;
    const delay = Math.min(30000, 2000 * Math.pow(1.5, this.retryAttempts - 1));
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.flushSync('retry_backoff');
    }, delay);
  }

  /**
   * Locks autosave during an ongoing battle (Direction A).
   * First flushes pre-battle state cleanly, then prevents in-battle disk writes.
   */
  public lockBattle(): void {
    // Flush cleanly before battle begins
    this.flushSync('pre_battle');
    this.isBattleLocked = true;
  }

  /**
   * Unlocks autosave once battle is fully concluded.
   * Restores battle-sync changes and immediately flushes the final outcome to disk.
   */
  public unlockBattle(): void {
    this.isBattleLocked = false;
    this.mainDirty = true;
    this.flushSync('post_battle');
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
    this.flushSync('dispose');

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.maxWaitTimer) clearTimeout(this.maxWaitTimer);
    if (this.tickerTimer) clearInterval(this.tickerTimer);
    if (this.retryTimer) clearTimeout(this.retryTimer);

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
