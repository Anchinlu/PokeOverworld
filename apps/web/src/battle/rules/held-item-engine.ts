/**
 * Unified Held Item Engine
 * Declarative mechanics and lifecycle handlers for Pokémon held items in battle:
 * - HP Triggered Berries (Oran, Sitrus, Figy, Wiki, Mago, Aguav, Iapapa)
 * - Status Curing Berries (Cheri, Chesto, Pecha, Rawst, Aspear, Lum)
 * - End-of-Turn Items (Leftovers, Black Sludge)
 * - Damage Boosters (Type-boosters +20%, Life Orb, Expert Belt, Muscle Band, Wise Glasses)
 * - Stat Multipliers (Choice Band, Choice Specs, Choice Scarf, Eviolite)
 * - Defensive / Counter Items (Focus Sash, Rocky Helmet)
 * - EXP Multiplier (Lucky Egg)
 */

import type {
  BattlerPokemon,
  BattlerSide,
  BattleEvent,
  BattleMove,
  StatusCondition,
} from '../types';
import { BattleEventFactory } from '../state/battle-event-factory';
import {
  applyDamage,
  restoreHp,
  clearStatusCondition,
  applyStatStageChange,
  setStatusCondition,
} from '../state/battle-state-reducer';
import { findItem } from '../../data/items-db';
import { AbilityEngine } from './ability-engine';

export function normalizeHeldItemKey(itemId?: string | null): string {
  if (!itemId) return '';
  return itemId.toLowerCase().trim().replace(/_/g, '-');
}

export function getHeldItemDisplayName(itemId?: string | null): string {
  if (!itemId) return '';
  const key = normalizeHeldItemKey(itemId);
  if (key === 'leftovers') return 'Thức Ăn Thừa';
  if (key === 'black-sludge') return 'Bùn Đen';
  if (key === 'life-orb') return 'Quả Cầu Sinh Mệnh';
  if (key === 'rocky-helmet') return 'Mũ Gai';
  if (key === 'focus-sash') return 'Dải Băng Tập Trung';
  if (key === 'air-balloon') return 'Khinh Khí Cầu';
  if (key === 'flame-orb') return 'Quả Cầu Lửa';
  if (key === 'toxic-orb') return 'Quả Cầu Độc';
  if (key === 'heavy-duty-boots') return 'Giày Chống Gai';
  if (key === 'shed-shell') return 'Vỏ Lột';
  if (key === 'choice-band') return 'Băng Tuyển Chọn';
  if (key === 'choice-specs') return 'Kính Tuyển Chọn';
  if (key === 'choice-scarf') return 'Khăn Tuyển Chọn';
  if (key === 'expert-belt') return 'Đai Chuyên Gia';
  if (key === 'muscle-band') return 'Băng Cơ Bắp';
  if (key === 'wise-glasses') return 'Kính Thông Thái';
  if (key === 'lucky-egg') return 'Trứng May Mắn';
  if (key === 'eviolite') return 'Đá Tiến Hóa';
  if (key === 'assault-vest') return 'Áo Giáp Tấn Công';
  if (key === 'damp-rock') return 'Đá Ẩm Ướt';
  if (key === 'heat-rock') return 'Đá Tỏa Nhiệt';
  if (key === 'smooth-rock') return 'Đá Mịn Màng';
  if (key === 'icy-rock') return 'Đá Băng Giá';
  if (key === 'terrain-extender') return 'Dụng Cụ Mở Rộng Địa Hình';
  // Berries
  if (key === 'oran-berry') return 'Quả Oran';
  if (key === 'sitrus-berry') return 'Quả Sitrus';
  if (key === 'cheri-berry') return 'Quả Cheri';
  if (key === 'chesto-berry') return 'Quả Chesto';
  if (key === 'pecha-berry') return 'Quả Pecha';
  if (key === 'rawst-berry') return 'Quả Rawst';
  if (key === 'aspear-berry') return 'Quả Aspear';
  if (key === 'leppa-berry') return 'Quả Leppa';
  if (key === 'persim-berry') return 'Quả Persim';
  if (key === 'lum-berry') return 'Quả Lum';
  if (key === 'figy-berry') return 'Quả Figy';
  if (key === 'wiki-berry') return 'Quả Wiki';
  if (key === 'mago-berry') return 'Quả Mago';
  if (key === 'aguav-berry') return 'Quả Aguav';
  if (key === 'iapapa-berry') return 'Quả Iapapa';
  if (key === 'liechi-berry') return 'Quả Liechi';
  if (key === 'ganlon-berry') return 'Quả Ganlon';
  if (key === 'salac-berry') return 'Quả Salac';
  if (key === 'petaya-berry') return 'Quả Petaya';
  if (key === 'apicot-berry') return 'Quả Apicot';
  if (key === 'berry-juice') return 'Nước Ép Quả';
  const def = findItem(itemId);
  return def ? def.nameVi || def.name : itemId;
}

