import type {
  BattlerPokemon,
  BattlerSide,
  BattleEvent,
  BattleMove,
  BattleEnvironment,
} from '../types';
import type { BattleRng } from '../battle-rng';
import { BattleEventFactory } from '../state/battle-event-factory';
import {
  ensureBattlerState,
  applyDamage,
  restoreHp,
  clearStatusCondition,
} from '../state/battle-state-reducer';

import { HeldItemEngine } from './held-item-engine';
import { AbilityEngine } from './ability-engine';
// Environment rules (weather & terrain integration)
import {
  calculateEndTurnWeatherDamage,
  calculateEndTurnTerrainHealing,
  canApplyStatusInTerrain,
} from './environment';

export interface PreTurnStatusResult {
  canAct: boolean;
  statusPrefix: string;
  hinderedMessage?: string;
  events: BattleEvent[];
}

export interface EndTurnEffectResult {
  damage: number;
  defenderFainted: boolean;
  message: string;
  events: BattleEvent[];
}

/**
 * Checks type-based and ability-based immunities for primary status conditions.
 */
export function getStatusImmunity(
  target: BattlerPokemon,
  condition: NonNullable<BattleMove['statusEffect']>['condition'],
  environment?: BattleEnvironment
): string | null {
  if (
    environment?.terrain &&
    !canApplyStatusInTerrain(environment.terrain.type, condition, target)
  ) {
    if (environment.terrain.type === 'electric') {
      return 'Điện trường trên mặt đất ngăn cản giấc ngủ!';
    }
    if (environment.terrain.type === 'misty') {
      return 'Màn sương mù trên mặt đất bảo vệ khỏi các trạng thái bất lợi!';
    }
  }

  const abilityImmunity = AbilityEngine.isStatusImmune(target, condition);
  if (abilityImmunity.immune) {
    return abilityImmunity.reason ?? 'Đặc tính của Pokémon ngăn chặn trạng thái này.';
  }

  if (condition === 'burn' && target.types.includes('Fire')) {
    return 'Pokémon hệ Lửa không thể bị bỏng.';
  }
  if (condition === 'paralysis' && target.types.includes('Electric')) {
    return 'Pokémon hệ Điện không thể bị tê liệt.';
  }
  if (
    (condition === 'poison' || condition === 'toxic') &&
    (target.types.includes('Poison') || target.types.includes('Steel'))
  ) {
    return 'Chiêu thức không có tác dụng với Pokémon này.';
  }
  if (condition === 'freeze' && target.types.includes('Ice')) {
    return 'Pokémon hệ Băng không thể bị đóng băng.';
  }
  return null;
}

/**
 * Checks if a Pokémon is hindered from moving due to its primary status ailment (Sleep, Freeze, Paralysis).
 */
