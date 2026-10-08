import type {
  BattlerPokemon,
  BattleMove,
  BattlePhase,
  BattleEnvironment,
  BattleEvent,
  BattlerSide,
} from './types';
import { getTypeEffectiveness } from './type-chart';
import { defaultBattleRng, type BattleRng } from './battle-rng';

export interface TurnResult {
  attackerName: string;
  moveName: string;
  damage: number;
  typeEffectiveness: number;
  isCritical: boolean;
  isMiss?: boolean;
  defenderFainted: boolean;
  attackerFainted?: boolean;
  hitsCount?: number;
  message: string;
  statChangeMessage?: string;
  statusEffectMessage?: string;
  healAmount?: number;
  events: BattleEvent[];
}

export interface CatchResult {
  caught: boolean;
  shakes: number;
  message: string;
}

export interface EndTurnResult {
  damage: number;
  defenderFainted: boolean;
  message: string;
  events: BattleEvent[];
}

export const NEVER_MISS_MOVE_IDS = new Set([
  'swift',
  'aerial_ace',
  'faint_attack',
  'shadow_punch',
  'shock_wave',
  'magical_leaf',
  'aura_sphere',
  'magnet_bomb',
  'clear_smog',
  'disarming_voice',
  'vital_throw',
  'struggle',
]);

export const RECHARGE_MOVE_IDS = new Set([
  'hyper_beam',
  'giga_impact',
  'frenzy_plant',
  'blast_burn',
  'hydro_cannon',
  'roar_of_time',
  'rock_wrecker',
]);

export const PROTECT_MOVE_IDS = new Set([
  'protect',
  'detect',
  'spiky_shield',
  'baneful_bunker',
  'kings_shield',
]);

export const TWO_TURN_MOVE_IDS = new Set([
  'solar_beam',
  'solarbeam',
  'skull_bash',
  'fly',
  'dig',
  'dive',
  'bounce',
  'sky_attack',
  'razor_wind',
  'shadow_force',
  'phantom_force',
  'geomancy',
]);

export const STAT_NAME_VI: Record<string, string> = {
  attack: 'Tấn công',
  defense: 'Phòng thủ',
  spAtk: 'Công ĐB',
  spDef: 'Thủ ĐB',
  speed: 'Tốc độ',
  accuracy: 'Độ chính xác',
  evasion: 'Né tránh',
  hp: 'HP',
};

export const STATUS_NAME_VI: Record<string, string> = {
  burn: 'bỏng',
  poison: 'nhiễm độc',
  toxic: 'trúng độc cực mạnh',
  paralysis: 'tê liệt',
  sleep: 'ngủ say',
  freeze: 'đóng băng',
};

export const STRUGGLE_MOVE: BattleMove = {
  id: 'struggle',
  name: 'Struggle (Vùng Vẫy)',
  nameVi: 'Vùng Vẫy',
  nameEn: 'Struggle',
  type: 'Normal',
  category: 'physical',
  power: 50,
  accuracy: 0,
  pp: 1,
  maxPp: 1,
  description: 'Vùng vẫy khi hết chiêu thức, gây sát thương và chịu phản đòn 25% máu tối đa.',
};

/** Official Pokémon stat stage multipliers (-6 to +6) */
export function getStatMultiplier(stage: number): number {
  const clamped = Math.max(-6, Math.min(6, stage));
  return clamped >= 0 ? (2 + clamped) / 2 : 2 / (2 - clamped);
}

/** Accuracy/Evasion stage multipliers */
export function getAccuracyMultiplier(accStage: number, evaStage: number): number {
  const diff = Math.max(-6, Math.min(6, accStage - evaStage));
  return diff >= 0 ? (3 + diff) / 3 : 3 / (3 - diff);
}

export function getMoveDisplayName(move: BattleMove): string {
  return (move.nameVi || move.name).replace(/^[^(]+\(([^)]+)\)$/, '$1').trim();
}

export class BattleEngine {
  public playerPokemon: BattlerPokemon;
  public enemyPokemon: BattlerPokemon;
  public environment: BattleEnvironment;
  public phase: BattlePhase = 'intro';
  public message: string = '';
  public ballsCount: number = 5;
  public fleeAttempts: number = 0;

  constructor(
    playerPokemon: BattlerPokemon,
    enemyPokemon: BattlerPokemon,
    environment: BattleEnvironment,
    public readonly rng: BattleRng = defaultBattleRng
  ) {
    this.playerPokemon = playerPokemon;
    this.enemyPokemon = enemyPokemon;
    this.environment = environment;
    this.message = `${enemyPokemon.name} hoang dã xuất hiện!`;

    this.ensureBattlerState(this.playerPokemon);
    this.ensureBattlerState(this.enemyPokemon);
  }

  public switchPlayerPokemon(newPokemon: BattlerPokemon): void {
    this.playerPokemon = newPokemon;
    this.ensureBattlerState(this.playerPokemon);
  }

  private ensureBattlerState(battler: BattlerPokemon): void {
    battler.statStages ??= {
      attack: 0,
      defense: 0,
      spAtk: 0,
      spDef: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    };
    battler.status ??= 'none';
    battler.sleepTurns ??= 0;
    battler.statusTurns ??= 0;
    battler.protectSuccessiveUses ??= 0;
    battler.isProtected ??= false;
    battler.mustRecharge ??= false;
    battler.isSeeded ??= false;
    battler.destinyBond ??= false;
  }

