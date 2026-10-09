/**
 * Party Screen UI
 * Renders the 6-Pokémon team menu using authentic Graphics/Party assets.
 */

import { partyService } from '../domain/party/party-service';
import { pcStorageService } from '../domain/pc/pc-storage-service';
import type { PartyPokemon } from '../domain/party/party-state';
import { PARTY_ASSETS, POKEMON_ASSETS } from '../assets';
import { showBerryToast } from './toast';
import { PokemonSpriteAnimator } from './pokedex';
import { getAvailableLevelUpMoves, MOVES_DB } from '../battle/moves-db';
import { TYPE_ICO_INDICES } from '../battle/type-chart';
import type { BattleMove } from '../battle/types';
import { battleSePlayer } from '../audio';
import { NATURES_TABLE, type StatKey } from '@pokemon/shared-types';
import { findItem } from '../data/items-db';
import { inventoryService } from '../domain/inventory/inventory-service';
import { BagScreen, type BagItemEntry } from './bag-screen';
import { getAbilityDisplay } from '../battle/rules/ability-engine';

export interface BattleSelectOptions {
  currentBattlerUid?: string;
  onSelect: (selectedPk: PartyPokemon) => void;
  onCancel?: () => void;
}

export interface PartySelectOptions {
  mode: 'battle' | 'use_item' | 'give_item';
  prompt?: string;
  item?: BagItemEntry;
  currentBattlerUid?: string;
  onSelect: (selectedPk: PartyPokemon, slotIndex: number) => void;
  onCancel?: () => void;
}

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

export class PartyScreen {
  private static instance: PartyScreen | null = null;
  private backdropEl: HTMLElement | null = null;
  private isOpen = false;
  private selectedIndex = 0;
  private swapSourceIndex: number | null = null;
  private activeMenuIndex: number | null = null;
  private summaryPokemon: PartyPokemon | null = null;
  private summaryAnimator: PokemonSpriteAnimator | null = null;
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
  private selectOptions: PartySelectOptions | null = null;
  private onLeaderChangeCallback?: (newLeader: PartyPokemon) => void;

  private constructor() {
    this.createDom();
    partyService.subscribe(() => {
      if (this.isOpen) {
        this.render();
      }
    });
  }

  public static getInstance(): PartyScreen {
    if (!PartyScreen.instance) {
      PartyScreen.instance = new PartyScreen();
    }
    return PartyScreen.instance;
  }

  public setOnLeaderChange(cb: (newLeader: PartyPokemon) => void): void {
    this.onLeaderChangeCallback = cb;
  }

  public isVisible(): boolean {
    return this.isOpen;
  }

  public open(): void {
    if (!this.backdropEl) this.createDom();
    this.isOpen = true;
    this.selectOptions = null;
    this.swapSourceIndex = null;
    this.activeMenuIndex = null;
    this.summaryPokemon = null;
    if (this.backdropEl) {
      this.backdropEl.style.display = 'flex';
    }
    this.render();
  }

  public openForSelect(options: PartySelectOptions): void {
    if (!this.backdropEl) this.createDom();
    this.isOpen = true;
    this.selectOptions = options;
    this.swapSourceIndex = null;
    this.activeMenuIndex = null;
    this.summaryPokemon = null;
    if (this.backdropEl) {
      this.backdropEl.style.display = 'flex';
    }
    this.render();
  }

  public openForBattleSelect(options: BattleSelectOptions): void {
    this.openForSelect({
      mode: 'battle',
      currentBattlerUid: options.currentBattlerUid,
      onSelect: (selectedPk) => options.onSelect(selectedPk),
      onCancel: options.onCancel,
    });
  }

