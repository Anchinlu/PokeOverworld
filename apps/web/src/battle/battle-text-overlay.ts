/**
 * HTML Battle Text Overlay
 * Renders all battle UI text as a high-resolution DOM layer above the game canvas.
 * Eliminates canvas font rasterization blur, grey antialiasing wash, and scaling distortion.
 */

import type { BattleState } from './battle-state';
import type { BattleEngine } from './battle-engine';
import type { LevelUpStatBoost } from './types';
import { battleSePlayer } from '../audio';

export class BattleTextOverlay {
  private root: HTMLDivElement;

  // Enemy databox
  private enemyBox: HTMLDivElement;
  private enemyNameEl: HTMLSpanElement;
  private enemyGenderEl: HTMLSpanElement;
  private enemyLevelEl: HTMLSpanElement;

  // Player databox
  private playerBox: HTMLDivElement;
  private playerNameEl: HTMLSpanElement;
  private playerGenderEl: HTMLSpanElement;
  private playerLevelEl: HTMLSpanElement;
  private playerHpEl: HTMLSpanElement;

  // Bottom panel modes
  private messageModeEl: HTMLDivElement;
  private messageTextEl: HTMLSpanElement;
  private messageCursorEl: HTMLSpanElement;

  private commandModeEl: HTMLDivElement;
  private commandDialogueLine1: HTMLDivElement;
  private commandDialogueLine2: HTMLDivElement;

  private movesModeEl: HTMLDivElement;
  private moveSlotEls: {
    container: HTMLDivElement;
    name: HTMLSpanElement;
    pp: HTMLSpanElement;
  }[] = [];

  private bagModeEl: HTMLDivElement;
  private bagTextEl: HTMLSpanElement;

  // Level-Up Stat Boost Modal (GBA Window Skin, z-index 99)
  private levelUpBackdropEl: HTMLDivElement;
  private levelUpNameEl: HTMLSpanElement;
  private levelUpOldLevelEl: HTMLSpanElement;
  private levelUpNewLevelEl: HTMLSpanElement;
  private levelUpRowsContainer: HTMLDivElement;
  private currentBoost: LevelUpStatBoost | null = null;

  // Cache to skip redundant DOM updates
  private lastDisplayedText = '';
  private lastUiMode = '';
  private lastPlayerHp = -999;
  private lastPlayerMaxHp = -999;
  private lastBallsCount = -999;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'battle-html-overlay';

    // 1. Enemy Databox
    this.enemyBox = document.createElement('div');
    this.enemyBox.className = 'bho-enemy-box';
    this.enemyNameEl = document.createElement('span');
    this.enemyNameEl.className = 'bho-enemy-name bho-text-shadow';
    this.enemyGenderEl = document.createElement('span');
    this.enemyGenderEl.className = 'bho-enemy-gender bho-text-shadow';
    this.enemyLevelEl = document.createElement('span');
    this.enemyLevelEl.className = 'bho-enemy-level bho-text-shadow';
    this.enemyBox.appendChild(this.enemyNameEl);
    this.enemyBox.appendChild(this.enemyGenderEl);
    this.enemyBox.appendChild(this.enemyLevelEl);
    this.root.appendChild(this.enemyBox);

    // 2. Player Databox
    this.playerBox = document.createElement('div');
    this.playerBox.className = 'bho-player-box';
    this.playerNameEl = document.createElement('span');
    this.playerNameEl.className = 'bho-player-name bho-text-shadow';
    this.playerGenderEl = document.createElement('span');
    this.playerGenderEl.className = 'bho-player-gender bho-text-shadow';
    this.playerLevelEl = document.createElement('span');
    this.playerLevelEl.className = 'bho-player-level bho-text-shadow';
    this.playerHpEl = document.createElement('span');
    this.playerHpEl.className = 'bho-player-hp bho-text-shadow';
    this.playerBox.appendChild(this.playerNameEl);
    this.playerBox.appendChild(this.playerGenderEl);
    this.playerBox.appendChild(this.playerLevelEl);
    this.playerBox.appendChild(this.playerHpEl);
    this.root.appendChild(this.playerBox);

    // 3. Bottom Panel Container
    const bottomPanel = document.createElement('div');
    bottomPanel.className = 'bho-bottom-panel';

