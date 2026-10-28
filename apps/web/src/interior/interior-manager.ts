import type { Camera } from '../core/camera';
import { type Player, getStepFrame } from '../entities/player';
import type { Follower } from '../entities/follower';
import type { AssetLoader } from '../rendering/asset-loader';
import type { InteriorRoomConfig, SavedInteriorState } from './interior-types';
import { OAK_LAB_INTERIOR_CONFIG } from './oak-lab-interior';
import { InteriorRegistry } from './interior-registry';
import { TILE_SIZE } from '@pokemon/game-data';
import { regionalFormsRegistry } from '../domain/pokemon/regional-forms';
import {
  createNPCRuntimeState,
  updateNPCBehavior,
  drawNPCEmoteBubble,
  triggerNPCEmote,
  resolveNPCDialogueBranch,
  executeNPCEventActions,
  type NPCRuntimeState,
  type NPCDialogueChoice,
  type NPCEventAction,
} from '../npc';

export interface OverworldReturnCoords {
  gx: number;
  gy: number;
  direction: 0 | 1 | 2 | 3;
}

export class InteriorManager {
  private static instance: InteriorManager | null = null;

  public static getInstance(): InteriorManager {
    if (!InteriorManager.instance) {
      InteriorManager.instance = new InteriorManager();
    }
    return InteriorManager.instance;
  }

  public currentRoom: InteriorRoomConfig | null = null;
  public returnCoords: OverworldReturnCoords | null = null;

  // Player room state
  public roomPlayerGX = 7;
  public roomPlayerGY = 10;
  public roomPlayerX = 7 * TILE_SIZE - 16;
  public roomPlayerY = 10 * TILE_SIZE - 32;
  public roomPlayerDir: 0 | 1 | 2 | 3 = 3; // 0=down, 1=left, 2=right, 3=up
  public isPlayerMoving = false;
  public stepProgress = 0;
  private fromGX = 7;
  private fromGY = 10;
  private toGX = 7;
  private toGY = 10;
  public playerStepCount = 0;
  public playerSpriteKey?: string;

  // Idle Animation State (4-Frame Idle from char_red_idle.png)
  public isPlayerIdling = false;
  private playerIdleTimer = 0;
  private nextPlayerIdleDelay = 1.5;
  private playerIdleAnimTimer = 0;
  private readonly playerIdleFrameDuration = 0.16;
  private readonly totalPlayerIdleFrames = 4;
  public playerIdlingFrame = 0;

  // Dynamic NPC states (movement, standing frame=0, emotes & turn behaviors)
  private npcStates = new Map<string, NPCRuntimeState>();

  // Solid tiles in current room
  private solidTiles = new Set<string>();

  // Dialogue system state
  public activeDialogue: {
    speaker: string;
    lines: string[];
    lineIndex: number;
    npcId?: string;
    choicesPrompt?: string;
    choices?: NPCDialogueChoice[];
    actionsOnComplete?: NPCEventAction[];
    choiceResolved?: boolean;
  } | null = null;

  // Modern High-Res DOM Dialogue Overlay
  private dialogueEl: HTMLDivElement | null = null;

  public onExitRoomCallback?: (coords: OverworldReturnCoords) => void;

  // Follower sprite cache
  private followerSpriteCache = new Map<string, HTMLImageElement>();

