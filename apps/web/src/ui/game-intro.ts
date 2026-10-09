/**
 * Game Intro Cinematic Controller
 * Features:
 * - Pure dark screen initialization
 * - Opening Movie BGM audio: 'Audio/Misic backgound/01. Opening Movie.mp3'
 * - Clockwise rotating 18 Pokémon type icons ring (from pokemon_types_transparent.png)
 * - Rotating celestial light radiance / sunburst effect behind the type icons
 * - Glowing white outline logo (logo2.png) overlaying on top of the type ring
 * - Full color iconic Pokémon logo (logo1.png) reveal with radiant glow
 * - Glowing prompt: "✨ BẤM ĐỂ BƯỚC VÀO THẾ GIỚI ✨"
 * - Automatic transition into title screen at the 8th second (8000ms)
 * - Or click / key press to skip & enter early anytime
 * - Smooth fade-out transition with automatic Title BGM handover
 */

import { introBgmPlayer } from '../audio/intro-bgm';
import { titleBgmPlayer } from '../audio/title-bgm';

export interface GameIntroController {
  skip: () => void;
  destroy: () => void;
  isComplete: boolean;
}

/**
 * Generate HTML string for the rotating 18 Pokémon Type Icons and Radiance Effect
 */
function createTypeRingAndRadianceHtml(): string {
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
    <div class="intro-radiance-wrapper" id="introRadiance">
      <div class="intro-radiance-rays"></div>
      <div class="intro-radiance-aura"></div>
    </div>

    <!-- Clockwise Rotating 18 Type Icons Ring -->
    <div class="intro-type-ring-wrapper" id="introTypeRing">
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

  // 2. Manage Audio: Stop Title BGM if playing, start Intro Opening Movie BGM
  try {
    titleBgmPlayer.stopBgm(0);
    introBgmPlayer.playIntroBgm();
  } catch (_) {}

  // 3. Build DOM Structure
  const overlay = document.createElement('div');
  overlay.id = 'gameIntroOverlay';
  overlay.className = 'game-intro-overlay';

  overlay.innerHTML = `
    <!-- Center Cinematic Stage -->
    <div class="intro-stage" id="introStage">
      <div class="intro-logo-box">
        ${createTypeRingAndRadianceHtml()}
        <img class="intro-logo intro-logo-outline" id="introLogo2" src="/Graphics/Intro/logo2.png" alt="Logo Outline" />
        <img class="intro-logo intro-logo-color" id="introLogo1" src="/Graphics/Intro/logo1.png" alt="Pokemon Logo" />
      </div>

      <!-- Glowing Start Prompt -->
      <div class="intro-start-prompt" id="introStartPrompt">
        <div class="intro-prompt-main">✨ BẤM ĐỂ BƯỚC VÀO THẾ GIỚI ✨</div>
        <div class="intro-prompt-sub">— NHẤP CHUỘT HOẶC PHÍM BẤT KỲ ĐỂ TIẾP TỤC —</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 4. Controller state & timers
  let isComplete = false;
  let hasExitStarted = false;
  const timeoutIds: number[] = [];

  const radiance = overlay.querySelector('#introRadiance') as HTMLElement | null;
  const typeRing = overlay.querySelector('#introTypeRing') as HTMLElement | null;
  const logo2 = overlay.querySelector('#introLogo2') as HTMLElement | null;
  const logo1 = overlay.querySelector('#introLogo1') as HTMLElement | null;
  const startPrompt = overlay.querySelector('#introStartPrompt') as HTMLElement | null;

  const cleanup = () => {
    timeoutIds.forEach((id) => window.clearTimeout(id));
    window.removeEventListener('keydown', handleKey);
    overlay.removeEventListener('pointerdown', handleClick);
    if (overlay.parentNode) {
      overlay.remove();
    }
    // Stop intro music and seamlessly start title screen BGM
    try {
      introBgmPlayer.stopBgm(450);
      titleBgmPlayer.playTitleBgm();
    } catch (_) {}

    if (!isComplete) {
      isComplete = true;
      if (onComplete) onComplete();
    }
  };

  const triggerExitTransition = () => {
    if (hasExitStarted) return;
    hasExitStarted = true;

    // Smooth cinematic fade-out transition into Title Screen
    overlay.classList.add('intro-fade-out');

    const endTimer = window.setTimeout(() => {
      cleanup();
    }, 600); // 600ms smooth fade transition
    timeoutIds.push(endTimer);
  };

  const skipOrAdvance = () => {
    if (isComplete) return;
    if (!hasExitStarted) {
      // Ensure logos and elements are visible before exit
      if (radiance) radiance.classList.add('visible');
      if (typeRing) typeRing.classList.add('visible');
      if (logo1) logo1.classList.add('visible');
      triggerExitTransition();
    } else {
      cleanup();
    }
  };

  const handleKey = (e: KeyboardEvent) => {
    // Any interactive key advances / enters early
    if (['Space', 'Enter', 'Escape', 'KeyZ', 'KeyX'].includes(e.code) || e.key) {
      skipOrAdvance();
    }
  };

  const handleClick = (e: MouseEvent) => {
    if (e.button === 0) {
      skipOrAdvance();
    }
  };

  window.addEventListener('keydown', handleKey);
  overlay.addEventListener('pointerdown', handleClick);

  // 5. Animation Timeline
  // Phase 1: Pure dark screen (0 to 150ms)

  // Phase 1.5: Rotating Celestial Radiance & 18 Type Icons Ring fade in (at 150ms)
  timeoutIds.push(
    window.setTimeout(() => {
      if (hasExitStarted) return;
      if (radiance) radiance.classList.add('visible');
      if (typeRing) typeRing.classList.add('visible');
    }, 150)
  );

  // Phase 2: logo2.png (white outline) fades in ON TOP of the type ring (at 600ms)
  timeoutIds.push(
    window.setTimeout(() => {
      if (hasExitStarted) return;
      if (logo2) logo2.classList.add('visible');
    }, 600)
  );

  // Phase 3: logo1.png (vibrant full-color Pokémon logo) reveals and flashes (at 2200ms)
  timeoutIds.push(
    window.setTimeout(() => {
      if (hasExitStarted) return;
      if (logo1) logo1.classList.add('visible');
      if (logo2) logo2.classList.add('dimmed');
    }, 2200)
  );

  // Phase 4: Glowing Start Prompt appears inviting user (at 3200ms)
  timeoutIds.push(
    window.setTimeout(() => {
      if (hasExitStarted) return;
      if (startPrompt) startPrompt.classList.add('visible');
    }, 3200)
  );

  // Phase 5: Automatically enter Title Screen at the 8th second (8000ms)
  timeoutIds.push(
    window.setTimeout(() => {
      if (hasExitStarted) return;
      triggerExitTransition();
    }, 8000)
  );

  // Return controller
  return {
    skip: skipOrAdvance,
    destroy: cleanup,
    get isComplete() {
      return isComplete;
    },
  };
}
