/**
 * Pokémon PC Storage Screen UI
 * Recreates the authentic Pokémon PC Storage screen matching Graphics/Storage assets:
 * - 512x384 pixel-perfect layout with bg.png background
 * - Left column: 6 party Pokémon slots with HP bars and status badges
 * - Right column: 324x302 Box window with authentic box_X.png wallpapers
 * - 6x5 grid (30 slots) displaying Pokémon icon sprites
 * - Interactive << and >> box switching with sound effects
 * - Deposit, Withdraw, Move/Swap, Release, and Box Rename/Wallpaper customizer
 */

import { partyService } from '../domain/party/party-service';
import type { PartyPokemon } from '../domain/party/party-state';
import { pcStorageService, BOX_CAPACITY } from '../domain/pc/pc-storage-service';
import { STORAGE_ASSETS, POKEMON_ASSETS } from '../assets';
import { battleSePlayer } from '../audio';
import { showBerryToast } from './toast';
import { PokemonSpriteAnimator } from './pokedex';
import { getAvailableLevelUpMoves, MOVES_DB } from '../battle/moves-db';
import { TYPE_ICO_INDICES } from '../battle/type-chart';
import type { BattleMove } from '../battle/types';
import { NATURES_TABLE, type StatKey } from '@pokemon/shared-types';
import { findItem } from '../data/items-db';
import { getAbilityDisplay } from '../battle/rules/ability-engine';

const STORAGE_TYPE_INDICES: Record<string, number> = {
  normal: 0,
  fighting: 1,
  flying: 2,
  poison: 3,
  ground: 4,
  rock: 5,
  bug: 6,
  ghost: 7,
  steel: 8,
  '???': 9,
  fire: 10,
  water: 11,
  grass: 12,
  electric: 13,
  psychic: 14,
  ice: 15,
  dragon: 16,
  dark: 17,
  fairy: 18,
};

const TYPE_NAME_VI: Record<string, string> = {
  normal: 'THƯỜNG',
  fighting: 'GIÁC ĐẤU',
  flying: 'BAY',
  poison: 'ĐỘC',
  ground: 'ĐẤT',
  rock: 'ĐÁ',
  bug: 'CÔN TRÙNG',
  ghost: 'MA',
  steel: 'THÉP',
  '???': '???',
  fire: 'LỬA',
  water: 'NƯỚC',
  grass: 'CỎ',
  electric: 'ĐIỆN',
  psychic: 'SIÊU LINH',
  ice: 'BĂNG',
  dragon: 'RỒNG',
  dark: 'BÓNG TỐI',
  fairy: 'TIÊN',
};

export class StorageScreen {
  private static instance: StorageScreen | null = null;
  private backdropEl: HTMLElement | null = null;
  private isOpen = false;

  // Selected / Move state
  private heldItem: {
    location: 'party' | 'box';
    slotIndex: number;
    boxIndex?: number;
    pokemon: PartyPokemon;
  } | null = null;

  // Pointer Drag state
  private activeDrag: {
    source: {
      location: 'party' | 'box';
      slotIndex: number;
      boxIndex?: number;
      pokemon: PartyPokemon;
    };
    startX: number;
    startY: number;
    sourceEl: HTMLElement;
    isDragging: boolean;
  } | null = null;
  private dragGhostEl: HTMLElement | null = null;
  private currentHoverSlot: HTMLElement | null = null;
  private justFinishedDragging = false;
  private boxNavDragTimer: number | null = null;

  // Hovered preview Pokémon
  private hoveredPokemon: PartyPokemon | null = null;

  // Detail Summary Sprite Animator
  private summaryAnimator: PokemonSpriteAnimator | null = null;
  private summaryPokemon: PartyPokemon | null = null;
  private fightButtonsImg: HTMLImageElement | null = null;
  private activeMoveDrag: {
    source: 'active' | 'pool';
    move: BattleMove;
    slotIndex?: number;
    startX: number;
    startY: number;
    sourceEl: HTMLElement;
    isDragging: boolean;
  } | null = null;
  private moveDragGhostEl: HTMLElement | null = null;
  private currentHoverMoveSlot: HTMLElement | null = null;

  // Unsubscribe callbacks
  private partyUnsub?: () => void;
  private pcUnsub?: () => void;

  private constructor() {
    this.createDom();
  }

  public static getInstance(): StorageScreen {
    if (!StorageScreen.instance) {
      StorageScreen.instance = new StorageScreen();
    }
    return StorageScreen.instance;
  }

  public isVisible(): boolean {
    return this.isOpen;
  }

  public getHoveredPokemon(): PartyPokemon | null {
    return this.hoveredPokemon;
  }

  public open(): void {
    if (!this.backdropEl) this.createDom();
    this.isOpen = true;
    this.heldItem = null;
    this.hoveredPokemon = null;

    if (this.backdropEl) {
      this.backdropEl.style.display = 'flex';
    }

    // Play PC boot sound
    battleSePlayer.playPcOpen();

    // Subscribe to party and PC storage updates
    this.partyUnsub = partyService.subscribe(() => {
      if (this.isOpen) this.render();
    });
    this.pcUnsub = pcStorageService.subscribe(() => {
      if (this.isOpen) this.render();
    });

    this.render();
  }