    // Mode: Message
    this.messageModeEl = document.createElement('div');
    this.messageModeEl.className = 'bho-message-mode';
    this.messageTextEl = document.createElement('span');
    this.messageTextEl.className = 'bho-message-text bho-text-shadow';
    this.messageCursorEl = document.createElement('span');
    this.messageCursorEl.className = 'bho-blinking-cursor bho-text-shadow';
    this.messageCursorEl.textContent = '▼';
    this.messageModeEl.appendChild(this.messageTextEl);
    this.messageModeEl.appendChild(this.messageCursorEl);
    bottomPanel.appendChild(this.messageModeEl);

    // Mode: Command
    this.commandModeEl = document.createElement('div');
    this.commandModeEl.className = 'bho-command-mode';
    const cmdDialogue = document.createElement('div');
    cmdDialogue.className = 'bho-command-dialogue bho-text-shadow';
    this.commandDialogueLine1 = document.createElement('div');
    this.commandDialogueLine1.textContent = 'Bạn muốn';
    this.commandDialogueLine2 = document.createElement('div');
    cmdDialogue.appendChild(this.commandDialogueLine1);
    cmdDialogue.appendChild(this.commandDialogueLine2);
    this.commandModeEl.appendChild(cmdDialogue);
    bottomPanel.appendChild(this.commandModeEl);

    // Mode: Moves
    this.movesModeEl = document.createElement('div');
    this.movesModeEl.className = 'bho-moves-mode';

    for (let i = 0; i < 4; i++) {
      const slot = document.createElement('div');
      slot.className = `bho-move-slot bho-move-slot-${i}`;
      const name = document.createElement('span');
      name.className = 'bho-move-name';
      const pp = document.createElement('span');
      pp.className = 'bho-move-pp';
      slot.appendChild(name);
      slot.appendChild(pp);
      this.movesModeEl.appendChild(slot);
      this.moveSlotEls.push({ container: slot, name, pp });
    }

    bottomPanel.appendChild(this.movesModeEl);

    // Mode: Bag
    this.bagModeEl = document.createElement('div');
    this.bagModeEl.className = 'bho-bag-mode';
    this.bagTextEl = document.createElement('span');
    this.bagTextEl.className = 'bho-bag-text bho-text-shadow';
    this.bagModeEl.appendChild(this.bagTextEl);
    bottomPanel.appendChild(this.bagModeEl);

    this.root.appendChild(bottomPanel);

    // 4. Level-Up Stat Boost Modal (DOM Layer, z-index 99)
    this.levelUpBackdropEl = document.createElement('div');
    this.levelUpBackdropEl.className = 'bho-levelup-backdrop';

    const box = document.createElement('div');
    box.className = 'bho-levelup-box';

    // Header
    const header = document.createElement('div');
    header.className = 'bho-levelup-header';
    header.textContent = '★ LÊN CẤP! (LEVEL UP!) ★';
    box.appendChild(header);

    // Subhead: Pokemon Name & Lv.old -> Lv.new
    const subhead = document.createElement('div');
    subhead.className = 'bho-levelup-subhead';

    this.levelUpNameEl = document.createElement('span');
    this.levelUpNameEl.className = 'bho-levelup-name';

    const levelProgression = document.createElement('div');
    levelProgression.className = 'bho-levelup-level';

    this.levelUpOldLevelEl = document.createElement('span');
    this.levelUpOldLevelEl.className = 'bho-levelup-level-old';

    const arrow = document.createElement('span');
    arrow.className = 'bho-levelup-level-arrow';
    arrow.textContent = '➔';

    this.levelUpNewLevelEl = document.createElement('span');
    this.levelUpNewLevelEl.className = 'bho-levelup-level-new';

    levelProgression.appendChild(this.levelUpOldLevelEl);
    levelProgression.appendChild(arrow);
    levelProgression.appendChild(this.levelUpNewLevelEl);

    subhead.appendChild(this.levelUpNameEl);
    subhead.appendChild(levelProgression);
    box.appendChild(subhead);

    // Stats list
    this.levelUpRowsContainer = document.createElement('div');
    this.levelUpRowsContainer.className = 'bho-levelup-stats-list';
    box.appendChild(this.levelUpRowsContainer);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'bho-levelup-footer';
    footer.textContent = '[ Nhấn Space hoặc Click để tiếp tục ]';
    box.appendChild(footer);

    this.levelUpBackdropEl.appendChild(box);

