import { GameTime } from '../core';

export class GameLoop {
  private gameTime: GameTime;

  constructor(onUpdate: (dtScale: number) => void, onRender: () => void) {
    this.gameTime = new GameTime(onUpdate, onRender);
  }

  public start(): void {
    this.gameTime.start();
  }

  public stop(): void {
    this.gameTime.stop();
  }

  public getFps(): number {
    return this.gameTime.getStats().fps;
  }
}
