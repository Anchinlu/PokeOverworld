import type { BattleMove, MoveCategory } from './types';

export interface MoveAnimationPlan {
  /** Move category: 'physical' | 'special' | 'status' */
  category: MoveCategory;
  /** Whether the attacker performs a forward physical lunge towards the opponent */
  attackerLunges: boolean;
  /** Whether the target takes a damage reaction (knockback jitter + hurt flash) */
  defenderTakesHit: boolean;
  /** Identifier for future custom battle animation effects (e.g. 'SOLAR_BEAM', 'FLY', 'SURF') */
  customAnimationId?: string;
  /** Optional metadata for future particle / FX systems */
  metadata?: Record<string, unknown>;
}

export type MoveAnimationResolver =
  | Partial<MoveAnimationPlan>
  | ((move: BattleMove, damageDealt: boolean) => Partial<MoveAnimationPlan>);

/**
 * MoveAnimationManager
 *
 * Centralized manager and registry for move animation behaviors and execution styles.
 * By default:
 * - 'physical': Attacker lunges forward; defender reacts if damage is dealt.
 * - 'special': Attacker does NOT lunge (casts from position); defender reacts if damage is dealt.
 * - 'status': Attacker does NOT lunge; defender does NOT take physical damage knockback.
 *
 * Custom moves with unique execution styles (multi-turn, aerial, ground, beams, etc.)
 * can register overrides by move ID without modifying the core battle loop.
 */
export class MoveAnimationManager {
  private overrides = new Map<string, MoveAnimationResolver>();

  /**
   * Register a custom animation plan or resolver for a specific move.
   * @param moveId Uppercase move ID (e.g. 'SOLARBEAM', 'FLY', 'DIG')
   * @param resolver Fixed plan partial or dynamic resolver function
   */
  public registerOverride(moveId: string, resolver: MoveAnimationResolver): void {
    this.overrides.set(moveId.toUpperCase(), resolver);
  }

  /**
   * Remove a custom override for a move ID.
   */
  public unregisterOverride(moveId: string): void {
    this.overrides.delete(moveId.toUpperCase());
  }

  /**
   * Clear all custom move overrides (useful for testing).
   */
  public clearOverrides(): void {
    this.overrides.clear();
  }

  /**
   * Resolve the animation plan for a given move execution.
   */
  public resolveAnimationPlan(move: BattleMove, damageDealt = true): MoveAnimationPlan {
    const moveId = move.id.toUpperCase();
    const override = this.overrides.get(moveId);

    // Baseline default configuration according to move category:
    let basePlan: MoveAnimationPlan;

    switch (move.category) {
      case 'physical':
        basePlan = {
          category: 'physical',
          attackerLunges: true,
          defenderTakesHit: damageDealt,
        };
        break;

      case 'special':
        basePlan = {
          category: 'special',
          // Special moves cast from position without physical forward lunging
          attackerLunges: false,
          defenderTakesHit: damageDealt,
        };
        break;

      case 'status':
      default:
        basePlan = {
          category: 'status',
          // Status moves apply buffs/debuffs/auras without physical lunging or damage knockback
          attackerLunges: false,
          defenderTakesHit: false,
        };
        break;
    }

    if (!override) {
      return basePlan;
    }

    const customResult = typeof override === 'function' ? override(move, damageDealt) : override;

    return {
      ...basePlan,
      ...customResult,
    };
  }
}

/** Global singleton instance */
export const moveAnimationManager = new MoveAnimationManager();
