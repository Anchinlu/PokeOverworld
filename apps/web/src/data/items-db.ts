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

  // Set of specific evolution hold items / contest scarves / gems categorized under 'general'
  const GENERAL_HOLDABLE_SLUGS = new Set([
    'dragon-scale',
    'dubious-disc',
    'electirizer',
    'magmarizer',
    'protector',
    'reaper-cloth',
    'upgrade',
    'prism-scale',
    'oval-stone',
    'sachet',
    'whipped-dream',
    'deep-sea-tooth',
    'deep-sea-scale',
    'kings-rock',
    'metal-coat',
    'razor-claw',
    'razor-fang',
    'blue-scarf',
    'green-scarf',
    'pink-scarf',
    'red-scarf',
    'yellow-scarf',
  ]);

  /**
   * Checks whether an item can be given to a Pokémon to hold.
   * Holdable items include:
   * - Category 'hold' (All competitive equipment, battle orbs, choice items, focus sash, lucky egg, type-boosters...)
   * - Category 'berries' / 'berry' (All berries, auto-consumed in battle or holding)
   * - Category 'mail' (Letters/mail)
   * - Evolution trade hold items (Dragon Scale, Electirizer, Dubious Disc, etc.) and Gems/Scarves.
   * Excludes: Key Items, Poké Balls, Medicine (Potions, Revives, Candies), Battle items (X Attack...), etc.
   */
  export function isHoldableItem(item?: ItemData | null): boolean {
    if (!item) return false;
    const cat = (item.category || '').toLowerCase();
    if (cat === 'hold' || cat === 'berries' || cat === 'berry' || cat === 'mail') {
      return true;
    }
    const slug = (item.slug || item.id || '').toLowerCase().replace(/_/g, '-');
    if (GENERAL_HOLDABLE_SLUGS.has(slug)) {
      return true;
    }
    if (slug.endsWith('-gem') || slug.endsWith('-scarf')) {
      return true;
    }
    return false;
  }

  /**
   * Checks whether an item can be used directly (either on a Pokémon, in battle, or in the overworld).
   * Usable items include:
   * - Category 'medicine' (Potions, Revives, Full Restore, Candies, Vitamins, PP Restorers)
   * - Category 'berries' / 'berry' (Eaten directly to restore HP/status/PP or reduce EVs)
   * - Category 'battle' (X Attack, X Defense, Dire Hit... used during battle turns)
   * - Category 'pokeballs' / 'ball' (Used in battle to catch wild Pokémon)
   * - Category 'machine' / 'tm' / 'hm' (Used to teach moves)
   * - Category 'key' (Key items used in overworld)
   * - Evolution stones in general (Fire Stone, Water Stone, etc.)
   * Excludes: Pure held items (Leftovers, Choice Band, Focus Sash, Rocky Helmet...) which only function when held.
   */
  export function isUsableItem(item?: ItemData | null): boolean {
    if (!item) return false;
    const cat = (item.category || '').toLowerCase();
    if (
      cat === 'medicine' ||
      cat === 'berries' ||
      cat === 'berry' ||
      cat === 'battle' ||
      cat === 'pokeballs' ||
      cat === 'ball' ||
      cat === 'machine' ||
      cat === 'tm' ||
      cat === 'hm' ||
      cat === 'key'
    ) {
      return true;
    }
    const slug = (item.slug || item.id || '').toLowerCase().replace(/_/g, '-');
    if (
      slug.endsWith('-stone') ||
      slug === 'black-augurite' ||
      slug === 'auspicious-armor' ||
      slug === 'malicious-armor' ||
      slug === 'galarica-cuff' ||
      slug === 'galarica-wreath' ||
      slug === 'metal-alloy' ||
      slug === 'escape-rope'
    ) {
      return true;
    }
    return false;
  }

  export type ItemUsageType = 'hold_only' | 'use_only' | 'both' | 'none';

  /**
   * Classifies an item into its primary usage modality:
   * - 'hold_only': Equipment meant solely for holding (Leftovers, Choice Band, Rocky Helmet, Lucky Egg...)
   * - 'use_only': Items meant solely for direct use (Potions, Revives, Poké Balls, Rare Candies...)
   * - 'both': Versatile items that can both be used directly and held for battle auto-activation (Berries...)
   * - 'none': Valuables/fossils intended for selling or specialty trades.
   */
  export function getItemUsageType(item?: ItemData | null): ItemUsageType {
    const holdable = isHoldableItem(item);
    const usable = isUsableItem(item);
    if (holdable && usable) return 'both';
    if (holdable) return 'hold_only';
    if (usable) return 'use_only';
    return 'none';
  }