// 17 Type-Boosting Held Items (+20% damage)
const TYPE_BOOSTING_ITEMS: Record<string, string> = {
  charcoal: 'Fire',
  'mystic-water': 'Water',
  'miracle-seed': 'Grass',
  magnet: 'Electric',
  'silk-scarf': 'Normal',
  'sharp-beak': 'Flying',
  'black-belt': 'Fighting',
  'poison-barb': 'Poison',
  'soft-sand': 'Ground',
  'hard-stone': 'Rock',
  'silver-powder': 'Bug',
  'spell-tag': 'Ghost',
  'metal-coat': 'Steel',
  'dragon-fang': 'Dragon',
  'black-glasses': 'Dark',
  'twisted-spoon': 'Psychic',
  'never-melt-ice': 'Ice',
};

export class HeldItemEngine {
  /**
   * Calculates weather duration based on weather-extending held items:
   * - Damp Rock (Đá Ẩm Ướt) extends Rain from 5 to 8 turns
   * - Heat Rock (Đá Tỏa Nhiệt) extends Sun from 5 to 8 turns
   * - Smooth Rock (Đá Mịn Màng) extends Sandstorm from 5 to 8 turns
   * - Icy Rock (Đá Băng Giá) extends Hail/Snow from 5 to 8 turns
   */
  public static getWeatherDuration(
    weatherType: 'sun' | 'rain' | 'sandstorm' | 'hail',
    heldItem?: string | null
  ): number {
    const key = normalizeHeldItemKey(heldItem);
    if (weatherType === 'rain' && key === 'damp-rock') return 8;
    if (weatherType === 'sun' && key === 'heat-rock') return 8;
    if (weatherType === 'sandstorm' && key === 'smooth-rock') return 8;
    if (weatherType === 'hail' && key === 'icy-rock') return 8;
    return 5;
  }

  /**
   * Calculates terrain duration based on Terrain Extender (5 -> 8 turns).
   */
  public static getTerrainDuration(heldItem?: string | null): number {
    const key = normalizeHeldItemKey(heldItem);
    if (key === 'terrain-extender') return 8;
    return 5;
  }

