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

export type ItemDef = ItemData;

export const ITEMS_DB: Record<string, ItemData> = (
  rawItemsData as { items: Record<string, ItemData> }
).items;

export function getAllItems(): ItemData[] {
  return Object.values(ITEMS_DB);
}

export function getItemById(id: string): ItemData | undefined {
  return ITEMS_DB[id];
}

export interface BagPocketDef {
  index: number;
  id: string;
  name: string;
  nameVi: string;
  descriptionVi: string;
  categories: string[];
}

export const BAG_POCKETS: BagPocketDef[] = [
  {
    index: 0,
    id: 'items',
    name: 'Items',
    nameVi: 'VẬT PHẨM',
    descriptionVi: 'Vật phẩm thông thường, đá tiến hóa & trang bị.',
    categories: ['general', 'hold'],
  },
  {
    index: 1,
    id: 'medicine',
    name: 'Medicine',
    nameVi: 'DƯỢC PHẨM',
    descriptionVi: 'Thuốc hồi phục máu HP, hồi sinh và chữa bệnh trạng thái.',
    categories: ['medicine'],
  },
  {
    index: 2,
    id: 'pokeballs',
    name: 'Poké Balls',
    nameVi: 'BÓNG BẮT',
    descriptionVi: 'Các loại Poké Ball dùng để thu phục Pokémon hoang dã.',
    categories: ['pokeballs', 'ball'],
  },
  {
    index: 3,
    id: 'machines',
    name: 'TMs & HMs',
    nameVi: 'ĐĨA CHIÊU',
    descriptionVi: 'Đĩa máy kỹ thuật (TM/HM) dùng để dạy chiêu thức mới.',
    categories: ['machine', 'tm', 'hm'],
  },
  {
    index: 4,
    id: 'berries',
    name: 'Berries',
    nameVi: 'QUẢ MỌNG',
    descriptionVi: 'Các loại quả mọng tự nhiên thu hái từ cây bụi sinh thái.',
    categories: ['berries', 'berry'],
  },
  {
    index: 5,
    id: 'mail',
    name: 'Mail',
    nameVi: 'THƯ TỪ',
    descriptionVi: 'Thư viết để gửi gắm cho Pokémon cầm theo.',
    categories: ['mail'],
  },
  {
    index: 6,
    id: 'battle',
    name: 'Battle Items',
    nameVi: 'TRẬN ĐẤU',
    descriptionVi: 'Vật phẩm tăng cường chỉ số tạm thời khi chiến đấu.',
    categories: ['battle'],
  },
  {
    index: 7,
    id: 'key',
    name: 'Key Items',
    nameVi: 'QUAN TRỌNG',
    descriptionVi: 'Các công cụ, giấy tờ và vật phẩm phiêu lưu cốt lõi.',
    categories: ['key'],
  },
];

export function getItemPocketIndex(item: ItemData): number {
  const cat = (item.category || '').toLowerCase();
  const pocket = BAG_POCKETS.find((p) => p.categories.includes(cat));
  return pocket ? pocket.index : 0;
}

export function findItem(idOrSlug: string): ItemData | undefined {
  if (!idOrSlug) return undefined;
  const direct = ITEMS_DB[idOrSlug];
  if (direct) return direct;

  const normalized = idOrSlug.toLowerCase().replace(/_/g, '-');
  if (ITEMS_DB[normalized]) return ITEMS_DB[normalized];

  return Object.values(ITEMS_DB).find(
    (it) =>
      it.id.toLowerCase() === normalized ||
      it.slug?.toLowerCase() === normalized ||
      it.filename.toLowerCase() === `${normalized}.png` ||
      it.filename.toLowerCase() === `${idOrSlug.toLowerCase()}.png`
  );
}
