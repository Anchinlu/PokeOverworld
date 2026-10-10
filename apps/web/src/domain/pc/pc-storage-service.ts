/**
 * Pokémon PC Storage Service
 * Manages the player's Pokémon storage system (24 boxes, 30 slots each).
 * Automatically deposits newly caught Pokémon when the active party is full (6/6).
 * Persists to localStorage and synchronizes with PartyService.
 */

import type { PartyPokemon } from '../party/party-state';
import type { BattleMove } from '../../battle/types';
import { partyService } from '../party/party-service';

export const TOTAL_BOXES = 24;
export const BOX_CAPACITY = 30; // 6 columns x 5 rows
const STORAGE_KEY = 'pokemon_pc_storage_v1';

export interface PcBox {
  id: number; // 1..24
  name: string; // "Hộp 1", "Hộp 2", ...
  wallpaperId: number; // 1..39
  slots: (PartyPokemon | null)[]; // exactly 30 slots
}

export interface PcStorageState {
  currentBoxIndex: number; // 0..23
  boxes: PcBox[];
}

export class PcStorageService {
  private static instance: PcStorageService | null = null;
  private state: PcStorageState;
  private subscribers: Set<() => void> = new Set();

  private constructor() {
    this.state = this.loadFromStorage();
  }

  public static getInstance(): PcStorageService {
    if (!PcStorageService.instance) {
      PcStorageService.instance = new PcStorageService();
    }
    return PcStorageService.instance;
  }

  /** Initialize default 24 empty boxes with cycling authentic wallpapers */
  private createDefaultBoxes(): PcBox[] {
    const boxes: PcBox[] = [];
    for (let i = 1; i <= TOTAL_BOXES; i++) {
      // Cycle wallpapers 1 to 39
      const wp = ((i - 1) % 39) + 1;
      boxes.push({
        id: i,
        name: `Hộp ${i}`,
        wallpaperId: wp,
        slots: Array<PartyPokemon | null>(BOX_CAPACITY).fill(null),
      });
    }
    return boxes;
  }

  private loadFromStorage(): PcStorageState {
    if (typeof localStorage === 'undefined') {
      return { currentBoxIndex: 0, boxes: this.createDefaultBoxes() };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PcStorageState;
        if (Array.isArray(parsed.boxes) && parsed.boxes.length === TOTAL_BOXES) {
          // Ensure all boxes have exactly 30 slots
          for (const box of parsed.boxes) {
            if (!Array.isArray(box.slots) || box.slots.length !== BOX_CAPACITY) {
              const newSlots = Array<PartyPokemon | null>(BOX_CAPACITY).fill(null);
              if (Array.isArray(box.slots)) {
                for (let s = 0; s < Math.min(box.slots.length, BOX_CAPACITY); s++) {
                  newSlots[s] = box.slots[s];
                }
              }
              box.slots = newSlots;
            }
          }
          return {
            currentBoxIndex: Math.max(0, Math.min(TOTAL_BOXES - 1, parsed.currentBoxIndex ?? 0)),
            boxes: parsed.boxes,
          };
        }
      }
    } catch (e) {
      console.warn('[PC Storage] Failed to parse saved storage state:', e);
    }

