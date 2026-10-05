/**
 * Inventory Domain State
 * Represents item stacks, quantities, and pockets.
 */

export interface InventoryItemEntry {
  itemId: string;
  count: number;
}

export interface InventoryState {
  items: Record<string, number>;
}

export function createDefaultInventoryState(): InventoryState {
  return {
    items: {
      POKEBALL: 20,
      GREATBALL: 5,
      ULTRABALL: 2,
      MASTERBALL: 1,
      POTION: 10,
      SUPERPOTION: 5,
      REVIVE: 3,
      RARECANDY: 3,
      ORANBERRY: 10,
      SITRUSBERRY: 5,
      BICYCLE: 1,
      TOWNMAP: 1,
      TM01: 1,
      XATTACK: 3,
    },
  };
}
