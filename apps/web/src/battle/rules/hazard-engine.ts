import type {
  BattlerPokemon,
  BattlerSide,
  BattleEnvironment,
  BattleSideHazards,
  BattleSideScreens,
  BattleEvent,
} from '../types';
import { getTypeEffectiveness } from './type-effectiveness';
import { isGrounded } from './environment/terrain-rules';
import { applyStatStageChange, setStatusCondition } from '../state/battle-state-reducer';
import { AbilityEngine } from './ability-engine';
import { BattleEventFactory } from '../state/battle-event-factory';
import { normalizeHeldItemKey } from './held-item-engine';

export const BINDING_MOVE_IDS = new Set([
  'bind',
  'wrap',
  'fire_spin',
  'whirlpool',
  'sand_tomb',
  'magma_storm',
  'clamp',
  'infestation',
]);

export const TRAPPING_ATTACK_MOVE_IDS = new Set(['spirit_shackle', 'anchor_shot', 'jaw_lock']);

export const TRAPPING_STATUS_MOVE_IDS = new Set(['mean_look', 'block', 'spider_web']);

export const HAZARD_SETTING_STATUS_MOVE_IDS = new Set([
  'stealth_rock',
  'spikes',
  'toxic_spikes',
  'sticky_web',
]);

export const HAZARD_CLEARING_MOVE_IDS = new Set(['rapid_spin', 'mortal_spin']);

/**
 * Returns and initializes the side hazards structure for a given battler side.
 */
export function getSideHazards(
  environment: BattleEnvironment | undefined,
  side: BattlerSide
): BattleSideHazards {
  if (!environment) return {};
  if (side === 'player') {
    environment.playerHazards ??= {};
    return environment.playerHazards;
  } else {
    environment.enemyHazards ??= {};
    return environment.enemyHazards;
  }
}

/**
 * Returns and initializes the side screens structure for a given battler side.
 */
export function getSideScreens(
  environment: BattleEnvironment | undefined,
  side: BattlerSide
): BattleSideScreens {
  if (!environment) return {};
  if (side === 'player') {
    environment.playerScreens ??= {};
    return environment.playerScreens;
  } else {
    environment.enemyScreens ??= {};
    return environment.enemyScreens;
  }
}

/**
 * Clears all entry hazards from a given battler side.
 */
export function clearSideHazards(
  environment: BattleEnvironment | undefined,
  side: BattlerSide
): void {
  if (!environment) return;
  if (side === 'player' && environment.playerHazards) {
    environment.playerHazards.stealthRock = false;
    environment.playerHazards.spikes = 0;
    environment.playerHazards.toxicSpikes = 0;
    environment.playerHazards.stickyWeb = false;
  } else if (side === 'enemy' && environment.enemyHazards) {
    environment.enemyHazards.stealthRock = false;
    environment.enemyHazards.spikes = 0;
    environment.enemyHazards.toxicSpikes = 0;
    environment.enemyHazards.stickyWeb = false;
  }
}

/**
 * Verifies if a Pokémon is allowed to switch out or flee.
 */
export function canSwitchOut(pokemon: BattlerPokemon): { canSwitch: boolean; reason?: string } {
  if (pokemon.isFainted) {
    return { canSwitch: true };
  }
  // Ghost-type Pokémon are immune to all trapping effects
  if (pokemon.types.includes('Ghost')) {
    return { canSwitch: true };
  }
  // Shed Shell item allows switching regardless of trapping
  if (normalizeHeldItemKey(pokemon.heldItem) === 'shed-shell') {
    return { canSwitch: true };
  }
  if (pokemon.isIngrained) {
    return {
      canSwitch: false,
      reason: `${pokemon.name} đã bám rễ sâu vào lòng đất, không thể đổi!`,
    };
  }
  if (pokemon.isTrapped) {
    return {
      canSwitch: false,
      reason: `${pokemon.name} đã bị khóa chặt, không thể đổi Pokémon!`,
    };
  }
  if (pokemon.boundStatus && pokemon.boundStatus.turnsLeft > 0) {
    return {
      canSwitch: false,
      reason: `${pokemon.name} đang bị ${pokemon.boundStatus.moveName} giam giữ, không thể đổi!`,
    };
  }
  return { canSwitch: true };
}

/**
 * Releases any traps or binding status inflicted on a target by the given trapping side.
 */
export function releaseTrapsFromSide(trappingSide: BattlerSide, target: BattlerPokemon): string[] {
  const messages: string[] = [];
  if (target.trappedBy === trappingSide) {
    target.isTrapped = false;
    target.trappedBy = undefined;
    messages.push(`${target.name} đã được giải phóng khỏi trạng thái khóa chân!`);
  }
  if (target.boundStatus?.sourceSide === trappingSide) {
    const moveName = target.boundStatus.moveName;
    target.boundStatus = undefined;
    messages.push(`${target.name} đã thoát khỏi sự giam giữ của ${moveName}!`);
  }
  return messages;
}

/**
 * Applies all entry hazards on a Pokémon switching into battle.
 */
