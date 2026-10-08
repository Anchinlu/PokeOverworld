/**
 * Game Intro Cinematic Controller
 * Features:
 * - Pure dark screen initialization
 * - Glowing white outline logo (logo2.png) fade-in
 * - Full color iconic Pokémon logo (logo1.png) reveal with radiant glow
 * - Middle horizontal split screen transition: Top half slides up, bottom half slides down
 * - Smooth skip mechanism on pointer click or key press
 */

export interface GameIntroController {
  skip: () => void;
  destroy: () => void;
  isComplete: boolean;
}

export function playGameIntro(onComplete?: () => void): GameIntroController {
  // 1. Remove any existing intro overlay if present
  const existing = document.getElementById('gameIntroOverlay');
  if (existing) {
    existing.remove();
  }

  // 2. Build DOM Structure
  const overlay = document.createElement('div');
  overlay.id = 'gameIntroOverlay';
  overlay.className = 'game-intro-overlay';

  overlay.innerHTML = `
    <!-- Top Shutter (Slides UP on split) -->
    <div class="intro-shutter intro-shutter-top" id="introShutterTop">
      <div class="intro-content-wrapper intro-content-top">
        <div class="intro-logo-box">
          <img class="intro-logo intro-logo-outline" id="introLogo2Top" src="/Graphics/Intro/logo2.png" alt="Logo Outline" />
          <img class="intro-logo intro-logo-color" id="introLogo1Top" src="/Graphics/Intro/logo1.png" alt="Pokemon Logo" />
        </div>
      </div>
    </div>

    <!-- Bottom Shutter (Slides DOWN on split) -->
    <div class="intro-shutter intro-shutter-bottom" id="introShutterBottom">
      <div class="intro-content-wrapper intro-content-bottom">
        <div class="intro-logo-box">
          <img class="intro-logo intro-logo-outline" id="introLogo2Bottom" src="/Graphics/Intro/logo2.png" alt="Logo Outline" />
          <img class="intro-logo intro-logo-color" id="introLogo1Bottom" src="/Graphics/Intro/logo1.png" alt="Pokemon Logo" />
        </div>
      </div>
    </div>

    <!-- Center Energy Flash at the split moment -->
    <div class="intro-center-flash" id="introCenterFlash"></div>

    <!-- Skip Hint Badge -->
    <div class="intro-skip-hint" id="introSkipHint">
      <span>Nhấp chuột hoặc phím bất kỳ để tiếp tục</span>
    </div>
  `;

  document.body.appendChild(overlay);

  // 3. Controller state & timers
  let isComplete = false;
  let hasSplitStarted = false;
  const timeoutIds: number[] = [];

  const topShutter = overlay.querySelector('#introShutterTop') as HTMLElement;
  const bottomShutter = overlay.querySelector('#introShutterBottom') as HTMLElement;
  const logo2Top = overlay.querySelector('#introLogo2Top') as HTMLElement;
  const logo2Bottom = overlay.querySelector('#introLogo2Bottom') as HTMLElement;
  const logo1Top = overlay.querySelector('#introLogo1Top') as HTMLElement;
  const logo1Bottom = overlay.querySelector('#introLogo1Bottom') as HTMLElement;
  const centerFlash = overlay.querySelector('#introCenterFlash') as HTMLElement;
  const skipHint = overlay.querySelector('#introSkipHint') as HTMLElement;

  const cleanup = () => {
    timeoutIds.forEach((id) => window.clearTimeout(id));
    window.removeEventListener('keydown', handleKey);
    overlay.removeEventListener('pointerdown', handleClick);
    if (overlay.parentNode) {
      overlay.remove();
    }
    if (!isComplete) {
      isComplete = true;
      if (onComplete) onComplete();
    }
  };

  const triggerSplitAnimation = () => {
    if (hasSplitStarted) return;
    hasSplitStarted = true;

    // Flash beam along the middle seam
    if (centerFlash) {
      centerFlash.classList.add('flash');
    }

    // Hide skip hint
    if (skipHint) {
      skipHint.style.opacity = '0';
    }

    // Small delay to let the seam beam flash, then slide both halves open
    const splitTimer = window.setTimeout(() => {
      if (topShutter) topShutter.classList.add('split-open');
      if (bottomShutter) bottomShutter.classList.add('split-open');

      // After shutters slide completely out of view, finish
      const endTimer = window.setTimeout(() => {
        cleanup();
      }, 950); // Matches CSS transition duration (900ms + buffer)
      timeoutIds.push(endTimer);
    }, 150);
    timeoutIds.push(splitTimer);
  };

  const skip = () => {
    if (isComplete) return;
    if (!hasSplitStarted) {
      // Ensure logos are at least visible if skipped early, then trigger split immediately
      if (logo1Top) logo1Top.classList.add('visible');
      if (logo1Bottom) logo1Bottom.classList.add('visible');
      triggerSplitAnimation();
    } else {
      // If split already running, finish immediately
      cleanup();
    }
  };

  const handleKey = (e: KeyboardEvent) => {
    // Any interactive key triggers skip/advance
    if (['Space', 'Enter', 'Escape', 'KeyZ', 'KeyX'].includes(e.code) || e.key) {
      skip();
    }
  };

  const handleClick = (e: MouseEvent) => {
    if (e.button === 0) {
      skip();
    }
  };

  window.addEventListener('keydown', handleKey);
  overlay.addEventListener('pointerdown', handleClick);

  // 4. Animation Timeline
  // Phase 1: Pure dark screen (0 to 600ms)

  // Phase 2: logo2.png (white outline) fades in (at 600ms)
  timeoutIds.push(
    window.setTimeout(() => {
      if (hasSplitStarted) return;
      if (logo2Top) logo2Top.classList.add('visible');
      if (logo2Bottom) logo2Bottom.classList.add('visible');
    }, 600)
  );

  // Phase 3: logo1.png (vibrant full-color logo) reveals and flashes (at 2200ms)
  timeoutIds.push(
    window.setTimeout(() => {
      if (hasSplitStarted) return;
      if (logo1Top) logo1Top.classList.add('visible');
      if (logo1Bottom) logo1Bottom.classList.add('visible');
      // Dim down outline underneath as color takes over
      if (logo2Top) logo2Top.classList.add('dimmed');
      if (logo2Bottom) logo2Bottom.classList.add('dimmed');
    }, 2200)
  );

  // Phase 4: Hold logo, then trigger horizontal split opening (at 4200ms)
  timeoutIds.push(
    window.setTimeout(() => {
      if (hasSplitStarted) return;
      triggerSplitAnimation();
    }, 4200)
  );

  // Return controller
  return {
    skip,
    destroy: cleanup,
    get isComplete() {
      return isComplete;
    },
  };
}
