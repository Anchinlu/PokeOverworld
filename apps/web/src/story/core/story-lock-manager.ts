/**
 * Story Lock Manager
 *
 * Implements resource isolation as required by STORY_ARCHITECTURE_CONTRACT.md:
 * - Locks have explicit ownership (eventId).
 * - Events can only release locks they own.
 * - Central registry prevents resource contention between cutscenes, engine, and AI.
 */

export type StoryLockType =
  | 'input'
  | 'camera'
  | 'wildlife'
  | 'npc'
  | 'world_time'
  | 'weather'
  | 'battle';

export interface StoryLock {
  type: StoryLockType;
  ownerId: string;
  acquiredAt: number;
  release: () => void;
}

export class StoryLockManager {
  private static instance: StoryLockManager | null = null;

  // Active locks mapped by type
  private activeLocks = new Map<StoryLockType, StoryLock>();

  public static getInstance(): StoryLockManager {
    if (!StoryLockManager.instance) {
      StoryLockManager.instance = new StoryLockManager();
    }
    return StoryLockManager.instance;
  }

  /**
   * Acquires a lock for a specific resource type and owner.
   * If a lock is already held by another owner, throws an error or logs warning based on contract.
   */
  public acquire(type: StoryLockType, ownerId: string): StoryLock {
    const existing = this.activeLocks.get(type);
    if (existing && existing.ownerId !== ownerId) {
      console.warn(
        `[StoryLockManager] Contention: lock '${type}' is already held by '${existing.ownerId}', being acquired by '${ownerId}'. Overriding ownership.`
      );
    }

    const lock: StoryLock = {
      type,
      ownerId,
      acquiredAt: Date.now(),
      release: () => this.release(type, ownerId),
    };

    this.activeLocks.set(type, lock);
    return lock;
  }

  /**
   * Releases a lock if owned by the requesting owner.
   */
  public release(type: StoryLockType, ownerId: string): boolean {
    const existing = this.activeLocks.get(type);
    if (!existing) {
      return false;
    }

    if (existing.ownerId !== ownerId) {
      console.warn(
        `[StoryLockManager] Unauthorized release: owner '${ownerId}' cannot release lock '${type}' owned by '${existing.ownerId}'.`
      );
      return false;
    }

    this.activeLocks.delete(type);
    return true;
  }

  /**
   * Checks whether a specific lock type is currently active.
   */
  public isLocked(type: StoryLockType): boolean {
    return this.activeLocks.has(type);
  }

  /**
   * Returns the owner ID of an active lock, or null if free.
   */
  public getOwner(type: StoryLockType): string | null {
    return this.activeLocks.get(type)?.ownerId ?? null;
  }

  /**
   * Forcibly releases all locks owned by a specific event (e.g., during abort or completion cleanup).
   */
  public releaseAllForOwner(ownerId: string): void {
    for (const [type, lock] of this.activeLocks.entries()) {
      if (lock.ownerId === ownerId) {
        this.activeLocks.delete(type);
      }
    }
  }

  /**
   * Clears all locks (e.g. on full game reset or returning to title screen).
   */
  public clearAll(): void {
    this.activeLocks.clear();
  }
}

export const storyLockManager = StoryLockManager.getInstance();