export function applyEntryHazards(
  pokemon: BattlerPokemon,
  side: BattlerSide,
  environment: BattleEnvironment | undefined,
  events: BattleEvent[]
): string[] {
  if (!environment) return [];
  const hazards = side === 'player' ? environment.playerHazards : environment.enemyHazards;
  if (!hazards) return [];

  // Heavy-Duty Boots immunity
  if (normalizeHeldItemKey(pokemon.heldItem) === 'heavy-duty-boots') {
    return [`${pokemon.name} nhờ [Giày Chống Gai] không bị ảnh hưởng bởi cạm bẫy trên sân!`];
  }

  const messages: string[] = [];

  // 1. Stealth Rock (damages based on Rock type effectiveness)
  if (hazards.stealthRock && pokemon.currentHp > 0 && !pokemon.isFainted) {
    const rockEff = getTypeEffectiveness('Rock', pokemon.types);
    const dmg = Math.max(1, Math.floor(pokemon.maxHp * 0.125 * rockEff));
    pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
    const msg = `${pokemon.name} bị đá nhọn đâm trúng! (-${dmg} HP)`;
    messages.push(msg);
    events.push(
      BattleEventFactory.damageDealt(
        side,
        pokemon.name,
        dmg,
        pokemon.currentHp,
        pokemon.maxHp,
        rockEff,
        false,
        1,
        rockEff > 1 ? 'Rất hiệu quả!' : rockEff < 1 ? 'Không hiệu quả lắm...' : ''
      )
    );
    if (pokemon.currentHp <= 0) {
      pokemon.isFainted = true;
      messages.push(`${pokemon.name} đã ngất xỉu!`);
      events.push(BattleEventFactory.fainted(side, pokemon.name, `${pokemon.name} đã ngất xỉu!`));
      return messages;
    }
  }

  // 2. Spikes (1 layer: 12.5%, 2 layers: 16.67%, 3 layers: 25%, only affects grounded)
  if (
    hazards.spikes &&
    hazards.spikes > 0 &&
    isGrounded(pokemon) &&
    pokemon.currentHp > 0 &&
    !pokemon.isFainted
  ) {
    const spikeFraction = hazards.spikes === 1 ? 1 / 8 : hazards.spikes === 2 ? 1 / 6 : 1 / 4;
    const dmg = Math.max(1, Math.floor(pokemon.maxHp * spikeFraction));
    pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
    const msg = `${pokemon.name} bị chông gai đâm trúng! (-${dmg} HP)`;
    messages.push(msg);
    events.push(
      BattleEventFactory.damageDealt(
        side,
        pokemon.name,
        dmg,
        pokemon.currentHp,
        pokemon.maxHp,
        1.0,
        false,
        1,
        ''
      )
    );
    if (pokemon.currentHp <= 0) {
      pokemon.isFainted = true;
      messages.push(`${pokemon.name} đã ngất xỉu!`);
      events.push(BattleEventFactory.fainted(side, pokemon.name, `${pokemon.name} đã ngất xỉu!`));
      return messages;
    }
  }

  // 3. Toxic Spikes (Poison absorbs, Steel immune, applies poison/toxic to grounded non-statused)
  if (
    hazards.toxicSpikes &&
    hazards.toxicSpikes > 0 &&
    isGrounded(pokemon) &&
    pokemon.currentHp > 0 &&
    !pokemon.isFainted
  ) {
    if (pokemon.types.includes('Poison')) {
      hazards.toxicSpikes = 0;
      messages.push(`${pokemon.name} đã hút sạch gai độc trên sân!`);
    } else if (!pokemon.types.includes('Steel') && (!pokemon.status || pokemon.status === 'none')) {
      const isSafeguarded = (pokemon.safeguardTurns ?? 0) > 0;
      const isMisty = environment.terrain?.type === 'misty';
      const isImmuneAbility = AbilityEngine.normalize(pokemon.ability) === 'immunity';

      if (!isSafeguarded && !isMisty && !isImmuneAbility) {
        if (hazards.toxicSpikes === 1) {
          setStatusCondition(pokemon, 'poison');
          const msg = `${pokemon.name} bị trúng độc từ gai độc!`;
          messages.push(msg);
          events.push(BattleEventFactory.statusInflicted(side, pokemon.name, 'poison', msg));
        } else {
          setStatusCondition(pokemon, 'toxic');
          const msg = `${pokemon.name} bị trúng độc nặng từ gai độc!`;
          messages.push(msg);
          events.push(BattleEventFactory.statusInflicted(side, pokemon.name, 'toxic', msg));
        }
      }
    }
  }

  // 4. Sticky Web (lowers Speed stage by 1 for grounded Pokémon)
  if (hazards.stickyWeb && isGrounded(pokemon) && pokemon.currentHp > 0 && !pokemon.isFainted) {
    if (AbilityEngine.isStatDropProtected(pokemon, 'speed', true)) {
      const protName = AbilityEngine.getDisplayName(pokemon.ability);
      const protMsg = `${pokemon.name} nhờ [${protName}] ngăn cản giảm Tốc độ!`;
      messages.push(protMsg);
      events.push(
        BattleEventFactory.abilityTriggered(
          side,
          pokemon.name,
          pokemon.ability || 'Protected',
          protName,
          'Chặn giảm Tốc độ',
          protMsg
        )
      );
    } else {
      const change = applyStatStageChange(pokemon, 'speed', -1);
      const webMsg = `${pokemon.name} bị vướng vào mạng nhện dính! Tốc độ bị giảm!`;
      messages.push(webMsg);
      events.push(
        BattleEventFactory.statStageChanged(
          side,
          pokemon.name,
          'speed',
          change,
          pokemon.statStages!.speed,
          webMsg
        )
      );
    }
  }

  return messages;
}
