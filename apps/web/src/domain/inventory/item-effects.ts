/**
 * Unified Data-Driven Item Effects Engine
 * Processes all item actions (Medicine, Berries, Vitamins, Rare Candies, Battle Items)
 * via the declarative ITEM_EFFECTS_REGISTRY.
 * Returns structured result codes and clean events for both Overworld and Battle.
 */

import type { PartyPokemon } from '../party/party-state';
import { recalculatePartyPokemonStats } from '../party/party-state';
import {
  addEffortValues,
  createDefaultEvs,
  MAX_EV_PER_STAT,
  MAX_TOTAL_EV,
} from '../party/pokemon-stats';
import type { BattlerPokemon } from '../../battle/types';
import type { ItemData } from '../../data/items-db';
import { getItemEffectDef } from './item-catalog-effects';

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
  partyMembers?: readonly PartyPokemon[] | PartyPokemon[]
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

  // 4. Rare Candy Level Up check
  if (def.levelUp !== undefined) {
    if (pokemon.level >= 100) {
      return {
        canUse: false,
        code: 'ERR_MAX_LEVEL',
        reason: `${name} đã đạt cấp độ tối đa (Lv.100)!`,
      };
    }
    return { canUse: true, code: 'SUCCESS' };
  }

  // 5. Stat Boost Vitamins (EV)
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

  // 6. PP Restorers
  if (def.restorePp) {
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
  partyMembers?: readonly PartyPokemon[] | PartyPokemon[]
): ItemActionResult {
  const check = canUseItemOnPartyPokemon(item, pokemon, partyMembers);
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
        message: `✨ Đã dùng ${itemName}! Toàn bộ ${revivedCount} Pokémon đã hồi sinh hoàn toàn!`,
      };
    }

    const healAmount = Math.max(1, Math.floor(pokemon.maxHp * def.reviveRatio));
    pokemon.currentHp = Math.min(pokemon.maxHp, healAmount);
    pokemon.isFainted = false;
    pokemon.status = 'none';
    return {
      success: true,
      code: 'SUCCESS',
      message: `✨ Đã dùng ${itemName}! ${name} hồi sinh với ${pokemon.currentHp}/${pokemon.maxHp} HP!`,
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
      message: `🧪 Đã dùng ${itemName}! ${name} được hồi phục ${recovered} HP (${pokemon.currentHp}/${pokemon.maxHp})!`,
      hpRecovered: recovered,
    };
  }

  // 3. Status Curing Items
  if (def.cureStatus) {
    pokemon.status = 'none';
    return {
      success: true,
      code: 'SUCCESS',
      message: `💊 Đã dùng ${itemName}! ${name} đã khỏi mọi trạng thái bất thường!`,
    };
  }

  // 4. Rare Candy
  if (def.levelUp !== undefined) {
    const { hpGained } = recalculatePartyPokemonStats(pokemon, pokemon.level + def.levelUp);
    return {
      success: true,
      code: 'SUCCESS',
      message: `⭐ Đã dùng ${itemName}! ${name} thăng cấp lên Lv.${pokemon.level}!`,
      hpRecovered: hpGained,
    };
  }

  // 5. Stat Boost Vitamins (EV)
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
      message: `💪 Đã dùng ${itemName}! Chỉ số ${statLabel} của ${name} đã tăng (${oldStats[def.addEv.stat]} ➔ ${newStats[def.addEv.stat]}, +${addedEv} EV)!`,
      details: { addedEv, stat: def.addEv.stat },
    };
  }

  // 6. PP Restorers
  if (def.restorePp) {
    if (def.restorePp.target === 'single') {
      const move = pokemon.moves.find((m) => m.pp < m.maxPp);
      if (move) {
        const amt = def.restorePp.amount === 'max' ? move.maxPp : def.restorePp.amount;
        move.pp = Math.min(move.maxPp, move.pp + amt);
        return {
          success: true,
          code: 'SUCCESS',
          message: `⚡ Đã dùng ${itemName}! Phục hồi PP cho chiêu ${move.nameVi || move.name} của ${name}!`,
        };
      }
    } else {
      for (const m of pokemon.moves) {
        const amt = def.restorePp.amount === 'max' ? m.maxPp : def.restorePp.amount;
        m.pp = Math.min(m.maxPp, m.pp + amt);
      }
      return {
        success: true,
        code: 'SUCCESS',
        message: `⚡ Đã dùng ${itemName}! Đã phục hồi PP cho toàn bộ chiêu thức của ${name}!`,
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
      message: `✨ Đã dùng ${itemName}! ${name} hồi sinh với ${battler.currentHp}/${battler.maxHp} HP!`,
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
