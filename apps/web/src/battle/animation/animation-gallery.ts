import { ANIMATION_REGISTRY } from './animation-registry';
import { ANIMATION_ASSETS } from './animation-assets';
import {
  CoordinateTransformer,
  getBattlerCenter,
  DEFAULT_PLAYER_GEOMETRY,
  DEFAULT_ENEMY_GEOMETRY,
  isDirectionReversed,
  DEFAULT_ANIMATION_VIEWPORT,
} from './coordinate-transformer';
import { CelRenderer, shouldMirrorCel } from './cel-renderer';
import { LayerManager } from './layer-manager';
import { TimingEventManager } from './timing-events';
import type { BattleAnimationDefinition, AnimationViewport } from './types';
import moveMapData from '../../../../../packages/game-data/move-animation-map.json';
import moveExtensionData from '../../../../../packages/game-data/move-animation-extensions.json';
import reunionMovesData from '../../../../../packages/game-data/reunion-moves.json';
import { MOVES_DB } from '../moves-db';
import { isSelfTargetMove } from '../move-vfx';
import {
  isKnownDuplicateAnimationCel,
  shouldPreserveAnimationCurve,
  deduplicateAnimationCels,
} from './animation-overrides';

const GALLERY_MOVE_MAP: Record<string, number> = {
  ...moveMapData.moves,
  ...moveExtensionData.moves,
  ...(moveExtensionData.replacedMoves ?? {}),
};

const MULTI_HIT_MOVES = new Set([
  'comet_punch',
  'double_slap',
  'doubleslap',
  'double_kick',
  'fury_attack',
  'fury_swipes',
  'pin_missile',
  'spike_cannon',
  'icicle_spear',
  'bullet_seed',
  'barrage',
  'bone_rush',
  'rock_blast',
  'arm_thrust',
  'tail_slap',
]);

export class AnimationGallery {
  private static instance: AnimationGallery | null = null;
  private container: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private currentMove = 'tackle';
  private currentSide: 'player' | 'enemy' = 'player';
  private currentHitNum = 0;
  private currentFilter:
    'all' | 'reunion_all' | 'reunion_optimized' | 'both' | 'multihit' | 'extended' | 'updated' =
    'all';
  private currentDef: BattleAnimationDefinition | null = null;
  private currentFrame = 0;
  private isPlaying = false;
  private playbackSpeed = 1.0;
  private showDebugBounds = true;
  private clipViewport = true;

  private animFrameId: number | null = null;
  private lastTime = 0;
  private elapsedMs = 0;
  private timingManager: TimingEventManager = new TimingEventManager();

  private readonly playerPos = getBattlerCenter(DEFAULT_PLAYER_GEOMETRY);
  private readonly enemyPos = getBattlerCenter(DEFAULT_ENEMY_GEOMETRY);
  private readonly canvasW = CoordinateTransformer.DEFAULT_CANVAS_WIDTH;
  private readonly canvasH = CoordinateTransformer.DEFAULT_CANVAS_HEIGHT;
  private readonly viewport: AnimationViewport = DEFAULT_ANIMATION_VIEWPORT;

  private lastRenderedCelFrame = -1;
  private lastRenderedMove = '';
  private cachedStageCanvas: HTMLCanvasElement | null = null;

