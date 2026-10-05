/**
 * Party Domain Service
 * Manages player's team of up to 6 Pokémon, swapping, healing, battle synchronization, and persistence.
 */

import {
  type PartyPokemon,
  type PartyState,
  MAX_PARTY_SIZE,
  createDefaultParty,
} from './party-state';
import type { BattlerPokemon } from '../../battle/types';

const STORAGE_KEY = 'pokemon_player_party_v1';

export class PartyService {
  private state: PartyState;
  private listeners: Set<(state: PartyState) => void> = new Set();

  constructor(initialParty?: PartyPokemon[]) {
    const loadedParty = this.loadFromStorage();
    this.state = {
      pokemon: initialParty ?? loadedParty ?? createDefaultParty(),
      selectedIndex: 0,
      swapSourceIndex: null,
    };
  }

  public getState(): Readonly<PartyState> {
    return this.state;
  }

  public getParty(): ReadonlyArray<PartyPokemon> {
    return this.state.pokemon;
  }

  public getPartySize(): number {
    return this.state.pokemon.length;
  }

  public isPartyFull(): boolean {
    return this.state.pokemon.length >= MAX_PARTY_SIZE;
  }

  public getPokemon(index: number): PartyPokemon | null {
    return this.state.pokemon[index] ?? null;
  }

  /**
   * First Pokémon in the party (Slot 0), leads in overworld follower and enters battle first.
   */
  public getLeader(): PartyPokemon | null {
    return this.state.pokemon[0] ?? null;
  }

  /**
   * Returns the first alive (non-fainted) Pokémon in the party to enter battle.
   */
  public getFirstAlivePokemon(): PartyPokemon | null {
    return this.state.pokemon.find((p) => p.currentHp > 0 && !p.isFainted) ?? null;
  }

  public isWholePartyFainted(): boolean {
    return this.state.pokemon.every((p) => p.currentHp <= 0 || p.isFainted);
  }

