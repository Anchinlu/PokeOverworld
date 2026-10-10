/**
 * Unified Data-Driven Item Effects Engine
 * Processes all item actions (Medicine, Berries, Vitamins, Rare Candies, Exp Candies,
 * Nature Mints, Evolution Stones, Hyper Training, Battle Boosters)
 * via the declarative ITEM_EFFECTS_REGISTRY.
 * Returns structured result codes and clean events for both Overworld and Battle.
 */

import type { PartyPokemon } from '../party/party-state';
import { recalculatePartyPokemonStats } from '../party/party-state';
import {
  addEffortValues,
  createDefaultEvs,
  createDefaultIvs,
  MAX_EV_PER_STAT,
  MAX_TOTAL_EV,
} from '../party/pokemon-stats';
import type { BattlerPokemon } from '../../battle/types';
import type { ItemData } from '../../data/items-db';
import { getItemEffectDef, STONE_EVOLUTIONS, isMoveTargetItem, isTmItem } from './item-catalog-effects';
export { isMoveTargetItem, isTmItem };
import { NATURES_TABLE, type StatKey } from '@pokemon/shared-types';
import { pokemonCatalog } from '../../data';
import { normalizeGrowthRate, getExpToNextLevel } from '../pokemon/pokemon-exp';
import { getMoveById } from '../../battle/moves-db';

export type ItemResultCode =
  | 'SUCCESS'
  | 'ERR_FAINTED'
  | 'ERR_NOT_FAINTED'
  | 'ERR_HP_FULL'
  | 'ERR_NO_STATUS'
  | 'ERR_MAX_LEVEL'
  | 'ERR_EV_STAT_MAX'
  | 'ERR_EV_TOTAL_MAX'
  | 'ERR_PP_FULL'
  | 'ERR_STAGE_MAX'
  | 'ERR_CRIT_STAGE_MAX'
  | 'ERR_WRONG_CONTEXT'
  | 'ERR_INCOMPATIBLE'
  | 'ERR_NO_EFFECT';

export interface ItemActionResult {
  success: boolean;
  code: ItemResultCode;
  message: string;
  hpRecovered?: number;
  details?: Record<string, unknown>;
}

export interface ItemEligibilityResult {
  canUse: boolean;
  code: ItemResultCode;
  reason?: string;
}

const STAT_LABELS_VI: Record<string, string> = {
  hp: 'HP',
  attack: 'Tấn công',
  defense: 'Phòng thủ',
  spAtk: 'Công đặc biệt',
  spDef: 'Thủ đặc biệt',
  speed: 'Tốc độ',
  accuracy: 'Độ chính xác',
  evasion: 'Né tránh',
};

function normalizeKey(item: ItemData): string {
  return (item.slug || item.id || '').toLowerCase().replace(/_/g, '-');
}

/**
 * Checks whether an item can be used on a Party Pokémon outside of battle.
 */
