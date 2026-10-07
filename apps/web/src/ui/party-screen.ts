/**
 * Party Screen UI
 * Renders the 6-Pokémon team menu using authentic Graphics/Party assets.
 */

import { partyService } from '../domain/party/party-service';
import { playerService } from '../domain/player/player-service';
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

        <!-- Context Action Popup (Đổi chỗ, Đưa lên đầu, Xem tóm tắt, Hồi máu, Ra trận) -->
        <div class="party-action-menu" id="partyActionMenu" style="display: none;">
          <div class="party-action-title" id="partyActionTitle">Tùy chọn Pokémon</div>
          <button class="party-action-btn" id="btnActionSendOut" style="display: none; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-weight: 700;">⚔️ Ra chiến đấu</button>
          <button class="party-action-btn" id="btnActionSwap">🔄 Đổi vị trí</button>
          <button class="party-action-btn" id="btnActionLeader">👑 Đưa lên đầu (Leader)</button>
          <button class="party-action-btn" id="btnActionSummary">📊 Xem thông tin</button>
          <button class="party-action-btn" id="btnActionHeal">💊 Dùng Potion hồi máu</button>
          <button class="party-action-btn cancel" id="btnActionDismiss">✕ Đóng</button>
        </div>

        <!-- Summary Modal Sub-screen -->
        <div class="party-summary-modal" id="partySummaryModal" style="display: none;">
          <div class="summary-card">
            <div class="summary-header">
              <span id="summaryPkName">Pikachu Lv.5</span>
              <button class="summary-btn-close" id="btnSummaryClose">✕</button>
            </div>
            <div class="summary-body">
              <div class="summary-left-col">
                <canvas id="summaryPkSprite" class="summary-pk-sprite" width="80" height="80"></canvas>
                <div id="summaryPkTypes" class="summary-pk-types"></div>
                <div class="summary-stat-row">HP: <span id="summaryHp">20 / 20</span></div>
                <div class="summary-stat-row">Tấn công: <span id="summaryAtk">12</span></div>
                <div class="summary-stat-row">Phòng thủ: <span id="summaryDef">10</span></div>
                <div class="summary-stat-row">Tấn công ĐB: <span id="summarySpAtk">14</span></div>
                <div class="summary-stat-row">Phòng thủ ĐB: <span id="summarySpDef">11</span></div>
                <div class="summary-stat-row">Tốc độ: <span id="summarySpd">15</span></div>
                <div class="summary-stat-row">Kinh nghiệm: <span id="summaryExp">0 / 250</span></div>
              </div>
              <div class="summary-right-col">
                <div class="summary-moves-header">CHIÊU THỨC SỞ HỮU</div>
                <div class="summary-moves-list" id="summaryMovesList"></div>
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
    const btnLeader = this.backdropEl.querySelector('#btnActionLeader');
    const btnSummary = this.backdropEl.querySelector('#btnActionSummary');
    const btnHeal = this.backdropEl.querySelector('#btnActionHeal');
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

    btnLeader?.addEventListener('click', () => {
      if (this.activeMenuIndex !== null) {
        partyService.setLeader(this.activeMenuIndex);
        const newLeader = partyService.getLeader();
        if (newLeader && this.onLeaderChangeCallback) {
          this.onLeaderChangeCallback(newLeader);
        }
        showBerryToast(`👑 Đã đưa ${newLeader?.name} lên vị trí dẫn đầu!`, '#38bdf8');
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

    btnHeal?.addEventListener('click', () => {
      if (this.activeMenuIndex !== null) {
        const pk = partyService.getPokemon(this.activeMenuIndex);
        if (pk) {
          if (pk.currentHp >= pk.maxHp && pk.status === 'none') {
            showBerryToast(`💚 ${pk.name} hiện đang hoàn toàn khỏe mạnh!`, '#22c55e');
          } else if (playerService.hasItem('potion', 1)) {
            playerService.removeItem('potion', 1);
            partyService.healPokemon(this.activeMenuIndex, 20);
            partyService.cureStatus(this.activeMenuIndex);
            showBerryToast(`🧪 Đã dùng Potion hồi 20 HP cho ${pk.name}!`, '#22c55e');
          } else {
            // Free emergency heal if no potion
            partyService.healPokemon(this.activeMenuIndex);
            showBerryToast(`✨ Đã sơ cứu hồi phục hoàn toàn cho ${pk.name}!`, '#38bdf8');
          }
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
        const btnLeader = actionMenu.querySelector<HTMLElement>('#btnActionLeader');
        const btnHeal = actionMenu.querySelector<HTMLElement>('#btnActionHeal');

        if (this.battleSelectOptions) {
          if (btnSendOut) btnSendOut.style.display = 'block';
          if (btnSwap) btnSwap.style.display = 'none';
          if (btnLeader) btnLeader.style.display = 'none';
          if (btnHeal) btnHeal.style.display = 'none';
        } else {
          if (btnSendOut) btnSendOut.style.display = 'none';
          if (btnSwap) btnSwap.style.display = 'block';
          if (btnLeader) btnLeader.style.display = 'block';
          if (btnHeal) btnHeal.style.display = 'block';
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

    const nameEl = modal.querySelector('#summaryPkName');
    if (nameEl) {
      nameEl.innerHTML = `${pk.nickname || pk.name} Lv.${pk.level}${pk.isShiny ? ` <img src="${POKEMON_ASSETS.shinyIcon}" class="summary-shiny-icon" alt="Shiny" title="Shiny Pokémon" />` : ''}`;
    }
    const spriteCanvas = modal.querySelector<HTMLCanvasElement>('#summaryPkSprite')!;
    if (spriteCanvas) {
      if (!this.summaryAnimator) {
        this.summaryAnimator = new PokemonSpriteAnimator(spriteCanvas);
      }
      this.summaryAnimator.load(POKEMON_ASSETS.getFrontSprite(pk.speciesKey, pk.isShiny));
    }

    const typesEl = modal.querySelector<HTMLElement>('#summaryPkTypes')!;
    typesEl.innerHTML = pk.types
      .map((t) => `<span class="summary-type-tag ${t.toLowerCase()}">${t}</span>`)
      .join(' ');

    modal.querySelector('#summaryHp')!.textContent = `${pk.currentHp} / ${pk.maxHp}`;
    modal.querySelector('#summaryAtk')!.textContent = String(pk.stats.attack);
    modal.querySelector('#summaryDef')!.textContent = String(pk.stats.defense);
    modal.querySelector('#summarySpAtk')!.textContent = String(pk.stats.spAtk);
    modal.querySelector('#summarySpDef')!.textContent = String(pk.stats.spDef);
    modal.querySelector('#summarySpd')!.textContent = String(pk.stats.speed);
    modal.querySelector('#summaryExp')!.textContent = `${pk.exp} / ${pk.maxExp}`;

    const movesList = modal.querySelector<HTMLElement>('#summaryMovesList')!;
    movesList.innerHTML = pk.moves
      .map(
        (m) => `
        <div class="summary-move-card">
          <div class="smc-header">
            <span class="smc-name">${m.nameVi || m.name}</span>
            <span class="smc-type ${m.type.toLowerCase()}">${m.type}</span>
          </div>
          <div class="smc-stats">
            <span>PP: ${m.pp}/${m.maxPp}</span>
            <span>Uy lực: ${m.power > 0 ? m.power : '—'}</span>
            <span>Chính xác: ${m.accuracy > 0 ? m.accuracy + '%' : '—'}</span>
          </div>
          <div class="smc-desc">${m.description || 'Không có mô tả.'}</div>
        </div>
      `
      )
      .join('');

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
