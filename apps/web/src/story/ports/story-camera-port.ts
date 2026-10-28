/**
 * Story Camera & Screen FX Port Interface
 */

export interface StoryCameraPort {
  panTo(targetGX: number, targetGY: number, durationMs: number): Promise<void>;
  shakeScreen(intensity: number, durationMs: number): void;
  flashScreen(color: string, durationMs: number): Promise<void>;
  fadeScreen(type: 'in' | 'out', color?: string, durationMs?: number): Promise<void>;
  setScreenZap(active: boolean): void;
  reset(): void;
}
