/**
 * Battle Camera Vector & Dynamic Motion Manager.
 * Replicates Elite Battle: DX (EBDX v1.4.7.1) class Vector camera dynamics.
 *
 * In EBDX:
 * - Camera defines viewport center, zoom, and spatial motion (@vector.set).
 * - Subtle Steadicam breathing sway when idle.
 * - Attack Zoom & Pan: Smoothly zooms into attacker during windup, tracks projectile across the arena,
 *   and punches zoom + impact screen recoil on target hit.
 * - Damped harmonic oscillation for screen shake on physical/heavy impacts.
 *
 * NOTE: Strictly applied inside the clipped battle viewport — 100% preserves custom UI untouched.
 */

export interface CameraTransform {
  scale: number;
  panX: number;
  panY: number;
  shakeX: number;
  shakeY: number;
}

export interface CameraTargetVector {
  scale: number;
  panX: number;
  panY: number;
}

export class BattleCameraManager {
  private currentScale = 1.0;
  private currentPanX = 0;
  private currentPanY = 0;

  // Impact screen shake state (damped harmonic oscillation)
  private shakeIntensity = 0;
  private shakeTimer = 0;
  private shakeDirection: 'horizontal' | 'vertical' | 'radial' = 'horizontal';

  public reset(): void {
    this.currentScale = 1.0;
    this.currentPanX = 0;
    this.currentPanY = 0;
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
  }

  /**
   * Triggers an authentic EBDX-style directional impact screen shake.
   */
  public triggerImpactShake(
    intensity = 6,
    direction: 'horizontal' | 'vertical' | 'radial' = 'horizontal'
  ): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = 14;
    this.shakeDirection = direction;
  }

  /**
   * Computes the combined camera transform for the current animation frame.
   *
   * @param tick Engine frame tick for continuous wave calculations
   * @param isIntro True during battle intro sequence
   * @param introProgress Progress of the intro zoom (0.0 to 1.0)
   * @param captureZoomProgress Progress of ball capture zoom (0.0 to 1.0)
   * @param isAnimationPlaying True if a move timeline animation is active
   * @param animationProgress Progress of active move animation (0.0 to 1.0)
   * @param userCenter Screen coords of attacker {x, y}
   * @param targetCenter Screen coords of defender {x, y}
   */
  public getTransform(
    tick: number,
    isIntro: boolean,
    introProgress: number,
    captureZoomProgress: number,
    isAnimationPlaying: boolean,
    animationProgress = 0,
    userCenter?: { x: number; y: number },
    targetCenter?: { x: number; y: number }
  ): CameraTransform {
    let baseScale = 1.0;
    let basePanX = 0;
    let basePanY = 0;

    // 1. Intro sequence zoom/pan
    if (isIntro) {
      const zoomStartP = 0.5;
      const zoomEndP = 0.92;
      if (introProgress < zoomStartP) {
        baseScale = 1.35;
        basePanX = -45;
        basePanY = 15;
      } else if (introProgress < zoomEndP) {
        const t = (introProgress - zoomStartP) / (zoomEndP - zoomStartP);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        baseScale = 1.35 - eased * 0.35;
        basePanX = -45 * (1 - eased);
        basePanY = 15 * (1 - eased);
      }
    }

    // 2. Capture zoom
    if (captureZoomProgress > 0) {
      const t = captureZoomProgress;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      baseScale = 1.0 + eased * 0.4;
      basePanX = -45 * eased;
      basePanY = 15 * eased;
    }

    // 3. Move Animation Dynamics (EBDX @vector.set tracking)
    let moveScale = 1.0;
    let movePanX = 0;
    let movePanY = 0;

    if (isAnimationPlaying && userCenter && targetCenter && !isIntro && captureZoomProgress <= 0) {
      const p = Math.max(0, Math.min(1, animationProgress));
      const arenaCenterX = 256;
      const arenaCenterY = 144;

      const userOffsetPanX = (userCenter.x - arenaCenterX) * 0.18;
      const userOffsetPanY = (userCenter.y - arenaCenterY) * 0.18;

      const targetOffsetPanX = (targetCenter.x - arenaCenterX) * 0.22;
      const targetOffsetPanY = (targetCenter.y - arenaCenterY) * 0.22;

      if (p < 0.24) {
        // Phase 1: Wind-up & Charge (zooms toward attacker)
        const t = p / 0.24;
        const eased = t * (2 - t); // Quadratic ease-out
        moveScale = 1.0 + eased * 0.08;
        movePanX = userOffsetPanX * eased;
        movePanY = userOffsetPanY * eased;
      } else if (p < 0.62) {
        // Phase 2: Trajectory Pan & Impact Tracking (pans smoothly to target)
        const t = (p - 0.24) / 0.38;
        // Smoothstep interpolation
        const eased = t * t * (3 - 2 * t);
        moveScale = 1.08 + (p > 0.42 && p < 0.58 ? 0.04 : 0); // Punch zoom on impact
        movePanX = userOffsetPanX + (targetOffsetPanX - userOffsetPanX) * eased;
        movePanY = userOffsetPanY + (targetOffsetPanY - userOffsetPanY) * eased;
      } else {
        // Phase 3: Settle & Ease-out back to neutral
        const t = (p - 0.62) / 0.38;
        const eased = 1 - t * t; // Quadratic ease-in to neutral
        moveScale = 1.0 + eased * 0.08;
        movePanX = targetOffsetPanX * eased;
        movePanY = targetOffsetPanY * eased;
      }
    }

    // 4. Subtle Steadicam Breathing Idle
    // When idle and not animating, camera subtly breathes to bring life to the field
    let swayScale = 1.0;
    let swayPanX = 0;
    let swayPanY = 0;

    if (!isIntro && captureZoomProgress <= 0 && !isAnimationPlaying) {
      swayPanX = Math.sin(tick * 0.028) * 0.75;
      swayPanY = Math.cos(tick * 0.02) * 0.5;
      swayScale = 1.0 + Math.sin(tick * 0.016) * 0.003;
    }

    // 5. Screen Shake Engine (Damped Sine Wave)
    let shakeX = 0;
    let shakeY = 0;

    if (this.shakeTimer > 0) {
      this.shakeTimer--;
      const damping = this.shakeTimer / 14;
      const wave = Math.sin(this.shakeTimer * 2.5) * this.shakeIntensity * damping;

      if (this.shakeDirection === 'horizontal') {
        shakeX = wave;
      } else if (this.shakeDirection === 'vertical') {
        shakeY = wave;
      } else {
        shakeX = wave;
        shakeY = Math.cos(this.shakeTimer * 2.2) * (this.shakeIntensity * 0.6) * damping;
      }
    }

    // Target smooth lerp
    const finalTargetScale = baseScale * moveScale * swayScale;
    const finalTargetPanX = basePanX + movePanX + swayPanX;
    const finalTargetPanY = basePanY + movePanY + swayPanY;

    this.currentScale += (finalTargetScale - this.currentScale) * 0.3;
    this.currentPanX += (finalTargetPanX - this.currentPanX) * 0.3;
    this.currentPanY += (finalTargetPanY - this.currentPanY) * 0.3;

    return {
      scale: this.currentScale,
      panX: this.currentPanX,
      panY: this.currentPanY,
      shakeX,
      shakeY,
    };
  }
}

export const battleCameraManager = new BattleCameraManager();
