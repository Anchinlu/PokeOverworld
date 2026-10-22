import { Camera, InputManager, WorldClock } from '../core';
import { Player, Follower } from '../entities';
import { ChunkManager, createTerrainField, type TerrainField } from '../maps';
import { resolveUnifiedWildlifeBattle, updateUnifiedWildlife } from '../wildlife/unified-runtime';
import type { GameRenderer } from '../rendering';
import type { BerryBushEntity, WildPokemonEntity, WorldChunk } from '../maps/chunk';
import { interactWithBerryBush } from '../ui/berry-panel';
import { sampleEcology, getEcologyZone } from '../maps/ecology';
import {
  BattleScreen,
  createBattler,
  getBattleEnvironment,
  type BattlerPokemon,
  type BattleEnvironment,
  type BattleEnvPresetId,
} from '../battle';
import { getPresetConfig } from '../battle/battle-environment-presets';
import { showBerryToast } from '../ui/toast';
import { checkPartyEvolutionNotifications } from '../ui/evolution-notification';
import { playEncounterTransition } from '../ui/encounter-transition';
import { battleBgmPlayer, battleSePlayer, overworldShinyAudio } from '../audio';
import {
  partyService,
  playerService,
  partyPokemonToBattler,
  createPartyPokemon,
  pcStorageService,
  autosaveCoordinator,
  getHighestOwnedPokemonLevel,
} from '../domain';
import { defaultRng } from '../core/rng';
import type {
  Direction,
  AmbientLightProfile,
  DayPhase,
  WorldClockConfig,
} from '@pokemon/shared-types';
import { TILE_SIZE, TERRAIN } from '@pokemon/game-data';
import { getDayPhase, getAmbientLightProfile, getOverworldWeather, type OverworldWeather } from '../world';
import { checkAABB, getCharacterHitbox } from '../systems/collision';
import { getWildSpriteAabb } from '../wildlife/behavior/movement/wild-hitbox';

export class GameSession {
  public seed: number;
  public field: TerrainField;
  public camera: Camera;
  public input: InputManager;
  public chunkManager: ChunkManager;
  public player: Player;
  public follower: Follower;
  public readonly worldClock: WorldClock;
  public isBattling = false;
  private lastBattleEndTime = 0;
  private partyUnsubscribe?: () => void;

  public getWildlifeDebugStats(): {
    total: number;
    active: number;
    sparse: number;
    frozen: number;
    moving: number;
    overlappingTiles: number;
  } {
    const entities = this.chunkManager.simulationChunks.flatMap((chunk) => chunk.wildPokemon);
    const seen = new Set<string>();
    const tileCounts = new Map<string, number>();
    let active = 0;
    let sparse = 0;
    let frozen = 0;
    let moving = 0;
    for (const entity of entities) {
      const entityKey =
        entity.id ?? `${entity.chunkCx}:${entity.chunkCy}:${entity.gx}:${entity.gy}`;
      if (seen.has(entityKey)) continue;
      seen.add(entityKey);

      const distance = Math.hypot(entity.gx - this.player.gx, entity.gy - this.player.gy);
      if (distance > 35) frozen++;
      else if (distance > 16) sparse++;
      else active++;
      if (entity.isMoving) moving++;

      const tileKey = `${entity.gx},${entity.gy}`;
      tileCounts.set(tileKey, (tileCounts.get(tileKey) ?? 0) + 1);
    }
    let overlappingTiles = 0;
    for (const count of tileCounts.values()) {
      if (count > 1) overlappingTiles += count - 1;
    }
    return {
      total: seen.size,
      active,
      sparse,
      frozen,
      moving,
      overlappingTiles,
    };
  }