  /**
   * Evaluates and consumes pinch berries if Pokémon HP drops to <= 50% max HP (or <= 25% for stat berries).
   */
  public static checkHpTriggeredBerry(battler: BattlerPokemon, side: BattlerSide): BattleEvent[] {
    const key = normalizeHeldItemKey(battler.heldItem);
    if (!key || battler.currentHp <= 0 || battler.isFainted) return [];

    const itemName = getHeldItemDisplayName(battler.heldItem);

    // HP-Triggered Pinch Berries (<= 50% Max HP)
    const hpThreshold = Math.floor(battler.maxHp / 2);
    if (battler.currentHp <= hpThreshold) {
      let healAmount = 0;
      if (key === 'oran-berry' || key === 'berry-juice') {
        healAmount = 10;
      } else if (key === 'sitrus-berry') {
        healAmount = Math.max(1, Math.floor(battler.maxHp / 4));
      } else if (
        key === 'figy-berry' ||
        key === 'wiki-berry' ||
        key === 'mago-berry' ||
        key === 'aguav-berry' ||
        key === 'iapapa-berry'
      ) {
        healAmount = Math.max(1, Math.floor(battler.maxHp / 3));
      }

      if (healAmount > 0) {
        battler.lastConsumedItem = battler.heldItem;
        battler.heldItem = null;
        const healed = restoreHp(battler, healAmount);
        const msg = `${battler.name} đã ăn [${itemName}] và hồi phục ${healed} HP!`;
        return [
          BattleEventFactory.hpRestored(
            side,
            battler.name,
            healed,
            battler.currentHp,
            battler.maxHp,
            'item',
            msg
          ),
        ];
      }
    }

    // Stat-Triggered Pinch Berries (<= 25% Max HP)
    const statPinchThreshold = Math.floor(battler.maxHp / 4);
    if (battler.currentHp <= statPinchThreshold) {
      let boostedStat: 'attack' | 'defense' | 'speed' | 'spAtk' | 'spDef' | null = null;
      let statViName = '';

      if (key === 'liechi-berry') {
        boostedStat = 'attack';
        statViName = 'Tấn công';
      } else if (key === 'ganlon-berry') {
        boostedStat = 'defense';
        statViName = 'Phòng thủ';
      } else if (key === 'salac-berry') {
        boostedStat = 'speed';
        statViName = 'Tốc độ';
      } else if (key === 'petaya-berry') {
        boostedStat = 'spAtk';
        statViName = 'Đặc công';
      } else if (key === 'apicot-berry') {
        boostedStat = 'spDef';
        statViName = 'Đặc phòng';
      }

      if (boostedStat) {
        battler.lastConsumedItem = battler.heldItem;
        battler.heldItem = null;
        const stageChange = applyStatStageChange(battler, boostedStat, 1);
        const msg = `${battler.name} đã ăn [${itemName}], ${statViName} tăng lên!`;
        const currentStage = battler.statStages?.[boostedStat] ?? 0;
        return [
          BattleEventFactory.statStageChanged(
            side,
            battler.name,
            boostedStat,
            stageChange,
            currentStage,
            msg
          ),
        ];
      }
    }

    return [];
  }

  /**
   * Evaluates and consumes Leppa Berry if a Pokémon move depletes to 0 PP.
   * Restores 10 PP to that depleted move.
   */
  public static checkPpTriggeredBerry(
    battler: BattlerPokemon,
    side: BattlerSide,
    depletedMove?: BattleMove
  ): BattleEvent[] {
    const key = normalizeHeldItemKey(battler.heldItem);
    if (key !== 'leppa-berry' || battler.isFainted || battler.currentHp <= 0) return [];

    const targetMove =
      depletedMove && depletedMove.pp <= 0
        ? depletedMove
        : battler.moves.find((m) => m.pp <= 0);

    if (targetMove) {
      battler.lastConsumedItem = battler.heldItem;
      battler.heldItem = null;
      targetMove.pp = Math.min(targetMove.maxPp, targetMove.pp + 10);
      const itemName = getHeldItemDisplayName('leppa-berry');
      const msg = `${battler.name} đã ăn [${itemName}] và phục hồi 10 PP cho chiêu ${targetMove.nameVi || targetMove.name}!`;

      return [
        BattleEventFactory.hpRestored(
          side,
          battler.name,
          0,
          battler.currentHp,
          battler.maxHp,
          'item',
          msg
        ),
      ];
    }
    return [];
  }

