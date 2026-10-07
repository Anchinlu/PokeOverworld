/**
 * Pokéball Database
 * Contains catch rate multipliers and special conditions for each ball type
 */

export interface PokeballData {
  id: string;
  name: string;
  nameVi: string;
  catchRate: number; // Multiplier for catch calculation
  description: string;
  descriptionVi: string;
  // Special conditions (future implementation)
  specialConditions?: {
    timeOfDay?: 'day' | 'night'; // Dusk Ball (night), Quick Ball (first turn)
    terrain?: string[]; // Dive Ball (water), Net Ball (water/bug)
    turnCount?: number; // Timer Ball (more turns = better)
    compareLevel?: 'higher' | 'lower'; // Level Ball
  };
}

export const POKEBALL_DB: Record<string, PokeballData> = {
  POKEBALL: {
    id: 'POKEBALL',
    name: 'Poké Ball',
    nameVi: 'Bóng Poké',
    catchRate: 1.0,
    description: 'A standard Poké Ball for catching wild Pokémon.',
    descriptionVi: 'Bóng Poké tiêu chuẩn để bắt Pokémon hoang dã.',
  },
  GREATBALL: {
    id: 'GREATBALL',
    name: 'Great Ball',
    nameVi: 'Bóng Great',
    catchRate: 1.5,
    description: 'Catches wild Pokémon with 1.5x the rate of a Poké Ball.',
    descriptionVi: 'Bắt Pokémon hoang dã với tỷ lệ gấp 1.5 lần Poké Ball.',
  },
  ULTRABALL: {
    id: 'ULTRABALL',
    name: 'Ultra Ball',
    nameVi: 'Bóng Ultra',
    catchRate: 2.0,
    description: 'Catches wild Pokémon with 2x the rate of a Poké Ball.',
    descriptionVi: 'Bắt Pokémon hoang dã với tỷ lệ gấp 2 lần Poké Ball.',
  },
  MASTERBALL: {
    id: 'MASTERBALL',
    name: 'Master Ball',
    nameVi: 'Bóng Master',
    catchRate: 255.0, // Guaranteed catch (max catch rate)
    description: 'The ultimate Poké Ball. It will catch any wild Pokémon without fail.',
    descriptionVi: 'Bóng Poké tối thượng. Bắt chắc chắn mọi Pokémon hoang dã.',
  },
  SAFARIBALL: {
    id: 'SAFARIBALL',
    name: 'Safari Ball',
    nameVi: 'Bóng Safari',
    catchRate: 1.5,
    description: 'A special ball used in the Safari Zone. 1.5x catch rate.',
    descriptionVi: 'Bóng đặc biệt dùng trong Khu Safari. Tỷ lệ bắt 1.5x.',
  },
  QUICKBALL: {
    id: 'QUICKBALL',
    name: 'Quick Ball',
    nameVi: 'Bóng Quick',
    catchRate: 5.0, // 5x on first turn, 1x after
    description: 'Best used at the start of battle. 5x catch rate on first turn.',
    descriptionVi: 'Hiệu quả nhất khi dùng ngay đầu trận. Tỷ lệ bắt 5x lượt đầu.',
    specialConditions: {
      turnCount: 1,
    },
  },
  TIMERBALL: {
    id: 'TIMERBALL',
    name: 'Timer Ball',
    nameVi: 'Bóng Timer',
    catchRate: 1.0, // Increases over time: (1 + turns * 0.3) up to 4x
    description: 'More effective the longer the battle lasts. Max 4x after 10+ turns.',
    descriptionVi: 'Hiệu quả tăng theo thời gian chiến đấu. Tối đa 4x sau 10+ lượt.',
  },
  REPEATBALL: {
    id: 'REPEATBALL',
    name: 'Repeat Ball',
    nameVi: 'Bóng Repeat',
    catchRate: 3.5, // 3.5x if species already caught, 1x otherwise
    description: 'Works best on Pokémon species already caught before. 3.5x catch rate.',
    descriptionVi: 'Hiệu quả tốt với loài Pokémon đã bắt trước đó. Tỷ lệ bắt 3.5x.',
  },
  NESTBALL: {
    id: 'NESTBALL',
    name: 'Nest Ball',
    nameVi: 'Bóng Nest',
    catchRate: 1.0, // (41 - level) / 10, min 1x, max 4x for level 1
    description: 'More effective on lower-level Pokémon. Up to 4x for level 1.',
    descriptionVi: 'Hiệu quả với Pokémon cấp thấp. Tối đa 4x với cấp 1.',
  },
  NETBALL: {
    id: 'NETBALL',
    name: 'Net Ball',
    nameVi: 'Bóng Net',
    catchRate: 3.5, // 3.5x for Water and Bug types
    description: 'Effective against Water and Bug-type Pokémon. 3.5x catch rate.',
    descriptionVi: 'Hiệu quả với Pokémon hệ Nước và Bọ. Tỷ lệ bắt 3.5x.',
    specialConditions: {
      terrain: ['Water', 'Bug'],
    },
  },
  DIVEBALL: {
    id: 'DIVEBALL',
    name: 'Dive Ball',
    nameVi: 'Bóng Dive',
    catchRate: 3.5, // 3.5x when surfing or fishing
    description: 'Best for Pokémon encountered while surfing or fishing. 3.5x catch rate.',
    descriptionVi: 'Tốt nhất cho Pokémon gặp khi lướt sóng hoặc câu cá. Tỷ lệ bắt 3.5x.',
    specialConditions: {
      terrain: ['Water'],
    },
  },
  DUSKBALL: {
    id: 'DUSKBALL',
    name: 'Dusk Ball',
    nameVi: 'Bóng Dusk',
    catchRate: 3.0, // 3x at night or in caves
    description: 'Effective at night or in caves. 3x catch rate.',
    descriptionVi: 'Hiệu quả vào ban đêm hoặc trong hang động. Tỷ lệ bắt 3x.',
    specialConditions: {
      timeOfDay: 'night',
    },
  },
  LUXURYBALL: {
    id: 'LUXURYBALL',
    name: 'Luxury Ball',
    nameVi: 'Bóng Luxury',
    catchRate: 1.0,
    description: 'A comfortable ball that makes caught Pokémon friendlier. Same as Poké Ball.',
    descriptionVi: 'Bóng thoải mái giúp Pokémon thân thiện hơn. Tỷ lệ bắt như Poké Ball.',
  },
  PREMIERBALL: {
    id: 'PREMIERBALL',
    name: 'Premier Ball',
    nameVi: 'Bóng Premier',
    catchRate: 1.0,
    description: 'A commemorative ball. Same catch rate as Poké Ball.',
    descriptionVi: 'Bóng kỷ niệm. Tỷ lệ bắt như Poké Ball.',
  },
  HEALBALL: {
    id: 'HEALBALL',
    name: 'Heal Ball',
    nameVi: 'Bóng Heal',
    catchRate: 1.0,
    description: 'Fully heals caught Pokémon. Same catch rate as Poké Ball.',
    descriptionVi: 'Hồi phục hoàn toàn Pokémon bắt được. Tỷ lệ bắt như Poké Ball.',
  },
  FRIENDBALL: {
    id: 'FRIENDBALL',
    name: 'Friend Ball',
    nameVi: 'Bóng Friend',
    catchRate: 1.0,
    description: 'Makes caught Pokémon immediately friendly. Same catch rate as Poké Ball.',
    descriptionVi: 'Pokémon bắt được ngay lập tức thân thiện. Tỷ lệ bắt như Poké Ball.',
  },
  LOVEBALL: {
    id: 'LOVEBALL',
    name: 'Love Ball',
    nameVi: 'Bóng Love',
    catchRate: 8.0, // 8x if same species, opposite gender
    description: 'Best for catching Pokémon of same species and opposite gender. 8x catch rate.',
    descriptionVi: 'Tốt nhất cho Pokémon cùng loài, khác giới. Tỷ lệ bắt 8x.',
  },
  LEVELBALL: {
    id: 'LEVELBALL',
    name: 'Level Ball',
    nameVi: 'Bóng Level',
    catchRate: 1.0, // 2x if player level > target, 4x if >= 2x, 8x if >= 4x
    description: 'More effective if your Pokémon is higher level. Up to 8x catch rate.',
    descriptionVi: 'Hiệu quả nếu Pokémon của bạn cấp cao hơn. Tối đa 8x.',
    specialConditions: {
      compareLevel: 'higher',
    },
  },
  LUREBALL: {
    id: 'LUREBALL',
    name: 'Lure Ball',
    nameVi: 'Bóng Lure',
    catchRate: 4.0, // 4x for Pokémon hooked by fishing
    description: 'Best for Pokémon hooked while fishing. 4x catch rate.',
    descriptionVi: 'Tốt nhất cho Pokémon câu được. Tỷ lệ bắt 4x.',
  },
  MOONBALL: {
    id: 'MOONBALL',
    name: 'Moon Ball',
    nameVi: 'Bóng Moon',
    catchRate: 4.0, // 4x for Pokémon that evolve with Moon Stone
    description: 'Best for Pokémon that evolve with Moon Stone. 4x catch rate.',
    descriptionVi: 'Tốt nhất cho Pokémon tiến hóa bằng Đá Mặt Trăng. Tỷ lệ bắt 4x.',
  },
  HEAVYBALL: {
    id: 'HEAVYBALL',
    name: 'Heavy Ball',
    nameVi: 'Bóng Heavy',
    catchRate: 1.0, // Bonus for heavy Pokémon (+40 if > 300kg)
    description: 'Best for very heavy Pokémon. Bonus +40 for weight over 300kg.',
    descriptionVi: 'Tốt nhất cho Pokémon rất nặng. Thưởng +40 nếu trên 300kg.',
  },
  FASTBALL: {
    id: 'FASTBALL',
    name: 'Fast Ball',
    nameVi: 'Bóng Fast',
    catchRate: 4.0, // 4x for Pokémon with base speed >= 100
    description: 'Best for fast Pokémon (Speed >= 100). 4x catch rate.',
    descriptionVi: 'Tốt nhất cho Pokémon nhanh (Speed >= 100). Tỷ lệ bắt 4x.',
  },
  SPORTBALL: {
    id: 'SPORTBALL',
    name: 'Sport Ball',
    nameVi: 'Bóng Sport',
    catchRate: 1.5,
    description: 'A special ball used in Bug-Catching Contest. 1.5x catch rate.',
    descriptionVi: 'Bóng đặc biệt trong cuộc thi Bắt Bọ. Tỷ lệ bắt 1.5x.',
  },
  BEASTBALL: {
    id: 'BEASTBALL',
    name: 'Beast Ball',
    nameVi: 'Bóng Beast',
    catchRate: 5.0, // 5x for Ultra Beasts, 0.1x for others
    description: 'Designed for Ultra Beasts. 5x for Ultra Beasts, 0.1x for normal Pokémon.',
    descriptionVi: 'Thiết kế cho Ultra Beast. 5x cho Ultra Beast, 0.1x cho Pokémon thường.',
  },
  DREAMBALL: {
    id: 'DREAMBALL',
    name: 'Dream Ball',
    nameVi: 'Bóng Dream',
    catchRate: 4.0, // 4x for sleeping Pokémon
    description: 'Best for sleeping Pokémon. 4x catch rate.',
    descriptionVi: 'Tốt nhất cho Pokémon đang ngủ. Tỷ lệ bắt 4x.',
  },
  CHERISHBALL: {
    id: 'CHERISHBALL',
    name: 'Cherish Ball',
    nameVi: 'Bóng Cherish',
    catchRate: 1.0,
    description: 'A special ball for event Pokémon. Same catch rate as Poké Ball.',
    descriptionVi: 'Bóng đặc biệt cho Pokémon sự kiện. Tỷ lệ bắt như Poké Ball.',
  },
};

/**
 * Get pokeball data by ID
 */
export function getPokeballData(id: string): PokeballData | undefined {
  const normalized = id.toUpperCase().replace(/[^A-Z]/g, '');
  return POKEBALL_DB[normalized];
}

/**
 * Get catch rate multiplier for a ball
 * This is the base rate - special conditions are checked separately
 */
export function getBaseCatchRate(ballId: string): number {
  const ball = getPokeballData(ballId);
  return ball?.catchRate ?? 1.0;
}

/**
 * Calculate effective catch rate including special conditions
 * (Future: implement turn count, terrain, type checks, etc.)
 */
export function getEffectiveCatchRate(
  ballId: string,
  _context?: {
    turnCount?: number;
    terrain?: string;
    timeOfDay?: 'day' | 'night';
    targetTypes?: string[];
    targetLevel?: number;
    playerLevel?: number;
    isSleeping?: boolean;
    alreadyCaught?: boolean;
  }
): number {
  const ball = getPokeballData(ballId);
  if (!ball) return 1.0;

  // For now, just return base rate
  // TODO: Implement special condition checks based on context
  return ball.catchRate;
}