  constructor(
    initialSeed = 101,
    version = 2,
    clockOptions?: {
      initialMinutes?: number;
      initialDay?: number;
      clockConfig?: Partial<WorldClockConfig>;
    }
  ) {
    this.seed = initialSeed;
    this.field = createTerrainField(version, this.seed);
    this.camera = new Camera(0, 0);
    this.input = new InputManager();
    this.worldClock = new WorldClock(
      clockOptions?.initialMinutes,
      clockOptions?.initialDay ?? 1,
      clockOptions?.clockConfig
    );
    this.chunkManager = new ChunkManager(
      this.field,
      () => getHighestOwnedPokemonLevel(partyService.getParty(), pcStorageService.getBoxes()),
      () => getDayPhase(this.worldClock.getMinutes()),
      () => getOverworldWeather(this.seed, this.worldClock.getDay(), this.worldClock.getMinutes())
    );

    const savedPos = playerService.getProfile().position;
    const hasSavedPos = Boolean(savedPos && (savedPos.gx !== 0 || savedPos.gy !== 0));
    const spawn = this.field.getSpawn();
    const initGX = hasSavedPos ? savedPos.gx : spawn.gx;
    const initGY = hasSavedPos ? savedPos.gy : spawn.gy;
    const initDir = (hasSavedPos ? (savedPos.direction ?? 0) : 0) as Direction;

    this.player = new Player(initGX, initGY, initDir);
    this.follower = new Follower(initGX, initGY - 1, initDir);
    this.camera.snapTo(this.player);

    // Keep overworld follower synchronized with party state changes (e.g., evolution)
    this.syncFollowerFromParty();
    this.partyUnsubscribe = partyService.subscribe(() => {
      this.syncFollowerFromParty();
    });

    // Provide active battle watchdog and dynamic world data provider
    autosaveCoordinator.setBattlingProvider(() => this.isBattling);
    autosaveCoordinator.setWorldDataProvider(() => ({
      seed: this.seed,
      worldGenVersion: this.field.version,
      worldTimeMinutes: this.worldClock.getMinutes(),
      worldDay: this.worldClock.getDay(),
      lastWorldTimestamp: Date.now(),
      position: {
        gx: this.player.gx,
        gy: this.player.gy,
        direction: this.player.direction,
      },
      startTown:
        this.field.version >= 2
          ? {
              name: 'Twinleaf Hamlet',
              gx: 0,
              gy: 0,
              tier: 0,
            }
          : undefined,
    }));
  }

  /**
   * Synchronizes the overworld follower with the designated active party follower or leader.
   * If a Pokémon evolves, this instantly updates its overworld sprite sheet, shiny sparkles, and nickname.
   */
  public syncFollowerFromParty(): void {
    const activeFollower = partyService.getActiveFollower() || partyService.getLeader();
    if (!activeFollower) return;

    const targetSpecies = activeFollower.speciesKey.toUpperCase();
    const targetShiny = !!activeFollower.isShiny;
    const targetNickname = activeFollower.nickname || activeFollower.name;

    if (
      this.follower.speciesKey !== targetSpecies ||
      this.follower.isShiny !== targetShiny ||
      this.follower.nickname !== targetNickname
    ) {
      this.follower.setPokemon(targetSpecies, targetShiny, targetNickname);
    }
    this.follower.visible = true;
  }