  /**
   * Evaluates and consumes status curing berries if Pokémon suffers from corresponding status.
   */
  public static checkStatusTriggeredBerry(
    battler: BattlerPokemon,
    side: BattlerSide
  ): BattleEvent[] {
    const key = normalizeHeldItemKey(battler.heldItem);
    if (!key || battler.isFainted) return [];

    const status = battler.status;
    let shouldCure = false;
    let statusDetail = 'trạng thái bất thường';

    if (key === 'cheri-berry' && status === 'paralysis') {
      shouldCure = true;
      statusDetail = 'tê liệt';
    } else if (key === 'chesto-berry' && status === 'sleep') {
      shouldCure = true;
      statusDetail = 'giấc ngủ';
    } else if (key === 'pecha-berry' && (status === 'poison' || status === 'toxic')) {
      shouldCure = true;
      statusDetail = 'trúng độc';
    } else if (key === 'rawst-berry' && status === 'burn') {
      shouldCure = true;
      statusDetail = 'bỏng';
    } else if (key === 'aspear-berry' && status === 'freeze') {
      shouldCure = true;
      statusDetail = 'băng giá';
    } else if (
      key === 'lum-berry' &&
      ((status && status !== 'none') || (battler.confusionTurns ?? 0) > 0)
    ) {
      shouldCure = true;
      statusDetail = 'toàn bộ trạng thái bất thường';
    } else if (key === 'persim-berry' && (battler.confusionTurns ?? 0) > 0) {
      const itemName = getHeldItemDisplayName(battler.heldItem);
      battler.lastConsumedItem = battler.heldItem;
      battler.heldItem = null;
      battler.confusionTurns = 0;
      const msg = `${battler.name} đã ăn [${itemName}] và chữa khỏi trạng thái bối rối!`;
      return [BattleEventFactory.statusCured(side, battler.name, 'confusion', msg)];
    }

    if (shouldCure) {
      const itemName = getHeldItemDisplayName(battler.heldItem);
      battler.lastConsumedItem = battler.heldItem;
      battler.heldItem = null;
      const curedCondition = status && status !== 'none' ? status : 'confusion';
      clearStatusCondition(battler);
      if (key === 'lum-berry' && (battler.confusionTurns ?? 0) > 0) {
        battler.confusionTurns = 0;
      }
      const msg = `${battler.name} đã ăn [${itemName}] và chữa khỏi ${statusDetail}!`;
      return [
        BattleEventFactory.statusCured(side, battler.name, curedCondition as StatusCondition, msg),
      ];
    }

    return [];
  }

  /**
   * Processes end-of-turn held item effects (Leftovers, Black Sludge, Flame Orb, Toxic Orb, Pinch Berries).
   */
  public static processEndTurnHeldItem(battler: BattlerPokemon, side: BattlerSide): BattleEvent[] {
    if (battler.currentHp <= 0 || battler.isFainted) return [];

    const events: BattleEvent[] = [];
    const key = normalizeHeldItemKey(battler.heldItem);
    const itemName = getHeldItemDisplayName(battler.heldItem);

    // A. Leftovers healing (1/16 Max HP)
    if (key === 'leftovers') {
      if (battler.currentHp < battler.maxHp) {
        const heal = Math.max(1, Math.floor(battler.maxHp / 16));
        const healed = restoreHp(battler, heal);
        const msg = `${battler.name} hồi phục ${healed} HP nhờ [${itemName}]!`;
        events.push(
          BattleEventFactory.hpRestored(
            side,
            battler.name,
            healed,
            battler.currentHp,
            battler.maxHp,
            'item',
            msg
          )
        );
      }
    } else if (key === 'black-sludge') {
      // B. Black Sludge (heals Poison-types, damages non-Poison types)
      if (battler.types.includes('Poison')) {
        if (battler.currentHp < battler.maxHp) {
          const heal = Math.max(1, Math.floor(battler.maxHp / 16));
          const healed = restoreHp(battler, heal);
          const msg = `${battler.name} hồi phục ${healed} HP nhờ [${itemName}]!`;
          events.push(
            BattleEventFactory.hpRestored(
              side,
              battler.name,
              healed,
              battler.currentHp,
              battler.maxHp,
              'item',
              msg
            )
          );
        }
      } else {
        const dmg = Math.max(1, Math.floor(battler.maxHp / 8));
        applyDamage(battler, dmg);
        const msg = `${battler.name} bị tổn thương ${dmg} HP bởi [${itemName}]!`;
        events.push(
          BattleEventFactory.endTurnDamage(
            side,
            battler.name,
            dmg,
            battler.currentHp,
            'poison',
            msg
          )
        );
      }
    } else if (key === 'flame-orb') {
      // C. Flame Orb (inflicts burn at end of turn)
      if (
        battler.status === 'none' &&
        !battler.types.includes('Fire') &&
        AbilityEngine.normalize(battler.ability) !== 'waterveil'
      ) {
        setStatusCondition(battler, 'burn');
        const msg = `${battler.name} bị bỏng bởi [${itemName}]!`;
        events.push(BattleEventFactory.statusInflicted(side, battler.name, 'burn', msg));
      }
    } else if (key === 'toxic-orb') {
      // D. Toxic Orb (inflicts toxic poison at end of turn)
      if (
        battler.status === 'none' &&
        !battler.types.includes('Poison') &&
        !battler.types.includes('Steel') &&
        AbilityEngine.normalize(battler.ability) !== 'immunity'
      ) {
        setStatusCondition(battler, 'toxic');
        const msg = `${battler.name} bị trúng độc nặng bởi [${itemName}]!`;
        events.push(BattleEventFactory.statusInflicted(side, battler.name, 'toxic', msg));
      }
    }

    // E. Check pinch berries at end of turn as well
    const berryEvents = this.checkHpTriggeredBerry(battler, side);
    events.push(...berryEvents);

    return events;
  }

