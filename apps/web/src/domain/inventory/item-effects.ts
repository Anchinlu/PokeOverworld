/**
 * Item Effects Engine
 * Handles authentic game logic for using Medicine, Berries, Vitamins, Rare Candies,
 * and Battle Items on Party Pokémon (overworld) and Battler Pokémon (in-battle).
 */

import type { PartyPokemon } from '../party/party-state';
import type { BattlerPokemon } from '../../battle/types';
import type { ItemData } from '../../data/items-db';

export interface ItemActionResult {
  success: boolean;
  message: string;
  hpRecovered?: number;
}

export interface ItemEligibilityResult {
  canUse: boolean;
  reason?: string;
}

/**
 * Normalizes an item ID/slug to lower-case kebab format for clean matching.
 */
function normalizeKey(item: ItemData): string {
  return (item.slug || item.id || '').toLowerCase().replace(/_/g, '-');
}

/**
 * Checks whether an item can be used on a Party Pokémon outside of battle.
 */
export function canUseItemOnPartyPokemon(
  item: ItemData,
  pokemon: PartyPokemon
): ItemEligibilityResult {
  const key = normalizeKey(item);
  const isFainted = pokemon.isFainted || pokemon.currentHp <= 0;
  const name = pokemon.nickname || pokemon.name;

  // 1. Revival Items
  if (key.includes('revive') || key === 'revival-herb' || key === 'sacred-ash') {
    if (!isFainted) {
      return { canUse: false, reason: `${name} đang khỏe mạnh, không thể hồi sinh!` };
    }
    return { canUse: true };
  }

  // Pokémon is fainted: non-revive items cannot be used!
  if (isFainted) {
    return { canUse: false, reason: `${name} đã ngất xỉu! Hãy dùng Revive trước.` };
  }

  // 2. HP Recovery Items (Potions, Berries, Drinks)
  if (
    key.includes('potion') ||
    key === 'fresh-water' ||
    key === 'soda-pop' ||
    key === 'lemonade' ||
    key === 'moomoo-milk' ||
    key === 'berry-juice' ||
    key === 'sweet-heart' ||
    key === 'energy-powder' ||
    key === 'energy-root' ||
    key === 'oran-berry' ||
    key === 'sitrus-berry' ||
    key === 'figy-berry' ||
    key === 'wiki-berry' ||
    key === 'mago-berry' ||
    key === 'aguav-berry' ||
    key === 'iapapa-berry'
  ) {
    if (pokemon.currentHp >= pokemon.maxHp) {
      return { canUse: false, reason: `${name} hiện đang đầy máu!` };
    }
    return { canUse: true };
  }

  // 3. Status Healing Items
  if (key === 'antidote' || key === 'pecha-berry') {
    if (pokemon.status !== 'poison' && pokemon.status !== 'toxic') {
      return { canUse: false, reason: `${name} không bị nhiễm độc!` };
    }
    return { canUse: true };
  }
  if (key === 'awakening' || key === 'chesto-berry' || key === 'blue-flute') {
    if (pokemon.status !== 'sleep') {
      return { canUse: false, reason: `${name} không bị buồn ngủ!` };
    }
    return { canUse: true };
  }
  if (key === 'parlyz-heal' || key === 'paralyze-heal' || key === 'cheri-berry') {
    if (pokemon.status !== 'paralysis') {
      return { canUse: false, reason: `${name} không bị tê liệt!` };
    }
    return { canUse: true };
  }
  if (key === 'burn-heal' || key === 'rawst-berry') {
    if (pokemon.status !== 'burn') {
      return { canUse: false, reason: `${name} không bị bỏng!` };
    }
    return { canUse: true };
  }
  if (key === 'ice-heal' || key === 'aspear-berry') {
    if (pokemon.status !== 'freeze') {
      return { canUse: false, reason: `${name} không bị đóng băng!` };
    }
    return { canUse: true };
  }
  if (
    key === 'full-heal' ||
    key === 'lum-berry' ||
    key === 'lava-cookie' ||
    key === 'old-gateau' ||
    key === 'casteliacone' ||
    key === 'heal-powder' ||
    key === 'big-malasada'
  ) {
    if (pokemon.status === 'none') {
      return { canUse: false, reason: `${name} không mắc trạng thái bất lợi nào!` };
    }
    return { canUse: true };
  }
  if (key === 'full-restore') {
    if (pokemon.currentHp >= pokemon.maxHp && pokemon.status === 'none') {
      return { canUse: false, reason: `${name} hiện đang hoàn toàn khỏe mạnh!` };
    }
    return { canUse: true };
  }

  // 4. Rare Candy
  if (key === 'rare-candy' || key === 'rarecandy') {
    if (pokemon.level >= 100) {
      return { canUse: false, reason: `${name} đã đạt cấp độ tối đa (Lv.100)!` };
    }
    return { canUse: true };
  }

  // 5. Stat Boost Vitamins
  if (
    key === 'hp-up' ||
    key === 'protein' ||
    key === 'iron' ||
    key === 'calcium' ||
    key === 'zinc' ||
    key === 'carbos'
  ) {
    return { canUse: true };
  }

  // 6. PP Restorers
  if (key.includes('ether') || key.includes('elixir') || key === 'leppa-berry') {
    const hasDepletedMove = pokemon.moves.some((m) => m.pp < m.maxPp);
    if (!hasDepletedMove) {
      return { canUse: false, reason: `Tất cả chiêu thức của ${name} đều đã đầy PP!` };
    }
    return { canUse: true };
  }

  // Non-usable or general items
  return { canUse: false, reason: `Vật phẩm này không thể sử dụng trực tiếp trên Pokémon!` };
}

