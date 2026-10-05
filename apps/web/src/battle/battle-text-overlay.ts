/**
 * HTML Battle Text Overlay
 * Renders all battle UI text as a high-resolution DOM layer above the game canvas.
 * Eliminates canvas font rasterization blur, grey antialiasing wash, and scaling distortion.
 */

import type { BattleState } from './battle-state';
import type { BattleEngine } from './battle-engine';

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
    this.commandDialogueLine1.textContent = 'What should';
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
    parent.appendChild(this.root);
  }

  /** Update text elements from current game state */
  update(state: BattleState, engine: BattleEngine): void {
    // Visibility and smooth slide-in transform for databoxes
    const enemyT = state.enemyDataboxProgress;
    if (enemyT <= 0) {
      this.enemyBox.style.visibility = 'hidden';
    } else {
      this.enemyBox.style.visibility = 'visible';
      const enemyE = 1 - Math.pow(1 - enemyT, 3);
      const enemySlide = (-100 * (1 - enemyE)).toFixed(2);
      this.enemyBox.style.transform = `translateX(${enemySlide}%)`;
    }

    const playerT = state.playerDataboxProgress;
    if (playerT <= 0) {
      this.playerBox.style.visibility = 'hidden';
    } else {
      this.playerBox.style.visibility = 'visible';
      const playerE = 1 - Math.pow(1 - playerT, 3);
      const playerSlide = (100 * (1 - playerE)).toFixed(2);
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
      this.commandDialogueLine2.textContent = `${player.name} do?`;
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
        this.bagTextEl.textContent = `POKÉ BALLS: x${engine.ballsCount}`;
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
