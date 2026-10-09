import type {
  BattlerPokemon,
  BattlerSide,
  BattleEvent,
  BattleMove,
  StatusCondition,
  BattleEnvironment,
} from '../types';
import type { BattleRng } from '../battle-rng';
import { BattleEventFactory } from '../state/battle-event-factory';
import {
  applyDamage,
  restoreHp,
  applyStatStageChange,
  setStatusCondition,
  clearStatusCondition,
  STAT_NAME_VI,
} from '../state/battle-state-reducer';

export const ABILITY_NAMES_VI: Record<string, string> = {
  overgrow: 'Tươi Tốt',
  blaze: 'Lửa Cháy',
  torrent: 'Dòng Nước Xiết',
  swarm: 'Bầy Côn Trùng',
  intimidate: 'Đe Dọa',
  drizzle: 'Mưa Rào',
  drought: 'Hạn Hán',
  sandstream: 'Bão Cát',
  snowwarning: 'Tuyết Rơi',
  electricsurge: 'Điện Trường',
  grassysurge: 'Thảm Cỏ',
  mistysurge: 'Sương Mù',
  psychicsurge: 'Trường Tâm Linh',
  static: 'Tĩnh Điện',
  poisonpoint: 'Gai Độc',
  flamebody: 'Thân Bỏng',
  roughskin: 'Da Gai Góc',
  ironbarbs: 'Gai Sắt',
  cutecharm: 'Quyến Rũ',
  effectspore: 'Bào Tử Nấm',
  cursedbody: 'Lời Nguyền Xác Thịt',
  levitate: 'Bay Lượn',
  flashfire: 'Ngọn Lửa Bốc Cháy',
  waterabsorb: 'Hấp Thụ Nước',
  voltabsorb: 'Hấp Thụ Điện',
  lightningrod: 'Cột Thu Lôi',
  motordrive: 'Động Cơ Điện',
  sapsipper: 'Hút Nhựa Cây',
  wonderguard: 'Vệ Tinh Bí Ẩn',
  hugepower: 'Sức Mạnh Khổng Lồ',
  purepower: 'Thuần Khí Lực',
  guts: 'Dũng Khí',
  technician: 'Kỹ Thuật Viên',
  sniper: 'Xạ Thủ',
  superluck: 'May Mắn Tột Đỉnh',
  adaptability: 'Thích Nghi',
  ironfist: 'Nắm Đấm Thép',
  sheerforce: 'Lực Lượng Thuần Khiết',
  thickfat: 'Lớp Mỡ Dày',
  solidrock: 'Đá Cứng',
  filter: 'Màn Lọc',
  multiscale: 'Vảy Đa Lớp',
  shellarmor: 'Giáp Vỏ Cứng',
  battlearmor: 'Giáp Chiến Đấu',
  sturdy: 'Vững Chãi',
  rockhead: 'Đầu Đá',
  magicguard: 'Lá Chắn Ma Thuật',
  soundproof: 'Cách Âm',
  immunity: 'Miễn Dịch Độc',
  limber: 'Khớp Dẻo',
  waterveil: 'Màn Nước',
  magmaarmor: 'Giáp Dung Nham',
  insomnia: 'Mất Ngủ',
  vitalspirit: 'Ý Chí Mãnh Liệt',
  owntempo: 'Nhịp Điệu Riêng',
  oblivious: 'Vô Cảm',
  innerfocus: 'Tinh Thần Bất Khuất',
  naturalcure: 'Liệu Pháp Tự Nhiên',
  poisonheal: 'Hồi Phục Độc Tố',
  shedskin: 'Lột Xác',
  earlybird: 'Chim Dậy Sớm',
  clearbody: 'Thân Thể Tinh Khiết',
  whitesmoke: 'Khói Trắng',
  hypercutter: 'Càng Cắt Siêu Đẳng',
  keeneye: 'Mắt Sắc Lẹm',
  defiant: 'Bất Khuất',
  competitive: 'Cạnh Tranh',
  speedboost: 'Tăng Tốc Độ',
  moxie: 'Tự Tin Chiến Thắng',
  synchronize: 'Đồng Bộ Hóa',
  compoundeyes: 'Mắt Kép',
  shielddust: 'Bụi Bảo Vệ',
  damp: 'Ẩm Ướt',
  trace: 'Sao Chép Năng Lực',
  pressure: 'Áp Lực',
  download: 'Tải Dữ Liệu',
  runaway: 'Bỏ Chạy',
  swiftswim: 'Bơi Nhanh',
  chlorophyll: 'Diệp Lục',
  sandveil: 'Màn Cát',
  sandrush: 'Lướt Cát',
  sandforce: 'Lực Lượng Cát',
  slushrush: 'Lướt Băng Tuyết',
  snowcloak: 'Áo Tuyết',
  icebody: 'Thân Băng Giá',
  overcoat: 'Áo Choàng Bảo Vệ',
  none: 'Không có',
};