  /**
   * Evaluates outgoing damage multiplier from attacker's held item.
   */
  public static getDamageMultiplier(
    attacker: BattlerPokemon,
    _defender: BattlerPokemon,
    move: BattleMove,
    typeEff: number
  ): number {
    const key = normalizeHeldItemKey(attacker.heldItem);
    if (!key) return 1.0;

    let mult = 1.0;

    // Type-boosting item (e.g. Charcoal -> Fire, Mystic Water -> Water)
    const boostedType = TYPE_BOOSTING_ITEMS[key];
    if (boostedType && move.type === boostedType) {
      mult *= 1.2;
    }

    // Life Orb: +30% damage
    if (key === 'life-orb') {
      mult *= 1.3;
    }

    // Expert Belt: +20% damage on super-effective hit
    if (key === 'expert-belt' && typeEff > 1.0) {
      mult *= 1.2;
    }

    // Muscle Band: +10% physical damage
    if (key === 'muscle-band' && move.category === 'physical') {
      mult *= 1.1;
    }

    // Wise Glasses: +10% special damage
    if (key === 'wise-glasses' && move.category === 'special') {
      mult *= 1.1;
    }

    return mult;
  }

  /**
   * Evaluates combat stat multiplier from held items (Choice items, Eviolite).
   */
  public static getStatMultiplier(
    battler: BattlerPokemon,
    stat: 'attack' | 'defense' | 'spAtk' | 'spDef' | 'speed'
  ): number {
    const key = normalizeHeldItemKey(battler.heldItem);
    if (!key) return 1.0;

    // Choice Band: +50% Attack
    if (key === 'choice-band' && stat === 'attack') return 1.5;

    // Choice Specs: +50% Sp. Attack
    if (key === 'choice-specs' && stat === 'spAtk') return 1.5;

    // Choice Scarf: +50% Speed
    if (key === 'choice-scarf' && stat === 'speed') return 1.5;

    // Eviolite: +50% Def & Sp.Def for unevolved Pokémon
    if (key === 'eviolite' && (stat === 'defense' || stat === 'spDef')) {
      // Any species that can evolve gets 1.5x Def/SpDef
      return 1.5;
    }

    return 1.0;
  }