export function checkPreTurnStatus(
  attacker: BattlerPokemon,
  attackerSide: BattlerSide,
  rng: BattleRng
): PreTurnStatusResult {
  ensureBattlerState(attacker);
  const events: BattleEvent[] = [];
  let statusPrefix = '';

  // 0. Check Status Curing Berry (Cheri, Chesto, Pecha, Rawst, Aspear, Lum)
  const berryCureEvents = HeldItemEngine.checkStatusTriggeredBerry(attacker, attackerSide);
  if (berryCureEvents.length > 0) {
    events.push(...berryCureEvents);
    statusPrefix = `${berryCureEvents[0].message ?? ''} `;
  }

  // 1. Sleep handling
  if (attacker.status === 'sleep') {
    if ((attacker.sleepTurns ?? 0) > 0) {
      attacker.sleepTurns!--;
      const sleepMsg = `${attacker.name} đang ngủ say!`;
      events.push(
        BattleEventFactory.statusHindered(attackerSide, attacker.name, 'sleep', sleepMsg)
      );
      return {
        canAct: false,
        statusPrefix: '',
        hinderedMessage: sleepMsg,
        events,
      };
    } else {
      clearStatusCondition(attacker);
      const wakeMsg = `${attacker.name} đã tỉnh giấc! `;
      events.push(BattleEventFactory.statusCured(attackerSide, attacker.name, 'sleep', wakeMsg));
      statusPrefix = wakeMsg;
    }
  }

  // 2. Freeze handling
  if (attacker.status === 'freeze') {
    if (rng.next() < 0.2) {
      clearStatusCondition(attacker);
      const thawMsg = `${attacker.name} đã tan băng! `;
      events.push(BattleEventFactory.statusCured(attackerSide, attacker.name, 'freeze', thawMsg));
      statusPrefix = thawMsg;
    } else {
      const freezeMsg = `${attacker.name} bị đóng băng cứng đờ!`;
      events.push(
        BattleEventFactory.statusHindered(attackerSide, attacker.name, 'freeze', freezeMsg)
      );
      return {
        canAct: false,
        statusPrefix: '',
        hinderedMessage: freezeMsg,
        events,
      };
    }
  }

  // 3. Paralysis handling (25% full paralysis)
  if (attacker.status === 'paralysis') {
    if (rng.next() < 0.25) {
      const paraMsg = `${attacker.name} bị tê liệt hoàn toàn! Không thể cử động!`;
      events.push(
        BattleEventFactory.statusHindered(attackerSide, attacker.name, 'paralysis', paraMsg)
      );
      return {
        canAct: false,
        statusPrefix: '',
        hinderedMessage: paraMsg,
        events,
      };
    }
  }

  return {
    canAct: true,
    statusPrefix,
    events,
  };
}

/**
 * Evaluates and applies persistent end-turn damage (Burn, Poison, Toxic, Leech Seed).
 */
