import { Camera, InputManager } from '../core';
import { Player, Follower } from '../entities';
import { ChunkManager, getRoadCenterX } from '../maps';
import { updateWildPokemon } from '../ai';
import type { GameRenderer } from '../rendering';
import type { BerryBushEntity, WildPokemonEntity, WorldChunk } from '../maps/chunk';
import { interactWithBerryBush } from '../ui/berry-panel';
import { sampleEcology, getEcologyZone } from '../maps/ecology';
import { isNearWater } from '../maps/terrain-rules';
import { BattleScreen, createBattler, getBattleEnvironment } from '../battle';
import { showBerryToast } from '../ui/toast';
import { playEncounterTransition } from '../ui/encounter-transition';
import { battleBgmPlayer, overworldShinyAudio } from '../audio';
import {
  partyService,
  playerService,
  partyPokemonToBattler,
  createPartyPokemon,
  pcStorageService,
} from '../domain';
import { defaultRng } from '../core/rng';

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

    // 6. Overworld Shiny Pokémon Spatial Audio (3x3 chunk detection & distance scaling)
    overworldShinyAudio.update(
      this.player.gx,
      this.player.gy,
      pChunkX,
      pChunkY,
      this.chunkManager.activeChunks,
      this.isBattling
    );

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

  public startWildBattle(
    wp: Pick<WildPokemonEntity, 'gx' | 'gy' | 'speciesKey' | 'level'> & Partial<WildPokemonEntity>,
    chunk?: WorldChunk,
    overlayOverride?: string
  ): void {
    if (this.isBattling) return;
    this.isBattling = true;

    // Freeze player movement immediately
    this.player.isMoving = false;

    // Start wild battle BGM immediately upon encounter
    battleBgmPlayer.playWildBattleBgm();

    // Play Iris Pokéball Encounter Transition with Screen Shake
    playEncounterTransition({
      onComplete: () => {
        const sample = sampleEcology(wp.gx, wp.gy, this.seed);
        const zone = getEcologyZone(sample);
        const nearWater = isNearWater(wp.gx, wp.gy, this.seed, 1);
        const inTallGrass =
          chunk?.tallGrass?.some(
            (tg) =>
              (tg.gx === wp.gx && tg.gy === wp.gy) ||
              (tg.gx === this.player.gx && tg.gy === this.player.gy)
          ) ?? false;
        const env = getBattleEnvironment(zone, nearWater, inTallGrass);
        if (overlayOverride && overlayOverride !== 'auto') {
          env.foregroundOverlay = overlayOverride;
        }

        // 1. Get first alive Pokémon in Party
        let activePk = partyService.getFirstAlivePokemon();
        if (!activePk) {
          partyService.healAll();
          activePk = partyService.getLeader()!;
          showBerryToast('Đội hình đã được hồi phục để sẵn sàng chiến đấu!', '#38bdf8');
        }

        const playerBattler = partyPokemonToBattler(activePk);
        const wildBattler = createBattler(
          wp.speciesKey,
          wp.level,
          false,
          undefined,
          wp.isShiny ?? false
        );

        new BattleScreen(playerBattler, wildBattler, env, (result) => {
          this.isBattling = false;
          this.lastBattleEndTime = Date.now();

          // Sync battle HP, PP, and EXP back into party
          const finalBattler = result.activePlayerPokemon ?? playerBattler;
          const expGained = result.outcome === 'victory' ? (result.expGained ?? 0) : 0;
          const { leveledUp, newLevel } = partyService.syncBattleResult(finalBattler, expGained);
          if (leveledUp) {
            showBerryToast(
              `🎉 ${finalBattler.name} đã lên cấp ${newLevel}! Toàn bộ chỉ số chiến đấu đã tăng!`,
              '#22c55e'
            );
          }

          if (result.outcome === 'caught') {
            const caughtPk = createPartyPokemon(wildBattler.speciesKey, wildBattler.level, {
              isShiny: wildBattler.isShiny,
              ivs: wildBattler.ivs,
              nature: wildBattler.nature,
            });
            caughtPk.currentHp = Math.max(1, wildBattler.currentHp);
            playerService.incrementCaught();

            if (!partyService.isPartyFull()) {
              partyService.addPokemon(caughtPk);
              showBerryToast(
                `🎉 Đã thu phục thành công ${wildBattler.name} và thêm vào Đội hình (${partyService.getPartySize()}/6)!`,
                '#22c55e'
              );
            } else {
              const depositRes = pcStorageService.depositPokemon(caughtPk);
              if (depositRes.success) {
                showBerryToast(
                  `🎉 Đã thu phục thành công ${wildBattler.name}! Đội hình đã đầy (6/6), đã chuyển vào PC (${depositRes.boxName})!`,
                  '#38bdf8'
                );
              } else {
                showBerryToast(
                  `⚠️ Đội hình và toàn bộ Hộp PC đều đã đầy! Không thể chứa thêm ${wildBattler.name}!`,
                  '#ef4444'
                );
              }
            }
          } else if (result.outcome === 'victory') {
            if (leveledUp) {
              showBerryToast(
                `⚔️ Chiến thắng! ${playerBattler.name} đã lên cấp ${newLevel}!`,
                '#facc15'
              );
            } else {
              showBerryToast(`⚔️ Đã đánh bại ${wildBattler.name}! (+${expGained} EXP)`, '#38bdf8');
            }
          } else if (result.outcome === 'defeated') {
            showBerryToast(`💥 ${playerBattler.name} đã ngất xỉu!`, '#ef4444');
          }

          if (result.outcome === 'caught' || result.outcome === 'victory') {
            if (chunk && chunk.wildPokemon) {
              const idx = chunk.wildPokemon.findIndex(
                (p) =>
                  p === (wp as unknown) ||
                  (p.gx === wp.gx && p.gy === wp.gy && p.speciesKey === wp.speciesKey)
              );
              if (idx !== -1) {
                chunk.wildPokemon.splice(idx, 1);
              }
            }
          }
        });
      },
    });
  }

  public startTestBattle(overlayOverride?: string, isEnemyShiny = false): void {
    const testRoster = [
      'PIDGEY',
      'RATTATA',
      'CATERPIE',
      'SPEAROW',
      'BULBASAUR',
      'CHARMANDER',
      'SQUIRTLE',
    ];
    const randomSpecies = defaultRng.choice(testRoster);
    const mockWp: Pick<WildPokemonEntity, 'gx' | 'gy' | 'speciesKey' | 'level'> &
      Partial<WildPokemonEntity> = {
      gx: this.player.gx,
      gy: this.player.gy,
      speciesKey: randomSpecies,
      level: defaultRng.nextInt(3, 6),
      isShiny: isEnemyShiny,
    };
    const chunk = this.chunkManager.getChunk(
      Math.floor(this.player.gx / 16),
      Math.floor(this.player.gy / 16)
    );
    this.startWildBattle(mockWp, chunk, overlayOverride);
  }

  public spawnTestShinyWild(speciesKey?: string): WildPokemonEntity | null {
    const pChunkX = Math.floor(this.player.gx / 16);
    const pChunkY = Math.floor(this.player.gy / 16);
    const chunk = this.chunkManager.getChunk(pChunkX, pChunkY);
    if (!chunk) return null;

    if (!chunk.wildPokemon) {
      chunk.wildPokemon = [];
    }

    const testSpecies =
      speciesKey ||
      defaultRng.choice([
        'CHARIZARD',
        'PIKACHU',
        'EEVEE',
        'DRAGONITE',
        'GENGAR',
        'GYARADOS',
        'BULBASAUR',
        'NINETALES',
      ]);

    // Position 2-3 tiles away from player for clear visibility
    const offsets = [
      { dx: 2, dy: 1 },
      { dx: -2, dy: 1 },
      { dx: 1, dy: 2 },
      { dx: -1, dy: -2 },
      { dx: 3, dy: 0 },
    ];
    const offset = defaultRng.choice(offsets);
    const gx = this.player.gx + offset.dx;
    const gy = this.player.gy + offset.dy;
    const px = gx * 32 - 16;
    const py = gy * 32 - 32;

    const shinyWp: WildPokemonEntity = {
      gx,
      gy,
      x: px,
      y: py,
      speciesKey: testSpecies,
      name: testSpecies,
      level: defaultRng.nextInt(15, 35),
      isShiny: true,
      behavior: 'idle',
      dir: 0,
      homeGX: gx,
      homeGY: gy,
      wanderRadius: 4,
      state: 'idle',
      isMoving: false,
      fromX: px,
      fromY: py,
      targetGX: gx,
      targetGY: gy,
      targetX: px,
      targetY: py,
      stepProgress: 0,
      moveSpeed: 1.6,
      stepsRemaining: 0,
      currentDir: 0,
      lastMoveTime: 0,
      idleTimer: 3000,
      frame: 0,
      emote: null,
      seed: this.seed,
      chunkCx: pChunkX,
      chunkCy: pChunkY,
    };

    chunk.wildPokemon.push(shinyWp);
    return shinyWp;
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
