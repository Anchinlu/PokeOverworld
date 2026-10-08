/**
 * Overworld Map Party HUD
 * Renders the player's 6 party Pokémon vertically along the right edge of the screen
 * using Graphics/Party/databox_normal.png.
 *
 * Features:
 * - Authentic databox_normal.png (260x84 scaled) pixel-perfect layout
 * - Displays all 6 party Pokémon with animated mini-sprites
 * - Shiny support: Sparkle cluster (5 twinkling stars) on sprite + static shiny.png badge
 * - Accurate HP bar groove alignment & dynamic color (green/yellow/red) + numeric HP / FNT
 * - Accurate EXP bar groove alignment at the bottom
 * - Real-time sync with partyService updates (healing, damage, leader swap, new catches)
 * - Click to open full Party Screen
 * - Collapsible toggle button to slide in/out
 */

import { partyService } from '../domain/party/party-service';
import type { PartyPokemon } from '../domain/party/party-state';
import { PARTY_ASSETS, POKEMON_ASSETS } from '../assets';

export class PartyMapHud {
  private static instance: PartyMapHud | null = null;
  private containerEl: HTMLElement | null = null;
  private listEl: HTMLElement | null = null;
  private toggleBtn: HTMLButtonElement | null = null;
  private isCollapsed = false;
  private isVisible = true;
  private unsubscribe?: () => void;
  private onFollowerSelect?: (pokemon: PartyPokemon, slotIndex: number) => void;

  private constructor() {
    this.createDom();
    this.subscribeParty();
  }

  public setFollowerHandler(handler: (pokemon: PartyPokemon, slotIndex: number) => void): void {
    this.onFollowerSelect = handler;
  }

  public static getInstance(): PartyMapHud {
    if (!PartyMapHud.instance) {
      PartyMapHud.instance = new PartyMapHud();
    }
    return PartyMapHud.instance;
  }

  private createDom(): void {
    if (typeof document === 'undefined') return;
    if (this.containerEl) return;

    const wrap = document.createElement('div');
    wrap.id = 'partyMapHud';
    wrap.className = 'party-map-hud';
    wrap.setAttribute('aria-label', 'Đội hình Pokémon trên bản đồ');

    wrap.innerHTML = `
      <button id="btnTogglePartyMapHud" class="party-map-hud-toggle" title="Thu gọn / Mở rộng đội hình (Mép phải)">
        <span class="hud-toggle-arrow">▶</span>
      </button>
      <div class="party-map-hud-list" id="partyMapHudList"></div>
    `;

    document.body.appendChild(wrap);

    this.containerEl = wrap;
    this.listEl = wrap.querySelector('#partyMapHudList');
    this.toggleBtn = wrap.querySelector('#btnTogglePartyMapHud');

    this.toggleBtn?.addEventListener('click', () => {
      this.toggleCollapse();
    });

    this.render();
  }

