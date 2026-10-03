import { Camera, InputManager } from '../core';
import { Player, Follower } from '../entities';
import { ChunkManager, getRoadCenterX } from '../maps';
import { updateWildPokemon } from '../ai';
import type { GameRenderer } from '../rendering';
import type { BerryBushEntity } from '../maps/chunk';
import { interactWithBerryBush } from '../ui/berry-panel';
import { sampleEcology, getEcologyZone } from '../maps/ecology';
import { isNearWater } from '../maps/terrain-rules';
import { BattleScreen, createBattler, getBattleEnvironment } from '../battle';
import { showBerryToast } from '../ui/toast';

export class GameSession {
  public seed: number;
  public camera: Camera;
  public input: InputManager;
  public chunkManager: ChunkManager;
  public player: Player;
  public follower: Follower;
  public isBattling = false;
  private lastBattleEndTime = 0;

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
    if (this.isBattling) {
      return {
        pChunkX: Math.floor(this.player.gx / 16),
        pChunkY: Math.floor(this.player.gy / 16),
      };
    }

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

      // Check encounter collision when step completes
      if (Date.now() - this.lastBattleEndTime > 1500) {
        this.checkWildPokemonCollision();
      }
    }

    // 4. Camera follows player
    this.camera.update(this.player, dtScale);

    // 5. Wild Pokémon AI
    updateWildPokemon(this.chunkManager, this.player, this.follower, dtScale);

    return { pChunkX, pChunkY };
  }

  private checkWildPokemonCollision(): void {
    for (const chunk of this.chunkManager.activeChunks) {
      if (!chunk.wildPokemon) continue;
      for (const wp of chunk.wildPokemon) {
        if (wp.gx === this.player.gx && wp.gy === this.player.gy) {
          this.startWildBattle(wp, chunk);
          return;
        }
      }
    }
  }

  public startWildBattle(wp: any, chunk?: any): void {
    if (this.isBattling) return;
    this.isBattling = true;

    const sample = sampleEcology(wp.gx, wp.gy, this.seed);
    const zone = getEcologyZone(sample);
    const nearWater = isNearWater(wp.gx, wp.gy, this.seed, 1);
    const env = getBattleEnvironment(zone, nearWater);

    const playerBattler = createBattler('PIKACHU', Math.max(5, wp.level + 2), true);
    const wildBattler = createBattler(wp.speciesKey, wp.level, false);

    new BattleScreen(playerBattler, wildBattler, env, (result) => {
      this.isBattling = false;
      this.lastBattleEndTime = Date.now();

      if (result.outcome === 'caught' || result.outcome === 'victory') {
        if (chunk && chunk.wildPokemon) {
          const idx = chunk.wildPokemon.indexOf(wp);
          if (idx !== -1) {
            chunk.wildPokemon.splice(idx, 1);
          }
        }

        if (result.outcome === 'caught') {
          showBerryToast(`🎉 Đã thu phục thành công ${wildBattler.name}!`, '#22c55e');
        } else {
          showBerryToast(`⚔️ Đã đánh bại ${wildBattler.name}!`, '#38bdf8');
        }
      }
    });
  }

  public startTestBattle(): void {
    const testRoster = [
      'PIDGEY',
      'RATTATA',
      'CATERPIE',
      'SPEAROW',
      'BULBASAUR',
      'CHARMANDER',
      'SQUIRTLE',
    ];
    const randomSpecies = testRoster[Math.floor(Math.random() * testRoster.length)];
    const mockWp = {
      gx: this.player.gx,
      gy: this.player.gy,
      speciesKey: randomSpecies,
      level: Math.floor(Math.random() * 4) + 3,
    };
    this.startWildBattle(mockWp);
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
    if (this.isBattling) return;

    // 1. Check Wild Pokémon click
    for (const chunk of this.chunkManager.activeChunks) {
      if (!chunk.wildPokemon) continue;
      for (const wp of chunk.wildPokemon) {
        if (Math.abs(wp.gx - worldGX) <= 1 && Math.abs(wp.gy - worldGY) <= 1) {
          this.startWildBattle(wp, chunk);
          return;
        }
      }
    }

    // 2. Check Berry Bushes
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
    if (this.isBattling) return;

    let targetGX = this.player.gx;
    let targetGY = this.player.gy;
    if (this.player.direction === 0) targetGY += 1;
    else if (this.player.direction === 1) targetGX -= 1;
    else if (this.player.direction === 2) targetGX += 1;
    else if (this.player.direction === 3) targetGY -= 1;

    // 1. Check Wild Pokémon in front
    for (const chunk of this.chunkManager.activeChunks) {
      if (!chunk.wildPokemon) continue;
      for (const wp of chunk.wildPokemon) {
        if (
          (wp.gx === targetGX && wp.gy === targetGY) ||
          (Math.abs(wp.gx - this.player.gx) <= 1 && Math.abs(wp.gy - this.player.gy) <= 1)
        ) {
          this.startWildBattle(wp, chunk);
          return;
        }
      }
    }

    // 2. Check Berry Bush in front
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