export const ABILITY_DESCRIPTIONS_VI: Record<string, string> = {
  overgrow: 'Tăng 50% sát thương chiêu hệ Cỏ khi HP dưới 1/3.',
  blaze: 'Tăng 50% sát thương chiêu hệ Lửa khi HP dưới 1/3.',
  torrent: 'Tăng 50% sát thương chiêu hệ Nước khi HP dưới 1/3.',
  swarm: 'Tăng 50% sát thương chiêu hệ Côn trùng khi HP dưới 1/3.',
  intimidate: 'Hạ 1 bậc Tấn công của đối thủ khi xuất trận.',
  drizzle: 'Tạo mưa rào ngay khi bước vào chiến trận.',
  drought: 'Tạo ánh nắng chói chang khi bước vào trận.',
  sandstream: 'Tạo bão cát ngay khi bước vào trận.',
  snowwarning: 'Tạo mưa tuyết ngay khi bước vào trận.',
  electricsurge: 'Trải thảm Điện Trường khi xuất trận.',
  grassysurge: 'Trải thảm Cỏ Grassy Terrain khi xuất trận.',
  mistysurge: 'Trải thảm Sương Mù Misty Terrain khi xuất trận.',
  psychicsurge: 'Trải thảm Tâm Linh Psychic Terrain khi xuất trận.',
  static: '30% cơ hội gây Tê liệt cho đối thủ khi bị đòn tiếp xúc.',
  poisonpoint: '30% cơ hội gây Độc cho đối thủ khi bị đòn tiếp xúc.',
  flamebody: '30% cơ hội gây Bỏng cho đối thủ khi bị đòn tiếp xúc.',
  roughskin: 'Làm mất 1/8 HP của đối thủ khi nhận đòn tiếp xúc.',
  ironbarbs: 'Làm mất 1/8 HP của kẻ tấn công bằng đòn tiếp xúc.',
  cutecharm: '30% làm đối thủ mê hoặc khi nhận đòn tiếp xúc.',
  effectspore: '30% gây Ngủ, Độc hoặc Tê liệt khi bị đòn tiếp xúc.',
  cursedbody: '30% cơ hội khóa chiêu của đối thủ khi bị đánh trúng.',
  levitate: 'Bay lượn, miễn nhiễm hoàn toàn chiêu thức hệ Đất.',
  flashfire: 'Hấp thụ chiêu Lửa để tăng 50% uy lực chiêu hệ Lửa.',
  waterabsorb: 'Hấp thụ chiêu Nước để hồi phục 1/4 lượng HP tối đa.',
  voltabsorb: 'Hấp thụ chiêu Điện để hồi phục 1/4 lượng HP tối đa.',
  lightningrod: 'Thu hút và hấp thụ chiêu Điện, tăng Công ĐB.',
  motordrive: 'Hấp thụ chiêu Điện để tăng 1 bậc Tốc độ.',
  sapsipper: 'Hấp thụ chiêu Cỏ để tăng 1 bậc Tấn công.',
  wonderguard: 'Chỉ nhận sát thương từ các chiêu siêu hiệu quả.',
  hugepower: 'Gấp đôi chỉ số Tấn công vật lý của Pokémon.',
  purepower: 'Gấp đôi chỉ số Tấn công vật lý của Pokémon.',
  guts: 'Tăng 50% Tấn công khi bị trạng thái bất lợi.',
  technician: 'Tăng 50% uy lực các chiêu có Power từ 60 trở xuống.',
  sniper: 'Tăng sát thương đòn chí mạng lên 2.25 lần.',
  superluck: 'Tăng tỉ lệ đánh trúng đòn chí mạng.',
  adaptability: 'Tăng thưởng hệ đồng chất (STAB) từ 1.5x lên 2.0x.',
  ironfist: 'Tăng 20% uy lực cho các chiêu thức đấm.',
  sheerforce: 'Tăng 30% sát thương, loại bỏ hiệu ứng phụ của chiêu.',
  thickfat: 'Giảm 50% sát thương nhận vào từ chiêu Lửa và Băng.',
  solidrock: 'Giảm 25% sát thương từ chiêu siêu hiệu quả.',
  filter: 'Giảm 25% sát thương từ chiêu siêu hiệu quả.',
  multiscale: 'Giảm 50% sát thương nhận vào khi HP đang đầy 100%.',
  shellarmor: 'Giáp vỏ bảo vệ, chặn đối thủ đánh đòn chí mạng.',
  battlearmor: 'Giáp chiến bảo vệ, chặn đối thủ đánh đòn chí mạng.',
  sturdy: 'Không thể bị hạ gục chỉ với 1 đòn khi đầy máu.',
  rockhead: 'Không bị mất máu phản hồi từ các chiêu thức giật lại.',
  magicguard: 'Miễn nhiễm mọi sát thương gián tiếp ngoài đòn tấn công.',
  soundproof: 'Miễn nhiễm hoàn toàn với các chiêu thức âm thanh.',
  immunity: 'Miễn dịch hoàn toàn với trạng thái Trúng Độc.',
  limber: 'Khớp dẻo, miễn dịch hoàn toàn với trạng thái Tê Liệt.',
  waterveil: 'Màn nước bao bọc, miễn dịch với trạng thái Bị Bỏng.',
  magmaarmor: 'Dung nham bao bọc, miễn dịch với trạng thái Đóng Băng.',
  insomnia: 'Miễn dịch hoàn toàn với trạng thái Rơi Vào Giấc Ngủ.',
  vitalspirit: 'Ý chí mãnh liệt, không thể bị rơi vào giấc ngủ.',
  owntempo: 'Nhịp điệu tự nhiên, không thể bị Rối Loạn.',
  oblivious: 'Vô cảm, miễn nhiễm với quyến rũ và khiêu khích.',
  innerfocus: 'Tập trung cao độ, không bao giờ bị nao núng.',
  naturalcure: 'Tự động hóa giải mọi trạng thái bất lợi khi rút lui.',
  poisonheal: 'Hồi 1/8 HP tối đa mỗi lượt thay vì mất máu khi trúng độc.',
  shedskin: '33% cơ hội tự chữa lành trạng thái sau mỗi lượt đi.',
  earlybird: 'Thức dậy sau giấc ngủ nhanh gấp đôi bình thường.',
  clearbody: 'Ngăn chặn đối thủ làm giảm các bậc chỉ số.',
  whitesmoke: 'Khói trắng bảo vệ, ngăn đối thủ làm giảm chỉ số.',
  hypercutter: 'Ngăn chặn đối thủ làm hạ chỉ số Tấn công.',
  keeneye: 'Ngăn đối thủ hạ Độ chính xác và bỏ qua né tránh đối phương.',
  defiant: 'Tăng 2 bậc Tấn công khi bị đối thủ làm hạ chỉ số.',
  competitive: 'Tăng 2 bậc Công ĐB khi bị đối thủ làm hạ chỉ số.',
  speedboost: 'Tăng 1 bậc Tốc độ vào cuối mỗi lượt đấu.',
  moxie: 'Tăng 1 bậc Tấn công mỗi khi hạ gục một mục tiêu.',
  synchronize: 'Lây ngược trạng thái Bỏng, Độc, Tê Liệt sang đối thủ.',
  compoundeyes: 'Mắt kép giúp tăng 30% độ chính xác của chiêu thức.',
  shielddust: 'Chặn đứng các hiệu ứng phụ cộng thêm từ chiêu đối phương.',
  damp: 'Làm ẩm ướt chiến trường, ngăn chặn các chiêu tự phát nổ.',
  trace: 'Sao chép đặc tính của đối thủ khi xuất trận.',
  pressure: 'Khiến đối thủ tiêu hao gấp đôi PP khi nhắm đòn vào mình.',
  download: 'Tự tăng Công hoặc Công ĐB tùy theo phòng thủ đối phương.',
  runaway: 'Luôn luôn chạy trốn thành công khỏi Pokémon hoang dã.',
  swiftswim: 'Tăng gấp đôi chỉ số Tốc độ khi trời đang Mưa.',
  chlorophyll: 'Tăng gấp đôi chỉ số Tốc độ khi trời đang Nắng gắt.',
  sandveil: 'Tăng né tránh thêm 20% khi đứng trong Bão Cát.',
  sandrush: 'Tăng gấp đôi chỉ số Tốc độ khi đứng trong Bão Cát.',
  sandforce: 'Tăng 30% sát thương chiêu Đất, Đá, Thép trong Bão Cát.',
  slushrush: 'Tăng gấp đôi chỉ số Tốc độ khi trời Mưa Đá.',
  snowcloak: 'Tăng né tránh thêm 20% khi trời Mưa Đá.',
  icebody: 'Hồi phục 1/16 lượng HP tối đa mỗi lượt trong Mưa Đá.',
  overcoat: 'Miễn nhiễm chiêu bào tử/bột và sát thương thời tiết.',
  none: 'Pokémon này chưa có đặc tính.',
};

