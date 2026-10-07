/**
 * Party Screen UI
 * Renders the 6-Pokémon team menu using authentic Graphics/Party assets.
 */

import { partyService } from '../domain/party/party-service';
import type { PartyPokemon } from '../domain/party/party-state';
import { PARTY_ASSETS, POKEMON_ASSETS } from '../assets';
import { showBerryToast } from './toast';
import { PokemonSpriteAnimator } from './pokedex';

export interface BattleSelectOptions {
  currentBattlerUid?: string;
  onSelect: (selectedPk: PartyPokemon) => void;
  onCancel?: () => void;
}

export class PartyScreen {
  private static instance: PartyScreen | null = null;
  private backdropEl: HTMLElement | null = null;
  private isOpen = false;
  private selectedIndex = 0;
  private swapSourceIndex: number | null = null;
  private activeMenuIndex: number | null = null;
  private summaryPokemon: PartyPokemon | null = null;
  private summaryAnimator: PokemonSpriteAnimator | null = null;
  private battleSelectOptions: BattleSelectOptions | null = null;
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
    this.battleSelectOptions = null;
    this.swapSourceIndex = null;
    this.activeMenuIndex = null;
    this.summaryPokemon = null;
    if (this.backdropEl) {
      this.backdropEl.style.display = 'flex';
    }
    this.render();
  }

  public openForBattleSelect(options: BattleSelectOptions): void {
    if (!this.backdropEl) this.createDom();
    this.isOpen = true;
    this.battleSelectOptions = options;
    this.swapSourceIndex = null;
    this.activeMenuIndex = null;
    this.summaryPokemon = null;
    if (this.backdropEl) {
      this.backdropEl.style.display = 'flex';
    }
    this.render();
  }

  public close(): void {
    const wasBattleSelect = this.battleSelectOptions;
    this.isOpen = false;
    this.battleSelectOptions = null;
    this.swapSourceIndex = null;
    this.activeMenuIndex = null;
    this.summaryPokemon = null;
    this.summaryAnimator?.stop();
    if (this.backdropEl) {
      this.backdropEl.style.display = 'none';
    }
    if (wasBattleSelect?.onCancel) {
      wasBattleSelect.onCancel();
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
          <button class="party-action-btn cancel" id="btnActionDismiss">
            <span class="action-btn-arrow">▶</span>
            <span class="action-btn-text">Đóng</span>
          </button>
        </div>

        <!-- Summary Modal Sub-screen (Authentic GBA / Essentials Pixel Art) -->
        <div class="party-summary-modal" id="partySummaryModal" style="display: none;">
          <div class="summary-card">
            <!-- Header: Ball, Name, Level, Gender, Shiny, Close -->
            <div class="summary-header">
              <div class="summary-header-left">
                <img src="${PARTY_ASSETS.ball}" class="summary-header-ball" alt="Ball" />
                <span id="summaryPkName" class="summary-pk-name">Pikachu</span>
                <span id="summaryPkLevel" class="summary-pk-level">Lv.5</span>
                <span id="summaryPkGender" class="summary-pk-gender">♂</span>
                <span id="summaryPkShiny" class="summary-pk-shiny" style="display: none;">
                  <img src="${POKEMON_ASSETS.shinyIcon}" class="summary-shiny-icon" alt="Shiny" />
                </span>
              </div>
              <button class="summary-btn-close" id="btnSummaryClose" title="Đóng (Esc)">
                <span class="summary-close-icon">✕</span> ĐÓNG
              </button>
            </div>

            <!-- Body: Left Column (Profile & Meta) + Right Column (Stats & Moves) -->
            <div class="summary-body">
              <!-- Left Column: Sprite, Types, Info Box, EXP Bar -->
              <div class="summary-left-col">
                <div class="summary-sprite-frame">
                  <canvas id="summaryPkSprite" class="summary-pk-sprite" width="96" height="96"></canvas>
                </div>
                <div id="summaryPkTypes" class="summary-pk-types">
                  <!-- Badges hệ -->
                </div>
                <div class="summary-info-box">
                  <div class="summary-info-row">
                    <span class="info-lbl">Bóng bắt:</span>
                    <span id="summaryBallName" class="info-val">POKÉ BALL</span>
                  </div>
                  <div class="summary-info-row">
                    <span class="info-lbl">Vật phẩm:</span>
                    <span id="summaryHeldItem" class="info-val">Không có</span>
                  </div>
                  <div class="summary-info-row">
                    <span class="info-lbl">Bắt ở cấp:</span>
                    <span id="summaryCaughtLv" class="info-val">Lv.5</span>
                  </div>
                </div>

                <!-- EXP Bar -->
                <div class="summary-exp-box">
                  <div class="summary-exp-labels">
                    <span class="exp-title">EXP</span>
                    <span id="summaryExpText" class="exp-nums">0 / 250</span>
                  </div>
                  <div class="summary-exp-bar-track">
                    <div id="summaryExpBarFill" class="summary-exp-bar-fill" style="width: 0%;"></div>
                  </div>
                </div>
              </div>

              <!-- Right Column: Stats Table + 4 Move Slots -->
              <div class="summary-right-col">
                <!-- Battle Stats Section -->
                <div class="summary-section-box summary-stats-section">
                  <div class="summary-section-title">
                    <span class="title-icon">⚔</span> CHỈ SỐ CHIẾN ĐẤU
                  </div>
                  <div class="summary-stats-list">
                    <!-- HP -->
                    <div class="summary-stat-row">
                      <span class="stat-name">HP</span>
                      <span id="summaryHp" class="stat-val">20/20</span>
                      <div class="stat-bar-track">
                        <div id="summaryHpBar" class="stat-bar-fill hp" style="width: 100%;"></div>
                      </div>
                    </div>
                    <!-- Attack -->
                    <div class="summary-stat-row">
                      <span class="stat-name">Tấn công</span>
                      <span id="summaryAtk" class="stat-val">12</span>
                      <div class="stat-bar-track">
                        <div id="summaryAtkBar" class="stat-bar-fill atk" style="width: 20%;"></div>
                      </div>
                    </div>
                    <!-- Defense -->
                    <div class="summary-stat-row">
                      <span class="stat-name">Phòng thủ</span>
                      <span id="summaryDef" class="stat-val">10</span>
                      <div class="stat-bar-track">
                        <div id="summaryDefBar" class="stat-bar-fill def" style="width: 18%;"></div>
                      </div>
                    </div>
                    <!-- Sp. Atk -->
                    <div class="summary-stat-row">
                      <span class="stat-name">TC Đ.Biệt</span>
                      <span id="summarySpAtk" class="stat-val">14</span>
                      <div class="stat-bar-track">
                        <div id="summarySpAtkBar" class="stat-bar-fill spatk" style="width: 22%;"></div>
                      </div>
                    </div>
                    <!-- Sp. Def -->
                    <div class="summary-stat-row">
                      <span class="stat-name">PT Đ.Biệt</span>
                      <span id="summarySpDef" class="stat-val">11</span>
                      <div class="stat-bar-track">
                        <div id="summarySpDefBar" class="stat-bar-fill spdef" style="width: 19%;"></div>
                      </div>
                    </div>
                    <!-- Speed -->
                    <div class="summary-stat-row">
                      <span class="stat-name">Tốc độ</span>
                      <span id="summarySpd" class="stat-val">15</span>
                      <div class="stat-bar-track">
                        <div id="summarySpdBar" class="stat-bar-fill spd" style="width: 25%;"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 4 Moves Section -->
                <div class="summary-section-box summary-moves-section">
                  <div class="summary-section-title">
                    <span class="title-icon">✦</span> CHIÊU THỨC (4 Ô)
                  </div>
                  <div class="summary-moves-grid" id="summaryMovesList">
                    <!-- Rendered dynamically (4 slots) -->
                  </div>
                </div>
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
      if (this.activeMenuIndex !== null && this.battleSelectOptions) {
        const pk = partyService.getPokemon(this.activeMenuIndex);
        if (pk) {
          if (
            this.battleSelectOptions.currentBattlerUid &&
            pk.uid === this.battleSelectOptions.currentBattlerUid
          ) {
            showBerryToast(`⚠️ ${pk.name} hiện đang ở trên sân đấu!`, '#eab308');
            return;
          }
          if (pk.isFainted || pk.currentHp <= 0) {
            showBerryToast(`⚠️ ${pk.name} đã gục ngã, không thể ra trận!`, '#ef4444');
            return;
          }
          const cb = this.battleSelectOptions.onSelect;
          this.battleSelectOptions = null;
          this.activeMenuIndex = null;
          this.close();
          cb(pk);
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

    btnDismiss?.addEventListener('click', () => {
      this.activeMenuIndex = null;
      this.render();
    });

    // Summary Close Button
    const btnSummaryClose = this.backdropEl.querySelector('#btnSummaryClose');
    btnSummaryClose?.addEventListener('click', () => {
      this.summaryAnimator?.stop();
      this.summaryPokemon = null;
      const modal = this.backdropEl?.querySelector<HTMLElement>('#partySummaryModal');
      if (modal) modal.style.display = 'none';
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
        if (this.summaryPokemon) {
          this.summaryAnimator?.stop();
          this.summaryPokemon = null;
          const modal = this.backdropEl?.querySelector<HTMLElement>('#partySummaryModal');
          if (modal) modal.style.display = 'none';
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

      let panelBg = '';
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
      } else if (this.battleSelectOptions) {
        msgText.innerText = 'Chọn pokemon để đổi ra sân.';
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
      let panelBg = '';
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

          <!-- Level directly below Pokemon icon (matching template) -->
          <span class="ps-pk-level">Lv.${pk.level}</span>

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

        if (this.battleSelectOptions) {
          if (btnSendOut) btnSendOut.style.display = 'flex';
          if (btnSwap) btnSwap.style.display = 'none';
        } else {
          if (btnSendOut) btnSendOut.style.display = 'none';
          if (btnSwap) btnSwap.style.display = 'flex';
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

  private showSummary(pk: PartyPokemon): void {
    if (!this.backdropEl) return;
    this.summaryPokemon = pk;

    const modal = this.backdropEl.querySelector<HTMLElement>('#partySummaryModal');
    if (!modal) return;

    // Header info: Name, Level, Gender, Shiny badge
    const nameEl = modal.querySelector('#summaryPkName');
    if (nameEl) {
      nameEl.textContent = pk.nickname ? `${pk.nickname} (${pk.name})` : pk.name;
    }
    const levelEl = modal.querySelector('#summaryPkLevel');
    if (levelEl) {
      levelEl.textContent = `Lv.${pk.level}`;
    }
    const genderEl = modal.querySelector<HTMLElement>('#summaryPkGender');
    if (genderEl) {
      if (pk.gender === 'male') {
        genderEl.textContent = '♂';
        genderEl.className = 'summary-pk-gender male';
        genderEl.style.display = 'inline';
      } else if (pk.gender === 'female') {
        genderEl.textContent = '♀';
        genderEl.className = 'summary-pk-gender female';
        genderEl.style.display = 'inline';
      } else {
        genderEl.textContent = '';
        genderEl.style.display = 'none';
      }
    }
    const shinyEl = modal.querySelector<HTMLElement>('#summaryPkShiny');
    if (shinyEl) {
      shinyEl.style.display = pk.isShiny ? 'inline-flex' : 'none';
    }

    // Sprite Animation
    const spriteCanvas = modal.querySelector<HTMLCanvasElement>('#summaryPkSprite');
    if (spriteCanvas) {
      if (!this.summaryAnimator) {
        this.summaryAnimator = new PokemonSpriteAnimator(spriteCanvas);
      }
      this.summaryAnimator.load(POKEMON_ASSETS.getFrontSprite(pk.speciesKey, pk.isShiny));
    }

    // Type Badges
    const typesEl = modal.querySelector<HTMLElement>('#summaryPkTypes');
    if (typesEl) {
      typesEl.innerHTML = pk.types
        .map((t) => `<span class="summary-type-tag type-${t.toLowerCase()}">${t.toUpperCase()}</span>`)
        .join('');
    }

    // Metadata Box (Bóng bắt, Vật phẩm mang, Bắt ở cấp)
    const ballEl = modal.querySelector('#summaryBallName');
    if (ballEl) {
      const rawBall = pk.ballCaught || 'pokeball';
      const cleanBall = rawBall.replace(/^item_/i, '').replace(/_/g, ' ').toUpperCase();
      ballEl.textContent = cleanBall.includes('BALL') ? cleanBall : `${cleanBall} BALL`;
    }
    const itemEl = modal.querySelector('#summaryHeldItem');
    if (itemEl) {
      itemEl.textContent = pk.heldItem || 'Không có';
    }
    const caughtLvEl = modal.querySelector('#summaryCaughtLv');
    if (caughtLvEl) {
      caughtLvEl.textContent = `Lv.${pk.caughtLevel || pk.level}`;
    }

    // EXP Bar (Track & Fill)
    const expTextEl = modal.querySelector('#summaryExpText');
    if (expTextEl) {
      expTextEl.textContent = `${pk.exp} / ${pk.maxExp}`;
    }
    const expBarFill = modal.querySelector<HTMLElement>('#summaryExpBarFill');
    if (expBarFill) {
      const expPct = Math.max(0, Math.min(100, Math.round((pk.exp / Math.max(1, pk.maxExp)) * 100)));
      expBarFill.style.width = `${expPct}%`;
    }

    // Stats Table & Visual Stat Bars
    // Reference standard max for non-legendary scaled bars is ~180
    const maxReferenceStat = 180;
    const hpPct = Math.max(0, Math.min(100, (pk.currentHp / pk.maxHp) * 100));
    const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 20 ? '#eab308' : '#ef4444';

    modal.querySelector('#summaryHp')!.textContent = `${pk.currentHp}/${pk.maxHp}`;
    const hpBar = modal.querySelector<HTMLElement>('#summaryHpBar');
    if (hpBar) {
      hpBar.style.width = `${hpPct}%`;
      hpBar.style.backgroundColor = hpColor;
    }

    const setStat = (valId: string, barId: string, val: number) => {
      const valEl = modal.querySelector(valId);
      if (valEl) valEl.textContent = String(val);
      const barEl = modal.querySelector<HTMLElement>(barId);
      if (barEl) {
        const pct = Math.max(5, Math.min(100, Math.round((val / maxReferenceStat) * 100)));
        barEl.style.width = `${pct}%`;
      }
    };

    setStat('#summaryAtk', '#summaryAtkBar', pk.stats.attack);
    setStat('#summaryDef', '#summaryDefBar', pk.stats.defense);
    setStat('#summarySpAtk', '#summarySpAtkBar', pk.stats.spAtk);
    setStat('#summarySpDef', '#summarySpDefBar', pk.stats.spDef);
    setStat('#summarySpd', '#summarySpdBar', pk.stats.speed);

    // Moves Grid: Exactly 4 slots rendered with authentic info
    const movesList = modal.querySelector<HTMLElement>('#summaryMovesList');
    if (movesList) {
      let movesHtml = '';
      for (let i = 0; i < 4; i++) {
        const m = pk.moves[i];
        if (m) {
          const moveName = m.nameVi || m.name;
          const ppColor =
            m.pp === 0 ? '#ef4444' : m.pp <= Math.ceil(m.maxPp * 0.25) ? '#eab308' : '#38bdf8';
          movesHtml += `
            <div class="summary-move-card">
              <div class="smc-top">
                <span class="smc-name" title="${moveName}">${moveName}</span>
                <span class="summary-type-tag smc-type-tag type-${m.type.toLowerCase()}">${m.type.toUpperCase()}</span>
              </div>
              <div class="smc-details">
                <span class="smc-pp" style="color: ${ppColor}">PP ${m.pp}/${m.maxPp}</span>
                <span class="smc-stat">Uy lực: <b>${m.power > 0 ? m.power : '—'}</b></span>
                <span class="smc-stat">CX: <b>${m.accuracy > 0 ? m.accuracy + '%' : '—'}</b></span>
              </div>
            </div>
          `;
        } else {
          movesHtml += `
            <div class="summary-move-card empty">
              <span class="smc-empty-label">― Trống ―</span>
            </div>
          `;
        }
      }
      movesList.innerHTML = movesHtml;
    }

    modal.style.display = 'flex';
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