    return { currentBoxIndex: 0, boxes: this.createDefaultBoxes() };
  }

  public static disableDirectStorageWrites: boolean = false;

  public getState(): PcStorageState {
    return this.state;
  }

  public loadFromState(state: PcStorageState): void {
    if (Array.isArray(state?.boxes) && state.boxes.length === TOTAL_BOXES) {
      for (const box of state.boxes) {
        if (!Array.isArray(box.slots) || box.slots.length !== BOX_CAPACITY) {
          const newSlots = Array<PartyPokemon | null>(BOX_CAPACITY).fill(null);
          if (Array.isArray(box.slots)) {
            for (let s = 0; s < Math.min(box.slots.length, BOX_CAPACITY); s++) {
              newSlots[s] = box.slots[s];
            }
          }
          box.slots = newSlots;
        }
      }
      this.state = {
        currentBoxIndex: Math.max(0, Math.min(TOTAL_BOXES - 1, state.currentBoxIndex ?? 0)),
        boxes: state.boxes,
      };
      this.notify();
    }
  }

  private saveToStorage(): void {
    if (PcStorageService.disableDirectStorageWrites) return;
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('[PC Storage] Failed to save storage state to localStorage:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  private notify(): void {
    this.saveToStorage();
    this.subscribers.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[PC Storage] Subscriber callback error:', err);
      }
    });
  }

  // --- Getters & Navigation ---

  public getBoxes(): PcBox[] {
    return this.state.boxes;
  }

  public getBox(boxIndex: number): PcBox {
    const idx = Math.max(0, Math.min(TOTAL_BOXES - 1, boxIndex));
    return this.state.boxes[idx];
  }

  public getCurrentBoxIndex(): number {
    return this.state.currentBoxIndex;
  }

  public getCurrentBox(): PcBox {
    return this.state.boxes[this.state.currentBoxIndex];
  }

  public getBoxName(boxIndex: number): string {
    const box = this.getBox(boxIndex);
    return box ? box.name : `Hộp ${boxIndex + 1}`;
  }

  public setCurrentBoxIndex(index: number): void {
    const nextIdx = ((index % TOTAL_BOXES) + TOTAL_BOXES) % TOTAL_BOXES;
    if (this.state.currentBoxIndex !== nextIdx) {
      this.state.currentBoxIndex = nextIdx;
      this.notify();
    }
  }

  public nextBox(): void {
    this.setCurrentBoxIndex(this.state.currentBoxIndex + 1);
  }

  public prevBox(): void {
    this.setCurrentBoxIndex(this.state.currentBoxIndex - 1);
  }

  public setBoxName(boxIndex: number, name: string): void {
    const box = this.getBox(boxIndex);
    if (box) {
      box.name = name.trim() || `Hộp ${box.id}`;
      this.notify();
    }
  }

  public setBoxWallpaper(boxIndex: number, wallpaperId: number): void {
    const box = this.getBox(boxIndex);
    if (box) {
      box.wallpaperId = Math.max(1, Math.min(39, Math.floor(wallpaperId)));
      this.notify();
    }
  }

  // --- Core Storage Operations ---

  /**
   * Deposit a newly caught Pokémon or any Pokémon into the PC.
   * Searches the preferred box first, then scans all boxes 0..23 for the first empty slot.
   */
  public depositPokemon(
    pokemon: PartyPokemon,
    preferredBoxIndex?: number
  ): { success: boolean; boxIndex: number; slotIndex: number; boxName: string } {
    const startIdx =
      preferredBoxIndex !== undefined && preferredBoxIndex >= 0 && preferredBoxIndex < TOTAL_BOXES
        ? preferredBoxIndex
        : this.state.currentBoxIndex;

    // Check starting box first
    const targetBox = this.state.boxes[startIdx];
    const emptySlotInTarget = targetBox.slots.findIndex((s) => s === null);
    if (emptySlotInTarget !== -1) {
      targetBox.slots[emptySlotInTarget] = pokemon;
      this.notify();
      return {
        success: true,
        boxIndex: startIdx,
        slotIndex: emptySlotInTarget,
        boxName: targetBox.name,
      };
    }

    // Scan all other boxes in order
    for (let i = 0; i < TOTAL_BOXES; i++) {
      if (i === startIdx) continue;
      const box = this.state.boxes[i];
      const emptySlot = box.slots.findIndex((s) => s === null);
      if (emptySlot !== -1) {
        box.slots[emptySlot] = pokemon;
        this.notify();
        return {
          success: true,
          boxIndex: i,
          slotIndex: emptySlot,
          boxName: box.name,
        };
      }
    }

    return {
      success: false,
      boxIndex: -1,
      slotIndex: -1,
      boxName: '',
    };
  }

  /**
   * Deposit a Pokémon directly from the active party into the current or specified box.
   * Fails if player has only 1 conscious Pokémon in party.
   */
  public depositFromParty(
    partyIndex: number,
    targetBoxIndex?: number,
    targetSlotIndex?: number
  ): { success: boolean; error?: string } {
    const party = partyService.getParty();
    if (partyIndex < 0 || partyIndex >= party.length) {
      return { success: false, error: 'Chỉ mục Pokémon đội hình không hợp lệ.' };
    }

    // Check if player has at least 1 OTHER conscious Pokémon
    const targetPk = party[partyIndex];
    const consciousCount = party.filter((p) => !p.isFainted && p.currentHp > 0).length;
    const isTargetConscious = !targetPk.isFainted && targetPk.currentHp > 0;

    if (isTargetConscious && consciousCount <= 1) {
      return {
        success: false,
        error: 'Không thể gửi Pokémon cuối cùng còn khỏe mạnh vào PC!',
      };
    }

    const bIdx = targetBoxIndex ?? this.state.currentBoxIndex;
    const box = this.getBox(bIdx);
    let sIdx = targetSlotIndex ?? -1;

    if (sIdx === -1 || box.slots[sIdx] !== null) {
      sIdx = box.slots.findIndex((s) => s === null);
    }

    if (sIdx === -1) {
      return {
        success: false,
        error: `${box.name} đã đầy (30/30)! Hãy chuyển sang hộp khác.`,
      };
    }

    // Remove from party
    const removed = partyService.removePokemon(partyIndex);
    if (!removed) {
      return { success: false, error: 'Không thể rút Pokémon khỏi đội hình.' };
    }

    box.slots[sIdx] = removed;
    this.notify();
    return { success: true };
  }

  public updatePokemonMoves(uid: string, moves: BattleMove[]): boolean {
    for (const box of this.state.boxes) {
      for (let i = 0; i < box.slots.length; i++) {
        const pk = box.slots[i];
        if (pk && pk.uid === uid) {
          pk.moves = [...moves];
          this.notify();
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Withdraw a Pokémon from a PC box into the active party.
   * Fails if party already has 6 Pokémon.
   */
  public withdrawPokemon(
    boxIndex: number,
    slotIndex: number
  ): { success: boolean; error?: string } {
    if (partyService.isPartyFull()) {
      return { success: false, error: 'Đội hình đã đủ 6 Pokémon! Hãy gửi bớt vào PC trước.' };
    }

    const box = this.getBox(boxIndex);
    if (!box || slotIndex < 0 || slotIndex >= BOX_CAPACITY) {
      return { success: false, error: 'Vị trí trong hộp PC không hợp lệ.' };
    }

    const pk = box.slots[slotIndex];
    if (!pk) {
      return { success: false, error: 'Ô này không có Pokémon.' };
    }

    box.slots[slotIndex] = null;
    const added = partyService.addPokemon(pk);
    if (!added) {
      box.slots[slotIndex] = pk; // rollback
      return { success: false, error: 'Đội hình đã đầy (6/6)!' };
    }

    this.notify();
    return { success: true };
  }

  /**
   * Swap a Pokémon in the party with a Pokémon in a box slot.
   */
  public swapPartyAndBox(
    partyIndex: number,
    boxIndex: number,
    slotIndex: number
  ): { success: boolean; error?: string } {
    if (partyIndex < 0 || partyIndex >= 6) {
      return { success: false, error: 'Chỉ mục đội hình không hợp lệ.' };
    }

    const box = this.getBox(boxIndex);
    if (!box || slotIndex < 0 || slotIndex >= BOX_CAPACITY) {
      return { success: false, error: 'Vị trí ô trong hộp không hợp lệ.' };
    }

    const party = partyService.getParty();
    const partyPk = party[partyIndex] as PartyPokemon | undefined;
    const boxPk = box.slots[slotIndex];

    // Case 1: Both slots are empty
    if (!partyPk && !boxPk) {
      return { success: true };
    }

    // Case 2: Party has Pokémon, Box slot is empty -> Deposit from party into this exact box slot!
    if (partyPk && !boxPk) {
      return this.depositFromParty(partyIndex, boxIndex, slotIndex);
    }

    // Case 3: Box has Pokémon, Party slot is empty -> Withdraw Pokémon into the party!
    if (!partyPk && boxPk) {
      if (partyService.isPartyFull()) {
        return { success: false, error: 'Đội hình đã đủ 6 Pokémon!' };
      }
      box.slots[slotIndex] = null;
      const added = partyService.addPokemon(boxPk);
      if (!added) {
        box.slots[slotIndex] = boxPk; // rollback
        return { success: false, error: 'Không thể thêm vào đội hình.' };
      }
      this.notify();
      return { success: true };
    }

    // Case 4: Both slots have Pokémon -> Swap them!
    if (partyPk && boxPk) {
      const boxPkConscious = !boxPk.isFainted && boxPk.currentHp > 0;
      const partyPkConscious = !partyPk.isFainted && partyPk.currentHp > 0;
      const consciousCount = party.filter((p) => !p.isFainted && p.currentHp > 0).length;

      if (partyPkConscious && !boxPkConscious && consciousCount <= 1) {
        return {
          success: false,
          error:
            'Không thể đổi lấy Pokémon đang ngất xỉu nếu đội hình không còn Pokémon khỏe mạnh nào!',
        };
      }

      // Perform swap
      const oldPartyPk = partyService.replacePokemon(partyIndex, boxPk);
      if (!oldPartyPk) {
        return { success: false, error: 'Không thể thay thế Pokémon trong đội hình.' };
      }
      box.slots[slotIndex] = oldPartyPk;

      this.notify();
      return { success: true };
    }

    return { success: false, error: 'Thao tác không hợp lệ.' };
  }

  /**
   * Swap two slots within PC boxes (same or different boxes).
   */
  public swapBoxSlots(
    boxIndex1: number,
    slotIndex1: number,
    boxIndex2: number,
    slotIndex2: number
  ): boolean {
    const box1 = this.getBox(boxIndex1);
    const box2 = this.getBox(boxIndex2);
    if (!box1 || !box2) return false;
    if (slotIndex1 < 0 || slotIndex1 >= BOX_CAPACITY) return false;
    if (slotIndex2 < 0 || slotIndex2 >= BOX_CAPACITY) return false;

    const temp = box1.slots[slotIndex1];
    box1.slots[slotIndex1] = box2.slots[slotIndex2];
    box2.slots[slotIndex2] = temp;

    this.notify();
    return true;
  }

  /**
   * Move or swap a Pokémon between any two locations (Party or Box).
   */
  public moveOrSwap(
    source: { location: 'party' | 'box'; slotIndex: number; boxIndex?: number },
    target: { location: 'party' | 'box'; slotIndex: number; boxIndex?: number }
  ): { success: boolean; error?: string } {
    if (source.location === 'party' && target.location === 'party') {
      const ok = partyService.swapPokemon(source.slotIndex, target.slotIndex);
      return { success: ok };
    }

    if (source.location === 'box' && target.location === 'box') {
      const b1 = source.boxIndex ?? this.state.currentBoxIndex;
      const b2 = target.boxIndex ?? this.state.currentBoxIndex;
      const ok = this.swapBoxSlots(b1, source.slotIndex, b2, target.slotIndex);
      return { success: ok };
    }

    if (source.location === 'party' && target.location === 'box') {
      const b = target.boxIndex ?? this.state.currentBoxIndex;
      return this.swapPartyAndBox(source.slotIndex, b, target.slotIndex);
    }

    if (source.location === 'box' && target.location === 'party') {
      const b = source.boxIndex ?? this.state.currentBoxIndex;
      return this.swapPartyAndBox(target.slotIndex, b, source.slotIndex);
    }

    return { success: false, error: 'Thao tác không hợp lệ.' };
  }

  /**
   * Release a Pokémon from a PC box.
   */
  public releasePokemon(
    boxIndex: number,
    slotIndex: number
  ): { success: boolean; releasedPokemon?: PartyPokemon } {
    const box = this.getBox(boxIndex);
    if (!box || slotIndex < 0 || slotIndex >= BOX_CAPACITY) {
      return { success: false };
    }

    const pk = box.slots[slotIndex];
    if (!pk) return { success: false };

    box.slots[slotIndex] = null;
    this.notify();
    return { success: true, releasedPokemon: pk };
  }

  /** Count total Pokémon currently stored across all 24 boxes */
  public getTotalStoredCount(): number {
    let count = 0;
    for (const box of this.state.boxes) {
      for (const slot of box.slots) {
        if (slot !== null) count++;
      }
    }
    return count;
  }
}

export const pcStorageService = PcStorageService.getInstance();