export function processEndTurnEffects(
  target: BattlerPokemon,
  targetSide: BattlerSide,
  opponent?: BattlerPokemon,
  opponentSide?: BattlerSide,
  environment?: BattleEnvironment
): EndTurnEffectResult | null {
  ensureBattlerState(target);
  if (target.currentHp <= 0 || target.isFainted) return null;

  let totalDamage = 0;
  let messageText = '';
  const events: BattleEvent[] = [];

  const abilityKey = AbilityEngine.normalize(target.ability);
  const isMagicGuard = abilityKey === 'magicguard';
  const isPoisonHeal = abilityKey === 'poisonheal';

  // Burn tick
  if (target.status === 'burn') {
    if (!isMagicGuard) {
      const burnDmg = Math.max(1, Math.floor(target.maxHp / 16));
      totalDamage += burnDmg;
      messageText = `${target.name} bị tổn thương bởi vết bỏng!`;
      events.push(
        BattleEventFactory.endTurnDamage(
          targetSide,
          target.name,
          burnDmg,
          Math.max(0, target.currentHp - totalDamage),
          'burn',
          messageText
        )
      );
    }
  } else if (target.status === 'poison' || target.status === 'toxic') {
    if (isPoisonHeal) {
      const healAmount = Math.max(1, Math.floor(target.maxHp / 8));
      const actualHeal = restoreHp(target, healAmount);
      const healMsg = `${target.name} nhờ [Hồi Phục Độc Tố] hồi phục ${actualHeal} HP!`;
      messageText = messageText ? `${messageText} ${healMsg}` : healMsg;
      events.push(
        BattleEventFactory.abilityTriggered(
          targetSide,
          target.name,
          target.ability || 'Poison Heal',
          'Hồi Phục Độc Tố',
          'Hồi HP khi bị độc',
          healMsg
        )
      );
      events.push(
        BattleEventFactory.hpRestored(
          targetSide,
          target.name,
          actualHeal,
          target.currentHp,
          target.maxHp,
          'drain',
          healMsg
        )
      );
    } else if (!isMagicGuard) {
      if (target.status === 'poison') {
        const psnDmg = Math.max(1, Math.floor(target.maxHp / 8));
        totalDamage += psnDmg;
        messageText = `${target.name} bị tổn thương bởi chất độc!`;
        events.push(
          BattleEventFactory.endTurnDamage(
            targetSide,
            target.name,
            psnDmg,
            Math.max(0, target.currentHp - totalDamage),
            'poison',
            messageText
          )
        );
      } else {
        // Toxic scaling poison tick
        target.statusTurns = Math.min(15, (target.statusTurns ?? 0) + 1);
        const toxDmg = Math.max(1, Math.floor((target.maxHp * target.statusTurns) / 16));
        totalDamage += toxDmg;
        messageText = `${target.name} bị tổn thương bởi độc cực mạnh!`;
        events.push(
          BattleEventFactory.endTurnDamage(
            targetSide,
            target.name,
            toxDmg,
            Math.max(0, target.currentHp - totalDamage),
            'toxic',
            messageText
          )
        );
      }
    }
  }

  // Leech Seed tick
  if (target.isSeeded) {
    const seedDmg = Math.max(1, Math.floor(target.maxHp / 8));
    totalDamage += seedDmg;
    if (opponent && opponent.currentHp > 0 && !opponent.isFainted && opponentSide) {
      const healed = restoreHp(opponent, seedDmg);
      events.push(
        BattleEventFactory.hpRestored(
          opponentSide,
          opponent.name,
          healed,
          opponent.currentHp,
          opponent.maxHp,
          'leech_seed',
          `${opponent.name} hấp thụ sinh lực từ hạt giống ký sinh!`
        )
      );
    }
    const seedMsg = `${target.name} bị hạt giống ký sinh hút cạn sinh lực!`;
    messageText = messageText ? `${messageText} ${seedMsg}` : seedMsg;
    events.push(
      BattleEventFactory.endTurnDamage(
        targetSide,
        target.name,
        seedDmg,
        Math.max(0, target.currentHp - totalDamage),
        'leech_seed',
        seedMsg
      )
    );
  }

  // Weather end-of-turn damage (Sandstorm, Hail)
  if (environment?.weather) {
    const weatherDmgResult = calculateEndTurnWeatherDamage(target, environment.weather.type);
    if (weatherDmgResult) {
      totalDamage += weatherDmgResult.damage;
      messageText = messageText
        ? `${messageText} ${weatherDmgResult.message}`
        : weatherDmgResult.message;
      events.push(
        BattleEventFactory.endTurnDamage(
          targetSide,
          target.name,
          weatherDmgResult.damage,
          Math.max(0, target.currentHp - totalDamage),
          weatherDmgResult.weatherType,
          weatherDmgResult.message
        )
      );
    }
  }

  let defenderFainted = false;
  if (totalDamage > 0) {
    const res = applyDamage(target, totalDamage);
    defenderFainted = res.fainted;
    if (defenderFainted) {
      events.push(
        BattleEventFactory.fainted(targetSide, target.name, `${target.name} đã ngất xỉu!`)
      );
    }
  }

  // Grassy Terrain healing (for grounded Pokémon that did not faint)
  if (!defenderFainted && target.currentHp > 0 && environment?.terrain) {
    const terrainHeal = calculateEndTurnTerrainHealing(target, environment.terrain.type);
    if (terrainHeal) {
      const actualHealed = restoreHp(target, terrainHeal.healAmount);
      events.push(
        BattleEventFactory.hpRestored(
          targetSide,
          target.name,
          actualHealed,
          target.currentHp,
          target.maxHp,
          'terrain',
          terrainHeal.message
        )
      );
      messageText = messageText ? `${messageText} ${terrainHeal.message}` : terrainHeal.message;
    }
  }

  // Held item end-of-turn effects (Leftovers, Black Sludge, Pinch Berries)
  if (!defenderFainted && target.currentHp > 0) {
    const heldItemEvents = HeldItemEngine.processEndTurnHeldItem(target, targetSide);
    if (heldItemEvents.length > 0) {
      events.push(...heldItemEvents);
    }
  }

  if (totalDamage <= 0 && events.length === 0) return null;

  return {
    damage: totalDamage,
    defenderFainted,
    message: messageText,
    events,
  };
}