  public close(): void {
    this.isOpen = false;
    this.heldItem = null;
    this.hoveredPokemon = null;
    this.summaryAnimator?.stop();
    this.removeDragGhost();
    this.clearDragOverHighlights();
    this.activeDrag = null;
    if (this.boxNavDragTimer) {
      clearTimeout(this.boxNavDragTimer);
      this.boxNavDragTimer = null;
    }

    if (this.backdropEl) {
      this.backdropEl.style.display = 'none';
    }

    // Play PC shutdown sound
    battleSePlayer.playPcClose();

    if (this.partyUnsub) {
      this.partyUnsub();
      this.partyUnsub = undefined;
    }
    if (this.pcUnsub) {
      this.pcUnsub();
      this.pcUnsub = undefined;
    }
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private createDom(): void {
    if (this.backdropEl) return;

    this.backdropEl = document.createElement('div');
    this.backdropEl.id = 'storageScreenBackdrop';
    this.backdropEl.className = 'storage-screen-backdrop';
    this.backdropEl.style.display = 'none';

    this.backdropEl.innerHTML = `
      <div class="storage-screen-wrapper" id="storageScreenWrapper">
        <!-- Main Background (Graphics/Storage/bg.png) -->
        <div class="storage-bg-layer" id="storageBgLayer"></div>

        <!-- Top Header & Close Button -->
        <header class="storage-header">
          <div class="storage-system-title">
            <span class="storage-dot"></span>
            HỆ THỐNG LƯU TRỮ POKÉMON (PC)
          </div>
          <button class="storage-btn-close" id="btnStorageClose" title="Đóng PC (Esc / C)">
            <span class="storage-btn-close-icon">✕</span>
            <span class="storage-btn-close-text">THOÁT</span>
          </button>
        </header>

        <!-- Left Column: 6 Party Slots -->
        <section class="storage-party-panel" aria-label="Đội hình mang theo">
          <div class="storage-panel-header">
            <span>ĐỘI HÌNH</span>
            <span id="storagePartyCount" class="storage-count-pill">0/6</span>
          </div>
          <div class="storage-party-slots" id="storagePartySlots">
            <!-- 6 party slots generated dynamically -->
          </div>
        </section>

        <!-- Right Side: Box Storage Window (324x302) -->
        <section class="storage-box-window" id="storageBoxWindow" aria-label="Hộp lưu trữ PC">
          <!-- Box Wallpaper Layer (box_X.png) -->
          <div class="storage-box-wallpaper" id="storageBoxWallpaper"></div>

          <!-- Box Header with Nav Arrows -->
          <div class="storage-box-header">
            <button class="storage-nav-btn prev" id="btnStoragePrevBox" title="Hộp trước (Phím A / ←)" aria-label="Hộp trước"></button>
            <div class="storage-box-title" id="storageBoxTitleBtn" title="Nhấp để đổi hình nền hoặc đổi tên hộp">
              <span id="storageBoxTitleText">HỘP 1</span>
            </div>
            <button class="storage-nav-btn next" id="btnStorageNextBox" title="Hộp kế (Phím D / →)" aria-label="Hộp kế"></button>
          </div>

          <!-- 30 Pokémon Grid (6 cols x 5 rows) -->
          <div class="storage-box-grid" id="storageBoxGrid">
            <!-- 30 slots generated dynamically -->
          </div>
        </section>

        <!-- Bottom Status & Quick Preview Bar -->
        <footer class="storage-footer" id="storageFooter">
          <div class="storage-preview-info" id="storagePreviewInfo">
            <span class="storage-hint">Chọn một Pokémon để xem thông tin, di chuyển hoặc đổi chỗ.</span>
          </div>
          <div class="storage-mode-indicator" id="storageModeIndicator"></div>
        </footer>

        <!-- Context Action Popup (Rút về, Gửi vào, Di chuyển, Xem thông tin, Thả) -->
        <div class="storage-action-menu" id="storageActionMenu" style="display: none;">
          <div class="storage-action-title" id="storageActionTitle">Pokémon</div>
          <button class="storage-action-btn primary" id="btnActionPrimary">Rút về Đội hình</button>
          <button class="storage-action-btn" id="btnActionMove">Di chuyển</button>
          <button class="storage-action-btn" id="btnActionSummary">Xem chi tiết</button>
          <button class="storage-action-btn danger" id="btnActionRelease" style="display: none;">Thả tự do</button>
          <button class="storage-action-btn cancel" id="btnActionDismiss">Hủy</button>
        </div>

        <!-- Wallpaper & Name Customizer Modal -->
        <div class="storage-customize-modal" id="storageCustomizeModal" style="display: none;">
          <div class="customize-card">
            <div class="customize-header">
              <span>TÙY CHỈNH HỘP LƯU TRỮ</span>
              <button class="customize-btn-close" id="btnCustomizeClose">✕</button>
            </div>
            <div class="customize-body">
              <label class="customize-label">Tên hộp:</label>
              <input type="text" id="inputBoxName" class="customize-input" maxlength="16" placeholder="Nhập tên hộp..." />
              <label class="customize-label" style="margin-top: 10px;">Hình nền hộp (1 đến 39):</label>
              <div class="customize-wallpaper-grid" id="customizeWallpaperGrid">
                <!-- 39 wallpaper previews -->
              </div>
            </div>
            <div class="customize-footer">
              <button class="customize-btn save" id="btnCustomizeSave">LƯU THAY ĐỔI</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail Summary Modal (Expanded: Left Pokémon Summary + Right Dedicated Move Pool Rectangle) -->
      <div class="storage-summary-modal" id="storageSummaryModal" style="display: none;">
        <div class="summary-modal-inner">
          <!-- Left: Main Pokémon Summary (Spacious Layout) -->
          <div class="summary-card">
            <div class="summary-header">
              <div class="summary-header-info">
                <span class="summary-title-badge">CHI TIẾT POKÉMON</span>
                <span class="summary-name" id="storageSummaryName">Pikachu Lv.25</span>
                <span class="summary-gender" id="storageSummaryGender">♂</span>
              </div>
            </div>
            <div class="summary-body">
              <div class="summary-left">
                <div class="summary-sprite-wrap">
                  <canvas id="storageSummarySprite" class="summary-sprite" width="100" height="100"></canvas>
                </div>
                <div id="storageSummaryTypes" class="summary-types"></div>
                <div class="summary-meta-box">
                  <div class="summary-meta-row">
                    <span class="meta-label">Bắt bằng:</span>
                    <span class="meta-val" id="storageSummaryBall">POKEBALL</span>
                  </div>
                  <div class="summary-meta-row">
                    <span class="meta-label">Cấp khi bắt:</span>
                    <span class="meta-val" id="storageSummaryCaughtLv">Lv.5</span>
                  </div>
                  <div class="summary-meta-row held-row">
                    <span class="meta-label">Vật phẩm:</span>
                    <span class="meta-val held-val" id="storageSummaryHeldItem">Không có</span>
                  </div>
                  <div class="summary-meta-row ability-row">
                    <span class="meta-label">Đặc tính:</span>
                    <span class="meta-val ability-val" id="storageSummaryAbility">—</span>
                  </div>
                  <div class="summary-ability-desc" id="storageSummaryAbilityDesc">—</div>
                  <div class="summary-meta-row nature-row">
                    <span class="meta-label">Tính cách:</span>
                    <span class="meta-val nature-val" id="storageSummaryNature">Cương quyết</span>
                  </div>
                  <div class="summary-nature-effect" id="storageSummaryNatureEffect">+10% Công, -10% Công ĐB</div>
                  <div class="summary-meta-row">
                    <span class="meta-label">Kinh nghiệm:</span>
                    <span class="meta-val" id="storageSummaryExp">120 / 350</span>
                  </div>
                  <div class="summary-exp-bar-track">
                    <div class="summary-exp-bar-fill" id="storageSummaryExpBar" style="width: 30%;"></div>
                  </div>
                </div>
              </div>
              <div class="summary-right">
                <div class="summary-section summary-stats-section">
                  <div class="summary-section-header">
                    <span class="summary-section-title">CHỈ SỐ CHIẾN ĐẤU</span>
                  </div>

                  <!-- Stats Table View (with IV / EV columns) -->
                  <div class="summary-stats-table" id="storageSummaryStatsTable">
                    <div class="summary-stat-table-header">
                      <span class="col-stat-name">CHỈ SỐ</span>
                      <span class="col-stat-bar">MỨC</span>
                      <span class="col-stat-val">ĐIỂM</span>
                      <span class="col-stat-iv">IV</span>
                      <span class="col-stat-ev">EV</span>
                    </div>
                    <!-- HP -->
                    <div class="summary-stat-row">
                      <span class="stat-label">HP</span>
                      <div class="stat-bar-track">
                        <div class="stat-bar-fill hp" id="statBarHp" style="width: 90%;"></div>
                      </div>
                      <span class="stat-val hp-val" id="storageSummaryHp">50 / 50</span>
                      <span class="stat-iv-val" id="storageSummaryIvHp">31</span>
                      <span class="stat-ev-val" id="storageSummaryEvHp">0</span>
                    </div>
                    <!-- Tấn công -->
                    <div class="summary-stat-row">
                      <span class="stat-label" id="storageLabelAtk">Tấn công</span>
                      <div class="stat-bar-track">
                        <div class="stat-bar-fill atk" id="statBarAtk" style="width: 35%;"></div>
                      </div>
                      <span class="stat-val" id="storageSummaryAtk">55</span>
                      <span class="stat-iv-val" id="storageSummaryIvAtk">31</span>
                      <span class="stat-ev-val" id="storageSummaryEvAtk">252</span>
                    </div>
                    <!-- Phòng thủ -->
                    <div class="summary-stat-row">
                      <span class="stat-label" id="storageLabelDef">Phòng thủ</span>
                      <div class="stat-bar-track">
                        <div class="stat-bar-fill def" id="statBarDef" style="width: 25%;"></div>
                      </div>
                      <span class="stat-val" id="storageSummaryDef">40</span>
                      <span class="stat-iv-val" id="storageSummaryIvDef">31</span>
                      <span class="stat-ev-val" id="storageSummaryEvDef">0</span>
                    </div>
                    <!-- Công ĐB -->
                    <div class="summary-stat-row">
                      <span class="stat-label" id="storageLabelSpAtk">Công ĐB</span>
                      <div class="stat-bar-track">
                        <div class="stat-bar-fill spatk" id="statBarSpAtk" style="width: 30%;"></div>
                      </div>
                      <span class="stat-val" id="storageSummarySpAtk">50</span>
                      <span class="stat-iv-val" id="storageSummaryIvSpAtk">31</span>
                      <span class="stat-ev-val" id="storageSummaryEvSpAtk">0</span>
                    </div>
                    <!-- Thủ ĐB -->
                    <div class="summary-stat-row">
                      <span class="stat-label" id="storageLabelSpDef">Thủ ĐB</span>
                      <div class="stat-bar-track">
                        <div class="stat-bar-fill spdef" id="statBarSpDef" style="width: 30%;"></div>
                      </div>
                      <span class="stat-val" id="storageSummarySpDef">50</span>
                      <span class="stat-iv-val" id="storageSummaryIvSpDef">31</span>
                      <span class="stat-ev-val" id="storageSummaryEvSpDef">0</span>
                    </div>
                    <!-- Tốc độ -->
                    <div class="summary-stat-row">
                      <span class="stat-label" id="storageLabelSpeed">Tốc độ</span>
                      <div class="stat-bar-track">
                        <div class="stat-bar-fill speed" id="statBarSpeed" style="width: 60%;"></div>
                      </div>
                      <span class="stat-val" id="storageSummarySpeed">90</span>
                      <span class="stat-iv-val" id="storageSummaryIvSpeed">31</span>
                      <span class="stat-ev-val" id="storageSummaryEvSpeed">252</span>
                    </div>
                    <!-- Footer: Tổng EV -->
                    <div class="summary-stat-table-footer">
                      <span>Tổng nỗ lực (EVs):</span>
                      <span class="ev-total-val" id="storageSummaryTotalEv">504 / 510</span>
                    </div>
                  </div>
                </div>

                <div class="summary-section summary-moves-section">
                  <div class="summary-section-header">
                    <span class="summary-section-title">CHIÊU THỨC TRANG BỊ</span>
                    <span class="summary-hint-badge">Kéo thả để sắp xếp</span>
                  </div>
                  <div class="summary-moves-grid" id="storageSummaryMoves"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Dedicated Move Pool Rectangle Panel -->
          <div class="summary-pool-panel" id="summaryPoolPanel">
            <div class="pool-panel-header">
              <div class="pool-panel-title-wrap">
                <span class="pool-title-badge">KHO CHIÊU THỨC</span>
                <span class="pool-level-cap">≤ Lv.<span id="storageSummaryPoolLv">25</span></span>
              </div>
              <button class="summary-btn-close" id="btnStorageSummaryClose" title="Đóng bảng chi tiết (Esc)">✕ ĐÓNG</button>
            </div>
            <div class="pool-panel-hint">
              <span>Kéo thả để trang bị • Nhấp để xem thông tin chi tiết</span>
            </div>
            <div class="summary-move-pool" id="storageSummaryMovePool"></div>
          </div>
        </div>

        <!-- Move Detail Popup Card (Centered Overlay on Summary Modal) -->
        <div class="storage-move-detail-popup" id="storageMoveDetailPopup" style="display: none;">
          <div class="move-detail-card">
            <div class="move-detail-header">
              <div class="move-detail-title-group">
                <span class="move-detail-name-vi" id="moveDetailNameVi">Tia Sét</span>
                <span class="move-detail-name-en" id="moveDetailNameEn">(Thunderbolt)</span>
              </div>
              <button class="move-detail-close-btn" id="btnMoveDetailClose" title="Đóng bảng chi tiết (Esc)">✕</button>
            </div>
            <div class="move-detail-badges">
              <div class="move-detail-type-badge" id="moveDetailTypeBadge">
                <span class="storage-type-icon" id="moveDetailTypeIcon"></span>
                <span class="type-name" id="moveDetailTypeName">ĐIỆN</span>
              </div>
              <div class="move-detail-category-wrap" id="moveDetailCategoryWrap">
                <span class="move-detail-category-icon special" id="moveDetailCategoryIcon" title="Đặc Biệt"></span>
                <span class="move-detail-category-text special" id="moveDetailCategoryText">ĐẶC BIỆT</span>
              </div>
            </div>
            <div class="move-detail-stats-grid">
              <div class="move-detail-stat-box">
                <span class="stat-box-label">SỨC MẠNH</span>
                <span class="stat-box-val power" id="moveDetailPower">90</span>
              </div>
              <div class="move-detail-stat-box">
                <span class="stat-box-label">CHÍNH XÁC</span>
                <span class="stat-box-val acc" id="moveDetailAcc">100%</span>
              </div>
              <div class="move-detail-stat-box">
                <span class="stat-box-label">ĐIỂM PP</span>
                <span class="stat-box-val pp" id="moveDetailPp">15 / 15</span>
              </div>
            </div>
            <div class="move-detail-desc-box">
              <div class="move-detail-desc-label">MÔ TẢ CHIÊU THỨC</div>
              <div class="move-detail-desc-text" id="moveDetailDesc">
                Tấn công kẻ địch bằng dòng điện mạnh mẽ. Có cơ hội làm tê liệt đối thủ.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdropEl);

    // Bind event listeners
    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.backdropEl) return;

    // Close button
    const btnClose = this.backdropEl.querySelector('#btnStorageClose');
    btnClose?.addEventListener('click', () => this.close());

    // Navigation arrows
    const btnPrev = this.backdropEl.querySelector('#btnStoragePrevBox');
    btnPrev?.addEventListener('click', () => {
      battleSePlayer.playPcAccess();
      pcStorageService.prevBox();
    });

    const btnNext = this.backdropEl.querySelector('#btnStorageNextBox');
    btnNext?.addEventListener('click', () => {
      battleSePlayer.playPcAccess();
      pcStorageService.nextBox();
    });

    // Box Title button -> open customize modal
    const boxTitleBtn = this.backdropEl.querySelector('#storageBoxTitleBtn');
    boxTitleBtn?.addEventListener('click', () => this.openCustomizeModal());

    // Customize modal close & save
    const btnCustClose = this.backdropEl.querySelector('#btnCustomizeClose');
    btnCustClose?.addEventListener('click', () => this.closeCustomizeModal());

    const btnCustSave = this.backdropEl.querySelector('#btnCustomizeSave');
    btnCustSave?.addEventListener('click', () => this.saveCustomizeModal());

    // Summary modal close
    const btnSumClose = this.backdropEl.querySelector('#btnStorageSummaryClose');
    btnSumClose?.addEventListener('click', () => this.closeSummaryModal());

    const sumModalEl = this.backdropEl.querySelector('#storageSummaryModal');
    sumModalEl?.addEventListener('click', (e) => {
      if (e.target === sumModalEl) {
        this.closeSummaryModal();
      }
    });

    // Move Detail Popup close & dismiss
    const btnMoveDetailClose = this.backdropEl.querySelector('#btnMoveDetailClose');
    btnMoveDetailClose?.addEventListener('click', () => this.hideMoveDetailPopup());

    const moveDetailPopupEl = this.backdropEl.querySelector('#storageMoveDetailPopup');
    moveDetailPopupEl?.addEventListener('click', (e) => {
      if (e.target === moveDetailPopupEl) {
        this.hideMoveDetailPopup();
      }
    });

    // Context action menu dismiss
    const btnDismiss = this.backdropEl.querySelector('#btnActionDismiss');
    btnDismiss?.addEventListener('click', () => this.hideActionMenu());

    // Global keyboard listener for ESC, arrow navigation
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        const moveDetailPopup = this.backdropEl?.querySelector(
          '#storageMoveDetailPopup'
        ) as HTMLElement;
        const actionMenu = this.backdropEl?.querySelector('#storageActionMenu') as HTMLElement;
        const custModal = this.backdropEl?.querySelector('#storageCustomizeModal') as HTMLElement;
        const sumModal = this.backdropEl?.querySelector('#storageSummaryModal') as HTMLElement;

        if (moveDetailPopup && moveDetailPopup.style.display !== 'none') {
          this.hideMoveDetailPopup();
          return;
        }
        if (sumModal && sumModal.style.display !== 'none') {
          this.closeSummaryModal();
          return;
        }
        if (custModal && custModal.style.display !== 'none') {
          this.closeCustomizeModal();
          return;
        }
        if (actionMenu && actionMenu.style.display !== 'none') {
          this.hideActionMenu();
          return;
        }
        if (this.heldItem) {
          this.heldItem = null;
          this.render();
          return;
        }
        this.close();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        battleSePlayer.playPcAccess();
        pcStorageService.prevBox();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        battleSePlayer.playPcAccess();
        pcStorageService.nextBox();
      }
    });
  }

  // --- Main Render Pipeline ---

  public render(): void {
    if (!this.backdropEl || !this.isOpen) return;

    // 1. Render Left Column: 6 Party Slots
    this.renderPartySlots();

    // 2. Render Right Side: Current Box Window
    this.renderCurrentBox();

    // 3. Update Mode Indicator & Status
    this.updateModeIndicator();
  }

  private createDragGhost(pokemon: PartyPokemon, x: number, y: number): void {
    this.removeDragGhost();
    const ghost = document.createElement('div');
    ghost.className = 'storage-drag-ghost';
    ghost.id = 'storageDragGhost';
    const iconUrl = POKEMON_ASSETS.getIconSprite(pokemon.speciesKey, pokemon.isShiny);
    ghost.innerHTML = `<img src="${iconUrl}" alt="${pokemon.name}" draggable="false" />`;
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
    document.body.appendChild(ghost);
    this.dragGhostEl = ghost;
  }

  private updateDragGhost(x: number, y: number): void {
    if (this.dragGhostEl) {
      this.dragGhostEl.style.left = `${x}px`;
      this.dragGhostEl.style.top = `${y}px`;
    }
  }

  private removeDragGhost(): void {
    if (this.dragGhostEl) {
      this.dragGhostEl.remove();
      this.dragGhostEl = null;
    }
  }

  private clearDragOverHighlights(): void {
    if (this.currentHoverSlot) {
      this.currentHoverSlot.classList.remove('drag-over');
      this.currentHoverSlot = null;
    }
    if (this.backdropEl) {
      const highlighted = this.backdropEl.querySelectorAll('.drag-over');
      highlighted.forEach((el) => el.classList.remove('drag-over'));
    }
  }

  private updateDragHover(x: number, y: number): void {
    const el = document.elementFromPoint(x, y);
    const targetSlot = el?.closest('.storage-party-slot, .storage-grid-slot') as HTMLElement | null;

    if (targetSlot !== this.currentHoverSlot) {
      if (this.currentHoverSlot) {
        this.currentHoverSlot.classList.remove('drag-over');
      }
      this.currentHoverSlot = targetSlot;
      if (this.currentHoverSlot) {
        this.currentHoverSlot.classList.add('drag-over');
      }
    }

    // Hover navigation arrows << and >> to flip box
    const btnPrev = el?.closest('#btnStoragePrevBox');
    const btnNext = el?.closest('#btnStorageNextBox');
    if (btnPrev || btnNext) {
      if (!this.boxNavDragTimer) {
        this.boxNavDragTimer = window.setTimeout(() => {
          battleSePlayer.playPcAccess();
          if (btnPrev) pcStorageService.prevBox();
          else pcStorageService.nextBox();
          this.render();
          this.boxNavDragTimer = null;
        }, 450);
      }
    } else if (this.boxNavDragTimer) {
      clearTimeout(this.boxNavDragTimer);
      this.boxNavDragTimer = null;
    }
  }

  private attachPointerDrag(
    slotEl: HTMLElement,
    location: 'party' | 'box',
    slotIndex: number,
    pokemon: PartyPokemon
  ): void {
    slotEl.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0) return;

      this.activeDrag = {
        source: {
          location,
          slotIndex,
          boxIndex: location === 'box' ? pcStorageService.getCurrentBoxIndex() : undefined,
          pokemon,
        },
        startX: e.clientX,
        startY: e.clientY,
        sourceEl: slotEl,
        isDragging: false,
      };

      const onPointerMove = (moveEv: PointerEvent) => {
        if (!this.activeDrag) return;
        const dx = moveEv.clientX - this.activeDrag.startX;
        const dy = moveEv.clientY - this.activeDrag.startY;
        const dist = Math.hypot(dx, dy);

        if (!this.activeDrag.isDragging && dist > 5) {
          this.activeDrag.isDragging = true;
          this.activeDrag.sourceEl.classList.add('is-dragging');
          this.backdropEl?.classList.add('is-dragging-active');
          this.createDragGhost(this.activeDrag.source.pokemon, moveEv.clientX, moveEv.clientY);
        }

        if (this.activeDrag.isDragging) {
          this.updateDragGhost(moveEv.clientX, moveEv.clientY);
          this.updateDragHover(moveEv.clientX, moveEv.clientY);
        }
      };

      const onPointerUp = (upEv: PointerEvent) => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        if (this.boxNavDragTimer) {
          clearTimeout(this.boxNavDragTimer);
          this.boxNavDragTimer = null;
        }

        if (!this.activeDrag) return;

        if (this.activeDrag.isDragging) {
          this.activeDrag.sourceEl.classList.remove('is-dragging');
          this.backdropEl?.classList.remove('is-dragging-active');
          this.removeDragGhost();
          this.clearDragOverHighlights();

          // Identify drop target under cursor
          const targetEl = document.elementFromPoint(upEv.clientX, upEv.clientY);
          const targetSlot = targetEl?.closest(
            '.storage-party-slot, .storage-grid-slot'
          ) as HTMLElement | null;

          if (targetSlot) {
            const isParty = targetSlot.classList.contains('storage-party-slot');
            const targetIdx = parseInt(targetSlot.dataset.slotIndex || '0', 10);
            const target = {
              location: isParty ? ('party' as const) : ('box' as const),
              slotIndex: targetIdx,
              boxIndex: isParty ? undefined : pcStorageService.getCurrentBoxIndex(),
            };
            this.handleDropMove(this.activeDrag.source, target);
          }

          this.justFinishedDragging = true;
          setTimeout(() => {
            this.justFinishedDragging = false;
          }, 120);
        }

        this.activeDrag = null;
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }

  private handleDropMove(
    source: {
      location: 'party' | 'box';
      slotIndex: number;
      boxIndex?: number;
      pokemon: PartyPokemon;
    },
    target: {
      location: 'party' | 'box';
      slotIndex: number;
      boxIndex?: number;
    }
  ): void {
    if (
      source.location === target.location &&
      source.slotIndex === target.slotIndex &&
      (source.location !== 'box' || source.boxIndex === target.boxIndex)
    ) {
      return;
    }

    const res = pcStorageService.moveOrSwap(source, target);
    if (res.success) {
      battleSePlayer.playPcAccess();
      this.heldItem = null;
      this.render();
      showBerryToast(`Đã chuyển ${source.pokemon.name}!`, '#38bdf8');
    } else if (res.error) {
      showBerryToast(res.error, '#ef4444');
    }
  }

  private renderPartySlots(): void {
    const container = this.backdropEl?.querySelector('#storagePartySlots');
    const countPill = this.backdropEl?.querySelector('#storagePartyCount');
    if (!container) return;

    const party = partyService.getParty();
    if (countPill) countPill.textContent = `${party.length}/6`;

    container.innerHTML = '';

    for (let i = 0; i < 6; i++) {
      const pk = party[i] as PartyPokemon | undefined;
      const slotEl = document.createElement('div');
      slotEl.className = 'storage-party-slot';
      slotEl.dataset.slotIndex = String(i);
      if (!pk) slotEl.classList.add('empty');

      const isHeld = this.heldItem?.location === 'party' && this.heldItem.slotIndex === i;
      if (isHeld) slotEl.classList.add('held');

      if (pk) {
        if (pk.isShiny) slotEl.classList.add('is-shiny');
        const iconUrl = POKEMON_ASSETS.getIconSprite(pk.speciesKey, pk.isShiny);
        const hpPct = Math.max(0, Math.min(100, Math.round((pk.currentHp / pk.maxHp) * 100)));
        const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 20 ? '#eab308' : '#ef4444';
        const isFainted = pk.isFainted || pk.currentHp <= 0;

        slotEl.innerHTML = `
          <div class="party-slot-icon-box">
            <img class="party-slot-icon" src="${iconUrl}" alt="${pk.name}" onerror="this.style.opacity='0'" draggable="false" />
            ${
              pk.isShiny
                ? `
            <div class="shiny-sparkle-cluster">
              <span class="sp-star sp-1">✦</span>
              <span class="sp-star sp-2">✦</span>
              <span class="sp-star sp-3">✦</span>
              <span class="sp-star sp-4">✦</span>
              <span class="sp-star sp-5">✦</span>
            </div>`
                : ''
            }
          </div>
          <div class="party-slot-details">
            <div class="party-slot-top-row">
              <span class="party-slot-name">${pk.nickname || pk.name}${pk.isShiny ? ` <img class="party-slot-shiny-icon" src="${POKEMON_ASSETS.shinyIcon}" alt="Shiny" title="Shiny Pokémon" />` : ''}</span>
              <span class="party-slot-level">Lv.${pk.level}</span>
            </div>
            <div class="party-slot-hp-row">
              <div class="party-slot-hp-bar">
                <div class="party-slot-hp-fill" style="width: ${hpPct}%; background-color: ${hpColor};"></div>
              </div>
              <span class="party-slot-hp-text">${pk.currentHp}/${pk.maxHp}</span>
            </div>
            ${isFainted ? '<span class="party-slot-status-badge fainted">FNT</span>' : pk.status !== 'none' ? `<span class="party-slot-status-badge">${pk.status.toUpperCase()}</span>` : ''}
          </div>
        `;

        slotEl.addEventListener('mouseenter', () => this.showPreview(pk));
        slotEl.addEventListener('mouseleave', () => this.clearPreview());

        // Pointer-based Drag & Drop
        this.attachPointerDrag(slotEl, 'party', i, pk);

        slotEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleSlotClick('party', i, pk);
        });
      } else {
        slotEl.innerHTML = `
          <div class="party-slot-empty-label">Ô trống ${i + 1}</div>
        `;

        slotEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleSlotClick('party', i, null);
        });
      }

      container.appendChild(slotEl);
    }
  }

  private renderCurrentBox(): void {
    const curBox = pcStorageService.getCurrentBox();
    const wallpaperEl = this.backdropEl?.querySelector('#storageBoxWallpaper') as HTMLElement;
    const titleText = this.backdropEl?.querySelector('#storageBoxTitleText');
    const gridEl = this.backdropEl?.querySelector('#storageBoxGrid');

    if (!curBox || !gridEl) return;

    // Update wallpaper background image
    if (wallpaperEl) {
      const wpUrl = STORAGE_ASSETS.getBoxWallpaper(curBox.wallpaperId);
      wallpaperEl.style.backgroundImage = `url('${wpUrl}')`;
    }

    if (titleText) titleText.textContent = curBox.name;

    gridEl.innerHTML = '';

    // Render 30 slots
    for (let i = 0; i < BOX_CAPACITY; i++) {
      const pk = curBox.slots[i];
      const slotEl = document.createElement('div');
      slotEl.className = 'storage-grid-slot';
      slotEl.dataset.slotIndex = String(i);

      const isHeld =
        this.heldItem?.location === 'box' &&
        this.heldItem.boxIndex === pcStorageService.getCurrentBoxIndex() &&
        this.heldItem.slotIndex === i;

      if (isHeld) slotEl.classList.add('held');

      if (pk) {
        if (pk.isShiny) slotEl.classList.add('is-shiny');
        const iconUrl = POKEMON_ASSETS.getIconSprite(pk.speciesKey, pk.isShiny);
        slotEl.innerHTML = `
          <div class="storage-grid-icon-wrap">
            <img class="storage-grid-icon" src="${iconUrl}" alt="${pk.name}" draggable="false" />
            ${
              pk.isShiny
                ? `
            <div class="shiny-sparkle-cluster">
              <span class="sp-star sp-1">✦</span>
              <span class="sp-star sp-2">✦</span>
              <span class="sp-star sp-3">✦</span>
              <span class="sp-star sp-4">✦</span>
              <span class="sp-star sp-5">✦</span>
            </div>`
                : ''
            }
          </div>
          ${pk.isShiny ? `<img class="storage-grid-shiny-icon" src="${POKEMON_ASSETS.shinyIcon}" alt="Shiny" title="Shiny Pokémon" draggable="false" />` : ''}
          <span class="storage-grid-badge">Lv.${pk.level}</span>
        `;

        slotEl.addEventListener('mouseenter', () => this.showPreview(pk));
        slotEl.addEventListener('mouseleave', () => this.clearPreview());

        // Pointer-based Drag & Drop
        this.attachPointerDrag(slotEl, 'box', i, pk);

        slotEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleSlotClick('box', i, pk);
        });
      } else {
        slotEl.classList.add('empty');
        slotEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleSlotClick('box', i, null);
        });
      }

      gridEl.appendChild(slotEl);
    }
  }

  private handleSlotClick(
    location: 'party' | 'box',
    slotIndex: number,
    pokemon: PartyPokemon | null
  ): void {
    if (this.justFinishedDragging) {
      return;
    }

    battleSePlayer.playPcAccess();

    // 1. If currently in Move/Hold mode:
    if (this.heldItem) {
      const source = this.heldItem;
      const target = {
        location,
        slotIndex,
        boxIndex: location === 'box' ? pcStorageService.getCurrentBoxIndex() : undefined,
      };

      // Moving to same slot -> cancel
      if (
        source.location === target.location &&
        source.slotIndex === target.slotIndex &&
        (source.location !== 'box' || source.boxIndex === target.boxIndex)
      ) {
        this.heldItem = null;
        this.render();
        return;
      }

      // Execute move / swap
      const res = pcStorageService.moveOrSwap(source, target);
      if (res.success) {
        this.heldItem = null;
        this.render();
      } else if (res.error) {
        showBerryToast(res.error, '#ef4444');
      }
      return;
    }

    // 2. If slot is empty and not holding anything:
    if (!pokemon) return;

    // 3. Open context action menu for selected Pokemon
    this.openActionMenu(location, slotIndex, pokemon);
  }

  private openActionMenu(
    location: 'party' | 'box',
    slotIndex: number,
    pokemon: PartyPokemon
  ): void {
    const menuEl = this.backdropEl?.querySelector('#storageActionMenu') as HTMLElement;
    const titleEl = this.backdropEl?.querySelector('#storageActionTitle');
    const primaryBtn = this.backdropEl?.querySelector('#btnActionPrimary') as HTMLButtonElement;
    const moveBtn = this.backdropEl?.querySelector('#btnActionMove') as HTMLButtonElement;
    const summaryBtn = this.backdropEl?.querySelector('#btnActionSummary') as HTMLButtonElement;
    const releaseBtn = this.backdropEl?.querySelector('#btnActionRelease') as HTMLButtonElement;

    if (!menuEl) return;

    if (titleEl) titleEl.textContent = `${pokemon.nickname || pokemon.name} (Lv.${pokemon.level})`;

    // Configure Primary button (Withdraw vs Deposit)
    if (location === 'party') {
      primaryBtn.textContent = 'Gửi vào PC';
      primaryBtn.onclick = () => {
        this.hideActionMenu();
        const res = pcStorageService.depositFromParty(slotIndex);
        if (res.success) {
          showBerryToast(
            `Đã chuyển ${pokemon.name} vào ${pcStorageService.getCurrentBox().name}!`,
            '#38bdf8'
          );
        } else if (res.error) {
          showBerryToast(res.error, '#ef4444');
        }
      };
      if (releaseBtn) releaseBtn.style.display = 'none';
    } else {
      primaryBtn.textContent = 'Rút về Đội hình';
      primaryBtn.onclick = () => {
        this.hideActionMenu();
        const res = pcStorageService.withdrawPokemon(
          pcStorageService.getCurrentBoxIndex(),
          slotIndex
        );
        if (res.success) {
          showBerryToast(`Đã đưa ${pokemon.name} vào Đội hình!`, '#22c55e');
        } else if (res.error) {
          showBerryToast(res.error, '#ef4444');
        }
      };

      if (releaseBtn) {
        releaseBtn.style.display = 'block';
        releaseBtn.onclick = () => {
          this.hideActionMenu();
          const confirmRelease = window.confirm(
            `Bạn có chắc chắn muốn thả tự do cho ${pokemon.name} (Lv.${pokemon.level}) không?\nThao tác này không thể hoàn tác!`
          );
          if (confirmRelease) {
            const res = pcStorageService.releasePokemon(
              pcStorageService.getCurrentBoxIndex(),
              slotIndex
            );
            if (res.success) {
              showBerryToast(`Tạm biệt ${pokemon.name}! Bạn đã thả Pokémon tự do.`, '#eab308');
            }
          }
        };
      }
    }

    // Configure Move button
    moveBtn.onclick = () => {
      this.hideActionMenu();
      this.heldItem = {
        location,
        slotIndex,
        boxIndex: location === 'box' ? pcStorageService.getCurrentBoxIndex() : undefined,
        pokemon,
      };
      this.render();
    };

    // Configure Summary button
    summaryBtn.onclick = () => {
      this.hideActionMenu();
      this.openSummaryModal(pokemon);
    };

    menuEl.style.display = 'flex';
  }

  private hideActionMenu(): void {
    const menuEl = this.backdropEl?.querySelector('#storageActionMenu') as HTMLElement;
    if (menuEl) menuEl.style.display = 'none';
  }

  // --- Preview & Tooltips ---

  private showPreview(pokemon: PartyPokemon): void {
    this.hoveredPokemon = pokemon;
    const infoEl = this.backdropEl?.querySelector('#storagePreviewInfo');
    if (!infoEl) return;

    const hpStr = `${pokemon.currentHp}/${pokemon.maxHp}`;
    const statusStr = pokemon.status !== 'none' ? `[${pokemon.status.toUpperCase()}]` : '';

    const typesHtml = pokemon.types
      .map((t) => {
        const key = t.toLowerCase();
        const idx = STORAGE_TYPE_INDICES[key] ?? 0;
        const posY = -(idx * 28);
        return `<span class="storage-type-icon" title="${t}" style="background-position: 0 ${posY}px;"></span>`;
      })
      .join('');

    const abilityDisplay = getAbilityDisplay(pokemon.ability);

    infoEl.innerHTML = `
      <span class="preview-name">${pokemon.nickname || pokemon.name}${pokemon.isShiny ? ` <img class="preview-shiny-icon" src="${POKEMON_ASSETS.shinyIcon}" alt="Shiny" title="Shiny Pokémon" />` : ''}</span>
      <span class="preview-badge">Lv.${pokemon.level}</span>
      <div class="preview-types-wrap">${typesHtml}</div>
      <span class="preview-badge hp">HP: ${hpStr}</span>
      ${statusStr ? `<span class="preview-badge status">${statusStr}</span>` : ''}
      <span class="preview-badge ability" title="${abilityDisplay.descVi}">Đặc tính: ${abilityDisplay.nameVi}</span>
    `;
  }

  private clearPreview(): void {
    this.hoveredPokemon = null;
    const infoEl = this.backdropEl?.querySelector('#storagePreviewInfo');
    if (!infoEl) return;
    infoEl.innerHTML = `<span class="storage-hint">Chọn một Pokémon để xem thông tin, di chuyển hoặc đổi chỗ.</span>`;
  }

  private updateModeIndicator(): void {
    const indicatorEl = this.backdropEl?.querySelector('#storageModeIndicator');
    if (!indicatorEl) return;

    if (this.heldItem) {
      indicatorEl.innerHTML = `
        <span class="mode-held-label">
          Đang giữ: <strong>${this.heldItem.pokemon.name}</strong> • Nhấp ô đích để chuyển đến (hoặc Esc để hủy)
        </span>
      `;
    } else {
      indicatorEl.innerHTML = '';
    }
  }

  // --- Box Customizer Modal (Rename & Wallpaper) ---

  private openCustomizeModal(): void {
    const modal = this.backdropEl?.querySelector('#storageCustomizeModal') as HTMLElement;
    const inputName = this.backdropEl?.querySelector('#inputBoxName') as HTMLInputElement;
    const grid = this.backdropEl?.querySelector('#customizeWallpaperGrid');
    const curBox = pcStorageService.getCurrentBox();
    if (!modal || !curBox) return;

    if (inputName) inputName.value = curBox.name;

    if (grid) {
      grid.innerHTML = '';
      for (let wp = 1; wp <= 39; wp++) {
        const item = document.createElement('div');
        item.className = 'customize-wp-item';
        if (wp === curBox.wallpaperId) item.classList.add('selected');

        const wpUrl = STORAGE_ASSETS.getBoxWallpaper(wp);
        item.style.backgroundImage = `url('${wpUrl}')`;
        item.title = `Hình nền ${wp}`;

        item.addEventListener('click', () => {
          grid
            .querySelectorAll('.customize-wp-item')
            .forEach((el) => el.classList.remove('selected'));
          item.classList.add('selected');
          item.dataset.selectedWp = String(wp);
        });

        grid.appendChild(item);
      }
    }

    modal.style.display = 'flex';
  }

  private closeCustomizeModal(): void {
    const modal = this.backdropEl?.querySelector('#storageCustomizeModal') as HTMLElement;
    if (modal) modal.style.display = 'none';
  }

  private saveCustomizeModal(): void {
    const inputName = this.backdropEl?.querySelector('#inputBoxName') as HTMLInputElement;
    const selectedWpEl = this.backdropEl?.querySelector(
      '.customize-wp-item.selected'
    ) as HTMLElement;

    const curIdx = pcStorageService.getCurrentBoxIndex();
    if (inputName && inputName.value.trim()) {
      pcStorageService.setBoxName(curIdx, inputName.value.trim());
    }

    if (selectedWpEl?.dataset?.selectedWp) {
      const wpId = parseInt(selectedWpEl.dataset.selectedWp, 10);
      if (!isNaN(wpId)) {
        pcStorageService.setBoxWallpaper(curIdx, wpId);
      }
    }

    this.closeCustomizeModal();
    this.render();
  }

  // --- Detail Summary Modal ---

  private openSummaryModal(pokemon: PartyPokemon): void {
    const modal = this.backdropEl?.querySelector('#storageSummaryModal') as HTMLElement;
    if (!modal) return;

    const nameEl = modal.querySelector('#storageSummaryName');
    const genderEl = modal.querySelector('#storageSummaryGender');
    const spriteCanvas = modal.querySelector('#storageSummarySprite') as HTMLCanvasElement;
    const typesEl = modal.querySelector('#storageSummaryTypes');
    const hpEl = modal.querySelector('#storageSummaryHp');
    const atkEl = modal.querySelector('#storageSummaryAtk');
    const defEl = modal.querySelector('#storageSummaryDef');
    const spAtkEl = modal.querySelector('#storageSummarySpAtk');
    const spDefEl = modal.querySelector('#storageSummarySpDef');
    const speedEl = modal.querySelector('#storageSummarySpeed');

    const barHp = modal.querySelector('#statBarHp') as HTMLElement;
    const barAtk = modal.querySelector('#statBarAtk') as HTMLElement;
    const barDef = modal.querySelector('#statBarDef') as HTMLElement;
    const barSpAtk = modal.querySelector('#statBarSpAtk') as HTMLElement;
    const barSpDef = modal.querySelector('#statBarSpDef') as HTMLElement;
    const barSpeed = modal.querySelector('#statBarSpeed') as HTMLElement;

    const ballEl = modal.querySelector('#storageSummaryBall');
    const caughtLvEl = modal.querySelector('#storageSummaryCaughtLv');
    const expEl = modal.querySelector('#storageSummaryExp');
    const expBar = modal.querySelector('#storageSummaryExpBar') as HTMLElement;

    if (nameEl)
      nameEl.innerHTML = `${pokemon.nickname || pokemon.name} Lv.${pokemon.level}${pokemon.isShiny ? ` <img class="summary-shiny-icon" src="${POKEMON_ASSETS.shinyIcon}" alt="Shiny" title="Shiny Pokémon" />` : ''}`;
    if (genderEl) {
      genderEl.textContent =
        pokemon.gender === 'male' ? '♂' : pokemon.gender === 'female' ? '♀' : '';
      genderEl.className = `summary-gender ${pokemon.gender}`;
    }

    if (spriteCanvas) {
      if (!this.summaryAnimator) {
        this.summaryAnimator = new PokemonSpriteAnimator(spriteCanvas);
      }
      this.summaryAnimator.load(POKEMON_ASSETS.getFrontSprite(pokemon.speciesKey, pokemon.isShiny));
    }

    if (typesEl) {
      const typesHtml = pokemon.types
        .map((t) => {
          const key = t.toLowerCase();
          const idx = STORAGE_TYPE_INDICES[key] ?? 0;
          const posY = -(idx * 28);
          return `<span class="storage-type-icon" title="${t}" style="background-position: 0 ${posY}px;"></span>`;
        })
        .join('');
      typesEl.innerHTML = `<span style="margin-right: 4px;">Hệ:</span><div class="preview-types-wrap">${typesHtml}</div>`;
    }

    // Stats values and visual stat bars
    if (hpEl) hpEl.textContent = `${pokemon.currentHp} / ${pokemon.maxHp}`;
    if (atkEl) atkEl.textContent = String(pokemon.stats.attack);
    if (defEl) defEl.textContent = String(pokemon.stats.defense);
    if (spAtkEl) spAtkEl.textContent = String(pokemon.stats.spAtk);
    if (spDefEl) spDefEl.textContent = String(pokemon.stats.spDef);
    if (speedEl) speedEl.textContent = String(pokemon.stats.speed);

    const getStatPercent = (val: number) =>
      Math.min(100, Math.max(8, Math.round((val / 160) * 100)));
    const hpRatio = Math.min(
      100,
      Math.max(0, Math.round((pokemon.currentHp / Math.max(1, pokemon.maxHp)) * 100))
    );

    if (barHp) {
      barHp.style.width = `${hpRatio}%`;
      barHp.style.backgroundColor = hpRatio > 50 ? '#22c55e' : hpRatio > 20 ? '#eab308' : '#ef4444';
    }
    if (barAtk) barAtk.style.width = `${getStatPercent(pokemon.stats.attack)}%`;
    if (barDef) barDef.style.width = `${getStatPercent(pokemon.stats.defense)}%`;
    if (barSpAtk) barSpAtk.style.width = `${getStatPercent(pokemon.stats.spAtk)}%`;
    if (barSpDef) barSpDef.style.width = `${getStatPercent(pokemon.stats.spDef)}%`;
    if (barSpeed) barSpeed.style.width = `${getStatPercent(pokemon.stats.speed)}%`;

    if (ballEl) ballEl.textContent = pokemon.ballCaught || 'POKEBALL';
    if (caughtLvEl) caughtLvEl.textContent = `Lv.${pokemon.caughtLevel || pokemon.level}`;

    // Ability & Effect
    const abilityDisplay = getAbilityDisplay(pokemon.ability);
    const abilityEl = modal.querySelector('#storageSummaryAbility');
    const abilityDescEl = modal.querySelector('#storageSummaryAbilityDesc');
    if (abilityEl) {
      abilityEl.textContent = abilityDisplay.fullName;
    }
    if (abilityDescEl) {
      abilityDescEl.textContent = abilityDisplay.descVi;
    }

    // Nature & Effect
    const natureData = NATURES_TABLE[pokemon.nature] ?? NATURES_TABLE.Hardy;
    const natureEl = modal.querySelector('#storageSummaryNature');
    const natureEffectEl = modal.querySelector('#storageSummaryNatureEffect');
    if (natureEl) {
      natureEl.textContent = `${natureData.nameVi} (${natureData.id})`;
    }
    if (natureEffectEl) {
      natureEffectEl.textContent = natureData.descVi;
    }

    // IVs & EVs data
    const ivs = pokemon.ivs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
    const evs = pokemon.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };

    const updateIvEl = (id: string, val: number) => {
      const el = modal.querySelector(`#${id}`);
      if (el) {
        el.textContent = String(val);
        el.classList.toggle('perfect', val === 31);
      }
    };
    updateIvEl('storageSummaryIvHp', ivs.hp);
    updateIvEl('storageSummaryIvAtk', ivs.attack);
    updateIvEl('storageSummaryIvDef', ivs.defense);
    updateIvEl('storageSummaryIvSpAtk', ivs.spAtk);
    updateIvEl('storageSummaryIvSpDef', ivs.spDef);
    updateIvEl('storageSummaryIvSpeed', ivs.speed);

    const updateEvEl = (id: string, val: number) => {
      const el = modal.querySelector(`#${id}`);
      if (el) {
        el.textContent = String(val);
        el.classList.toggle('trained', val > 0);
      }
    };
    updateEvEl('storageSummaryEvHp', evs.hp);
    updateEvEl('storageSummaryEvAtk', evs.attack);
    updateEvEl('storageSummaryEvDef', evs.defense);
    updateEvEl('storageSummaryEvSpAtk', evs.spAtk);
    updateEvEl('storageSummaryEvSpDef', evs.spDef);
    updateEvEl('storageSummaryEvSpeed', evs.speed);

    const totalEv = evs.hp + evs.attack + evs.defense + evs.spAtk + evs.spDef + evs.speed;
    const totalEvEl = modal.querySelector('#storageSummaryTotalEv');
    if (totalEvEl) totalEvEl.textContent = `${totalEv} / 510`;

    // Nature buff / nerf labels
    const updateStatLabel = (elId: string, baseName: string, statKey: StatKey) => {
      const lbl = modal.querySelector(`#${elId}`);
      if (!lbl) return;
      lbl.classList.remove('nature-buff', 'nature-nerf');
      if (natureData.increasedStat === statKey) {
        lbl.textContent = `${baseName} ▲`;
        lbl.classList.add('nature-buff');
        lbl.setAttribute('title', '+10% từ tính cách');
      } else if (natureData.decreasedStat === statKey) {
        lbl.textContent = `${baseName} ▼`;
        lbl.classList.add('nature-nerf');
        lbl.setAttribute('title', '-10% từ tính cách');
      } else {
        lbl.textContent = baseName;
        lbl.removeAttribute('title');
      }
    };
    updateStatLabel('storageLabelAtk', 'Tấn công', 'attack');
    updateStatLabel('storageLabelDef', 'Phòng thủ', 'defense');
    updateStatLabel('storageLabelSpAtk', 'Công ĐB', 'spAtk');
    updateStatLabel('storageLabelSpDef', 'Thủ ĐB', 'spDef');
    updateStatLabel('storageLabelSpeed', 'Tốc độ', 'speed');
    if (expEl) expEl.textContent = `${pokemon.exp} / ${pokemon.maxExp}`;
    if (expBar) {
      const expPercent = Math.min(
        100,
        Math.max(0, Math.round((pokemon.exp / Math.max(1, pokemon.maxExp)) * 100))
      );
      expBar.style.width = `${expPercent}%`;
    }

    // Populate Held Item Info
    const heldEl = modal.querySelector('#storageSummaryHeldItem');
    if (heldEl) {
      if (pokemon.heldItem) {
        const itemDef = findItem(pokemon.heldItem);
        const name = itemDef ? itemDef.nameVi || itemDef.name : pokemon.heldItem;
        const iconSrc = itemDef?.sprite ? `/${itemDef.sprite}` : '/Graphics/Items/000.png';
        heldEl.innerHTML = `<img src="${iconSrc}" class="summary-held-icon" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;" alt="${name}" /><span>${name}</span>`;
      } else {
        heldEl.innerHTML = '<span style="color:#94a3b8;font-style:italic;">Không có</span>';
      }
    }

    // Render active moves and level-up move pool
    this.summaryPokemon = pokemon;
    this.renderSummaryMoves(pokemon);

    modal.style.display = 'flex';
  }

