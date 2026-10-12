import { ANIMATION_REGISTRY } from './animation-registry';
import { ANIMATION_ASSETS } from './animation-assets';
import {
  CoordinateTransformer,
  getBattlerCenter,
  DEFAULT_PLAYER_GEOMETRY,
  DEFAULT_ENEMY_GEOMETRY,
} from './coordinate-transformer';
import { CelRenderer } from './cel-renderer';
import { LayerManager } from './layer-manager';
import { TimingEventManager } from './timing-events';
import type { BattleAnimationDefinition } from './types';
import moveMapData from '../../../../../packages/game-data/move-animation-map.json';
import { MOVES_DB } from '../moves-db';
import { isSelfTargetMove } from '../move-vfx';

export class AnimationGallery {
  private static instance: AnimationGallery | null = null;
  private container: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private currentMove = 'tackle';
  private currentSide: 'player' | 'enemy' = 'player';
  private currentDef: BattleAnimationDefinition | null = null;
  private currentFrame = 0;
  private isPlaying = false;
  private playbackSpeed = 1.0;
  private showDebugBounds = true;

  private animFrameId: number | null = null;
  private lastTime = 0;
  private elapsedMs = 0;
  private timingManager: TimingEventManager = new TimingEventManager();

  private readonly playerPos = getBattlerCenter(DEFAULT_PLAYER_GEOMETRY);
  private readonly enemyPos = getBattlerCenter(DEFAULT_ENEMY_GEOMETRY);
  private readonly canvasW = CoordinateTransformer.DEFAULT_CANVAS_WIDTH;
  private readonly canvasH = CoordinateTransformer.DEFAULT_CANVAS_HEIGHT;

  public static open(): void {
    if (!AnimationGallery.instance) {
      AnimationGallery.instance = new AnimationGallery();
    }
    AnimationGallery.instance.show();
  }

  public static close(): void {
    if (AnimationGallery.instance) {
      AnimationGallery.instance.hide();
    }
  }

  private constructor() {
    this.createDom();
  }

