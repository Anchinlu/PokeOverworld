/**
 * Story Manager (Story Director)
 * Core orchestrator for the Story System lifecycle.
 * Manages event triggers, execution context, safe abortion, resets, locks, and engine binding
 * adhering to STORY_ARCHITECTURE_CONTRACT.md.
 */

import { battleSePlayer } from '../../audio';
import { playerService, partyService, createPartyPokemon } from '../../domain';
import type { StoryEventDefinition } from '../types';
import type { StoryContext } from '../types/story-context';
import type {
  StoryGamePort,
  StoryDialoguePort,
  StoryAudioPort,
  StoryCameraPort,
  StoryWorldPort,
} from '../ports';
import { StoryState, storyState } from './story-state';
import { StoryEventRegistry, storyEventRegistry } from './story-event-registry';
import { DialogueOverlay } from '../presentation/dialogue-overlay';
import { StoryLockManager, storyLockManager } from './story-lock-manager';
import { storyAnchorRegistry } from './story-anchor-registry';

export class StoryManager {
  private static instance: StoryManager | null = null;

  private isEventRunning = false;
  private activeEvent: StoryEventDefinition | null = null;
  private abortController: AbortController | null = null;

  private defaultGamePort: StoryGamePort | null = null;
  private defaultAudioPort: StoryAudioPort | null = null;
  private defaultCameraPort: StoryCameraPort | null = null;
  private defaultWorldPort: StoryWorldPort | null = null;
  private defaultDialoguePort: StoryDialoguePort = DialogueOverlay.getInstance();
  private state: StoryState = storyState;
  private registry: StoryEventRegistry = storyEventRegistry;
  private locks: StoryLockManager = storyLockManager;

  public static getInstance(): StoryManager {
    if (!StoryManager.instance) {
      StoryManager.instance = new StoryManager();
    }
    return StoryManager.instance;
  }

  // --- LIFECYCLE CONTROLS ---

  /**
   * Returns whether a story event or cutscene is currently executing.
   */
  public isRunning(): boolean {
    return this.isEventRunning;
  }

  /**
   * Returns the currently running event definition, or null if idle.
   */
  public getCurrentEvent(): StoryEventDefinition | null {
    return this.activeEvent;
  }

  /**
   * Sets the StoryGamePort adapter.
   */
  public setGamePort(port: StoryGamePort): void {
    this.defaultGamePort = port;
  }

  /**
   * Sets the StoryAudioPort adapter.
   */
  public setAudioPort(port: StoryAudioPort): void {
    this.defaultAudioPort = port;
  }

  /**
   * Sets the StoryCameraPort adapter.
   */
  public setCameraPort(port: StoryCameraPort): void {
    this.defaultCameraPort = port;
  }

  public getCameraPort(): StoryCameraPort {
    return this.defaultCameraPort ?? this.createFallbackCameraPort();
  }

  /**
   * Sets the StoryDialoguePort adapter.
   */
  public setDialoguePort(port: StoryDialoguePort): void {
    this.defaultDialoguePort = port;
  }

  /**
   * Sets the StoryWorldPort adapter.
   */
  public setWorldPort(port: StoryWorldPort): void {
    this.defaultWorldPort = port;
  }

  public getWorldPort(): StoryWorldPort {
    return this.defaultWorldPort ?? this.createFallbackWorldPort();
  }

  /**
   * Access the centralized StoryState intermediary.
   */
  public getState(): StoryState {
    return this.state;
  }

  /**
   * Access the centralized StoryLockManager.
   */
  public getLocks(): StoryLockManager {
    return this.locks;
  }

  /**
   * Access the StoryEventRegistry.
   */
  public getRegistry(): StoryEventRegistry {
    return this.registry;
  }

