export type PokemonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Grass'
  | 'Electric'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Steel'
  | 'Dark'
  | 'Fairy';

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
  total: number;
}

export type StatKey = 'hp' | 'attack' | 'defense' | 'spAtk' | 'spDef' | 'speed';
export type StatKeyWithoutHp = 'attack' | 'defense' | 'spAtk' | 'spDef' | 'speed';

export interface PokemonStatValues {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

export type NatureName =
  | 'Hardy'
  | 'Lonely'
  | 'Brave'
  | 'Adamant'
  | 'Naughty'
  | 'Bold'
  | 'Docile'
  | 'Relaxed'
  | 'Impish'
  | 'Lax'
  | 'Timid'
  | 'Hasty'
  | 'Serious'
  | 'Jolly'
  | 'Naive'
  | 'Modest'
  | 'Mild'
  | 'Quiet'
  | 'Bashful'
  | 'Rash'
  | 'Calm'
  | 'Gentle'
  | 'Sassy'
  | 'Careful'
  | 'Quirky';

export interface NatureData {
  id: NatureName;
  nameVi: string;
  increasedStat: StatKeyWithoutHp | null;
  decreasedStat: StatKeyWithoutHp | null;
  descVi: string;
}

export const NATURES_TABLE: Record<NatureName, NatureData> = {
  Hardy: {
    id: 'Hardy',
    nameVi: 'Cần cù',
    increasedStat: null,
    decreasedStat: null,
    descVi: 'Không đổi chỉ số',
  },
  Lonely: {
    id: 'Lonely',
    nameVi: 'Cô độc',
    increasedStat: 'attack',
    decreasedStat: 'defense',
    descVi: '+10% Tấn công, -10% Phòng thủ',
  },
  Brave: {
    id: 'Brave',
    nameVi: 'Dũng cảm',
    increasedStat: 'attack',
    decreasedStat: 'speed',
    descVi: '+10% Tấn công, -10% Tốc độ',
  },
  Adamant: {
    id: 'Adamant',
    nameVi: 'Cương quyết',
    increasedStat: 'attack',
    decreasedStat: 'spAtk',
    descVi: '+10% Tấn công, -10% Công ĐB',
  },
  Naughty: {
    id: 'Naughty',
    nameVi: 'Nghịch ngợm',
    increasedStat: 'attack',
    decreasedStat: 'spDef',
    descVi: '+10% Tấn công, -10% Thủ ĐB',
  },
  Bold: {
    id: 'Bold',
    nameVi: 'Táo bạo',
    increasedStat: 'defense',
    decreasedStat: 'attack',
    descVi: '+10% Phòng thủ, -10% Tấn công',
  },
  Docile: {
    id: 'Docile',
    nameVi: 'Ngoan ngoãn',
    increasedStat: null,
    decreasedStat: null,
    descVi: 'Không đổi chỉ số',
  },
  Relaxed: {
    id: 'Relaxed',
    nameVi: 'Thư thả',
    increasedStat: 'defense',
    decreasedStat: 'speed',
    descVi: '+10% Phòng thủ, -10% Tốc độ',
  },
  Impish: {
    id: 'Impish',
    nameVi: 'Tinh quái',
    increasedStat: 'defense',
    decreasedStat: 'spAtk',
    descVi: '+10% Phòng thủ, -10% Công ĐB',
  },
  Lax: {
    id: 'Lax',
    nameVi: 'Buông lỏng',
    increasedStat: 'defense',
    decreasedStat: 'spDef',
    descVi: '+10% Phòng thủ, -10% Thủ ĐB',
  },
  Timid: {
    id: 'Timid',
    nameVi: 'Nhút nhát',
    increasedStat: 'speed',
    decreasedStat: 'attack',
    descVi: '+10% Tốc độ, -10% Tấn công',
  },
  Hasty: {
    id: 'Hasty',
    nameVi: 'Hấp tấp',
    increasedStat: 'speed',
    decreasedStat: 'defense',
    descVi: '+10% Tốc độ, -10% Phòng thủ',
  },
  Serious: {
    id: 'Serious',
    nameVi: 'Nghiêm túc',
    increasedStat: null,
    decreasedStat: null,
    descVi: 'Không đổi chỉ số',
  },
  Jolly: {
    id: 'Jolly',
    nameVi: 'Vui vẻ',
    increasedStat: 'speed',
    decreasedStat: 'spAtk',
    descVi: '+10% Tốc độ, -10% Công ĐB',
  },
  Naive: {
    id: 'Naive',
    nameVi: 'Ngây thơ',
    increasedStat: 'speed',
    decreasedStat: 'spDef',
    descVi: '+10% Tốc độ, -10% Thủ ĐB',
  },
  Modest: {
    id: 'Modest',
    nameVi: 'Khiêm tốn',
    increasedStat: 'spAtk',
    decreasedStat: 'attack',
    descVi: '+10% Công ĐB, -10% Tấn công',
  },
  Mild: {
    id: 'Mild',
    nameVi: 'Ôn hòa',
    increasedStat: 'spAtk',
    decreasedStat: 'defense',
    descVi: '+10% Công ĐB, -10% Phòng thủ',
  },
  Quiet: {
    id: 'Quiet',
    nameVi: 'Trầm lặng',
    increasedStat: 'spAtk',
    decreasedStat: 'speed',
    descVi: '+10% Công ĐB, -10% Tốc độ',
  },
  Bashful: {
    id: 'Bashful',
    nameVi: 'E thẹn',
    increasedStat: null,
    decreasedStat: null,
    descVi: 'Không đổi chỉ số',
  },
  Rash: {
    id: 'Rash',
    nameVi: 'Bồng bột',
    increasedStat: 'spAtk',
    decreasedStat: 'spDef',
    descVi: '+10% Công ĐB, -10% Thủ ĐB',
  },
  Calm: {
    id: 'Calm',
    nameVi: 'Điềm tĩnh',
    increasedStat: 'spDef',
    decreasedStat: 'attack',
    descVi: '+10% Thủ ĐB, -10% Tấn công',
  },
  Gentle: {
    id: 'Gentle',
    nameVi: 'Dịu dàng',
    increasedStat: 'spDef',
    decreasedStat: 'defense',
    descVi: '+10% Thủ ĐB, -10% Phòng thủ',
  },
  Sassy: {
    id: 'Sassy',
    nameVi: 'Kiêu kì',
    increasedStat: 'spDef',
    decreasedStat: 'speed',
    descVi: '+10% Thủ ĐB, -10% Tốc độ',
  },
  Careful: {
    id: 'Careful',
    nameVi: 'Cẩn thận',
    increasedStat: 'spDef',
    decreasedStat: 'spAtk',
    descVi: '+10% Thủ ĐB, -10% Công ĐB',
  },
  Quirky: {
    id: 'Quirky',
    nameVi: 'Kỳ quặc',
    increasedStat: null,
    decreasedStat: null,
    descVi: 'Không đổi chỉ số',
  },
};

export interface PokemonSprites {
  follower: string;
  front: string;
  back: string;
  icon: string;
  frontShiny?: string;
  backShiny?: string;
  iconShiny?: string;
  cry?: string;
}

export interface PokemonSpeciesData {
  id: number;
  name: string;
  speciesKey: string;
  types: PokemonType[];
  stats: PokemonStats;
  sprites: PokemonSprites;
  // Pokédex research data (optional, scraped from pokemondb.net)
  species?: string;
  height?: number;
  weight?: number;
  ability?: string;
  catchRate?: number;
  baseFriendship?: number;
  growthRate?: string;
  evYield?: string;
  eggGroups?: string;
  genderRatio?: string;
  moves?: PokemonLearnMove[];
}

export interface PokemonLearnMove {
  level: number;
  moveId: string;
  nameEn: string;
  nameVi: string;
  type: string;
}

export interface PokemonDatabase {
  generation: number;
  count: number;
  source: string;
  pokemon: Record<string, PokemonSpeciesData>;
}

export type MoveCategory = 'physical' | 'special' | 'status';

export interface MoveStatChange {
  stat: 'attack' | 'defense' | 'spAtk' | 'spDef' | 'speed' | 'accuracy' | 'evasion';
  stages: number;
  target: 'self' | 'opponent';
  chance?: number;
}

export interface MoveStatusEffect {
  condition: 'paralysis' | 'burn' | 'poison' | 'toxic' | 'sleep' | 'freeze';
  target: 'self' | 'opponent';
  chance: number;
}

export interface MoveData {
  id: string;
  name: string;
  nameEn?: string;
  nameVi?: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  description: string;
  descriptionEn?: string;
  priority?: number;
  statChanges?: MoveStatChange[];
  statusEffect?: MoveStatusEffect;
  healPercent?: number;
  highCrit?: boolean;
}

export interface MovesDatabase {
  count: number;
  moves: Record<string, MoveData>;
}