    if (typeof this.levelUpBackdropEl.addEventListener === 'function') {
      this.levelUpBackdropEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentBoost?.onConfirm) {
          battleSePlayer.playSound('Audio/SE/GUI sel decision.ogg', 0.65);
          const onConfirm = this.currentBoost.onConfirm;
          this.currentBoost = null;
          this.levelUpBackdropEl.style.display = 'none';
          onConfirm();
        }
      });
    }

    this.root.appendChild(this.levelUpBackdropEl);
    parent.appendChild(this.root);
  }

  /** Update text elements from current game state */
  update(state: BattleState, engine: BattleEngine): void {
    // Visibility and smooth slide transform for databoxes (intro slide + capture zoom slide-out)
    const zoomT = state.captureZoomProgress;
    const zoomE = zoomT < 0.5 ? 2 * zoomT * zoomT : 1 - Math.pow(-2 * zoomT + 2, 2) / 2;

    const enemyT = state.enemyDataboxProgress;
    if (enemyT <= 0) {
      this.enemyBox.style.visibility = 'hidden';
    } else {
      this.enemyBox.style.visibility = 'visible';
      const enemyE = 1 - Math.pow(1 - enemyT, 3);
      // Intro slide-in (-100% -> 0%) + Zoom slide-out (0% -> -130%)
      const enemySlide = (-100 * (1 - enemyE) - 130 * zoomE).toFixed(2);
      this.enemyBox.style.transform = `translateX(${enemySlide}%)`;
    }

    const playerT = state.playerDataboxProgress;
    if (playerT <= 0) {
      this.playerBox.style.visibility = 'hidden';
    } else {
      this.playerBox.style.visibility = 'visible';
      const playerE = 1 - Math.pow(1 - playerT, 3);
      // Intro slide-in (100% -> 0%) + Zoom slide-out (0% -> 130%)
      const playerSlide = (100 * (1 - playerE) + 130 * zoomE).toFixed(2);
      this.playerBox.style.transform = `translateX(${playerSlide}%)`;
    }

    if (state.isIntro) {
      this.messageModeEl.style.display = 'none';
      this.commandModeEl.style.display = 'none';
      this.movesModeEl.style.display = 'none';
      this.bagModeEl.style.display = 'none';
      this.lastUiMode = '';
      return;
    }

    const enemy = engine.enemyPokemon;
    const player = engine.playerPokemon;

    // 1. Enemy Databox
    this.enemyNameEl.textContent = enemy.name;
    const eGenderSymbol = enemy.gender === 'male' ? '♂' : enemy.gender === 'female' ? '♀' : '';
    this.enemyGenderEl.textContent = eGenderSymbol;
    this.enemyGenderEl.style.color = enemy.gender === 'male' ? '#3b82f6' : '#ef4444';
    this.enemyLevelEl.textContent = `Lv.${enemy.level}`;

    // 2. Player Databox
    this.playerNameEl.textContent = player.name;
    const pGenderSymbol = player.gender === 'male' ? '♂' : player.gender === 'female' ? '♀' : '';
    this.playerGenderEl.textContent = pGenderSymbol;
    this.playerGenderEl.style.color = player.gender === 'male' ? '#3b82f6' : '#ef4444';
    this.playerLevelEl.textContent = `Lv.${player.level}`;

    const displayHp = Math.round(state.playerHpPct * player.maxHp);
    if (this.lastPlayerHp !== displayHp || this.lastPlayerMaxHp !== player.maxHp) {
      this.lastPlayerHp = displayHp;
      this.lastPlayerMaxHp = player.maxHp;
      this.playerHpEl.textContent = `${displayHp}/${player.maxHp}`;
    }

    // 3. UI Mode Switching
    if (this.lastUiMode !== state.uiMode) {
      this.lastUiMode = state.uiMode;
      this.messageModeEl.style.display = state.uiMode === 'message' ? 'block' : 'none';
      this.commandModeEl.style.display = state.uiMode === 'command' ? 'block' : 'none';
      this.movesModeEl.style.display = state.uiMode === 'moves' ? 'block' : 'none';
      this.bagModeEl.style.display = state.uiMode === 'bag' ? 'block' : 'none';
    }

    // Mode details
    if (state.uiMode === 'message') {
      if (this.lastDisplayedText !== state.currentDisplayedText) {
        this.lastDisplayedText = state.currentDisplayedText;
        this.messageTextEl.textContent = state.currentDisplayedText;
      }
      const showCursor = state.textTypingIndex >= state.messageText.length && state.tick % 30 < 15;
      this.messageCursorEl.style.visibility = showCursor ? 'visible' : 'hidden';
    } else if (state.uiMode === 'command') {
      this.commandDialogueLine2.textContent = `${player.name} làm gì?`;
    } else if (state.uiMode === 'moves') {
      // Moves
      const moves = player.moves;
      for (let i = 0; i < 4; i++) {
        const m = moves[i];
        const slotEl = this.moveSlotEls[i];
        if (m) {
          slotEl.container.style.visibility = 'visible';
          const displayName = (m.nameVi || m.name).replace(/^[^(]+\(([^)]+)\)$/, '$1').trim();
          slotEl.name.textContent = displayName;
          slotEl.pp.textContent = `${m.pp}/${m.maxPp}`;
          slotEl.pp.style.color = m.pp === 0 ? '#ef4444' : '#ffffff';
        } else {
          slotEl.container.style.visibility = 'hidden';
        }
      }
    } else if (state.uiMode === 'bag') {
      if (this.lastBallsCount !== engine.ballsCount) {
        this.lastBallsCount = engine.ballsCount;
        this.bagTextEl.textContent = `BÓNG POKÉ: x${engine.ballsCount}`;
      }
    }

    // 4. Level-Up Stat Boost Modal Display (Topmost DOM layer)
    if (state.levelUpStatBoost) {
      const boost = state.levelUpStatBoost;
      if (this.currentBoost !== boost) {
        this.currentBoost = boost;
        this.levelUpBackdropEl.style.display = 'flex';
        this.levelUpNameEl.textContent = boost.pokemonName.toUpperCase();
        this.levelUpOldLevelEl.textContent = `Lv.${boost.oldLevel}`;
        this.levelUpNewLevelEl.textContent = `Lv.${boost.newLevel}`;

        const statsList = [
          {
            label: 'HP (Máu)',
            oldVal: boost.oldStats.hp,
            newVal: boost.newStats.hp,
            gain: boost.hpGained,
          },
          {
            label: 'Tấn Công',
            oldVal: boost.oldStats.attack,
            newVal: boost.newStats.attack,
            gain: boost.newStats.attack - boost.oldStats.attack,
          },
          {
            label: 'Phòng Thủ',
            oldVal: boost.oldStats.defense,
            newVal: boost.newStats.defense,
            gain: boost.newStats.defense - boost.oldStats.defense,
          },
          {
            label: 'T.Công ĐB',
            oldVal: boost.oldStats.spAtk,
            newVal: boost.newStats.spAtk,
            gain: boost.newStats.spAtk - boost.oldStats.spAtk,
          },
          {
            label: 'P.Thủ ĐB',
            oldVal: boost.oldStats.spDef,
            newVal: boost.newStats.spDef,
            gain: boost.newStats.spDef - boost.oldStats.spDef,
          },
          {
            label: 'Tốc Độ',
            oldVal: boost.oldStats.speed,
            newVal: boost.newStats.speed,
            gain: boost.newStats.speed - boost.oldStats.speed,
          },
        ];

        this.levelUpRowsContainer.innerHTML = '';
        for (const row of statsList) {
          const rowEl = document.createElement('div');
          rowEl.className = 'bho-levelup-stat-row';

          const labelEl = document.createElement('span');
          labelEl.className = 'bho-levelup-stat-label';
          labelEl.textContent = row.label;

          const valsEl = document.createElement('div');
          valsEl.className = 'bho-levelup-stat-vals';

          const oldEl = document.createElement('span');
          oldEl.className = 'bho-levelup-val-old';
          oldEl.textContent = String(row.oldVal);

          const arrEl = document.createElement('span');
          arrEl.className = 'bho-levelup-val-arrow';
          arrEl.textContent = '➔';

          const newEl = document.createElement('span');
          newEl.className = 'bho-levelup-val-new';
          newEl.textContent = String(row.newVal);

          valsEl.appendChild(oldEl);
          valsEl.appendChild(arrEl);
          valsEl.appendChild(newEl);

          const badgeEl = document.createElement('span');
          badgeEl.className = `bho-levelup-badge ${row.gain > 0 ? 'gain' : 'zero'}`;
          badgeEl.textContent = row.gain > 0 ? `▲ +${row.gain}` : '+0';

          rowEl.appendChild(labelEl);
          rowEl.appendChild(valsEl);
          rowEl.appendChild(badgeEl);
          this.levelUpRowsContainer.appendChild(rowEl);
        }
      }
    } else {
      if (this.currentBoost !== null) {
        this.currentBoost = null;
        this.levelUpBackdropEl.style.display = 'none';
      }
    }
  }

  /** Cleanup DOM */
  destroy(): void {
    if (this.root.parentElement) {
      this.root.parentElement.removeChild(this.root);
    }
  }
}