  // Cached DOM elements to eliminate expensive querySelector calls during 60fps loop
  private elFrameCounter: HTMLElement | null = null;
  private elCelList: HTMLElement | null = null;
  private elCelCount: HTMLElement | null = null;
  private elScrubber: HTMLInputElement | null = null;
  private elPlayPauseBtn: HTMLButtonElement | null = null;

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
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">Essentials/EBDX Timeline Engine — Frame scrubbing, layers, flight vectors & multi-hit</p>
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
      gap: 14px;
    `;

    sidebar.innerHTML = `
      <!-- Move Filter & Move Selector -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;">Danh sách chiêu thức</label>
          <button id="btnReloadDef" style="background:#334155;color:#38bdf8;border:1px solid rgba(56,189,248,0.3);border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer;">🔄 Tải lại Def</button>
        </div>
        <select id="selectGalleryFilter" style="width:100%;margin-bottom:6px;padding:6px 8px;border-radius:6px;background:#1e293b;color:#f8fafc;border:1px solid rgba(255,255,255,0.15);font-size:12px;">
          <option value="all">Full animation move (${Object.keys(GALLERY_MOVE_MAP).length} moves)</option>
          <option value="reunion_all">Move Pokemon Reunion EX Trilogy 4.2 (${reunionMovesData.allReunionMoves.length} moves)</option>
          <option value="reunion_optimized">Chiêu thức Pokemon Reunion EX Trilogy 4.2 đã tối ưu như bản gốc (${reunionMovesData.optimizedMoves.length} moves)</option>
          <option value="both">Chỉ chiêu Both Focus (Projectiles đường đạn)</option>
          <option value="multihit">Chỉ chiêu Multi-Hit (Hit 1–5)</option>
        </select>
        <select id="selectGalleryMove" style="width:100%;padding:8px 10px;border-radius:6px;background:#1e293b;color:#f8fafc;border:1px solid rgba(255,255,255,0.15);font-size:13px;"></select>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button id="btnPrevMove" style="flex:1;padding:6px 8px;border-radius:5px;border:1px solid rgba(56,189,248,0.35);background:#1e293b;color:#bae6fd;font-size:11px;font-weight:600;cursor:pointer;">◀ Chiêu trước</button>
          <button id="btnNextMove" style="flex:1;padding:6px 8px;border-radius:5px;border:1px solid rgba(56,189,248,0.35);background:#1e293b;color:#bae6fd;font-size:11px;font-weight:600;cursor:pointer;">Chiêu sau ▶</button>
        </div>
        <button id="btnCopyMove" style="width:100%;margin-top:6px;padding:6px 8px;border-radius:5px;border:1px solid rgba(167,139,250,0.45);background:#1e293b;color:#ddd6fe;font-size:11px;font-weight:600;cursor:pointer;">📋 Copy tên chiêu</button>
      </div>

      <!-- Attacker Side -->
      <div>
        <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Phe thi triển (Attacker Side)</label>
        <div style="display:flex;gap:8px;">
          <button id="btnSidePlayer" style="flex:1;padding:8px;border-radius:6px;border:1px solid #38bdf8;background:#38bdf8;color:#0f172a;font-weight:600;font-size:12px;cursor:pointer;">👤 Player (Tiêu chuẩn)</button>
          <button id="btnSideEnemy" style="flex:1;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:#1e293b;color:#94a3b8;font-weight:600;font-size:12px;cursor:pointer;">👾 Enemy (OppMove / Mirror)</button>
        </div>
      </div>

      <!-- Multi-hit HitNum Selector -->
      <div>
        <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Lượt đánh Multi-Hit (hitNum)</label>
        <select id="selectGalleryHit" style="width:100%;padding:6px 8px;border-radius:6px;background:#1e293b;color:#f8fafc;border:1px solid rgba(255,255,255,0.15);font-size:12px;">
          <option value="0">Hit 1 (hitNum: 0 — Gốc)</option>
          <option value="1">Hit 2 (hitNum: 1 — Biến thể)</option>
          <option value="2">Hit 3 (hitNum: 2 — Biến thể)</option>
          <option value="3">Hit 4 (hitNum: 3 — Biến thể)</option>
          <option value="4">Hit 5 (hitNum: 4 — Biến thể)</option>
        </select>
      </div>

      <!-- Playback Speed & Debug Options -->
      <div style="display:flex;flex-direction:column;gap:8px;background:rgba(30,41,59,0.5);padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:#94a3b8;">Tốc độ phát:</span>
          <select id="selectSpeed" style="padding:3px 8px;border-radius:4px;background:#1e293b;color:#fff;border:1px solid rgba(255,255,255,0.2);font-size:11px;">
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1.0" selected>1.0x</option>
            <option value="2.0">2.0x</option>
          </select>
        </div>
        <div style="display:flex;gap:16px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;">
            <input type="checkbox" id="chkShowBounds" checked> Bounds & Vector
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;">
            <input type="checkbox" id="chkClipViewport" checked> Clip Viewport
          </label>
        </div>
      </div>