  public subscribe(callback: (state: PartyState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error notifying PartyService listener:', err);
      }
    }
    this.saveToStorage();
  }

  // --- Party Modifications ---

  /**
   * Adds a Pokémon to the party. Returns true if added, false if party is full.
   */
  public addPokemon(pokemon: PartyPokemon): boolean {
    if (this.isPartyFull()) {
      return false;
    }
    this.state.pokemon.push(pokemon);
    this.notify();
    return true;
  }

  /**
   * Removes a Pokémon from the party. Fails if only 1 Pokémon remains.
   */
  public removePokemon(index: number): PartyPokemon | null {
    if (this.state.pokemon.length <= 1) return null;
    if (index < 0 || index >= this.state.pokemon.length) return null;

    const [removed] = this.state.pokemon.splice(index, 1);
    if (this.state.selectedIndex >= this.state.pokemon.length) {
      this.state.selectedIndex = Math.max(0, this.state.pokemon.length - 1);
    }
    this.notify();
    return removed ?? null;
  }

  /**
   * Swaps positions of two Pokémon in the party.
   */
  public swapPokemon(index1: number, index2: number): boolean {
    const len = this.state.pokemon.length;
    if (index1 < 0 || index1 >= len || index2 < 0 || index2 >= len || index1 === index2) {
      return false;
    }

    const temp = this.state.pokemon[index1]!;
    this.state.pokemon[index1] = this.state.pokemon[index2]!;
    this.state.pokemon[index2] = temp;
    this.state.swapSourceIndex = null;
    this.notify();
    return true;
  }

  /**
   * Sets the Pokémon at the specified index as the party leader (Slot 0).
   */
  public setLeader(index: number): boolean {
    if (index === 0) return true;
    return this.swapPokemon(0, index);
  }

  // --- Healing & Status ---

  /**
   * Fully restores HP, clears status conditions, and restores full move PP for the whole party.
   */
  public healAll(): void {
    for (const p of this.state.pokemon) {
      p.currentHp = p.maxHp;
      p.status = 'none';
      p.isFainted = false;
      for (const m of p.moves) {
        m.pp = m.maxPp;
      }
    }
    this.notify();
  }

  /**
   * Restores HP to a single Pokémon.
   */
  public healPokemon(index: number, amount?: number): void {
    const p = this.getPokemon(index);
    if (!p) return;

    if (amount === undefined) {
      p.currentHp = p.maxHp;
      p.isFainted = false;
    } else {
      p.currentHp = Math.min(p.maxHp, p.currentHp + Math.floor(amount));
      if (p.currentHp > 0) p.isFainted = false;
    }
    this.notify();
  }

  /**
   * Cures status ailments (poison, burn, sleep, paralysis, freeze) of a Pokémon.
   */
  public cureStatus(index: number): void {
    const p = this.getPokemon(index);
    if (!p) return;
    p.status = 'none';
    this.notify();
  }

  /**
   * Restores PP of a specific move or all moves of a Pokémon.
   */
  public restorePp(index: number, moveIndex?: number, amount?: number): void {
    const p = this.getPokemon(index);
    if (!p) return;

    if (moveIndex !== undefined) {
      const m = p.moves[moveIndex];
      if (m) {
        m.pp = amount !== undefined ? Math.min(m.maxPp, m.pp + amount) : m.maxPp;
      }
    } else {
      for (const m of p.moves) {
        m.pp = amount !== undefined ? Math.min(m.maxPp, m.pp + amount) : m.maxPp;
      }
    }
    this.notify();
  }

  // --- Battle Results Synchronization ---

  /**
   * Syncs the end-of-battle state (HP, PP, status, EXP gained) back into the corresponding PartyPokemon.
   */
  public syncBattleResult(
    battler: BattlerPokemon,
    expGained = 0
  ): { leveledUp: boolean; newLevel: number } {
    // Find the matching pokemon by UID or fallback to species and level
    const partyMember =
      this.state.pokemon.find(
        (p) =>
          (battler.uid && p.uid === battler.uid) ||
          (p.speciesKey === battler.speciesKey && p.level === battler.level)
      ) ?? this.state.pokemon[0];

    if (!partyMember) {
      return { leveledUp: false, newLevel: 0 };
    }

    partyMember.currentHp = Math.max(0, battler.currentHp);
    partyMember.isFainted = partyMember.currentHp <= 0;
    partyMember.status = battler.status ?? 'none';

    // Sync PP of moves
    for (const bMove of battler.moves) {
      const targetMove = partyMember.moves.find((m) => m.id === bMove.id);
      if (targetMove) {
        targetMove.pp = bMove.pp;
      }
    }

    let leveledUp = false;
    if (expGained > 0 && !partyMember.isFainted) {
      partyMember.exp += expGained;
      while (partyMember.exp >= partyMember.maxExp && partyMember.level < 100) {
        partyMember.exp -= partyMember.maxExp;
        partyMember.level++;
        partyMember.maxExp = partyMember.level * partyMember.level * 10;
        leveledUp = true;

        // Recalculate stats on level up
        const baseHp = partyMember.stats.hp;
        partyMember.maxHp += Math.floor((2 * baseHp) / 100) + 1;
        partyMember.currentHp = Math.min(partyMember.maxHp, partyMember.currentHp + 2);
      }
    }

    this.notify();
    return { leveledUp, newLevel: partyMember.level };
  }

  // --- UI Selection & Swapping State ---

  public selectPokemon(index: number): void {
    if (index >= 0 && index < this.state.pokemon.length) {
      this.state.selectedIndex = index;
      this.notify();
    }
  }

  public setSwapSource(index: number | null): void {
    this.state.swapSourceIndex = index;
    this.notify();
  }

  // --- Persistence ---

  public saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.pokemon));
      }
    } catch (e) {
      console.warn('Unable to save party to localStorage', e);
    }
  }

  public loadFromStorage(): PartyPokemon[] | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed as PartyPokemon[];
          }
        }
      }
    } catch (e) {
      console.warn('Unable to load party from localStorage', e);
    }
    return null;
  }

  public loadParty(pokemon: PartyPokemon[]): void {
    if (!Array.isArray(pokemon) || pokemon.length === 0) return;
    this.state.pokemon = [...pokemon];
    this.state.selectedIndex = 0;
    this.state.swapSourceIndex = null;
    this.notify();
  }

  public reset(): void {
    this.state.pokemon = createDefaultParty();
    this.state.selectedIndex = 0;
    this.state.swapSourceIndex = null;
    this.notify();
  }
}

// Global party singleton
export const partyService = new PartyService();