export interface AbilityDisplayInfo {
  id: string;
  name: string;
  nameVi: string;
  fullName: string;
  descVi: string;
}

/**
 * Returns formatted Ability details (English name, Vietnamese name, combined display, and description).
 */
export function getAbilityDisplay(ability?: string): AbilityDisplayInfo {
  if (!ability || ability.toLowerCase() === 'none') {
    return {
      id: 'none',
      name: 'None',
      nameVi: 'Không có',
      fullName: 'Không có',
      descVi: 'Pokémon này chưa có đặc tính.',
    };
  }

  const key = AbilityEngine.normalize(ability);
  const nameVi = ABILITY_NAMES_VI[key] || ability;
  const descVi = ABILITY_DESCRIPTIONS_VI[key] || 'Đặc tính của Pokémon.';

  return {
    id: key,
    name: ability,
    nameVi,
    fullName: nameVi.toLowerCase() !== ability.toLowerCase() ? `${nameVi} (${ability})` : nameVi,
    descVi,
  };
}

export const PUNCH_MOVE_IDS = new Set([
  'comet_punch',
  'mega_punch',
  'fire_punch',
  'ice_punch',
  'thunder_punch',
  'mach_punch',
  'bullet_punch',
  'shadow_punch',
  'focus_punch',
  'drain_punch',
  'hammer_arm',
  'meteor_mash',
  'power_up_punch',
  'plasma_fists',
  'surging_strikes',
  'wicked_blow',
  'dizzy_punch',
  'dynamic_punch',
]);

export const SOUND_MOVE_IDS = new Set([
  'growl',
  'roar',
  'sing',
  'supersonic',
  'screech',
  'snore',
  'uproar',
  'hyper_voice',
  'grass_whistle',
  'metal_sound',
  'bug_buzz',
  'chatter',
  'round',
  'echoed_voice',
  'relic_song',
  'snarl',
  'disarming_voice',
  'boomburst',
  'confide',
  'clanging_scales',
  'clangorous_soul',
  'overdrive',
]);

export const NON_CONTACT_PHYSICAL_MOVES = new Set([
  'earthquake',
  'magnitude',
  'bulldoze',
  'rock_slide',
  'stone_edge',
  'rock_tomb',
  'rock_blast',
  'bonemerang',
  'bone_rush',
  'bone_club',
  'bullet_seed',
  'razor_leaf',
  'seed_bomb',
  'icicle_spear',
  'icicle_crash',
  'diamond_storm',
  'thousand_arrows',
  'thousand_waves',
  'land_s_wrath',
  'relic_song',
  'sacred_fire',
]);

export const CONTACT_SPECIAL_MOVES = new Set([
  'grass_knot',
  'petal_dance',
  'wring_out',
  'infestation',
  'draining_kiss',
  'trump_card',
]);

/**
 * Checks if a move makes physical contact with the defender.
 */
export function isContactMove(move: BattleMove): boolean {
  const id = move.id.toLowerCase();
  if (NON_CONTACT_PHYSICAL_MOVES.has(id)) return false;
  if (CONTACT_SPECIAL_MOVES.has(id)) return true;
  return move.category === 'physical';
}

/**
 * Checks if a move is a punch move (boosted by Iron Fist).
 */
export function isPunchMove(move: BattleMove): boolean {
  return PUNCH_MOVE_IDS.has(move.id.toLowerCase());
}

/**
 * Checks if a move is a sound move (blocked by Soundproof).
 */
export function isSoundMove(move: BattleMove): boolean {
  return SOUND_MOVE_IDS.has(move.id.toLowerCase());
}

export class AbilityEngine {
  /**
   * Normalizes an ability name to a lowercase identifier without whitespace or dashes.
   */
  public static normalize(ability?: string | null): string {
    if (!ability) return 'none';
    return ability.toLowerCase().replace(/[\s\-_]/g, '');
  }

  /**
   * Returns the friendly Vietnamese display name for an ability.
   */
  public static getDisplayName(ability?: string | null): string {
    const key = this.normalize(ability);
    return ABILITY_NAMES_VI[key] ?? ability ?? 'Đặc Tính';
  }