  /**
   * Evaluates Focus Sash survival when receiving lethal damage.
   */
  public static checkFocusSash(
    defender: BattlerPokemon,
    incomingDamage: number
  ): { damage: number; triggered: boolean; message: string } {
    const key = normalizeHeldItemKey(defender.heldItem);
    if (
      key === 'focus-sash' &&
      defender.currentHp === defender.maxHp &&
      incomingDamage >= defender.currentHp
    ) {
      const itemName = getHeldItemDisplayName(defender.heldItem);
      defender.lastConsumedItem = defender.heldItem;
      defender.heldItem = null;
      const finalDmg = Math.max(1, defender.maxHp - 1);
      return {
        damage: finalDmg,
        triggered: true,
        message: `${defender.name} trụ vững với 1 HP nhờ [${itemName}]!`,
      };
    }

    return {
      damage: incomingDamage,
      triggered: false,
      message: '',
    };
  }

  /**
   * Evaluates post-attack reactive effects:
   * - Life Orb recoil: 10% max HP damage to attacker
   * - Rocky Helmet: 1/6 max HP recoil to attacker on physical / contact move
   * - Air Balloon: pops upon receiving direct damage
   * - Defender pinch berries if HP dropped to <= 50%
   */
  public static checkPostAttackEffects(
    attacker: BattlerPokemon,
    attackerSide: BattlerSide,
    defender: BattlerPokemon,
    defenderSide: BattlerSide,
    move: BattleMove,
    damageDealt: number
  ): BattleEvent[] {
    if (damageDealt <= 0) return [];
    const events: BattleEvent[] = [];

    const isMagicGuard = AbilityEngine.normalize(attacker.ability) === 'magicguard';

    // 1. Defender's Rocky Helmet: 1/6 max HP damage to attacker if physical move
    const defItem = normalizeHeldItemKey(defender.heldItem);
    if (
      defItem === 'rocky-helmet' &&
      move.category === 'physical' &&
      attacker.currentHp > 0 &&
      !isMagicGuard
    ) {
      const helmetName = getHeldItemDisplayName(defender.heldItem);
      const helmetDmg = Math.max(1, Math.floor(attacker.maxHp / 6));
      applyDamage(attacker, helmetDmg);
      const helmetMsg = `${attacker.name} bị tổn thương ${helmetDmg} HP bởi [${helmetName}] của ${defender.name}!`;
      events.push(
        BattleEventFactory.recoilDamage(
          attackerSide,
          attacker.name,
          helmetDmg,
          attacker.currentHp,
          helmetMsg
        )
      );
      if (attacker.currentHp <= 0) {
        attacker.isFainted = true;
        events.push(
          BattleEventFactory.fainted(attackerSide, attacker.name, `${attacker.name} đã ngất xỉu!`)
        );
      }
    }

    // 2. Attacker's Life Orb: 10% max HP recoil damage
    const atkItem = normalizeHeldItemKey(attacker.heldItem);
    if (atkItem === 'life-orb' && attacker.currentHp > 0 && !attacker.isFainted && !isMagicGuard) {
      const orbName = getHeldItemDisplayName(attacker.heldItem);
      const orbDmg = Math.max(1, Math.floor(attacker.maxHp / 10));
      applyDamage(attacker, orbDmg);
      const orbMsg = `${attacker.name} bị tiêu hao ${orbDmg} HP bởi [${orbName}]!`;
      events.push(
        BattleEventFactory.recoilDamage(
          attackerSide,
          attacker.name,
          orbDmg,
          attacker.currentHp,
          orbMsg
        )
      );
      if (attacker.currentHp <= 0) {
        attacker.isFainted = true;
        events.push(
          BattleEventFactory.fainted(attackerSide, attacker.name, `${attacker.name} đã ngất xỉu!`)
        );
      }
    }

    // 3. Defender's Air Balloon pops when receiving damage
    if (defItem === 'air-balloon' && defender.currentHp > 0 && !defender.isFainted) {
      const balloonName = getHeldItemDisplayName(defender.heldItem);
      defender.lastConsumedItem = defender.heldItem;
      defender.heldItem = null;
      const balloonMsg = `Khinh khí cầu [${balloonName}] của ${defender.name} đã bị nổ!`;
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          'air-balloon',
          balloonName,
          'popped',
          balloonMsg
        )
      );
    }

    // 4. Defender's HP Berry check (e.g. Sitrus / Oran / Pinch Berries)
    if (defender.currentHp > 0 && !defender.isFainted) {
      const berryEvents = this.checkHpTriggeredBerry(defender, defenderSide);
      events.push(...berryEvents);
    }

    return events;
  }

  /**
   * Evaluates EXP multiplier from held items (Lucky Egg: 1.5x).
   */
  public static getExpMultiplier(battler: BattlerPokemon): number {
    const key = normalizeHeldItemKey(battler.heldItem);
    if (key === 'lucky-egg') {
      return 1.5;
    }
    return 1.0;
  }

  /**
   * Checks if a held item confers type immunity (e.g. Air Balloon Ground immunity).
   */
  public static checkTypeImmunity(
    defender: BattlerPokemon,
    defenderSide: BattlerSide,
    move: BattleMove,
    events: BattleEvent[]
  ): { isImmune: boolean; message?: string } {
    const itemKey = normalizeHeldItemKey(defender.heldItem);
    if (itemKey === 'air-balloon' && move.type === 'Ground') {
      const itemName = getHeldItemDisplayName(defender.heldItem);
      const msg = `${defender.name} né tránh hoàn toàn đòn ${move.name} nhờ bay trên [${itemName}]!`;
      events.push(
        BattleEventFactory.abilityTriggered(
          defenderSide,
          defender.name,
          'air-balloon',
          itemName,
          'Miễn nhiễm hệ Ground',
          msg
        )
      );
      return { isImmune: true, message: msg };
    }
    return { isImmune: false };
  }
}