  public close(notifyCancel = true): void {
    const wasSelect = this.selectOptions;
    this.isOpen = false;
    this.selectOptions = null;
    this.swapSourceIndex = null;
    this.activeMenuIndex = null;
    this.closeSummaryModal();
    if (this.backdropEl) {
      this.backdropEl.style.display = 'none';
    }
    if (notifyCancel && wasSelect?.onCancel) {
      wasSelect.onCancel();
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
    this.backdropEl.id = 'partyScreenBackdrop';
    this.backdropEl.className = 'party-screen-backdrop';
    this.backdropEl.style.display = 'none';
    this.backdropEl.style.setProperty('--party-bg', `url('${PARTY_ASSETS.bg}')`);
    this.backdropEl.style.setProperty('--party-gender', `url('${PARTY_ASSETS.battlerGender}')`);
    this.backdropEl.style.setProperty('--party-cancel', `url('${PARTY_ASSETS.cancel}')`);
    this.backdropEl.style.setProperty('--party-cancel-sel', `url('${PARTY_ASSETS.cancelSel}')`);

    this.backdropEl.innerHTML = `
      <div class="party-screen-wrapper" id="partyScreenWrapper">
        <!-- Background Frame (512x384) -->
        <div class="party-bg-layer"></div>

        <!-- 6 Pokémon Slots Container -->
        <div class="party-slots-container" id="partySlotsContainer">
          <!-- Rendered dynamically -->
        </div>

        <!-- Bottom Message & Prompt Box -->
        <div class="party-msg-box" id="partyMsgBox">
          <span id="partyMsgText">Chọn pokemon.</span>
        </div>

        <!-- Cancel / Exit Button (partyCancel.png) -->
        <button class="party-btn-cancel" id="btnPartyCancel" title="Trở về (Esc / P)">
          <span class="party-cancel-text">THOÁT</span>
        </button>

        <!-- Context Action Popup (Đổi chỗ, Xem tóm tắt, Ra trận) -->
        <div class="party-action-menu" id="partyActionMenu" style="display: none;">
          <div class="party-action-title" id="partyActionTitle">TÙY CHỌN</div>
          <button class="party-action-btn action-sendout" id="btnActionSendOut" style="display: none;">
            <span class="action-btn-arrow">▶</span>
            <span class="action-btn-text">Ra chiến đấu</span>
          </button>
          <button class="party-action-btn" id="btnActionSwap">
            <span class="action-btn-arrow">▶</span>
            <span class="action-btn-text">Đổi vị trí</span>
          </button>
          <button class="party-action-btn" id="btnActionSummary">
            <span class="action-btn-arrow">▶</span>
            <span class="action-btn-text">Xem thông tin</span>
          </button>
          <button class="party-action-btn" id="btnActionTakeItem" style="display: none;">
            <span class="action-btn-arrow">▶</span>
            <span class="action-btn-text">Gỡ vật phẩm</span>
          </button>
          <button class="party-action-btn" id="btnActionGiveItem">
            <span class="action-btn-arrow">▶</span>
            <span class="action-btn-text">Trao vật phẩm</span>
          </button>
          <button class="party-action-btn cancel" id="btnActionDismiss">
            <span class="action-btn-arrow">▶</span>
            <span class="action-btn-text">Đóng</span>
          </button>
        </div>
      </div>

      <!-- Detail Summary Modal (100% Matching PC Storage Layout) -->
      <div class="storage-summary-modal" id="partySummaryModal" style="display: none;">
        <div class="summary-modal-inner">
          <!-- Left: Main Pokémon Summary (Spacious Layout) -->
          <div class="summary-card">
            <div class="summary-header">
              <div class="summary-header-info">
                <span class="summary-title-badge">CHI TIẾT POKÉMON</span>
                <span class="summary-name" id="partySummaryName">Pikachu Lv.25</span>
                <span class="summary-gender" id="partySummaryGender">♂</span>
              </div>
            </div>
            <div class="summary-body">
              <div class="summary-left">
                <div class="summary-sprite-wrap">
                  <canvas id="partySummarySprite" class="summary-sprite" width="100" height="100"></canvas>
                </div>
                <div id="partySummaryTypes" class="summary-types"></div>
                <div class="summary-meta-box">
                  <div class="summary-meta-row">
                    <span class="meta-label">Bắt bằng:</span>
                    <span class="meta-val" id="partySummaryBall">POKEBALL</span>
                  </div>
                  <div class="summary-meta-row">
                    <span class="meta-label">Cấp khi bắt:</span>
                    <span class="meta-val" id="partySummaryCaughtLv">Lv.5</span>
                  </div>
                  <div class="summary-meta-row held-row">
                    <span class="meta-label">Vật phẩm:</span>
                    <span class="meta-val held-val" id="partySummaryHeldItem">Không có</span>
                  </div>
                  <div class="summary-meta-row ability-row">
                    <span class="meta-label">Đặc tính:</span>
                    <span class="meta-val ability-val" id="partySummaryAbility">—</span>
                  </div>
                  <div class="summary-ability-desc" id="partySummaryAbilityDesc">—</div>
                  <div class="summary-meta-row nature-row">
                    <span class="meta-label">Tính cách:</span>
                    <span class="meta-val nature-val" id="partySummaryNature">Cương quyết</span>
                  </div>
                  <div class="summary-nature-effect" id="partySummaryNatureEffect">+10% Công, -10% Công ĐB</div>
                  <div class="summary-meta-row">
                    <span class="meta-label">Kinh nghiệm:</span>
                    <span class="meta-val" id="partySummaryExp">120 / 350</span>
                  </div>
                  <div class="summary-exp-bar-track">
                    <div class="summary-exp-bar-fill" id="partySummaryExpBar" style="width: 30%;"></div>
                  </div>
                </div>
              </div>
              <div class="summary-right">
                <div class="summary-section summary-stats-section">
                  <div class="summary-section-header">
                    <span class="summary-section-title">CHỈ SỐ CHIẾN ĐẤU</span>
                  </div>

                  <!-- Stats Table View (with IV / EV columns) -->
                  <div class="summary-stats-table" id="partySummaryStatsTable">
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
                        <div class="stat-bar-fill hp" id="partyStatBarHp" style="width: 90%;"></div>
                      </div>
                      <span class="stat-val hp-val" id="partySummaryHp">50 / 50</span>
                      <span class="stat-iv-val" id="partySummaryIvHp">31</span>
                      <span class="stat-ev-val" id="partySummaryEvHp">0</span>
                    </div>
                    <!-- Tấn công -->
                    <div class="summary-stat-row">
                      <span class="stat-label" id="partyLabelAtk">Tấn công</span>
                      <div class="stat-bar-track">
                        <div class="stat-bar-fill atk" id="partyStatBarAtk" style="width: 35%;"></div>
                      </div>
                      <span class="stat-val" id="partySummaryAtk">55</span>
                      <span class="stat-iv-val" id="partySummaryIvAtk">31</span>
                      <span class="stat-ev-val" id="partySummaryEvAtk">252</span>
                    </div>
                    <!-- Phòng thủ -->
                    <div class="summary-stat-row">
                      <span class="stat-label" id="partyLabelDef">Phòng thủ</span>
                      <div class="stat-bar-track">
                        <div class="stat-bar-fill def" id="partyStatBarDef" style="width: 25%;"></div>
                      </div>
                      <span class="stat-val" id="partySummaryDef">40</span>
                      <span class="stat-iv-val" id="partySummaryIvDef">31</span>
                      <span class="stat-ev-val" id="partySummaryEvDef">0</span>
                    </div>
                    <!-- Công ĐB -->
                    <div class="summary-stat-row">
                      <span class="stat-label" id="partyLabelSpAtk">Công ĐB</span>
                      <div class="stat-bar-track">
                        <div class="stat-bar-fill spatk" id="partyStatBarSpAtk" style="width: 30%;"></div>
                      </div>
                      <span class="stat-val" id="partySummarySpAtk">50</span>
                      <span class="stat-iv-val" id="partySummaryIvSpAtk">31</span>
                      <span class="stat-ev-val" id="partySummaryEvSpAtk">0</span>
                    </div>
                    <!-- Thủ ĐB -->
                    <div class="summary-stat-row">
                      <span class="stat-label" id="partyLabelSpDef">Thủ ĐB</span>
                      <div class="stat-bar-track">
                        <div class="stat-bar-fill spdef" id="partyStatBarSpDef" style="width: 30%;"></div>
                      </div>
                      <span class="stat-val" id="partySummarySpDef">50</span>
                      <span class="stat-iv-val" id="partySummaryIvSpDef">31</span>
                      <span class="stat-ev-val" id="partySummaryEvSpDef">0</span>
                    </div>
                    <!-- Tốc độ -->
                    <div class="summary-stat-row">
                      <span class="stat-label" id="partyLabelSpeed">Tốc độ</span>
                      <div class="stat-bar-track">
                        <div class="stat-bar-fill speed" id="partyStatBarSpeed" style="width: 60%;"></div>
                      </div>
                      <span class="stat-val" id="partySummarySpeed">90</span>
                      <span class="stat-iv-val" id="partySummaryIvSpeed">31</span>
                      <span class="stat-ev-val" id="partySummaryEvSpeed">252</span>
                    </div>
                    <!-- Footer: Tổng EV -->
                    <div class="summary-stat-table-footer">
                      <span>Tổng nỗ lực (EVs):</span>
                      <span class="ev-total-val" id="partySummaryTotalEv">504 / 510</span>
                    </div>
                  </div>
                </div>

                <div class="summary-section summary-moves-section">
                  <div class="summary-section-header">
                    <span class="summary-section-title">CHIÊU THỨC TRANG BỊ</span>
                    <span class="summary-hint-badge">Kéo thả để sắp xếp</span>
                  </div>
                  <div class="summary-moves-grid" id="partySummaryMoves"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Dedicated Move Pool Rectangle Panel -->
          <div class="summary-pool-panel" id="partySummaryPoolPanel">
            <div class="pool-panel-header">
              <div class="pool-panel-title-wrap">
                <span class="pool-title-badge">KHO CHIÊU THỨC</span>
                <span class="pool-level-cap">≤ Lv.<span id="partySummaryPoolLv">25</span></span>
              </div>
              <button class="summary-btn-close" id="btnPartySummaryClose" title="Đóng bảng chi tiết (Esc)">✕ ĐÓNG</button>
            </div>
            <div class="pool-panel-hint">
              <span>Kéo thả để trang bị • Nhấp để xem thông tin chi tiết</span>
            </div>
            <div class="summary-move-pool" id="partySummaryMovePool"></div>
          </div>
        </div>

        <!-- Move Detail Popup Card (Centered Overlay on Summary Modal) -->
        <div class="storage-move-detail-popup" id="partyMoveDetailPopup" style="display: none;">
          <div class="move-detail-card">
            <div class="move-detail-header">
              <div class="move-detail-title-group">
                <span class="move-detail-name-vi" id="partyMoveDetailNameVi">Tia Sét</span>
                <span class="move-detail-name-en" id="partyMoveDetailNameEn">(Thunderbolt)</span>
              </div>
              <button class="move-detail-close-btn" id="btnPartyMoveDetailClose" title="Đóng bảng chi tiết (Esc)">✕</button>
            </div>
            <div class="move-detail-badges">
              <div class="move-detail-type-badge" id="partyMoveDetailTypeBadge">
                <span class="storage-type-icon" id="partyMoveDetailTypeIcon"></span>
                <span class="type-name" id="partyMoveDetailTypeName">ĐIỆN</span>
              </div>
              <div class="move-detail-category-wrap" id="partyMoveDetailCategoryWrap">
                <span class="move-detail-category-icon special" id="partyMoveDetailCategoryIcon" title="Đặc Biệt"></span>
                <span class="move-detail-category-text special" id="partyMoveDetailCategoryText">ĐẶC BIỆT</span>
              </div>
            </div>
            <div class="move-detail-stats-grid">
              <div class="move-detail-stat-box">
                <span class="stat-box-label">SỨC MẠNH</span>
                <span class="stat-box-val power" id="partyMoveDetailPower">90</span>
              </div>
              <div class="move-detail-stat-box">
                <span class="stat-box-label">CHÍNH XÁC</span>
                <span class="stat-box-val acc" id="partyMoveDetailAcc">100%</span>
              </div>
              <div class="move-detail-stat-box">
                <span class="stat-box-label">ĐIỂM PP</span>
                <span class="stat-box-val pp" id="partyMoveDetailPp">15 / 15</span>
              </div>
            </div>
            <div class="move-detail-desc-box">
              <div class="move-detail-desc-label">MÔ TẢ CHIÊU THỨC</div>
              <div class="move-detail-desc-text" id="partyMoveDetailDesc">
                Tấn công kẻ địch bằng dòng điện mạnh mẽ. Có cơ hội làm tê liệt đối thủ.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdropEl);

    // Bind Close events
    const btnCancel = this.backdropEl.querySelector('#btnPartyCancel');

    btnCancel?.addEventListener('click', () => this.close());

    btnCancel?.addEventListener('mouseenter', () => {
      this.selectedIndex = 6;
      this.updateCancelButtonState();
    });
    btnCancel?.addEventListener('mouseleave', () => {
      if (this.selectedIndex === 6) {
        this.selectedIndex = 0;
        this.updateCancelButtonState();
        this.renderSlotsSelection();
      }
    });

    // Action Menu Buttons
    const btnSendOut = this.backdropEl.querySelector('#btnActionSendOut');
    const btnSwap = this.backdropEl.querySelector('#btnActionSwap');
    const btnSummary = this.backdropEl.querySelector('#btnActionSummary');
    const btnDismiss = this.backdropEl.querySelector('#btnActionDismiss');

    btnSendOut?.addEventListener('click', () => {
      if (this.activeMenuIndex !== null && this.selectOptions) {
        const pk = partyService.getPokemon(this.activeMenuIndex);
        if (pk) {
          if (this.selectOptions.mode === 'battle') {
            if (
              this.selectOptions.currentBattlerUid &&
              pk.uid === this.selectOptions.currentBattlerUid
            ) {
              showBerryToast(`⚠️ ${pk.name} hiện đang ở trên sân đấu!`, '#eab308');
              return;
            }
            if (pk.isFainted || pk.currentHp <= 0) {
              showBerryToast(`⚠️ ${pk.name} đã gục ngã, không thể ra trận!`, '#ef4444');
              return;
            }
            const cb = this.selectOptions.onSelect;
            const slotIdx = this.activeMenuIndex;
            this.selectOptions = null;
            this.activeMenuIndex = null;
            this.close(false);
            cb(pk, slotIdx);
          } else {
            // mode is 'use_item' or 'give_item'
            const cb = this.selectOptions.onSelect;
            const slotIdx = this.activeMenuIndex;
            this.activeMenuIndex = null;
            this.render();
            cb(pk, slotIdx);
          }
        }
      }
    });

    btnSwap?.addEventListener('click', () => {
      if (this.activeMenuIndex !== null) {
        this.swapSourceIndex = this.activeMenuIndex;
        this.activeMenuIndex = null;
        this.render();
      }
    });

    btnSummary?.addEventListener('click', () => {
      if (this.activeMenuIndex !== null) {
        const pk = partyService.getPokemon(this.activeMenuIndex);
        if (pk) {
          this.showSummary(pk);
        }
        this.activeMenuIndex = null;
        this.render();
      }
    });

    const btnTakeItem = this.backdropEl.querySelector('#btnActionTakeItem');
    btnTakeItem?.addEventListener('click', () => {
      if (this.activeMenuIndex !== null) {
        const pk = partyService.getPokemon(this.activeMenuIndex);
        if (pk && pk.heldItem) {
          const removedItem = partyService.removeHeldItem(this.activeMenuIndex);
          if (removedItem) {
            const itemDef = findItem(removedItem);
            const itemName = itemDef ? itemDef.nameVi || itemDef.name : removedItem;
            // Add back to inventory
            inventoryService.addItem(removedItem, 1);
            battleSePlayer.playSound('Audio/SE/PC access.ogg', 0.8);
            showBerryToast(
              `🎒 Đã gỡ ${itemName} từ ${pk.nickname || pk.name} và cất vào túi đồ!`,
              '#22c55e'
            );
          }
          this.activeMenuIndex = null;
          this.render();
        }
      }
    });

    const btnGiveItem = this.backdropEl.querySelector('#btnActionGiveItem');
    btnGiveItem?.addEventListener('click', () => {
      if (this.activeMenuIndex !== null) {
        const targetSlot = this.activeMenuIndex;
        const targetPk = partyService.getPokemon(targetSlot);
        this.activeMenuIndex = null;
        this.render();
        if (targetPk) {
          // Open Bag directly targeting this Pokemon
          BagScreen.getInstance().open({
            targetPokemonIndex: targetSlot,
            targetPokemonName: targetPk.nickname || targetPk.name,
            onItemGiven: () => {
              this.render();
            },
            onCancel: () => {
              this.render();
            },
          });
          showBerryToast(
            `Chọn vật phẩm và bấm "CHO GIỮ" để trao cho ${targetPk.nickname || targetPk.name}!`,
            '#38bdf8'
          );
        }
      }
    });

    btnDismiss?.addEventListener('click', () => {
      this.activeMenuIndex = null;
      this.render();
    });

    // Summary Close Button
    const btnSummaryClose = this.backdropEl.querySelector('#btnPartySummaryClose');
    btnSummaryClose?.addEventListener('click', () => {
      this.closeSummaryModal();
    });

    // Move Detail Close Button
    const btnMoveDetailClose = this.backdropEl.querySelector('#btnPartyMoveDetailClose');
    btnMoveDetailClose?.addEventListener('click', () => {
      this.hideMoveDetailPopup();
    });

    // Close on backdrop click outside wrapper
    this.backdropEl.addEventListener('click', (e) => {
      if (e.target === this.backdropEl) {
        this.close();
      }
    });

    // Keyboard handlers
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.code === 'Escape' || e.code === 'KeyP') {
        const movePopup = this.backdropEl?.querySelector<HTMLElement>('#partyMoveDetailPopup');
        if (movePopup && movePopup.style.display !== 'none') {
          this.hideMoveDetailPopup();
          e.preventDefault();
          return;
        }
        if (this.summaryPokemon) {
          this.closeSummaryModal();
          e.preventDefault();
          return;
        }
        if (this.activeMenuIndex !== null) {
          this.activeMenuIndex = null;
          this.render();
          e.preventDefault();
          return;
        }
        if (this.swapSourceIndex !== null) {
          this.swapSourceIndex = null;
          this.render();
          e.preventDefault();
          return;
        }
        this.close();
        e.preventDefault();
        return;
      }

      // If a modal or menu is open, handle esc only
      if (this.summaryPokemon || this.activeMenuIndex !== null) return;

      // 2x3 Grid + Cancel button keyboard navigation
      if (e.code === 'ArrowRight') {
        if (this.selectedIndex < 6 && this.selectedIndex % 2 === 0) {
          this.selectedIndex = Math.min(5, this.selectedIndex + 1);
          this.render();
          e.preventDefault();
        }
      } else if (e.code === 'ArrowLeft') {
        if (this.selectedIndex < 6 && this.selectedIndex % 2 === 1) {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.render();
          e.preventDefault();
        }
      } else if (e.code === 'ArrowDown') {
        if (this.selectedIndex === 4 || this.selectedIndex === 5) {
          this.selectedIndex = 6; // Move to SALIR
          this.render();
          e.preventDefault();
        } else if (this.selectedIndex < 4) {
          this.selectedIndex += 2;
          this.render();
          e.preventDefault();
        }
      } else if (e.code === 'ArrowUp') {
        if (this.selectedIndex === 6) {
          this.selectedIndex = 5;
          this.render();
          e.preventDefault();
        } else if (this.selectedIndex >= 2) {
          this.selectedIndex -= 2;
          this.render();
          e.preventDefault();
        }
      } else if (e.code === 'Enter' || e.code === 'Space') {
        if (this.selectedIndex === 6) {
          this.close();
          e.preventDefault();
        } else {
          this.handleSlotClick(this.selectedIndex);
          e.preventDefault();
        }
      }
    });
  }

  private updateCancelButtonState(): void {
    if (!this.backdropEl) return;
    const btnCancel = this.backdropEl.querySelector<HTMLElement>('#btnPartyCancel');
    if (!btnCancel) return;
    const isSelected = this.selectedIndex === 6;
    btnCancel.style.backgroundImage = `url('${isSelected ? PARTY_ASSETS.cancelSel : PARTY_ASSETS.cancel}')`;
    if (isSelected) {
      btnCancel.classList.add('selected');
    } else {
      btnCancel.classList.remove('selected');
    }
  }

  private renderSlotsSelection(): void {
    if (!this.backdropEl) return;
    const container = this.backdropEl.querySelector<HTMLElement>('#partySlotsContainer');
    if (!container) return;
    const party = partyService.getParty();
    const slots = container.querySelectorAll<HTMLElement>('.party-slot');
    slots.forEach((slotEl) => {
      const idx = Number(slotEl.dataset.slotIndex);
      const isLeader = idx === 0;
      const isSelected = this.selectedIndex === idx;
      const isSwapping = this.swapSourceIndex === idx;
      const pk = party[idx];
      const isFainted = pk ? pk.isFainted || pk.currentHp <= 0 : false;

      let panelBg: string;
      if (!pk) {
        panelBg = PARTY_ASSETS.panelBlank;
      } else if (isLeader) {
        if (isSwapping) panelBg = PARTY_ASSETS.panelRoundSwap;
        else if (isFainted) panelBg = PARTY_ASSETS.panelRoundFnt;
        else if (isSelected) panelBg = PARTY_ASSETS.panelRoundSel;
        else panelBg = PARTY_ASSETS.panelRound;
      } else {
        if (isSwapping) panelBg = PARTY_ASSETS.panelRectSwap;
        else if (isFainted) panelBg = PARTY_ASSETS.panelRectFnt;
        else if (isSelected) panelBg = PARTY_ASSETS.panelRectSel;
        else panelBg = PARTY_ASSETS.panelRect;
      }

      slotEl.style.backgroundImage = `url('${panelBg}')`;
      if (isSelected) {
        slotEl.classList.add('selected');
      } else {
        slotEl.classList.remove('selected');
      }
    });
  }

  public render(): void {
    if (!this.backdropEl || !this.isOpen) return;

    const party = partyService.getParty();
    const container = this.backdropEl.querySelector<HTMLElement>('#partySlotsContainer');
    const msgText = this.backdropEl.querySelector<HTMLElement>('#partyMsgText');
    const actionMenu = this.backdropEl.querySelector<HTMLElement>('#partyActionMenu');

    if (!container) return;

    // Update Message
    if (msgText) {
      if (this.swapSourceIndex !== null) {
        const src = partyService.getPokemon(this.swapSourceIndex);
        msgText.innerText = `Đang chọn vị trí mới để đổi chỗ với ${src?.name ?? 'Pokémon'}... (Esc để hủy)`;
      } else if (this.selectOptions) {
        if (this.selectOptions.prompt) {
          msgText.innerText = this.selectOptions.prompt;
        } else if (this.selectOptions.mode === 'battle') {
          msgText.innerText = 'Chọn pokemon để đổi ra sân.';
        } else if (this.selectOptions.mode === 'use_item') {
          const itemName = this.selectOptions.item
            ? this.selectOptions.item.item.nameVi || this.selectOptions.item.item.name
            : 'vật phẩm';
          msgText.innerText = `Dùng ${itemName} cho Pokémon nào? (Esc để trở về Túi)`;
        } else if (this.selectOptions.mode === 'give_item') {
          const itemName = this.selectOptions.item
            ? this.selectOptions.item.item.nameVi || this.selectOptions.item.item.name
            : 'vật phẩm';
          msgText.innerText = `Trao ${itemName} cho Pokémon nào? (Esc để trở về Túi)`;
        }
      } else {
        msgText.innerText = 'Chọn pokemon.';
      }
    }

    // Render Slots (2 Columns x 3 Rows, alternating zig-zag layout)
    container.innerHTML = '';

    for (let slot = 0; slot < 6; slot++) {
      const pk = party[slot] as PartyPokemon | undefined;
      const isLeader = slot === 0;
      const isSelected = this.selectedIndex === slot;
      const isSwapping = this.swapSourceIndex === slot;
      const isFainted = pk ? pk.isFainted || pk.currentHp <= 0 : false;

      // Determine panel asset
      let panelBg: string;
      if (!pk) {
        panelBg = PARTY_ASSETS.panelBlank;
      } else if (isLeader) {
        if (isSwapping) panelBg = PARTY_ASSETS.panelRoundSwap;
        else if (isFainted) panelBg = PARTY_ASSETS.panelRoundFnt;
        else if (isSelected) panelBg = PARTY_ASSETS.panelRoundSel;
        else panelBg = PARTY_ASSETS.panelRound;
      } else {
        if (isSwapping) panelBg = PARTY_ASSETS.panelRectSwap;
        else if (isFainted) panelBg = PARTY_ASSETS.panelRectFnt;
        else if (isSelected) panelBg = PARTY_ASSETS.panelRectSel;
        else panelBg = PARTY_ASSETS.panelRect;
      }

      const slotEl = document.createElement('div');
      slotEl.className = `party-slot ${isLeader ? 'leader' : 'sub'} ${isSelected ? 'selected' : ''} ${isSwapping ? 'swapping' : ''} ${isFainted ? 'fainted' : ''} ${!pk ? 'empty' : ''} ${pk?.isShiny ? 'is-shiny' : ''}`;
      slotEl.dataset.slotIndex = String(slot);
      slotEl.style.backgroundImage = `url('${panelBg}')`;

      if (pk) {
        const hpPct = Math.max(0, Math.min(100, (pk.currentHp / pk.maxHp) * 100));
        const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 20 ? '#eab308' : '#ef4444';
        const fillWidth = Math.max(0, Math.min(96, Math.round((pk.currentHp / pk.maxHp) * 96)));
        const genderBadgeClass =
          pk.gender === 'male'
            ? 'ps-gender-badge gender-male'
            : pk.gender === 'female'
              ? 'ps-gender-badge gender-female'
              : '';

        const iconUrl = POKEMON_ASSETS.getIconSprite(pk.speciesKey, pk.isShiny);

        slotEl.innerHTML = `
          <!-- Pokemon Mini Sprite (Scaled & Clipped to 1st frame only) -->
          <div class="ps-sprite-wrapper">
            <img src="${iconUrl}" class="ps-pokemon-icon" alt="${pk.name}" />
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

          <!-- Level directly below Pokemon icon (with held item icon directly next to it) -->
          <div class="ps-level-row">
            <span class="ps-pk-level">Lv.${pk.level}</span>
            ${(() => {
              if (!pk.heldItem) return '';
              const heldDef = findItem(pk.heldItem);
              const heldName = heldDef ? heldDef.nameVi || heldDef.name : pk.heldItem;
              const heldSprite = heldDef?.sprite ? `/${heldDef.sprite}` : '/Graphics/Items/000.png';
              return `<img src="${heldSprite}" class="ps-held-item-icon" title="Đang giữ: ${heldName}" alt="${heldName}" />`;
            })()}
          </div>

          <!-- Name -->
          <div class="ps-name-row">
            <span class="ps-pk-name">${pk.nickname || pk.name}</span>
            ${pk.isShiny ? `<img src="${POKEMON_ASSETS.shinyIcon}" class="ps-shiny-icon" alt="Shiny" title="Shiny Pokémon" />` : ''}
          </div>

          <!-- Gender Badge (battler_gender.png) -->
          ${genderBadgeClass ? `<div class="${genderBadgeClass}" title="${pk.gender}"></div>` : ''}

          <!-- HP Gauge (exact 96px groove fill at left:36px, top:4px) -->
          <div class="ps-hp-wrapper">
            <div class="ps-hp-bar-bg" style="background-image: url('${PARTY_ASSETS.hpBar}')">
              <div class="ps-hp-bar-fill" style="width: ${fillWidth}px; background-color: ${hpColor};"></div>
            </div>
          </div>

          <!-- HP Numbers & Red HP Label (e.g. 20/ 20 HP) -->
          <div class="ps-hp-numbers-row">
            <span class="ps-hp-val">${pk.currentHp}/ ${pk.maxHp}</span>
            <span class="ps-hp-unit">HP</span>
          </div>

          <!-- Status Condition Badge if sick/fainted -->
          ${isFainted ? '<span class="ps-status-fnt">FNT</span>' : pk.status !== 'none' ? `<span class="ps-status-badge">${pk.status.toUpperCase()}</span>` : ''}
        `;
      } else {
        // Blank slot: clean blank panel frame exactly matching template
        slotEl.innerHTML = '';
      }

      // Slot Click Handler
      slotEl.addEventListener('click', () => {
        this.handleSlotClick(slot);
      });

      slotEl.addEventListener('dblclick', () => {
        if (this.selectOptions && party[slot]) {
          const btn = this.backdropEl?.querySelector<HTMLButtonElement>('#btnActionSendOut');
          btn?.click();
        }
      });

      slotEl.addEventListener('mouseenter', () => {
        this.selectedIndex = slot;
        this.updateCancelButtonState();
        this.renderSlotsSelection();
      });

      container.appendChild(slotEl);
    }

    this.updateCancelButtonState();

    // Action Menu Display
    if (actionMenu) {
      if (this.activeMenuIndex !== null && party[this.activeMenuIndex]) {
        const targetPk = party[this.activeMenuIndex]!;
        const titleEl = actionMenu.querySelector('#partyActionTitle');
        if (titleEl) titleEl.textContent = `${targetPk.name} (Lv.${targetPk.level})`;

        const btnSendOut = actionMenu.querySelector<HTMLElement>('#btnActionSendOut');
        const btnSwap = actionMenu.querySelector<HTMLElement>('#btnActionSwap');
        const btnTakeItem = actionMenu.querySelector<HTMLElement>('#btnActionTakeItem');
        const btnGiveItem = actionMenu.querySelector<HTMLElement>('#btnActionGiveItem');

        if (this.selectOptions) {
          if (btnSendOut) {
            btnSendOut.style.display = 'flex';
            const actionText = btnSendOut.querySelector('.action-btn-text');
            if (actionText) {
              if (this.selectOptions.mode === 'battle') {
                actionText.textContent = 'Ra chiến đấu';
              } else if (this.selectOptions.mode === 'use_item') {
                actionText.textContent = 'Dùng vật phẩm';
              } else if (this.selectOptions.mode === 'give_item') {
                actionText.textContent = 'Cho giữ vật phẩm';
              }
            }
          }
          if (btnSwap) btnSwap.style.display = 'none';
          if (btnTakeItem) btnTakeItem.style.display = 'none';
          if (btnGiveItem) btnGiveItem.style.display = 'none';
        } else {
          if (btnSendOut) btnSendOut.style.display = 'none';
          if (btnSwap) btnSwap.style.display = 'flex';
          if (btnTakeItem) btnTakeItem.style.display = targetPk.heldItem ? 'flex' : 'none';
          if (btnGiveItem) btnGiveItem.style.display = 'flex';
        }

        actionMenu.style.display = 'flex';
      } else {
        actionMenu.style.display = 'none';
      }
    }
  }

  private handleSlotClick(slot: number): void {
    const party = partyService.getParty();

    // 1. If currently in swap mode: swap target with source!
    if (this.swapSourceIndex !== null) {
      if (slot < party.length && slot !== this.swapSourceIndex) {
        const srcPk = party[this.swapSourceIndex];
        const destPk = party[slot];
        partyService.swapPokemon(this.swapSourceIndex, slot);

        if (this.swapSourceIndex === 0 || slot === 0) {
          const newLeader = partyService.getLeader();
          if (newLeader && this.onLeaderChangeCallback) {
            this.onLeaderChangeCallback(newLeader);
          }
        }
        showBerryToast(`🔄 Đã đổi vị trí giữa ${srcPk?.name} và ${destPk?.name}!`, '#22c55e');
      }
      this.swapSourceIndex = null;
      this.render();
      return;
    }

    // 2. Click on empty slot
    if (!party[slot]) {
      showBerryToast('Ô này hiện đang để trống.', '#64748b');
      return;
    }

    // 3. Open context action menu for this Pokémon
    this.selectedIndex = slot;
    this.activeMenuIndex = slot;
    this.render();
  }

  private showSummary(pokemon: PartyPokemon): void {
    if (!this.backdropEl) return;
    this.summaryPokemon = pokemon;

    const modal = this.backdropEl.querySelector('#partySummaryModal') as HTMLElement;
    if (!modal) return;

    const nameEl = modal.querySelector('#partySummaryName');
    const genderEl = modal.querySelector('#partySummaryGender');
    const spriteCanvas = modal.querySelector('#partySummarySprite') as HTMLCanvasElement;
    const typesEl = modal.querySelector('#partySummaryTypes');
    const hpEl = modal.querySelector('#partySummaryHp');
    const atkEl = modal.querySelector('#partySummaryAtk');
    const defEl = modal.querySelector('#partySummaryDef');
    const spAtkEl = modal.querySelector('#partySummarySpAtk');
    const spDefEl = modal.querySelector('#partySummarySpDef');
    const speedEl = modal.querySelector('#partySummarySpeed');

    const barHp = modal.querySelector('#partyStatBarHp') as HTMLElement;
    const barAtk = modal.querySelector('#partyStatBarAtk') as HTMLElement;
    const barDef = modal.querySelector('#partyStatBarDef') as HTMLElement;
    const barSpAtk = modal.querySelector('#partyStatBarSpAtk') as HTMLElement;
    const barSpDef = modal.querySelector('#partyStatBarSpDef') as HTMLElement;
    const barSpeed = modal.querySelector('#partyStatBarSpeed') as HTMLElement;

    const ballEl = modal.querySelector('#partySummaryBall');
    const caughtLvEl = modal.querySelector('#partySummaryCaughtLv');
    const expEl = modal.querySelector('#partySummaryExp');
    const expBar = modal.querySelector('#partySummaryExpBar') as HTMLElement;

    if (nameEl) {
      nameEl.innerHTML = `${pokemon.nickname || pokemon.name} Lv.${pokemon.level}${pokemon.isShiny ? ` <img class="summary-shiny-icon" src="${POKEMON_ASSETS.shinyIcon}" alt="Shiny" title="Shiny Pokémon" />` : ''}`;
    }
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
    const abilityEl = modal.querySelector('#partySummaryAbility');
    const abilityDescEl = modal.querySelector('#partySummaryAbilityDesc');
    if (abilityEl) {
      abilityEl.textContent = abilityDisplay.fullName;
    }
    if (abilityDescEl) {
      abilityDescEl.textContent = abilityDisplay.descVi;
    }

    // Nature & Effect
    const natureData = NATURES_TABLE[pokemon.nature] ?? NATURES_TABLE.Hardy;
    const natureEl = modal.querySelector('#partySummaryNature');
    const natureEffectEl = modal.querySelector('#partySummaryNatureEffect');
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
    updateIvEl('partySummaryIvHp', ivs.hp);
    updateIvEl('partySummaryIvAtk', ivs.attack);
    updateIvEl('partySummaryIvDef', ivs.defense);
    updateIvEl('partySummaryIvSpAtk', ivs.spAtk);
    updateIvEl('partySummaryIvSpDef', ivs.spDef);
    updateIvEl('partySummaryIvSpeed', ivs.speed);

    const updateEvEl = (id: string, val: number) => {
      const el = modal.querySelector(`#${id}`);
      if (el) {
        el.textContent = String(val);
        el.classList.toggle('trained', val > 0);
      }
    };
    updateEvEl('partySummaryEvHp', evs.hp);
    updateEvEl('partySummaryEvAtk', evs.attack);
    updateEvEl('partySummaryEvDef', evs.defense);
    updateEvEl('partySummaryEvSpAtk', evs.spAtk);
    updateEvEl('partySummaryEvSpDef', evs.spDef);
    updateEvEl('partySummaryEvSpeed', evs.speed);

    const totalEv = evs.hp + evs.attack + evs.defense + evs.spAtk + evs.spDef + evs.speed;
    const totalEvEl = modal.querySelector('#partySummaryTotalEv');
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
    updateStatLabel('partyLabelAtk', 'Tấn công', 'attack');
    updateStatLabel('partyLabelDef', 'Phòng thủ', 'defense');
    updateStatLabel('partyLabelSpAtk', 'Công ĐB', 'spAtk');
    updateStatLabel('partyLabelSpDef', 'Thủ ĐB', 'spDef');
    updateStatLabel('partyLabelSpeed', 'Tốc độ', 'speed');
    if (expEl) expEl.textContent = `${pokemon.exp} / ${pokemon.maxExp}`;
    if (expBar) {
      const expPercent = Math.min(
        100,
        Math.max(0, Math.round((pokemon.exp / Math.max(1, pokemon.maxExp)) * 100))
      );
      expBar.style.width = `${expPercent}%`;
    }

    // Populate Held Item Info
    const heldEl = modal.querySelector('#partySummaryHeldItem');
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
    const modal = this.backdropEl?.querySelector('#partySummaryModal') as HTMLElement;
    if (!modal) return;

    const movesEl = modal.querySelector('#partySummaryMoves');
    const poolEl = modal.querySelector('#partySummaryMovePool');
    const poolLvEl = modal.querySelector('#partySummaryPoolLv');
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
    const popup = this.backdropEl.querySelector('#partyMoveDetailPopup') as HTMLElement;
    if (!popup) return;

    // Get move data with database fallback
    const dbMove = MOVES_DB[move.id] || move;

    const nameViEl = popup.querySelector('#partyMoveDetailNameVi');
    const nameEnEl = popup.querySelector('#partyMoveDetailNameEn');
    const typeIconEl = popup.querySelector('#partyMoveDetailTypeIcon') as HTMLElement;
    const typeNameEl = popup.querySelector('#partyMoveDetailTypeName');
    const catIconEl = popup.querySelector('#partyMoveDetailCategoryIcon') as HTMLElement;
    const catTextEl = popup.querySelector('#partyMoveDetailCategoryText');
    const powerEl = popup.querySelector('#partyMoveDetailPower');
    const accEl = popup.querySelector('#partyMoveDetailAcc');
    const ppEl = popup.querySelector('#partyMoveDetailPp');
    const descEl = popup.querySelector('#partyMoveDetailDesc');

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

    // Category (Vật Lý / Đặc Biệt / Trạng Thái)
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
    const popup = this.backdropEl.querySelector('#partyMoveDetailPopup') as HTMLElement;
    if (popup) popup.style.display = 'none';
  }

  private closeSummaryModal(): void {
    this.hideMoveDetailPopup();
    this.removeMoveDragGhost();
    this.clearMoveDragOver();
    this.activeMoveDrag = null;
    this.summaryAnimator?.stop();
    this.summaryPokemon = null;
    const modal = this.backdropEl?.querySelector('#partySummaryModal') as HTMLElement;
    if (modal) modal.style.display = 'none';
  }
}

// Global party UI helpers
export function initPartyScreen(onLeaderChange?: (newLeader: PartyPokemon) => void): PartyScreen {
  const partyScreen = PartyScreen.getInstance();
  if (onLeaderChange) {
    partyScreen.setOnLeaderChange(onLeaderChange);
  }
  return partyScreen;
}

export function openPartyScreen(): void {
  PartyScreen.getInstance().open();
}

export function closePartyScreen(): void {
  PartyScreen.getInstance().close();
}

export function togglePartyScreen(): void {
  PartyScreen.getInstance().toggle();
}

export function isPartyScreenOpen(): boolean {
  return PartyScreen.getInstance().isVisible();
}