  private getStatusImmunity(
    target: BattlerPokemon,
    condition: NonNullable<BattleMove['statusEffect']>['condition']
  ): string | null {
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

  /** Applies persistent damage at the end of a completed turn. */
  public applyEndTurnEffects(
    target: BattlerPokemon,
    opponent?: BattlerPokemon
  ): EndTurnResult | null {
    this.ensureBattlerState(target);
    if (target.currentHp <= 0 || target.isFainted) return null;

    const targetSide: BattlerSide = target === this.playerPokemon ? 'player' : 'enemy';
    const opponentSide: BattlerSide = targetSide === 'player' ? 'enemy' : 'player';

    let damage = 0;
    let messageText = '';
    const events: BattleEvent[] = [];

    if (target.status === 'burn') {
      const burnDmg = Math.max(1, Math.floor(target.maxHp / 16));
      damage += burnDmg;
      messageText = `${target.name} bị tổn thương bởi vết bỏng!`;
      events.push({
        type: 'end_turn_damage',
        targetSide,
        targetName: target.name,
        damage: burnDmg,
        remainingHp: Math.max(0, target.currentHp - damage),
        source: 'burn',
        message: messageText,
      });
    } else if (target.status === 'poison') {
      const psnDmg = Math.max(1, Math.floor(target.maxHp / 8));
      damage += psnDmg;
      messageText = `${target.name} bị tổn thương bởi chất độc!`;
      events.push({
        type: 'end_turn_damage',
        targetSide,
        targetName: target.name,
        damage: psnDmg,
        remainingHp: Math.max(0, target.currentHp - damage),
        source: 'poison',
        message: messageText,
      });
    } else if (target.status === 'toxic') {
      target.statusTurns = Math.min(15, (target.statusTurns ?? 0) + 1);
      const toxDmg = Math.max(1, Math.floor((target.maxHp * target.statusTurns) / 16));
      damage += toxDmg;
      messageText = `${target.name} bị tổn thương bởi độc cực mạnh!`;
      events.push({
        type: 'end_turn_damage',
        targetSide,
        targetName: target.name,
        damage: toxDmg,
        remainingHp: Math.max(0, target.currentHp - damage),
        source: 'toxic',
        message: messageText,
      });
    }

    if (target.isSeeded) {
      const seedDmg = Math.max(1, Math.floor(target.maxHp / 8));
      damage += seedDmg;
      if (opponent && opponent.currentHp > 0 && !opponent.isFainted) {
        opponent.currentHp = Math.min(opponent.maxHp, opponent.currentHp + seedDmg);
        events.push({
          type: 'hp_restored',
          targetSide: opponentSide,
          targetName: opponent.name,
          amount: seedDmg,
          remainingHp: opponent.currentHp,
          maxHp: opponent.maxHp,
          source: 'leech_seed',
          message: `${opponent.name} hấp thụ sinh lực từ hạt giống ký sinh!`,
        });
      }
      const seedMsg = `${target.name} bị hạt giống ký sinh hút cạn sinh lực!`;
      messageText = messageText ? `${messageText} ${seedMsg}` : seedMsg;
      events.push({
        type: 'end_turn_damage',
        targetSide,
        targetName: target.name,
        damage: seedDmg,
        remainingHp: Math.max(0, target.currentHp - damage),
        source: 'leech_seed',
        message: seedMsg,
      });
    }

    if (damage <= 0) return null;

    target.currentHp = Math.max(0, target.currentHp - damage);
    const defenderFainted = target.currentHp <= 0;
    if (defenderFainted) {
      target.isFainted = true;
      events.push({
        type: 'fainted',
        targetSide,
        targetName: target.name,
        message: `${target.name} đã ngất xỉu!`,
      });
    }

    return {
      damage,
      defenderFainted,
      message: messageText,
      events,
    };
  }

  public executeAttack(
    attacker: BattlerPokemon,
    defender: BattlerPokemon,
    move: BattleMove
  ): TurnResult {
    this.ensureBattlerState(attacker);
    this.ensureBattlerState(defender);

    const attackerSide: BattlerSide = attacker === this.playerPokemon ? 'player' : 'enemy';
    const defenderSide: BattlerSide = defender === this.playerPokemon ? 'player' : 'enemy';
    const events: BattleEvent[] = [];

    const moveId = move.id.toLowerCase();
    const moveDisplayName = getMoveDisplayName(move);

    // 0. Round protection reset at the beginning of action
    attacker.isProtected = false;

    events.push({
      type: 'move_declared',
      attackerSide,
      attackerName: attacker.name,
      moveId: move.id,
      moveName: moveDisplayName,
    });

    // 1. Recharge turn check
    if (attacker.mustRecharge) {
      attacker.mustRecharge = false;
      const rechargeMsg = `${attacker.name} phải nạp lại năng lượng và không thể cử động!`;
      events.push({
        type: 'recharge_hindered',
        attackerSide,
        attackerName: attacker.name,
        message: rechargeMsg,
      });
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: rechargeMsg,
        events,
      };
    }

    // PP Check
    if (move.id !== 'struggle' && move.pp <= 0 && !attacker.chargingMove) {
      const noPpMsg = `${attacker.name} định dùng ${moveDisplayName}, nhưng đã hết điểm PP!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: noPpMsg,
        events,
      };
    }

    // 2. Status hindrance check (Sleep, Freeze, Paralysis)
    let statusPrefix = '';
    if (attacker.status === 'sleep') {
      if ((attacker.sleepTurns ?? 0) > 0) {
        attacker.sleepTurns!--;
        const sleepMsg = `${attacker.name} đang ngủ say!`;
        events.push({
          type: 'status_hindered',
          attackerSide,
          attackerName: attacker.name,
          status: 'sleep',
          message: sleepMsg,
        });
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: sleepMsg,
          events,
        };
      } else {
        attacker.status = 'none';
        const wakeMsg = `${attacker.name} đã tỉnh giấc! `;
        events.push({
          type: 'status_cured',
          targetSide: attackerSide,
          targetName: attacker.name,
          status: 'sleep',
          message: wakeMsg,
        });
        statusPrefix = wakeMsg;
      }
    }

    if (attacker.status === 'freeze') {
      if (this.rng.next() < 0.2) {
        attacker.status = 'none';
        const thawMsg = `${attacker.name} đã tan băng! `;
        events.push({
          type: 'status_cured',
          targetSide: attackerSide,
          targetName: attacker.name,
          status: 'freeze',
          message: thawMsg,
        });
        statusPrefix = thawMsg;
      } else {
        const freezeMsg = `${attacker.name} bị đóng băng cứng đờ!`;
        events.push({
          type: 'status_hindered',
          attackerSide,
          attackerName: attacker.name,
          status: 'freeze',
          message: freezeMsg,
        });
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: freezeMsg,
          events,
        };
      }
    }

    if (attacker.status === 'paralysis') {
      if (this.rng.next() < 0.25) {
        const paraMsg = `${attacker.name} bị tê liệt hoàn toàn! Không thể cử động!`;
        events.push({
          type: 'status_hindered',
          attackerSide,
          attackerName: attacker.name,
          status: 'paralysis',
          message: paraMsg,
        });
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: paraMsg,
          events,
        };
      }
    }

    // Deduct PP only when attacker is able to act and not on turn 2 of a charging move
    if (move.id !== 'struggle' && !attacker.chargingMove) {
      move.pp = Math.max(0, move.pp - 1);
    }

    // 3. Protect / Detect move handling
    if (PROTECT_MOVE_IDS.has(moveId)) {
      const uses = attacker.protectSuccessiveUses ?? 0;
      const successChance = Math.pow(0.5, uses);
      if (this.rng.next() < successChance) {
        attacker.isProtected = true;
        attacker.protectSuccessiveUses = uses + 1;
        const protectMsg = `${statusPrefix}${attacker.name} đã dựng lá chắn tự bảo vệ mình!`;
        events.push({
          type: 'protect_activated',
          attackerSide,
          attackerName: attacker.name,
          success: true,
          message: protectMsg,
        });
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: protectMsg,
          events,
        };
      } else {
        attacker.protectSuccessiveUses = 0;
        const failMsg = `${statusPrefix}${attacker.name} định tự bảo vệ mình! Nhưng chiêu thức đã thất bại!`;
        events.push({
          type: 'protect_activated',
          attackerSide,
          attackerName: attacker.name,
          success: false,
          message: failMsg,
        });
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: failMsg,
          events,
        };
      }
    } else {
      attacker.protectSuccessiveUses = 0;
    }

    // 4. Two-turn moves handling (charging & semi-invulnerable)
    if (TWO_TURN_MOVE_IDS.has(moveId)) {
      if (!attacker.chargingMove) {
        // Turn 1: Charge
        let chargeMsg = '';
        let stance: 'flying' | 'underground' | 'underwater' | 'high' | undefined = undefined;

        if (moveId === 'solar_beam' || moveId === 'solarbeam') {
          attacker.chargingMove = { move, turn: 1 };
          chargeMsg = `${attacker.name} đang hấp thụ ánh sáng mặt trời!`;
        } else if (moveId === 'skull_bash') {
          attacker.chargingMove = { move, turn: 1 };
          attacker.statStages!.defense = Math.min(6, attacker.statStages!.defense + 1);
          chargeMsg = `${attacker.name} thu đầu vào! Phòng thủ của ${attacker.name} tăng lên!`;
          events.push({
            type: 'stat_stage_changed',
            targetSide: attackerSide,
            targetName: attacker.name,
            stat: 'defense',
            change: 1,
            currentStage: attacker.statStages!.defense,
            message: `Phòng thủ của ${attacker.name} tăng lên!`,
          });
        } else if (moveId === 'fly') {
          stance = 'flying';
          attacker.chargingMove = { move, turn: 1, semiInvulnerable: 'flying' };
          attacker.semiInvulnerable = 'flying';
          chargeMsg = `${attacker.name} bay vút lên không trung!`;
        } else if (moveId === 'dig') {
          stance = 'underground';
          attacker.chargingMove = { move, turn: 1, semiInvulnerable: 'underground' };
          attacker.semiInvulnerable = 'underground';
          chargeMsg = `${attacker.name} đào sâu vào lòng đất!`;
        } else if (moveId === 'dive') {
          stance = 'underwater';
          attacker.chargingMove = { move, turn: 1, semiInvulnerable: 'underwater' };
          attacker.semiInvulnerable = 'underwater';
          chargeMsg = `${attacker.name} lặn sâu vào lòng nước!`;
        } else if (moveId === 'bounce') {
          stance = 'high';
          attacker.chargingMove = { move, turn: 1, semiInvulnerable: 'high' };
          attacker.semiInvulnerable = 'high';
          chargeMsg = `${attacker.name} bật nhảy lên rất cao!`;
        } else if (moveId === 'sky_attack') {
          attacker.chargingMove = { move, turn: 1 };
          chargeMsg = `${attacker.name} phát ra ánh sáng chói lọi!`;
        } else if (moveId === 'razor_wind') {
          attacker.chargingMove = { move, turn: 1 };
          chargeMsg = `${attacker.name} tạo ra một cơn cuồng phong!`;
        } else if (moveId === 'shadow_force' || moveId === 'phantom_force') {
          stance = 'flying';
          attacker.chargingMove = { move, turn: 1, semiInvulnerable: 'flying' };
          attacker.semiInvulnerable = 'flying';
          chargeMsg = `${attacker.name} biến mất vào bóng tối!`;
        } else if (moveId === 'geomancy') {
          attacker.chargingMove = { move, turn: 1 };
          chargeMsg = `${attacker.name} hấp thụ năng lượng trời đất!`;
        }

        events.push({
          type: 'charge_begin',
          attackerSide,
          attackerName: attacker.name,
          moveId: move.id,
          moveName: moveDisplayName,
          message: chargeMsg,
        });

        if (stance) {
          events.push({
            type: 'semi_invulnerable_enter',
            attackerSide,
            attackerName: attacker.name,
            stance,
            message: chargeMsg,
          });
        }

        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: `${statusPrefix}${chargeMsg}`,
          events,
        };
      } else {
        // Turn 2: Release attack!
        attacker.chargingMove = undefined;
        attacker.semiInvulnerable = undefined;
      }
    }

    // 5. Defender Protect check
    if (defender.isProtected) {
      if (['feint', 'shadow_force', 'phantom_force', 'hyperspace_hole'].includes(moveId)) {
        defender.isProtected = false;
      } else {
        const blockedMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng ${defender.name} đã được bảo vệ hoàn toàn!`;
        events.push({
          type: 'protect_blocked',
          defenderSide,
          defenderName: defender.name,
          attackerName: attacker.name,
          moveName: moveDisplayName,
          message: blockedMsg,
        });
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: blockedMsg,
          events,
        };
      }
    }

    // 6. Defender Semi-Invulnerable bypass check
    if (defender.semiInvulnerable) {
      if (defender.semiInvulnerable === 'flying' || defender.semiInvulnerable === 'high') {
        const canHitFlying = [
          'gust',
          'thunder',
          'twister',
          'sky_uppercut',
          'hurricane',
          'smack_down',
        ].includes(moveId);
        if (!canHitFlying) {
          const invMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng ${defender.name} đang ở ngoài tầm đánh!`;
          events.push({
            type: 'semi_invulnerable_miss',
            defenderSide,
            defenderName: defender.name,
            stance: defender.semiInvulnerable,
            message: invMsg,
          });
          return {
            attackerName: attacker.name,
            moveName: moveDisplayName,
            damage: 0,
            typeEffectiveness: 1.0,
            isCritical: false,
            isMiss: true,
            defenderFainted: false,
            message: invMsg,
            events,
          };
        }
      } else if (defender.semiInvulnerable === 'underground') {
        const canHitUnderground = ['earthquake', 'magnitude', 'fissure'].includes(moveId);
        if (!canHitUnderground) {
          const invMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng ${defender.name} đang ở sâu dưới lòng đất!`;
          events.push({
            type: 'semi_invulnerable_miss',
            defenderSide,
            defenderName: defender.name,
            stance: 'underground',
            message: invMsg,
          });
          return {
            attackerName: attacker.name,
            moveName: moveDisplayName,
            damage: 0,
            typeEffectiveness: 1.0,
            isCritical: false,
            isMiss: true,
            defenderFainted: false,
            message: invMsg,
            events,
          };
        }
      } else if (defender.semiInvulnerable === 'underwater') {
        const canHitUnderwater = ['surf', 'whirlpool'].includes(moveId);
        if (!canHitUnderwater) {
          const invMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng ${defender.name} đang ở sâu dưới nước!`;
          events.push({
            type: 'semi_invulnerable_miss',
            defenderSide,
            defenderName: defender.name,
            stance: 'underwater',
            message: invMsg,
          });
          return {
            attackerName: attacker.name,
            moveName: moveDisplayName,
            damage: 0,
            typeEffectiveness: 1.0,
            isCritical: false,
            isMiss: true,
            defenderFainted: false,
            message: invMsg,
            events,
          };
        }
      }
    }

    // 7. Accuracy / Evasion Check
    const isSelfTargetMove =
      move.category === 'status' &&
      (move.id === 'rest' ||
        move.id === 'belly_drum' ||
        (move.healPercent !== undefined && move.healPercent > 0) ||
        (move.statChanges !== undefined &&
          move.statChanges.length > 0 &&
          move.statChanges.every((sc) => sc.target === 'self')) ||
        (move.statusEffect !== undefined && move.statusEffect.target === 'self'));

    const isNeverMiss =
      isSelfTargetMove ||
      NEVER_MISS_MOVE_IDS.has(move.id) ||
      move.accuracy <= 0 ||
      move.id === 'struggle';

    const accStage = attacker.statStages!.accuracy;
    const evaStage = defender.statStages!.evasion;
    const requiresAccCheck =
      !isNeverMiss && (move.accuracy < 100 || accStage !== 0 || evaStage !== 0);

    if (requiresAccCheck) {
      const accMult = getAccuracyMultiplier(accStage, evaStage);
      const effectiveAcc = move.accuracy * accMult;
      if (this.rng.next() * 100 > effectiveAcc) {
        const missMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng đã trượt!`;
        events.push({
          type: 'accuracy_miss',
          attackerSide,
          attackerName: attacker.name,
          moveName: moveDisplayName,
          message: missMsg,
        });
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          isMiss: true,
          defenderFainted: false,
          message: missMsg,
          events,
        };
      }
    }

    // 8. Status move handling
    if (move.category === 'status') {
      if (!isSelfTargetMove) {
        const typeEff = getTypeEffectiveness(move.type, defender.types);
        if (typeEff === 0) {
          const immuneMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Không có tác dụng lên ${defender.name}!`;
          events.push({
            type: 'type_immune',
            defenderSide,
            defenderName: defender.name,
            attackerName: attacker.name,
            moveName: moveDisplayName,
            message: immuneMsg,
          });
          return {
            attackerName: attacker.name,
            moveName: moveDisplayName,
            damage: 0,
            typeEffectiveness: 0,
            isCritical: false,
            defenderFainted: false,
            message: immuneMsg,
            events,
          };
        }
      }

      let extraMsg = '';

      // Unique Status moves
      if (moveId === 'belly_drum') {
        const cost = Math.floor(attacker.maxHp / 2);
        if (attacker.currentHp > cost) {
          attacker.currentHp -= cost;
          attacker.statStages!.attack = 6;
          extraMsg += ` ${attacker.name} hi sinh HP và tối đa hóa Tấn công!`;
          events.push({
            type: 'stat_stage_changed',
            targetSide: attackerSide,
            targetName: attacker.name,
            stat: 'attack',
            change: 6,
            currentStage: 6,
            message: `${attacker.name} tối đa hóa Tấn công!`,
          });
        } else {
          extraMsg += ` Nhưng chiêu thức thất bại! HP không đủ!`;
        }
      } else if (moveId === 'pain_split') {
        const avg = Math.max(1, Math.floor((attacker.currentHp + defender.currentHp) / 2));
        attacker.currentHp = Math.min(attacker.maxHp, avg);
        defender.currentHp = Math.min(defender.maxHp, avg);
        extraMsg += ` ${attacker.name} chia sẻ sinh lực với ${defender.name}!`;
        events.push({
          type: 'hp_restored',
          targetSide: attackerSide,
          targetName: attacker.name,
          amount: avg,
          remainingHp: attacker.currentHp,
          maxHp: attacker.maxHp,
          source: 'move',
          message: `${attacker.name} chia sẻ sinh lực với ${defender.name}!`,
        });
      } else if (moveId === 'destiny_bond') {
        attacker.destinyBond = true;
        extraMsg += ` ${attacker.name} chuẩn bị đưa đối thủ đi cùng nếu ngất xỉu!`;
      } else if (moveId === 'haze' || moveId === 'clear_smog') {
        attacker.statStages = {
          attack: 0,
          defense: 0,
          spAtk: 0,
          spDef: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        };
        defender.statStages = {
          attack: 0,
          defense: 0,
          spAtk: 0,
          spDef: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        };
        extraMsg += ` Toàn bộ thay đổi chỉ số đã bị xóa bỏ!`;
      } else if (moveId === 'splash') {
        extraMsg += ` Nhưng không có gì xảy ra cả!`;
      } else if (moveId === 'leech_seed') {
        if (!defender.types.includes('Grass') && !defender.isSeeded) {
          defender.isSeeded = true;
          extraMsg += ` ${defender.name} đã bị gieo mầm hạt giống ký sinh!`;
        } else {
          extraMsg += ` Nhưng chiêu thức thất bại!`;
        }
      } else if (moveId === 'rest') {
        if (attacker.currentHp >= attacker.maxHp) {
          extraMsg += ` Nhưng thất bại! HP của ${attacker.name} đã đầy!`;
        } else {
          attacker.status = 'sleep';
          attacker.statusTurns = 0;
          attacker.sleepTurns = 2;
          attacker.currentHp = attacker.maxHp;
          extraMsg += ` ${attacker.name} chìm vào giấc ngủ và hồi phục hoàn toàn!`;
          events.push({
            type: 'status_inflicted',
            targetSide: attackerSide,
            targetName: attacker.name,
            condition: 'sleep',
            message: `${attacker.name} chìm vào giấc ngủ!`,
          });
          events.push({
            type: 'hp_restored',
            targetSide: attackerSide,
            targetName: attacker.name,
            amount: attacker.maxHp,
            remainingHp: attacker.maxHp,
            maxHp: attacker.maxHp,
            source: 'move',
            message: `${attacker.name} hồi phục hoàn toàn HP!`,
          });
        }
      } else if (move.healPercent && move.healPercent > 0) {
        if (attacker.currentHp >= attacker.maxHp) {
          extraMsg += ` Nhưng thất bại! HP của ${attacker.name} đã đầy!`;
        } else {
          const heal = Math.max(1, Math.floor(attacker.maxHp * move.healPercent));
          attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
          extraMsg += ` ${attacker.name} đã hồi phục HP!`;
          events.push({
            type: 'hp_restored',
            targetSide: attackerSide,
            targetName: attacker.name,
            amount: heal,
            remainingHp: attacker.currentHp,
            maxHp: attacker.maxHp,
            source: 'move',
            message: `${attacker.name} đã hồi phục HP!`,
          });
        }
      }

      // Stat stages
      if (move.statChanges && move.statChanges.length > 0) {
        for (const sc of move.statChanges) {
          const chance = Math.max(0, Math.min(1, sc.chance ?? 1));
          if (this.rng.next() >= chance) continue;
          const target = sc.target === 'self' ? attacker : defender;
          const tSide: BattlerSide = target === this.playerPokemon ? 'player' : 'enemy';
          const stages = target.statStages!;
          const prev = stages[sc.stat];
          stages[sc.stat] = Math.max(-6, Math.min(6, prev + sc.stages));
          const change = stages[sc.stat] - prev;
          const statVi = STAT_NAME_VI[sc.stat] ?? sc.stat;

          if (change > 1) extraMsg += ` Chỉ số ${statVi} của ${target.name} tăng mạnh!`;
          else if (change === 1) extraMsg += ` Chỉ số ${statVi} của ${target.name} tăng lên!`;
          else if (change === -1) extraMsg += ` Chỉ số ${statVi} của ${target.name} giảm xuống!`;
          else if (change < -1) extraMsg += ` Chỉ số ${statVi} của ${target.name} giảm mạnh!`;
          else
            extraMsg += ` Chỉ số ${statVi} của ${target.name} không thể ${sc.stages > 0 ? 'tăng thêm' : 'giảm thêm'} nữa!`;

          events.push({
            type: 'stat_stage_changed',
            targetSide: tSide,
            targetName: target.name,
            stat: sc.stat,
            change,
            currentStage: stages[sc.stat],
            message: `Chỉ số ${statVi} của ${target.name} ${change > 0 ? 'tăng' : 'giảm'}!`,
          });
        }
      }

      // Status ailment
      if (move.statusEffect && move.id !== 'rest') {
        const target = move.statusEffect.target === 'self' ? attacker : defender;
        const tSide: BattlerSide = target === this.playerPokemon ? 'player' : 'enemy';
        const chance = Math.max(0, Math.min(1, move.statusEffect.chance));
        const immunityMessage = this.getStatusImmunity(target, move.statusEffect.condition);
        const conditionVi =
          STATUS_NAME_VI[move.statusEffect.condition] ?? move.statusEffect.condition;

        if (target.status === 'none' && !immunityMessage && this.rng.next() < chance) {
          target.status = move.statusEffect.condition;
          target.statusTurns = 0;
          if (target.status === 'sleep') target.sleepTurns = this.rng.nextInt(1, 3);
          extraMsg += ` ${target.name} đã bị ${conditionVi}!`;
          events.push({
            type: 'status_inflicted',
            targetSide: tSide,
            targetName: target.name,
            condition: move.statusEffect.condition,
            message: `${target.name} đã bị ${conditionVi}!`,
          });
        } else if (target.status !== 'none' && move.statusEffect.target !== 'self') {
          extraMsg += ` Nhưng thất bại! ${target.name} đã mắc trạng thái bất thường rồi!`;
        } else if (target.status === 'none' && immunityMessage) {
          extraMsg += ` ${immunityMessage}`;
        }
      }

      const mainMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}!${extraMsg || ' Đã tác động lên trận đấu!'}`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: mainMsg,
        events,
      };
    }

    // 9. Damaging attack handling
    const isStruggle = move.id === 'struggle';
    const typeEff = isStruggle ? 1.0 : getTypeEffectiveness(move.type, defender.types);

    if (typeEff === 0) {
      const immuneMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Không có tác dụng lên ${defender.name}!`;
      events.push({
        type: 'type_immune',
        defenderSide,
        defenderName: defender.name,
        attackerName: attacker.name,
        moveName: moveDisplayName,
        message: immuneMsg,
      });
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 0,
        isCritical: false,
        defenderFainted: false,
        message: immuneMsg,
        events,
      };
    }

    let damage: number;
    let isCrit = false;
    let effText = '';
    let secMsg = '';
    let hitsCount = 1;

    // A. Special fixed-damage or unique calculation moves
    if (moveId === 'seismic_toss' || moveId === 'night_shade') {
      damage = Math.max(1, attacker.level);
    } else if (moveId === 'dragon_rage') {
      damage = 40;
    } else if (moveId === 'sonic_boom' || moveId === 'sonicboom') {
      damage = 20;
    } else if (moveId === 'super_fang' || moveId === 'natures_madness' || moveId === 'ruination') {
      damage = Math.max(1, Math.floor(defender.currentHp / 2));
    } else if (moveId === 'guardian_of_alola') {
      damage = Math.max(1, Math.floor(defender.currentHp * 0.75));
    } else if (moveId === 'endeavor') {
      if (attacker.currentHp < defender.currentHp) {
        damage = defender.currentHp - attacker.currentHp;
      } else {
        const failMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng chiêu thức thất bại!`;
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: failMsg,
          events,
        };
      }
    } else if (moveId === 'psywave') {
      const factor = 0.5 + this.rng.next() * 1.0;
      damage = Math.max(1, Math.floor(attacker.level * factor));
    } else if (moveId === 'final_gambit') {
      damage = attacker.currentHp;
      attacker.currentHp = 0;
      attacker.isFainted = true;
      secMsg += ` ${attacker.name} đã ngất xỉu!`;
    } else if (
      moveId === 'fissure' ||
      moveId === 'guillotine' ||
      moveId === 'horn_drill' ||
      moveId === 'sheer_cold'
    ) {
      if (attacker.level < defender.level) {
        const failMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng chiêu thức thất bại!`;
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          isMiss: true,
          defenderFainted: false,
          message: failMsg,
          events,
        };
      }
      const ohkoAcc = 30 + (attacker.level - defender.level);
      if (this.rng.next() * 100 > ohkoAcc) {
        const missMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng đã trượt!`;
        events.push({
          type: 'accuracy_miss',
          attackerSide,
          attackerName: attacker.name,
          moveName: moveDisplayName,
          message: missMsg,
        });
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          isMiss: true,
          defenderFainted: false,
          message: missMsg,
          events,
        };
      }
      damage = defender.currentHp;
      secMsg += ' Hạ gục đối thủ chỉ với một đòn duy nhất!';
    } else {
      // B. Standard & Dynamic damage calculation with Gen 7 floor rule
      let effectivePower = move.power;

      // Dynamic variable power moves
      if (moveId === 'flail' || moveId === 'reversal') {
        const hpRatio = attacker.currentHp / Math.max(1, attacker.maxHp);
        if (hpRatio < 0.0417) effectivePower = 200;
        else if (hpRatio < 0.1042) effectivePower = 150;
        else if (hpRatio < 0.2083) effectivePower = 100;
        else if (hpRatio < 0.3542) effectivePower = 80;
        else if (hpRatio < 0.6875) effectivePower = 40;
        else effectivePower = 20;
      } else if (moveId === 'crush_grip' || moveId === 'wring_out' || moveId === 'hard_press') {
        effectivePower = Math.max(
          1,
          Math.floor(120 * (defender.currentHp / Math.max(1, defender.maxHp)))
        );
      } else if (moveId === 'electro_ball') {
        const atkSpd = attacker.stats.speed * getStatMultiplier(attacker.statStages!.speed);
        const defSpd = Math.max(
          1,
          defender.stats.speed * getStatMultiplier(defender.statStages!.speed)
        );
        const ratio = atkSpd / defSpd;
        if (ratio >= 4) effectivePower = 150;
        else if (ratio >= 3) effectivePower = 120;
        else if (ratio >= 2) effectivePower = 80;
        else if (ratio >= 1) effectivePower = 60;
        else effectivePower = 40;
      } else if (moveId === 'gyro_ball') {
        const atkSpd = Math.max(
          1,
          attacker.stats.speed * getStatMultiplier(attacker.statStages!.speed)
        );
        const defSpd = defender.stats.speed * getStatMultiplier(defender.statStages!.speed);
        effectivePower = Math.min(150, Math.max(1, Math.floor(25 * (defSpd / atkSpd))));
      } else if (moveId === 'low_kick' || moveId === 'grass_knot') {
        effectivePower = 60;
      } else if (moveId === 'heavy_slam' || moveId === 'heat_crash') {
        effectivePower = 80;
      } else if (moveId === 'magnitude') {
        const roll = this.rng.next();
        let mag: number;
        let pwr: number;
        if (roll < 0.05) {
          mag = 4;
          pwr = 10;
        } else if (roll < 0.15) {
          mag = 5;
          pwr = 30;
        } else if (roll < 0.35) {
          mag = 6;
          pwr = 50;
        } else if (roll < 0.65) {
          mag = 7;
          pwr = 70;
        } else if (roll < 0.85) {
          mag = 8;
          pwr = 90;
        } else if (roll < 0.95) {
          mag = 9;
          pwr = 110;
        } else {
          mag = 10;
          pwr = 150;
        }
        effectivePower = pwr;
        secMsg += ` Địa chấn cấp ${mag}!`;
      } else if (
        moveId === 'return' ||
        moveId === 'frustration' ||
        moveId === 'pika_papow' ||
        moveId === 'veevee_volley'
      ) {
        effectivePower = 102;
      } else if (moveId === 'trump_card') {
        effectivePower = 80;
      } else if (moveId === 'punishment') {
        const posStages = Object.values(defender.statStages!).reduce(
          (sum, s) => sum + (s > 0 ? s : 0),
          0
        );
        effectivePower = Math.min(200, 60 + 20 * posStages);
      } else if (moveId === 'present') {
        const roll = this.rng.next();
        if (roll < 0.2) {
          const heal = Math.max(1, Math.floor(defender.maxHp * 0.25));
          defender.currentHp = Math.min(defender.maxHp, defender.currentHp + heal);
          const healMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Đã hồi phục HP cho ${defender.name}!`;
          events.push({
            type: 'hp_restored',
            targetSide: defenderSide,
            targetName: defender.name,
            amount: heal,
            remainingHp: defender.currentHp,
            maxHp: defender.maxHp,
            source: 'move',
            message: healMsg,
          });
          return {
            attackerName: attacker.name,
            moveName: moveDisplayName,
            damage: 0,
            typeEffectiveness: 1.0,
            isCritical: false,
            defenderFainted: false,
            message: healMsg,
            events,
          };
        } else if (roll < 0.6) effectivePower = 40;
        else if (roll < 0.9) effectivePower = 80;
        else effectivePower = 120;
      } else if (moveId === 'beat_up') {
        effectivePower = 15;
      } else if (
        moveId === 'counter' ||
        moveId === 'mirror_coat' ||
        moveId === 'metal_burst' ||
        moveId === 'bide'
      ) {
        effectivePower = 90;
      } else if (moveId === 'spit_up') {
        effectivePower = 100;
      } else if (moveId === 'fling' || moveId === 'natural_gift') {
        effectivePower = 60;
      } else if (effectivePower === 0) {
        effectivePower = 120;
      }

      const isSpecial = move.category === 'special';
      const rawAtk = isSpecial ? attacker.stats.spAtk : attacker.stats.attack;
      const rawDef = isSpecial ? defender.stats.spDef : defender.stats.defense;

      const atkStage = isSpecial ? attacker.statStages!.spAtk : attacker.statStages!.attack;
      const defStage = isSpecial ? defender.statStages!.spDef : defender.statStages!.defense;

      let atk = rawAtk * getStatMultiplier(atkStage);
      if (!isSpecial && attacker.status === 'burn') {
        atk *= 0.5;
      }
      const def = Math.max(1, rawDef * getStatMultiplier(defStage));

      const stab = !isStruggle && attacker.types.includes(move.type) ? 1.5 : 1.0;
      const totalCritStage = (attacker.critStage ?? 0) + (move.highCrit ? 1 : 0);
      let critThreshold = 1 / 24;
      if (totalCritStage === 1) critThreshold = 1 / 8;
      else if (totalCritStage === 2) critThreshold = 1 / 2;
      else if (totalCritStage >= 3) critThreshold = 1.0;
      isCrit = this.rng.next() < critThreshold;
      const critMult = isCrit ? 1.5 : 1.0;
      const randomFactor = 0.85 + this.rng.next() * 0.15;

      const levelFactor = Math.floor((2 * attacker.level) / 5) + 2;
      const baseDmg = Math.floor((levelFactor * effectivePower * (atk / def)) / 50) + 2;
      damage = Math.max(1, Math.floor(baseDmg * stab * typeEff * critMult * randomFactor));

      // Multi-hit moves
      const isMultiHit2to5 = [
        'fury_swipes',
        'double_slap',
        'comet_punch',
        'bullet_seed',
        'pin_missile',
        'rock_blast',
        'tail_slap',
        'water_shuriken',
        'icicle_spear',
        'arm_thrust',
        'bone_rush',
        'spike_cannon',
        'barrage',
        'fury_attack',
      ].includes(moveId);
      const isMultiHit2 = [
        'double_kick',
        'twineedle',
        'bonemerang',
        'dual_chop',
        'gear_grind',
        'dragon_darts',
      ].includes(moveId);

      if (isMultiHit2to5 || isMultiHit2) {
        let maxHits = 2;
        if (isMultiHit2to5) {
          const roll = this.rng.next();
          if (roll < 0.35) maxHits = 2;
          else if (roll < 0.7) maxHits = 3;
          else if (roll < 0.85) maxHits = 4;
          else maxHits = 5;
        }

        let totalDmg = damage;
        let hits = 1;
        let simDefenderHp = defender.currentHp - damage;

        for (let i = 2; i <= maxHits; i++) {
          if (simDefenderHp <= 0) break;
          const hitRandom = 0.85 + this.rng.next() * 0.15;
          const hitDmg = Math.max(1, Math.floor(baseDmg * stab * typeEff * critMult * hitRandom));
          totalDmg += hitDmg;
          simDefenderHp -= hitDmg;
          hits++;
        }
        damage = totalDmg;
        hitsCount = hits;
        secMsg += ` Đánh trúng ${hits} lần!`;
      }

      if (typeEff > 1.5) effText = ' Đòn đánh cực kỳ hiệu quả!';
      else if (typeEff < 0.8) effText = ' Đòn đánh không mấy hiệu quả...';

      if (isCrit) effText += ' Đòn chí mạng!';
    }

    // Apply damage and calculate actual damage dealt
    const prevDefenderHp = defender.currentHp;
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    const actualDamage = prevDefenderHp - defender.currentHp;
    const defenderFainted = defender.currentHp <= 0;
    if (defenderFainted) {
      defender.isFainted = true;
    }

    // Push structured damage_dealt event
    events.push({
      type: 'damage_dealt',
      targetSide: defenderSide,
      targetName: defender.name,
      damage: actualDamage,
      remainingHp: defender.currentHp,
      maxHp: defender.maxHp,
      effectiveness: typeEff,
      isCritical: isCrit,
      hitsCount,
      message: effText,
    });

    if (hitsCount > 1) {
      events.push({
        type: 'multi_hit_completed',
        targetSide: defenderSide,
        hitsCount,
        message: `Đánh trúng ${hitsCount} lần!`,
      });
    }

    // Fire moves thaw frozen defender
    if (defender.status === 'freeze' && move.type === 'Fire' && actualDamage > 0) {
      defender.status = 'none';
      secMsg += ` ${defender.name} đã tan băng!`;
      events.push({
        type: 'status_cured',
        targetSide: defenderSide,
        targetName: defender.name,
        status: 'freeze',
        message: `${defender.name} đã tan băng!`,
      });
    }

    let attackerFainted = false;

    // Drain effect
    if (move.drainPercent && move.drainPercent > 0) {
      const drained = Math.max(1, Math.floor(actualDamage * move.drainPercent));
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + drained);
      secMsg += ` ${defender.name} bị hút cạn sinh lực!`;
      events.push({
        type: 'hp_restored',
        targetSide: attackerSide,
        targetName: attacker.name,
        amount: drained,
        remainingHp: attacker.currentHp,
        maxHp: attacker.maxHp,
        source: 'drain',
        message: `${defender.name} bị hút cạn sinh lực!`,
      });
    }

    // Recoil effect
    if (isStruggle) {
      const recoil = Math.max(1, Math.floor(attacker.maxHp * 0.25));
      attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
      secMsg += ` ${attacker.name} bị phản lực tổn thương!`;
      events.push({
        type: 'recoil_damage',
        targetSide: attackerSide,
        targetName: attacker.name,
        damage: recoil,
        remainingHp: attacker.currentHp,
        message: `${attacker.name} bị phản lực tổn thương!`,
      });
      if (attacker.currentHp <= 0) {
        attacker.isFainted = true;
        attackerFainted = true;
      }
    } else if (move.recoilPercent && move.recoilPercent > 0) {
      const recoil = Math.max(1, Math.floor(actualDamage * move.recoilPercent));
      attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
      secMsg += ` ${attacker.name} bị phản lực tổn thương!`;
      events.push({
        type: 'recoil_damage',
        targetSide: attackerSide,
        targetName: attacker.name,
        damage: recoil,
        remainingHp: attacker.currentHp,
        message: `${attacker.name} bị phản lực tổn thương!`,
      });
      if (attacker.currentHp <= 0) {
        attacker.isFainted = true;
        attackerFainted = true;
      }
    } else if (moveId === 'explosion' || moveId === 'self_destruct') {
      attacker.currentHp = 0;
      attacker.isFainted = true;
      attackerFainted = true;
      secMsg += ` ${attacker.name} đã ngất xỉu!`;
    }

    // Defender fainted event
    if (defenderFainted) {
      events.push({
        type: 'fainted',
        targetSide: defenderSide,
        targetName: defender.name,
        message: `${defender.name} đã ngất xỉu!`,
      });
    }

    // Attacker fainted event
    if (attackerFainted) {
      events.push({
        type: 'fainted',
        targetSide: attackerSide,
        targetName: attacker.name,
        message: `${attacker.name} đã ngất xỉu!`,
      });
    }

    // Destiny Bond retribution check
    if (defenderFainted && defender.destinyBond) {
      attacker.currentHp = 0;
      attacker.isFainted = true;
      attackerFainted = true;
      secMsg += ` ${defender.name} đã kéo ${attacker.name} ngất xỉu theo!`;
      events.push({
        type: 'destiny_bond_triggered',
        sourceSide: defenderSide,
        sourceName: defender.name,
        targetSide: attackerSide,
        targetName: attacker.name,
        message: `${defender.name} đã kéo ${attacker.name} ngất xỉu theo!`,
      });
      events.push({
        type: 'fainted',
        targetSide: attackerSide,
        targetName: attacker.name,
        message: `${attacker.name} đã ngất xỉu!`,
      });
    }

    // Secondary effects on surviving defender
    if (!defenderFainted) {
      // Secondary status effect
      if (move.statusEffect) {
        const target = move.statusEffect.target === 'self' ? attacker : defender;
        const tSide: BattlerSide = target === this.playerPokemon ? 'player' : 'enemy';
        const chance = Math.max(0, Math.min(1, move.statusEffect.chance));
        const immunityMessage = this.getStatusImmunity(target, move.statusEffect.condition);
        const conditionVi =
          STATUS_NAME_VI[move.statusEffect.condition] ?? move.statusEffect.condition;
        if (target.status === 'none' && !immunityMessage && this.rng.next() < chance) {
          target.status = move.statusEffect.condition;
          target.statusTurns = 0;
          if (target.status === 'sleep') target.sleepTurns = this.rng.nextInt(1, 3);
          secMsg += ` ${target.name} đã bị ${conditionVi}!`;
          events.push({
            type: 'status_inflicted',
            targetSide: tSide,
            targetName: target.name,
            condition: move.statusEffect.condition,
            message: `${target.name} đã bị ${conditionVi}!`,
          });
        }
      }

      // Secondary stat changes
      if (move.statChanges && move.statChanges.length > 0) {
        for (const sc of move.statChanges) {
          const chance = Math.max(0, Math.min(1, sc.chance ?? 1));
          if (this.rng.next() >= chance) continue;
          const target = sc.target === 'self' ? attacker : defender;
          const tSide: BattlerSide = target === this.playerPokemon ? 'player' : 'enemy';
          const stages = target.statStages!;
          const prev = stages[sc.stat];
          stages[sc.stat] = Math.max(-6, Math.min(6, prev + sc.stages));
          const change = stages[sc.stat] - prev;
          const statVi = STAT_NAME_VI[sc.stat] ?? sc.stat;

          if (change > 1) secMsg += ` Chỉ số ${statVi} của ${target.name} tăng mạnh!`;
          else if (change === 1) secMsg += ` Chỉ số ${statVi} của ${target.name} tăng lên!`;
          else if (change === -1) secMsg += ` Chỉ số ${statVi} của ${target.name} giảm xuống!`;
          else if (change < -1) secMsg += ` Chỉ số ${statVi} của ${target.name} giảm mạnh!`;

          events.push({
            type: 'stat_stage_changed',
            targetSide: tSide,
            targetName: target.name,
            stat: sc.stat,
            change,
            currentStage: stages[sc.stat],
            message: `Chỉ số ${statVi} của ${target.name} ${change > 0 ? 'tăng' : 'giảm'}!`,
          });
        }
      }
    }

    // Recharge move flag
    if (RECHARGE_MOVE_IDS.has(moveId) && actualDamage > 0) {
      attacker.mustRecharge = true;
    }

    return {
      attackerName: attacker.name,
      moveName: moveDisplayName,
      damage,
      typeEffectiveness: typeEff,
      isCritical: isCrit,
      defenderFainted,
      attackerFainted,
      hitsCount,
      message: `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}!${effText}${secMsg}`,
      events,
    };
  }

  public getFirstAttacker(playerMove: BattleMove, enemyMove: BattleMove): 'player' | 'enemy' {
    let pPri = playerMove.priority ?? 0;
    let ePri = enemyMove.priority ?? 0;

    if (PROTECT_MOVE_IDS.has(playerMove.id.toLowerCase())) pPri = 4;
    if (PROTECT_MOVE_IDS.has(enemyMove.id.toLowerCase())) ePri = 4;

    if (pPri !== ePri) {
      return pPri > ePri ? 'player' : 'enemy';
    }

    const pSpeed =
      this.playerPokemon.stats.speed *
      getStatMultiplier(this.playerPokemon.statStages?.speed ?? 0) *
      (this.playerPokemon.status === 'paralysis' ? 0.5 : 1.0);

    const eSpeed =
      this.enemyPokemon.stats.speed *
      getStatMultiplier(this.enemyPokemon.statStages?.speed ?? 0) *
      (this.enemyPokemon.status === 'paralysis' ? 0.5 : 1.0);

    if (pSpeed === eSpeed) {
      return this.rng.next() < 0.5 ? 'player' : 'enemy';
    }

    return pSpeed > eSpeed ? 'player' : 'enemy';
  }

  public getEnemyAction(): BattleMove {
    if (this.enemyPokemon.chargingMove) {
      return this.enemyPokemon.chargingMove.move;
    }
    const validMoves = this.enemyPokemon.moves.filter((m) => m.pp > 0);
    if (validMoves.length > 0) {
      const idx = this.rng.nextInt(0, validMoves.length - 1);
      return validMoves[idx];
    }
    return STRUGGLE_MOVE;
  }

  public tryCatchPokemon(
    ballMultiplier: number = 1.0,
    ballName: string = 'Poké Ball'
  ): CatchResult {
    if (this.ballsCount > 0) {
      this.ballsCount--;
    }

    if (ballMultiplier >= 255) {
      return {
        caught: true,
        shakes: 3,
        message: `Bắt được rồi! Đã thu phục ${this.enemyPokemon.name} bằng ${ballName}!`,
      };
    }

    let statusBonus = 1.0;
    if (this.enemyPokemon.status === 'sleep' || this.enemyPokemon.status === 'freeze') {
      statusBonus = 2.0;
    } else if (
      this.enemyPokemon.status === 'paralysis' ||
      this.enemyPokemon.status === 'poison' ||
      this.enemyPokemon.status === 'toxic' ||
      this.enemyPokemon.status === 'burn'
    ) {
      statusBonus = 1.5;
    }

    const maxHp = this.enemyPokemon.maxHp;
    const curHp = Math.max(1, this.enemyPokemon.currentHp);
    const rate = this.enemyPokemon.catchRate;
    const a = Math.floor(
      ((3 * maxHp - 2 * curHp) * rate * ballMultiplier * statusBonus) / (3 * maxHp)
    );

    if (a >= 255) {
      return {
        caught: true,
        shakes: 3,
        message: `Bắt được rồi! Đã thu phục ${this.enemyPokemon.name}!`,
      };
    }

    const b = Math.floor(65536 / Math.pow(255 / Math.max(1, a), 0.25));
    let shakes = 0;
    for (let i = 0; i < 3; i++) {
      const roll = this.rng.nextInt(0, 65535);
      if (roll < b) {
        shakes++;
      } else {
        break;
      }
    }

    if (shakes >= 3) {
      return {
        caught: true,
        shakes: 3,
        message: `Bắt được rồi! Đã thu phục ${this.enemyPokemon.name}!`,
      };
    }

    const escapeMessages = [
      `Ôi không! ${this.enemyPokemon.name} đã thoát ra!`,
      `Tiếc quá! Tưởng như đã bắt được rồi!`,
      `Suýt chút nữa là bắt được rồi!`,
      `Chết tiệt! Đã ở rất gần rồi!`,
    ];

    return {
      caught: false,
      shakes,
      message: escapeMessages[shakes] || escapeMessages[0],
    };
  }

  public tryFlee(): boolean {
    const pSpeed = this.playerPokemon.stats.speed;
    const eSpeed = this.enemyPokemon.stats.speed;
    if (pSpeed >= eSpeed) return true;

    this.fleeAttempts++;
    const odds = Math.floor((pSpeed * 128) / eSpeed + 30 * this.fleeAttempts) % 256;
    return odds >= 255 || this.rng.nextInt(0, 255) < odds;
  }
}
