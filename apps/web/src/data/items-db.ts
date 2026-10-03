import rawItemsData from '@pokemon/game-data/items-db.json';

export interface ItemData {
  id: string;
  name: string;
  nameVi: string;
  slug: string;
  category: string;
  categoryName: string;
  categoryVi: string;
  description: string;
  descriptionVi?: string;
  sprite: string;
  filename: string;
  price?: number;
}

export const ITEMS_DB: Record<string, ItemData> = (
  rawItemsData as { items: Record<string, ItemData> }
).items;

export function getAllItems(): ItemData[] {
  return Object.values(ITEMS_DB);
}

export function getItemById(id: string): ItemData | undefined {
  return ITEMS_DB[id];
}
