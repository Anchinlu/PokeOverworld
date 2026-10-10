/**
 * Inventory Domain Service
 * Encapsulates all business logic for player items, quantities, and pockets.
 */

import { type InventoryState, createDefaultInventoryState } from './inventory-state';
import {
  findItem,
  getItemPocketIndex,
  getAllItems as getAllCatalogItems,
  type ItemData,
} from '../../data/items-db';

export interface PocketItemEntry {
  rawId: string;
  count: number;
  item: ItemData;
  pocketIndex: number;
}

export class InventoryService {
  private state: InventoryState;
  private listeners: Set<(state: InventoryState) => void> = new Set();

  constructor(initialState?: InventoryState) {
    const base = initialState ?? createDefaultInventoryState();
    this.state = { items: this.canonicalizeItems(base.items) };
  }

  private canonicalizeKey(key: string): string {
    return findItem(key)?.id ?? key;
  }

  private canonicalizeItems(raw: Record<string, number>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, count] of Object.entries(raw || {})) {
      if (count <= 0) continue;
      const canonical = this.canonicalizeKey(key);
      result[canonical] = (result[canonical] ?? 0) + count;
    }
    return result;
  }

  public getState(): Readonly<InventoryState> {
    return this.state;
  }

  public subscribe(callback: (state: InventoryState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error notifying InventoryService listener:', err);
      }
    }
  }

  // --- Item Operations ---

  public getItemCount(itemId: string): number {
    const canonical = this.canonicalizeKey(itemId);
    return this.state.items[canonical] ?? 0;
  }

  public hasItem(itemId: string, count = 1): boolean {
    return this.getItemCount(itemId) >= count;
  }

  public addItem(itemId: string, count = 1): number {
    if (count <= 0) return this.getItemCount(itemId);
    const canonical = this.canonicalizeKey(itemId);
    const current = this.state.items[canonical] ?? 0;
    this.state.items[canonical] = current + count;
    this.notify();
    return this.state.items[canonical];
  }

  public removeItem(itemId: string, count = 1): boolean {
    if (count <= 0) return true;
    const canonical = this.canonicalizeKey(itemId);
    const current = this.state.items[canonical] ?? 0;
    if (current < count) return false;

    const remaining = current - count;
    if (remaining <= 0) {
      delete this.state.items[canonical];
    } else {
      this.state.items[canonical] = remaining;
    }

    this.notify();
    return true;
  }

  public getAllItems(): Record<string, number> {
    return { ...this.state.items };
  }

  /**
   * Provides full items across all pockets with a specified quantity (default: 1).
   * Ensures every item in the game database exists in the player's inventory.
   */
  public addFullItems(quantity = 1): number {
    const all = getAllCatalogItems();
    let updatedCount = 0;
    for (const item of all) {
      const canonical = this.canonicalizeKey(item.id);
      const current = this.state.items[canonical] ?? 0;
      if (current < quantity) {
        this.state.items[canonical] = quantity;
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      this.notify();
    }
    return all.length;
  }

  /**
   * Provides all 108 Technical Machines (TM01 - TM100) and Hidden Machines (HM01 - HM08).
   * Ensures every move disc exists in the player's inventory with the specified quantity (default: 1).
   */
  public addAllMachines(quantity = 1): number {
    const all = getAllCatalogItems();
    const machines = all.filter((it) => it.category === 'machine');
    let updatedCount = 0;
    for (const item of machines) {
      const canonical = this.canonicalizeKey(item.id);
      const current = this.state.items[canonical] ?? 0;
      if (current < quantity) {
        this.state.items[canonical] = quantity;
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      this.notify();
    }
    return machines.length;
  }

  /**
   * Retrieves all items categorized into their respective pockets with metadata.
   */
  public getInventoryEntries(): PocketItemEntry[] {
    const entries: PocketItemEntry[] = [];
    for (const [id, count] of Object.entries(this.state.items)) {
      if (count <= 0) continue;
      const itemDef = findItem(id);
      if (!itemDef) continue;
      const pocketIndex = getItemPocketIndex(itemDef);
      entries.push({
        rawId: id,
        count,
        item: itemDef,
        pocketIndex,
      });
    }
    return entries;
  }

  public getPocketItems(pocketIndex: number): PocketItemEntry[] {
    return this.getInventoryEntries().filter((e) => e.pocketIndex === pocketIndex);
  }

  // --- Persistence & State Loading ---

  public loadState(newState: InventoryState | Record<string, number>): void {
    const rawItems =
      'items' in newState && typeof newState.items === 'object'
        ? (newState.items as Record<string, number>)
        : (newState as Record<string, number>);
    this.state = { items: this.canonicalizeItems(rawItems || {}) };
    this.notify();
  }

  public reset(): void {
    this.state = { items: this.canonicalizeItems(createDefaultInventoryState().items) };
    this.notify();
  }

  public clear(): void {
    this.state = { items: {} };
    this.notify();
  }
}

// Global inventory domain singleton
export const inventoryService = new InventoryService();