  private getFightButtonsImg(): HTMLImageElement {
    if (!this.fightButtonsImg) {
      const img = new Image();
      img.src = '/Graphics/Battle/battleFightButtons.png';
      this.fightButtonsImg = img;
    }
    return this.fightButtonsImg;
  }

  private renderMoveButton(canvas: HTMLCanvasElement, move: BattleMove, isHovered = false): void {
    canvas.width = 244;
    canvas.height = 44;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const img = this.getFightButtonsImg();
    const typeKey = move.type
      ? move.type.charAt(0).toUpperCase() + move.type.slice(1).toLowerCase()
      : 'Normal';
    const typeIdx = TYPE_ICO_INDICES[typeKey] ?? 0;
    const sx = isHovered ? 244 : 0;
    const sy = typeIdx * 44;

    const draw = () => {
      ctx.clearRect(0, 0, 244, 44);
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, sx, sy, 244, 44, 0, 0, 244, 44);
      } else {
        ctx.fillStyle = isHovered ? '#38bdf8' : '#1e293b';
        ctx.fillRect(0, 0, 244, 44);
      }

      // Draw Move Name
      const displayName = (move.nameVi || move.name).replace(/^[^(]+\(([^)]+)\)$/, '$1').trim();
      let fontSize = 20;
      ctx.font = `bold ${fontSize}px "VT323", monospace`;
      while (ctx.measureText(displayName).width > 140 && fontSize > 13) {
        fontSize--;
        ctx.font = `bold ${fontSize}px "VT323", monospace`;
      }
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.fillText(displayName, 38, 28);

