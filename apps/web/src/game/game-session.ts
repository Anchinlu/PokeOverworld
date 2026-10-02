import { Camera, InputManager } from '../core';
import { Player, Follower } from '../entities';
import { ChunkManager, getRoadCenterX } from '../maps';
import { updateWildPokemon } from '../ai';
import type { GameRenderer } from '../rendering';
import type { BerryBushEntity } from '../maps/chunk';
import { interactWithBerryBush } from '../ui/berry-panel';

export class GameSession {
  public seed: number;
  public camera: Camera;
  public input: InputManager;
  public chunkManager: ChunkManager;
  public player: Player;
  public follower: Follower;

  constructor(initialSeed = 101) {
    this.seed = initialSeed;
    this.camera = new Camera(0, 0);
    this.input = new InputManager();
    this.chunkManager = new ChunkManager(this.seed);

    const initRoadCenter = getRoadCenterX(0, this.seed);
    this.player = new Player(initRoadCenter, 0, 0);
    this.follower = new Follower(initRoadCenter, -1, 0);
    this.camera.snapTo(this.player);
  }

  public update(dtScale: number, collisionEnabled = true): { pChunkX: number; pChunkY: number } {
    const isRunning = this.input.isRunning();

    // 1. Update chunks around player
    const { pChunkX, pChunkY } = this.chunkManager.update(this.player.x, this.player.y);

    // 2. Process movement if player is idle on grid
    if (!this.player.isMoving) {
      const requestedDir = this.input.getRequestedDirection();
      if (requestedDir !== null) {
        let nextGX = this.player.gx;
        let nextGY = this.player.gy;

        if (requestedDir === 0) nextGY += 1;
        else if (requestedDir === 1) nextGX -= 1;
        else if (requestedDir === 2) nextGX += 1;
        else if (requestedDir === 3) nextGY -= 1;

        const canMove = !collisionEnabled || this.chunkManager.isWalkable(nextGX, nextGY);

        if (canMove) {
          this.player.startStep(nextGX, nextGY, requestedDir);
          this.follower.startFollow(
            this.player.fromGX,
            this.player.fromGY,
            nextGX,
            nextGY,
            this.player.stepCount
          );
        } else {
          this.player.setBlocked(requestedDir);
        }
      } else {
        this.player.setIdle();
      }
    }

    // 3. Advance player and follower step progress
    const stepCompleted = this.player.update(dtScale, isRunning);
    if (this.player.isMoving) {
      this.follower.updateSync(this.player.stepProgress);
    }
    if (stepCompleted) {
      this.follower.completeStep();
    }

    // 4. Camera follows player
    this.camera.update(this.player, dtScale);

    // 5. Wild Pokémon AI
    updateWildPokemon(this.chunkManager, this.player, this.follower, dtScale);

    return { pChunkX, pChunkY };
  }

  public regenerate(seed?: number): void {
    if (seed !== undefined) {
      this.seed = seed;
    }
    this.chunkManager.reset(this.seed);
    this.resetPlayer();
  }

  public resetPlayer(): void {
    const rc = getRoadCenterX(0, this.seed);
    this.player.snapTo(rc, 0);
    this.follower.snapTo(rc, -1);
    this.camera.snapTo(this.player);
    this.chunkManager.update(this.player.x, this.player.y);
  }

  public interactAt(worldGX: number, worldGY: number, renderer: GameRenderer): void {
    for (const chunk of this.chunkManager.activeChunks) {
      if (!chunk.berryBushes) continue;
      for (const b of chunk.berryBushes) {
        if ((b.gx === worldGX && b.gy === worldGY) || (b.gx === worldGX && b.gy - 1 === worldGY)) {
          interactWithBerryBush(b, renderer);
          return;
        }
      }
    }
  }

  public interactInFront(renderer: GameRenderer): void {
    let targetGX = this.player.gx;
    let targetGY = this.player.gy;
    if (this.player.direction === 0) targetGY += 1;
    else if (this.player.direction === 1) targetGX -= 1;
    else if (this.player.direction === 2) targetGX += 1;
    else if (this.player.direction === 3) targetGY -= 1;

    let foundBush: BerryBushEntity | null = null;
    for (const chunk of this.chunkManager.activeChunks) {
      if (!chunk.berryBushes) continue;
      for (const b of chunk.berryBushes) {
        if (
          (b.gx === targetGX && b.gy === targetGY) ||
          (b.gx === targetGX && b.gy - 1 === targetGY) ||
          (Math.abs(b.gx - this.player.gx) <= 1 && Math.abs(b.gy - this.player.gy) <= 1)
        ) {
          foundBush = b;
          break;
        }
      }
      if (foundBush) break;
    }

    if (foundBush) {
      interactWithBerryBush(foundBush, renderer);
    }
  }
}
