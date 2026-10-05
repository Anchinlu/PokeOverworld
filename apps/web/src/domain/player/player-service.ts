/**
 * Player Domain Service
 * Encapsulates all business logic for player progress, wallet, and inventory.
 */

import { type PlayerProfile, createDefaultPlayerProfile } from './player-state';
import { inventoryService } from '../inventory/inventory-service';

const STORAGE_KEY = 'pokemon_player_profile_v1';

export class PlayerService {
  private profile: PlayerProfile;
  private listeners: Set<(profile: PlayerProfile) => void> = new Set();

  constructor(initialProfile?: PlayerProfile) {
    this.profile = initialProfile ?? this.loadFromStorage() ?? createDefaultPlayerProfile();
    inventoryService.loadState(this.profile.inventory);
  }

  public getProfile(): Readonly<PlayerProfile> {
    return {
      ...this.profile,
      inventory: inventoryService.getAllItems(),
    };
  }

  public subscribe(callback: (profile: PlayerProfile) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.profile);
      } catch (err) {
        console.error('Error notifying PlayerService listener:', err);
      }
    }
    this.saveToStorage();
  }

  // --- Wallet Operations ---

  public addMoney(amount: number): number {
    if (amount <= 0) return this.profile.money;
    this.profile.money += Math.floor(amount);
    this.notify();
    return this.profile.money;
  }

  public spendMoney(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.profile.money < amount) return false;
    this.profile.money -= Math.floor(amount);
    this.notify();
    return true;
  }

  // --- Badges & Progress ---

  public addBadge(badge: string): boolean {
    if (this.profile.badges.includes(badge)) return false;
    this.profile.badges.push(badge);
    this.notify();
    return true;
  }

  public hasBadge(badge: string): boolean {
    return this.profile.badges.includes(badge);
  }

  public incrementSeen(): void {
    this.profile.pokedexSeenCount++;
    this.notify();
  }

  public incrementCaught(): void {
    this.profile.pokedexCaughtCount++;
    this.notify();
  }

  // --- Inventory Operations (Delegated to inventoryService) ---

  public getItemCount(itemId: string): number {
    return inventoryService.getItemCount(itemId);
  }

  public hasItem(itemId: string, count = 1): boolean {
    return inventoryService.hasItem(itemId, count);
  }

  public addItem(itemId: string, count = 1): number {
    return inventoryService.addItem(itemId, count);
  }

  public removeItem(itemId: string, count = 1): boolean {
    return inventoryService.removeItem(itemId, count);
  }

  // --- Position & Time ---

  public updatePosition(gx: number, gy: number, direction: number): void {
    this.profile.position = { gx, gy, direction };
    // Not notifying storage every single step to avoid I/O spam; will save on major events
  }

  public addPlayTime(seconds: number): void {
    if (seconds <= 0) return;
    this.profile.playTimeSeconds += Math.floor(seconds);
  }

  // --- Storage Persistence ---

  public saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      }
    } catch (e) {
      console.warn('Unable to save player profile to localStorage', e);
    }
  }

  public loadFromStorage(): PlayerProfile | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw) as PlayerProfile;
        }
      }
    } catch (e) {
      console.warn('Unable to load player profile from localStorage', e);
    }
    return null;
  }

  public loadProfile(newProfile: PlayerProfile): void {
    if (!newProfile) return;
    this.profile = { ...newProfile };
    if (newProfile.inventory) {
      inventoryService.loadState(newProfile.inventory);
    }
    this.notify();
  }

  public reset(): void {
    this.profile = createDefaultPlayerProfile();
    inventoryService.reset();
    this.notify();
  }
}

// Global player singleton
export const playerService = new PlayerService();