  private getFollowerSprite(speciesKey: string, isShiny = false): HTMLImageElement | undefined {
    const keyUpper = speciesKey.replace(/^wild_/i, '').toUpperCase();
    const cacheKey = `${keyUpper}_${isShiny ? 'shiny' : 'normal'}`;
    let img = this.followerSpriteCache.get(cacheKey);
    if (!img) {
      img = new Image();
      const folder = isShiny ? 'Followers shiny' : 'Followers';
      const form =
        regionalFormsRegistry.getByFormKey(keyUpper) ||
        regionalFormsRegistry.getByAssetKey(keyUpper);
      const assetKey = form?.assetKey ?? keyUpper;
      img.src = `/Graphics/Characters/${folder}/${assetKey}.png`;
      this.followerSpriteCache.set(cacheKey, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : undefined;
  }

  private getFollowerFrameSize(img: HTMLImageElement): { width: number; height: number } {
    const width = img.naturalWidth > 0 ? Math.floor(img.naturalWidth / 4) : 64;
    const height = img.naturalHeight > 0 ? Math.floor(img.naturalHeight / 4) : 64;
    return {
      width: width > 0 ? width : 64,
      height: height > 0 ? height : 64,
    };
  }

  constructor() {
    this.initDialogueDom();
  }

  private initDialogueDom(): void {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    const existing = document.getElementById('interiorDialogueBox') as HTMLDivElement | null;
    if (existing) {
      this.dialogueEl = existing;
      return;
    }
    this.dialogueEl = document.createElement('div');
    this.dialogueEl.id = 'interiorDialogueBox';
    this.dialogueEl.className = 'interior-dialogue-box';
    this.dialogueEl.style.display = 'none';
    this.dialogueEl.innerHTML = `
      <div class="interior-dialogue-speaker" id="interiorSpeakerName"></div>
      <div class="interior-dialogue-content" id="interiorDialogueContent"></div>
      <div id="interiorChoicesContainer" style="display:none;flex-direction:column;gap:6px;margin-top:8px;"></div>
      <div class="interior-dialogue-footer" id="interiorDialogueFooter">[Space tiếp tục]</div>
    `;
    this.dialogueEl.addEventListener('click', () => {
      this.handleInteract();
    });
    document.body.appendChild(this.dialogueEl);
  }

  public selectDialogueChoice(choiceIndex: number, closeImmediately = false): void {
    if (!this.activeDialogue || !this.activeDialogue.choices) return;
    const choice = this.activeDialogue.choices[choiceIndex] ?? this.activeDialogue.choices[0];
    if (!choice) return;

    this.activeDialogue.choiceResolved = true;
    const npcState = this.activeDialogue.npcId
      ? this.npcStates.get(this.activeDialogue.npcId)
      : undefined;

    if (this.activeDialogue.actionsOnComplete) {
      executeNPCEventActions(this.activeDialogue.actionsOnComplete, {
        npcRuntimeState: npcState,
      });
      this.activeDialogue.actionsOnComplete = undefined;
    }

    if (choice.actions) {
      executeNPCEventActions(choice.actions, {
        npcRuntimeState: npcState,
      });
    }

    if (!closeImmediately && choice.responseLines && choice.responseLines.length > 0) {
      this.activeDialogue.lines = [...choice.responseLines];
      this.activeDialogue.lineIndex = 0;
      this.activeDialogue.choices = undefined;
      this.updateDialogueDom();
    } else {
      this.activeDialogue = null;
      this.updateDialogueDom();
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

    const speakerEl = this.dialogueEl.querySelector<HTMLElement>('#interiorSpeakerName');
    const contentEl = this.dialogueEl.querySelector<HTMLElement>('#interiorDialogueContent');
    const choicesEl = this.dialogueEl.querySelector<HTMLElement>('#interiorChoicesContainer');
    const footerEl = this.dialogueEl.querySelector<HTMLElement>('#interiorDialogueFooter');

    if (speakerEl) {
      if (this.activeDialogue.speaker && this.activeDialogue.speaker.trim().length > 0) {
        speakerEl.textContent = this.activeDialogue.speaker;
        speakerEl.style.display = 'inline-block';
      } else {
        speakerEl.style.display = 'none';
      }
    }

    if (contentEl) {
      const text = this.activeDialogue.lines[this.activeDialogue.lineIndex] || '';
      contentEl.textContent = text;
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
            this.selectDialogueChoice(idx, false);
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

  public enterOakLab(overworldReturn: OverworldReturnCoords, follower?: Follower): void {
    this.enterRoom(OAK_LAB_INTERIOR_CONFIG, overworldReturn, follower);
  }

  public enterRoom(
    config: InteriorRoomConfig,
    overworldReturn: OverworldReturnCoords,
    follower?: Follower
  ): void {
    this.currentRoom = {
      ...config,
      npcs: [...config.npcs],
      props: [...config.props],
    };
    this.returnCoords = overworldReturn;

    this.roomPlayerGX = config.spawnGX;
    this.roomPlayerGY = config.spawnGY;
    this.roomPlayerX = config.spawnGX * TILE_SIZE - 16;
    this.roomPlayerY = config.spawnGY * TILE_SIZE - 32;
    this.roomPlayerDir = config.spawnDirection;
    this.isPlayerMoving = false;
    this.stepProgress = 0;
    this.fromGX = config.spawnGX;
    this.fromGY = config.spawnGY;
    this.toGX = config.spawnGX;
    this.toGY = config.spawnGY;
    this.playerStepCount = 0;
    this.isPlayerIdling = false;
    this.playerIdleTimer = 0;
    this.playerIdleAnimTimer = 0;
    this.playerIdlingFrame = 0;
    this.activeDialogue = null;
    this.updateDialogueDom();

    // Reset NPC animation & behavior states
    this.npcStates.clear();
    for (const npc of config.npcs) {
      this.npcStates.set(npc.id, createNPCRuntimeState(npc, TILE_SIZE));
    }

    // Initialize follower in room coordinates directly behind player
    if (follower) {
      let fgx = config.spawnGX;
      let fgy = config.spawnGY;
      if (config.spawnDirection === 3) fgy += 1;
      else if (config.spawnDirection === 0) fgy -= 1;
      else if (config.spawnDirection === 1) fgx += 1;
      else if (config.spawnDirection === 2) fgx -= 1;
      follower.snapTo(fgx, fgy, config.spawnDirection);
      follower.visible = true;
    }

    this.rebuildSolidTiles();
  }

  public snapPlayerTo(gx: number, gy: number, dir: 0 | 1 | 2 | 3 = 0): void {
    this.roomPlayerGX = gx;
    this.roomPlayerGY = gy;
    this.roomPlayerX = gx * TILE_SIZE - 16;
    this.roomPlayerY = gy * TILE_SIZE - 32;
    this.roomPlayerDir = dir;
    this.fromGX = gx;
    this.fromGY = gy;
    this.toGX = gx;
    this.toGY = gy;
    this.isPlayerMoving = false;
    this.stepProgress = 0;
  }

  public exitCurrentRoom(): void {
    if (!this.currentRoom || !this.returnCoords) return;
    const coords = { ...this.returnCoords };
    this.currentRoom = null;
    this.returnCoords = null;
    this.activeDialogue = null;
    this.npcStates.clear();
    this.updateDialogueDom();
    this.onExitRoomCallback?.(coords);
  }

  public getSaveState(): SavedInteriorState | null {
    if (!this.currentRoom || !this.returnCoords) return null;
    return {
      roomId: this.currentRoom.id,
      returnCoords: { ...this.returnCoords },
      playerGX: this.roomPlayerGX,
      playerGY: this.roomPlayerGY,
      playerDir: this.roomPlayerDir,
    };
  }

  public restoreSaveState(saved: SavedInteriorState, follower?: Follower): boolean {
    const config = InteriorRegistry.getInstance().getRoom(saved.roomId);
    if (!config) return false;
    this.enterRoom(config, saved.returnCoords, follower);
    this.roomPlayerGX = saved.playerGX;
    this.roomPlayerGY = saved.playerGY;
    this.roomPlayerDir = saved.playerDir;
    this.roomPlayerX = saved.playerGX * TILE_SIZE - 16;
    this.roomPlayerY = saved.playerGY * TILE_SIZE - 32;
    this.fromGX = saved.playerGX;
    this.fromGY = saved.playerGY;
    this.toGX = saved.playerGX;
    this.toGY = saved.playerGY;
    if (follower) {
      let fgx = saved.playerGX;
      let fgy = saved.playerGY;
      if (saved.playerDir === 3) fgy += 1;
      else if (saved.playerDir === 0) fgy -= 1;
      else if (saved.playerDir === 1) fgx += 1;
      else if (saved.playerDir === 2) fgx -= 1;
      follower.snapTo(fgx, fgy, saved.playerDir);
    }
    return true;
  }

  public transitionToRoom(
    roomId: string,
    spawnGX: number,
    spawnGY: number,
    spawnDir: 0 | 1 | 2 | 3,
    follower?: Follower
  ): boolean {
    const config = InteriorRegistry.getInstance().getRoom(roomId);
    if (!config) return false;

    this.currentRoom = config;
    this.rebuildSolidTiles();
    this.roomPlayerGX = spawnGX;
    this.roomPlayerGY = spawnGY;
    this.roomPlayerX = spawnGX * TILE_SIZE - 16;
    this.roomPlayerY = spawnGY * TILE_SIZE - 32;
    this.roomPlayerDir = spawnDir;
    this.fromGX = spawnGX;
    this.fromGY = spawnGY;
    this.toGX = spawnGX;
    this.toGY = spawnGY;
    this.isPlayerMoving = false;
    this.stepProgress = 0;

    // Reset NPC states for the new room
    this.npcStates.clear();
    for (const npc of config.npcs) {
      this.npcStates.set(npc.id, createNPCRuntimeState(npc, TILE_SIZE));
    }

    if (follower) {
      let fgx = spawnGX;
      let fgy = spawnGY;
      if (spawnDir === 3) fgy += 1;
      else if (spawnDir === 0) fgy -= 1;
      else if (spawnDir === 1) fgx += 1;
      else if (spawnDir === 2) fgx -= 1;
      follower.snapTo(fgx, fgy, spawnDir);
      follower.visible = true;
    }

    return true;
  }

  public isInInterior(): boolean {
    return this.currentRoom !== null;
  }

  private rebuildSolidTiles(): void {
    this.solidTiles.clear();
    if (!this.currentRoom) return;

    const { widthTiles, heightTiles, wallHeightTiles, props, npcs } = this.currentRoom;

    // Outer boundary walls:
    // Top wall covers rows 0 .. wallHeightTiles - 1
    for (let x = 0; x < widthTiles; x++) {
      for (let y = 0; y < wallHeightTiles; y++) {
        this.solidTiles.add(`${x},${y}`);
      }
      // Bottom border (except exit door warp)
      this.solidTiles.add(`${x},${heightTiles - 1}`);
    }

    // Left and right boundary walls
    for (let y = 0; y < heightTiles; y++) {
      this.solidTiles.add(`0,${y}`);
      this.solidTiles.add(`${widthTiles - 1},${y}`);
    }

    // Solid props
    for (const p of props) {
      if (p.isSolid) {
        const startX = Math.round(p.gx + (p.solidOffsetX ?? 0));
        const startY = Math.round(p.gy + (p.solidOffsetY ?? 0));
        const w = Math.round(p.solidWidthTiles ?? p.widthTiles);
        const h = Math.round(p.solidHeightTiles ?? (p.heightTiles > 2 ? 1 : p.heightTiles));
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            this.solidTiles.add(`${startX + dx},${startY + dy}`);
          }
        }
      }
    }

    // NPCs block walking
    for (const n of npcs) {
      this.solidTiles.add(`${n.gx},${n.gy}`);
    }

    // Ensure exit warp tile is walkable
    const exit = this.currentRoom.exitWarp;
    if (exit) {
      this.solidTiles.delete(`${exit.gx},${exit.gy}`);
      this.solidTiles.delete(`${exit.gx + 1},${exit.gy}`);
    }

    // Ensure stairs warps are walkable ONLY on floor rows (gy >= wallHeightTiles)
    // Wall rows (gy < wallHeightTiles) must NEVER be made walkable!
    if (this.currentRoom.stairsWarps) {
      for (const s of this.currentRoom.stairsWarps) {
        if (s.gy >= wallHeightTiles) {
          this.solidTiles.delete(`${s.gx},${s.gy}`);
        }
      }
    }

    // Absolute boundary safeguard: rows 0 .. wallHeightTiles - 1 are NEVER walkable under any condition
    for (let x = 0; x < widthTiles; x++) {
      for (let y = 0; y < wallHeightTiles; y++) {
        this.solidTiles.add(`${x},${y}`);
      }
    }
  }

  public isWalkable(gx: number, gy: number): boolean {
    if (!this.currentRoom) return false;
    if (this.solidTiles.has(`${gx},${gy}`)) return false;
    return true;
  }

  public update(
    inputDir: { dx: number; dy: number; isMoving: boolean },
    dtScale = 1.0,
    isRunning = false,
    follower?: Follower
  ): void {
    if (!this.currentRoom) return;

    // Update dynamic NPC behaviors, smooth walking, emotes & standing frame = 0
    const dtMs = 16.666 * dtScale;
    let npcMovedTile = false;
    for (const npc of this.currentRoom.npcs) {
      let state = this.npcStates.get(npc.id);
      if (!state) {
        state = createNPCRuntimeState(npc, TILE_SIZE);
        this.npcStates.set(npc.id, state);
      }

      const prevGX = state.gx;
      const prevGY = state.gy;
      const isTalkingToThis = Boolean(
        this.activeDialogue &&
          (this.activeDialogue.npcId === npc.id || this.activeDialogue.speaker === npc.name)
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
        },
        state,
        {
          dtMs,
          playerGX: this.roomPlayerGX,
          playerGY: this.roomPlayerGY,
          followerGX: follower?.visible ? follower.gx : undefined,
          followerGY: follower?.visible ? follower.gy : undefined,
          isDialogueActiveWithThisNPC: isTalkingToThis,
          isTileWalkable: (tx, ty) => this.isWalkable(tx, ty),
        },
        TILE_SIZE
      );

      npc.direction = state.direction;
      if (state.gx !== prevGX || state.gy !== prevGY) {
        npc.gx = state.gx;
        npc.gy = state.gy;
        npcMovedTile = true;
      }
    }

    if (npcMovedTile) {
      this.rebuildSolidTiles();
    }

    // If dialogue is open, player cannot move
    if (this.activeDialogue) {
      this.isPlayerMoving = false;
      this.isPlayerIdling = false;
      this.playerIdleTimer = 0;
      this.playerIdleAnimTimer = 0;
      this.playerIdlingFrame = 0;
      if (follower) {
        follower.updateIdle(dtScale);
      }
      return;
    }

    // Match authentic overworld speed from Player.ts:
    // Classic walk: 2.0px / frame -> 2.0 / 32 = 0.0625 progress per frame
    // Run: 3.6px / frame -> 3.6 / 32 = 0.1125 progress per frame
    const basePx = 2.0;
    const stepPx = isRunning ? 3.6 : basePx;
    const stepSpeed = (stepPx / TILE_SIZE) * dtScale;

    if (this.isPlayerMoving) {
      this.isPlayerIdling = false;
      this.playerIdleTimer = 0;
      this.playerIdleAnimTimer = 0;
      this.playerIdlingFrame = 0;

      this.stepProgress += stepSpeed;
      if (follower) {
        follower.updateSync(this.stepProgress);
      }
      if (this.stepProgress >= 1.0) {
        this.stepProgress = 0;
        this.isPlayerMoving = false;
        this.roomPlayerGX = this.toGX;
        this.roomPlayerGY = this.toGY;
        this.roomPlayerX = this.toGX * TILE_SIZE - 16;
        this.roomPlayerY = this.toGY * TILE_SIZE - 32;

        if (follower) {
          follower.completeStep();
        }

        // Check if stepped onto exit door
        const exit = this.currentRoom.exitWarp;
        if (
          exit &&
          (this.roomPlayerGX === exit.gx || this.roomPlayerGX === exit.gx + 1) &&
          this.roomPlayerGY === exit.gy &&
          exit.gy >= this.currentRoom.heightTiles - 2
        ) {
          this.exitCurrentRoom();
          return;
        }

        // Check if stepped onto stairs warp (e.g. 1F <-> 2F)
        if (this.currentRoom.stairsWarps) {
          for (const s of this.currentRoom.stairsWarps) {
            if (this.roomPlayerGX === s.gx && this.roomPlayerGY === s.gy) {
              this.transitionToRoom(
                s.targetRoomId,
                s.targetGX,
                s.targetGY,
                s.targetDir ?? this.roomPlayerDir,
                follower
              );
              return;
            }
          }
        }
      } else {
        // Interpolate pixel position
        const fromX = this.fromGX * TILE_SIZE - 16;
        const fromY = this.fromGY * TILE_SIZE - 32;
        const targetX = this.toGX * TILE_SIZE - 16;
        const targetY = this.toGY * TILE_SIZE - 32;
        this.roomPlayerX = fromX + (targetX - fromX) * this.stepProgress;
        this.roomPlayerY = fromY + (targetY - fromY) * this.stepProgress;
      }
    } else if (inputDir.isMoving) {
      this.isPlayerIdling = false;
      this.playerIdleTimer = 0;
      this.playerIdleAnimTimer = 0;
      this.playerIdlingFrame = 0;

      // Requested direction
      let requestedDir: 0 | 1 | 2 | 3 = 0;
      if (inputDir.dy > 0) requestedDir = 0; // Down
      else if (inputDir.dx < 0) requestedDir = 1; // Left
      else if (inputDir.dx > 0) requestedDir = 2; // Right
      else if (inputDir.dy < 0) requestedDir = 3; // Up

      this.roomPlayerDir = requestedDir;

      const nextGX = this.roomPlayerGX + inputDir.dx;
      const nextGY = this.roomPlayerGY + inputDir.dy;

      if (this.isWalkable(nextGX, nextGY)) {
        this.fromGX = this.roomPlayerGX;
        this.fromGY = this.roomPlayerGY;
        this.toGX = nextGX;
        this.toGY = nextGY;
        this.isPlayerMoving = true;
        this.stepProgress = 0;
        this.playerStepCount++;

        if (follower) {
          follower.startFollow(
            this.fromGX,
            this.fromGY,
            nextGX,
            nextGY,
            this.playerStepCount
          );
        }
      }
    } else {
      // Stationary idle - tick authentic idle animation timer matching Player.ts
      const dtSeconds = (1 / 60) * dtScale;
      if (!this.isPlayerIdling) {
        this.playerIdleTimer += dtSeconds;
        if (this.playerIdleTimer >= this.nextPlayerIdleDelay) {
          this.playerIdleTimer = 0;
          this.isPlayerIdling = true;
          this.playerIdleAnimTimer = 0;
          this.playerIdlingFrame = 0;
        }
      } else {
        this.playerIdleAnimTimer += dtSeconds;
        const totalDuration = this.playerIdleFrameDuration * this.totalPlayerIdleFrames;
        if (this.playerIdleAnimTimer < totalDuration) {
          const frameIndex = Math.floor(this.playerIdleAnimTimer / this.playerIdleFrameDuration);
          this.playerIdlingFrame = Math.min(this.totalPlayerIdleFrames - 1, Math.max(0, frameIndex));
        } else {
          this.isPlayerIdling = false;
          this.playerIdleTimer = 0;
          this.playerIdleAnimTimer = 0;
          this.playerIdlingFrame = 0;
          this.nextPlayerIdleDelay = 1.5 + Math.random() * 1.2;
        }
      }

      if (follower) {
        follower.updateIdle(dtScale);
      }
    }
  }

  public handleInteract(follower?: Follower): boolean {
    if (!this.currentRoom) return false;

    // If dialogue is already active, advance line or resolve choice/completion
    if (this.activeDialogue) {
      if (this.activeDialogue.lineIndex + 1 < this.activeDialogue.lines.length) {
        this.activeDialogue.lineIndex++;
        this.updateDialogueDom();
        return true;
      }

      // Reached end of current dialogue lines
      if (
        !this.activeDialogue.choiceResolved &&
        this.activeDialogue.choices &&
        this.activeDialogue.choices.length > 0
      ) {
        // Pressing Space / handleInteract() selects default choice 0 and closes cleanly
        this.selectDialogueChoice(0, true);
        return true;
      }

      if (this.activeDialogue.actionsOnComplete) {
        const npcState = this.activeDialogue.npcId
          ? this.npcStates.get(this.activeDialogue.npcId)
          : undefined;
        executeNPCEventActions(this.activeDialogue.actionsOnComplete, {
          npcRuntimeState: npcState,
        });
      }

      this.activeDialogue = null;
      this.updateDialogueDom();
      return true;
    }

    // Check what is directly in front of the player (strict directional interaction)
    let targetGX = this.roomPlayerGX;
    let targetGY = this.roomPlayerGY;
    if (this.roomPlayerDir === 0) targetGY += 1;
    else if (this.roomPlayerDir === 1) targetGX -= 1;
    else if (this.roomPlayerDir === 2) targetGX += 1;
    else if (this.roomPlayerDir === 3) targetGY -= 1;

    // 1. Check NPC interaction (strictly facing NPC tile)
    for (const npc of this.currentRoom.npcs) {
      if (npc.gx === targetGX && npc.gy === targetGY) {
        // NPC turns toward player
        if (this.roomPlayerDir === 0) npc.direction = 3; // Player down -> NPC up
        else if (this.roomPlayerDir === 1) npc.direction = 2; // Player left -> NPC right
        else if (this.roomPlayerDir === 2) npc.direction = 1; // Player right -> NPC left
        else if (this.roomPlayerDir === 3) npc.direction = 0; // Player up -> NPC down

        const state = this.npcStates.get(npc.id);
        if (state) {
          state.direction = npc.direction;
          state.frame = 0; // Strictly neutral standing frame
        }

        const branch = resolveNPCDialogueBranch(
          npc.scriptId,
          npc.dialogue,
          npc.actionsOnComplete
        );
        if (branch.emoteOnOpen && state) {
          triggerNPCEmote(state, branch.emoteOnOpen, 2200);
        }

        this.activeDialogue = {
          speaker: npc.name,
          lines: [...branch.lines],
          lineIndex: 0,
          npcId: npc.id,
          choicesPrompt: branch.choicesPrompt,
          choices: branch.choices,
          actionsOnComplete: branch.actionsOnComplete,
          choiceResolved: false,
        };
        this.updateDialogueDom();
        return true;
      }
    }

    // 1b. Check Follower interaction (facing partner Pokémon indoors)
    if (follower && follower.visible && targetGX === follower.gx && targetGY === follower.gy) {
      if (this.roomPlayerDir === 0) follower.direction = 3;
      else if (this.roomPlayerDir === 1) follower.direction = 2;
      else if (this.roomPlayerDir === 2) follower.direction = 1;
      else if (this.roomPlayerDir === 3) follower.direction = 0;

      const monName =
        follower.nickname && follower.nickname.toUpperCase() !== follower.speciesKey.toUpperCase()
          ? follower.nickname
          : follower.speciesKey.charAt(0).toUpperCase() +
            follower.speciesKey.slice(1).toLowerCase();
      const partnerLines = [
        `${monName}: Chích chích! (${monName} đang hào hứng quan sát các thiết bị trong Viện Nghiên Cứu và theo sát bạn!)`
      ];
      this.activeDialogue = {
        speaker: monName,
        lines: partnerLines,
        lineIndex: 0,
      };
      this.updateDialogueDom();
      return true;
    }

    // 2. Check Prop interaction (strictly facing prop bounding box)
    for (const prop of this.currentRoom.props) {
      if (!prop.interactText) continue;
      const withinX = targetGX >= prop.gx && targetGX < prop.gx + prop.widthTiles;
      const withinY = targetGY >= prop.gy && targetGY < prop.gy + prop.heightTiles;
      if (withinX && withinY) {
        this.activeDialogue = {
          speaker: '',
          lines: [prop.interactText],
          lineIndex: 0,
        };
        this.updateDialogueDom();
        return true;
      }
    }

    // 3. Check exit door in front
    const exit = this.currentRoom.exitWarp;
    if (
      exit &&
      this.roomPlayerDir === 0 &&
      (targetGX === exit.gx || targetGX === exit.gx + 1) &&
      targetGY >= exit.gy &&
      exit.gy >= this.currentRoom.heightTiles - 2
    ) {
      this.exitCurrentRoom();
      return true;
    }

    // 4. Check stairs warp in front
    if (this.currentRoom.stairsWarps) {
      for (const s of this.currentRoom.stairsWarps) {
        if (targetGX === s.gx && targetGY === s.gy) {
          this.transitionToRoom(
            s.targetRoomId,
            s.targetGX,
            s.targetGY,
            s.targetDir ?? this.roomPlayerDir,
            follower
          );
          return true;
        }
      }
    }

    return false;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    _player: Player,
    follower: Follower,
    loader: AssetLoader,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!this.currentRoom) return;

    const { widthTiles, heightTiles, wallHeightTiles, floorAssetKey, floorBorderAssetKey, wallAssetKey, props, npcs } =
      this.currentRoom;

    // Room origin in world space (centered around (0, 0) for camera tracking)
    const roomOriginX = -Math.floor((widthTiles * TILE_SIZE) / 2);
    const roomOriginY = -Math.floor((heightTiles * TILE_SIZE) / 2);

    // Update camera (center when room fits canvas, or track player if larger)
    const playerWorldX = roomOriginX + this.roomPlayerX;
    const playerWorldY = roomOriginY + this.roomPlayerY;
    const roomW = widthTiles * TILE_SIZE;
    const roomH = heightTiles * TILE_SIZE;
    if (canvasWidth >= roomW && canvasHeight >= roomH) {
      camera.x = 0;
      camera.y = 0;
    } else {
      camera.snapTo({ x: playerWorldX, y: playerWorldY });
    }

    // 1. Draw floor tiles
    const floorImg = loader.getImage(floorAssetKey);
    const floorBorderImg = floorBorderAssetKey ? loader.getImage(floorBorderAssetKey) : floorImg;
    const wallImg = loader.getImage(wallAssetKey);

    for (let ty = wallHeightTiles; ty < heightTiles; ty++) {
      for (let tx = 0; tx < widthTiles; tx++) {
        const px = roomOriginX + tx * TILE_SIZE;
        const py = roomOriginY + ty * TILE_SIZE;
        const isBorder = tx === 0 || tx === widthTiles - 1 || ty === wallHeightTiles || ty === heightTiles - 1;
        const img = isBorder && floorBorderImg ? floorBorderImg : floorImg;
        if (img && img.complete) {
          ctx.drawImage(img, px, py, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // 1b. Carpet runner (if configured)
    if (this.currentRoom.carpetRunner) {
      const { gx, gy, widthTiles: cw, heightTiles: ch, color } = this.currentRoom.carpetRunner;
      const carpetColor = color ?? '#991b1b';
      const cpx = roomOriginX + gx * TILE_SIZE;
      const cpy = roomOriginY + gy * TILE_SIZE;
      const cpw = cw * TILE_SIZE;
      const cph = ch * TILE_SIZE;

      // Carpet body
      ctx.fillStyle = carpetColor;
      ctx.fillRect(cpx, cpy, cpw, cph);

      // Gold / Amber retro trim
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(cpx + 2, cpy + 2, cpw - 4, cph - 4);
    }

    // 1c. Exit Door Mat
    const exit = this.currentRoom.exitWarp;
    if (exit && floorBorderImg && floorBorderImg.complete) {
      ctx.drawImage(floorBorderImg, roomOriginX + exit.gx * TILE_SIZE, roomOriginY + exit.gy * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      ctx.drawImage(floorBorderImg, roomOriginX + (exit.gx + 1) * TILE_SIZE, roomOriginY + exit.gy * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    // 1d. Floor Layer Props (Rugs, mats, floor runners - always rendered under furniture and entities)
    for (const p of props) {
      if (p.layer !== 'floor') continue;
      const propImg = loader.getImage(p.assetKey);
      if (!propImg || !propImg.complete) continue;
      const px = roomOriginX + p.gx * TILE_SIZE;
      const py = roomOriginY + p.gy * TILE_SIZE;
      const w = p.widthTiles * TILE_SIZE;
      const h = p.heightTiles * TILE_SIZE;
      if (p.sourceWidth !== undefined && p.sourceHeight !== undefined) {
        ctx.drawImage(propImg, p.sourceX ?? 0, p.sourceY ?? 0, p.sourceWidth, p.sourceHeight, px, py, w, h);
      } else {
        ctx.drawImage(propImg, px, py, w, h);
      }
    }

    // 2. Draw wall row 0-1
    for (let tx = 0; tx < widthTiles; tx++) {
      const px = roomOriginX + tx * TILE_SIZE;
      const py = roomOriginY;
      if (wallImg && wallImg.complete) {
        ctx.drawImage(wallImg, px, py, TILE_SIZE, wallHeightTiles * TILE_SIZE);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px, py, TILE_SIZE, wallHeightTiles * TILE_SIZE);
      }
    }

    // 3. Y-sorted Render Items (Props, NPCs, Player, Follower)
    interface RenderItem {
      ySort: number;
      draw: () => void;
    }
    const renderItems: RenderItem[] = [];

    // Props
    for (const p of props) {
      if (p.layer === 'floor') continue; // Already rendered on floor layer
      const propImg = loader.getImage(p.assetKey);
      if (!propImg || !propImg.complete) continue;
      const px = roomOriginX + p.gx * TILE_SIZE;
      const py = roomOriginY + p.gy * TILE_SIZE;
      const w = p.widthTiles * TILE_SIZE;
      const h = p.heightTiles * TILE_SIZE;
      const ySort = py + h + (p.ySortOffset ?? 0);

      renderItems.push({
        ySort,
        draw: () => {
          if (p.sourceWidth !== undefined && p.sourceHeight !== undefined) {
            ctx.drawImage(propImg, p.sourceX ?? 0, p.sourceY ?? 0, p.sourceWidth, p.sourceHeight, px, py, w, h);
          } else {
            ctx.drawImage(propImg, px, py, w, h);
          }
        },
      });
    }

    // NPCs
    for (const npc of npcs) {
      const state = this.npcStates.get(npc.id);
      if (state && !state.visible) continue;
      const npcImg = loader.getImage(npc.spriteKey);
      const nx = roomOriginX + (state ? state.x : npc.gx * TILE_SIZE) - 16;
      const ny = roomOriginY + (state ? state.y : npc.gy * TILE_SIZE) - 32;
      const frame = state ? state.frame : 0;
      const dir = state ? state.direction : npc.direction;

      renderItems.push({
        ySort: ny + 58 + (npc.ySortOffset ?? 0),
        draw: () => {
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(nx + 32, ny + 58, 12, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          if (npcImg && npcImg.complete) {
            const frameW = npcImg.naturalWidth / 4;
            const frameH = npcImg.naturalHeight / 4;
            ctx.drawImage(npcImg, frame * frameW, dir * frameH, frameW, frameH, nx, ny, 64, 64);
          }

          if (state?.activeEmote) {
            drawNPCEmoteBubble(ctx, nx + 32, ny + 8, state.activeEmote, state.emoteTimerMs);
          }
        },
      });
    }

    // Player
    const isIdling = this.isPlayerIdling;
    const defaultKey = isIdling ? 'char_red_idle' : 'char_red_sheet';
    const playerImgKey = this.playerSpriteKey || defaultKey;
    const playerImg = loader.getImage(playerImgKey) || loader.getImage('char_red_sheet');

    let playerFrame = 0;
    if (this.isPlayerMoving) {
      // Authentic GBA Pokémon step cycle: 1 step per tile (alternating odd/even foot)
      playerFrame = getStepFrame(this.playerStepCount, this.stepProgress);
    } else if (isIdling) {
      playerFrame = this.playerIdlingFrame;
    } else {
      playerFrame = 0; // Natural neutral standing pose
    }

    renderItems.push({
      ySort: playerWorldY + 58,
      draw: () => {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(playerWorldX + 32, playerWorldY + 58, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        if (playerImg && playerImg.complete) {
          const frameW = playerImg.naturalWidth ? playerImg.naturalWidth / 4 : 64;
          const frameH = playerImg.naturalHeight ? playerImg.naturalHeight / 4 : 64;
          ctx.drawImage(
            playerImg,
            playerFrame * frameW,
            this.roomPlayerDir * frameH,
            frameW,
            frameH,
            playerWorldX,
            playerWorldY,
            64,
            64
          );
        }

        if (_player?.activeEmote && (_player?.emoteTimerMs ?? 0) > 0) {
          drawNPCEmoteBubble(ctx, playerWorldX + 32, playerWorldY + 8, _player.activeEmote, _player.emoteTimerMs);
        }
      },
    });

    // Follower Pokémon (rendered inside room with proper Y-sorting)
    if (follower && follower.visible) {
      const fx = roomOriginX + follower.x;
      const fy = roomOriginY + follower.y + (follower.jumpY || 0);
      const img = this.getFollowerSprite(follower.speciesKey, follower.isShiny);
      const fFrame = follower.frame;
      const fDir = follower.direction;
      const frameSize = img ? this.getFollowerFrameSize(img) : { width: 64, height: 64 };

      renderItems.push({
        ySort: fy + 56,
        draw: () => {
          // Soft shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(fx + 32, fy + 54, 11, 5.5, 0, 0, Math.PI * 2);
          ctx.fill();

          if (img && img.complete) {
            ctx.drawImage(
              img,
              fFrame * frameSize.width,
              fDir * frameSize.height,
              frameSize.width,
              frameSize.height,
              fx,
              fy,
              64,
              64
            );
          }

          if (follower.isShiny) {
            const time = performance.now() * 0.003;
            for (let i = 0; i < 4; i++) {
              const ang = time + (i * Math.PI) / 2;
              const spkX = fx + 32 + Math.cos(ang) * 16;
              const spkY = fy + 28 + Math.sin(ang) * 12;
              ctx.fillStyle = '#fef08a';
              ctx.fillRect(spkX - 1.5, spkY - 1.5, 3, 3);
            }
          }
        },
      });
    }

    // Sort by Y and draw all items
    renderItems.sort((a, b) => a.ySort - b.ySort);
    for (const item of renderItems) {
      item.draw();
    }

    // 4. Draw Dialogue Box (Overlay in Screen Space)
    if (this.activeDialogue) {
      ctx.restore(); // Exit camera world transform to draw screen HUD
      this.drawDialogueBox(ctx, canvasWidth, canvasHeight);
      ctx.save();
      camera.applyTransform(ctx, canvasWidth, canvasHeight);
    }
  }

  private drawDialogueBox(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.activeDialogue) return;

    // If DOM dialogue overlay is active on screen, skip canvas duplicate
    if (this.dialogueEl && this.dialogueEl.style.display !== 'none') {
      return;
    }

    const boxWidth = Math.min(width - 40, 580);
    const boxHeight = 110;
    const boxX = Math.round((width - boxWidth) / 2);
    const boxY = height - boxHeight - 20;

    ctx.save();

    // 1. Pixel Card with Sharp Rectangles
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Thick pixel border
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Inner pixel border
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.strokeRect(boxX + 3, boxY + 3, boxWidth - 6, boxHeight - 6);

    ctx.textBaseline = 'top';

    // 2. Speaker Name Tag (Pixel font, no icons)
    let contentStartY = boxY + 14;
    if (this.activeDialogue.speaker && this.activeDialogue.speaker.trim().length > 0) {
      ctx.font = 'bold 22px "VT323", monospace';
      ctx.fillStyle = '#facc15';
      ctx.fillText(this.activeDialogue.speaker, boxX + 16, boxY + 12);
      contentStartY = boxY + 38;
    }

    // 3. Dialogue Text (Pixel font)
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px "VT323", monospace';
    const text = this.activeDialogue.lines[this.activeDialogue.lineIndex] || '';

    // Word wrap text
    this.wrapText(ctx, text, boxX + 16, contentStartY, boxWidth - 32, 24);

    // 4. Continuation hint (Pixel text, NO icons)
    const now = performance.now();
    if (Math.floor(now / 500) % 2 === 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '18px "VT323", monospace';
      const hintText = '[Space tiếp tục]';
      const hintWidth = ctx.measureText(hintText).width;
      ctx.fillText(hintText, boxX + boxWidth - hintWidth - 16, boxY + boxHeight - 24);
    }

    ctx.restore();
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(' ');
    let line = '';
    let currY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currY);
        line = words[n] + ' ';
        currY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currY);
  }
}