export function canUseItemOnPartyPokemon(
  item: ItemData,
  pokemon: PartyPokemon,
  partyMembers?: readonly PartyPokemon[] | PartyPokemon[],
  targetMoveIndex?: number
): ItemEligibilityResult {
  const key = normalizeKey(item);
  const def = getItemEffectDef(key);
  const name = pokemon.nickname || pokemon.name;

  if (!def || (def.targetScope !== 'party' && def.targetScope !== 'both')) {
    return {
      canUse: false,
      code: 'ERR_WRONG_CONTEXT',
      reason: `Vật phẩm này không thể sử dụng trực tiếp trên Pokémon!`,
    };
  }

  const isFainted = pokemon.isFainted || pokemon.currentHp <= 0;

  // 1. Revival check
  if (def.reviveRatio !== undefined) {
    if (def.reviveAllParty) {
      const anyFainted = partyMembers
        ? partyMembers.some((p) => p.isFainted || p.currentHp <= 0)
        : isFainted;
      if (!anyFainted) {
        return {
          canUse: false,
          code: 'ERR_NOT_FAINTED',
          reason: 'Toàn bộ đội hình đều đang khỏe mạnh, không cần hồi sinh!',
        };
      }
      return { canUse: true, code: 'SUCCESS' };
    }
    if (!isFainted) {
      return {
        canUse: false,
        code: 'ERR_NOT_FAINTED',
        reason: `${name} đang khỏe mạnh, không thể hồi sinh!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // Non-revival items cannot be used on fainted Pokémon
  if (isFainted) {
    return {
      canUse: false,
      code: 'ERR_FAINTED',
      reason: `${name} đã ngất xỉu! Hãy dùng Revive trước.`,
    };
  }

  // 2. HP Healing check
  if (def.healHp !== undefined || def.healRatio !== undefined) {
    if (pokemon.currentHp >= pokemon.maxHp) {
      // If item also cures status and pokemon has a status, allow usage!
      if (def.cureStatus && pokemon.status !== 'none') {
        return { canUse: true, code: 'SUCCESS' };
      }
      return {
        canUse: false,
        code: 'ERR_HP_FULL',
        reason: `${name} hiện đang đầy máu!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // 3. Status Curing check
  if (def.cureStatus) {
    if (def.cureStatus === 'all') {
      if (pokemon.status === 'none') {
        return {
          canUse: false,
          code: 'ERR_NO_STATUS',
          reason: `${name} không mắc trạng thái bất lợi nào!`,
        };
      }
    } else {
      if (!def.cureStatus.includes(pokemon.status)) {
        return {
          canUse: false,
          code: 'ERR_NO_STATUS',
          reason: `${name} không mắc trạng thái tương ứng!`,
        };
      }
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // 4. Rare Candy & Exp Candies Level Up check
  if (def.levelUp !== undefined || def.addExp !== undefined) {
    if (pokemon.level >= 100) {
      return {
        canUse: false,
        code: 'ERR_MAX_LEVEL',
        reason: `${name} đã đạt cấp độ tối đa (Lv.100)!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // 5. Nature Mints check
  if (def.natureMint !== undefined) {
    if (pokemon.nature === def.natureMint) {
      const natureData = NATURES_TABLE[def.natureMint] ?? NATURES_TABLE.Hardy;
      return {
        canUse: false,
        code: 'ERR_NO_EFFECT',
        reason: `${name} vốn đã mang tính cách ${natureData.nameVi} (${def.natureMint}) rồi!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // 6. Stat Boost Vitamins (EV)
  if (def.addEv) {
    if (!pokemon.evs) pokemon.evs = createDefaultEvs();
    const totalEv = Object.values(pokemon.evs).reduce((a, b) => a + b, 0);
    if (totalEv >= MAX_TOTAL_EV) {
      return {
        canUse: false,
        code: 'ERR_EV_TOTAL_MAX',
        reason: `${name} đã đạt giới hạn nỗ lực tối đa (${MAX_TOTAL_EV} EV)!`,
      };
    }
    if (pokemon.evs[def.addEv.stat] >= MAX_EV_PER_STAT) {
      const label = STAT_LABELS_VI[def.addEv.stat] || def.addEv.stat;
      return {
        canUse: false,
        code: 'ERR_EV_STAT_MAX',
        reason: `Chỉ số ${label} của ${name} đã đạt mức tối đa (${MAX_EV_PER_STAT} EV)!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // 7. EV-reducing Berries
  if (def.subEv) {
    if (!pokemon.evs) pokemon.evs = createDefaultEvs();
    if (pokemon.evs[def.subEv.stat] <= 0) {
      const label = STAT_LABELS_VI[def.subEv.stat] || def.subEv.stat;
      return {
        canUse: false,
        code: 'ERR_NO_EFFECT',
        reason: `Điểm nỗ lực ${label} của ${name} vốn đã ở mức 0!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // 8. PP Restorers
  if (def.restorePp) {
    if (def.restorePp.target === 'single') {
      if (targetMoveIndex !== undefined) {
        const move = pokemon.moves[targetMoveIndex];
        if (!move) {
          return {
            canUse: false,
            code: 'ERR_NO_EFFECT',
            reason: `Không tìm thấy chiêu thức thứ ${targetMoveIndex + 1} của ${name}!`,
          };
        }
        if (move.pp >= move.maxPp) {
          return {
            canUse: false,
            code: 'ERR_PP_FULL',
            reason: `Chiêu thức ${move.nameVi || move.name} của ${name} đã đầy PP (${move.pp}/${move.maxPp})!`,
          };
        }
        return { canUse: true, code: 'SUCCESS' };
      }
      const hasDepleted = pokemon.moves.some((m) => m.pp < m.maxPp);
      if (!hasDepleted) {
        return {
          canUse: false,
          code: 'ERR_PP_FULL',
          reason: `Tất cả chiêu thức của ${name} đều đã đầy PP!`,
        };
      }
      return { canUse: true, code: 'SUCCESS' };
    } else {
      const hasDepleted = pokemon.moves.some((m) => m.pp < m.maxPp);
      if (!hasDepleted) {
        return {
          canUse: false,
          code: 'ERR_PP_FULL',
          reason: `Tất cả chiêu thức của ${name} đều đã đầy PP!`,
        };
      }
      return { canUse: true, code: 'SUCCESS' };
    }
  }

  // 9. PP Enhancers (PP Up & PP Max)
  if (def.boostMaxPp) {
    if (targetMoveIndex !== undefined) {
      const move = pokemon.moves[targetMoveIndex];
      if (!move) {
        return {
          canUse: false,
          code: 'ERR_NO_EFFECT',
          reason: `Không tìm thấy chiêu thức thứ ${targetMoveIndex + 1} của ${name}!`,
        };
      }
      const count = (move as { ppUpCount?: number }).ppUpCount ?? 0;
      if (count >= 3) {
        return {
          canUse: false,
          code: 'ERR_PP_FULL',
          reason: `Chiêu thức ${move.nameVi || move.name} của ${name} đã đạt giới hạn PP tối đa (3/3)!`,
        };
      }
      return { canUse: true, code: 'SUCCESS' };
    }
    const hasEligible = pokemon.moves.some(
      (m) => ((m as { ppUpCount?: number }).ppUpCount ?? 0) < 3
    );
    if (!hasEligible) {
      return {
        canUse: false,
        code: 'ERR_PP_FULL',
        reason: `Tất cả chiêu thức của ${name} đều đã đạt giới hạn PP tối đa!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // 10. Evolution Stones
  if (def.evolutionStone) {
    const targetKey = STONE_EVOLUTIONS[def.evolutionStone]?.[pokemon.speciesKey.toUpperCase()];
    if (!targetKey) {
      return {
        canUse: false,
        code: 'ERR_NO_EFFECT',
        reason: `Vật phẩm này không có tác dụng với ${name}!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // 11. Hyper Training (Bottle Caps)
  if (def.ivHyperTraining) {
    if (!pokemon.ivs) pokemon.ivs = createDefaultIvs(0);
    const allMax = Object.values(pokemon.ivs).every((v) => v >= 31);
    if (allMax) {
      return {
        canUse: false,
        code: 'ERR_NO_EFFECT',
        reason: `Toàn bộ chỉ số cá thể (IVs) của ${name} đã đạt mức tối đa 31!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // 12. Ability Modifier
  if (def.abilityModifier) {
    return { canUse: true, code: 'SUCCESS' };
  }

  // 13. Move Teaching (TM/HM)
  if (def.teachMove) {
    const move = getMoveById(def.teachMove);
    const moveName = move ? move.nameVi || move.name : def.teachMove;
    const targetMoveId = def.teachMove.toLowerCase();
    const itemName = item.nameVi || item.name;

    // Species TM compatibility check from Pokédex database
    const species =
      pokemonCatalog.getBySpeciesKey(pokemon.speciesKey) ??
      pokemonCatalog.getById(pokemon.speciesId);
    if (species && Array.isArray(species.tmMoves)) {
      const isCompatible = species.tmMoves.some((m) => {
        const normM = m.toLowerCase().replace(/_/g, '-');
        const normTarget = targetMoveId.replace(/_/g, '-');
        return normM === normTarget || normM.replace(/-/g, '') === normTarget.replace(/-/g, '');
      });
      if (!isCompatible) {
        return {
          canUse: false,
          code: 'ERR_INCOMPATIBLE',
          reason: `${name} không thể học chiêu thức ${moveName} từ ${itemName}!`,
        };
      }
    }

    const alreadyKnows = pokemon.moves.some((m) => {
      const mId = (m.id || (m as { moveId?: string }).moveId || '').toLowerCase();
      return mId === targetMoveId;
    });
    if (alreadyKnows) {
      return {
        canUse: false,
        code: 'ERR_NO_EFFECT',
        reason: `${name} đã thành thạo chiêu thức ${moveName} rồi!`,
      };
    }

    const alreadyTaught = pokemon.taughtTmMoves?.some(
      (m) => m.toLowerCase() === targetMoveId
    );
    if (alreadyTaught) {
      return {
        canUse: false,
        code: 'ERR_NO_EFFECT',
        reason: `${name} đã được dạy chiêu ${moveName} từ trước! Bạn có thể vào mục Chi Tiết Pokémon để trang bị lại mà không cần tốn đĩa TM!`,
      };
    }

    if (targetMoveIndex !== undefined) {
      if (targetMoveIndex < 0 || targetMoveIndex >= pokemon.moves.length) {
        return {
          canUse: false,
          code: 'ERR_NO_EFFECT',
          reason: `Vị trí chiêu thức không hợp lệ!`,
        };
      }
    }

    return { canUse: true, code: 'SUCCESS' };
  }

  return {
    canUse: false,
    code: 'ERR_NO_EFFECT',
    reason: `Vật phẩm này không thể sử dụng trực tiếp trên Pokémon!`,
  };
}

/**
 * Applies an item's effects to a Party Pokémon.
 */
export function applyItemToPartyPokemon(
  item: ItemData,
  pokemon: PartyPokemon,
  partyMembers?: readonly PartyPokemon[] | PartyPokemon[],
  targetMoveIndex?: number
): ItemActionResult {
  const check = canUseItemOnPartyPokemon(item, pokemon, partyMembers, targetMoveIndex);
  if (!check.canUse) {
    return {
      success: false,
      code: check.code,
      message: check.reason || 'Không thể sử dụng vật phẩm này!',
    };
  }

  const key = normalizeKey(item);
  const def = getItemEffectDef(key)!;
  const name = pokemon.nickname || pokemon.name;
  const itemName = item.nameVi || item.name;

  // 1. Revival Items
  if (def.reviveRatio !== undefined) {
    if (def.reviveAllParty && partyMembers) {
      let revivedCount = 0;
      for (const pk of partyMembers) {
        if (pk.isFainted || pk.currentHp <= 0) {
          pk.currentHp = Math.max(1, Math.floor(pk.maxHp * def.reviveRatio));
          pk.isFainted = false;
          pk.status = 'none';
          revivedCount++;
        }
      }
      return {
        success: true,
        code: 'SUCCESS',
        message: `Đã dùng ${itemName}! Toàn bộ ${revivedCount} Pokémon đã hồi sinh hoàn toàn!`,
      };
    }

    const healAmount = Math.max(1, Math.floor(pokemon.maxHp * def.reviveRatio));
    pokemon.currentHp = Math.min(pokemon.maxHp, healAmount);
    pokemon.isFainted = false;
    pokemon.status = 'none';
    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! ${name} hồi sinh với ${pokemon.currentHp}/${pokemon.maxHp} HP!`,
      hpRecovered: healAmount,
    };
  }

  // 2. HP Recovery Items
  if (def.healHp !== undefined || def.healRatio !== undefined) {
    let healAmount = def.healHp ?? 0;
    if (def.healRatio !== undefined) {
      healAmount = Math.max(20, Math.floor(pokemon.maxHp * def.healRatio));
    }
    const oldHp = pokemon.currentHp;
    pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + healAmount);
    const recovered = pokemon.currentHp - oldHp;

    if (def.cureStatus) {
      pokemon.status = 'none';
    }

    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! ${name} được hồi phục ${recovered} HP (${pokemon.currentHp}/${pokemon.maxHp})!`,
      hpRecovered: recovered,
    };
  }

  // 3. Status Curing Items
  if (def.cureStatus) {
    pokemon.status = 'none';
    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! ${name} đã khỏi mọi trạng thái bất thường!`,
    };
  }

  // 4. Rare Candy
  if (def.levelUp !== undefined) {
    const targetLevel = Math.min(100, pokemon.level + def.levelUp);
    const { hpGained } = recalculatePartyPokemonStats(pokemon, targetLevel);
    pokemon.exp = 0;
    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! ${name} thăng cấp lên Lv.${pokemon.level}!`,
      hpRecovered: hpGained,
    };
  }

  // 5. Exp Candies (XS, S, M, L, XL)
  if (def.addExp !== undefined) {
    const expToAdd = def.addExp;
    const oldLevel = pokemon.level;
    let currentExp = pokemon.exp + expToAdd;
    let newLevel = pokemon.level;
    let totalHpGained = 0;

    const species =
      pokemonCatalog.getBySpeciesKey(pokemon.speciesKey) ??
      pokemonCatalog.getBySpeciesKey('PIKACHU')!;
    const growthRate = normalizeGrowthRate(species.growthRate);

    while (newLevel < 100) {
      const needed = getExpToNextLevel(growthRate, newLevel);
      if (currentExp >= needed) {
        currentExp -= needed;
        newLevel++;
        const { hpGained } = recalculatePartyPokemonStats(pokemon, newLevel);
        totalHpGained += hpGained;
      } else {
        break;
      }
    }

    if (newLevel >= 100) {
      pokemon.level = 100;
      pokemon.exp = 0;
      pokemon.maxExp = 0;
      recalculatePartyPokemonStats(pokemon, 100);
    } else {
      pokemon.exp = currentExp;
      pokemon.maxExp = getExpToNextLevel(growthRate, pokemon.level);
    }

    if (newLevel > oldLevel) {
      return {
        success: true,
        code: 'SUCCESS',
        message: `Đã dùng ${itemName}! ${name} nhận được +${expToAdd} EXP và thăng cấp lên Lv.${pokemon.level}!`,
        hpRecovered: totalHpGained,
        details: { oldLevel, newLevel: pokemon.level, expAdded: expToAdd },
      };
    } else {
      return {
        success: true,
        code: 'SUCCESS',
        message: `Đã dùng ${itemName}! ${name} nhận được +${expToAdd} EXP (${pokemon.exp}/${pokemon.maxExp})!`,
        details: { level: pokemon.level, expAdded: expToAdd },
      };
    }
  }

  // 6. Nature Mints (Bạc hà tính cách)
  if (def.natureMint !== undefined) {
    const oldNature = pokemon.nature;
    pokemon.nature = def.natureMint;
    const { oldStats, newStats } = recalculatePartyPokemonStats(pokemon);
    const natureData = NATURES_TABLE[def.natureMint] ?? NATURES_TABLE.Hardy;
    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! Tính cách của ${name} đã chuyển đổi thành ${natureData.nameVi} (${def.natureMint})!`,
      details: { oldNature, newNature: def.natureMint, oldStats, newStats },
    };
  }

  // 7. Stat Boost Vitamins (EV)
  if (def.addEv) {
    if (!pokemon.evs) pokemon.evs = createDefaultEvs();
    const addedEv = addEffortValues(pokemon.evs, def.addEv.stat, def.addEv.amount);
    if (addedEv <= 0) {
      return {
        success: false,
        code: 'ERR_EV_STAT_MAX',
        message: `Chỉ số của ${name} đã đạt giới hạn, không thể tăng thêm!`,
      };
    }
    const { oldStats, newStats } = recalculatePartyPokemonStats(pokemon);
    const statLabel = STAT_LABELS_VI[def.addEv.stat] || def.addEv.stat;
    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! Chỉ số ${statLabel} của ${name} đã tăng (${oldStats[def.addEv.stat]} ➔ ${newStats[def.addEv.stat]}, +${addedEv} EV)!`,
      details: { addedEv, stat: def.addEv.stat },
    };
  }

  // 8. EV-reducing Berries
  if (def.subEv) {
    if (!pokemon.evs) pokemon.evs = createDefaultEvs();
    const oldEv = pokemon.evs[def.subEv.stat];
    const newEv = Math.max(0, oldEv - def.subEv.amount);
    pokemon.evs[def.subEv.stat] = newEv;
    const reduced = oldEv - newEv;
    const { oldStats, newStats } = recalculatePartyPokemonStats(pokemon);
    const statLabel = STAT_LABELS_VI[def.subEv.stat] || def.subEv.stat;
    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! Điểm nỗ lực ${statLabel} của ${name} đã giảm (${oldEv} ➔ ${newEv}, -${reduced} EV)!`,
      details: { stat: def.subEv.stat, reduced, oldStats, newStats },
    };
  }

  // 9. PP Restorers
  if (def.restorePp) {
    if (def.restorePp.target === 'single') {
      const move =
        targetMoveIndex !== undefined
          ? pokemon.moves[targetMoveIndex]
          : pokemon.moves.find((m) => m.pp < m.maxPp);
      if (move) {
        const oldPp = move.pp;
        const amt = def.restorePp.amount === 'max' ? move.maxPp : def.restorePp.amount;
        move.pp = Math.min(move.maxPp, move.pp + amt);
        const restored = move.pp - oldPp;
        return {
          success: true,
          code: 'SUCCESS',
          message: `Đã dùng ${itemName}! Phục hồi +${restored} PP cho chiêu ${move.nameVi || move.name} của ${name} (${move.pp}/${move.maxPp})!`,
        };
      }
      return {
        success: false,
        code: 'ERR_PP_FULL',
        message: `Chiêu thức đã đầy PP!`,
      };
    } else {
      let totalRestored = 0;
      for (const m of pokemon.moves) {
        const oldPp = m.pp;
        const amt = def.restorePp.amount === 'max' ? m.maxPp : def.restorePp.amount;
        m.pp = Math.min(m.maxPp, m.pp + amt);
        totalRestored += m.pp - oldPp;
      }
      return {
        success: true,
        code: 'SUCCESS',
        message: `Đã dùng ${itemName}! Đã phục hồi PP cho toàn bộ chiêu thức của ${name} (+${totalRestored} PP)!`,
      };
    }
  }

  // 10. PP Enhancers (PP Up & PP Max)
  if (def.boostMaxPp) {
    const move =
      targetMoveIndex !== undefined
        ? pokemon.moves[targetMoveIndex]
        : pokemon.moves.find(
            (m) => ((m as { ppUpCount?: number }).ppUpCount ?? 0) < 3
          );
    if (move) {
      const moveExt = move as { ppUpCount?: number; baseMaxPp?: number };
      const currentCount = moveExt.ppUpCount ?? 0;
      if (currentCount >= 3) {
        return {
          success: false,
          code: 'ERR_PP_FULL',
          message: `Chiêu thức ${move.nameVi || move.name} đã đạt giới hạn nâng cấp PP tối đa (3/3)!`,
        };
      }
      const basePp = moveExt.baseMaxPp ?? move.maxPp;
      moveExt.baseMaxPp = basePp;
      const boostStep = Math.max(1, Math.floor(basePp * 0.2));

      if (def.boostMaxPp === 'max') {
        const remainingSteps = 3 - currentCount;
        moveExt.ppUpCount = 3;
        move.maxPp += boostStep * remainingSteps;
        move.pp = Math.min(move.maxPp, move.pp + boostStep * remainingSteps);
      } else {
        moveExt.ppUpCount = currentCount + 1;
        move.maxPp += boostStep;
        move.pp = Math.min(move.maxPp, move.pp + boostStep);
      }

      return {
        success: true,
        code: 'SUCCESS',
        message: `Đã dùng ${itemName}! Giới hạn PP của chiêu ${move.nameVi || move.name} tăng lên ${move.maxPp} PP (Cấp ${moveExt.ppUpCount}/3)!`,
      };
    }
    return {
      success: false,
      code: 'ERR_PP_FULL',
      message: `Tất cả chiêu thức đã đạt giới hạn PP tối đa!`,
    };
  }

  // 11. Evolution Stones
  if (def.evolutionStone) {
    const targetKey = STONE_EVOLUTIONS[def.evolutionStone]?.[pokemon.speciesKey.toUpperCase()];
    if (targetKey) {
      const targetSpecies = pokemonCatalog.getBySpeciesKey(targetKey);
      if (targetSpecies) {
        const oldSpeciesName = pokemon.name;
        const isDefaultName = !pokemon.nickname || pokemon.nickname === oldSpeciesName;
        pokemon.speciesId = targetSpecies.id;
        pokemon.speciesKey = targetSpecies.speciesKey;
        if (isDefaultName) {
          pokemon.name = targetSpecies.name;
        }
        pokemon.types = [...targetSpecies.types];
        if (targetSpecies.ability) {
          pokemon.ability = targetSpecies.ability;
        }
        const { hpGained } = recalculatePartyPokemonStats(pokemon, pokemon.level);
        return {
          success: true,
          code: 'SUCCESS',
          message: `✨ Chúc mừng! ${oldSpeciesName} đã tiến hóa thành công thành ${targetSpecies.name}!`,
          hpRecovered: hpGained,
          details: { evolvedSpecies: targetSpecies.speciesKey },
        };
      }
    }
  }

  // 12. Hyper Training (Bottle Caps)
  if (def.ivHyperTraining) {
    if (!pokemon.ivs) pokemon.ivs = createDefaultIvs(0);
    if (def.ivHyperTraining === 'all') {
      pokemon.ivs.hp = 31;
      pokemon.ivs.attack = 31;
      pokemon.ivs.defense = 31;
      pokemon.ivs.spAtk = 31;
      pokemon.ivs.spDef = 31;
      pokemon.ivs.speed = 31;
      const { oldStats, newStats } = recalculatePartyPokemonStats(pokemon);
      return {
        success: true,
        code: 'SUCCESS',
        message: `Đã dùng ${itemName}! Toàn bộ 6 chỉ số cá thể (IVs) của ${name} đã được huấn luyện đạt mức hoàn hảo 31!`,
        details: { oldStats, newStats },
      };
    } else {
      const statList: StatKey[] = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'];
      const targetStat = statList.find((s) => pokemon.ivs[s] < 31) || 'hp';
      pokemon.ivs[targetStat] = 31;
      const { oldStats, newStats } = recalculatePartyPokemonStats(pokemon);
      const label = STAT_LABELS_VI[targetStat] || targetStat;
      return {
        success: true,
        code: 'SUCCESS',
        message: `Đã dùng ${itemName}! Chỉ số IV ${label} của ${name} đã đạt mức tối đa 31!`,
        details: { stat: targetStat, oldStats, newStats },
      };
    }
  }

  // 13. Ability Modifier
  if (def.abilityModifier) {
    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! Đặc tính của ${name} đã được kích hoạt thành công!`,
    };
  }

  // 14. Move Teaching (TM/HM)
  if (def.teachMove) {
    const move = getMoveById(def.teachMove);
    if (!move) {
      return {
        success: false,
        code: 'ERR_NO_EFFECT',
        message: `Không tìm thấy dữ liệu chiêu thức ${def.teachMove}!`,
      };
    }
    const moveName = move.nameVi || move.name;
    const moveId = move.id;

    // Permanently record this move into taught TM moves pool!
    if (!pokemon.taughtTmMoves) {
      pokemon.taughtTmMoves = [];
    }
    const normTarget = moveId.toLowerCase();
    if (!pokemon.taughtTmMoves.some((id) => id.toLowerCase() === normTarget)) {
      pokemon.taughtTmMoves.push(moveId);
    }

    // If Pokemon has < 4 moves AND no specific move replacement index is targeted:
    if (
      pokemon.moves.length < 4 &&
      (targetMoveIndex === undefined || targetMoveIndex >= pokemon.moves.length)
    ) {
      pokemon.moves.push({ ...move });
      return {
        success: true,
        code: 'SUCCESS',
        message: `🎉 ${name} đã học thành công chiêu thức ${moveName}!`,
      };
    } else {
      // Replace targeted move (or default to slot 3 if unspecified and full)
      const replaceIdx =
        targetMoveIndex !== undefined &&
        targetMoveIndex >= 0 &&
        targetMoveIndex < pokemon.moves.length
          ? targetMoveIndex
          : pokemon.moves.length >= 4
            ? 3
            : pokemon.moves.length - 1;
      const replacedMove = pokemon.moves[replaceIdx];
      const replacedName =
        replacedMove?.nameVi ||
        replacedMove?.name ||
        (replacedMove as { moveId?: string })?.moveId ||
        'chiêu cũ';
      pokemon.moves[replaceIdx] = { ...move };
      return {
        success: true,
        code: 'SUCCESS',
        message: `🎉 ${name} đã quên ${replacedName} và học thành công chiêu thức ${moveName}!`,
      };
    }
  }

  return {
    success: false,
    code: 'ERR_NO_EFFECT',
    message: `Vật phẩm không có tác dụng với ${name}!`,
  };
}

/**
 * Checks whether an item can be used on a Battler Pokémon during battle.
 */
export function canUseItemOnBattler(
  item: ItemData,
  battler: BattlerPokemon
): ItemEligibilityResult {
  const key = normalizeKey(item);
  const def = getItemEffectDef(key);
  const name = battler.name;

  if (!def || (def.targetScope !== 'battler' && def.targetScope !== 'both')) {
    return {
      canUse: false,
      code: 'ERR_WRONG_CONTEXT',
      reason: `Vật phẩm này không thể dùng trong trận đấu!`,
    };
  }

  // 1. Revival check
  if (def.reviveRatio !== undefined) {
    if (!battler.isFainted && battler.currentHp > 0) {
      return {
        canUse: false,
        code: 'ERR_NOT_FAINTED',
        reason: `${name} đang khỏe mạnh, không thể hồi sinh!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  if (battler.isFainted || battler.currentHp <= 0) {
    return {
      canUse: false,
      code: 'ERR_FAINTED',
      reason: `${name} đã bị hạ gục! Hãy dùng Revive trước.`,
    };
  }

  // HP Restoration
  if (def.healHp !== undefined || def.healRatio !== undefined) {
    if (battler.currentHp >= battler.maxHp) {
      if (def.cureStatus && battler.status && battler.status !== 'none') {
        return { canUse: true, code: 'SUCCESS' };
      }
      return {
        canUse: false,
        code: 'ERR_HP_FULL',
        reason: `${name} hiện đang đầy máu!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // Status Recovery
  if (def.cureStatus) {
    if (def.cureStatus === 'all') {
      if (!battler.status || battler.status === 'none') {
        return {
          canUse: false,
          code: 'ERR_NO_STATUS',
          reason: `${name} không có trạng thái bất thường!`,
        };
      }
    } else {
      if (!battler.status || !def.cureStatus.includes(battler.status)) {
        return {
          canUse: false,
          code: 'ERR_NO_STATUS',
          reason: `${name} không mắc trạng thái tương ứng!`,
        };
      }
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // Battle Stat Boosters
  if (def.statStageBuff) {
    const current = battler.statStages?.[def.statStageBuff.stat] ?? 0;
    if (current >= 6) {
      const label = STAT_LABELS_VI[def.statStageBuff.stat] || def.statStageBuff.stat;
      return {
        canUse: false,
        code: 'ERR_STAGE_MAX',
        reason: `Chỉ số ${label} của ${name} đã ở mức tối đa (+6)!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // Dire Hit
  if (def.critStageBuff !== undefined) {
    if ((battler.critStage ?? 0) >= 3) {
      return {
        canUse: false,
        code: 'ERR_CRIT_STAGE_MAX',
        reason: `Tỉ lệ chí mạng của ${name} đã ở mức tối đa!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  return { canUse: true, code: 'SUCCESS' };
}

/**
 * Applies an item's effects to an active Battler Pokémon during battle.
 */
export function applyItemToBattler(item: ItemData, battler: BattlerPokemon): ItemActionResult {
  const check = canUseItemOnBattler(item, battler);
  if (!check.canUse) {
    return {
      success: false,
      code: check.code,
      message: check.reason || 'Không thể sử dụng vật phẩm này!',
    };
  }

  const key = normalizeKey(item);
  const def = getItemEffectDef(key)!;
  const name = battler.name;
  const itemName = item.nameVi || item.name;

  // 1. Revival Items
  if (def.reviveRatio !== undefined) {
    const healAmount = Math.max(1, Math.floor(battler.maxHp * def.reviveRatio));
    battler.currentHp = Math.min(battler.maxHp, healAmount);
    battler.isFainted = false;
    battler.status = 'none';
    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! ${name} hồi sinh với ${battler.currentHp}/${battler.maxHp} HP!`,
      hpRecovered: healAmount,
    };
  }

  // HP Restoration
  if (def.healHp !== undefined || def.healRatio !== undefined) {
    let healAmount = def.healHp ?? 0;
    if (def.healRatio !== undefined) {
      healAmount = Math.max(20, Math.floor(battler.maxHp * def.healRatio));
    }
    const oldHp = battler.currentHp;
    battler.currentHp = Math.min(battler.maxHp, battler.currentHp + healAmount);
    const recovered = battler.currentHp - oldHp;

    if (def.cureStatus) {
      battler.status = 'none';
    }

    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! ${name} hồi phục ${recovered} HP!`,
      hpRecovered: recovered,
    };
  }

  // Status Recovery
  if (def.cureStatus) {
    battler.status = 'none';
    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! ${name} đã khỏi trạng thái bất lợi!`,
    };
  }

  // Battle Stat Boosters
  if (!battler.statStages) {
    battler.statStages = {
      attack: 0,
      defense: 0,
      spAtk: 0,
      spDef: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    };
  }

  if (def.statStageBuff) {
    const { stat, stages } = def.statStageBuff;
    battler.statStages[stat] = Math.min(6, (battler.statStages[stat] ?? 0) + stages);
    const label = STAT_LABELS_VI[stat] || stat;
    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! ${label} của ${name} tăng mạnh!`,
    };
  }

  if (def.critStageBuff !== undefined) {
    battler.critStage = Math.min(3, (battler.critStage ?? 0) + def.critStageBuff);
    return {
      success: true,
      code: 'SUCCESS',
      message: `Đã dùng ${itemName}! Tỉ lệ chí mạng của ${name} tăng vọt!`,
    };
  }

  return {
    success: false,
    code: 'ERR_NO_EFFECT',
    message: `Vật phẩm không có tác dụng!`,
  };
}
