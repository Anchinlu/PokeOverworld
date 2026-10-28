/**
 * Quest Tracker Controller
 * Quản lý HUD Nhiệm vụ (không sử dụng emoji, thuần phong cách pixel retro).
 */

import { playerService, partyService } from '../../domain';
import { battleSePlayer } from '../../audio';
import { questRegistry } from './quest-registry';
import { autoWalkNavigator } from './auto-walk-navigator';

export class QuestTrackerController {
  private static instance: QuestTrackerController;
  private containerEl: HTMLElement | null = null;
  private isCollapsed = false;
  private session: any = null;
  private lastTelemetryTick = 0;

  public static getInstance(): QuestTrackerController {
    if (!QuestTrackerController.instance) {
      QuestTrackerController.instance = new QuestTrackerController();
    }
    return QuestTrackerController.instance;
  }

  public init(session?: any): void {
    this.session = session;
    this.ensureContainer();
    this.render();

    playerService.subscribe(() => {
      this.render();
    });

    partyService.subscribe(() => {
      this.render();
    });
  }

  public setSession(session: any): void {
    this.session = session;
    this.render();
  }

  public toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    battleSePlayer.playSound('Audio/SE/GUI sel cursor.ogg', 0.55);
    this.render();
  }

  public isWidgetCollapsed(): boolean {
    return this.isCollapsed;
  }

  public setVisible(visible: boolean): void {
    if (!this.containerEl) return;
    this.containerEl.style.display = visible ? 'flex' : 'none';
  }

  /**
   * Smoothly updates live auto-walk buttons and telemetry without rebuilding entire DOM.
   */
  public updateTick(session: any): void {
    this.session = session;
    if (!this.containerEl || this.isCollapsed || !session) return;

    const now = performance.now();
    if (now - this.lastTelemetryTick < 100) return;
    this.lastTelemetryTick = now;

    const isAutoWalking = autoWalkNavigator.isAutoWalking();
    const activeQuestId = autoWalkNavigator.getActiveQuestId();

    const eventCards = this.containerEl.querySelectorAll<HTMLElement>('.quest-card[data-category="event"]');
    eventCards.forEach((card) => {
      const questId = card.dataset.questId;
      const btn = card.querySelector<HTMLButtonElement>('.quest-autowalk-btn');
      if (btn) {
        if (isAutoWalking && activeQuestId === questId) {
          btn.textContent = '[ ĐANG TỰ ĐẾN - BẤM ĐỂ HỦY ]';
          btn.className = 'quest-autowalk-btn walking';
          card.classList.add('is-walking');
        } else {
          btn.textContent = '[ TỰ ĐẾN ĐIỂM SỰ KIỆN ]';
          btn.className = 'quest-autowalk-btn';
          card.classList.remove('is-walking');
        }
      }
    });
  }

  private ensureContainer(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    if (!this.containerEl) {
      let el = document.getElementById('questTrackerWidget');
      if (!el) {
        el = document.createElement('aside');
        el.id = 'questTrackerWidget';
        el.className = 'quest-tracker-widget';
        document.body.appendChild(el);
      }
      this.containerEl = el;
    }
    return this.containerEl;
  }

  public render(): void {
    const container = this.ensureContainer();
    if (!container) return;

    if (this.isCollapsed) {
      container.className = 'quest-tracker-widget collapsed';
      container.innerHTML = `
        <button class="quest-collapsed-btn" id="btnExpandQuests" title="Mở danh sách nhiệm vụ (Phím J)">
          <span class="quest-collapsed-label">NHIỆM VỤ</span>
          <span class="quest-collapsed-key">[J]</span>
          <span class="quest-collapsed-arrow">▼</span>
        </button>
      `;

      const btnExpand = container.querySelector('#btnExpandQuests');
      btnExpand?.addEventListener('click', () => this.toggleCollapse());
      return;
    }

    container.className = 'quest-tracker-widget expanded';

    const eventQuests = questRegistry.getActiveEventQuests(this.session);
    const gatheringQuests = questRegistry.getActiveGatheringQuests(this.session);
    const activeAutoWalkQuestId = autoWalkNavigator.getActiveQuestId();
    const isAutoWalking = autoWalkNavigator.isAutoWalking();

    let questsHtml = '';

    // =========================================================================
    // 1. NHIỆM VỤ SỰ KIỆN (EVENT QUESTS) - Tự động dẫn bước nhân vật
    // =========================================================================
    if (eventQuests.length > 0) {
      questsHtml += `
        <div class="quest-category-header event-header">
          <span class="quest-cat-badge event-badge">NHIỆM VỤ SỰ KIỆN</span>
          <span class="quest-cat-act">CỐT TRUYỆN</span>
        </div>
      `;

      eventQuests.forEach((quest) => {
        const isWalkingThis = isAutoWalking && activeAutoWalkQuestId === quest.id;
        const target = questRegistry.resolveTarget(quest, this.session);

        let distanceStr = '';
        if (target && this.session?.player) {
          const dx = target.gx - this.session.player.gx;
          const dy = target.gy - this.session.player.gy;
          const steps = Math.round(Math.hypot(dx, dy));
          distanceStr = ` (~${steps} bước)`;
        }

        questsHtml += `
          <div class="quest-card event-card ${isWalkingThis ? 'is-walking' : ''}" data-category="event" data-quest-id="${quest.id}">
            <div class="quest-card-top">
              <span class="quest-title">${quest.title}</span>
            </div>
            <div class="quest-summary">${quest.summary}</div>
            ${
              target
                ? `<div class="quest-target-row">
                    <span class="quest-location-label">Mục tiêu: ${target.label}${distanceStr}</span>
                  </div>`
                : ''
            }
            <div class="quest-actions-row">
              <button class="quest-autowalk-btn ${isWalkingThis ? 'walking' : ''}" data-quest-id="${quest.id}">
                ${isWalkingThis ? '[ ĐANG TỰ ĐẾN - BẤM ĐỂ HỦY ]' : '[ TỰ ĐẾN ĐIỂM SỰ KIỆN ]'}
              </button>
            </div>
          </div>
        `;
      });
    }

    // =========================================================================
    // 2. NHIỆM VỤ THU THẬP (GATHERING QUESTS) - Làm theo ghi chú
    // =========================================================================
    if (gatheringQuests.length > 0) {
      questsHtml += `
        <div class="quest-category-header gathering-header">
          <span class="quest-cat-badge gathering-badge">NHIỆM VỤ THU THẬP</span>
          <span class="quest-cat-act">KHÁM PHÁ</span>
        </div>
      `;

      gatheringQuests.forEach((quest) => {
        const progress = quest.getProgress?.(this.session);

        questsHtml += `
          <div class="quest-card gathering-card" data-category="gathering" data-quest-id="${quest.id}">
            <div class="quest-card-top">
              <span class="quest-title">${quest.title}</span>
            </div>
            <div class="quest-summary">${quest.summary}</div>
            ${
              quest.notes
                ? `<div class="quest-notes-box">
                    <span class="quest-notes-tag">[Ghi chú]:</span>
                    <span class="quest-notes-text">${quest.notes}</span>
                  </div>`
                : ''
            }
            ${
              progress
                ? `<div class="quest-progress-bar">
                    <div class="quest-progress-fill" style="width: ${(progress.current / progress.total) * 100}%"></div>
                    <span class="quest-progress-label">${progress.label ?? `${progress.current}/${progress.total}`}</span>
                  </div>`
                : ''
            }
          </div>
        `;
      });
    }

    container.innerHTML = `
      <div class="quest-header">
        <div class="quest-header-title">
          <span>BẢNG NHIỆM VỤ</span>
          <span class="quest-hotkey">[J]</span>
        </div>
        <button class="quest-collapse-toggle" id="btnCollapseQuests" title="Thu gọn bảng nhiệm vụ (Phím J)">◀</button>
      </div>
      <div class="quest-body">
        ${questsHtml}
      </div>
    `;

    // Attach event listeners
    const btnCollapse = container.querySelector('#btnCollapseQuests');
    btnCollapse?.addEventListener('click', () => this.toggleCollapse());

    const autoWalkButtons = container.querySelectorAll<HTMLButtonElement>('.quest-autowalk-btn');
    autoWalkButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const questId = btn.dataset.questId;
        if (!questId) return;

        const quest = questRegistry.getQuestById(questId);
        if (!quest) return;

        autoWalkNavigator.toggleAutoWalk(quest, this.session);
        this.render();
      });
    });
  }
}

export const questTrackerController = QuestTrackerController.getInstance();