  public toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    if (this.containerEl) {
      this.containerEl.classList.toggle('collapsed', this.isCollapsed);
    }
    if (this.toggleBtn) {
      const arrow = this.toggleBtn.querySelector('.hud-toggle-arrow');
      if (arrow) {
        arrow.textContent = this.isCollapsed ? '◀' : '▶';
      }
    }
  }

  public isHudVisible(): boolean {
    return this.isVisible;
  }

  public isHudCollapsed(): boolean {
    return this.isCollapsed;
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    if (this.containerEl) {
      this.containerEl.style.display = visible ? 'flex' : 'none';
    }
  }

  private subscribeParty(): void {
    this.unsubscribe = partyService.subscribe(() => {
      this.render();
    });
  }

  public render(): void {
    if (!this.listEl) return;

    const party = partyService.getParty();
    const activeFollowerUid = partyService.getActiveFollowerUid();
    this.listEl.innerHTML = '';

    // Render up to 6 slots
    for (let slot = 0; slot < 6; slot++) {
      const pk = party[slot] as PartyPokemon | undefined;
      const isFollowing = !!pk && activeFollowerUid === pk.uid;
      const cardEl = document.createElement('div');
      cardEl.className = `party-hud-card ${pk ? 'member' : 'empty'} ${pk?.isShiny ? 'is-shiny' : ''} ${pk?.isFainted || (pk && pk.currentHp <= 0) ? 'is-fainted' : ''} ${isFollowing ? 'is-following' : ''}`;
      cardEl.dataset.slotIndex = String(slot);
      cardEl.style.backgroundImage = `url('${PARTY_ASSETS.databoxNormal}')`;

      if (pk) {
        const hpPct = Math.max(0, Math.min(100, (pk.currentHp / pk.maxHp) * 100));
        const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 20 ? '#eab308' : '#ef4444';
        const isFainted = pk.isFainted || pk.currentHp <= 0;
        const iconUrl = POKEMON_ASSETS.getIconSprite(pk.speciesKey, pk.isShiny);

        const expPct = pk.maxExp > 0 ? Math.max(0, Math.min(100, (pk.exp / pk.maxExp) * 100)) : 0;

        cardEl.title = `${pk.nickname || pk.name} (Lv.${pk.level}) - HP: ${pk.currentHp}/${pk.maxHp} ${isFollowing ? '[🐾 Đang đi theo bạn]' : '[Bấm để gọi đi theo]'}`;

        cardEl.innerHTML = `
          <!-- Following indicator badge -->
          ${isFollowing ? '<span class="hud-card-following-tag" title="Đang đi theo bạn">🐾 ĐANG THEO</span>' : ''}

          <!-- Pokemon Mini Icon (Left slanted side) -->
          <div class="hud-card-sprite-wrap">
            <img src="${iconUrl}" class="hud-card-pk-icon" alt="${pk.name}" />
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

          <!-- Level indicator -->
          <span class="hud-card-level">Lv.${pk.level}</span>

          <!-- Header info: Name on left, Badges (Shiny + Gender) aligned to right -->
          <div class="hud-card-header">
            <span class="hud-card-name">${pk.nickname || pk.name}</span>
            <div class="hud-card-badges">
              ${
                pk.isShiny
                  ? `<img src="${POKEMON_ASSETS.shinyIcon}" class="hud-card-shiny-icon" alt="Shiny" title="Shiny Pokémon" />`
                  : ''
              }
              ${
                pk.gender === 'male'
                  ? '<span class="hud-card-gender male" title="Đực">♂</span>'
                  : pk.gender === 'female'
                    ? '<span class="hud-card-gender female" title="Cái">♀</span>'
                    : ''
              }
            </div>
          </div>

          <!-- HP Groove Fill (Maps to databox_normal.png HP groove) -->
          <div class="hud-card-hp-groove">
            <div class="hud-card-hp-fill" style="width: ${hpPct}%; background-color: ${hpColor};"></div>
          </div>

          <!-- HP Values & Status Condition -->
          <div class="hud-card-hp-text-row">
            ${
              isFainted
                ? '<span class="hud-card-status-fnt">FNT</span>'
                : `<span class="hud-card-hp-val">${pk.currentHp}/${pk.maxHp}</span>`
            }
          </div>

          <!-- EXP Groove Fill (Bottom groove of databox_normal.png) -->
          <div class="hud-card-exp-groove">
            <div class="hud-card-exp-fill" style="width: ${expPct}%;"></div>
          </div>
        `;

        cardEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.onFollowerSelect) {
            this.onFollowerSelect(pk, slot);
          }
        });
      } else {
        // Empty slot frame
        cardEl.classList.add('empty-slot');
        cardEl.title = `Slot ${slot + 1} (Trống)`;
        cardEl.innerHTML = `
          <div class="hud-card-empty-label">Slot ${slot + 1}</div>
        `;
      }

      this.listEl.appendChild(cardEl);
    }
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
      this.containerEl = null;
    }
    this.listEl = null;
    this.toggleBtn = null;
    PartyMapHud.instance = null;
  }
}

export function initPartyMapHud(
  onFollowerSelect?: (pokemon: PartyPokemon, slotIndex: number) => void
): PartyMapHud {
  const instance = PartyMapHud.getInstance();
  if (onFollowerSelect) {
    instance.setFollowerHandler(onFollowerSelect);
  }
  return instance;
}
