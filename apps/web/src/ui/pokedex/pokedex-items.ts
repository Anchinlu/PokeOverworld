import type { ItemData } from '../../data/items-db';

export const ITEM_POCKET_MAP: Record<string, string> = {
  pokeballs: 'Ngăn Bóng',
  medicine: 'Dược Phẩm',
  berries: 'Quả Mọng',
  machines: 'Hộp Đĩa TM',
  key: 'Túi Đặc Biệt',
  hold: 'Vật Phẩm Giữ',
  battle: 'Chiến Đấu',
  general: 'Ngăn Chung',
};

export function getItemPocketName(category: string): string {
  return ITEM_POCKET_MAP[category] ?? 'Ngăn Chung';
}

export function filterItems(items: ItemData[], query: string): ItemData[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...items];
  }
  return items.filter((it) => {
    const nameVi = (it.nameVi || '').toLowerCase();
    const nameEn = (it.name || '').toLowerCase();
    const cat = (it.category || '').toLowerCase();
    const catName = (it.categoryName || '').toLowerCase();
    const catVi = (it.categoryVi || '').toLowerCase();
    const desc = (it.description || '').toLowerCase();
    const descVi = (it.descriptionVi || '').toLowerCase();
    return (
      nameVi.includes(q) ||
      nameEn.includes(q) ||
      cat.includes(q) ||
      catName.includes(q) ||
      catVi.includes(q) ||
      desc.includes(q) ||
      descVi.includes(q)
    );
  });
}
