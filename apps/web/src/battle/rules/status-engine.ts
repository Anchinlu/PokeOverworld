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
  applyStatStageChange,
  getStatMultiplier,
} from '../state/battle-state-reducer';

import {
  HeldItemEngine,
  normalizeHeldItemKey,
  getHeldItemDisplayName,
} from './held-item-engine';
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
  if (target.safeguardTurns && target.safeguardTurns > 0) {
    return `Màn Hộ Thể bảo vệ ${target.name} khỏi các trạng thái bất lợi!`;
  }

  if (condition === 'sleep' && (target.uproarTurns ?? 0) > 0) {
    return 'Tiếng náo loạn ngăn cản cơn buồn ngủ!';
  }

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
 * Calculates self-inflicted confusion damage using official Gen 7 mechanics:
 * 40 Power physical neutral attack against user's own Attack and Defense.
 */
export function calculateConfusionSelfDamage(
  attacker: BattlerPokemon,
  rng: BattleRng
): number {
  ensureBattlerState(attacker);
  const level = attacker.level;
  const atkStage = attacker.statStages?.attack ?? 0;
  const defStage = attacker.statStages?.defense ?? 0;
  const effAtk = Math.max(1, Math.floor(attacker.stats.attack * getStatMultiplier(atkStage)));
  const effDef = Math.max(1, Math.floor(attacker.stats.defense * getStatMultiplier(defStage)));
  const power = 40;

  const baseDamage = Math.floor(
    Math.floor((Math.floor((2 * level) / 5 + 2) * power * effAtk) / effDef) / 50 + 2
  );
  const randomFactor = rng.nextInt(85, 100) / 100;
  return Math.max(1, Math.floor(baseDamage * randomFactor));
}

/**
 * Checks if a Pokémon is hindered from moving due to primary status (Sleep, Freeze, Paralysis)
 * or volatile statuses (Flinch, Confusion).
 */
