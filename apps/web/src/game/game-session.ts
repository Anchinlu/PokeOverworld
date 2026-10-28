import { Camera, InputManager, WorldClock } from '../core';
import { Player, Follower } from '../entities';
import { ChunkManager, createTerrainField, type TerrainField } from '../maps';
import { resolveUnifiedWildlifeBattle, updateUnifiedWildlife } from '../wildlife/unified-runtime';
import type { GameRenderer } from '../rendering';
import type { BerryBushEntity, WildPokemonEntity, WorldChunk, VillageNPCEntity } from '../maps/chunk';
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
import {
  InteriorManager,
  InteriorRegistry,
  DoorPromptModal,
  playDoorTransition,
  type OverworldReturnCoords,
} from '../interior';
import {
  createNPCRuntimeState,
  updateNPCBehavior,
  triggerNPCEmote,
  resolveNPCDialogueBranch,
  executeNPCEventActions,
  resolveActiveScheduleRule,
  type NPCDialogueChoice,
  type NPCEventAction,
  type NPCTrainerProfile,
  type NPCTimeBand,
  type NPCEmoteType,
  palletPrologueEventManager,
} from '../npc';
import { storyManager, type StoryGamePort, route1SpearowEventManager } from '../story';
import { autoWalkNavigator } from '../ui/quest-tracker';

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
  public isInputLocked = false;
  private lastBattleEndTime = 0;
  /** Tracks whether loaded chunks were purged for `story_wild_spawns_suppressed`. */
  private storyWildlifePurged = false;
  private partyUnsubscribe?: () => void;
  public activeDialogue: {
    npc: VillageNPCEntity;
    lines: string[];
    lineIndex: number;
    choicesPrompt?: string;
    choices?: NPCDialogueChoice[];
    actionsOnComplete?: NPCEventAction[];
    choiceResolved?: boolean;
  } | null = null;
  private dialogueEl: HTMLDivElement | null = null;

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
      interior: InteriorManager.getInstance().getSaveState() ?? undefined,
    }));

    // Hook up interior room exit callback
    InteriorManager.getInstance().onExitRoomCallback = (coords: OverworldReturnCoords) => {
      this.exitInteriorToOverworld(coords);
    };

    // Bind GamePort to the central StoryManager
    storyManager.setGamePort(this.createStoryGamePort());
  }

  public enterOakLab(): void {
    playDoorTransition(() => {
      battleSePlayer.playSound('Audio/SE/Enter Door.ogg', 0.8);
      InteriorManager.getInstance().enterOakLab(
        {
          gx: this.player.gx,
          gy: this.player.gy,
          direction: this.player.direction,
        },
        this.follower
      );
    });
  }

  public enterInteriorRoom(roomId: string, _displayName?: string): void {
    const config = InteriorRegistry.getInstance().getRoom(roomId);
    if (!config) return;
    playDoorTransition(() => {
      battleSePlayer.playSound('Audio/SE/Enter Door.ogg', 0.8);
      InteriorManager.getInstance().enterRoom(
        config,
        {
          gx: this.player.gx,
          gy: this.player.gy,
          direction: this.player.direction,
        },
        this.follower
      );
    });
  }

  public exitInteriorToOverworld(coords: OverworldReturnCoords): void {
    playDoorTransition(() => {
      battleSePlayer.playSound('Audio/SE/Exit Door.ogg', 0.8);
      this.player.snapTo(coords.gx, coords.gy);
      this.player.direction = 0; // Facing south
      this.follower.snapTo(coords.gx, coords.gy - 1);
      this.camera.snapTo(this.player);

      // Trigger Scene 8 (Mom farewell & cheering crowd outside Lab) if Pokédex has been received
      if (
        playerService.hasFlag('pallet_lab_pokedex_received') &&
        !playerService.hasFlag('pallet_crowd_mom_farewell_done')
      ) {
        setTimeout(() => {
          palletPrologueEventManager.runScene8_MomFarewellAndCrowd(this);
        }, 400);
      }
    });
  }

  public checkNearbyDoors(): void {
    const registry = InteriorRegistry.getInstance();
    let nearbyMapping: { building: any; mapping: any } | null = null;

    for (const chunk of this.chunkManager.activeChunks) {
      if (!chunk.buildings) continue;
      for (const b of chunk.buildings) {
        const mapping = registry.getBuildingMapping(b.type);
        if (mapping) {
          const doorMinX = b.doorGX;
          const doorMaxX = b.doorGX + (b.doorWidthTiles || 1) - 1;
          const isAtDoorFront =
            this.player.gy === b.doorGY + 1 &&
            this.player.gx >= doorMinX &&
            this.player.gx <= doorMaxX;
          const isCloseToDoor =
            Math.abs(this.player.gx - (b.doorGX + 0.5)) <= 1.5 &&
            Math.abs(this.player.gy - (b.doorGY + 1)) <= 1.5;
          if (isAtDoorFront || (isCloseToDoor && this.player.direction === 3)) {
            nearbyMapping = { building: b, mapping };
            break;
          }
        }
      }
      if (nearbyMapping) break;
    }

    const doorModal = DoorPromptModal.getInstance();
    if (nearbyMapping) {
      if (!doorModal.isPromptOpen()) {
        const { mapping } = nearbyMapping;
        doorModal.showIndicator(mapping.displayName, {
          buildingName: mapping.displayName,
          onEnter: () => {
            this.enterInteriorRoom(mapping.roomId, mapping.displayName);
          },
        });
      }
    } else {
      doorModal.hideIndicator();
    }
  }

  /**
   * Synchronizes the overworld follower with the designated active party follower or leader.
   * If a Pokémon evolves, this instantly updates its overworld sprite sheet, shiny sparkles, and nickname.
   */
  public syncFollowerFromParty(): void {
    const activeFollower = partyService.getActiveFollower() || partyService.getLeader();
    if (!activeFollower) {
      this.follower.visible = false;
      return;
    }

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

    // Story events need an empty map: purge already-loaded wildlife instead of
    // merely freezing it, and repopulate once the event lifts the flag.
    this.syncStoryWildlifeSuppression();

    // Handle Interior Room update if inside
    const interior = InteriorManager.getInstance();
    if (interior.isInInterior()) {
      DoorPromptModal.getInstance().hideIndicator();
      const isCutsceneActive = palletPrologueEventManager.isActive() || storyManager.isRunning();
      if (palletPrologueEventManager.isActive()) {
        palletPrologueEventManager.update(dtScale);
      }
      const requestedDir =
        isCutsceneActive || this.isInputLocked ? null : this.input.getRequestedDirection();
      let dx = 0;
      let dy = 0;
      let isMoving = false;
      if (requestedDir !== null) {
        isMoving = true;
        if (requestedDir === 0) dy = 1;
        else if (requestedDir === 1) dx = -1;
        else if (requestedDir === 2) dx = 1;
        else if (requestedDir === 3) dy = -1;
      }
      interior.update({ dx, dy, isMoving }, dtScale, this.input.isRunning(), this.follower);
      return { pChunkX: 0, pChunkY: 0 };
    }

    // 0. Advance world time (1 dtScale ~ 16.666ms at 60 FPS)
    const dtMs = dtScale * (1000 / 60);
    this.worldClock.advance(dtMs);

    const isRunning = this.input.isRunning();

    // 1. Update chunks around player
    const { pChunkX, pChunkY } = this.chunkManager.update(this.player.x, this.player.y, {
      progressive: true,
    });

    // 1.5. Process Story System (StoryManager / Pallet Prologue Event)
    if (storyManager.isRunning()) {
      return { pChunkX, pChunkY };
    }
    if (palletPrologueEventManager.isActive()) {
      palletPrologueEventManager.update(dtScale);
      return { pChunkX, pChunkY };
    } else if (palletPrologueEventManager.shouldTrigger(this)) {
      palletPrologueEventManager.trigger(this);
      return { pChunkX, pChunkY };
    }

    // Act 2: Route 1 Spearow Event
    // During the chase phase the player must be able to run away, so input is
    // only locked for the scripted phases. A step already in progress is
    // allowed to finish so the player never freezes between two tiles.
    route1SpearowEventManager.update(dtScale, this);
    if (route1SpearowEventManager.isInputLocked() && !this.player.isMoving) {
      this.camera.update(this.player, dtScale);
      return { pChunkX, pChunkY };
    }

    // 2. Process movement or cliff jumping if player is idle on grid and no dialogue active
    if (!this.player.isMoving && !this.activeDialogue && !this.isInputLocked) {
      let requestedDir = this.input.getRequestedDirection();
      const jumpRequested = this.input.consumeJumpRequest() || this.input.isJumpPressed();

      if (requestedDir !== null) {
        // Player manual input cancels auto-walking
        if (autoWalkNavigator.isAutoWalking()) {
          autoWalkNavigator.cancel();
        }
      } else if (autoWalkNavigator.isAutoWalking()) {
        // Auto-walk step evaluation toward event area
        requestedDir = autoWalkNavigator.getNextStepDirection(this);
      }

      if (requestedDir !== null) {
        let nextGX = this.player.gx;
        let nextGY = this.player.gy;

        if (requestedDir === 0) nextGY += 1;
        else if (requestedDir === 1) nextGX -= 1;
        else if (requestedDir === 2) nextGX += 1;
        else if (requestedDir === 3) nextGY -= 1;

        // Physical collision check against solo Spearow: never step on the event Pokémon
        const soloSpearow = route1SpearowEventManager.soloSpearowActor;
        const isOccupiedBySpearow =
          collisionEnabled &&
          soloSpearow?.visible &&
          !playerService.hasFlag('route1_flock_escaped') &&
          soloSpearow.gx === nextGX &&
          soloSpearow.gy === nextGY;

        if (isOccupiedBySpearow) {
          this.player.setBlocked(requestedDir);
          this.player.direction = requestedDir;
          if (autoWalkNavigator.isAutoWalking()) {
            autoWalkNavigator.cancel(true);
          }
          route1SpearowEventManager.faceEntity(soloSpearow, this.player.gx, this.player.gy);
          route1SpearowEventManager.faceEntity(this.player, soloSpearow.gx, soloSpearow.gy);
          void route1SpearowEventManager.triggerEncounter(this);
          return { pChunkX, pChunkY };
        }

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
    const currentDayPhase = this.getDayPhase();
    const currentWeather = getOverworldWeather(
      this.seed,
      this.worldClock.getDay(),
      this.worldClock.getMinutes()
    );
    if (!playerService.hasFlag('story_wild_spawns_suppressed')) {
      updateUnifiedWildlife(
        this.chunkManager,
        this.player,
        dtScale,
        currentDayPhase,
        currentWeather,
        getHighestOwnedPokemonLevel(partyService.getParty(), pcStorageService.getBoxes())
      );
      // 5b. Proactive wild encounter check (allows aggressive wildlife to initiate battle on contact)
      if (Date.now() - this.lastBattleEndTime > 1500 && !this.isBattling) {
        this.checkWildPokemonCollision();
      }
    }

    // 5a. Overworld Village NPC AI (movement, obstacle avoidance, look-at-player, emotes)
    this.updateOverworldNPCs(dtMs, currentDayPhase, currentWeather);

    // 6. Overworld Shiny Pokémon Spatial Audio (3x3 chunk detection & distance scaling)
    overworldShinyAudio.update(
      this.player.gx,
      this.player.gy,
      pChunkX,
      pChunkY,
      this.chunkManager.simulationChunks,
      this.isBattling
    );

    this.checkNearbyDoors();

    return { pChunkX, pChunkY };
  }

  private syncStoryWildlifeSuppression(): void {
    const suppressed = playerService.hasFlag('story_wild_spawns_suppressed');
    if (suppressed && !this.storyWildlifePurged) {
      this.chunkManager.clearAllWildlife();
      this.storyWildlifePurged = true;
    } else if (!suppressed && this.storyWildlifePurged) {
      this.chunkManager.restoreAllWildlife();
      this.storyWildlifePurged = false;
    }
  }

  private updateOverworldNPCs(
    dtMs: number,
    dayPhase: DayPhase,
    weather: OverworldWeather
  ): void {
    const timeBand: NPCTimeBand =
      dayPhase === 'dawn'
        ? 'morning'
        : dayPhase === 'dusk'
          ? 'evening'
          : dayPhase === 'night'
            ? 'night'
            : 'day';

    // Collect all doorway front tiles so wandering NPCs never block building entrances
    const doorFrontTiles = new Set<string>();
    const occupiedNPCTiles = new Map<string, string>();
    for (const chunk of this.chunkManager.activeChunks) {
      if (chunk.buildings) {
        for (const b of chunk.buildings) {
          const w = b.doorWidthTiles || 1;
          for (let dx = 0; dx < w; dx++) {
            doorFrontTiles.add(`${b.doorGX + dx},${b.doorGY + 1}`);
          }
        }
      }
      if (chunk.npcs) {
        for (const npc of chunk.npcs) {
          occupiedNPCTiles.set(`${npc.gx},${npc.gy}`, npc.id);
          if (npc.runtime?.isMoving) {
            occupiedNPCTiles.set(`${npc.runtime.toGX},${npc.runtime.toGY}`, npc.id);
          }
        }
      }
    }

    for (const chunk of this.chunkManager.activeChunks) {
      if (!chunk.npcs || chunk.npcs.length === 0) continue;

      for (const npc of chunk.npcs) {
        if (!npc.runtime) {
          npc.runtime = createNPCRuntimeState(npc, TILE_SIZE);
        }
        const state = npc.runtime;
        const prevGX = state.gx;
        const prevGY = state.gy;
        const isTalkingToThis = Boolean(
          this.activeDialogue && this.activeDialogue.npc.id === npc.id
        );

        updateNPCBehavior(
          {
            id: npc.id,
            gx: npc.gx,
            gy: npc.gy,
            direction: npc.direction,
            idleBehavior: npc.idleBehavior === 'stand' ? 'stationary' : npc.idleBehavior,
            movementMode: npc.movementMode,
            turnCycle: npc.turnCycle,
            turnIntervalMs: npc.turnIntervalMs,
            wanderRadius: npc.wanderRadius,
            patrolPath: npc.patrolPath,
            lookAtPlayerRadius: npc.lookAtPlayerRadius,
            ambientEmotePool: npc.ambientEmotePool,
            schedule: npc.schedule,
          },
          state,
          {
            dtMs,
            playerGX: this.player.gx,
            playerGY: this.player.gy,
            followerGX: this.follower.visible ? this.follower.gx : undefined,
            followerGY: this.follower.visible ? this.follower.gy : undefined,
            isDialogueActiveWithThisNPC: isTalkingToThis,
            timeBand,
            weather,
            isTileOccupiedByOtherNPC: (tx, ty, selfId) => {
              const occ = occupiedNPCTiles.get(`${tx},${ty}`);
              return occ !== undefined && occ !== selfId;
            },
            isTileWalkable: (tx, ty, fx, fy) => {
              if (doorFrontTiles.has(`${tx},${ty}`)) return false;
              return this.chunkManager.isWalkable(tx, ty, fx, fy);
            },
          },
          TILE_SIZE
        );

        npc.direction = state.direction;
        if (state.gx !== prevGX || state.gy !== prevGY) {
          npc.gx = state.gx;
          npc.gy = state.gy;
          occupiedNPCTiles.delete(`${prevGX},${prevGY}`);
          occupiedNPCTiles.set(`${state.gx},${state.gy}`, npc.id);

          // Update dynamic NPC tile collider inside chunk.colliders
          const col = chunk.colliders.find(
            (c) =>
              c.type === 'npc' &&
              c.x === prevGX * TILE_SIZE &&
              c.y === prevGY * TILE_SIZE
          );
          if (col) {
            col.x = state.gx * TILE_SIZE;
            col.y = state.gy * TILE_SIZE;
          }
        }
      }
    }
  }

  private checkWildPokemonCollision(): void {
    for (const chunk of this.getEncounterChunks()) {
      if (!chunk.wildPokemon) continue;
      for (const wp of chunk.wildPokemon) {
        // Apricorn Plains are non-aggressive: wild Pokémon may still be
        // approached and battled through explicit player interaction, but
        // they must never initiate a battle merely by touching the player.
        if (this.field.isApricornPlain?.(wp.gx, wp.gy)) continue;
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

    if (partyService.getPartySize() === 0) {
      showBerryToast('⚠️ Bạn chưa có Pokémon nào để tham gia chiến đấu!', '#ef4444');
      return;
    }

    this.isBattling = true;
    this.worldClock.pause('battle');
    autosaveCoordinator.lockBattle();

    // Register wild Pokémon as seen in Pokédex immediately upon encounter
    playerService.registerSeenSpecies(wp.speciesKey);

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
            const syncResult = partyService.syncBattleResult(
              finalBattler,
              result.expAppliedToParty ? 0 : expGained
            );
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
              // Prefer the battler returned by BattleController. It is the
              // authoritative capture snapshot after the ball animation and
              // avoids saving a stale closure object when the battle swapped
              // or mutated the enemy during capture.
              const caughtBattler = result.caughtPokemon ?? wildBattler;
              const caughtPk = createPartyPokemon(caughtBattler.speciesKey, caughtBattler.level, {
                isShiny: caughtBattler.isShiny,
                ivs: caughtBattler.ivs,
                evs: caughtBattler.evs,
                nature: caughtBattler.nature,
                ability: caughtBattler.ability,
                abilitySlot: caughtBattler.abilitySlot,
                teraType: caughtBattler.teraType,
                gender: caughtBattler.gender,
              });
              caughtPk.currentHp = Math.max(1, caughtBattler.currentHp);
              playerService.registerCaughtSpecies(caughtBattler.speciesKey);

              if (!partyService.isPartyFull()) {
                const addedToParty = partyService.addPokemon(caughtPk);
                if (addedToParty) {
                  showBerryToast(
                    `🎉 Đã thu phục thành công ${caughtBattler.name} và thêm vào Đội hình (${partyService.getPartySize()}/6)!`,
                    '#22c55e'
                  );
                } else {
                  // Guard against a concurrent party update between the
                  // fullness check and addPokemon(). Fall back to PC storage.
                  const depositRes = pcStorageService.depositPokemon(caughtPk);
                  showBerryToast(
                    depositRes.success
                      ? `🎉 Đã thu phục thành công ${caughtBattler.name}! Đã chuyển vào PC (${depositRes.boxName})!`
                      : `⚠️ Không thể lưu ${caughtBattler.name} vì Đội hình và PC đã đầy!`,
                    depositRes.success ? '#38bdf8' : '#ef4444'
                  );
                }
              } else {
                const depositRes = pcStorageService.depositPokemon(caughtPk);
                if (depositRes.success) {
                  showBerryToast(
                    `🎉 Đã thu phục thành công ${caughtBattler.name}! Đội hình đã đầy (6/6), đã chuyển vào PC (${depositRes.boxName})!`,
                    '#38bdf8'
                  );
                } else {
                  showBerryToast(
                    `⚠️ Đội hình và toàn bộ Hộp PC đều đã đầy! Không thể chứa thêm ${caughtBattler.name}!`,
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
              if (partyService.isWholePartyFainted()) {
                this.handleBlackout();
              } else {
                showBerryToast(`💥 ${playerBattler.name} đã ngất xỉu!`, '#ef4444');
              }
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

    if (partyService.getPartySize() === 0) {
      showBerryToast('⚠️ Bạn chưa có Pokémon nào để tham gia chiến đấu!', '#ef4444');
      return;
    }

    this.isBattling = true;
    this.worldClock.pause('battle');
    autosaveCoordinator.lockBattle();

    // Register custom battler as seen in Pokédex immediately upon encounter
    playerService.registerSeenSpecies(customBattler.speciesKey);

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
              const syncResult = partyService.syncBattleResult(
                finalBattler,
                result.expAppliedToParty ? 0 : expGained
              );
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
                const caughtBattler = result.caughtPokemon ?? customBattler;
                const caughtPk = createPartyPokemon(caughtBattler.speciesKey, caughtBattler.level, {
                  isShiny: caughtBattler.isShiny,
                  ivs: caughtBattler.ivs,
                  evs: caughtBattler.evs,
                  nature: caughtBattler.nature,
                  ability: caughtBattler.ability,
                  abilitySlot: caughtBattler.abilitySlot,
                  teraType: caughtBattler.teraType,
                  gender: caughtBattler.gender,
                });
                caughtPk.currentHp = Math.max(1, caughtBattler.currentHp);
                playerService.registerCaughtSpecies(caughtBattler.speciesKey);

                if (!partyService.isPartyFull()) {
                  const addedToParty = partyService.addPokemon(caughtPk);
                  if (addedToParty) {
                    showBerryToast(
                      `🎉 Đã thu phục thành công ${caughtBattler.name} và thêm vào Đội hình (${partyService.getPartySize()}/6)!`,
                      '#22c55e'
                    );
                  } else {
                    const depositRes = pcStorageService.depositPokemon(caughtPk);
                    showBerryToast(
                      depositRes.success
                        ? `🎉 Đã thu phục thành công ${caughtBattler.name}! Đã chuyển vào PC (${depositRes.boxName})!`
                        : `⚠️ Không thể lưu ${caughtBattler.name} vì Đội hình và PC đã đầy!`,
                      depositRes.success ? '#38bdf8' : '#ef4444'
                    );
                  }
                } else {
                  const depositRes = pcStorageService.depositPokemon(caughtPk);
                  if (depositRes.success) {
                    showBerryToast(
                      `🎉 Đã thu phục thành công ${caughtBattler.name}! Đã chuyển vào PC (${depositRes.boxName})!`,
                      '#38bdf8'
                    );
                  } else {
                    showBerryToast(
                      `⚠️ Không thể lưu ${caughtBattler.name} vì PC đã đầy!`,
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
                if (partyService.isWholePartyFainted()) {
                  this.handleBlackout();
                } else {
                  showBerryToast(`💥 ${playerBattler.name} đã ngất xỉu!`, '#ef4444');
                }
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

  public handleBlackout(): void {
    const profile = playerService.getProfile();
    const penalty = Math.min(Math.floor(profile.money * 0.1), 1000);
    if (penalty > 0) {
      playerService.spendMoney(penalty);
    }
    partyService.healAll();
    this.resetPlayer();
    showBerryToast(
      penalty > 0
        ? `💫 Toàn bộ Pokémon đã ngất xỉu! Bạn đã ngất đi và được đưa về nơi an toàn (mất $${penalty}).`
        : `💫 Toàn bộ Pokémon đã ngất xỉu! Bạn đã ngất đi và được đưa về nơi an toàn.`,
      '#ef4444'
    );
  }

  /** Releases long-lived subscriptions and resets story when the overworld session is closed. */
  public destroy(): void {
    storyManager.dispose();
    palletPrologueEventManager.reset();
    route1SpearowEventManager.reset();
    this.closeVillageNPCDialogue();
    this.partyUnsubscribe?.();
    this.partyUnsubscribe = undefined;
    this.input.destroy();
    this.worldClock.pause('session_destroy');
  }

  public dispose(): void {
    this.destroy();
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

    // 0. If in Interior Room, handle interior room interaction
    const interior = InteriorManager.getInstance();
    if (interior.isInInterior()) {
      interior.handleInteract(this.follower);
      return;
    }

    // Advance active overworld dialogue
    if (this.activeDialogue) {
      this.advanceOverworldDialogue();
      return;
    }

    // Check if in front of building door to open door prompt modal
    const registry = InteriorRegistry.getInstance();
    for (const chunk of this.chunkManager.activeChunks) {
      if (!chunk.buildings) continue;
      for (const b of chunk.buildings) {
        const mapping = registry.getBuildingMapping(b.type);
        if (mapping) {
          const doorMinX = b.doorGX;
          const doorMaxX = b.doorGX + (b.doorWidthTiles || 1) - 1;
          const isFacingDoor =
            this.player.direction === 3 &&
            this.player.gy === b.doorGY + 1 &&
            this.player.gx >= doorMinX &&
            this.player.gx <= doorMaxX;
          const isNearDoor =
            Math.abs(this.player.gx - (b.doorGX + 0.5)) <= 1.5 &&
            Math.abs(this.player.gy - (b.doorGY + 1)) <= 1.5;
          if (isFacingDoor || isNearDoor) {
            DoorPromptModal.getInstance().open({
              buildingName: mapping.displayName,
              onEnter: () => {
                this.enterInteriorRoom(mapping.roomId, mapping.displayName);
              },
            });
            return;
          }
        }
      }
    }

    let targetGX = this.player.gx;
    let targetGY = this.player.gy;
    if (this.player.direction === 0) targetGY += 1;
    else if (this.player.direction === 1) targetGX -= 1;
    else if (this.player.direction === 2) targetGX += 1;
    else if (this.player.direction === 3) targetGY -= 1;

    // 0.4. Check Cutscene Actors (e.g. Professor Oak outside after gate encounter)
    for (const actor of palletPrologueEventManager.getActors()) {
      if (!actor.visible) continue;
      if (actor.gx === targetGX && actor.gy === targetGY) {
        if (this.player.direction === 0) actor.direction = 3;
        else if (this.player.direction === 1) actor.direction = 2;
        else if (this.player.direction === 2) actor.direction = 1;
        else if (this.player.direction === 3) actor.direction = 0;

        if (actor.id === 'oak') {
          palletPrologueEventManager.showDialogue('Giáo Sư Oak', [
            'Vào trong phòng nghiên cứu đi Ash! Ta cần nói chuyện với cháu về Pokémon khởi đầu!',
          ]);
          return;
        }
      }
    }

    // 0.5. Check Village NPC in front
    for (const chunk of this.chunkManager.activeChunks) {
      if (!chunk.npcs) continue;
      for (const npc of chunk.npcs) {
        if (npc.runtime && !npc.runtime.visible) continue;
        if (npc.gx === targetGX && npc.gy === targetGY) {
          // Turn NPC to face player
          if (this.player.direction === 0) npc.direction = 3;
          else if (this.player.direction === 1) npc.direction = 2;
          else if (this.player.direction === 2) npc.direction = 1;
          else if (this.player.direction === 3) npc.direction = 0;

          if (npc.runtime) {
            npc.runtime.direction = npc.direction;
            npc.runtime.frame = 0;
          }

          this.openVillageNPCDialogue(npc);
          return;
        }
      }
    }

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

  private initDialogueDom(): void {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('overworldDialogueBox') as HTMLDivElement | null;
    if (existing) {
      this.dialogueEl = existing;
      return;
    }
    this.dialogueEl = document.createElement('div');
    this.dialogueEl.id = 'overworldDialogueBox';
    this.dialogueEl.className = 'interior-dialogue-box';
    this.dialogueEl.style.display = 'none';
    this.dialogueEl.innerHTML = `
      <div class="interior-dialogue-speaker" id="overworldSpeakerName"></div>
      <div class="interior-dialogue-content" id="overworldDialogueContent"></div>
      <div id="overworldChoicesContainer" style="display:none;flex-direction:column;gap:6px;margin-top:8px;"></div>
      <div class="interior-dialogue-footer" id="overworldDialogueFooter">[Space tiếp tục]</div>
    `;
    this.dialogueEl.addEventListener('click', () => {
      if (this.activeDialogue) {
        this.advanceOverworldDialogue();
      }
    });
    document.body.appendChild(this.dialogueEl);
  }

  public advanceOverworldDialogue(): void {
    if (!this.activeDialogue) return;

    if (this.activeDialogue.lineIndex + 1 < this.activeDialogue.lines.length) {
      this.activeDialogue.lineIndex++;
      this.updateDialogueDom();
      return;
    }

    if (
      !this.activeDialogue.choiceResolved &&
      this.activeDialogue.choices &&
      this.activeDialogue.choices.length > 0
    ) {
      this.selectOverworldDialogueChoice(0, true);
      return;
    }

    if (this.activeDialogue.actionsOnComplete) {
      const actions = this.activeDialogue.actionsOnComplete;
      const npcState = this.activeDialogue.npc.runtime;
      this.activeDialogue.actionsOnComplete = undefined;
      executeNPCEventActions(actions, {
        npcRuntimeState: npcState,
        onStartTrainerBattle: (trainer) => this.startTrainerBattle(trainer),
      });
    }

    this.closeVillageNPCDialogue();
  }

  public selectOverworldDialogueChoice(choiceIndex: number, closeImmediately = false): void {
    if (!this.activeDialogue || !this.activeDialogue.choices) return;
    const choice = this.activeDialogue.choices[choiceIndex] ?? this.activeDialogue.choices[0];
    if (!choice) return;

    this.activeDialogue.choiceResolved = true;
    const npcState = this.activeDialogue.npc.runtime;

    if (this.activeDialogue.actionsOnComplete) {
      executeNPCEventActions(this.activeDialogue.actionsOnComplete, {
        npcRuntimeState: npcState,
        onStartTrainerBattle: (trainer) => this.startTrainerBattle(trainer),
      });
      this.activeDialogue.actionsOnComplete = undefined;
    }

    if (choice.actions) {
      executeNPCEventActions(choice.actions, {
        npcRuntimeState: npcState,
        onStartTrainerBattle: (trainer) => this.startTrainerBattle(trainer),
      });
    }

    if (!closeImmediately && choice.responseLines && choice.responseLines.length > 0) {
      this.activeDialogue.lines = [...choice.responseLines];
      this.activeDialogue.lineIndex = 0;
      this.activeDialogue.choices = undefined;
      this.updateDialogueDom();
    } else {
      this.closeVillageNPCDialogue();
    }
  }

  public startTrainerBattle(trainer: NPCTrainerProfile): void {
    const firstSpec = trainer.party[0];
    if (!firstSpec) return;
    const enemyBattler = createBattler(
      firstSpec.speciesKey,
      firstSpec.level,
      false,
      undefined,
      firstSpec.isShiny ?? false
    );
    enemyBattler.name = `${trainer.trainerClass} ${trainer.name} (${enemyBattler.name})`;
    this.startCustomBattle(enemyBattler);
    playerService.markTrainerDefeated(trainer.trainerId);
    if (trainer.prizeMoney > 0) {
      playerService.addMoney(trainer.prizeMoney);
    }
    if (trainer.rewardItem) {
      playerService.addItem(trainer.rewardItem.itemId, trainer.rewardItem.count);
    }
    if (trainer.flagOnWin) {
      playerService.setFlag(trainer.flagOnWin, true);
    }
    if (trainer.questAdvanceOnWin) {
      playerService.advanceQuest(
        trainer.questAdvanceOnWin.questId,
        trainer.questAdvanceOnWin.stage,
        trainer.questAdvanceOnWin.completed ?? false
      );
    }
  }

  private updateDialogueDom(): void {
    if (!this.dialogueEl && typeof document !== 'undefined') {
      this.initDialogueDom();
    }
    if (!this.dialogueEl) return;

    if (!this.activeDialogue) {
      this.dialogueEl.style.display = 'none';
      return;
    }

    const speakerEl = this.dialogueEl.querySelector<HTMLElement>('#overworldSpeakerName');
    const contentEl = this.dialogueEl.querySelector<HTMLElement>('#overworldDialogueContent');
    const choicesEl = this.dialogueEl.querySelector<HTMLElement>('#overworldChoicesContainer');
    const footerEl = this.dialogueEl.querySelector<HTMLElement>('#overworldDialogueFooter');

    if (speakerEl) {
      speakerEl.textContent = this.activeDialogue.npc.name;
    }
    if (contentEl) {
      contentEl.textContent = this.activeDialogue.lines[this.activeDialogue.lineIndex] || '';
    }

    const isLastLine = this.activeDialogue.lineIndex >= this.activeDialogue.lines.length - 1;
    const hasPendingChoices =
      isLastLine &&
      !this.activeDialogue.choiceResolved &&
      Array.isArray(this.activeDialogue.choices) &&
      this.activeDialogue.choices.length > 0;

    if (choicesEl) {
      if (hasPendingChoices && this.activeDialogue.choices) {
        choicesEl.innerHTML = '';
        if (this.activeDialogue.choicesPrompt) {
          const promptDiv = document.createElement('div');
          promptDiv.style.cssText = 'font-size:13px;color:#fbbf24;font-weight:600;margin-bottom:2px;';
          promptDiv.textContent = this.activeDialogue.choicesPrompt;
          choicesEl.appendChild(promptDiv);
        }
        this.activeDialogue.choices.forEach((choice, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = choice.label;
          btn.style.cssText =
            'text-align:left;padding:6px 12px;border-radius:6px;border:1px solid rgba(56,189,248,0.55);background:rgba(15,23,42,0.9);color:#f8fafc;font-size:14px;cursor:pointer;transition:background 0.15s;';
          btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(56,189,248,0.25)';
          });
          btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(15,23,42,0.9)';
          });
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            this.selectOverworldDialogueChoice(idx, false);
          });
          choicesEl.appendChild(btn);
        });
        choicesEl.style.display = 'flex';
      } else {
        choicesEl.style.display = 'none';
        choicesEl.innerHTML = '';
      }
    }

    if (footerEl) {
      footerEl.textContent = hasPendingChoices ? '[Chọn phương án hoặc nhấn Space]' : '[Space tiếp tục]';
    }

    this.dialogueEl.style.display = 'flex';
  }

  public openVillageNPCDialogue(npc: VillageNPCEntity): void {
    const dayPhase = this.getDayPhase();
    const timeBand: NPCTimeBand =
      dayPhase === 'dawn'
        ? 'morning'
        : dayPhase === 'dusk'
          ? 'evening'
          : dayPhase === 'night'
            ? 'night'
            : 'day';
    const weather = this.getWeather();
    const scheduleRule = resolveActiveScheduleRule(npc.schedule, timeBand, weather);
    const fallbackLines = scheduleRule?.overrideDialogue ?? npc.dialogue;

    const branch = resolveNPCDialogueBranch(
      npc.scriptId,
      fallbackLines,
      npc.actionsOnComplete
    );

    if (branch.emoteOnOpen && npc.runtime) {
      triggerNPCEmote(npc.runtime, branch.emoteOnOpen, 2200);
    }

    this.activeDialogue = {
      npc,
      lines: [...branch.lines],
      lineIndex: 0,
      choicesPrompt: branch.choicesPrompt,
      choices: branch.choices,
      actionsOnComplete: branch.actionsOnComplete,
      choiceResolved: false,
    };
    this.updateDialogueDom();
  }

  public closeVillageNPCDialogue(): void {
    if (this.activeDialogue) {
      const npc = this.activeDialogue.npc;
      npc.direction = npc.initialDirection;
      if (npc.runtime) {
        npc.runtime.direction = npc.initialDirection;
      }
      this.activeDialogue = null;
    }
    this.updateDialogueDom();
  }

  public createStoryGamePort(): StoryGamePort {
    return {
      getPlayerPosition: () => ({
        gx: this.player.gx,
        gy: this.player.gy,
        dir: this.player.direction,
      }),
      snapPlayer: (gx: number, gy: number, dir?: Direction) => {
        this.player.snapTo(gx, gy, dir ?? this.player.direction);
      },
      setPlayerDirection: (dir: Direction) => {
        this.player.direction = dir;
      },
      lockInput: () => {
        this.isInputLocked = true;
      },
      unlockInput: () => {
        this.isInputLocked = false;
      },
      isInputLocked: () => this.isInputLocked,
      setPlayerEmote: (emote: NPCEmoteType | null, durationMs?: number) => {
        this.player.setEmote(emote, durationMs ?? 2000);
      },
      setActorEmote: (actorId: string, emote: NPCEmoteType, durationMs?: number) => {
        const actor = palletPrologueEventManager.getActors().find((a) => a.id === actorId);
        if (actor) {
          actor.activeEmote = emote;
          actor.emoteTimerMs = durationMs ?? 2000;
        }
      },
      setActorDirection: (actorId: string, dir: Direction) => {
        const actor = palletPrologueEventManager.getActors().find((a) => a.id === actorId);
        if (actor) {
          actor.direction = dir;
        }
      },
      setActorVisible: (actorId: string, visible: boolean) => {
        const actor = palletPrologueEventManager.getActors().find((a) => a.id === actorId);
        if (actor) {
          actor.visible = visible;
        }
      },
      snapActor: (actorId: string, gx: number, gy: number, dir?: Direction) => {
        const actor = palletPrologueEventManager.getActors().find((a) => a.id === actorId);
        if (actor) {
          actor.gx = gx;
          actor.gy = gy;
          actor.x = gx * TILE_SIZE - 16;
          actor.y = gy * TILE_SIZE - 32;
          if (dir !== undefined) actor.direction = dir;
        }
      },
      moveActor: async (_actorId: string, _steps: Direction[], _speed?: number) => {
        // Will be wired to future NPC movement orchestrator
      },
      giveItem: (itemId: string, count: number) => {
        playerService.addItem(itemId, count);
      },
      giveStarterPokemon: (species: string | number, level: number) => {
        const p = createPartyPokemon(String(species), level, { ivs: 'perfect' });
        return partyService.addPokemon(p);
      },
      setFollowerVisible: (visible: boolean) => {
        this.follower.visible = visible;
      },
      snapFollower: (gx: number, gy: number, dir?: Direction) => {
        this.follower.snapTo(gx, gy, dir);
      },
    };
  }
}