  public update(dtScale: number, collisionEnabled = true): { pChunkX: number; pChunkY: number } {
    if (this.isBattling) {
      this.worldClock.pause('battle');
      return {
        pChunkX: Math.floor(this.player.gx / 16),
        pChunkY: Math.floor(this.player.gy / 16),
      };
    }
    this.worldClock.resume('battle');

    // 0. Advance world time (1 dtScale ~ 16.666ms at 60 FPS)
    const dtMs = dtScale * (1000 / 60);
    this.worldClock.advance(dtMs);

    const isRunning = this.input.isRunning();

    // 1. Update chunks around player
    const { pChunkX, pChunkY } = this.chunkManager.update(this.player.x, this.player.y, {
      progressive: true,
    });

    // 2. Process movement or cliff jumping if player is idle on grid
    if (!this.player.isMoving) {
      const requestedDir = this.input.getRequestedDirection();
      const jumpRequested = this.input.consumeJumpRequest() || this.input.isJumpPressed();

      if (requestedDir !== null) {
        let nextGX = this.player.gx;
        let nextGY = this.player.gy;

        if (requestedDir === 0) nextGY += 1;
        else if (requestedDir === 1) nextGX -= 1;
        else if (requestedDir === 2) nextGX += 1;
        else if (requestedDir === 3) nextGY -= 1;

        const currentTile = this.chunkManager.getTileData(this.player.gx, this.player.gy);
        const targetTile = this.chunkManager.getTileData(nextGX, nextGY);
        const isCurrentHill = currentTile.terrain === TERRAIN.HILL;
        const isTargetHill = targetTile.terrain === TERRAIN.HILL;

        if (!isCurrentHill && isTargetHill) {
          // Jumping UP onto cliff ledge
          if (
            jumpRequested &&
            (!collisionEnabled || this.chunkManager.canJumpOntoCliff(nextGX, nextGY))
          ) {
            this.player.startJump(nextGX, nextGY, requestedDir, 'jump_up');
            battleSePlayer.playSound('Audio/SE/Battle jump to ball.ogg', 0.85);

            const fFromHill =
              this.chunkManager.getTileData(this.follower.gx, this.follower.gy).terrain ===
              TERRAIN.HILL;
            const followerJump =
              !fFromHill && isCurrentHill
                ? 'jump_up'
                : fFromHill && !isCurrentHill
                  ? 'drop_down'
                  : null;
            this.follower.startFollow(
              this.player.fromGX,
              this.player.fromGY,
              nextGX,
              nextGY,
              this.player.stepCount,
              followerJump
            );
          } else {
            this.player.setBlocked(requestedDir);
          }
        } else if (isCurrentHill && !isTargetHill) {
          // Stepping / dropping DOWN off cliff
          const canDrop =
            !collisionEnabled ||
            this.chunkManager.isWalkable(nextGX, nextGY, this.player.gx, this.player.gy);
          if (canDrop) {
            this.player.startJump(nextGX, nextGY, requestedDir, 'drop_down');
            battleSePlayer.playSound('Audio/SE/Battle jump to ball.ogg', 0.75);

            const fFromHill =
              this.chunkManager.getTileData(this.follower.gx, this.follower.gy).terrain ===
              TERRAIN.HILL;
            const followerJump =
              !fFromHill && isCurrentHill
                ? 'jump_up'
                : fFromHill && !isCurrentHill
                  ? 'drop_down'
                  : null;
            this.follower.startFollow(
              this.player.fromGX,
              this.player.fromGY,
              nextGX,
              nextGY,
              this.player.stepCount,
              followerJump
            );
          } else {
            this.player.setBlocked(requestedDir);
          }
        } else {
          // Standard walking (flat-to-flat or plateau-to-plateau)
          const canMove =
            !collisionEnabled ||
            this.chunkManager.isWalkable(nextGX, nextGY, this.player.gx, this.player.gy);
          if (canMove) {
            this.player.startStep(nextGX, nextGY, requestedDir);

            const fFromHill =
              this.chunkManager.getTileData(this.follower.gx, this.follower.gy).terrain ===
              TERRAIN.HILL;
            const followerJump =
              !fFromHill && isCurrentHill
                ? 'jump_up'
                : fFromHill && !isCurrentHill
                  ? 'drop_down'
                  : null;
            this.follower.startFollow(
              this.player.fromGX,
              this.player.fromGY,
              nextGX,
              nextGY,
              this.player.stepCount,
              followerJump
            );
          } else {
            this.player.setBlocked(requestedDir);
          }
        }
      } else if (jumpRequested) {
        // Space pressed while stationary without directional arrow: jump/drop in facing direction
        const facingDir = this.player.direction;
        let frontGX = this.player.gx;
        let frontGY = this.player.gy;
        if (facingDir === 0) frontGY += 1;
        else if (facingDir === 1) frontGX -= 1;
        else if (facingDir === 2) frontGX += 1;
        else if (facingDir === 3) frontGY -= 1;

        const currentTile = this.chunkManager.getTileData(this.player.gx, this.player.gy);
        const frontTile = this.chunkManager.getTileData(frontGX, frontGY);
        const isCurrentHill = currentTile.terrain === TERRAIN.HILL;
        const isFrontHill = frontTile.terrain === TERRAIN.HILL;

        if (!isCurrentHill && isFrontHill) {
          if (!collisionEnabled || this.chunkManager.canJumpOntoCliff(frontGX, frontGY)) {
            this.player.startJump(frontGX, frontGY, facingDir, 'jump_up');
            battleSePlayer.playSound('Audio/SE/Battle jump to ball.ogg', 0.85);

            const fFromHill =
              this.chunkManager.getTileData(this.follower.gx, this.follower.gy).terrain ===
              TERRAIN.HILL;
            const followerJump =
              !fFromHill && isCurrentHill
                ? 'jump_up'
                : fFromHill && !isCurrentHill
                  ? 'drop_down'
                  : null;
            this.follower.startFollow(
              this.player.fromGX,
              this.player.fromGY,
              frontGX,
              frontGY,
              this.player.stepCount,
              followerJump
            );
          }
        } else if (isCurrentHill && !isFrontHill) {
          if (
            !collisionEnabled ||
            this.chunkManager.isWalkable(frontGX, frontGY, this.player.gx, this.player.gy)
          ) {
            this.player.startJump(frontGX, frontGY, facingDir, 'drop_down');
            battleSePlayer.playSound('Audio/SE/Battle jump to ball.ogg', 0.75);

            const fFromHill =
              this.chunkManager.getTileData(this.follower.gx, this.follower.gy).terrain ===
              TERRAIN.HILL;
            const followerJump =
              !fFromHill && isCurrentHill
                ? 'jump_up'
                : fFromHill && !isCurrentHill
                  ? 'drop_down'
                  : null;
            this.follower.startFollow(
              this.player.fromGX,
              this.player.fromGY,
              frontGX,
              frontGY,
              this.player.stepCount,
              followerJump
            );
          }
        }
      } else {
        this.player.setIdle();
      }
    }

    // 3. Advance player and follower step progress
    const wasJumping = this.player.isJumping;
    const stepCompleted = this.player.update(dtScale, isRunning);
    if (this.follower.isMoving) {
      this.follower.updateSync(this.player.stepProgress);
    } else {
      this.follower.updateIdle(dtScale);
    }
    if (stepCompleted) {
      if (wasJumping) {
        battleSePlayer.playSound('Audio/SE/Battle ball drop.ogg', 0.8);
      }
      this.follower.completeStep();
      const fTile = this.chunkManager.getTileData(this.follower.gx, this.follower.gy);
      const isOcean = fTile.terrain === TERRAIN.OCEAN_WATER;
      const isShore = isOcean && fTile.tileId >= 731 && fTile.tileId <= 742;
      this.follower.isSwimming =
        (isOcean && !isShore) || (fTile.tileId >= 700 && fTile.tileId < 730);
      playerService.updatePosition(this.player.gx, this.player.gy, this.player.direction);

      // Check encounter collision when step completes
      if (Date.now() - this.lastBattleEndTime > 1500) {
        this.checkWildPokemonCollision();
      }
    }

    // 4. Camera follows player
    this.camera.update(this.player, dtScale);

    // 5. Wild Pokémon AI
    updateUnifiedWildlife(
      this.chunkManager,
      this.player,
      dtScale,
      this.getDayPhase(),
      getOverworldWeather(this.seed, this.worldClock.getDay(), this.worldClock.getMinutes()),
      getHighestOwnedPokemonLevel(partyService.getParty(), pcStorageService.getBoxes())
    );

    // 6. Overworld Shiny Pokémon Spatial Audio (3x3 chunk detection & distance scaling)
    overworldShinyAudio.update(
      this.player.gx,
      this.player.gy,
      pChunkX,
      pChunkY,
      this.chunkManager.simulationChunks,
      this.isBattling
    );

    return { pChunkX, pChunkY };
  }