      <!-- Metadata HUD -->
      <div style="background:#1e293b;border-radius:8px;padding:12px;border:1px solid rgba(255,255,255,0.08);font-size:12px;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Source Pack:</span> <span id="hudSourcePack" style="color:#38bdf8;font-family:monospace;font-weight:700;">-</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Animation ID:</span> <span id="hudAnimId" style="color:#38bdf8;font-family:monospace;font-weight:700;">-</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Asset Key:</span> <span id="hudAssetKey" style="color:#f8fafc;font-family:monospace;">-</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Atlas Geometry:</span> <span id="hudAtlas" style="color:#f8fafc;font-family:monospace;">-</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Total Duration:</span> <span id="hudDuration" style="color:#f8fafc;font-family:monospace;">-</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Flight Direction:</span> <span id="hudFlightDir" style="color:#38bdf8;font-family:monospace;">-</span></div>
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

    this.elFrameCounter = this.container.querySelector('#txtFrameCounter');
    this.elCelList = this.container.querySelector('#celList');
    this.elCelCount = this.container.querySelector('#txtCelCount');
    this.elScrubber = this.container.querySelector('#galleryScrubber');
    this.elPlayPauseBtn = this.container.querySelector('#btnPlayPause');
    this.initCachedStageCanvas();

    this.bindEvents();
    this.populateMoveList();
  }

  private initCachedStageCanvas(): void {
    if (typeof document === 'undefined') return;
    this.cachedStageCanvas = document.createElement('canvas');
    this.cachedStageCanvas.width = this.canvasW;
    this.cachedStageCanvas.height = this.canvasH;
    const ctx = this.cachedStageCanvas.getContext('2d');
    if (!ctx) return;

    // Subtle grid lines with a single batched path
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < this.canvasW; x += 32) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasH);
    }
    for (let y = 0; y < this.canvasH; y += 32) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasW, y);
    }
    ctx.stroke();

    // Enemy platform at enemy base
    ctx.save();
    ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.enemyPos.x, DEFAULT_ENEMY_GEOMETRY.baseY - 15, 75, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.stroke();
    ctx.restore();

    // Player platform at player base
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    ctx.ellipse(this.playerPos.x, DEFAULT_PLAYER_GEOMETRY.baseY - 10, 95, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.stroke();
    ctx.restore();
  }

  private populateMoveList(): void {
    const select = this.container?.querySelector<HTMLSelectElement>('#selectGalleryMove');
    if (!select) return;

    const moves = this.getFilteredMoveKeys();

    const optSet = new Set(reunionMovesData.optimizedMoves);
    const allReunionSet = new Set(reunionMovesData.allReunionMoves);

    select.innerHTML = '';
    for (const m of moves) {
      const opt = document.createElement('option');
      opt.value = m;
      let badge = '';
      if (optSet.has(m)) {
        badge = ' [1:1 REUNION]';
      } else if (allReunionSet.has(m)) {
        badge = ' [REUNION 4.2]';
      } else if (ANIMATION_REGISTRY.isExtensionMove(m)) {
        badge = ' [EBDX/LC]';
      }
      opt.textContent = `${m.toUpperCase()}${badge} (ID: ${GALLERY_MOVE_MAP[m]})`;
      if (m === this.currentMove) opt.selected = true;
      select.appendChild(opt);
    }

    if (!moves.includes(this.currentMove) && moves.length > 0) {
      this.currentMove = moves[0];
      select.value = this.currentMove;
    }
  }

  private getFilteredMoveKeys(): string[] {
    let moves = Object.keys(GALLERY_MOVE_MAP).sort();
    if (this.currentFilter === 'reunion_optimized') {
      const optSet = new Set(reunionMovesData.optimizedMoves);
      moves = moves.filter((m) => optSet.has(m));
    } else if (this.currentFilter === 'reunion_all') {
      const allReunionSet = new Set(reunionMovesData.allReunionMoves);
      moves = moves.filter((m) => allReunionSet.has(m));
    } else if (this.currentFilter === 'updated') {
      moves = moves.filter((m) => ANIMATION_REGISTRY.isReplacedMove(m));
    } else if (this.currentFilter === 'extended') {
      moves = moves.filter((m) => ANIMATION_REGISTRY.isExtensionMove(m));
    } else if (this.currentFilter === 'multihit') {
      moves = moves.filter(
        (m) =>
          MULTI_HIT_MOVES.has(m) || m.includes('fury') || m.includes('punch') || m.includes('slap')
      );
    }
    return moves;
  }

  private selectAdjacentMove(direction: -1 | 1): void {
    const select = this.container?.querySelector<HTMLSelectElement>('#selectGalleryMove');
    const moves = this.getFilteredMoveKeys();
    if (!select || moves.length === 0) return;

    const currentIndex = moves.indexOf(this.currentMove);
    const nextIndex = (Math.max(0, currentIndex) + direction + moves.length) % moves.length;
    this.currentMove = moves[nextIndex];
    select.value = this.currentMove;
    this.loadAndPlay(this.currentMove, this.currentSide);
  }

  private async copyCurrentMoveName(): Promise<void> {
    const button = this.container?.querySelector<HTMLButtonElement>('#btnCopyMove');
    if (!button) return;

    const moveName = this.currentMove;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(moveName);
      } else {
        const helper = document.createElement('textarea');
        helper.value = moveName;
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
      }

      button.textContent = '✅ Đã copy';
      window.setTimeout(() => {
        button.textContent = '📋 Copy tên chiêu';
      }, 1200);
    } catch {
      button.textContent = '❌ Copy thất bại';
      window.setTimeout(() => {
        button.textContent = '📋 Copy tên chiêu';
      }, 1200);
    }
  }

  private bindEvents(): void {
    const btnClose = this.container?.querySelector('#btnGalleryClose');
    btnClose?.addEventListener('click', () => this.hide());

    const selectFilter = this.container?.querySelector<HTMLSelectElement>('#selectGalleryFilter');
    selectFilter?.addEventListener('change', () => {
      this.currentFilter = selectFilter.value as
        'all' | 'reunion_all' | 'reunion_optimized' | 'both' | 'multihit' | 'extended' | 'updated';
      this.populateMoveList();
      this.loadAndPlay(this.currentMove, this.currentSide);
    });

    const selectMove = this.container?.querySelector<HTMLSelectElement>('#selectGalleryMove');
    selectMove?.addEventListener('change', () => {
      this.currentMove = selectMove.value;
      this.loadAndPlay(this.currentMove, this.currentSide);
    });

    const btnPrevMove = this.container?.querySelector<HTMLButtonElement>('#btnPrevMove');
    const btnNextMove = this.container?.querySelector<HTMLButtonElement>('#btnNextMove');
    const btnCopyMove = this.container?.querySelector<HTMLButtonElement>('#btnCopyMove');
    btnPrevMove?.addEventListener('click', () => this.selectAdjacentMove(-1));
    btnNextMove?.addEventListener('click', () => this.selectAdjacentMove(1));
    btnCopyMove?.addEventListener('click', () => void this.copyCurrentMoveName());

    const selectHit = this.container?.querySelector<HTMLSelectElement>('#selectGalleryHit');
    selectHit?.addEventListener('change', () => {
      this.currentHitNum = parseInt(selectHit.value, 10) || 0;
      this.loadAndPlay(this.currentMove, this.currentSide);
    });

    const btnReload = this.container?.querySelector('#btnReloadDef');
    btnReload?.addEventListener('click', () => {
      ANIMATION_REGISTRY.clearCache();
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
      this.timingManager.reset(true);
      if (this.currentDef) {
        this.timingManager.triggerFrameTimings(0, this.currentDef.timings);
      }
      if (this.elScrubber) {
        this.elScrubber.value = '0';
      }
      if (btnPlayPause) {
        btnPlayPause.textContent = '⏸ Pause';
        btnPlayPause.style.background = '#f59e0b';
      }
    });

    const scrubber = this.container?.querySelector<HTMLInputElement>('#galleryScrubber');
    scrubber?.addEventListener('input', () => {
      this.isPlaying = false;
      const targetFrame = parseInt(scrubber.value, 10);
      this.currentFrame = targetFrame;
      const fps = this.currentDef?.fps || 20;
      this.elapsedMs = (this.currentFrame / fps) * 1000;
      this.timingManager.reset(true);
      if (this.currentDef) {
        this.timingManager.triggerFrameTimings(targetFrame, this.currentDef.timings);
      }
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
      this.timingManager.reset(true);
      if (this.currentDef) {
        this.timingManager.triggerFrameTimings(this.currentFrame, this.currentDef.timings);
      }
      if (this.elScrubber) {
        this.elScrubber.value = String(this.currentFrame);
      }
      this.renderFrame();
    });

    const btnNext = this.container?.querySelector('#btnNextFrame');
    btnNext?.addEventListener('click', () => {
      if (!this.currentDef) return;
      this.isPlaying = false;
      this.currentFrame = Math.min(this.currentDef.frames.length - 1, this.currentFrame + 1);
      const fps = this.currentDef.fps || 20;
      this.elapsedMs = (this.currentFrame / fps) * 1000;
      this.timingManager.reset(true);
      if (this.currentDef) {
        this.timingManager.triggerFrameTimings(this.currentFrame, this.currentDef.timings);
      }
      if (this.elScrubber) {
        this.elScrubber.value = String(this.currentFrame);
      }
      this.renderFrame();
    });

    const chkBounds = this.container?.querySelector<HTMLInputElement>('#chkShowBounds');
    chkBounds?.addEventListener('change', () => {
      this.showDebugBounds = !!chkBounds.checked;
      this.renderFrame();
    });

    const chkClip = this.container?.querySelector<HTMLInputElement>('#chkClipViewport');
    chkClip?.addEventListener('change', () => {
      this.clipViewport = !!chkClip.checked;
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
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.loadAndPlay(this.currentMove, this.currentSide);
    this.startLoop();
  }

  public hide(): void {
    if (!this.container) return;
    this.container.style.display = 'none';
    this.isPlaying = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.timingManager.reset();
  }

  private async loadAndPlay(moveId: string, side: 'player' | 'enemy'): Promise<void> {
    // 1. Immediately silence and stop any sound effects playing from previous animation
    this.timingManager.reset();
    this.lastRenderedCelFrame = -1;
    this.lastRenderedMove = '';

    const isEnemy = side === 'enemy';
    const animId = ANIMATION_REGISTRY.resolveAnimationId(
      moveId,
      isEnemy,
      undefined,
      undefined,
      this.currentHitNum
    );
    const def = await ANIMATION_REGISTRY.getDefinition(animId);

    if (!def) {
      console.warn(`[AnimationGallery] Failed to load animation for ${moveId}`);
      return;
    }

    if (def.graphic) {
      try {
        const graphics = new Set<string>([
          def.graphic,
          ...def.frames.flatMap((frame) =>
            frame.cels.flatMap((cel) => (cel.graphic ? [cel.graphic] : []))
          ),
        ]);
        await Promise.all([...graphics].map((graphic) => ANIMATION_ASSETS.loadImage(graphic)));
      } catch (err) {
        console.warn(`[AnimationGallery] Could not preload image ${def.graphic}:`, err);
      }
    }

    this.currentDef = def;
    this.currentFrame = 0;
    this.elapsedMs = 0;
    this.isPlaying = true;
    this.timingManager.triggerFrameTimings(0, def.timings);

    if (this.elScrubber) {
      this.elScrubber.max = String(Math.max(0, def.frames.length - 1));
      this.elScrubber.value = '0';
    }

    if (this.elPlayPauseBtn) {
      this.elPlayPauseBtn.textContent = '⏸ Pause';
      this.elPlayPauseBtn.style.background = '#f59e0b';
    }

    this.updateHud(animId);
    this.renderFrame();
  }

  private updateHud(animId: number): void {
    if (!this.currentDef) return;
    const def = this.currentDef;

    const elSource = this.container?.querySelector('#hudSourcePack') as HTMLElement | null;
    if (elSource) {
      if (reunionMovesData.optimizedMoves.includes(this.currentMove)) {
        elSource.textContent = 'Pokemon Reunion EX Trilogy 4.2 (Tối ưu chuẩn 1:1)';
        elSource.style.color = '#34d399';
      } else if (reunionMovesData.allReunionMoves.includes(this.currentMove)) {
        elSource.textContent = 'Pokemon Reunion EX Trilogy 4.2 (Gốc)';
        elSource.style.color = '#38bdf8';
      } else if (ANIMATION_REGISTRY.isReplacedMove(this.currentMove)) {
        elSource.textContent = 'EBDX / Last Chance (Cập nhật thay thế)';
        elSource.style.color = '#a78bfa';
      } else if (def.sourcePack) {
        elSource.textContent = def.sourcePack;
        elSource.style.color = '#38bdf8';
      } else {
        elSource.textContent = 'Essentials Base Pack';
        elSource.style.color = '#94a3b8';
      }
    }

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

    const elFlight = this.container?.querySelector('#hudFlightDir') as HTMLElement | null;
    if (elFlight) {
      const userPos = this.currentSide === 'enemy' ? this.enemyPos : this.playerPos;
      const targetPos = this.currentSide === 'enemy' ? this.playerPos : this.enemyPos;
      const reversed = isDirectionReversed(
        CoordinateTransformer.SRC_USER,
        CoordinateTransformer.SRC_TARGET,
        userPos,
        targetPos
      );
      elFlight.textContent = reversed ? 'REVERSED (Right → Left)' : 'STANDARD (Left → Right)';
      elFlight.style.color = reversed ? '#f43f5e' : '#38bdf8';
    }
  }

  private startLoop = (): void => {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const loop = (timestamp: number) => {
      const dtMs = this.lastTime > 0 ? Math.min(100, timestamp - this.lastTime) : 16.67;
      this.lastTime = timestamp;

      if (this.isPlaying && this.currentDef && this.currentDef.frames.length > 0) {
        this.elapsedMs += dtMs * this.playbackSpeed;
        const fps = this.currentDef.fps || 20;
        const frameIndex = Math.floor((this.elapsedMs / 1000) * fps);

        if (frameIndex >= this.currentDef.frames.length) {
          // Loop animation: allow previous sounds to finish naturally, reset executed event indices
          this.timingManager.reset(false);
          this.currentFrame = 0;
          this.elapsedMs = 0;
          this.timingManager.triggerFrameTimings(0, this.currentDef.timings);
          if (this.elScrubber) {
            this.elScrubber.value = '0';
          }
        } else if (frameIndex > this.currentFrame) {
          for (let f = this.currentFrame + 1; f <= frameIndex; f++) {
            this.timingManager.triggerFrameTimings(f, this.currentDef.timings);
            this.timingManager.updateFlashes();
          }
          this.currentFrame = frameIndex;
          if (this.elScrubber) {
            this.elScrubber.value = String(this.currentFrame);
          }
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

    const isEnemy = this.currentSide === 'enemy';
    const userPos = isEnemy ? this.enemyPos : this.playerPos;
    const targetPos = isEnemy ? this.playerPos : this.enemyPos;

    // 3. Draw flight path vector line & arrow if enabled
    if (this.showDebugBounds) {
      this.drawFlightVector(ctx, userPos, targetPos);
    }

    if (!this.currentDef) return;

    const def = this.currentDef;
    const frame = def.frames[this.currentFrame];
    if (!frame) return;

    const move = MOVES_DB[this.currentMove] ?? MOVES_DB[this.currentMove.replace(/-/g, '_')];
    const selfTarget = move ? isSelfTargetMove(move) : false;
    const isOppMove =
      isEnemy &&
      ANIMATION_REGISTRY.isOpponentAnimation(def.id, def.name);
    const isFlightReversed = isDirectionReversed(
      CoordinateTransformer.SRC_USER,
      CoordinateTransformer.SRC_TARGET,
      userPos,
      targetPos
    );

    // Categorize layers
    const { behindBattlers, aboveBattlers } = LayerManager.categorizeCels(
      deduplicateAnimationCels(def.id, frame.cels)
    );

    // Viewport clip wrapper
    if (this.clipViewport) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
      ctx.clip();
    }

    // Render behind cels
    for (const cel of behindBattlers) {
      if (isKnownDuplicateAnimationCel(def.id, cel)) continue;
      const pos = CoordinateTransformer.resolveCelPosition(
        cel.mirrorPositionOnEnemy && isEnemy ? CoordinateTransformer.SRC_WIDTH - cel.x : cel.x,
        cel.mirrorPositionOnEnemy && isEnemy
          ? CoordinateTransformer.SRC_USER.y + CoordinateTransformer.SRC_TARGET.y - cel.y
          : cel.y,
        cel.focus,
        userPos,
        targetPos,
        this.viewport,
        isEnemy,
        selfTarget,
        false,
        shouldPreserveAnimationCurve(def.id, cel),
        isOppMove,
        def.id,
        cel.pattern
      );
      CelRenderer.renderCel(
        ctx,
        cel,
        pos.x,
        pos.y,
        cel.graphic ?? def.graphic,
        isFlightReversed && String(def.id) !== '351',
        this.viewport,
        undefined,
        isEnemy
      );
    }

    // Draw Battler Sprites / Avatars in mid-depth
    this.drawBattlerAvatars(ctx);

    // Render above cels
    for (const cel of aboveBattlers) {
      if (isKnownDuplicateAnimationCel(def.id, cel)) continue;
      const pos = CoordinateTransformer.resolveCelPosition(
        cel.mirrorPositionOnEnemy && isEnemy ? CoordinateTransformer.SRC_WIDTH - cel.x : cel.x,
        cel.mirrorPositionOnEnemy && isEnemy
          ? CoordinateTransformer.SRC_USER.y + CoordinateTransformer.SRC_TARGET.y - cel.y
          : cel.y,
        cel.focus,
        userPos,
        targetPos,
        this.viewport,
        isEnemy,
        selfTarget,
        false,
        shouldPreserveAnimationCurve(def.id, cel),
        isOppMove,
        def.id,
        cel.pattern
      );
      CelRenderer.renderCel(
        ctx,
        cel,
        pos.x,
        pos.y,
        cel.graphic ?? def.graphic,
        isFlightReversed && String(def.id) !== '351',
        this.viewport,
        undefined,
        isEnemy
      );

      // Debug bounds and focus points (only for effect patterns)
      if (this.showDebugBounds && cel.pattern >= 0) {
        const atlas = ANIMATION_ASSETS.getAtlas(def.graphic);
        const cellW = atlas ? atlas.cellWidth : 192;
        const cellH = atlas ? atlas.cellHeight : 192;
        const scaleX = cel.zoomX / 100;
        const scaleY = cel.zoomY / 100;
        const w = (cellW * scaleX) / 2;
        const h = (cellH * scaleY) / 2;

        ctx.save();
        ctx.strokeStyle = cel.priority > 0 ? '#38bdf8' : '#a855f7';
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x - w, pos.y - h, w * 2, h * 2);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Flash overlay
    this.timingManager.renderScreenFlash(ctx, this.canvasW, this.canvasH);

    if (this.clipViewport) {
      ctx.restore();
    }

    // Update Counter & Cel list ONLY when frame or move changed
    const frameChanged =
      this.currentFrame !== this.lastRenderedCelFrame || this.currentMove !== this.lastRenderedMove;

    if (frameChanged) {
      if (this.elFrameCounter) {
        this.elFrameCounter.textContent = `Frame ${this.currentFrame + 1} / ${def.frames.length}`;
      }
      this.renderCelList(frame.cels, userPos, targetPos, isFlightReversed, selfTarget);
      this.lastRenderedCelFrame = this.currentFrame;
      this.lastRenderedMove = this.currentMove;
    }
  }

  private drawFlightVector(
    ctx: CanvasRenderingContext2D,
    userPos: { x: number; y: number },
    targetPos: { x: number; y: number }
  ): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(userPos.x, userPos.y);
    ctx.lineTo(targetPos.x, targetPos.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrowhead pointing from user to target
    const angle = Math.atan2(targetPos.y - userPos.y, targetPos.x - userPos.x);
    const midX = (userPos.x + targetPos.x) / 2;
    const midY = (userPos.y + targetPos.y) / 2;
    const headLen = 10;

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(
      midX - headLen * Math.cos(angle - Math.PI / 6),
      midY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      midX - headLen * Math.cos(angle + Math.PI / 6),
      midY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawBattleStage(ctx: CanvasRenderingContext2D): void {
    if (!this.cachedStageCanvas) {
      this.initCachedStageCanvas();
    }
    if (this.cachedStageCanvas) {
      ctx.drawImage(this.cachedStageCanvas, 0, 0);
    }
  }

  private drawBattlerAvatars(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Enemy Avatar
    const isEnemyTarget = this.currentSide !== 'enemy';
    const enemyFlash = this.timingManager.getActiveBattlerFlashes(isEnemyTarget);
    ctx.fillStyle = enemyFlash
      ? `rgba(${enemyFlash[0]}, ${enemyFlash[1]}, ${enemyFlash[2]}, 0.85)`
      : '#f43f5e';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.beginPath();
    ctx.arc(this.enemyPos.x, this.enemyPos.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('ENEMY', this.enemyPos.x, this.enemyPos.y + 4);

    // Player Avatar
    const isPlayerTarget = this.currentSide === 'enemy';
    const playerFlash = this.timingManager.getActiveBattlerFlashes(isPlayerTarget);
    ctx.fillStyle = playerFlash
      ? `rgba(${playerFlash[0]}, ${playerFlash[1]}, ${playerFlash[2]}, 0.85)`
      : '#0284c7';
    ctx.beginPath();
    ctx.arc(this.playerPos.x, this.playerPos.y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('PLAYER', this.playerPos.x, this.playerPos.y + 4);
    ctx.restore();
  }

  private renderCelList(
    cels: BattleAnimationDefinition['frames'][0]['cels'],
    userPos: { x: number; y: number },
    targetPos: { x: number; y: number },
    isFlightReversed: boolean,
    selfTarget: boolean
  ): void {
    const list = this.elCelList ?? this.container?.querySelector('#celList');
    const txtCount = this.elCelCount ?? this.container?.querySelector('#txtCelCount');
    if (!list || !txtCount) return;

    txtCount.textContent = String(cels.length);

    if (cels.length === 0) {
      list.innerHTML =
        '<span style="color:#64748b;font-style:italic;">Không có cel nào tại frame này.</span>';
      return;
    }

    const itemsHtml = cels
      .map((cel, idx) => {
        const isOppMove =
          this.currentSide === 'enemy' &&
          Boolean(this.currentDef && ANIMATION_REGISTRY.isOpponentAnimation(this.currentDef.id, this.currentDef.name));
        const pos = CoordinateTransformer.resolveCelPosition(
          cel.x,
          cel.y,
          cel.focus,
          userPos,
          targetPos,
          this.viewport,
          this.currentSide === 'enemy',
          selfTarget,
          false,
          cel.curve === 'arc',
          isOppMove,
          this.currentDef?.id,
          cel.pattern
        );
        const shouldMirror = shouldMirrorCel(cel, isFlightReversed);

        return `
          <div style="background: rgba(15, 23, 42, 0.6); padding: 4px 8px; border-radius: 4px; border-left: 3px solid ${
            cel.priority > 0 ? '#38bdf8' : '#a855f7'
          }; display: flex; flex-direction: column; gap: 2px;">
            <div style="display:flex;justify-content:space-between;color:#cbd5e1;">
              <strong style="color:${cel.priority > 0 ? '#38bdf8' : '#c084fc'};">Cel #${idx + 1} (Pat ${cel.pattern})</strong>
              <span>Focus: ${cel.focus} | Pri: ${cel.priority}</span>
            </div>
            <div style="color:#94a3b8;font-size:10px;">
              raw: (${cel.x}, ${cel.y}) ➔ pos: (${Math.round(pos.x)}, ${Math.round(pos.y)})
            </div>
            <div style="color:#64748b;font-size:10px;">
              zoom:${cel.zoomX}% | angle:${cel.angle}° | mirror:${cel.mirror ? 'true' : 'false'} (draw:${shouldMirror ? 'rev' : 'norm'})
            </div>
          </div>
        `;
      })
      .join('');

    list.innerHTML = itemsHtml;
  }
}

// Global hook for easy browser debugging
if (typeof window !== 'undefined') {
  (window as unknown as { __openAnimationGallery: () => void }).__openAnimationGallery = () => {
    AnimationGallery.open();
  };
}
