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

import type { BattlerPokemon, BattlerSide, BattleEvent, BattleMove, StatusCondition } from '../types';
import { BattleEventFactory } from '../state/battle-event-factory';
import { applyDamage, restoreHp, clearStatusCondition } from '../state/battle-state-reducer';
import { findItem } from '../../data/items-db';

export function normalizeHeldItemKey(itemId?: string | null): string {
  if (!itemId) return '';
  return itemId.toLowerCase().trim().replace(/_/g, '-');
}

export function getHeldItemDisplayName(itemId?: string | null): string {
  if (!itemId) return '';
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
   * Evaluates and consumes pinch berries if Pokémon HP drops to <= 50% max HP.
   */
  public static checkHpTriggeredBerry(
    battler: BattlerPokemon,
    side: BattlerSide
  ): BattleEvent[] {
    const key = normalizeHeldItemKey(battler.heldItem);
    if (!key || battler.currentHp <= 0 || battler.isFainted) return [];

    const hpThreshold = Math.floor(battler.maxHp / 2);
    if (battler.currentHp > hpThreshold) return [];

    const itemName = getHeldItemDisplayName(battler.heldItem);
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
      // Consume item
      battler.heldItem = null;
      const healed = restoreHp(battler, healAmount);
      const msg = `${battler.name} đã ăn quả ${itemName} và hồi phục ${healed} HP!`;
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
    if (!key || !battler.status || battler.status === 'none' || battler.isFainted) return [];

    const status = battler.status;
    let shouldCure = false;

    if (key === 'cheri-berry' && status === 'paralysis') shouldCure = true;
    else if (key === 'chesto-berry' && status === 'sleep') shouldCure = true;
    else if (key === 'pecha-berry' && (status === 'poison' || status === 'toxic')) shouldCure = true;
    else if (key === 'rawst-berry' && status === 'burn') shouldCure = true;
    else if (key === 'aspear-berry' && status === 'freeze') shouldCure = true;
    else if (key === 'lum-berry') shouldCure = true;

    if (shouldCure) {
      const itemName = getHeldItemDisplayName(battler.heldItem);
      // Consume item
      battler.heldItem = null;
      clearStatusCondition(battler);
      const msg = `${battler.name} đã ăn quả ${itemName} và chữa khỏi trạng thái bất thường!`;
      return [
        BattleEventFactory.statusCured(side, battler.name, status as StatusCondition, msg),
      ];
    }

    return [];
  }

  /**
   * Processes end-of-turn held item effects (Leftovers, Black Sludge, Pinch Berries).
   */
  public static processEndTurnHeldItem(
    battler: BattlerPokemon,
    side: BattlerSide
  ): BattleEvent[] {
    if (battler.currentHp <= 0 || battler.isFainted) return [];

    const events: BattleEvent[] = [];
    const key = normalizeHeldItemKey(battler.heldItem);

    // A. Leftovers healing (1/16 Max HP)
    if (key === 'leftovers') {
      if (battler.currentHp < battler.maxHp) {
        const heal = Math.max(1, Math.floor(battler.maxHp / 16));
        const healed = restoreHp(battler, heal);
        const msg = `${battler.name} hồi phục một chút HP nhờ Thức Ăn Thừa (Leftovers)!`;
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
          const msg = `${battler.name} hồi phục HP nhờ Black Sludge!`;
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
        const msg = `${battler.name} bị tổn thương bởi Black Sludge!`;
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
    }

    // C. Check pinch berries at end of turn as well
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
      // Consume Focus Sash and leave with 1 HP
      defender.heldItem = null;
      const finalDmg = Math.max(1, defender.maxHp - 1);
      return {
        damage: finalDmg,
        triggered: true,
        message: `${defender.name} trụ vững với 1 HP nhờ Dải Băng Tập Trung (Focus Sash)!`,
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

    // 1. Defender's Rocky Helmet: 1/6 max HP damage to attacker if physical move
    const defItem = normalizeHeldItemKey(defender.heldItem);
    if (defItem === 'rocky-helmet' && move.category === 'physical' && attacker.currentHp > 0) {
      const helmetDmg = Math.max(1, Math.floor(attacker.maxHp / 6));
      applyDamage(attacker, helmetDmg);
      const helmetMsg = `${attacker.name} bị tổn thương bởi Mũ Gai (Rocky Helmet) của ${defender.name}!`;
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
    if (atkItem === 'life-orb' && attacker.currentHp > 0 && !attacker.isFainted) {
      const orbDmg = Math.max(1, Math.floor(attacker.maxHp / 10));
      applyDamage(attacker, orbDmg);
      const orbMsg = `${attacker.name} bị tiêu hao sinh lực bởi Quả Cầu Sinh Mệnh (Life Orb)!`;
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

    // 3. Defender's HP Berry check (e.g. Sitrus / Oran Berry)
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
}