/**
 * Applies an item's effects to a Party Pokémon.
 */
export function applyItemToPartyPokemon(item: ItemData, pokemon: PartyPokemon): ItemActionResult {
  const check = canUseItemOnPartyPokemon(item, pokemon);
  if (!check.canUse) {
    return { success: false, message: check.reason || 'Không thể sử dụng vật phẩm này!' };
  }

  const key = normalizeKey(item);
  const name = pokemon.nickname || pokemon.name;
  const itemName = item.nameVi || item.name;

  // 1. Revival Items
  if (key.includes('revive') || key === 'revival-herb' || key === 'sacred-ash') {
    const healRatio = key === 'max-revive' || key === 'revival-herb' || key === 'sacred-ash' ? 1.0 : 0.5;
    const healAmount = Math.max(1, Math.floor(pokemon.maxHp * healRatio));
    pokemon.currentHp = Math.min(pokemon.maxHp, healAmount);
    pokemon.isFainted = false;
    pokemon.status = 'none';
    return {
      success: true,
      message: `✨ Đã dùng ${itemName}! ${name} hồi sinh với ${pokemon.currentHp}/${pokemon.maxHp} HP!`,
      hpRecovered: healAmount,
    };
  }

  // 2. HP Recovery Items
  let healAmount = 0;
  if (key === 'potion') healAmount = 20;
  else if (key === 'super-potion') healAmount = 50;
  else if (key === 'hyper-potion') healAmount = 200;
  else if (key === 'max-potion') healAmount = pokemon.maxHp;
  else if (key === 'fresh-water') healAmount = 30;
  else if (key === 'soda-pop') healAmount = 50;
  else if (key === 'lemonade') healAmount = 70;
  else if (key === 'moomoo-milk') healAmount = 100;
  else if (key === 'berry-juice' || key === 'sweet-heart') healAmount = 20;
  else if (key === 'energy-powder') healAmount = 60;
  else if (key === 'energy-root') healAmount = 120;
  else if (key === 'oran-berry') healAmount = 10;
  else if (key === 'sitrus-berry') healAmount = Math.max(30, Math.floor(pokemon.maxHp / 4));
  else if (
    key === 'figy-berry' ||
    key === 'wiki-berry' ||
    key === 'mago-berry' ||
    key === 'aguav-berry' ||
    key === 'iapapa-berry'
  ) {
    healAmount = Math.max(20, Math.floor(pokemon.maxHp / 3));
  } else if (key === 'full-restore') {
    healAmount = pokemon.maxHp;
    pokemon.status = 'none';
  }

  if (healAmount > 0) {
    const oldHp = pokemon.currentHp;
    pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + healAmount);
    const recovered = pokemon.currentHp - oldHp;
    return {
      success: true,
      message: `🧪 Đã dùng ${itemName}! ${name} được hồi phục ${recovered} HP (${pokemon.currentHp}/${pokemon.maxHp})!`,
      hpRecovered: recovered,
    };
  }

  // 3. Status Curing Items
  if (
    key === 'antidote' ||
    key === 'pecha-berry' ||
    key === 'awakening' ||
    key === 'chesto-berry' ||
    key === 'blue-flute' ||
    key === 'parlyz-heal' ||
    key === 'paralyze-heal' ||
    key === 'cheri-berry' ||
    key === 'burn-heal' ||
    key === 'rawst-berry' ||
    key === 'ice-heal' ||
    key === 'aspear-berry' ||
    key === 'full-heal' ||
    key === 'lum-berry' ||
    key === 'lava-cookie' ||
    key === 'old-gateau' ||
    key === 'casteliacone' ||
    key === 'heal-powder' ||
    key === 'big-malasada'
  ) {
    pokemon.status = 'none';
    return {
      success: true,
      message: `💊 Đã dùng ${itemName}! ${name} đã khỏi mọi trạng thái bất thường!`,
    };
  }

  // 4. Rare Candy
  if (key === 'rare-candy' || key === 'rarecandy') {
    const oldLevel = pokemon.level;
    pokemon.level += 1;
    const hpGain = Math.max(2, Math.floor(pokemon.stats.hp / oldLevel));
    pokemon.maxHp += hpGain;
    pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + hpGain);
    pokemon.stats.attack += Math.max(1, Math.floor(pokemon.stats.attack / oldLevel));
    pokemon.stats.defense += Math.max(1, Math.floor(pokemon.stats.defense / oldLevel));
    pokemon.stats.spAtk += Math.max(1, Math.floor(pokemon.stats.spAtk / oldLevel));
    pokemon.stats.spDef += Math.max(1, Math.floor(pokemon.stats.spDef / oldLevel));
    pokemon.stats.speed += Math.max(1, Math.floor(pokemon.stats.speed / oldLevel));
    pokemon.maxExp = pokemon.level * pokemon.level * 10;
    return {
      success: true,
      message: `⭐ Đã dùng ${itemName}! ${name} thăng cấp lên Lv.${pokemon.level}!`,
    };
  }

  // 5. Stat Boost Vitamins
  if (key === 'hp-up') {
    pokemon.stats.hp += 2;
    pokemon.maxHp += 2;
    pokemon.currentHp += 2;
    return { success: true, message: `💪 Đã dùng HP Up! Lượng HP tối đa của ${name} đã tăng lên!` };
  }
  if (key === 'protein') {
    pokemon.stats.attack += 2;
    return { success: true, message: `💪 Đã dùng Protein! Chỉ số Tấn công của ${name} đã tăng lên!` };
  }
  if (key === 'iron') {
    pokemon.stats.defense += 2;
    return { success: true, message: `💪 Đã dùng Iron! Chỉ số Phòng thủ của ${name} đã tăng lên!` };
  }
  if (key === 'calcium') {
    pokemon.stats.spAtk += 2;
    return { success: true, message: `💪 Đã dùng Calcium! Chỉ số Công đặc biệt của ${name} đã tăng lên!` };
  }
  if (key === 'zinc') {
    pokemon.stats.spDef += 2;
    return { success: true, message: `💪 Đã dùng Zinc! Chỉ số Thủ đặc biệt của ${name} đã tăng lên!` };
  }
  if (key === 'carbos') {
    pokemon.stats.speed += 2;
    return { success: true, message: `💪 Đã dùng Carbos! Chỉ số Tốc độ của ${name} đã tăng lên!` };
  }

  // 6. PP Restorers
  if (key.includes('ether')) {
    const move = pokemon.moves.find((m) => m.pp < m.maxPp);
    if (move) {
      const restoreAmount = key === 'max-ether' ? move.maxPp : 10;
      move.pp = Math.min(move.maxPp, move.pp + restoreAmount);
      return {
        success: true,
        message: `⚡ Đã dùng ${itemName}! Phục hồi PP cho chiêu ${move.nameVi || move.name} của ${name}!`,
      };
    }
  }
  if (key.includes('elixir') || key === 'leppa-berry') {
    const isMax = key === 'max-elixir';
    for (const m of pokemon.moves) {
      m.pp = isMax ? m.maxPp : Math.min(m.maxPp, m.pp + 10);
    }
    return {
      success: true,
      message: `⚡ Đã dùng ${itemName}! Đã phục hồi PP cho toàn bộ chiêu thức của ${name}!`,
    };
  }

  return { success: false, message: `Vật phẩm không có tác dụng với ${name}!` };
}

