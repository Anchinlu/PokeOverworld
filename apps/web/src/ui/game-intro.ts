/**
 * Game Intro Cinematic Controller
 * Features:
 * - Pure dark screen initialization
 * - Clockwise rotating 18 Pokémon type icons ring (from pokemon_types_transparent.png)
 * - Rotating celestial light radiance / sunburst effect behind the type icons
 * - Glowing white outline logo (logo2.png) overlaying on top of the type ring
 * - Full color iconic Pokémon logo (logo1.png) reveal with radiant glow
 * - Middle horizontal split screen transition: Top half slides up, bottom half slides down
 * - Smooth skip mechanism on pointer click or key press
 */

export interface GameIntroController {
  skip: () => void;
  destroy: () => void;
  isComplete: boolean;
}

/**
 * Generate HTML string for the rotating 18 Pokémon Type Icons and Radiance Effect
 */
function createTypeRingAndRadianceHtml(suffix: 'Top' | 'Bottom'): string {
  const ICONS_COUNT = 18;
  const radius = 210; // px
  let iconsHtml = '';

  for (let i = 0; i < ICONS_COUNT; i++) {
    const col = i % 6;
    const row = Math.floor(i / 6);
    // Start from top (12 o'clock) and move clockwise: -pi/2 + (i * 2*pi / 18)
    const angleRad = (i * 2 * Math.PI) / ICONS_COUNT - Math.PI / 2;
    const x = Math.round(Math.cos(angleRad) * radius);
    const y = Math.round(Math.sin(angleRad) * radius);
    const bgX = -(col * 44);
    const bgY = -(row * 44);

    iconsHtml += `
      <div class="intro-type-icon" style="--tx: ${x}px; --ty: ${y}px; background-position: ${bgX}px ${bgY}px;" data-type-index="${i}"></div>
    `;
  }

  return `
    <!-- Rotating Celestial Radiance Effect -->
    <div class="intro-radiance-wrapper" id="introRadiance${suffix}">
      <div class="intro-radiance-rays"></div>
      <div class="intro-radiance-aura"></div>
      <div class="intro-radiance-track"></div>
    </div>

    <!-- Clockwise Rotating 18 Type Icons Ring -->
    <div class="intro-type-ring-wrapper" id="introTypeRing${suffix}">
      <div class="intro-type-ring">
        ${iconsHtml}
      </div>
    </div>
  `;
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
          ${createTypeRingAndRadianceHtml('Top')}
          <img class="intro-logo intro-logo-outline" id="introLogo2Top" src="/Graphics/Intro/logo2.png" alt="Logo Outline" />
          <img class="intro-logo intro-logo-color" id="introLogo1Top" src="/Graphics/Intro/logo1.png" alt="Pokemon Logo" />
        </div>
      </div>
    </div>

    <!-- Bottom Shutter (Slides DOWN on split) -->
    <div class="intro-shutter intro-shutter-bottom" id="introShutterBottom">
      <div class="intro-content-wrapper intro-content-bottom">
        <div class="intro-logo-box">
          ${createTypeRingAndRadianceHtml('Bottom')}
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
  const radianceTop = overlay.querySelector('#introRadianceTop') as HTMLElement;
  const radianceBottom = overlay.querySelector('#introRadianceBottom') as HTMLElement;
  const typeRingTop = overlay.querySelector('#introTypeRingTop') as HTMLElement;
  const typeRingBottom = overlay.querySelector('#introTypeRingBottom') as HTMLElement;
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
      // Ensure radiance, type ring, and logos are visible if skipped early, then trigger split
      if (radianceTop) radianceTop.classList.add('visible');
      if (radianceBottom) radianceBottom.classList.add('visible');
      if (typeRingTop) typeRingTop.classList.add('visible');
      if (typeRingBottom) typeRingBottom.classList.add('visible');
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
  // Phase 1: Pure dark screen (0 to 150ms)

  // Phase 1.5: Rotating Celestial Radiance & 18 Type Icons Ring fade in (at 150ms)
  timeoutIds.push(
    window.setTimeout(() => {
      if (hasSplitStarted) return;
      if (radianceTop) radianceTop.classList.add('visible');
      if (radianceBottom) radianceBottom.classList.add('visible');
      if (typeRingTop) typeRingTop.classList.add('visible');
      if (typeRingBottom) typeRingBottom.classList.add('visible');
    }, 150)
  );

  // Phase 2: logo2.png (white outline) fades in ON TOP of the type ring (at 600ms)
  timeoutIds.push(
    window.setTimeout(() => {
      if (hasSplitStarted) return;
      if (logo2Top) logo2Top.classList.add('visible');
      if (logo2Bottom) logo2Bottom.classList.add('visible');
    }, 600)
  );

  // Phase 3: logo1.png (vibrant full-color Pokémon logo) reveals and flashes (at 2200ms)
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