/**
 * Checks whether an item ID corresponds to a berry.
 */
export function isBerryItem(itemId?: string | null): boolean {
  if (!itemId) return false;
  const key = normalizeHeldItemKey(itemId);
  return key.endsWith('-berry') || key === 'berry-juice';
}

/**
 * Returns the base power for the move Fling based on held item.
 */
export function getFlingPower(itemId?: string | null): number {
  const key = normalizeHeldItemKey(itemId);
  if (!key) return 0;
  if (key === 'iron-ball') return 130;
  if (key === 'hard-stone' || key === 'rare-bone') return 100;
  if (key === 'heavy-duty-boots') return 80;
  if (key === 'poison-barb' || key === 'dragon-fang') return 70;
  if (
    key.endsWith('-rock') ||
    key === 'damp-rock' ||
    key === 'heat-rock' ||
    key === 'smooth-rock' ||
    key === 'icy-rock'
  )
    return 60;
  if (key === 'sharp-beak') return 50;
  if (key === 'eviolite' || key === 'rocky-helmet' || key === 'black-belt') return 40;
  if (key.endsWith('-berry') || key === 'berry-juice') return 10;
  if (key.startsWith('choice-')) return 10;
  return 30;
}

/**
 * Immediately consumes a berry on a battler and returns the result message while pushing events.
 */