  private checkWildPokemonCollision(): void {
    for (const chunk of this.getEncounterChunks()) {
      if (!chunk.wildPokemon) continue;
      for (const wp of chunk.wildPokemon) {
        if (this.isPlayerTouchingWild(wp)) {
          this.startWildBattle(wp, chunk);
          return;
        }
      }
    }
  }

  /** Returns loaded wildlife chunks without duplicating active/simulation chunks. */
  private getEncounterChunks(): WorldChunk[] {
    const chunks = new Map<string, WorldChunk>();
    for (const chunk of [
      ...this.chunkManager.activeChunks,
      ...this.chunkManager.simulationChunks,
    ]) {
      chunks.set(`${chunk.cx},${chunk.cy}`, chunk);
    }
    return [...chunks.values()];
  }

  /** Uses the rendered sprite footprint for contact detection. */
  private isPlayerTouchingWild(wp: WildPokemonEntity): boolean {
    const playerBox = getCharacterHitbox(this.player.x, this.player.y);
    const wildAabb = getWildSpriteAabb(wp);
    return checkAABB(playerBox, {
      x: wildAabb.left * TILE_SIZE,
      y: wildAabb.top * TILE_SIZE,
      w: (wildAabb.right - wildAabb.left) * TILE_SIZE,
      h: (wildAabb.bottom - wildAabb.top) * TILE_SIZE,
    });
  }