      // Draw PP
      ctx.font = '16px "VT323", monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'right';
      ctx.fillText(`PP ${move.pp}/${move.maxPp}`, 236, 28);
    };

    if (img.complete && img.naturalWidth > 0) {
      draw();
    } else {
      draw();
      img.onload = () => {
        if (canvas.isConnected) {
          draw();
        }
      };
    }
  }

  private renderSummaryMoves(pokemon: PartyPokemon): void {
    const modal = this.backdropEl?.querySelector('#storageSummaryModal') as HTMLElement;
    if (!modal) return;

    const movesEl = modal.querySelector('#storageSummaryMoves');
    const poolEl = modal.querySelector('#storageSummaryMovePool');
    const poolLvEl = modal.querySelector('#storageSummaryPoolLv');
    if (poolLvEl) poolLvEl.textContent = String(pokemon.level);

    // 1. Render Active 4 Slots using battleFightButtons.png
    if (movesEl) {
      movesEl.innerHTML = '';
      for (let i = 0; i < 4; i++) {
        const move = pokemon.moves[i];
        const slotEl = document.createElement('div');
        slotEl.className = 'summary-move-slot';
        slotEl.dataset.slotIndex = String(i);

        if (move) {
          const canvas = document.createElement('canvas');
          canvas.className = 'move-fight-canvas';
          this.renderMoveButton(canvas, move, false);

          canvas.addEventListener('mouseenter', () => this.renderMoveButton(canvas, move, true));
          canvas.addEventListener('mouseleave', () => this.renderMoveButton(canvas, move, false));

          slotEl.appendChild(canvas);

          // Pointer-based Drag & Drop (matching storage-party-slot and storage-grid-slot)
          this.attachMovePointerDrag(slotEl, 'active', move, i, pokemon);
        } else {
          slotEl.classList.add('empty');
          slotEl.innerHTML = `<span class="move-slot-empty">+ Ô trống</span>`;
        }

        movesEl.appendChild(slotEl);
      }
    }

    // 2. Render Level-up Move Pool
    if (poolEl) {
      poolEl.innerHTML = '';
      const pool = getAvailableLevelUpMoves(pokemon.speciesKey, pokemon.level);

      if (pool.length === 0) {
        poolEl.innerHTML = `<div class="pool-empty">Không có chiêu thức nào khả dụng ở cấp này.</div>`;
        return;
      }

      for (const entry of pool) {
        const isEquipped = pokemon.moves.some((m) => m.id === entry.move.id);
        const cardEl = document.createElement('div');
        cardEl.className = `summary-pool-card ${isEquipped ? 'equipped' : ''}`;

        const lvBadge = document.createElement('span');
        lvBadge.className = 'pool-lv-badge';
        lvBadge.textContent = `Lv.${entry.level}`;

        const canvas = document.createElement('canvas');
        canvas.className = 'pool-fight-canvas';
        this.renderMoveButton(canvas, entry.move, false);

        canvas.addEventListener('mouseenter', () =>
          this.renderMoveButton(canvas, entry.move, true)
        );
        canvas.addEventListener('mouseleave', () =>
          this.renderMoveButton(canvas, entry.move, false)
        );

        cardEl.appendChild(lvBadge);
        cardEl.appendChild(canvas);

        cardEl.title = `Kéo thả vào ô chiêu thức bên trái để trang bị ${entry.move.nameVi || entry.move.name}`;

        // Pointer-based Drag & Drop (matching storage-party-slot and storage-grid-slot)
        this.attachMovePointerDrag(cardEl, 'pool', entry.move, undefined, pokemon);

        poolEl.appendChild(cardEl);
      }
    }
  }

  private attachMovePointerDrag(
    el: HTMLElement,
    source: 'active' | 'pool',
    move: BattleMove,
    slotIndex: number | undefined,
    pokemon: PartyPokemon
  ): void {
    el.addEventListener('pointerdown', (downEv: PointerEvent) => {
      if (downEv.button !== 0) return;

      this.activeMoveDrag = {
        source,
        move,
        slotIndex,
        startX: downEv.clientX,
        startY: downEv.clientY,
        sourceEl: el,
        isDragging: false,
      };

      const onPointerMove = (moveEv: PointerEvent) => {
        if (!this.activeMoveDrag) return;
        const dx = moveEv.clientX - this.activeMoveDrag.startX;
        const dy = moveEv.clientY - this.activeMoveDrag.startY;

        if (!this.activeMoveDrag.isDragging && Math.hypot(dx, dy) > 4) {
          this.activeMoveDrag.isDragging = true;
          this.activeMoveDrag.sourceEl.classList.add('dragging');
          this.createMoveDragGhost(this.activeMoveDrag.move, moveEv.clientX, moveEv.clientY);
        }

        if (this.activeMoveDrag.isDragging) {
          this.updateMoveDragGhost(moveEv.clientX, moveEv.clientY);
          this.updateMoveDragHover(moveEv.clientX, moveEv.clientY);
        }
      };

      const onPointerUp = (upEv: PointerEvent) => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        if (!this.activeMoveDrag) return;

        if (this.activeMoveDrag.isDragging) {
          this.activeMoveDrag.sourceEl.classList.remove('dragging');
          this.removeMoveDragGhost();
          this.clearMoveDragOver();

          const targetEl = document.elementFromPoint(upEv.clientX, upEv.clientY);
          const targetSlot = targetEl?.closest('.summary-move-slot') as HTMLElement | null;
          if (targetSlot) {
            const targetIdx = parseInt(targetSlot.dataset.slotIndex || '0', 10);
            this.executeMoveDrop(pokemon, targetIdx, this.activeMoveDrag);
          }
        } else {
          // Nhấp chuột (Click không kéo): Mở bảng chi tiết chiêu thức từ database
          this.showMoveDetailPopup(this.activeMoveDrag.move);
        }

        this.activeMoveDrag = null;
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }

  private createMoveDragGhost(move: BattleMove, x: number, y: number): void {
    this.removeMoveDragGhost();
    const ghost = document.createElement('div');
    ghost.className = 'move-drag-ghost';
    const canvas = document.createElement('canvas');
    canvas.className = 'move-fight-canvas';
    this.renderMoveButton(canvas, move, true);
    ghost.appendChild(canvas);
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
    document.body.appendChild(ghost);
    this.moveDragGhostEl = ghost;
  }

  private updateMoveDragGhost(x: number, y: number): void {
    if (this.moveDragGhostEl) {
      this.moveDragGhostEl.style.left = `${x}px`;
      this.moveDragGhostEl.style.top = `${y}px`;
    }
  }

  private removeMoveDragGhost(): void {
    if (this.moveDragGhostEl) {
      this.moveDragGhostEl.remove();
      this.moveDragGhostEl = null;
    }
  }

  private updateMoveDragHover(x: number, y: number): void {
    const el = document.elementFromPoint(x, y);
    const targetSlot = el?.closest('.summary-move-slot') as HTMLElement | null;

    if (targetSlot !== this.currentHoverMoveSlot) {
      if (this.currentHoverMoveSlot) {
        this.currentHoverMoveSlot.classList.remove('drag-over');
      }
      this.currentHoverMoveSlot = targetSlot;
      if (this.currentHoverMoveSlot) {
        this.currentHoverMoveSlot.classList.add('drag-over');
      }
    }
  }

  private clearMoveDragOver(): void {
    if (this.currentHoverMoveSlot) {
      this.currentHoverMoveSlot.classList.remove('drag-over');
      this.currentHoverMoveSlot = null;
    }
    if (this.backdropEl) {
      this.backdropEl.querySelectorAll('.summary-move-slot.drag-over').forEach((s) => {
        s.classList.remove('drag-over');
      });
    }
  }

  private executeMoveDrop(
    pokemon: PartyPokemon,
    targetSlotIndex: number,
    dragData: { source: 'active' | 'pool'; move: BattleMove; slotIndex?: number }
  ): void {
    const targetPokemon = this.summaryPokemon ?? pokemon;
    const { source, move, slotIndex: sourceSlotIndex } = dragData;

    if (source === 'active' && sourceSlotIndex !== undefined) {
      if (sourceSlotIndex === targetSlotIndex) return;
      // Swap active moves
      const newMoves = [...targetPokemon.moves];
      const sourceMove = newMoves[sourceSlotIndex];
      const targetMove = newMoves[targetSlotIndex];
      if (sourceMove) {
        if (targetMove) {
          newMoves[sourceSlotIndex] = targetMove;
          newMoves[targetSlotIndex] = sourceMove;
        } else {
          newMoves.splice(sourceSlotIndex, 1);
          newMoves.splice(targetSlotIndex, 0, sourceMove);
        }
        this.setPokemonMoves(targetPokemon, newMoves.filter(Boolean));
      }
    } else if (source === 'pool') {
      const newMoves = [...targetPokemon.moves];
      const existingIdx = newMoves.findIndex((m) => m.id === move.id);
      if (existingIdx !== -1) {
        // Already equipped: swap positions
        const temp = newMoves[targetSlotIndex];
        newMoves[targetSlotIndex] = newMoves[existingIdx];
        if (temp) {
          newMoves[existingIdx] = temp;
        } else {
          newMoves.splice(existingIdx, 1);
        }
      } else {
        // Not yet equipped: replace or add
        if (targetSlotIndex < newMoves.length) {
          newMoves[targetSlotIndex] = { ...move };
        } else {
          newMoves.push({ ...move });
        }
      }
      this.setPokemonMoves(targetPokemon, newMoves.filter(Boolean));
    }
  }

  private setPokemonMoves(pokemon: PartyPokemon, newMoves: BattleMove[]): void {
    pokemon.moves = [...newMoves];
    partyService.updatePokemonMoves(pokemon.uid, newMoves);
    pcStorageService.updatePokemonMoves(pokemon.uid, newMoves);
    battleSePlayer.playPcAccess();
    const updatedName = newMoves[newMoves.length - 1]?.nameVi || 'mới';
    showBerryToast(`✨ Đã trang bị chiêu [${updatedName}] cho ${pokemon.name}!`, '#22c55e');
    this.renderSummaryMoves(pokemon);
  }

  private showMoveDetailPopup(move: BattleMove): void {
    if (!this.backdropEl) return;
    const popup = this.backdropEl.querySelector('#storageMoveDetailPopup') as HTMLElement;
    if (!popup) return;

    // Get move data with database fallback
    const dbMove = MOVES_DB[move.id] || move;

    const nameViEl = popup.querySelector('#moveDetailNameVi');
    const nameEnEl = popup.querySelector('#moveDetailNameEn');
    const typeIconEl = popup.querySelector('#moveDetailTypeIcon') as HTMLElement;
    const typeNameEl = popup.querySelector('#moveDetailTypeName');
    const catIconEl = popup.querySelector('#moveDetailCategoryIcon') as HTMLElement;
    const catTextEl = popup.querySelector('#moveDetailCategoryText');
    const powerEl = popup.querySelector('#moveDetailPower');
    const accEl = popup.querySelector('#moveDetailAcc');
    const ppEl = popup.querySelector('#moveDetailPp');
    const descEl = popup.querySelector('#moveDetailDesc');

    // Names
    const viName = dbMove.nameVi || dbMove.name.replace(/\s*\([^)]*\)/, '') || move.name;
    const enName = dbMove.nameEn || (dbMove.name.match(/\(([^)]+)\)/)?.[1] ?? '');
    if (nameViEl) nameViEl.textContent = viName;
    if (nameEnEl) nameEnEl.textContent = enName ? `(${enName})` : '';

    // Type
    const typeKey = (dbMove.type || 'normal').toLowerCase();
    const typeIdx = STORAGE_TYPE_INDICES[typeKey] ?? 0;
    const posY = -(typeIdx * 28);
    if (typeIconEl) {
      typeIconEl.style.backgroundPosition = `0 ${posY}px`;
      typeIconEl.title = dbMove.type;
    }
    if (typeNameEl) {
      typeNameEl.textContent = TYPE_NAME_VI[typeKey] || dbMove.type.toUpperCase();
    }

    // Category (Vật Lý / Đặc Biệt / Trạng Thái) từ Graphics/Move/status move/category.png
    const cat = dbMove.category || 'physical';
    if (catIconEl) {
      catIconEl.className = `move-detail-category-icon ${cat}`;
      catIconEl.title =
        cat === 'physical' ? 'Vật Lý' : cat === 'special' ? 'Đặc Biệt' : 'Trạng Thái';
    }
    if (catTextEl) {
      catTextEl.className = `move-detail-category-text ${cat}`;
      if (cat === 'physical') {
        catTextEl.textContent = 'VẬT LÝ';
      } else if (cat === 'special') {
        catTextEl.textContent = 'ĐẶC BIỆT';
      } else {
        catTextEl.textContent = 'TRẠNG THÁI';
      }
    }

    // Power
    if (powerEl) {
      if (dbMove.category === 'status' || !dbMove.power || dbMove.power === 0) {
        powerEl.textContent = '--';
      } else {
        powerEl.textContent = String(dbMove.power);
      }
    }

    // Accuracy
    if (accEl) {
      if (!dbMove.accuracy || dbMove.accuracy === 0) {
        accEl.textContent = '--';
      } else {
        accEl.textContent = `${dbMove.accuracy}%`;
      }
    }

    // PP
    if (ppEl) {
      const curPp = move.pp !== undefined ? move.pp : (dbMove.pp ?? 20);
      const maxPp = dbMove.maxPp || move.maxPp || dbMove.pp || 20;
      ppEl.textContent = `${curPp} / ${maxPp}`;
    }

    // Description from database
    if (descEl) {
      const desc =
        dbMove.descriptionVi ||
        dbMove.description ||
        move.description ||
        'Chưa có thông tin mô tả cho chiêu thức này.';
      descEl.textContent = desc;
    }

    battleSePlayer.playPcAccess();
    popup.style.display = 'flex';
  }

  private hideMoveDetailPopup(): void {
    if (!this.backdropEl) return;
    const popup = this.backdropEl.querySelector('#storageMoveDetailPopup') as HTMLElement;
    if (popup) popup.style.display = 'none';
  }

  private closeSummaryModal(): void {
    this.hideMoveDetailPopup();
    this.removeMoveDragGhost();
    this.clearMoveDragOver();
    this.activeMoveDrag = null;
    this.summaryAnimator?.stop();
    this.summaryPokemon = null;
    const modal = this.backdropEl?.querySelector('#storageSummaryModal') as HTMLElement;
    if (modal) modal.style.display = 'none';
  }
}

export const storageScreen = StorageScreen.getInstance();