export function consumeBerry(
  battler: BattlerPokemon,
  side: BattlerSide,
  berryKey: string,
  events: BattleEvent[]
): string {
  const key = normalizeHeldItemKey(berryKey);
  const berryName = getHeldItemDisplayName(berryKey);

  // HP Berries
  if (key === 'sitrus-berry') {
    const heal = Math.max(1, Math.floor(battler.maxHp / 4));
    const healed = restoreHp(battler, heal);
    events.push(
      BattleEventFactory.hpRestored(
        side,
        battler.name,
        healed,
        battler.currentHp,
        battler.maxHp,
        'item',
        `${battler.name} hồi phục ${healed} HP từ ${berryName}!`
      )
    );
    return `Đã hồi phục ${healed} HP!`;
  }
  if (key === 'oran-berry' || key === 'berry-juice') {
    const heal = Math.min(10, battler.maxHp - battler.currentHp);
    const healed = restoreHp(battler, heal);
    events.push(
      BattleEventFactory.hpRestored(
        side,
        battler.name,
        healed,
        battler.currentHp,
        battler.maxHp,
        'item',
        `${battler.name} hồi phục ${healed} HP từ ${berryName}!`
      )
    );
    return `Đã hồi phục ${healed} HP!`;
  }
  if (
    key === 'figy-berry' ||
    key === 'wiki-berry' ||
    key === 'mago-berry' ||
    key === 'aguav-berry' ||
    key === 'iapapa-berry'
  ) {
    const heal = Math.max(1, Math.floor(battler.maxHp / 3));
    const healed = restoreHp(battler, heal);
    events.push(
      BattleEventFactory.hpRestored(
        side,
        battler.name,
        healed,
        battler.currentHp,
        battler.maxHp,
        'item',
        `${battler.name} hồi phục ${healed} HP từ ${berryName}!`
      )
    );
    return `Đã hồi phục ${healed} HP!`;
  }

  // Status Berries
  if (key === 'lum-berry') {
    let cured = false;
    if (battler.status && battler.status !== 'none') {
      const oldStatus = battler.status;
      clearStatusCondition(battler);
      events.push(
        BattleEventFactory.statusCured(
          side,
          battler.name,
          oldStatus,
          `${battler.name} đã khỏi trạng thái!`
        )
      );
      cured = true;
    }
    if ((battler.confusionTurns ?? 0) > 0) {
      battler.confusionTurns = 0;
      cured = true;
    }
    return cured
      ? `Đã chữa khỏi toàn bộ trạng thái bất thường!`
      : `Nhưng không có trạng thái nào để chữa.`;
  }
  if (key === 'cheri-berry' && battler.status === 'paralysis') {
    clearStatusCondition(battler);
    events.push(
      BattleEventFactory.statusCured(
        side,
        battler.name,
        'paralysis',
        `${battler.name} đã khỏi tê liệt!`
      )
    );
    return `Đã chữa khỏi tê liệt!`;
  }
  if (key === 'chesto-berry' && battler.status === 'sleep') {
    clearStatusCondition(battler);
    events.push(
      BattleEventFactory.statusCured(side, battler.name, 'sleep', `${battler.name} đã tỉnh giấc!`)
    );
    return `Đã tỉnh giấc!`;
  }
  if (key === 'pecha-berry' && (battler.status === 'poison' || battler.status === 'toxic')) {
    const oldStatus = battler.status;
    clearStatusCondition(battler);
    events.push(
      BattleEventFactory.statusCured(side, battler.name, oldStatus, `${battler.name} đã giải độc!`)
    );
    return `Đã giải độc!`;
  }
  if (key === 'rawst-berry' && battler.status === 'burn') {
    clearStatusCondition(battler);
    events.push(
      BattleEventFactory.statusCured(side, battler.name, 'burn', `${battler.name} đã khỏi bỏng!`)
    );
    return `Đã chữa khỏi bỏng!`;
  }
  if (key === 'aspear-berry' && battler.status === 'freeze') {
    clearStatusCondition(battler);
    events.push(
      BattleEventFactory.statusCured(side, battler.name, 'freeze', `${battler.name} đã tan băng!`)
    );
    return `Đã tan băng!`;
  }

  // Stat Berries
  if (key === 'liechi-berry') {
    applyStatStageChange(battler, 'attack', 1);
    return `Tấn công tăng lên!`;
  }
  if (key === 'ganlon-berry') {
    applyStatStageChange(battler, 'defense', 1);
    return `Phòng thủ tăng lên!`;
  }
  if (key === 'salac-berry') {
    applyStatStageChange(battler, 'speed', 1);
    return `Tốc độ tăng lên!`;
  }
  if (key === 'petaya-berry') {
    applyStatStageChange(battler, 'spAtk', 1);
    return `Đặc công tăng lên!`;
  }
  if (key === 'apicot-berry') {
    applyStatStageChange(battler, 'spDef', 1);
    return `Đặc phòng tăng lên!`;
  }

  // Generic fallback for any other berry
  const heal = Math.max(1, Math.floor(battler.maxHp * 0.1));
  const healed = restoreHp(battler, heal);
  return `Đã hồi phục ${healed} HP!`;
}
