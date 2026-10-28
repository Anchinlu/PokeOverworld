/**
 * Trainer Card UI (Thẻ Huấn Luyện Viên)
 * Displays authentic Pokémon Trainer Card with Trainer ID, Name, Gender,
 * Money, Pokédex count, Play Time, 8 Kanto Badges, and Current Party preview.
 */

import { playerService } from '../domain/player/player-service';
import { partyService } from '../domain/party/party-service';
import { POKEMON_ASSETS } from '../assets';

export interface BadgeInfo {
  id: string;
  name: string;
  leader: string;
  city: string;
  color: string;
  icon: string;
}

export const KANTO_BADGES: BadgeInfo[] = [
  { id: 'boulder', name: 'Boulder', leader: 'Brock', city: 'Pewter City', color: '#94a3b8', icon: '🪨' },
  { id: 'cascade', name: 'Cascade', leader: 'Misty', city: 'Cerulean City', color: '#38bdf8', icon: '💧' },
  { id: 'thunder', name: 'Thunder', leader: 'Lt. Surge', city: 'Vermilion City', color: '#facc15', icon: '⚡' },
  { id: 'rainbow', name: 'Rainbow', leader: 'Erika', city: 'Celadon City', color: '#4ade80', icon: '🌈' },
  { id: 'soul', name: 'Soul', leader: 'Koga', city: 'Fuchsia City', color: '#c084fc', icon: '💜' },
  { id: 'marsh', name: 'Marsh', leader: 'Sabrina', city: 'Saffron City', color: '#fb923c', icon: '🔮' },
  { id: 'volcano', name: 'Volcano', leader: 'Blaine', city: 'Cinnabar Island', color: '#f87171', icon: '🌋' },
  { id: 'earth', name: 'Earth', leader: 'Giovanni', city: 'Viridian City', color: '#10b981', icon: '🌿' },
];

function formatPlayTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTrainerId(rawId: string): string {
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash * 31 + rawId.charCodeAt(i)) >>> 0;
  }
  return String(hash % 100000).padStart(5, '0');
}

export class TrainerCardModal {
  private static instance: TrainerCardModal | null = null;
  private container: HTMLDivElement | null = null;
  private isOpen = false;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  public static getInstance(): TrainerCardModal {
    if (!TrainerCardModal.instance) {
      TrainerCardModal.instance = new TrainerCardModal();
    }
    return TrainerCardModal.instance;
  }

  public open(): void {
    if (this.isOpen) return;
    this.ensureDom();
    this.render();
    if (this.container) {
      this.container.style.display = 'flex';
      this.isOpen = true;
    }

    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    window.addEventListener('keydown', this.keydownHandler);
  }

