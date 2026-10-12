import { describe, it, expect, vi } from 'vitest';
import { createCustomMoveAnimation } from '../src/battle/custom-animations';
import { ShadowBallAnimation } from '../src/battle/custom-animations/shadow-ball';
import { moveAnimationManager } from '../src/battle/move-animation-manager';
import { BattleState } from '../src/battle/battle-state';
import type { BattleMove } from '../src/battle/types';

describe('Shadow Ball Custom Animation System', () => {
  it('creates ShadowBallAnimation for SHADOW_BALL and shadowball', () => {
    const onImpact = vi.fn();
    const onComplete = vi.fn();

    const anim1 = createCustomMoveAnimation('SHADOW_BALL', {
      attackerSide: 'player',
      attackerCenter: { x: 130, y: 215 },
      defenderCenter: { x: 380, y: 115 },
      onImpact,
      onComplete,
    });
    expect(anim1).toBeInstanceOf(ShadowBallAnimation);
    expect(anim1?.id).toBe('shadow_ball');

    const anim2 = createCustomMoveAnimation('shadowball', {
      attackerSide: 'enemy',
      attackerCenter: { x: 380, y: 115 },
      defenderCenter: { x: 130, y: 215 },
      onImpact,
      onComplete,
    });
    expect(anim2).toBeInstanceOf(ShadowBallAnimation);
  });

  it('registers correct animation plan in moveAnimationManager', () => {
    const move = {
      id: 'SHADOW_BALL',
      name: 'Shadow Ball',
      category: 'special',
      type: 'Ghost',
      power: 80,
      accuracy: 100,
      pp: 15,
      maxPp: 15,
    } as unknown as BattleMove;

    const plan = moveAnimationManager.resolveAnimationPlan(move, true);
    expect(plan.category).toBe('special');
    expect(plan.attackerLunges).toBe(false);
    expect(plan.defenderTakesHit).toBe(true);
    expect(plan.customAnimationId).toBe('SHADOW_BALL');
  });

  it('executes 3-phase sequence: energy gathering -> projectile launch -> 3 final burst frames', () => {
    const onImpact = vi.fn();
    const onComplete = vi.fn();
    const state = new BattleState();

    const anim = createCustomMoveAnimation('SHADOW_BALL', {
      attackerSide: 'player',
      attackerCenter: { x: 130, y: 215 },
      defenderCenter: { x: 380, y: 115 },
      onImpact,
      onComplete,
    })!;

    expect(anim).toBeDefined();
    state.startCustomMoveAnimation(anim);

    // Phase 1 (Ticks 1 -> 42 ~0.7s): Tụ năng lượng thành quả cầu
    for (let t = 1; t <= 42; t++) {
      state.update();
      expect(onImpact).not.toHaveBeenCalled();
      expect(anim.isComplete).toBe(false);
    }

    // Phase 2 (Ticks 43 -> 58): Phóng quả cầu
    for (let t = 43; t <= 58; t++) {
      state.update();
      expect(onImpact).not.toHaveBeenCalled();
      expect(anim.isComplete).toBe(false);
    }

    // Phase 3 Impact (Tick 59): Chạm đích & rung nhẹ camera
    state.update(); // Tick 59
    expect(onImpact).toHaveBeenCalledTimes(1);
    expect(state.screenShakeTimer).toBeGreaterThan(0);
    expect(state.screenFlashTimer).toBeGreaterThan(0);

    // Phase 3 Burst (Ticks 60 -> 84): Nổ mở rộng phạm vi & giọt bóng tối lan tỏa
    for (let t = 60; t <= 84; t++) {
      state.update();
    }

    expect(anim.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(state.activeCustomMoveAnim).toBeNull();
  });
});
