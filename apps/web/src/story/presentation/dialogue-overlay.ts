/**
 * Dialogue & Character Bust Presentation Overlay
 * Implements StoryDialoguePort with Retro GBA typewriter box,
 * speaker badge, sounds, and large character bust portraits.
 */

import { battleSePlayer } from '../../audio';
import type { StoryDialoguePort } from '../ports/story-dialogue-port';
import type { DialogueOptions } from '../types/cutscene-types';

export class DialogueOverlay implements StoryDialoguePort {
  private static instance: DialogueOverlay;
  private dialogueBoxEl: HTMLElement | null = null;
  private bustWrapperEl: HTMLElement | null = null;
  private bustImgEl: HTMLImageElement | null = null;
  private activeResolve: (() => void) | null = null;
  private isShowing = false;

  public static getInstance(): DialogueOverlay {
    if (!DialogueOverlay.instance) {
      DialogueOverlay.instance = new DialogueOverlay();
    }
    return DialogueOverlay.instance;
  }

  private initDom(): void {
    if (typeof document === 'undefined') return;

    let bustWrapper = document.getElementById('palletPrologueBustWrapper') as HTMLDivElement | null;
    if (!bustWrapper) {
      bustWrapper = document.createElement('div');
      bustWrapper.id = 'palletPrologueBustWrapper';
      bustWrapper.className = 'starter-char-bust-wrapper pallet-prologue-bust-wrapper';
      bustWrapper.style.display = 'none';
      bustWrapper.innerHTML = `
        <img id="palletPrologueBustImg" class="starter-char-bust-img" src="" alt="Character Bust" />
      `;
      document.body.appendChild(bustWrapper);
    }
    this.bustWrapperEl = bustWrapper;
    this.bustImgEl = bustWrapper.querySelector<HTMLImageElement>('#palletPrologueBustImg');

    let box = document.getElementById('palletPrologueDialogueBox') as HTMLDivElement | null;
    if (!box) {
      box = document.createElement('div');
      box.id = 'palletPrologueDialogueBox';
      box.className = 'interior-dialogue-box';
      box.style.display = 'none';
      box.innerHTML = `
        <div class="interior-dialogue-speaker" id="palletCutsceneSpeaker"></div>
        <div class="interior-dialogue-content" id="palletCutsceneContent"></div>
        <div class="interior-dialogue-footer" id="palletCutsceneFooter">▼ [Space]</div>
      `;
      document.body.appendChild(box);
    }
    this.dialogueBoxEl = box;
  }

  public showDialogue(
    speaker: string,
    lines: string[],
    options?: DialogueOptions
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      this.initDom();
      if (!this.dialogueBoxEl) {
        resolve();
        return;
      }

      this.isShowing = true;
      const speakerEl = this.dialogueBoxEl.querySelector<HTMLElement>('#palletCutsceneSpeaker');
      const contentEl = this.dialogueBoxEl.querySelector<HTMLElement>('#palletCutsceneContent');
      const footerEl = this.dialogueBoxEl.querySelector<HTMLElement>('#palletCutsceneFooter');

      // Setup character bust portrait
      if (this.bustWrapperEl && this.bustImgEl) {
        if (options?.portraitSrc) {
          this.bustImgEl.src = options.portraitSrc;
          if (options.position === 'right') {
            this.bustWrapperEl.classList.add('bust-align-right');
          } else {
            this.bustWrapperEl.classList.remove('bust-align-right');
          }
          if (options.zapShake) {
            this.bustWrapperEl.classList.add('zap-shake');
          } else {
            this.bustWrapperEl.classList.remove('zap-shake');
          }
          this.bustWrapperEl.style.display = 'flex';
        } else {
          this.bustWrapperEl.style.display = 'none';
          this.bustWrapperEl.classList.remove('bust-align-right');
          this.bustWrapperEl.classList.remove('zap-shake');
        }
      }

      if (speakerEl) speakerEl.textContent = speaker;
      if (footerEl) footerEl.textContent = '▼ [Space]';

      let lineIndex = 0;
      const renderCurrentLine = () => {
        if (contentEl) {
          contentEl.textContent = lines[lineIndex] ?? '';
        }
      };

      renderCurrentLine();
      this.dialogueBoxEl.style.display = 'flex';

      const advance = () => {
        lineIndex++;
        if (lineIndex < lines.length) {
          renderCurrentLine();
          battleSePlayer.playSound('Audio/SE/Select.ogg', 0.85);
        } else {
          window.removeEventListener('keydown', keyHandler);
          if (this.dialogueBoxEl) {
            this.dialogueBoxEl.removeEventListener('click', clickHandler);
          }
          this.hideDialogue();
          this.activeResolve = null;
          resolve();
        }
      };

      const keyHandler = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
          e.preventDefault();
          advance();
        }
      };

      const clickHandler = () => {
        advance();
      };

      this.activeResolve = () => {
        window.removeEventListener('keydown', keyHandler);
        if (this.dialogueBoxEl) {
          this.dialogueBoxEl.removeEventListener('click', clickHandler);
        }
        this.hideDialogue();
        resolve();
      };

      window.addEventListener('keydown', keyHandler);
      this.dialogueBoxEl.addEventListener('click', clickHandler);
    });
  }

  public hideDialogue(): void {
    if (typeof document === 'undefined') return;
    this.isShowing = false;
    if (this.dialogueBoxEl) {
      this.dialogueBoxEl.style.display = 'none';
    }
    if (this.bustWrapperEl) {
      this.bustWrapperEl.style.display = 'none';
      this.bustWrapperEl.classList.remove('zap-shake');
      this.bustWrapperEl.classList.remove('bust-align-right');
    }
  }

  public isDialogueActive(): boolean {
    return this.isShowing;
  }

  public dispose(): void {
    if (this.activeResolve) {
      this.activeResolve();
      this.activeResolve = null;
    }
    this.hideDialogue();
  }
}

export const dialogueOverlay = DialogueOverlay.getInstance();
