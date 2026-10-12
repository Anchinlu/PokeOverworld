import { describe, it, expect, vi } from 'vitest';
import { createCustomMoveAnimation } from '../src/battle/custom-animations';
import { AncientPowerAnimation } from '../src/battle/custom-animations/ancient-power';
import { moveAnimationManager } from '../src/battle/move-animation-manager';
import { BattleState } from '../src/battle/battle-state';
import type { BattleMove } from '../src/battle/types';

describe('Ancient Power Custom Animation System', () => {
  it('creates AncientPowerAnimation for ANCIENT_POWER and ancientpower', () => {
    const onImpact = vi.fn();
    const onComplete = vi.fn();

    const anim1 = createCustomMoveAnimation('ANCIENT_POWER', {
      attackerSide: 'player',
      attackerCenter: { x: 130, y: 215 },
      defenderCenter: { x: 380, y: 115 },
      onImpact,
      onComplete,
    });
    expect(anim1).toBeInstanceOf(AncientPowerAnimation);
    expect(anim1?.id).toBe('ancient_power');

    const anim2 = createCustomMoveAnimation('ancientpower', {
      attackerSide: 'enemy',
      attackerCenter: { x: 380, y: 115 },
      defenderCenter: { x: 130, y: 215 },
      onImpact,
      onComplete,
    });
    expect(anim2).toBeInstanceOf(AncientPowerAnimation);

    const fallback = createCustomMoveAnimation('TACKLE', {
      attackerSide: 'player',
      attackerCenter: { x: 130, y: 215 },
      defenderCenter: { x: 380, y: 115 },
      onImpact,
      onComplete,
    });
    expect(fallback).toBeNull();
  });

  it('registers correct animation plan in moveAnimationManager', () => {
    const move = {
      id: 'ANCIENT_POWER',
      name: 'Ancient Power',
      category: 'special',
      type: 'Rock',
      power: 60,
      accuracy: 100,
      pp: 5,
      maxPp: 5,
    } as unknown as BattleMove;

    const plan = moveAnimationManager.resolveAnimationPlan(move, true);
    expect(plan.category).toBe('special');
    expect(plan.attackerLunges).toBe(false); // Does not physically lunge
    expect(plan.defenderTakesHit).toBe(true);
    expect(plan.customAnimationId).toBe('ANCIENT_POWER');
  });

  it('runs complete 3-phase lifecycle: summon -> barrage -> impact with debris', () => {
    const onImpact = vi.fn();
    const onComplete = vi.fn();
    const state = new BattleState();

    const anim = createCustomMoveAnimation('ANCIENT_POWER', {
      attackerSide: 'player',
      attackerCenter: { x: 130, y: 215 },
      defenderCenter: { x: 380, y: 115 },
      onImpact,
      onComplete,
    })!;

    expect(anim).toBeDefined();
    state.startCustomMoveAnimation(anim);
    expect(state.activeCustomMoveAnim).toBe(anim);

    // Phase 1 (Ticks 1 -> 24): Summoning boulders
    for (let t = 1; t <= 24; t++) {
      state.update();
      expect(onImpact).not.toHaveBeenCalled();
      expect(anim.isComplete).toBe(false);
    }

    // Phase 2 (Ticks 25 -> 40): Launching barrage
    for (let t = 25; t <= 40; t++) {
      state.update();
      expect(onImpact).not.toHaveBeenCalled();
      expect(anim.isComplete).toBe(false);
    }

    // Phase 3 Impact (Tick 41): Impact triggered!
    state.update(); // Tick 41
    expect(onImpact).toHaveBeenCalledTimes(1);
    expect(state.screenShakeTimer).toBeGreaterThan(0);
    expect(state.screenFlashTimer).toBeGreaterThan(0);

    // Remaining ticks (Ticks 42 -> 66): Debris scattering and completion
    for (let t = 42; t <= 66; t++) {
      state.update();
    }

    expect(anim.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(state.activeCustomMoveAnim).toBeNull();
  });
});