  public startWildBattle(
    wp: Pick<WildPokemonEntity, 'gx' | 'gy' | 'speciesKey' | 'level'> & Partial<WildPokemonEntity>,
    chunk?: WorldChunk,
    overlayOverride?: string,
    weatherOverride?: string,
    envPresetOverride?: string
  ): void {
    if (this.isBattling) return;
    this.isBattling = true;
    this.worldClock.pause('battle');
    autosaveCoordinator.lockBattle();

    // Freeze player movement immediately
    this.player.isMoving = false;

    // Start wild battle BGM immediately upon encounter
    battleBgmPlayer.playWildBattleBgm();

    // Play Iris Pokéball Encounter Transition with Screen Shake
    playEncounterTransition({
      onComplete: () => {
        const sample = sampleEcology(wp.gx, wp.gy, this.field);
        const zone = getEcologyZone(sample);
        const nearWater = this.field.isNearWater(wp.gx, wp.gy, 1);
        const inTallGrass =
          chunk?.tallGrass?.some(
            (tg) =>
              (tg.gx === wp.gx && tg.gy === wp.gy) ||
              (tg.gx === this.player.gx && tg.gy === this.player.gy)
          ) ?? false;
        const env = getBattleEnvironment(zone, nearWater, inTallGrass);
        if (envPresetOverride && envPresetOverride !== 'auto') {
          const cfg = getPresetConfig(envPresetOverride as BattleEnvPresetId);
          env.preset = cfg.id;
          env.background = cfg.background;
          env.enemyBase = cfg.enemyBase;
          env.playerBase = cfg.playerBase;
        }
        if (overlayOverride && overlayOverride !== 'auto') {
          env.foregroundOverlay = overlayOverride;
        }
        if (weatherOverride && weatherOverride !== 'none') {
          env.weather = {
            type: weatherOverride as NonNullable<BattleEnvironment['weather']>['type'],
            turnsLeft: 5,
          };
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
          try {
            this.isBattling = false;
            this.worldClock.resume('battle');
            this.lastBattleEndTime = Date.now();

            // Sync battle HP, PP, and EXP back into party
            const finalBattler = result.activePlayerPokemon ?? playerBattler;
            const expGained = result.outcome === 'victory' ? (result.expGained ?? 0) : 0;
            const syncResult = partyService.syncBattleResult(finalBattler, expGained);
            if (syncResult.leveledUp) {
              showBerryToast(
                `🎉 ${finalBattler.name} đã lên cấp ${syncResult.newLevel}! Toàn bộ chỉ số chiến đấu đã tăng!`,
                '#22c55e'
              );
              checkPartyEvolutionNotifications();
            }

            if (syncResult.expShares && syncResult.expShares.length > 0) {
              for (const share of syncResult.expShares) {
                if (share.leveledUp) {
                  showBerryToast(
                    `🎉 (Exp. Share) ${share.pokemon.name} đã nhận ${share.expGained} EXP và lên cấp ${share.newLevel}!`,
                    '#3b82f6'
                  );
                } else {
                  showBerryToast(
                    `✨ (Exp. Share) ${share.pokemon.name} nhận được +${share.expGained} EXP!`,
                    '#60a5fa'
                  );
                }
              }
              checkPartyEvolutionNotifications();
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
              if (syncResult.leveledUp) {
                showBerryToast(
                  `⚔️ Chiến thắng! ${playerBattler.name} đã lên cấp ${syncResult.newLevel}!`,
                  '#facc15'
                );
              } else {
                showBerryToast(
                  `⚔️ Đã đánh bại ${wildBattler.name}! (+${expGained} EXP)`,
                  '#38bdf8'
                );
              }
            } else if (result.outcome === 'defeated') {
              showBerryToast(`💥 ${playerBattler.name} đã ngất xỉu!`, '#ef4444');
            }

            if (result.outcome === 'caught' || result.outcome === 'victory') {
              const entId = (wp as WildPokemonEntity).id ?? `${wp.gx},${wp.gy}`;
              resolveUnifiedWildlifeBattle(
                this.chunkManager,
                entId,
                result.outcome === 'caught' ? 'caught' : 'defeated'
              );

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
          } catch (err) {
            console.error('[GameSession] Error finalizing wild battle outcome:', err);
          } finally {
            this.worldClock.resume('battle');
            // Conclude battle: always unlock autosave and flush post-battle progress safely
            autosaveCoordinator.unlockBattle();
          }
        });
      },
    });
  }

