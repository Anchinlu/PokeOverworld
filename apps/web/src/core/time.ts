/**
 * Game loop, delta time calculation, and frame-rate normalization.
 * Normalizes all physics and animation updates to 60 FPS baseline (16.67ms).
 */

export type UpdateCallback = (dtScale: number, dtMs: number) => void;
export type RenderCallback = () => void;

export interface GameTimeStats {
  fps: number;
  dtMs: number;
  dtScale: number;
}

export class GameTime {
  private lastTime = 0;
  private frameCount = 0;
  private fpsTimer = 0;
  private currentFps = 60;
  private isRunning = false;
  private animationFrameId: number | null = null;

  private onUpdate: UpdateCallback;
  private onRender: RenderCallback;

  constructor(onUpdate: UpdateCallback, onRender: RenderCallback) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public getStats(): GameTimeStats {
    return {
      fps: this.currentFps,
      dtMs: this.lastTime,
      dtScale: 1.0,
    };
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const dtMs = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // FPS calculation
    this.frameCount++;
    this.fpsTimer += dtMs;
    if (this.fpsTimer >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // Baseline 60 FPS scale (1.0 at 60 FPS, 0.416 at 144 FPS).
    // Clamped between 0.1 and 2.5 to avoid large physics steps when switching tabs.
    const dtScale = Math.min(Math.max((dtMs || 16.667) / (1000 / 60), 0.1), 2.5);

    this.onUpdate(dtScale, dtMs);
    this.onRender();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
