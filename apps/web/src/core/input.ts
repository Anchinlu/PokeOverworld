import type { Direction } from '@pokemon/shared-types';

/**
 * Direction constants matching Pokémon standards:
 * 0 = DOWN, 1 = LEFT, 2 = RIGHT, 3 = UP
 */
export const DIR_DOWN: Direction = 0;
export const DIR_LEFT: Direction = 1;
export const DIR_RIGHT: Direction = 2;
export const DIR_UP: Direction = 3;

export type ActionCallback = () => void;

export class InputManager {
  private keys: Record<string, boolean> = {};
  private keyQueue: string[] = [];
  private actionListeners: ActionCallback[] = [];

  constructor() {
    this.attachListeners();
  }

  /** Checks if running modifier (Shift) is held. */
  public isRunning(): boolean {
    return !!this.keys['shift'];
  }

  /**
   * Returns the currently requested single direction (0..3), or null if none.
   * Disallows diagonal movement by prioritizing the most recently pressed active key.
   */
  public getRequestedDirection(): Direction | null {
    for (let i = this.keyQueue.length - 1; i >= 0; i--) {
      const k = this.keyQueue[i];
      if (!this.keys[k]) continue;

      if (k === 'arrowdown' || k === 's') return DIR_DOWN;
      if (k === 'arrowleft' || k === 'a') return DIR_LEFT;
      if (k === 'arrowright' || k === 'd') return DIR_RIGHT;
      if (k === 'arrowup' || k === 'w') return DIR_UP;
    }
    return null;
  }

  /** Subscribes to interaction trigger (Space, Enter, E). */
  public onAction(callback: ActionCallback): () => void {
    this.actionListeners.push(callback);
    return () => {
      this.actionListeners = this.actionListeners.filter((cb) => cb !== callback);
    };
  }

  /** Clean up event listeners. */
  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.actionListeners = [];
  }

  private attachListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();

    // Directional keys
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      if (!this.keyQueue.includes(k)) {
        this.keyQueue.push(k);
      }
      this.keys[k] = true;
      e.preventDefault();
    }

    // Running Shoes modifier
    if (k === 'shift') {
      this.keys['shift'] = true;
    }

    // Interaction trigger
    if ([' ', 'enter', 'e'].includes(k)) {
      e.preventDefault();
      this.actionListeners.forEach((cb) => cb());
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();
    const idx = this.keyQueue.indexOf(k);
    if (idx !== -1) {
      this.keyQueue.splice(idx, 1);
    }
    this.keys[k] = false;
  };

  private handleBlur = (): void => {
    // Reset all pressed keys when window loses focus to prevent stuck movement
    this.keys = {};
    this.keyQueue = [];
  };
}
