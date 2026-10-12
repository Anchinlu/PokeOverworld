import { describe, it, expect, vi } from 'vitest';
import { createCustomMoveAnimation } from '../src/battle/custom-animations';
import { FlamethrowerAnimation } from '../src/battle/custom-animations/flamethrower';
import { ThunderboltAnimation } from '../src/battle/custom-animations/thunderbolt';
import { HydroPumpAnimation } from '../src/battle/custom-animations/hydro-pump';
import { moveAnimationManager } from '../src/battle/move-animation-manager';
import { BattleState } from '../src/battle/battle-state';
import type { BattleMove } from '../src/battle/types';

describe('Elemental Trio Custom Animations (Flamethrower, Thunderbolt, Hydro Pump)', () => {
  describe('Flamethrower', () => {
    it('creates FlamethrowerAnimation for FLAMETHROWER', () => {
      const onImpact = vi.fn();
      const onComplete = vi.fn();

      const anim = createCustomMoveAnimation('FLAMETHROWER', {
        attackerSide: 'player',
        attackerCenter: { x: 130, y: 215 },
        defenderCenter: { x: 380, y: 115 },
        onImpact,
        onComplete,
      });

      expect(anim).toBeInstanceOf(FlamethrowerAnimation);
      expect(anim?.id).toBe('flamethrower');
    });

    it('resolves animation plan with special category, no lunging, and custom ID', () => {
      const move = {
        id: 'FLAMETHROWER',
        name: 'Flamethrower',
        category: 'special',
        type: 'Fire',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
      } as unknown as BattleMove;

      const plan = moveAnimationManager.resolveAnimationPlan(move, true);
      expect(plan.category).toBe('special');
      expect(plan.attackerLunges).toBe(false);
      expect(plan.defenderTakesHit).toBe(true);
      expect(plan.customAnimationId).toBe('FLAMETHROWER');
    });

    it('executes 3-phase lifecycle: charge -> stream launch -> impact burst with shake/flash', () => {
      const onImpact = vi.fn();
      const onComplete = vi.fn();
      const state = new BattleState();

      const anim = createCustomMoveAnimation('FLAMETHROWER', {
        attackerSide: 'player',
        attackerCenter: { x: 130, y: 215 },
        defenderCenter: { x: 380, y: 115 },
        onImpact,
        onComplete,
      })!;

      // Phase 1 (Ticks 1 -> 33)
      for (let i = 0; i < 33; i++) {
        anim.update(state);
      }
      expect(onImpact).not.toHaveBeenCalled();
      expect(anim.isComplete).toBe(false);

      // Phase 2 (Ticks 34 -> 50)
      for (let i = 0; i < 17; i++) {
        anim.update(state);
      }
      expect(onImpact).not.toHaveBeenCalled();

      // Phase 3 trigger at tick 51
      anim.update(state);
      expect(onImpact).toHaveBeenCalledTimes(1);

      // Finish remaining ticks
      while (!anim.isComplete) {
        anim.update(state);
      }
      expect(anim.isComplete).toBe(true);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Thunderbolt', () => {
    it('creates ThunderboltAnimation for THUNDERBOLT', () => {
      const onImpact = vi.fn();
      const onComplete = vi.fn();

      const anim = createCustomMoveAnimation('THUNDERBOLT', {
        attackerSide: 'player',
        attackerCenter: { x: 130, y: 215 },
        defenderCenter: { x: 380, y: 115 },
        onImpact,
        onComplete,
      });

      expect(anim).toBeInstanceOf(ThunderboltAnimation);
      expect(anim?.id).toBe('thunderbolt');
    });

    it('resolves animation plan with special category, no lunging, and custom ID', () => {
      const move = {
        id: 'THUNDERBOLT',
        name: 'Thunderbolt',
        category: 'special',
        type: 'Electric',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
      } as unknown as BattleMove;

      const plan = moveAnimationManager.resolveAnimationPlan(move, true);
      expect(plan.category).toBe('special');
      expect(plan.attackerLunges).toBe(false);
      expect(plan.defenderTakesHit).toBe(true);
      expect(plan.customAnimationId).toBe('THUNDERBOLT');
    });

    it('executes 3-phase lifecycle: charge -> zigzag lightning -> vertical thunder strike with shake/flash', () => {
      const onImpact = vi.fn();
      const onComplete = vi.fn();
      const state = new BattleState();

      const anim = createCustomMoveAnimation('THUNDERBOLT', {
        attackerSide: 'enemy',
        attackerCenter: { x: 380, y: 115 },
        defenderCenter: { x: 130, y: 215 },
        onImpact,
        onComplete,
      })!;

      // Phase 1 (Ticks 1 -> 33)
      for (let i = 0; i < 33; i++) {
        anim.update(state);
      }
      expect(onImpact).not.toHaveBeenCalled();

      // Phase 2 (Ticks 34 -> 48)
      for (let i = 0; i < 15; i++) {
        anim.update(state);
      }
      expect(onImpact).not.toHaveBeenCalled();

      // Phase 3 trigger at tick 49
      anim.update(state);
      expect(onImpact).toHaveBeenCalledTimes(1);

      // Finish remaining ticks
      while (!anim.isComplete) {
        anim.update(state);
      }
      expect(anim.isComplete).toBe(true);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hydro Pump', () => {
    it('creates HydroPumpAnimation for HYDRO_PUMP and HYDROPUMP', () => {
      const onImpact = vi.fn();
      const onComplete = vi.fn();

      const anim1 = createCustomMoveAnimation('HYDRO_PUMP', {
        attackerSide: 'player',
        attackerCenter: { x: 130, y: 215 },
        defenderCenter: { x: 380, y: 115 },
        onImpact,
        onComplete,
      });
      expect(anim1).toBeInstanceOf(HydroPumpAnimation);
      expect(anim1?.id).toBe('hydro-pump');

      const anim2 = createCustomMoveAnimation('HYDROPUMP', {
        attackerSide: 'enemy',
        attackerCenter: { x: 380, y: 115 },
        defenderCenter: { x: 130, y: 215 },
        onImpact,
        onComplete,
      });
      expect(anim2).toBeInstanceOf(HydroPumpAnimation);
    });

    it('resolves animation plan with special category, no lunging, and custom ID', () => {
      const move = {
        id: 'HYDRO_PUMP',
        name: 'Hydro Pump',
        category: 'special',
        type: 'Water',
        power: 110,
        accuracy: 80,
        pp: 5,
        maxPp: 5,
      } as unknown as BattleMove;

      const plan = moveAnimationManager.resolveAnimationPlan(move, true);
      expect(plan.category).toBe('special');
      expect(plan.attackerLunges).toBe(false);
      expect(plan.defenderTakesHit).toBe(true);
      expect(plan.customAnimationId).toBe('HYDRO_PUMP');
    });

    it('executes 3-phase lifecycle: vortex gathering -> cannon launch -> geyser pillar with shake/flash', () => {
      const onImpact = vi.fn();
      const onComplete = vi.fn();
      const state = new BattleState();

      const anim = createCustomMoveAnimation('HYDRO_PUMP', {
        attackerSide: 'player',
        attackerCenter: { x: 130, y: 215 },
        defenderCenter: { x: 380, y: 115 },
        onImpact,
        onComplete,
      })!;

      // Phase 1 (Ticks 1 -> 39)
      for (let i = 0; i < 39; i++) {
        anim.update(state);
      }
      expect(onImpact).not.toHaveBeenCalled();

      // Phase 2 (Ticks 40 -> 54)
      for (let i = 0; i < 15; i++) {
        anim.update(state);
      }
      expect(onImpact).not.toHaveBeenCalled();

      // Phase 3 trigger at tick 55
      anim.update(state);
      expect(onImpact).toHaveBeenCalledTimes(1);

      // Finish remaining ticks
      while (!anim.isComplete) {
        anim.update(state);
      }
      expect(anim.isComplete).toBe(true);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