  private createDom(): void {
    this.container = document.createElement('div');
    this.container.id = 'anim-gallery-modal';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(10, 15, 29, 0.92);
      backdrop-filter: blur(12px);
      z-index: 99999;
      display: none;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f1f5f9;
      user-select: none;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(15, 23, 42, 0.8);
    `;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 20px;">🎬</span>
        <div>
          <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #38bdf8;">Phòng Thử Nghiệm Battle Animation (Visual QA Gallery)</h2>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">Essentials/EBDX Timeline Engine — Frame scrubbing, layers, mirroring & inspector</p>
        </div>
      </div>
      <button id="btnGalleryClose" style="
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.4);
        border-radius: 6px;
        padding: 6px 14px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.2s;
      ">Đóng ✕</button>
    `;
    this.container.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.style.cssText = `
      display: flex;
      flex: 1;
      overflow: hidden;
    `;

    // Viewport
    const viewport = document.createElement('div');
    viewport.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: #090d16;
      position: relative;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvasW;
    this.canvas.height = this.canvasH;
    this.canvas.style.cssText = `
      width: min(100%, 768px);
      aspect-ratio: 512 / 288;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1);
      background: #0f172a;
      image-rendering: pixelated;
    `;
    this.ctx = this.canvas.getContext('2d');
    viewport.appendChild(this.canvas);

    // Timeline Scrub Bar below canvas
    const scrubRow = document.createElement('div');
    scrubRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      max-width: 768px;
      margin-top: 14px;
      background: rgba(30, 41, 59, 0.7);
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    `;
    scrubRow.innerHTML = `
      <button id="btnPlayPause" style="background:#38bdf8;color:#0f172a;border:none;padding:6px 14px;border-radius:6px;font-weight:700;cursor:pointer;">▶ Play</button>
      <button id="btnReplay" style="background:#475569;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">🔄 Replay</button>
      <button id="btnPrevFrame" style="background:#334155;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;">⏮</button>
      <input type="range" id="galleryScrubber" min="0" max="0" value="0" style="flex:1;accent-color:#38bdf8;cursor:pointer;">
      <button id="btnNextFrame" style="background:#334155;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;">⏭</button>
      <span id="txtFrameCounter" style="font-size:12px;font-family:monospace;min-width:90px;text-align:right;color:#38bdf8;">Frame 0 / 0</span>
    `;
    viewport.appendChild(scrubRow);
    body.appendChild(viewport);

    // Sidebar Inspector
    const sidebar = document.createElement('div');
    sidebar.style.cssText = `
      width: 380px;
      background: #0f172a;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 16px;
      gap: 16px;
    `;

    sidebar.innerHTML = `
      <!-- Move Selector -->
      <div>
        <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Chiêu thức (212 moves)</label>
        <select id="selectGalleryMove" style="width:100%;padding:8px 10px;border-radius:6px;background:#1e293b;color:#f8fafc;border:1px solid rgba(255,255,255,0.15);font-size:13px;"></select>
      </div>

      <!-- Attacker Side -->
      <div>
        <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Phía tấn công (Attacker Side)</label>
        <div style="display:flex;gap:8px;">
          <button id="btnSidePlayer" style="flex:1;padding:8px;border-radius:6px;border:1px solid #38bdf8;background:#38bdf8;color:#0f172a;font-weight:600;font-size:12px;cursor:pointer;">👤 Player (Tiêu chuẩn)</button>
          <button id="btnSideEnemy" style="flex:1;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:#1e293b;color:#94a3b8;font-weight:600;font-size:12px;cursor:pointer;">👾 Enemy (OppMove / Mirror)</button>
        </div>
      </div>

      <!-- Playback Speed & Debug Options -->
      <div style="display:flex;gap:12px;align-items:center;">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">
          <input type="checkbox" id="chkShowBounds" checked> Bounding Box & Focus
        </label>
        <select id="selectSpeed" style="padding:4px 8px;border-radius:4px;background:#1e293b;color:#fff;border:1px solid rgba(255,255,255,0.2);font-size:11px;">
          <option value="0.25">0.25x</option>
          <option value="0.5">0.5x</option>
          <option value="1.0" selected>1.0x</option>
          <option value="2.0">2.0x</option>
        </select>
      </div>

      <!-- Metadata HUD -->
      <div style="background:#1e293b;border-radius:8px;padding:12px;border:1px solid rgba(255,255,255,0.08);font-size:12px;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Animation ID:</span> <span id="hudAnimId" style="color:#38bdf8;font-family:monospace;font-weight:700;">-</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Asset Key:</span> <span id="hudAssetKey" style="color:#f8fafc;font-family:monospace;">-</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Atlas Geometry:</span> <span id="hudAtlas" style="color:#f8fafc;font-family:monospace;">-</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Total Duration:</span> <span id="hudDuration" style="color:#f8fafc;font-family:monospace;">-</span></div>
      </div>

      <!-- Active Cels Inspector -->
      <div style="flex:1;display:flex;flex-direction:column;min-height:180px;">
        <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Active Cels tại Frame hiện tại (<span id="txtCelCount">0</span> cels)</label>
        <div id="celList" style="flex:1;overflow-y:auto;background:#1e293b;border-radius:8px;padding:8px;border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:6px;max-height:240px;font-size:11px;font-family:monospace;">
        </div>
      </div>
    `;

    body.appendChild(sidebar);
    this.container.appendChild(body);
    document.body.appendChild(this.container);

    this.bindEvents();
    this.populateMoveList();
  }

  private populateMoveList(): void {
    const select = this.container?.querySelector<HTMLSelectElement>('#selectGalleryMove');
    if (!select) return;

    const moves = Object.keys(moveMapData.moves).sort();
    select.innerHTML = '';
    for (const m of moves) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = `${m.toUpperCase()} (ID: ${moveMapData.moves[m as keyof typeof moveMapData.moves]})`;
      if (m === 'tackle') opt.selected = true;
      select.appendChild(opt);
    }
  }

  private bindEvents(): void {
    const btnClose = this.container?.querySelector('#btnGalleryClose');
    btnClose?.addEventListener('click', () => this.hide());

    const selectMove = this.container?.querySelector<HTMLSelectElement>('#selectGalleryMove');
    selectMove?.addEventListener('change', () => {
      this.currentMove = selectMove.value;
      this.loadAndPlay(this.currentMove, this.currentSide);
    });

    const btnPlayer = this.container?.querySelector<HTMLButtonElement>('#btnSidePlayer');
    const btnEnemy = this.container?.querySelector<HTMLButtonElement>('#btnSideEnemy');

    btnPlayer?.addEventListener('click', () => {
      this.currentSide = 'player';
      btnPlayer.style.background = '#38bdf8';
      btnPlayer.style.color = '#0f172a';
      btnPlayer.style.borderColor = '#38bdf8';
      if (btnEnemy) {
        btnEnemy.style.background = '#1e293b';
        btnEnemy.style.color = '#94a3b8';
        btnEnemy.style.borderColor = 'rgba(255,255,255,0.2)';
      }
      this.loadAndPlay(this.currentMove, this.currentSide);
    });

    btnEnemy?.addEventListener('click', () => {
      this.currentSide = 'enemy';
      btnEnemy.style.background = '#f43f5e';
      btnEnemy.style.color = '#fff';
      btnEnemy.style.borderColor = '#f43f5e';
      if (btnPlayer) {
        btnPlayer.style.background = '#1e293b';
        btnPlayer.style.color = '#94a3b8';
        btnPlayer.style.borderColor = 'rgba(255,255,255,0.2)';
      }
      this.loadAndPlay(this.currentMove, this.currentSide);
    });

    const btnPlayPause = this.container?.querySelector<HTMLButtonElement>('#btnPlayPause');
    btnPlayPause?.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      btnPlayPause.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
      btnPlayPause.style.background = this.isPlaying ? '#f59e0b' : '#38bdf8';
    });

    const btnReplay = this.container?.querySelector('#btnReplay');
    btnReplay?.addEventListener('click', () => {
      this.currentFrame = 0;
      this.elapsedMs = 0;
      this.isPlaying = true;
      if (btnPlayPause) {
        btnPlayPause.textContent = '⏸ Pause';
        btnPlayPause.style.background = '#f59e0b';
      }
    });

    const scrubber = this.container?.querySelector<HTMLInputElement>('#galleryScrubber');
    scrubber?.addEventListener('input', () => {
      this.isPlaying = false;
      this.currentFrame = parseInt(scrubber.value, 10);
      const fps = this.currentDef?.fps || 20;
      this.elapsedMs = (this.currentFrame / fps) * 1000;
      if (btnPlayPause) {
        btnPlayPause.textContent = '▶ Play';
        btnPlayPause.style.background = '#38bdf8';
      }
      this.renderFrame();
    });

    const btnPrev = this.container?.querySelector('#btnPrevFrame');
    btnPrev?.addEventListener('click', () => {
      this.isPlaying = false;
      this.currentFrame = Math.max(0, this.currentFrame - 1);
      const fps = this.currentDef?.fps || 20;
      this.elapsedMs = (this.currentFrame / fps) * 1000;
      this.renderFrame();
    });

    const btnNext = this.container?.querySelector('#btnNextFrame');
    btnNext?.addEventListener('click', () => {
      if (!this.currentDef) return;
      this.isPlaying = false;
      this.currentFrame = Math.min(this.currentDef.frames.length - 1, this.currentFrame + 1);
      const fps = this.currentDef.fps || 20;
      this.elapsedMs = (this.currentFrame / fps) * 1000;
      this.renderFrame();
    });

    const chkBounds = this.container?.querySelector<HTMLInputElement>('#chkShowBounds');
    chkBounds?.addEventListener('change', () => {
      this.showDebugBounds = !!chkBounds.checked;
      this.renderFrame();
    });

    const selectSpeed = this.container?.querySelector<HTMLSelectElement>('#selectSpeed');
    selectSpeed?.addEventListener('change', () => {
      this.playbackSpeed = parseFloat(selectSpeed.value) || 1.0;
    });
  }

  public show(): void {
    if (!this.container) return;
    this.container.style.display = 'flex';
    this.lastTime = performance.now();
    this.loadAndPlay(this.currentMove, this.currentSide);
    this.startLoop();
  }

  public hide(): void {
    if (!this.container) return;
    this.container.style.display = 'none';
    this.isPlaying = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private async loadAndPlay(moveId: string, side: 'player' | 'enemy'): Promise<void> {
    const isEnemy = side === 'enemy';
    const animId = ANIMATION_REGISTRY.resolveAnimationId(moveId, isEnemy);
    const def = await ANIMATION_REGISTRY.getDefinition(animId);

    if (!def) {
      console.warn(`[AnimationGallery] Failed to load animation for ${moveId}`);
      return;
    }

    if (def.graphic) {
      await ANIMATION_ASSETS.loadImage(def.graphic);
    }

    this.currentDef = def;
    this.currentFrame = 0;
    this.elapsedMs = 0;
    this.isPlaying = true;
    this.timingManager.reset();

    const scrubber = this.container?.querySelector<HTMLInputElement>('#galleryScrubber');
    if (scrubber) {
      scrubber.max = String(Math.max(0, def.frames.length - 1));
      scrubber.value = '0';
    }

    const btnPlayPause = this.container?.querySelector<HTMLButtonElement>('#btnPlayPause');
    if (btnPlayPause) {
      btnPlayPause.textContent = '⏸ Pause';
      btnPlayPause.style.background = '#f59e0b';
    }

    this.updateHud(animId);
    this.renderFrame();
  }

  private updateHud(animId: number): void {
    if (!this.currentDef) return;
    const def = this.currentDef;

    const elId = this.container?.querySelector('#hudAnimId');
    if (elId) elId.textContent = `${animId} (${def.name})`;

    const elAsset = this.container?.querySelector('#hudAssetKey');
    if (elAsset)
      elAsset.textContent = def.graphic ? `animation.${def.graphic.toLowerCase()}` : 'none';

    const elAtlas = this.container?.querySelector('#hudAtlas');
    if (elAtlas) {
      const atlas = ANIMATION_ASSETS.getAtlas(def.graphic);
      elAtlas.textContent = atlas
        ? `${atlas.width}x${atlas.height} (cell: ${atlas.cellWidth}x${atlas.cellHeight})`
        : '192x192 grid';
    }

    const elDuration = this.container?.querySelector('#hudDuration');
    if (elDuration) {
      const totalMs = Math.round((def.frames.length / (def.fps || 20)) * 1000);
      elDuration.textContent = `${totalMs}ms (${def.frames.length} frames @ ${def.fps}fps)`;
    }
  }

  private startLoop = (): void => {
    const loop = (timestamp: number) => {
      const dtMs = this.lastTime > 0 ? Math.min(100, timestamp - this.lastTime) : 16.67;
      this.lastTime = timestamp;

      if (this.isPlaying && this.currentDef && this.currentDef.frames.length > 0) {
        this.elapsedMs += dtMs * this.playbackSpeed;
        const fps = this.currentDef.fps || 20;
        const frameIndex = Math.floor((this.elapsedMs / 1000) * fps);

        if (frameIndex >= this.currentDef.frames.length) {
          // Loop animation
          this.currentFrame = 0;
          this.elapsedMs = 0;
          this.timingManager.reset();
        } else if (frameIndex !== this.currentFrame) {
          this.currentFrame = frameIndex;
          this.timingManager.triggerFrameTimings(this.currentFrame, this.currentDef.timings);
          const scrubber = this.container?.querySelector<HTMLInputElement>('#galleryScrubber');
          if (scrubber) scrubber.value = String(this.currentFrame);
        }
      }

      this.renderFrame();
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  };

  private renderFrame(): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    // 1. Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    // 2. Draw mock battle ground & battler placeholders
    this.drawBattleStage(ctx);

    if (!this.currentDef) return;

    const def = this.currentDef;
    const frame = def.frames[this.currentFrame];
    if (!frame) return;

    const isEnemy = this.currentSide === 'enemy';
    const userPos = isEnemy ? this.enemyPos : this.playerPos;
    const targetPos = isEnemy ? this.playerPos : this.enemyPos;
    const move = MOVES_DB[this.currentMove] ?? MOVES_DB[this.currentMove.replace(/-/g, '_')];
    const selfTarget = move ? isSelfTargetMove(move) : false;

    // Categorize layers
    const { behindBattlers, aboveBattlers } = LayerManager.categorizeCels(frame.cels);

    // Render behind cels
    for (const cel of behindBattlers) {
      const pos = CoordinateTransformer.resolveCelPosition(
        cel.x,
        cel.y,
        cel.focus,
        userPos,
        targetPos,
        this.canvasW,
        this.canvasH,
        isEnemy,
        selfTarget
      );
      const safePos = CelRenderer.clampPositionToCanvas(
        cel,
        pos.x,
        pos.y,
        ANIMATION_ASSETS.getAtlas(def.graphic)?.cellWidth ?? 192,
        ANIMATION_ASSETS.getAtlas(def.graphic)?.cellHeight ?? 192,
        this.canvasW,
        this.canvasH
      );
      CelRenderer.renderCel(
        ctx,
        cel,
        safePos.x,
        safePos.y,
        def.graphic,
        isEnemy,
        this.canvasW,
        this.canvasH
      );
    }

    // Draw Battler Sprites / Avatars in mid-depth
    this.drawBattlerAvatars(ctx);

    // Render above cels
    for (const cel of aboveBattlers) {
      const pos = CoordinateTransformer.resolveCelPosition(
        cel.x,
        cel.y,
        cel.focus,
        userPos,
        targetPos,
        this.canvasW,
        this.canvasH,
        isEnemy,
        selfTarget
      );
      const safePos = CelRenderer.clampPositionToCanvas(
        cel,
        pos.x,
        pos.y,
        ANIMATION_ASSETS.getAtlas(def.graphic)?.cellWidth ?? 192,
        ANIMATION_ASSETS.getAtlas(def.graphic)?.cellHeight ?? 192,
        this.canvasW,
        this.canvasH
      );
      CelRenderer.renderCel(
        ctx,
        cel,
        safePos.x,
        safePos.y,
        def.graphic,
        isEnemy,
        this.canvasW,
        this.canvasH
      );

      // Debug bounds and focus points (only for effect patterns)
      if (this.showDebugBounds && cel.pattern >= 0) {
        ctx.save();
        ctx.strokeStyle = cel.priority > 0 ? '#38bdf8' : '#a855f7';
        ctx.lineWidth = 1;
        ctx.strokeRect(safePos.x - 40, safePos.y - 40, 80, 80);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(safePos.x, safePos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Flash overlay
    this.timingManager.renderScreenFlash(ctx, this.canvasW, this.canvasH);

    // Update Counter & Cel list
    const counter = this.container?.querySelector('#txtFrameCounter');
    if (counter) {
      counter.textContent = `Frame ${this.currentFrame + 1} / ${def.frames.length}`;
    }

    this.renderCelList(frame.cels);
  }

  private drawBattleStage(ctx: CanvasRenderingContext2D): void {
    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.canvasW; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasH);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvasH; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasW, y);
      ctx.stroke();
    }

    // Enemy platform at enemy base (380, 175)
    ctx.save();
    ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.enemyPos.x, DEFAULT_ENEMY_GEOMETRY.baseY - 15, 75, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.stroke();
    ctx.restore();

    // Player platform at player base (130, 280)
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    ctx.ellipse(this.playerPos.x, DEFAULT_PLAYER_GEOMETRY.baseY - 10, 95, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.stroke();
    ctx.restore();
  }

  private drawBattlerAvatars(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Enemy Avatar
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.beginPath();
    ctx.arc(this.enemyPos.x, this.enemyPos.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('ENEMY', this.enemyPos.x, this.enemyPos.y + 4);

    // Player Avatar
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(this.playerPos.x, this.playerPos.y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('PLAYER', this.playerPos.x, this.playerPos.y + 4);
    ctx.restore();
  }

  private renderCelList(cels: BattleAnimationDefinition['frames'][0]['cels']): void {
    const list = this.container?.querySelector('#celList');
    const txtCount = this.container?.querySelector('#txtCelCount');
    if (!list || !txtCount) return;

    txtCount.textContent = String(cels.length);
    list.innerHTML = '';

    if (cels.length === 0) {
      list.innerHTML =
        '<span style="color:#64748b;font-style:italic;">Không có cel nào tại frame này.</span>';
      return;
    }

    cels.forEach((cel, idx) => {
      const item = document.createElement('div');
      item.style.cssText = `
        background: rgba(15, 23, 42, 0.6);
        padding: 4px 8px;
        border-radius: 4px;
        border-left: 3px solid ${cel.priority > 0 ? '#38bdf8' : '#a855f7'};
        display: flex;
        flex-direction: column;
        gap: 2px;
      `;
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;color:#cbd5e1;">
          <strong style="color:${cel.priority > 0 ? '#38bdf8' : '#c084fc'};">Cel #${idx + 1} (Pat ${cel.pattern})</strong>
          <span>Focus: ${cel.focus} | Pri: ${cel.priority}</span>
        </div>
        <div style="color:#94a3b8;font-size:10px;">
          x:${cel.x}, y:${cel.y} | zoom:${cel.zoomX}% | angle:${cel.angle}° | blend:${cel.blendMode}
        </div>
      `;
      list.appendChild(item);
    });
  }
}

// Global hook for easy browser debugging
if (typeof window !== 'undefined') {
  (window as unknown as { __openAnimationGallery: () => void }).__openAnimationGallery = () => {
    AnimationGallery.open();
  };
}