  public close(): void {
    if (!this.isOpen || !this.container) return;
    this.container.style.display = 'none';
    this.isOpen = false;
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public isVisible(): boolean {
    return this.isOpen;
  }

  private ensureDom(): void {
    if (this.container || typeof document === 'undefined') return;

    this.injectStyles();

    this.container = document.createElement('div');
    this.container.id = 'trainerCardModalBackdrop';
    this.container.className = 'tc-backdrop';
    this.container.style.display = 'none';

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    document.body.appendChild(this.container);
  }

  private render(): void {
    if (!this.container) return;

    const profile = playerService.getProfile();
    const party = partyService.getParty();
    const trainerIdNum = formatTrainerId(profile.id);
    const genderLabel = profile.gender === 'female' ? 'Nữ ♀ (Female)' : 'Nam ♂ (Male)';
    const playTimeStr = formatPlayTime(profile.playTimeSeconds);

    const badgesHtml = KANTO_BADGES.map((b) => {
      const earned = profile.badges.includes(b.id) || profile.badges.includes(b.name);
      return `
        <div class="tc-badge-slot ${earned ? 'earned' : 'locked'}" title="${b.name} Badge - Gym Leader ${b.leader} (${b.city})">
          <div class="tc-badge-icon" style="${earned ? `color: ${b.color}; text-shadow: 0 0 8px ${b.color};` : 'filter: grayscale(100%) opacity(0.35);'}">
            ${b.icon}
          </div>
          <span class="tc-badge-label">${b.name}</span>
        </div>
      `;
    }).join('');

    const partyHtml = Array.from({ length: 6 }).map((_, i) => {
      const pk = party[i];
      if (!pk) {
        return `
          <div class="tc-party-slot empty">
            <div class="tc-party-empty-ball">⚪</div>
            <span class="tc-party-empty-label">Trống</span>
          </div>
        `;
      }
      const iconUrl = POKEMON_ASSETS.getIconSprite(pk.speciesKey, pk.isShiny);
      return `
        <div class="tc-party-slot filled" title="${pk.nickname || pk.name} Lv.${pk.level}">
          <div class="tc-party-icon-box">
            <img src="${iconUrl}" class="tc-party-icon" alt="${pk.name}" />
            ${pk.isShiny ? `<img src="${POKEMON_ASSETS.shinyIcon}" class="tc-party-shiny" alt="Shiny" />` : ''}
          </div>
          <div class="tc-party-info">
            <span class="tc-party-name">${pk.nickname || pk.name}</span>
            <span class="tc-party-level">Lv.${pk.level}</span>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="tc-card-window" role="dialog" aria-modal="true" aria-labelledby="tcTitle">
        <!-- Header Strip -->
        <div class="tc-header">
          <div class="tc-title-box">
            <span class="tc-card-type">KANTO LEAGUE</span>
            <h2 class="tc-title" id="tcTitle">THẺ HUẤN LUYỆN VIÊN</h2>
          </div>
          <button class="tc-btn-close" id="btnTcCloseX" title="Đóng thẻ (Esc)">✕</button>
        </div>

        <!-- Card Body -->
        <div class="tc-body">
          <!-- Top Row: Photo & Main Info -->
          <div class="tc-top-section">
            <div class="tc-avatar-box">
              <div class="tc-avatar-frame">
                <div class="tc-avatar-inner ${profile.gender}">
                  <span class="tc-avatar-badge">${profile.gender === 'female' ? '♀' : '♂'}</span>
                </div>
              </div>
              <div class="tc-avatar-name">${profile.name}</div>
            </div>

            <div class="tc-stats-panel">
              <div class="tc-stat-row">
                <span class="tc-stat-label">MÃ HLV (IDNo.):</span>
                <span class="tc-stat-value tc-id-val">${trainerIdNum}</span>
              </div>
              <div class="tc-stat-row">
                <span class="tc-stat-label">TÊN (NAME):</span>
                <span class="tc-stat-value">${profile.name}</span>
              </div>
              <div class="tc-stat-row">
                <span class="tc-stat-label">GIỚI TÍNH:</span>
                <span class="tc-stat-value">${genderLabel}</span>
              </div>
              <div class="tc-stat-row">
                <span class="tc-stat-label">TIỀN MẶT (MONEY):</span>
                <span class="tc-stat-value tc-money-val">$${profile.money.toLocaleString()}</span>
              </div>
              <div class="tc-stat-row">
                <span class="tc-stat-label">POKÉDEX:</span>
                <span class="tc-stat-value">
                  Đã thấy: <b>${profile.pokedexSeenCount}</b> | Đã bắt: <b>${profile.pokedexCaughtCount}</b>
                </span>
              </div>
              <div class="tc-stat-row">
                <span class="tc-stat-label">THỜI GIAN CHƠI:</span>
                <span class="tc-stat-value tc-time-val">⏱️ ${playTimeStr}</span>
              </div>
            </div>
          </div>

          <!-- Middle Section: Badges -->
          <div class="tc-section-title">
            <span>HUY HIỆU GYM KANTO (${profile.badges.length}/8)</span>
          </div>
          <div class="tc-badges-grid">
            ${badgesHtml}
          </div>

          <!-- Bottom Section: Active Party -->
          <div class="tc-section-title">
            <span>ĐỘI HÌNH HIỆN TẠI (${party.length}/6)</span>
          </div>
          <div class="tc-party-grid">
            ${partyHtml}
          </div>
        </div>

        <!-- Footer -->
        <div class="tc-footer">
          <span class="tc-hint">Bấm ESC hoặc nút ĐÓNG để quay lại trò chơi</span>
          <button class="tc-btn-action" id="btnTcClose">ĐÓNG</button>
        </div>
      </div>
    `;

    const closeBtnX = this.container.querySelector('#btnTcCloseX');
    closeBtnX?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    const closeBtn = this.container.querySelector('#btnTcClose');
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
  }

  private injectStyles(): void {
    if (document.getElementById('tcStyles')) return;
    const style = document.createElement('style');
    style.id = 'tcStyles';
    style.textContent = `
      .tc-backdrop {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(8, 12, 24, 0.75);
        backdrop-filter: blur(4px);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #f8fafc;
      }
      .tc-card-window {
        width: 600px;
        max-width: 95vw;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 3px solid #38bdf8;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), inset 0 0 12px rgba(56, 189, 248, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: tcPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes tcPopIn {
        from { transform: scale(0.92); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .tc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 18px;
        background: linear-gradient(90deg, #0284c7 0%, #0369a1 100%);
        border-bottom: 2px solid #38bdf8;
      }
      .tc-title-box {
        display: flex;
        flex-direction: column;
      }
      .tc-card-type {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 2px;
        color: #bae6fd;
        text-transform: uppercase;
      }
      .tc-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.5px;
        color: #ffffff;
        text-shadow: 0 2px 4px rgba(0,0,0,0.4);
      }
      .tc-btn-close {
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #fff;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
      }
      .tc-btn-close:hover {
        background: #ef4444;
        border-color: #f87171;
      }
      .tc-body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        max-height: 80vh;
        overflow-y: auto;
      }
      .tc-top-section {
        display: flex;
        gap: 16px;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 14px;
      }
      .tc-avatar-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100px;
      }
      .tc-avatar-frame {
        width: 76px;
        height: 76px;
        border-radius: 50%;
        border: 3px solid #38bdf8;
        padding: 2px;
        background: #0f172a;
      }
      .tc-avatar-inner {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: bold;
      }
      .tc-avatar-inner.male {
        background: linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%);
        color: #7dd3fc;
      }
      .tc-avatar-inner.female {
        background: linear-gradient(135deg, #ec4899 0%, #831843 100%);
        color: #fbcfe8;
      }
      .tc-avatar-name {
        margin-top: 6px;
        font-size: 14px;
        font-weight: 700;
        color: #f8fafc;
      }
      .tc-stats-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
        justify-content: center;
      }
      .tc-stat-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        border-bottom: 1px dashed rgba(100, 116, 139, 0.4);
        padding-bottom: 3px;
      }
      .tc-stat-label {
        color: #94a3b8;
        font-weight: 600;
      }
      .tc-stat-value {
        color: #f1f5f9;
        font-weight: 500;
      }
      .tc-id-val {
        font-family: monospace;
        font-size: 13px;
        letter-spacing: 1px;
        color: #38bdf8;
      }
      .tc-money-val {
        color: #facc15;
        font-weight: 700;
      }
      .tc-time-val {
        color: #a7f3d0;
      }
      .tc-section-title {
        display: flex;
        align-items: center;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1px;
        color: #38bdf8;
        text-transform: uppercase;
        border-left: 3px solid #38bdf8;
        padding-left: 8px;
      }
      .tc-badges-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }
      .tc-badge-slot {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid #334155;
        border-radius: 6px;
        padding: 8px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        transition: transform 0.15s, border-color 0.15s;
      }
      .tc-badge-slot.earned {
        border-color: #38bdf8;
        background: rgba(56, 189, 248, 0.08);
      }
      .tc-badge-slot.earned:hover {
        transform: translateY(-2px);
        border-color: #facc15;
      }
      .tc-badge-icon {
        font-size: 24px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tc-badge-label {
        font-size: 11px;
        font-weight: 600;
        color: #cbd5e1;
      }
      .tc-badge-slot.locked .tc-badge-label {
        color: #64748b;
      }
      .tc-party-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .tc-party-slot {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid #334155;
        border-radius: 6px;
        padding: 6px 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tc-party-slot.filled {
        border-color: #475569;
      }
      .tc-party-icon-box {
        position: relative;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tc-party-icon {
        width: 32px;
        height: 32px;
        image-rendering: pixelated;
      }
      .tc-party-shiny {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
      }
      .tc-party-info {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .tc-party-name {
        font-size: 12px;
        font-weight: 700;
        color: #f8fafc;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .tc-party-level {
        font-size: 11px;
        font-weight: 600;
        color: #38bdf8;
      }
      .tc-party-slot.empty {
        opacity: 0.45;
        justify-content: center;
        gap: 6px;
      }
      .tc-party-empty-ball {
        font-size: 14px;
      }
      .tc-party-empty-label {
        font-size: 11px;
        color: #94a3b8;
      }
      .tc-footer {
        padding: 10px 16px;
        background: rgba(15, 23, 42, 0.85);
        border-top: 1px solid #334155;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .tc-hint {
        font-size: 11px;
        color: #64748b;
      }
      .tc-btn-action {
        background: #0284c7;
        border: 1px solid #38bdf8;
        color: #fff;
        padding: 6px 18px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
      }
      .tc-btn-action:hover {
        background: #0369a1;
      }
    `;
    document.head.appendChild(style);
  }
}

export const trainerCardModal = TrainerCardModal.getInstance();

export function openTrainerCard(): void {
  trainerCardModal.open();
}

export function closeTrainerCard(): void {
  trainerCardModal.close();
}

export function toggleTrainerCard(): void {
  trainerCardModal.toggle();
}