  /**
   * Triggered when a Pokémon switches in or enters combat.
   */
  public static onSwitchIn(
    pokemon: BattlerPokemon,
    side: BattlerSide,
    opponent: BattlerPokemon,
    opponentSide: BattlerSide,
    _rng: BattleRng,
    events: BattleEvent[],
    environment?: BattleEnvironment
  ): string[] {
    const key = this.normalize(pokemon.ability);
    const messages: string[] = [];
    const nameVi = this.getDisplayName(pokemon.ability);

    // 1. Intimidate: lowers opponent's Attack by 1 stage
    if (key === 'intimidate' && opponent.currentHp > 0) {
      const oppKey = this.normalize(opponent.ability);
      const isOppProtected =
        oppKey === 'clearbody' || oppKey === 'whitesmoke' || oppKey === 'hypercutter';

      if (isOppProtected) {
        const oppNameVi = this.getDisplayName(opponent.ability);
        const msg = `${pokemon.name} kích hoạt [${nameVi}]! Nhưng ${opponent.name} nhờ [${oppNameVi}] ngăn cản giảm Sức tấn công!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            opponentSide,
            opponent.name,
            opponent.ability || oppKey,
            oppNameVi,
            'Chặn giảm chỉ số',
            msg
          )
        );
      } else {
        const currentStage = opponent.statStages?.attack ?? 0;
        if (currentStage > -6) {
          const newStage = applyStatStageChange(opponent, 'attack', -1);
          const msg = `${pokemon.name} kích hoạt [${nameVi}]! Sức tấn công của ${opponent.name} bị giảm!`;
          messages.push(msg);
          events.push(
            BattleEventFactory.abilityTriggered(
              side,
              pokemon.name,
              pokemon.ability || key,
              nameVi,
              'Giảm Attack đối thủ',
              msg
            )
          );
          events.push(
            BattleEventFactory.statStageChanged(
              opponentSide,
              opponent.name,
              'attack',
              -1,
              newStage,
              msg
            )
          );

          // Defiant / Competitive triggers on stat reduction
          if (oppKey === 'defiant') {
            const oppBoost = applyStatStageChange(opponent, 'attack', 2);
            const defiantMsg = `${opponent.name} kích hoạt [${this.getDisplayName(opponent.ability)}] và tăng mạnh Tấn công!`;
            messages.push(defiantMsg);
            events.push(
              BattleEventFactory.statStageChanged(
                opponentSide,
                opponent.name,
                'attack',
                2,
                oppBoost,
                defiantMsg
              )
            );
          } else if (oppKey === 'competitive') {
            const oppBoost = applyStatStageChange(opponent, 'spAtk', 2);
            const compMsg = `${opponent.name} kích hoạt [${this.getDisplayName(opponent.ability)}] và tăng mạnh Công ĐB!`;
            messages.push(compMsg);
            events.push(
              BattleEventFactory.statStageChanged(
                opponentSide,
                opponent.name,
                'spAtk',
                2,
                oppBoost,
                compMsg
              )
            );
          }
        }
      }
    }

    // 2. Trace: copies opponent's ability
    if (key === 'trace' && opponent.currentHp > 0) {
      const oppKey = this.normalize(opponent.ability);
      if (oppKey !== 'trace' && oppKey !== 'none') {
        pokemon.ability = opponent.ability;
        const msg = `${pokemon.name} kích hoạt [${nameVi}] và sao chép [${this.getDisplayName(opponent.ability)}] của ${opponent.name}!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            side,
            pokemon.name,
            'Trace',
            nameVi,
            `Sao chép ${opponent.ability}`,
            msg
          )
        );
      }
    }

    // 3. Download: raises Attack or Sp. Atk based on opponent's defenses
    if (key === 'download' && opponent.currentHp > 0) {
      const oppDef = opponent.stats.defense;
      const oppSpDef = opponent.stats.spDef;
      const boostStat = oppDef < oppSpDef ? 'attack' : 'spAtk';
      const newStage = applyStatStageChange(pokemon, boostStat, 1);
      const statNameVi = STAT_NAME_VI[boostStat] || boostStat;
      const msg = `${pokemon.name} kích hoạt [${nameVi}] và tăng ${statNameVi}!`;
      messages.push(msg);
      events.push(
        BattleEventFactory.abilityTriggered(
          side,
          pokemon.name,
          pokemon.ability || key,
          nameVi,
          `Tăng ${statNameVi}`,
          msg
        )
      );
      events.push(
        BattleEventFactory.statStageChanged(side, pokemon.name, boostStat, 1, newStage, msg)
      );
    }

    // 4. Pressure: exerts pressure on opponent
    if (key === 'pressure') {
      const msg = `${pokemon.name} đang tỏa ra [${nameVi}] áp lực ngột ngạt!`;
      messages.push(msg);
      events.push(
        BattleEventFactory.abilityTriggered(
          side,
          pokemon.name,
          pokemon.ability || key,
          nameVi,
          'Áp lực đối thủ',
          msg
        )
      );
    }

    // 5. Weather switch-in abilities
    if (environment) {
      if (key === 'drizzle' && environment.weather?.type !== 'rain') {
        environment.weather = { type: 'rain', turnsLeft: 5 };
        const msg = `${pokemon.name} kích hoạt [${nameVi}] làm cơn mưa bắt đầu rơi!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            side,
            pokemon.name,
            pokemon.ability || key,
            nameVi,
            'Gọi mưa',
            msg
          )
        );
      } else if (key === 'drought' && environment.weather?.type !== 'sun') {
        environment.weather = { type: 'sun', turnsLeft: 5 };
        const msg = `${pokemon.name} kích hoạt [${nameVi}] làm ánh mặt trời trở nên gay gắt!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            side,
            pokemon.name,
            pokemon.ability || key,
            nameVi,
            'Gọi nắng',
            msg
          )
        );
      } else if (key === 'sandstream' && environment.weather?.type !== 'sandstorm') {
        environment.weather = { type: 'sandstorm', turnsLeft: 5 };
        const msg = `${pokemon.name} kích hoạt [${nameVi}] làm bão cát nổi lên dữ dội!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            side,
            pokemon.name,
            pokemon.ability || key,
            nameVi,
            'Gọi bão cát',
            msg
          )
        );
      } else if (key === 'snowwarning' && environment.weather?.type !== 'hail') {
        environment.weather = { type: 'hail', turnsLeft: 5 };
        const msg = `${pokemon.name} kích hoạt [${nameVi}] làm mưa tuyết bắt đầu rơi!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            side,
            pokemon.name,
            pokemon.ability || key,
            nameVi,
            'Gọi tuyết',
            msg
          )
        );
      }

      // 6. Terrain switch-in abilities
      if (key === 'electricsurge' && environment.terrain?.type !== 'electric') {
        environment.terrain = { type: 'electric', turnsLeft: 5 };
        const msg = `${pokemon.name} kích hoạt [${nameVi}] làm điện trường bao phủ mặt đất!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            side,
            pokemon.name,
            pokemon.ability || key,
            nameVi,
            'Tạo điện trường',
            msg
          )
        );
      } else if (key === 'grassysurge' && environment.terrain?.type !== 'grassy') {
        environment.terrain = { type: 'grassy', turnsLeft: 5 };
        const msg = `${pokemon.name} kích hoạt [${nameVi}] làm thảm cỏ xanh tươi tốt mọc lên!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            side,
            pokemon.name,
            pokemon.ability || key,
            nameVi,
            'Tạo thảm cỏ',
            msg
          )
        );
      } else if (key === 'mistysurge' && environment.terrain?.type !== 'misty') {
        environment.terrain = { type: 'misty', turnsLeft: 5 };
        const msg = `${pokemon.name} kích hoạt [${nameVi}] làm sương mù giăng kín mặt đất!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            side,
            pokemon.name,
            pokemon.ability || key,
            nameVi,
            'Tạo sương mù',
            msg
          )
        );
      } else if (key === 'psychicsurge' && environment.terrain?.type !== 'psychic') {
        environment.terrain = { type: 'psychic', turnsLeft: 5 };
        const msg = `${pokemon.name} kích hoạt [${nameVi}] làm trường tâm linh bao phủ mặt đất!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            side,
            pokemon.name,
            pokemon.ability || key,
            nameVi,
            'Tạo trường tâm linh',
            msg
          )
        );
      }
    }

    return messages;
  }

  /**
   * Checks if the defender's ability grants total immunity or absorbs the move.
   */
  public static checkTypeImmunity(
    _attacker: BattlerPokemon,
    defender: BattlerPokemon,
    defenderSide: BattlerSide,
    move: BattleMove,
    typeEffectiveness: number,
    events: BattleEvent[]
  ): { isImmune: boolean; message?: string } {
    const key = this.normalize(defender.ability);
    const nameVi = this.getDisplayName(defender.ability);

    // Levitate: Ground immunity
    if (key === 'levitate' && move.type === 'Ground') {
      const msg = `${defender.name} né tránh hoàn toàn đòn ${move.name} nhờ [${nameVi}]!`;
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          defender.ability || key,
          nameVi,
          'Miễn nhiễm hệ Ground',
          msg
        )
      );
      return { isImmune: true, message: msg };
    }

    // Flash Fire: Fire immunity + Fire attack boost
    if (key === 'flashfire' && move.type === 'Fire') {
      defender.flashFireBoost = true;
      const msg = `${defender.name} kích hoạt [${nameVi}] và hấp thụ ngọn lửa để cường hóa sức mạnh!`;
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          defender.ability || key,
          nameVi,
          'Hấp thụ hệ Fire',
          msg
        )
      );
      return { isImmune: true, message: msg };
    }

    // Water Absorb / Dry Skin: Water immunity + 25% HP heal
    if ((key === 'waterabsorb' || key === 'dryskin') && move.type === 'Water') {
      const healAmount = Math.max(1, Math.floor(defender.maxHp * 0.25));
      const actualHeal = restoreHp(defender, healAmount);
      const msg = `${defender.name} kích hoạt [${nameVi}] hấp thụ dòng nước và hồi phục ${actualHeal} HP!`;
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          defender.ability || key,
          nameVi,
          'Hấp thụ hệ Water',
          msg
        )
      );
      events.push(
        BattleEventFactory.hpRestored(
          defenderSide,
          defender.name,
          actualHeal,
          defender.currentHp,
          defender.maxHp,
          'move',
          msg
        )
      );
      return { isImmune: true, message: msg };
    }

    // Volt Absorb: Electric immunity + 25% HP heal
    if (key === 'voltabsorb' && move.type === 'Electric') {
      const healAmount = Math.max(1, Math.floor(defender.maxHp * 0.25));
      const actualHeal = restoreHp(defender, healAmount);
      const msg = `${defender.name} kích hoạt [${nameVi}] hấp thụ điện năng và hồi phục ${actualHeal} HP!`;
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          defender.ability || key,
          nameVi,
          'Hấp thụ hệ Electric',
          msg
        )
      );
      events.push(
        BattleEventFactory.hpRestored(
          defenderSide,
          defender.name,
          actualHeal,
          defender.currentHp,
          defender.maxHp,
          'move',
          msg
        )
      );
      return { isImmune: true, message: msg };
    }

    // Lightning Rod: Electric immunity + +1 Sp. Atk
    if (key === 'lightningrod' && move.type === 'Electric') {
      const newStage = applyStatStageChange(defender, 'spAtk', 1);
      const msg = `${defender.name} kích hoạt [${nameVi}] hấp thụ điện và tăng Công ĐB!`;
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          defender.ability || key,
          nameVi,
          'Hấp thụ Electric tăng Sp. Atk',
          msg
        )
      );
      events.push(
        BattleEventFactory.statStageChanged(defenderSide, defender.name, 'spAtk', 1, newStage, msg)
      );
      return { isImmune: true, message: msg };
    }

    // Motor Drive: Electric immunity + +1 Speed
    if (key === 'motordrive' && move.type === 'Electric') {
      const newStage = applyStatStageChange(defender, 'speed', 1);
      const msg = `${defender.name} kích hoạt [${nameVi}] hấp thụ điện và tăng Tốc độ!`;
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          defender.ability || key,
          nameVi,
          'Hấp thụ Electric tăng Speed',
          msg
        )
      );
      events.push(
        BattleEventFactory.statStageChanged(defenderSide, defender.name, 'speed', 1, newStage, msg)
      );
      return { isImmune: true, message: msg };
    }

    // Sap Sipper: Grass immunity + +1 Attack
    if (key === 'sapsipper' && move.type === 'Grass') {
      const newStage = applyStatStageChange(defender, 'attack', 1);
      const msg = `${defender.name} kích hoạt [${nameVi}] hấp thụ chiêu thức Cỏ và tăng Tấn công!`;
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          defender.ability || key,
          nameVi,
          'Hấp thụ Grass tăng Attack',
          msg
        )
      );
      events.push(
        BattleEventFactory.statStageChanged(defenderSide, defender.name, 'attack', 1, newStage, msg)
      );
      return { isImmune: true, message: msg };
    }

    // Soundproof: blocks sound-based moves
    if (key === 'soundproof' && isSoundMove(move)) {
      const msg = `${defender.name} nhờ [${nameVi}] hoàn toàn không bị ảnh hưởng bởi chiêu thức âm thanh!`;
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          defender.ability || key,
          nameVi,
          'Chặn Sound moves',
          msg
        )
      );
      return { isImmune: true, message: msg };
    }

    // Wonder Guard: only takes damage from Super Effective attacks
    if (key === 'wonderguard' && move.category !== 'status' && typeEffectiveness <= 1.0) {
      const msg = `${defender.name} nhờ [${nameVi}] ngăn chặn toàn bộ sát thương không khắc chế!`;
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          defender.ability || key,
          nameVi,
          'Chặn đòn không khắc hệ',
          msg
        )
      );
      return { isImmune: true, message: msg };
    }

    return { isImmune: false };
  }

  /**
   * Modifies the raw combat stat (Attack, Sp. Atk, etc.) of an attacker.
   */
  public static getAttackerStatMultiplier(
    attacker: BattlerPokemon,
    stat: 'attack' | 'spAtk' | 'defense' | 'spDef' | 'speed'
  ): number {
    const key = this.normalize(attacker.ability);

    // Huge Power & Pure Power: double Attack
    if ((key === 'hugepower' || key === 'purepower') && stat === 'attack') {
      return 2.0;
    }

    // Guts: +50% Attack when afflicted by any status condition
    if (key === 'guts' && stat === 'attack' && attacker.status && attacker.status !== 'none') {
      return 1.5;
    }

    return 1.0;
  }

  /**
   * Evaluates offensive damage multipliers from the attacker's ability.
   */
  public static getAttackerDamageMultiplier(
    attacker: BattlerPokemon,
    _defender: BattlerPokemon,
    move: BattleMove
  ): { multiplier: number; reason?: string } {
    const key = this.normalize(attacker.ability);
    let mult = 1.0;
    let reason: string | undefined;

    const isLowHp = attacker.currentHp <= Math.floor(attacker.maxHp / 3);

    // Overgrow: +50% Grass damage when HP <= 1/3
    if (key === 'overgrow' && move.type === 'Grass' && isLowHp) {
      mult *= 1.5;
      reason = 'Tươi Tốt tăng sức mạnh đòn hệ Cỏ!';
    }

    // Blaze: +50% Fire damage when HP <= 1/3
    if (key === 'blaze' && move.type === 'Fire' && isLowHp) {
      mult *= 1.5;
      reason = 'Lửa Cháy bùng nổ sức mạnh đòn hệ Lửa!';
    }

    // Torrent: +50% Water damage when HP <= 1/3
    if (key === 'torrent' && move.type === 'Water' && isLowHp) {
      mult *= 1.5;
      reason = 'Dòng Nước Xiết gia tăng uy lực đòn hệ Nước!';
    }

    // Swarm: +50% Bug damage when HP <= 1/3
    if (key === 'swarm' && move.type === 'Bug' && isLowHp) {
      mult *= 1.5;
      reason = 'Bầy Côn Trùng gia tăng uy lực đòn hệ Sâu!';
    }

    // Technician: +50% damage for moves with Base Power <= 60
    if (key === 'technician' && move.power > 0 && move.power <= 60) {
      mult *= 1.5;
      reason = 'Kỹ Thuật Viên tăng sức mạnh cho chiêu thức!';
    }

    // Iron Fist: +20% damage for punch moves
    if (key === 'ironfist' && isPunchMove(move)) {
      mult *= 1.2;
      reason = 'Nắm Đấm Thép gia tăng uy lực cú đấm!';
    }

    // Flash Fire boost: +50% Fire damage if previously activated
    if (attacker.flashFireBoost && move.type === 'Fire') {
      mult *= 1.5;
      reason = 'Ngọn Lửa Bốc Cháy tăng sức mạnh đòn Lửa!';
    }

    // Sheer Force: +30% damage for moves with secondary effects
    if (
      key === 'sheerforce' &&
      (move.statusEffect || (move.statChanges && move.statChanges.length > 0))
    ) {
      mult *= 1.3;
      reason = 'Lực Lượng Thuần Khiết cường hóa sát thương!';
    }

    return { multiplier: mult, reason };
  }

  /**
   * Evaluates defensive damage reduction from the defender's ability.
   */
  public static getDefenderDamageMultiplier(
    _attacker: BattlerPokemon,
    defender: BattlerPokemon,
    move: BattleMove,
    typeEffectiveness: number
  ): { multiplier: number; reason?: string } {
    const key = this.normalize(defender.ability);
    let mult = 1.0;
    let reason: string | undefined;

    // Thick Fat: 50% damage from Fire and Ice moves
    if (key === 'thickfat' && (move.type === 'Fire' || move.type === 'Ice')) {
      mult *= 0.5;
      reason = 'Lớp Mỡ Dày làm giảm một nửa sát thương!';
    }

    // Solid Rock & Filter: reduces super-effective damage by 25% (x0.75)
    if ((key === 'solidrock' || key === 'filter') && typeEffectiveness > 1.0) {
      mult *= 0.75;
      reason = 'Đá Cứng làm giảm độ khắc chế!';
    }

    // Multiscale: halves damage taken at full HP
    if (key === 'multiscale' && defender.currentHp >= defender.maxHp) {
      mult *= 0.5;
      reason = 'Vảy Đa Lớp giảm một nửa sát thương nhận vào!';
    }

    // Dry Skin: +25% damage taken from Fire moves
    if (key === 'dryskin' && move.type === 'Fire') {
      mult *= 1.25;
      reason = 'Da Khô khiến sát thương hệ Lửa tăng mạnh!';
    }

    return { multiplier: mult, reason };
  }

  /**
   * Modifies critical hit chance or damage multiplier.
   */
  public static modifyCriticalHit(
    attacker: BattlerPokemon,
    defender: BattlerPokemon,
    isCritical: boolean
  ): { isCritical: boolean; critMultiplier: number } {
    const defKey = this.normalize(defender.ability);

    // Shell Armor & Battle Armor: immune to critical hits
    if (defKey === 'shellarmor' || defKey === 'battlearmor') {
      return { isCritical: false, critMultiplier: 1.0 };
    }

    if (!isCritical) {
      return { isCritical: false, critMultiplier: 1.0 };
    }

    const atkKey = this.normalize(attacker.ability);
    // Sniper: critical hits deal 2.25x damage instead of 1.5x
    if (atkKey === 'sniper') {
      return { isCritical: true, critMultiplier: 2.25 };
    }

    return { isCritical: true, critMultiplier: 1.5 };
  }

  /**
   * Checks if a target's ability prevents a status condition.
   */
  public static isStatusImmune(
    target: BattlerPokemon,
    condition: StatusCondition
  ): { immune: boolean; reason?: string } {
    const key = this.normalize(target.ability);
    const nameVi = this.getDisplayName(target.ability);

    if (key === 'immunity' && (condition === 'poison' || condition === 'toxic')) {
      return { immune: true, reason: `${target.name} nhờ [${nameVi}] miễn nhiễm với độc tố!` };
    }
    if (key === 'limber' && condition === 'paralysis') {
      return { immune: true, reason: `${target.name} nhờ [${nameVi}] không thể bị tê liệt!` };
    }
    if (key === 'waterveil' && condition === 'burn') {
      return { immune: true, reason: `${target.name} nhờ [${nameVi}] không thể bị bỏng!` };
    }
    if (key === 'magmaarmor' && condition === 'freeze') {
      return { immune: true, reason: `${target.name} nhờ [${nameVi}] không thể bị đóng băng!` };
    }
    if ((key === 'insomnia' || key === 'vitalspirit') && condition === 'sleep') {
      return { immune: true, reason: `${target.name} nhờ [${nameVi}] không bao giờ ngủ!` };
    }

    return { immune: false };
  }

  /**
   * Triggers contact-reactive abilities when defender takes a physical contact hit.
   */
  public static onContact(
    attacker: BattlerPokemon,
    attackerSide: BattlerSide,
    defender: BattlerPokemon,
    defenderSide: BattlerSide,
    move: BattleMove,
    rng: BattleRng,
    events: BattleEvent[]
  ): string[] {
    if (!isContactMove(move)) return [];
    if (defender.currentHp <= 0 && this.normalize(defender.ability) !== 'cursedbody') {
      // Fainted defender still triggers contact abilities in canon except some specific ones
    }

    const key = this.normalize(defender.ability);
    const nameVi = this.getDisplayName(defender.ability);
    const messages: string[] = [];

    // 1. Static: 30% Paralysis
    if (key === 'static' && (!attacker.status || attacker.status === 'none')) {
      if (rng.next() < 0.3 && !attacker.types.includes('Electric')) {
        const imm = this.isStatusImmune(attacker, 'paralysis');
        if (!imm.immune) {
          setStatusCondition(attacker, 'paralysis');
          const msg = `Tĩnh điện từ [${nameVi}] của ${defender.name} làm ${attacker.name} bị tê liệt!`;
          messages.push(msg);
          events.push(
            BattleEventFactory.abilityTriggered(
              defenderSide,
              defender.name,
              defender.ability || key,
              nameVi,
              'Gây tê liệt khi tiếp xúc',
              msg
            )
          );
          events.push(
            BattleEventFactory.statusInflicted(attackerSide, attacker.name, 'paralysis', msg)
          );
          const synchMsg = this.checkSynchronize(
            attacker,
            attackerSide,
            defender,
            defenderSide,
            'paralysis',
            events
          );
          if (synchMsg) messages.push(synchMsg);
        }
      }
    }

    // 2. Poison Point: 30% Poison
    if (key === 'poisonpoint' && (!attacker.status || attacker.status === 'none')) {
      if (
        rng.next() < 0.3 &&
        !attacker.types.includes('Poison') &&
        !attacker.types.includes('Steel')
      ) {
        const imm = this.isStatusImmune(attacker, 'poison');
        if (!imm.immune) {
          setStatusCondition(attacker, 'poison');
          const msg = `Gai độc từ [${nameVi}] của ${defender.name} làm ${attacker.name} bị nhiễm độc!`;
          messages.push(msg);
          events.push(
            BattleEventFactory.abilityTriggered(
              defenderSide,
              defender.name,
              defender.ability || key,
              nameVi,
              'Gây nhiễm độc khi tiếp xúc',
              msg
            )
          );
          events.push(
            BattleEventFactory.statusInflicted(attackerSide, attacker.name, 'poison', msg)
          );
          const synchMsg = this.checkSynchronize(
            attacker,
            attackerSide,
            defender,
            defenderSide,
            'poison',
            events
          );
          if (synchMsg) messages.push(synchMsg);
        }
      }
    }

    // 3. Flame Body: 30% Burn
    if (key === 'flamebody' && (!attacker.status || attacker.status === 'none')) {
      if (rng.next() < 0.3 && !attacker.types.includes('Fire')) {
        const imm = this.isStatusImmune(attacker, 'burn');
        if (!imm.immune) {
          setStatusCondition(attacker, 'burn');
          const msg = `Hơi nóng từ [${nameVi}] của ${defender.name} làm ${attacker.name} bị bỏng!`;
          messages.push(msg);
          events.push(
            BattleEventFactory.abilityTriggered(
              defenderSide,
              defender.name,
              defender.ability || key,
              nameVi,
              'Gây bỏng khi tiếp xúc',
              msg
            )
          );
          events.push(BattleEventFactory.statusInflicted(attackerSide, attacker.name, 'burn', msg));
          const synchMsg = this.checkSynchronize(
            attacker,
            attackerSide,
            defender,
            defenderSide,
            'burn',
            events
          );
          if (synchMsg) messages.push(synchMsg);
        }
      }
    }

    // 4. Rough Skin & Iron Barbs: 1/8 max HP recoil damage to attacker (Magic Guard is immune)
    if (
      (key === 'roughskin' || key === 'ironbarbs') &&
      this.normalize(attacker.ability) !== 'magicguard'
    ) {
      const recoilDmg = Math.max(1, Math.floor(attacker.maxHp / 8));
      const dmgRes = applyDamage(attacker, recoilDmg);
      const msg = `${attacker.name} bị tổn thương bởi [${nameVi}] của ${defender.name}! (-${dmgRes.actualDamage} HP)`;
      messages.push(msg);
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          defender.ability || key,
          nameVi,
          'Phản sát thương tiếp xúc',
          msg
        )
      );
      events.push(
        BattleEventFactory.recoilDamage(
          attackerSide,
          attacker.name,
          dmgRes.actualDamage,
          attacker.currentHp,
          msg
        )
      );
    }

    // 5. Effect Spore: 30% chance (10% poison, 10% paralysis, 10% sleep)
    if (key === 'effectspore' && (!attacker.status || attacker.status === 'none')) {
      const roll = rng.next();
      if (roll < 0.1 && !attacker.types.includes('Poison') && !attacker.types.includes('Steel')) {
        setStatusCondition(attacker, 'poison');
        const msg = `Bào tử độc từ [${nameVi}] làm ${attacker.name} bị nhiễm độc!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            defenderSide,
            defender.name,
            defender.ability || key,
            nameVi,
            'Gây nhiễm độc',
            msg
          )
        );
        events.push(BattleEventFactory.statusInflicted(attackerSide, attacker.name, 'poison', msg));
      } else if (roll < 0.2 && !attacker.types.includes('Electric')) {
        setStatusCondition(attacker, 'paralysis');
        const msg = `Bào tử tê liệt từ [${nameVi}] làm ${attacker.name} bị tê liệt!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            defenderSide,
            defender.name,
            defender.ability || key,
            nameVi,
            'Gây tê liệt',
            msg
          )
        );
        events.push(
          BattleEventFactory.statusInflicted(attackerSide, attacker.name, 'paralysis', msg)
        );
      } else if (roll < 0.3) {
        setStatusCondition(attacker, 'sleep');
        attacker.sleepTurns = 2;
        const msg = `Bào tử gây mê từ [${nameVi}] ru ngủ ${attacker.name}!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            defenderSide,
            defender.name,
            defender.ability || key,
            nameVi,
            'Gây ngủ',
            msg
          )
        );
        events.push(BattleEventFactory.statusInflicted(attackerSide, attacker.name, 'sleep', msg));
      }
    }

    return messages;
  }

  /**
   * Evaluates ability actions at the end of each battle turn.
   */
  public static onEndTurn(
    pokemon: BattlerPokemon,
    side: BattlerSide,
    rng: BattleRng,
    events: BattleEvent[]
  ): string[] {
    if (pokemon.currentHp <= 0) return [];
    const key = this.normalize(pokemon.ability);
    const nameVi = this.getDisplayName(pokemon.ability);
    const messages: string[] = [];

    // Speed Boost: +1 Speed stage at end of turn
    if (key === 'speedboost') {
      const currentSpeed = pokemon.statStages?.speed ?? 0;
      if (currentSpeed < 6) {
        const newSpeed = applyStatStageChange(pokemon, 'speed', 1);
        const msg = `${pokemon.name} kích hoạt [${nameVi}] và tăng tốc độ!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            side,
            pokemon.name,
            pokemon.ability || key,
            nameVi,
            'Tăng Speed cuối lượt',
            msg
          )
        );
        events.push(
          BattleEventFactory.statStageChanged(side, pokemon.name, 'speed', 1, newSpeed, msg)
        );
      }
    }

    // Shed Skin: 33% chance to cure status condition
    if (key === 'shedskin' && pokemon.status && pokemon.status !== 'none') {
      if (rng.next() < 0.33) {
        const oldStatus = pokemon.status;
        clearStatusCondition(pokemon);
        const msg = `${pokemon.name} kích hoạt [${nameVi}] và tự chữa lành mọi trạng thái bất lợi!`;
        messages.push(msg);
        events.push(
          BattleEventFactory.abilityTriggered(
            side,
            pokemon.name,
            pokemon.ability || key,
            nameVi,
            'Chữa lành trạng thái',
            msg
          )
        );
        events.push(BattleEventFactory.statusCured(side, pokemon.name, oldStatus, msg));
      }
    }

    return messages;
  }

  /**
   * Checks if an ability protects against recoil damage (Rock Head, Magic Guard).
   */
  public static isRecoilImmune(pokemon: BattlerPokemon, move: BattleMove): boolean {
    if (move.id === 'struggle') return false;
    const key = this.normalize(pokemon.ability);
    return key === 'rockhead' || key === 'magicguard';
  }

  /**
   * Checks if Sturdy prevents an otherwise lethal OHKO when at full HP.
   */
  public static canSurviveWithSturdy(defender: BattlerPokemon, incomingDamage: number): boolean {
    const key = this.normalize(defender.ability);
    return (
      key === 'sturdy' &&
      defender.currentHp >= defender.maxHp &&
      incomingDamage >= defender.currentHp
    );
  }

  /**
   * Checks if an ability protects against an opponent lowering the Pokémon's stats.
   */
  public static isStatDropProtected(
    target: BattlerPokemon,
    stat: string,
    isFromOpponent = true
  ): boolean {
    if (!isFromOpponent) return false;
    const key = this.normalize(target.ability);

    if (key === 'clearbody' || key === 'whitesmoke') return true;
    if (key === 'hypercutter' && stat === 'attack') return true;
    if (key === 'keeneye' && stat === 'accuracy') return true;

    return false;
  }

  /**
   * Triggers Synchronize reflection when a Pokémon is inflicted with a primary status condition.
   */
  public static checkSynchronize(
    victim: BattlerPokemon,
    victimSide: BattlerSide,
    inflicter: BattlerPokemon,
    inflicterSide: BattlerSide,
    condition: StatusCondition,
    events: BattleEvent[]
  ): string | null {
    if (victim === inflicter) return null;
    if (
      condition !== 'burn' &&
      condition !== 'poison' &&
      condition !== 'toxic' &&
      condition !== 'paralysis'
    ) {
      return null;
    }

    const victimAbility = this.normalize(victim.ability);
    if (victimAbility !== 'synchronize') return null;

    if (inflicter.status && inflicter.status !== 'none') return null;

    // Check if inflicter is immune (type, ability)
    const imm = this.isStatusImmune(inflicter, condition);
    if (imm.immune) return null;

    if (condition === 'burn' && inflicter.types.includes('Fire')) return null;
    if (
      (condition === 'poison' || condition === 'toxic') &&
      (inflicter.types.includes('Poison') || inflicter.types.includes('Steel'))
    ) {
      return null;
    }
    if (condition === 'paralysis' && inflicter.types.includes('Electric')) return null;

    setStatusCondition(inflicter, condition);
    const condNameVi =
      condition === 'burn' ? 'bỏng' : condition === 'paralysis' ? 'tê liệt' : 'nhiễm độc';
    const msg = `[Đồng Bộ Hóa] của ${victim.name} khiến ${inflicter.name} cũng bị ${condNameVi}!`;
    events.push(
      BattleEventFactory.abilityTriggered(
        victimSide,
        victim.name,
        victim.ability || 'Synchronize',
        'Đồng Bộ Hóa',
        'Phản hồi trạng thái',
        msg
      )
    );
    events.push(BattleEventFactory.statusInflicted(inflicterSide, inflicter.name, condition, msg));
    return msg;
  }

  /**
   * Triggered when a Pokémon is recalled / switches out of battle.
   */
  public static onSwitchOut(pokemon: BattlerPokemon): void {
    const key = this.normalize(pokemon.ability);
    if (key === 'naturalcure' && pokemon.status && pokemon.status !== 'none') {
      clearStatusCondition(pokemon);
    }
  }
}