  public startTestBattle(
    overlayOverride?: string,
    isEnemyShiny = false,
    weatherOverride?: string,
    envPresetOverride?: string
  ): void {
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
    this.startWildBattle(mockWp, chunk, overlayOverride, weatherOverride, envPresetOverride);
  }

  public startCustomBattle(
    customBattler: BattlerPokemon,
    overlayOverride?: string,
    weatherOverride?: string,
    envPresetOverride?: string
  ): void {
    if (this.isBattling) return;
    this.isBattling = true;
    this.worldClock.pause('battle');
    autosaveCoordinator.lockBattle();

    // Freeze player movement immediately
    this.player.isMoving = false;

    // Start wild battle BGM immediately upon encounter
    battleBgmPlayer.playWildBattleBgm();

    // Play Iris Pokéball Encounter Transition with Screen Shake
    playEncounterTransition({
      onComplete: () => {
        const sample = sampleEcology(this.player.gx, this.player.gy, this.field);
        const zone = getEcologyZone(sample);
        const nearWater = this.field.isNearWater(this.player.gx, this.player.gy, 1);
        const env = getBattleEnvironment(zone, nearWater, false);
        if (envPresetOverride && envPresetOverride !== 'auto') {
          const cfg = getPresetConfig(envPresetOverride as BattleEnvPresetId);
          env.preset = cfg.id;
          env.background = cfg.background;
          env.enemyBase = cfg.enemyBase;
          env.playerBase = cfg.playerBase;
        }
        if (overlayOverride && overlayOverride !== 'auto') {
          env.foregroundOverlay = overlayOverride;
        }
        if (weatherOverride && weatherOverride !== 'none') {
          env.weather = {
            type: weatherOverride as NonNullable<BattleEnvironment['weather']>['type'],
            turnsLeft: 5,
          };
        }

        // 1. Get first alive Pokémon in Party
        let activePk = partyService.getFirstAlivePokemon();
        if (!activePk) {
          partyService.healAll();
          activePk = partyService.getLeader()!;
          showBerryToast('Đội hình đã được hồi phục để sẵn sàng chiến đấu!', '#38bdf8');
        }

        const playerBattler = partyPokemonToBattler(activePk);

        new BattleScreen(
          playerBattler,
          customBattler,
          env,
          (result) => {
            try {
              this.isBattling = false;
              this.worldClock.resume('battle');
              this.lastBattleEndTime = Date.now();

              // Sync battle HP, PP, and EXP back into party
              const finalBattler = result.activePlayerPokemon ?? playerBattler;
              const expGained = result.outcome === 'victory' ? (result.expGained ?? 0) : 0;
              const syncResult = partyService.syncBattleResult(finalBattler, expGained);
              if (syncResult.leveledUp) {
                showBerryToast(
                  `🎉 ${finalBattler.name} đã lên cấp ${syncResult.newLevel}! Toàn bộ chỉ số chiến đấu đã tăng!`,
                  '#22c55e'
                );
                checkPartyEvolutionNotifications();
              }

              if (syncResult.expShares && syncResult.expShares.length > 0) {
                for (const share of syncResult.expShares) {
                  if (share.leveledUp) {
                    showBerryToast(
                      `🎉 (Exp. Share) ${share.pokemon.name} đã nhận ${share.expGained} EXP và lên cấp ${share.newLevel}!`,
                      '#3b82f6'
                    );
                  } else {
                    showBerryToast(
                      `✨ (Exp. Share) ${share.pokemon.name} nhận được +${share.expGained} EXP!`,
                      '#60a5fa'
                    );
                  }
                }
                checkPartyEvolutionNotifications();
              }

              if (result.outcome === 'caught') {
                const caughtPk = createPartyPokemon(customBattler.speciesKey, customBattler.level, {
                  isShiny: customBattler.isShiny,
                  ivs: customBattler.ivs,
                  nature: customBattler.nature,
                });
                caughtPk.currentHp = Math.max(1, customBattler.currentHp);
                playerService.incrementCaught();

                if (!partyService.isPartyFull()) {
                  partyService.addPokemon(caughtPk);
                  showBerryToast(
                    `🎉 Đã thu phục thành công ${customBattler.name} và thêm vào Đội hình (${partyService.getPartySize()}/6)!`,
                    '#22c55e'
                  );
                } else {
                  const depositRes = pcStorageService.depositPokemon(caughtPk);
                  if (depositRes.success) {
                    showBerryToast(
                      `🎉 Đã thu phục thành công ${customBattler.name}! Đã chuyển vào PC (${depositRes.boxName})!`,
                      '#38bdf8'
                    );
                  } else {
                    showBerryToast(
                      `⚠️ Không thể lưu ${customBattler.name} vì PC đã đầy!`,
                      '#ef4444'
                    );
                  }
                }
              } else if (result.outcome === 'victory') {
                showBerryToast(
                  `⚔️ Đã đánh bại Bot ${customBattler.name}! (+${expGained} EXP)`,
                  '#38bdf8'
                );
              } else if (result.outcome === 'defeated') {
                showBerryToast(`💥 ${playerBattler.name} đã ngất xỉu!`, '#ef4444');
              }
            } catch (err) {
              console.error('[GameSession] Error finalizing custom battle outcome:', err);
            } finally {
              this.worldClock.resume('battle');
              // Conclude custom battle: always unlock autosave and flush post-battle progress safely
              autosaveCoordinator.unlockBattle();
            }
          },
          false
        );
      },
    });
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

  public regenerate(seed?: number, version = this.field.version): void {
    if (seed !== undefined) {
      this.seed = seed;
    }
    this.field = createTerrainField(version, this.seed);
    this.chunkManager.reset(this.field);
    this.resetPlayer();
    playerService.updatePosition(this.player.gx, this.player.gy, this.player.direction);
    autosaveCoordinator.flushImmediate('regenerate_map');
  }

  public resetPlayer(): void {
    const spawn = this.field.getSpawn();
    this.player.snapTo(spawn.gx, spawn.gy);
    this.follower.snapTo(spawn.gx, spawn.gy - 1);
    this.camera.snapTo(this.player);
    this.chunkManager.update(this.player.x, this.player.y);
  }

  /** Releases long-lived subscriptions when the overworld session is closed. */
  public destroy(): void {
    this.partyUnsubscribe?.();
    this.partyUnsubscribe = undefined;
    this.input.destroy();
  }

  public getAmbientLight(): AmbientLightProfile {
    const isDesert = Boolean(this.chunkManager.field?.isDesert?.(this.player.gx, this.player.gy));
    const weather = this.getWeather();
    // In desert, rain/thunderstorm weather does not apply cold rain gloom to ambient light
    const effectiveWeather =
      isDesert && (weather === 'rain' || weather === 'heavy_rain' || weather === 'thunderstorm')
        ? 'clear'
        : weather;
    return getAmbientLightProfile(this.worldClock.getExactMinutes(), effectiveWeather);
  }

  public getDayPhase(): DayPhase {
    return getDayPhase(this.worldClock.getMinutes());
  }

  private weatherOverride: OverworldWeather | null = null;

  public setWeatherOverride(weather: OverworldWeather | null): void {
    this.weatherOverride = weather;
  }

  public getWeather(): OverworldWeather {
    if (this.weatherOverride) {
      return this.weatherOverride;
    }
    return getOverworldWeather(this.seed, this.worldClock.getDay(), this.worldClock.getMinutes());
  }

  public interactAt(worldGX: number, worldGY: number, renderer: GameRenderer): void {
    if (this.isBattling) return;

    // 1. Check Wild Pokémon click
    for (const chunk of this.getEncounterChunks()) {
      if (!chunk.wildPokemon) continue;
      for (const wp of chunk.wildPokemon) {
        if (Math.abs(wp.gx - worldGX) <= 1 && Math.abs(wp.gy - worldGY) <= 1) {
          this.startWildBattle(wp, chunk);
          return;
        }
      }
    }

    // 2. Check Berry Bushes
    for (const chunk of this.getEncounterChunks()) {
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
    for (const chunk of this.getEncounterChunks()) {
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