export function checkPreTurnStatus(
  attacker: BattlerPokemon,
  attackerSide: BattlerSide,
  rng: BattleRng
): PreTurnStatusResult {
  ensureBattlerState(attacker);
  const events: BattleEvent[] = [];
  let statusPrefix = '';

  // 0. Check Status Curing Berry (Cheri, Chesto, Pecha, Rawst, Aspear, Lum, Persim)
  const heldKey = normalizeHeldItemKey(attacker.heldItem);
  if (
    (heldKey === 'persim-berry' || heldKey === 'lum-berry') &&
    (attacker.confusionTurns ?? 0) > 0
  ) {
    const itemName = getHeldItemDisplayName(attacker.heldItem);
    attacker.heldItem = null;
    attacker.confusionTurns = 0;
    const cureMsg = `${attacker.name} đã ăn quả ${itemName} và chữa khỏi trạng thái bối rối! `;
    events.push(BattleEventFactory.statusCured(attackerSide, attacker.name, 'confusion', cureMsg));
    statusPrefix += cureMsg;
  }

  const berryCureEvents = HeldItemEngine.checkStatusTriggeredBerry(attacker, attackerSide);
  if (berryCureEvents.length > 0) {
    events.push(...berryCureEvents);
    statusPrefix += `${berryCureEvents[0].message ?? ''} `;
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

  // 4. Flinch handling (attacker acts and is stopped for this round)
  if (attacker.isFlinched) {
    attacker.isFlinched = false;
    let extraSteadfast = '';
    if (AbilityEngine.normalize(attacker.ability) === 'steadfast') {
      const boost = applyStatStageChange(attacker, 'speed', 1);
      extraSteadfast = ` ${attacker.name} kích hoạt [Ý Chí Kiên Định] và tăng Tốc độ!`;
      events.push(
        BattleEventFactory.statStageChanged(
          attackerSide,
          attacker.name,
          'speed',
          1,
          boost,
          `${attacker.name} tăng Tốc độ!`
        )
      );
    }
    const flinchMsg = `${attacker.name} bị nao núng và không thể cử động!${extraSteadfast}`;
    events.push(
      BattleEventFactory.statusHindered(attackerSide, attacker.name, 'flinch', flinchMsg)
    );
    return {
      canAct: false,
      statusPrefix: '',
      hinderedMessage: flinchMsg,
      events,
    };
  }

  // 5. Confusion handling
  if ((attacker.confusionTurns ?? 0) > 0) {
    attacker.confusionTurns = (attacker.confusionTurns ?? 1) - 1;
    if (attacker.confusionTurns <= 0) {
      const cureMsg = `${attacker.name} đã hết bối rối! `;
      events.push(
        BattleEventFactory.statusCured(attackerSide, attacker.name, 'confusion', cureMsg)
      );
      statusPrefix += cureMsg;
    } else {
      const confusePrefix = `${attacker.name} đang bối rối! `;
      // Official Gen 7: 33% (1/3) self-harm chance
      if (rng.next() < 0.33) {
        const selfDamage = calculateConfusionSelfDamage(attacker, rng);
        attacker.currentHp = Math.max(0, attacker.currentHp - selfDamage);
        if (attacker.currentHp <= 0) {
          attacker.isFainted = true;
        }
        const hurtMsg = `${confusePrefix}Tự làm tổn thương chính mình trong cơn bối rối!`;
        events.push(
          BattleEventFactory.statusHindered(attackerSide, attacker.name, 'confusion', hurtMsg)
        );
        events.push(
          BattleEventFactory.damageDealt(
            attackerSide,
            attacker.name,
            selfDamage,
            attacker.currentHp,
            attacker.maxHp,
            1.0,
            false,
            1,
            hurtMsg
          )
        );
        return {
          canAct: false,
          statusPrefix: '',
          hinderedMessage: hurtMsg,
          events,
        };
      } else {
        statusPrefix += confusePrefix;
      }
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

  // Partially trapping / Binding moves tick (Bind, Wrap, Fire Spin, Whirlpool, Sand Tomb, etc.)
  if (target.boundStatus && target.boundStatus.turnsLeft > 0) {
    if (!isMagicGuard) {
      const boundDmg = Math.max(1, Math.floor(target.maxHp / 8));
      totalDamage += boundDmg;
      const boundMsg = `${target.name} bị tổn thương bởi ${target.boundStatus.moveName}!`;
      messageText = messageText ? `${messageText} ${boundMsg}` : boundMsg;
      events.push(
        BattleEventFactory.endTurnDamage(
          targetSide,
          target.name,
          boundDmg,
          Math.max(0, target.currentHp - totalDamage),
          target.boundStatus.moveId,
          boundMsg
        )
      );
    }
    target.boundStatus.turnsLeft--;
    if (target.boundStatus.turnsLeft <= 0) {
      const freeMsg = `${target.name} đã thoát khỏi sự giam giữ của ${target.boundStatus.moveName}!`;
      messageText = messageText ? `${messageText} ${freeMsg}` : freeMsg;
      target.boundStatus = undefined;
    }
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

  // Aqua Ring healing (1/16 max HP each turn)
  if (!defenderFainted && target.currentHp > 0 && target.hasAquaRing) {
    if (target.currentHp < target.maxHp) {
      const healAmount = Math.max(1, Math.floor(target.maxHp / 16));
      const actualHealed = restoreHp(target, healAmount);
      const ringMsg = `Vòng Nước giúp ${target.name} hồi phục sinh lực!`;
      messageText = messageText ? `${messageText} ${ringMsg}` : ringMsg;
      events.push(
        BattleEventFactory.hpRestored(
          targetSide,
          target.name,
          actualHealed,
          target.currentHp,
          target.maxHp,
          'move',
          ringMsg
        )
      );
    }
  }

  // Ingrain healing (1/16 max HP each turn)
  if (!defenderFainted && target.currentHp > 0 && target.isIngrained) {
    if (target.currentHp < target.maxHp) {
      const healAmount = Math.max(1, Math.floor(target.maxHp / 16));
      const actualHealed = restoreHp(target, healAmount);
      const ingrainMsg = `${target.name} hấp thụ chất dinh dưỡng từ rễ cây!`;
      messageText = messageText ? `${messageText} ${ingrainMsg}` : ingrainMsg;
      events.push(
        BattleEventFactory.hpRestored(
          targetSide,
          target.name,
          actualHealed,
          target.currentHp,
          target.maxHp,
          'move',
          ingrainMsg
        )
      );
    }
  }

  // Held item end-of-turn effects (Leftovers, Black Sludge, Pinch Berries)
  if (!defenderFainted && target.currentHp > 0) {
    const heldItemEvents = HeldItemEngine.processEndTurnHeldItem(target, targetSide);
    if (heldItemEvents.length > 0) {
      events.push(...heldItemEvents);
    }
  }

  // Safeguard turns tickdown
  if (!defenderFainted && (target.safeguardTurns ?? 0) > 0) {
    target.safeguardTurns!--;
    if (target.safeguardTurns === 0) {
      const sgFadeMsg = `Màn Hộ Thể của phe ${target.name} đã biến mất!`;
      messageText = messageText ? `${messageText} ${sgFadeMsg}` : sgFadeMsg;
    }
  }

  // Taunt turns tickdown
  if (!defenderFainted && (target.tauntTurns ?? 0) > 0) {
    target.tauntTurns!--;
    if (target.tauntTurns === 0) {
      const tauntEndMsg = `${target.name} đã thoát khỏi trạng thái khiêu khích!`;
      messageText = messageText ? `${messageText} ${tauntEndMsg}` : tauntEndMsg;
    }
  }

  // Disabled move tickdown
  if (!defenderFainted && target.disabledMove && target.disabledMove.turnsLeft > 0) {
    target.disabledMove.turnsLeft--;
    if (target.disabledMove.turnsLeft === 0) {
      const disEndMsg = `Chiêu thức của ${target.name} không còn bị vô hiệu hóa!`;
      target.disabledMove = undefined;
      messageText = messageText ? `${messageText} ${disEndMsg}` : disEndMsg;
    }
  }

  // Encore tickdown
  if (!defenderFainted && target.encore && target.encore.turnsLeft > 0) {
    target.encore.turnsLeft--;
    if (target.encore.turnsLeft === 0) {
      const encEndMsg = `Tràng pháo tay dành cho ${target.name} đã kết thúc!`;
      target.encore = undefined;
      messageText = messageText ? `${messageText} ${encEndMsg}` : encEndMsg;
    }
  }

  // Throat Chop turns tickdown
  if (!defenderFainted && (target.throatChopTurns ?? 0) > 0) {
    target.throatChopTurns!--;
    if (target.throatChopTurns === 0) {
      const tcEndMsg = `${target.name} đã hồi phục giọng nói và có thể dùng chiêu âm thanh!`;
      messageText = messageText ? `${messageText} ${tcEndMsg}` : tcEndMsg;
    }
  }

  // Uproar turns tickdown
  if (!defenderFainted && (target.uproarTurns ?? 0) > 0) {
    target.uproarTurns!--;
    if (target.uproarTurns === 0) {
      const upEndMsg = `Cơn náo loạn của ${target.name} đã lắng xuống!`;
      messageText = messageText ? `${messageText} ${upEndMsg}` : upEndMsg;
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