/**
 * Checks whether an item can be used on a Battler Pokémon during battle.
 */
export function canUseItemOnBattler(item: ItemData, battler: BattlerPokemon): ItemEligibilityResult {
  const key = normalizeKey(item);
  const name = battler.name;

  if (battler.isFainted || battler.currentHp <= 0) {
    return { canUse: false, reason: `${name} đã bị hạ gục!` };
  }

  // HP Restoration
  if (
    key.includes('potion') ||
    key === 'fresh-water' ||
    key === 'soda-pop' ||
    key === 'lemonade' ||
    key === 'moomoo-milk' ||
    key === 'oran-berry' ||
    key === 'sitrus-berry'
  ) {
    if (battler.currentHp >= battler.maxHp) {
      return { canUse: false, reason: `${name} hiện đang đầy máu!` };
    }
    return { canUse: true };
  }

  // Status Recovery
  if (key === 'antidote' || key === 'pecha-berry') {
    if (battler.status !== 'poison' && battler.status !== 'toxic') {
      return { canUse: false, reason: `${name} không bị nhiễm độc!` };
    }
    return { canUse: true };
  }
  if (key === 'awakening' || key === 'chesto-berry') {
    if (battler.status !== 'sleep') {
      return { canUse: false, reason: `${name} không bị ngủ!` };
    }
    return { canUse: true };
  }
  if (key === 'parlyz-heal' || key === 'cheri-berry') {
    if (battler.status !== 'paralysis') {
      return { canUse: false, reason: `${name} không bị tê liệt!` };
    }
    return { canUse: true };
  }
  if (key === 'burn-heal' || key === 'rawst-berry') {
    if (battler.status !== 'burn') {
      return { canUse: false, reason: `${name} không bị bỏng!` };
    }
    return { canUse: true };
  }
  if (key === 'full-heal' || key === 'lum-berry') {
    if (!battler.status || battler.status === 'none') {
      return { canUse: false, reason: `${name} không có trạng thái bất thường!` };
    }
    return { canUse: true };
  }
  if (key === 'full-restore') {
    if (battler.currentHp >= battler.maxHp && (!battler.status || battler.status === 'none')) {
      return { canUse: false, reason: `${name} hoàn toàn khỏe mạnh!` };
    }
    return { canUse: true };
  }

  // Battle Stat Boosters
  if (
    key === 'x-attack' ||
    key === 'x-defense' ||
    key === 'x-speed' ||
    key === 'x-sp-atk' ||
    key === 'x-sp-def' ||
    key === 'dire-hit' ||
    key === 'guard-specs'
  ) {
    return { canUse: true };
  }

  return { canUse: false, reason: `Vật phẩm này không thể dùng trong trận đấu!` };
}