  /**
   * Starts executing a story event by ID or direct definition through standard lifecycle:
   * PREPARING -> RUNNING -> COMMITTING -> COMPLETED (or ABORTING -> ABORTED).
   */
  public async startEvent(
    eventOrId: string | StoryEventDefinition,
    customContext?: Partial<StoryContext>
  ): Promise<boolean> {
    if (this.isEventRunning) {
      console.warn('[StoryManager] An event is already running:', this.activeEvent?.id);
      return false;
    }

    const def =
      typeof eventOrId === 'string' ? this.registry.get(eventOrId) : eventOrId;
    if (!def) {
      console.error('[StoryManager] Event not found:', eventOrId);
      return false;
    }

    this.isEventRunning = true;
    this.activeEvent = def;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const delay = (ms: number) =>
      new Promise<void>((resolve) => {
        if (signal.aborted) {
          resolve();
          return;
        }
        const timer = setTimeout(resolve, ms);
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true }
        );
      });

    const context: StoryContext = {
      game: customContext?.game ?? this.defaultGamePort ?? this.createFallbackGamePort(),
      dialogue: customContext?.dialogue ?? this.defaultDialoguePort,
      audio: customContext?.audio ?? this.defaultAudioPort ?? this.createFallbackAudioPort(),
      camera: customContext?.camera ?? this.defaultCameraPort ?? this.createFallbackCameraPort(),
      world: customContext?.world ?? this.defaultWorldPort ?? this.createFallbackWorldPort(),
      locks: this.locks,
      state: this.state,
      abortSignal: signal,
      delay,
      ...customContext,
    };

    try {
      if (def.checkpoint) {
        this.state.setCheckpoint(def.id, def.checkpoint);
      }

      // 1. Lifecycle: PREPARE (world/actors preparation, no rewards granted)
      if (def.prepare) {
        await def.prepare(context);
      }

      // 2. Lifecycle: RUN (cutscene execution)
      await def.run(context);

      if (signal.aborted) {
        console.log(`[StoryManager] Event "${def.id}" aborted.`);
        await def.onAbort?.(context);
        return false;
      }

      // 3. Lifecycle: COMMIT (atomic write of flags, items, quest advances)
      if (def.commit) {
        await def.commit(context);
      }

      return true;
    } catch (error) {
      if (signal.aborted) {
        console.log(`[StoryManager] Event "${def.id}" aborted.`);
        await def.onAbort?.(context);
      } else {
        console.error(`[StoryManager] Error running event "${def.id}":`, error);
        await def.onAbort?.(context);
      }
      return false;
    } finally {
      // 4. Lifecycle: CLEANUP & LOCK RELEASE
      try {
        await def.cleanup?.(context);
      } catch (cleanupErr) {
        console.warn(`[StoryManager] Error in cleanup for event "${def.id}":`, cleanupErr);
      }

      this.locks.releaseAllForOwner(def.id);
      this.defaultDialoguePort.hideDialogue();
      if (context.game.isInputLocked()) {
        context.game.unlockInput();
      }
      this.isEventRunning = false;
      this.activeEvent = null;
      this.abortController = null;
    }
  }

  /**
   * Safely aborts the active cutscene event without corrupting game state.
   */
  public abortEvent(reason = 'aborted'): void {
    if (!this.isEventRunning) return;
    const currentId = this.activeEvent?.id;
    if (this.abortController) {
      this.abortController.abort(reason);
    }
    if (currentId) {
      this.locks.releaseAllForOwner(currentId);
    }
    this.defaultDialoguePort.hideDialogue();
    if (this.defaultGamePort?.isInputLocked()) {
      this.defaultGamePort.unlockInput();
    }
    this.isEventRunning = false;
    this.activeEvent = null;
    this.abortController = null;
  }

  /**
   * Resets active execution state (e.g., when returning to title screen or reloading).
   */
  public reset(): void {
    this.abortEvent('reset');
    this.locks.clearAll();
  }

  /**
   * Cleans up all manager state and removes external adapter bindings.
   */
  public dispose(): void {
    this.reset();
    this.defaultGamePort = null;
    this.defaultAudioPort = null;
    this.defaultCameraPort = null;
    this.defaultWorldPort = null;
  }

  // --- FALLBACK ADAPTERS ---

  private createFallbackAudioPort(): StoryAudioPort {
    return {
      playSound: (sfxPath: string, volumeScale = 1.0) =>
        battleSePlayer.playSound(sfxPath, volumeScale),
      playCry: (cryPath: string, volumeScale = 1.0) =>
        battleSePlayer.playSound(cryPath, volumeScale),
      stopAll: () => {},
    };
  }

  private createFallbackCameraPort(): StoryCameraPort {
    return {
      panTo: async (_gx, _gy, durationMs) => {
        await new Promise((r) => setTimeout(r, durationMs));
      },
      shakeScreen: (_intensity, durationMs) => {
        if (typeof document !== 'undefined') {
          const el = document.getElementById('gameCanvas') || document.querySelector('canvas') || document.body;
          el.classList.add('canvas-zap-shake');
          setTimeout(() => el.classList.remove('canvas-zap-shake'), durationMs);
        }
      },
      flashScreen: async (color, durationMs) => {
        if (typeof document === 'undefined') return;
        const flashEl = document.createElement('div');
        flashEl.style.position = 'fixed';
        flashEl.style.inset = '0';
        flashEl.style.backgroundColor = color;
        flashEl.style.zIndex = '99999';
        flashEl.style.pointerEvents = 'none';
        flashEl.style.opacity = '0.8';
        flashEl.style.transition = `opacity ${durationMs}ms ease-out`;
        document.body.appendChild(flashEl);
        requestAnimationFrame(() => {
          flashEl.style.opacity = '0';
        });
        await new Promise((r) => setTimeout(r, durationMs));
        flashEl.remove();
      },
      fadeScreen: async (type, color = '#000000', durationMs = 1000) => {
        if (typeof document === 'undefined') return;
        let overlay = document.getElementById('storyCameraFadeOverlay') as HTMLDivElement | null;
        if (type === 'out') {
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'storyCameraFadeOverlay';
            overlay.style.position = 'fixed';
            overlay.style.inset = '0';
            overlay.style.backgroundColor = color;
            overlay.style.zIndex = '99999';
            overlay.style.pointerEvents = 'all';
            overlay.style.opacity = '0';
            overlay.style.transition = `opacity ${durationMs}ms ease-in-out`;
            document.body.appendChild(overlay);
          }
          requestAnimationFrame(() => {
            if (overlay) overlay.style.opacity = '1';
          });
        } else {
          if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
              overlay?.remove();
            }, durationMs);
          }
        }
        await new Promise((r) => setTimeout(r, durationMs));
      },
      setScreenZap: (active: boolean) => {
        if (typeof document === 'undefined') return;
        const canvasEl = document.querySelector('canvas') || document.body;
        const containerEl = document.querySelector('.canvas-container') || document.body;
        if (active) {
          canvasEl?.classList.add('canvas-zap-shake');
          containerEl?.classList.add('lightning-zap');
        } else {
          canvasEl?.classList.remove('canvas-zap-shake');
          containerEl?.classList.remove('lightning-zap');
        }
      },
      reset: () => {
        if (typeof document !== 'undefined') {
          const overlay = document.getElementById('storyCameraFadeOverlay');
          overlay?.remove();
          const canvasEl = document.querySelector('canvas');
          canvasEl?.classList.remove('canvas-zap-shake');
          const containerEl = document.querySelector('.canvas-container');
          containerEl?.classList.remove('lightning-zap');
        }
      },
    };
  }

  private createFallbackWorldPort(): StoryWorldPort {
    return {
      prepareArea: async () => {},
      suppressWildlife: (_suppress: boolean) => {},
      resolveAnchor: (anchorId: string) => storyAnchorRegistry.resolve(anchorId),
    };
  }

  private createFallbackGamePort(): StoryGamePort {
    let locked = false;
    return {
      getPlayerPosition: () => ({ gx: 0, gy: 0, dir: 0 }),
      snapPlayer: () => {},
      setPlayerDirection: () => {},
      lockInput: () => {
        locked = true;
      },
      unlockInput: () => {
        locked = false;
      },
      isInputLocked: () => locked,
      setPlayerEmote: () => {},
      setActorEmote: () => {},
      setActorDirection: () => {},
      setActorVisible: () => {},
      snapActor: () => {},
      moveActor: async () => {},
      giveItem: (itemId, count) => playerService.addItem(itemId, count),
      giveStarterPokemon: (species, level) => {
        const p = createPartyPokemon(String(species), level, { ivs: 'perfect' });
        return partyService.addPokemon(p);
      },
      setFollowerVisible: () => {},
      snapFollower: () => {},
    };
  }
}

export const storyManager = StoryManager.getInstance();
