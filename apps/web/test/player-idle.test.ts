import { describe, it, expect, beforeEach } from 'vitest';
import { Player, getStepFrame } from '../src/entities/player';

describe('Player Idle Animation & Movement Spritesheet Separation', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player(0, 0, 0);
  });

  it('initializes with frame 0 (neutral standing) and isIdling as false', () => {
    expect(player.frame).toBe(0);
    expect(player.isIdling).toBe(false);
    expect(player.isMoving).toBe(false);
  });

  it('walk cycle uses authentic 4-frame movement cycle (0 -> 1 -> 2 -> 3 -> 0)', () => {
    // Step 1 (Odd): 0 (stand) -> 1 (foot forward) -> 2 (plant)
    expect(getStepFrame(1, 0.1)).toBe(0);
    expect(getStepFrame(1, 0.5)).toBe(1);
    expect(getStepFrame(1, 0.9)).toBe(2);

    // Step 2 (Even): 2 (plant) -> 3 (foot forward) -> 0 (stand)
    expect(getStepFrame(2, 0.1)).toBe(2);
    expect(getStepFrame(2, 0.5)).toBe(3);
    expect(getStepFrame(2, 0.9)).toBe(0);
  });

  it('triggers 4-frame idle animation from char_red_idle.png', () => {
    player.triggerIdleAnimation();
    expect(player.isIdling).toBe(true);
    expect(player.frame).toBe(0);
  });

  it('cycles through all 4 idle frames (0 -> 1 -> 2 -> 3) and automatically resets to frame 0', () => {
    player.triggerIdleAnimation();

    // Frame 0 (0..0.16s): at 0.08s (5 frames at 60fps)
    player.update(5.0);
    expect(player.isIdling).toBe(true);
    expect(player.frame).toBe(0);

    // Frame 1 (0.16..0.32s): at 0.23s (9 more frames)
    player.update(9.0);
    expect(player.isIdling).toBe(true);
    expect(player.frame).toBe(1);

    // Frame 2 (0.32..0.48s - eyes closed / blink): at 0.40s (10 more frames)
    player.update(10.0);
    expect(player.isIdling).toBe(true);
    expect(player.frame).toBe(2);

    // Frame 3 (0.48..0.64s - eyes opening): at 0.56s (10 more frames)
    player.update(10.0);
    expect(player.isIdling).toBe(true);
    expect(player.frame).toBe(3);

    // Completion (>0.64s): at 0.70s (9 more frames) -> idle completes, resets to frame 0
    player.update(9.0);
    expect(player.isIdling).toBe(false);
    expect(player.frame).toBe(0);
  });

  it('cancels idle animation immediately with zero input latency when movement begins', () => {
    player.triggerIdleAnimation();
    player.update(20.0); // in the middle of idle animation
    expect(player.isIdling).toBe(true);

    // Player inputs movement
    player.startStep(1, 0, 2);
    expect(player.isIdling).toBe(false);
    expect(player.isMoving).toBe(true);
    expect(player.frame).toBe(0);
  });

  it('cancelIdle() resets idle state and sets frame to 0', () => {
    player.triggerIdleAnimation();
    player.update(15.0);
    expect(player.isIdling).toBe(true);

    player.cancelIdle();
    expect(player.isIdling).toBe(false);
    expect(player.frame).toBe(0);
  });

  it('snapTo() cancels any active idle state', () => {
    player.triggerIdleAnimation();
    player.update(15.0);
    expect(player.isIdling).toBe(true);

    player.snapTo(10, 15, 1);
    expect(player.isIdling).toBe(false);
    expect(player.frame).toBe(0);
    expect(player.gx).toBe(10);
    expect(player.gy).toBe(15);
  });
});