/**
 * Applies an item's effects to an active Battler Pokémon during battle.
 */
export function applyItemToBattler(item: ItemData, battler: BattlerPokemon): ItemActionResult {
  const check = canUseItemOnBattler(item, battler);
  if (!check.canUse) {
    return { success: false, message: check.reason || 'Không thể sử dụng vật phẩm này!' };
  }

  const key = normalizeKey(item);
  const name = battler.name;
  const itemName = item.nameVi || item.name;

  let healAmount = 0;
  if (key === 'potion') healAmount = 20;
  else if (key === 'super-potion') healAmount = 50;
  else if (key === 'hyper-potion') healAmount = 200;
  else if (key === 'max-potion' || key === 'full-restore') healAmount = battler.maxHp;
  else if (key === 'fresh-water') healAmount = 30;
  else if (key === 'soda-pop') healAmount = 50;
  else if (key === 'lemonade') healAmount = 70;
  else if (key === 'moomoo-milk') healAmount = 100;
  else if (key === 'oran-berry') healAmount = 10;
  else if (key === 'sitrus-berry') healAmount = Math.max(30, Math.floor(battler.maxHp / 4));

  if (key === 'full-restore') {
    battler.status = 'none';
  }

  if (healAmount > 0) {
    const oldHp = battler.currentHp;
    battler.currentHp = Math.min(battler.maxHp, battler.currentHp + healAmount);
    const recovered = battler.currentHp - oldHp;
    return {
      success: true,
      message: `Đã dùng ${itemName}! ${name} hồi phục ${recovered} HP!`,
      hpRecovered: recovered,
    };
  }

  // Status cure
  if (
    key === 'antidote' ||
    key === 'pecha-berry' ||
    key === 'awakening' ||
    key === 'chesto-berry' ||
    key === 'parlyz-heal' ||
    key === 'cheri-berry' ||
    key === 'burn-heal' ||
    key === 'rawst-berry' ||
    key === 'full-heal' ||
    key === 'lum-berry'
  ) {
    battler.status = 'none';
    return {
      success: true,
      message: `Đã dùng ${itemName}! ${name} đã khỏi trạng thái bất lợi!`,
    };
  }

  // Battle stat boosters
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

  if (key === 'x-attack') {
    battler.statStages.attack = Math.min(6, battler.statStages.attack + 2);
    return { success: true, message: `Đã dùng ${itemName}! Sức Tấn công của ${name} tăng mạnh!` };
  }
  if (key === 'x-defense') {
    battler.statStages.defense = Math.min(6, battler.statStages.defense + 2);
    return { success: true, message: `Đã dùng ${itemName}! Sức Phòng thủ của ${name} tăng mạnh!` };
  }
  if (key === 'x-speed') {
    battler.statStages.speed = Math.min(6, battler.statStages.speed + 2);
    return { success: true, message: `Đã dùng ${itemName}! Tốc độ của ${name} tăng mạnh!` };
  }
  if (key === 'x-sp-atk') {
    battler.statStages.spAtk = Math.min(6, battler.statStages.spAtk + 2);
    return { success: true, message: `Đã dùng ${itemName}! Công đặc biệt của ${name} tăng mạnh!` };
  }
  if (key === 'x-sp-def') {
    battler.statStages.spDef = Math.min(6, battler.statStages.spDef + 2);
    return { success: true, message: `Đã dùng ${itemName}! Thủ đặc biệt của ${name} tăng mạnh!` };
  }

  return { success: false, message: `Vật phẩm không có tác dụng!` };
}
