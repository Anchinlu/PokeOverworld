/**
 * Pure state container for the Battle Screen UI.
 * No DOM, no canvas, no input — only data.
 */

export type BattleUIMode = 'message' | 'command' | 'moves' | 'bag';

export interface MessageEntry {
  text: string;
  nextMode?: 'command' | 'message' | 'end';
  onFinish?: () => void;
}

export class BattleState {
  // HP visual state
  enemyHpPct = 1.0;
  targetEnemyHpPct = 1.0;
  playerHpPct = 1.0;
  targetPlayerHpPct = 1.0;

  // Hurt flash timers
  enemyHurtFlash = 0;
  playerHurtFlash = 0;

  // Ball throw animation
  isThrowingBall = false;
  ballShakeTimer = 0;

  // UI mode
  uiMode: BattleUIMode = 'message';
  hoveredCommandIdx = 0; // 0: FIGHT, 1: BAG, 2: POKÉMON, 3: RUN

  // Typing state
  isTyping = false;
  messageText = '';
  messageQueue: MessageEntry[] = [];
  textTypingIndex = 0;
  currentDisplayedText = '';

  // Animation tick
  tick = 0;
  isRunning = true;

  // --- Methods ---

  /** Advance tick and animate smooth HP bars + flash timers */
  updateTick(): void {
    this.tick++;

    if (this.enemyHpPct > this.targetEnemyHpPct) {
      this.enemyHpPct = Math.max(this.targetEnemyHpPct, this.enemyHpPct - 0.02);
    }
    if (this.playerHpPct > this.targetPlayerHpPct) {
      this.playerHpPct = Math.max(this.targetPlayerHpPct, this.playerHpPct - 0.02);
    }

    if (this.enemyHurtFlash > 0) this.enemyHurtFlash--;
    if (this.playerHurtFlash > 0) this.playerHurtFlash--;
    if (this.ballShakeTimer > 0) this.ballShakeTimer--;
  }

  /** Queue a message for the typewriter display */
  queueMessage(
    text: string,
    nextMode: 'command' | 'message' | 'end' = 'command',
    onFinish?: () => void
  ): void {
    this.messageQueue.push({ text, nextMode, onFinish });
    if (!this.isTyping) {
      this.advanceMessage();
    }
  }

  /** Advance to the next message in the queue (starts typewriter) */
  advanceMessage(): void {
    if (this.messageQueue.length === 0) {
      this.uiMode = 'command';
      this.isTyping = false;
      return;
    }

    const next = this.messageQueue.shift()!;
    this.messageText = next.text;
    this.textTypingIndex = 0;
    this.currentDisplayedText = '';
    this.uiMode = 'message';
    this.isTyping = true;

    // The actual typing interval is managed by BattleController
    // We store onFinish/nextMode on the _currentMessage so the controller can call it
    this._currentMessageEntry = next;
  }

  /** The message entry currently being typed (used by controller to call onFinish) */
  _currentMessageEntry: MessageEntry | null = null;

  /** Called each typing tick by the controller */
  typeNextChar(): boolean {
    if (this.textTypingIndex < this.messageText.length) {
      this.currentDisplayedText += this.messageText[this.textTypingIndex];
      this.textTypingIndex++;
      return false; // not done yet
    }
    return true; // done typing
  }

  /** Skip to end of current message */
  skipToEnd(): void {
    this.currentDisplayedText = this.messageText;
    this.textTypingIndex = this.messageText.length;
  }
}
