/**
 * Game Title Screen / Màn Hình Chờ
 * Features:
 * 1. Layer 1 (Sky):
 *    - Day: 01_sky_moning.png
 *    - Sunset: 01_sky_sunset.png
 *    - Night: 01_sky_night.png & 01b_stars_night.png (Twinkling starry night)
 * 2. Layer 2 (Clouds & Celestial Bodies):
 *    - Day: Clouds with parallax
 *    - Sunset: Sun Glow & Disc (06_sun_sunset_*) scaled 0.88x and offset +5px
 *    - Night: Moon Glow & Disc (06_moon_*) in the upper night sky
 * 3. Layer 2.5 (Flying Pokemon):
 *    - Day: 1 Pelipper & 4 Wingull soaring through morning sky
 *    - Sunset: 1 Swanna & 4 Swablu soaring across sunset sky
 *    - Night: 1 Lugia (128x123) & 4 Fearow (64x64) soaring across starry night
 * 4. Layer 3 (Sea): 03_sea_* seamless infinite scroll
 * 5. Layer 4 (Sun / Moon Reflection): 04_*_reflection_cropped_* on horizon
 * 6. Layer 4.5 (Sea Pokemon):
 *    - Day: Gyarados red (4 frames, 64x60)
 *    - Sunset: Lapras / Loklass (64x65), Tentacool (64x73), Tentacruel (64x75)
 *    - Night: Kyogre (128x127), Feraligatr (64x69), Starmie (64x68)
 * 7. Layer 4.8 (Running Duo): Pikachu & Trainer running behind grass
 * 8. Layer 5 (Grass):
 *    - Day: 24 frames (grass_front_day/frame_00..23)
 *    - Sunset: 24 frames (grass_front_sunset/frame_00..23)
 *    - Night: 24 frames (grass_front_night/frame_00..23)
 * 9. Layer 5.5: Viento wind swirls
 * 10. Layer 6 & 8: Pixel art drifting leaves (leaf.png, 5 frames 16x16)
 * 11. Layer 7a & 7b: Foreground grass layers (06_grass_front4.png)
 * 12. UI: Minecraft GUI menu buttons & centered Settings Modal with 3-theme cycling toggle
 */

import { titleBgmPlayer } from '../audio/title-bgm';

export type TitleScreenTheme = 'day' | 'sunset' | 'night';

export interface TitleScreenOptions {
  onStart?: () => void;
  initialTheme?: TitleScreenTheme;
}

export interface TitleScreenController {
  destroy: () => void;
  start: () => void;
  setTheme: (theme: TitleScreenTheme) => void;
  getTheme: () => TitleScreenTheme;
  setBgmVolume: (volume: number) => void;
  getBgmVolume: () => number;
}

interface ActiveCloud {
  img: HTMLImageElement;
  x: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
}

interface FlyingBird {
  img: HTMLImageElement;
  x: number;
  baseY: number;
  speed: number;
  scale: number;
  frameIndex: number;
  timer: number;
  frameDuration: number;
  waveFreq: number;
  waveAmp: number;
  frameW: number;
  frameH: number;
  wrapX: number;
}

const CLOUD_ASSET_PATHS = Array.from({ length: 16 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return `/Graphics/Intro/clouds/cloud_${num}.png`;
});

const GRASS_FRONT_DAY_PATHS = Array.from({ length: 24 }, (_, i) => {
  const num = String(i).padStart(2, '0');
  return `/Graphics/Intro/grass_front_day/frame_${num}.png`;
});

const GRASS_FRONT_SUNSET_PATHS = Array.from({ length: 24 }, (_, i) => {
  const num = String(i).padStart(2, '0');
  return `/Graphics/Intro/grass_front_sunset/frame_${num}.png`;
});

const GRASS_FRONT_NIGHT_PATHS = Array.from({ length: 24 }, (_, i) => {
  const num = String(i).padStart(2, '0');
  return `/Graphics/Intro/grass_front_night/frame_${num}.png`;
});

// Day / Morning Assets
const SKY_DAY_PATH = '/Graphics/Intro/Intro_moning/01_sky_moning.png';
const SEA_DAY_PATH = '/Graphics/Intro/Intro_moning/03_sea_moning.png';
const SUN_DAY_PATH = '/Graphics/Intro/Intro_moning/04_sun_reflection_cropped_moning.png';
const BACK_GRASS_DAY_PATH = '/Graphics/Intro/Intro_moning/05_grass.png';
const GYARADOS_PATH = '/Graphics/Intro/Intro_moning/gyarados_red.png';
const PELIPPER_PATH = '/Graphics/Intro/Intro_moning/PELIPPER.png';
const WINGULL_PATH = '/Graphics/Intro/Intro_moning/WINGULL.png';

// Sunset Assets
const SKY_SUNSET_PATH = '/Graphics/Intro/Intro_sunset/01_sky_sunset.png';
const SEA_SUNSET_PATH = '/Graphics/Intro/Intro_sunset/03_sea_sunset.png';
const SUN_REFLECTION_SUNSET_PATH =
  '/Graphics/Intro/Intro_sunset/04_sun_reflection_cropped_sunset.png';
const SUN_DISC_SUNSET_PATH = '/Graphics/Intro/Intro_sunset/06_sun_sunset_disc.png';
const SUN_GLOW_SUNSET_PATH = '/Graphics/Intro/Intro_sunset/06_sun_sunset_glow.png';
const BACK_GRASS_SUNSET_PATH = '/Graphics/Intro/Intro_sunset/05a_grass_back_sunset.png';
const SWANNA_PATH = '/Graphics/Intro/Intro_sunset/SWANNA.png';
const SWABLU_PATH = '/Graphics/Intro/Intro_sunset/SWABLU.png';
const LOKLASS_PATH = '/Graphics/Intro/Intro_sunset/surfloklass.png';
const TENTACOOL_PATH = '/Graphics/Intro/Intro_sunset/surftentacool.png';
const TENTACRUEL_PATH = '/Graphics/Intro/Intro_sunset/surftentacruel.png';

// Night Assets
const SKY_NIGHT_PATH = '/Graphics/Intro/Intro_night/01_sky_night.png';
const STARS_NIGHT_PATH = '/Graphics/Intro/Intro_night/01b_stars_night.png';
const SEA_NIGHT_PATH = '/Graphics/Intro/Intro_night/03_sea_night.png';
const MOON_REFLECTION_NIGHT_PATH =
  '/Graphics/Intro/Intro_night/04_moon_reflection_cropped_night.png';
const MOON_DISC_NIGHT_PATH = '/Graphics/Intro/Intro_night/06_moon_disc.png';
const MOON_GLOW_NIGHT_PATH = '/Graphics/Intro/Intro_night/06_moon_glow.png';
const BACK_GRASS_NIGHT_PATH = '/Graphics/Intro/Intro_night/05a_grass_back_night.png';
const FEAROW_PATH = '/Graphics/Intro/Intro_night/FEAROW.png';
const LUGIA_PATH = '/Graphics/Intro/Intro_night/LUGIA.png';
const KYOGRE_PATH = '/Graphics/Intro/Intro_night/yogre.png';
const FERALIGATR_PATH = '/Graphics/Intro/Intro_night/Surfaligatueur.png';
const STARMIE_PATH = '/Graphics/Intro/Intro_night/surfstaross.png';

// Common Assets
const RUNNING_POKEMON_PATH = '/Graphics/Intro/pokemon.png';
const RUNNING_TRAINER_PATH = '/Graphics/Intro/trainer000.png';
const VIENTO_PATH = '/Graphics/Intro/Viento.png';
const GRASS_FRONT_PATH = '/Graphics/Intro/06_grass_front4.png';
const LEAF_PATH = '/Graphics/Intro/leaf.png';

function loadImage(src: string): HTMLImageElement {
  if (typeof Image !== 'undefined') {
    const img = new Image();
    img.src = src;
    return img;
  }
  return {
    src,
    complete: true,
    naturalWidth: 100,
    naturalHeight: 100,
  } as unknown as HTMLImageElement;
}

export function showTitleScreen(options?: TitleScreenOptions): TitleScreenController {
  // 1. Teardown any existing title screen
  const existing = document.getElementById('titleScreenOverlay');
  if (existing) {
    existing.remove();
  }

  // Determine current active theme
  const savedTheme =
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem('pokemon_title_theme') as TitleScreenTheme)
      : null;
  let currentTheme: TitleScreenTheme =
    options?.initialTheme ||
    (savedTheme === 'sunset' || savedTheme === 'night' ? savedTheme : 'day');

  // 2. Preload assets
  // Day assets
  const skyDayImg = loadImage(SKY_DAY_PATH);
  const seaDayImg = loadImage(SEA_DAY_PATH);
  const sunDayImg = loadImage(SUN_DAY_PATH);
  const backGrassDayImg = loadImage(BACK_GRASS_DAY_PATH);
  const grassDayFrames = GRASS_FRONT_DAY_PATHS.map(loadImage);
  const gyaradosImg = loadImage(GYARADOS_PATH);
  const pelipperImg = loadImage(PELIPPER_PATH);
  const wingullImg = loadImage(WINGULL_PATH);

  // Sunset assets
  const skySunsetImg = loadImage(SKY_SUNSET_PATH);
  const seaSunsetImg = loadImage(SEA_SUNSET_PATH);
  const sunReflectionSunsetImg = loadImage(SUN_REFLECTION_SUNSET_PATH);
  const sunDiscSunsetImg = loadImage(SUN_DISC_SUNSET_PATH);
  const sunGlowSunsetImg = loadImage(SUN_GLOW_SUNSET_PATH);
  const backGrassSunsetImg = loadImage(BACK_GRASS_SUNSET_PATH);
  const swannaImg = loadImage(SWANNA_PATH);
  const swabluImg = loadImage(SWABLU_PATH);
  const loklassImg = loadImage(LOKLASS_PATH);
  const tentacoolImg = loadImage(TENTACOOL_PATH);
  const tentacruelImg = loadImage(TENTACRUEL_PATH);
  const grassSunsetFrames = GRASS_FRONT_SUNSET_PATHS.map(loadImage);

  // Night assets
  const skyNightImg = loadImage(SKY_NIGHT_PATH);
  const starsNightImg = loadImage(STARS_NIGHT_PATH);
  const seaNightImg = loadImage(SEA_NIGHT_PATH);
  const moonReflectionNightImg = loadImage(MOON_REFLECTION_NIGHT_PATH);
  const moonDiscNightImg = loadImage(MOON_DISC_NIGHT_PATH);
  const moonGlowNightImg = loadImage(MOON_GLOW_NIGHT_PATH);
  const backGrassNightImg = loadImage(BACK_GRASS_NIGHT_PATH);
  const fearowImg = loadImage(FEAROW_PATH);
  const lugiaImg = loadImage(LUGIA_PATH);
  const kyogreImg = loadImage(KYOGRE_PATH);
  const feraligatrImg = loadImage(FERALIGATR_PATH);
  const starmieImg = loadImage(STARMIE_PATH);
  const grassNightFrames = GRASS_FRONT_NIGHT_PATHS.map(loadImage);

  // Common assets
  const pokemonRunnerImg = loadImage(RUNNING_POKEMON_PATH);
  const trainerRunnerImg = loadImage(RUNNING_TRAINER_PATH);
  const vientoImg = loadImage(VIENTO_PATH);
  const grassFrontImg = loadImage(GRASS_FRONT_PATH);
  const leafImg = loadImage(LEAF_PATH);
  const cloudImages = CLOUD_ASSET_PATHS.map(loadImage);

  // 3. Build DOM
  const overlay = document.createElement('div');
  overlay.id = 'titleScreenOverlay';
  overlay.className = 'title-screen-overlay';

  overlay.innerHTML = `
    <canvas id="titleScreenCanvas" class="title-screen-canvas" width="1920" height="1200"></canvas>
    
    <!-- Title Screen UI Overlay -->
    <div class="title-screen-ui" id="titleScreenUi">
      <!-- Pixel Menu: Top Left with Minecraft GUI Button styling -->
      <nav class="title-menu-container" id="titleMenuContainer" aria-label="Menu Màn Hình Chờ">
        <button class="title-pixel-btn btn-new-world" id="btnNewWorld" title="Bắt đầu thế giới mới">
          <span class="btn-text">Thế Giới Mới</span>
        </button>
        <button class="title-pixel-btn btn-load-world" id="btnLoadWorld" title="Tải thế giới đã lưu">
          <span class="btn-text">Tải Thế Giới</span>
        </button>
        <button class="title-pixel-btn btn-join-world" id="btnJoinWorld" title="Tham gia thế giới nhiều người chơi">
          <span class="btn-text">Gia Nhập Thế Giới</span>
        </button>
        <button class="title-pixel-btn btn-settings" id="btnSettings" title="Cài đặt hệ thống">
          <span class="btn-text">Cài Đặt</span>
        </button>
      </nav>

      <!-- Settings Modal (Pixel Art Minecraft Window in center) -->
      <div class="title-pixel-modal-backdrop" id="titleSettingsModal" style="display: none;">
        <div class="title-pixel-modal" role="dialog" aria-modal="true" aria-labelledby="settingsModalTitle">
          <div class="title-pixel-modal-header">
            <div class="title-pixel-modal-title" id="settingsModalTitle">⚙️ CÀI ĐẶT HỆ THỐNG</div>
            <button class="title-pixel-modal-close-btn" id="btnSettingsModalCloseX" title="Đóng">✕</button>
          </div>
          <div class="title-pixel-modal-body">
            <div class="title-pixel-setting-row">
              <label class="title-pixel-setting-label">Chủ Đề Màn Hình Chờ (Theme):</label>
              <button class="title-pixel-btn btn-setting-theme" id="btnToggleSunsetTheme" title="Chuyển đổi giao diện Ban Ngày / Hoàng Hôn / Ban Đêm">
                <span class="btn-text" id="txtSunsetTheme">☀️ Chủ Đề: Ban Ngày</span>
              </button>
            </div>
            <div class="title-pixel-setting-row">
              <label class="title-pixel-setting-label">Âm Lượng Nhạc Nền Sảnh Chờ (BGM):</label>
              <div class="title-pixel-slider-row">
                <button class="title-pixel-mute-btn" id="btnTitleBgmMute" title="Bật / Tắt âm thanh">🔊</button>
                <input type="range" class="title-pixel-slider" id="sliderTitleBgm" min="0" max="100" value="60" title="Kéo để chỉnh âm lượng nhạc nền">
                <span class="title-pixel-vol-badge" id="txtTitleBgmVol">60%</span>
              </div>
            </div>
          </div>
          <div class="title-pixel-modal-footer">
            <button class="title-pixel-btn btn-modal-done" id="btnSettingsModalDone" title="Hoàn tất cài đặt">
              <span class="btn-text">XONG</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Test Dev Button -->
      <div class="title-dev-bar">
        <button class="btn-title-dev" id="btnTitleDevQuick" title="Bỏ qua màn hình chờ, khởi tạo và vào thẳng Overworld">
          ⚡ Vào Nhanh Overworld (Dev Test)
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const canvas = overlay.querySelector('#titleScreenCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const btnDev = overlay.querySelector('#btnTitleDevQuick') as HTMLButtonElement;
  const btnNewWorld = overlay.querySelector('#btnNewWorld') as HTMLButtonElement | null;
  const btnLoadWorld = overlay.querySelector('#btnLoadWorld') as HTMLButtonElement | null;
  const btnJoinWorld = overlay.querySelector('#btnJoinWorld') as HTMLButtonElement | null;
  const btnSettings = overlay.querySelector('#btnSettings') as HTMLButtonElement | null;

  // Settings modal elements
  const settingsModal = overlay.querySelector('#titleSettingsModal') as HTMLDivElement | null;
  const btnSettingsModalCloseX = overlay.querySelector(
    '#btnSettingsModalCloseX'
  ) as HTMLButtonElement | null;
  const btnSettingsModalDone = overlay.querySelector(
    '#btnSettingsModalDone'
  ) as HTMLButtonElement | null;
  const btnToggleSunsetTheme = overlay.querySelector(
    '#btnToggleSunsetTheme'
  ) as HTMLButtonElement | null;
  const txtSunsetTheme = overlay.querySelector('#txtSunsetTheme') as HTMLSpanElement | null;
  const sliderTitleBgm = overlay.querySelector('#sliderTitleBgm') as HTMLInputElement | null;
  const txtTitleBgmVol = overlay.querySelector('#txtTitleBgmVol') as HTMLSpanElement | null;
  const btnTitleBgmMute = overlay.querySelector('#btnTitleBgmMute') as HTMLButtonElement | null;

  // 4. State & Animation Parameters
  let isRunning = true;
  let hasTriggeredStart = false;
  let animFrameId = 0;
  let lastTime = performance.now();

  // Sea scroll: Right to Left. Reference speed ~28px/s
  let seaOffset = 0;
  const SEA_SPEED = 28; // px/sec

  // Back grass / animated grass blades scroll: Left to Right (~125px/s)
  let backGrassOffset = 0;
  const BACK_GRASS_SPEED = 125; // px/sec

  // Animated blades cycle (~11 FPS)
  let grassDayTimer = 0;
  let grassDayFrameIndex = 0;
  const GRASS_DAY_FRAME_DURATION = 0.09; // sec per frame

  // Foreground grass scroll layer 1 (06_grass_front4.png, back layer pushed down 220px -> Y=460, scale 0.85): Left to Right
  let grassFrontOffset1 = 0;
  const FRONT_GRASS_SPEED_1 = 165; // px/sec

  // Foreground grass scroll layer 2 (06_grass_front4.png, near camera pushed down 180px -> Y=340): Left to Right
  let grassFrontOffset2 = 640; // staggered offset
  const FRONT_GRASS_SPEED_2 = 215; // px/sec

  // Sea Creatures Animation Timers
  let gyaradosTimer = 0;
  let gyaradosFrameIndex = 0;
  const GYARADOS_FRAME_DURATION = 0.16; // sec per frame

  let sunsetSeaTimer = 0;
  let sunsetSeaFrameIndex = 0;
  const SUNSET_SEA_FRAME_DURATION = 0.16; // sec per frame

  let nightSeaTimer = 0;
  let nightSeaFrameIndex = 0;
  const NIGHT_SEA_FRAME_DURATION = 0.16; // sec per frame

  // Running Duo behind back grass (Pikachu ahead, Trainer chasing behind)
  let pikaTimer = 0;
  let pikaFrameIndex = 0;
  const PIKA_FRAME_DURATION = 0.1; // sec per frame (10 FPS)

  let trainerTimer = 0;
  let trainerFrameIndex = 0;
  const TRAINER_FRAME_DURATION = 0.09; // sec per frame (11 FPS)

  // Flying Birds: Day Mode (1 Pelipper & 4 Wingull)
  const birdsDay: FlyingBird[] = [
    {
      img: pelipperImg,
      x: 580,
      baseY: 550,
      speed: 48,
      scale: 1.0,
      frameIndex: 0,
      timer: 0,
      frameDuration: 0.18,
      waveFreq: 1.8,
      waveAmp: 6,
      frameW: 64,
      frameH: 68,
      wrapX: 2000,
    },
    {
      img: wingullImg,
      x: 820,
      baseY: 500,
      speed: 56,
      scale: 0.95,
      frameIndex: 1,
      timer: 0.05,
      frameDuration: 0.14,
      waveFreq: 2.4,
      waveAmp: 7,
      frameW: 64,
      frameH: 66,
      wrapX: 2080,
    },
    {
      img: wingullImg,
      x: 980,
      baseY: 450,
      speed: 50,
      scale: 0.8,
      frameIndex: 3,
      timer: 0.1,
      frameDuration: 0.15,
      waveFreq: 2.1,
      waveAmp: 5,
      frameW: 64,
      frameH: 66,
      wrapX: 2160,
    },
    {
      img: wingullImg,
      x: 1160,
      baseY: 580,
      speed: 54,
      scale: 0.88,
      frameIndex: 2,
      timer: 0.03,
      frameDuration: 0.14,
      waveFreq: 2.6,
      waveAmp: 8,
      frameW: 64,
      frameH: 66,
      wrapX: 2240,
    },
    {
      img: wingullImg,
      x: 1480,
      baseY: 410,
      speed: 42,
      scale: 0.68,
      frameIndex: 0,
      timer: 0.08,
      frameDuration: 0.16,
      waveFreq: 1.9,
      waveAmp: 4,
      frameW: 64,
      frameH: 66,
      wrapX: 2320,
    },
  ];

  // Flying Birds: Sunset Mode (1 Swanna & 4 Swablu)
  const birdsSunset: FlyingBird[] = [
    {
      img: swannaImg,
      x: 580,
      baseY: 540,
      speed: 46,
      scale: 1.0,
      frameIndex: 0,
      timer: 0,
      frameDuration: 0.17,
      waveFreq: 1.8,
      waveAmp: 6,
      frameW: 64,
      frameH: 63,
      wrapX: 2000,
    },
    {
      img: swabluImg,
      x: 830,
      baseY: 490,
      speed: 54,
      scale: 0.95,
      frameIndex: 1,
      timer: 0.05,
      frameDuration: 0.14,
      waveFreq: 2.3,
      waveAmp: 7,
      frameW: 64,
      frameH: 67,
      wrapX: 2080,
    },
    {
      img: swabluImg,
      x: 1010,
      baseY: 440,
      speed: 48,
      scale: 0.82,
      frameIndex: 3,
      timer: 0.1,
      frameDuration: 0.15,
      waveFreq: 2.1,
      waveAmp: 5,
      frameW: 64,
      frameH: 67,
      wrapX: 2160,
    },
    {
      img: swabluImg,
      x: 1190,
      baseY: 570,
      speed: 52,
      scale: 0.88,
      frameIndex: 2,
      timer: 0.03,
      frameDuration: 0.14,
      waveFreq: 2.5,
      waveAmp: 8,
      frameW: 64,
      frameH: 67,
      wrapX: 2240,
    },
    {
      img: swabluImg,
      x: 1470,
      baseY: 410,
      speed: 42,
      scale: 0.7,
      frameIndex: 0,
      timer: 0.08,
      frameDuration: 0.16,
      waveFreq: 1.9,
      waveAmp: 4,
      frameW: 64,
      frameH: 67,
      wrapX: 2320,
    },
  ];

  // Flying Birds: Night Mode (1 Lugia 128x123 & 4 Fearow 64x64)
  const birdsNight: FlyingBird[] = [
    {
      img: lugiaImg,
      x: 520,
      baseY: 470,
      speed: 46,
      scale: 1.0,
      frameIndex: 0,
      timer: 0,
      frameDuration: 0.18,
      waveFreq: 1.6,
      waveAmp: 10,
      frameW: 128,
      frameH: 123,
      wrapX: 2000,
    },
    {
      img: fearowImg,
      x: 840,
      baseY: 510,
      speed: 54,
      scale: 0.95,
      frameIndex: 1,
      timer: 0.05,
      frameDuration: 0.14,
      waveFreq: 2.2,
      waveAmp: 7,
      frameW: 64,
      frameH: 64,
      wrapX: 2080,
    },
    {
      img: fearowImg,
      x: 1030,
      baseY: 440,
      speed: 50,
      scale: 0.82,
      frameIndex: 3,
      timer: 0.1,
      frameDuration: 0.15,
      waveFreq: 2.0,
      waveAmp: 5,
      frameW: 64,
      frameH: 64,
      wrapX: 2160,
    },
    {
      img: fearowImg,
      x: 1210,
      baseY: 560,
      speed: 52,
      scale: 0.88,
      frameIndex: 2,
      timer: 0.03,
      frameDuration: 0.14,
      waveFreq: 2.4,
      waveAmp: 8,
      frameW: 64,
      frameH: 64,
      wrapX: 2240,
    },
    {
      img: fearowImg,
      x: 1470,
      baseY: 420,
      speed: 42,
      scale: 0.72,
      frameIndex: 0,
      timer: 0.08,
      frameDuration: 0.16,
      waveFreq: 1.9,
      waveAmp: 4,
      frameW: 64,
      frameH: 64,
      wrapX: 2320,
    },
  ];

  // Wind Gust Matrix: 16 concurrent swirling wind gusts uniformly covering a 4x4 grid across entire screen
  interface WindGust {
    x: number;
    y: number;
    speed: number;
    scale: number;
    alpha: number;
    frameIndex: number;
    timer: number;
    frameDuration: number;
    delayTimer: number;
    active: boolean;
    row: number;
    col: number;
  }

  const GRID_ROWS = 4;
  const GRID_COLS = 4;

  function createGridWindGust(row: number, col: number, isInitial = false): WindGust {
    const rowYStarts = [110, 330, 570, 810];
    const rowYSpans = [170, 180, 180, 190];
    const y = rowYStarts[row] + Math.random() * rowYSpans[row];

    const colXStarts = [60, 520, 980, 1440];
    const colXSpans = [380, 380, 380, 420];
    const x = isInitial
      ? colXStarts[col] + Math.random() * colXSpans[col]
      : col === 3
        ? 1860 + Math.random() * 200
        : colXStarts[col] + 320 + Math.random() * 100;

    const scales = [0.72, 0.85, 0.95, 1.05];
    const alphas = [0.72, 0.8, 0.86, 0.9];
    const speeds = [115, 130, 145, 160];

    const initialFrame = isInitial ? (row * 3 + col * 4) % 13 : 0;

    return {
      x,
      y,
      speed: speeds[row] + (Math.random() * 24 - 12),
      scale: scales[row] + Math.random() * 0.15,
      alpha: alphas[row],
      frameIndex: initialFrame,
      timer: Math.random() * 0.08,
      frameDuration: 0.115 + Math.random() * 0.02,
      delayTimer: 0,
      active: true,
      row,
      col,
    };
  }

  const windGusts: WindGust[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      windGusts.push(createGridWindGust(r, c, true));
    }
  }

  // Cloud management:
  const clouds: ActiveCloud[] = [];
  const TARGET_CLOUD_COUNT = 7;

  function createRandomCloud(initialX?: number): ActiveCloud {
    const img = cloudImages[Math.floor(Math.random() * cloudImages.length)];
    const scale = 0.75 + Math.random() * 0.55;
    const speed = (20 + Math.random() * 20) * scale;
    const y = 480 + Math.random() * 320;
    const opacity = 0.8 + Math.random() * 0.2;
    const x = initialX !== undefined ? initialX : -220 - Math.random() * 100;

    return { img, x, y, speed, scale, opacity };
  }

  for (let i = 0; i < TARGET_CLOUD_COUNT; i++) {
    const seedX = -50 + (i / TARGET_CLOUD_COUNT) * 2000 + (Math.random() * 120 - 60);
    clouds.push(createRandomCloud(seedX));
  }

  // Windblown Drifting Leaves System using leaf.png (80x16, 5 frames 16x16)
  interface DriftingLeaf {
    x: number;
    y: number;
    vx: number;
    vy: number;
    scale: number;
    animTimer: number;
    animFps: number;
    swayFreq: number;
    swayAmp: number;
    swayPhase: number;
    layer: 'mid' | 'fore';
  }

  function createDriftingLeaf(initialX?: number, layer: 'mid' | 'fore' = 'mid'): DriftingLeaf {
    const isFore = layer === 'fore';
    const scale = isFore ? 2.4 + Math.random() * 0.8 : 1.4 + Math.random() * 0.5;
    const vx = isFore ? 220 + Math.random() * 90 : 155 + Math.random() * 65;
    const vy = 35 + Math.random() * 45;

    const x = initialX !== undefined ? initialX : -50 - Math.random() * 120;
    const y = -60 + Math.random() * 1100;

    return {
      x,
      y,
      vx,
      vy,
      scale,
      animTimer: Math.random() * 2,
      animFps: 6 + Math.random() * 2.5,
      swayFreq: 1.5 + Math.random() * 1.8,
      swayAmp: 16 + Math.random() * 28,
      swayPhase: Math.random() * Math.PI * 2,
      layer,
    };
  }

  const driftingLeaves: DriftingLeaf[] = [];
  const TOTAL_LEAVES = 12;
  for (let i = 0; i < TOTAL_LEAVES; i++) {
    const layer: 'mid' | 'fore' = i % 2 === 0 ? 'mid' : 'fore';
    const seedX = -50 + (i / TOTAL_LEAVES) * 2050 + (Math.random() * 80 - 40);
    driftingLeaves.push(createDriftingLeaf(seedX, layer));
  }

  // Helper update button text for modal
  const updateThemeButtonText = () => {
    if (txtSunsetTheme) {
      if (currentTheme === 'sunset') {
        txtSunsetTheme.innerText = '🌅 Chủ Đề: Hoàng Hôn [ SUNSET ]';
      } else if (currentTheme === 'night') {
        txtSunsetTheme.innerText = '🌙 Chủ Đề: Ban Đêm [ NIGHT ]';
      } else {
        txtSunsetTheme.innerText = '☀️ Chủ Đề: Ban Ngày [ DAY ]';
      }
    }
  };
  updateThemeButtonText();

  let lastNonZeroVolume = titleBgmPlayer.getVolume() > 0 ? titleBgmPlayer.getVolume() : 0.6;

  const updateBgmControls = () => {
    const vol = titleBgmPlayer.getVolume();
    const percent = Math.round(vol * 100);
    if (sliderTitleBgm) sliderTitleBgm.value = String(percent);
    if (txtTitleBgmVol) txtTitleBgmVol.innerText = `${percent}%`;
    if (btnTitleBgmMute) btnTitleBgmMute.innerText = vol > 0 ? '🔊' : '🔇';
  };
  updateBgmControls();

  sliderTitleBgm?.addEventListener('input', (e) => {
    e.stopPropagation();
    if (!sliderTitleBgm) return;
    const vol = parseInt(sliderTitleBgm.value, 10) / 100;
    titleBgmPlayer.setVolume(vol);
    if (vol > 0) lastNonZeroVolume = vol;
    updateBgmControls();
    if (!titleBgmPlayer.isPlaying() && vol > 0) {
      titleBgmPlayer.playTitleBgm();
    }
  });

  btnTitleBgmMute?.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentVol = titleBgmPlayer.getVolume();
    if (currentVol > 0) {
      lastNonZeroVolume = currentVol;
      titleBgmPlayer.setVolume(0);
      showNotice('🔇 Đã tắt âm thanh nhạc nền sảnh chờ');
    } else {
      titleBgmPlayer.setVolume(lastNonZeroVolume);
      if (!titleBgmPlayer.isPlaying()) {
        titleBgmPlayer.playTitleBgm();
      }
      showNotice(`🔊 Đã bật âm thanh nhạc nền (${Math.round(lastNonZeroVolume * 100)}%)`);
    }
    updateBgmControls();
  });

  // Start Title Screen BGM (chỉ phát khi không có Intro Overlay đang chạy đè)
  const isIntroOverlayPresent =
    typeof document !== 'undefined' && !!document.getElementById('gameIntroOverlay');
  if (!isIntroOverlayPresent) {
    titleBgmPlayer.playTitleBgm();
  }

  // 5. Main Render Loop
  function loop(currentTime: number) {
    if (!isRunning) return;

    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    // A. Update Sea Scroll (Right to Left: offset decreases)
    seaOffset -= SEA_SPEED * dt;
    if (seaOffset <= -1920) {
      seaOffset += 1920;
    }

    // A2. Update Back Grass / Animated Grass Blades Scroll (Left to Right: offset increases)
    backGrassOffset += BACK_GRASS_SPEED * dt;
    if (backGrassOffset >= 1920) {
      backGrassOffset -= 1920;
    }

    grassDayTimer += dt;
    if (grassDayTimer >= GRASS_DAY_FRAME_DURATION) {
      grassDayTimer -= GRASS_DAY_FRAME_DURATION;
      grassDayFrameIndex = (grassDayFrameIndex + 1) % 24;
    }

    // A2.b. Update Foreground Grass Scrolls (Left to Right: offset increases)
    grassFrontOffset1 += FRONT_GRASS_SPEED_1 * dt;
    if (grassFrontOffset1 >= 1632) {
      grassFrontOffset1 -= 1632;
    }

    grassFrontOffset2 += FRONT_GRASS_SPEED_2 * dt;
    if (grassFrontOffset2 >= 1920) {
      grassFrontOffset2 -= 1920;
    }

    // A3. Update Sea Pokemon Animation
    if (currentTheme === 'night') {
      nightSeaTimer += dt;
      if (nightSeaTimer >= NIGHT_SEA_FRAME_DURATION) {
        nightSeaTimer -= NIGHT_SEA_FRAME_DURATION;
        nightSeaFrameIndex = (nightSeaFrameIndex + 1) % 4;
      }
    } else if (currentTheme === 'sunset') {
      sunsetSeaTimer += dt;
      if (sunsetSeaTimer >= SUNSET_SEA_FRAME_DURATION) {
        sunsetSeaTimer -= SUNSET_SEA_FRAME_DURATION;
        sunsetSeaFrameIndex = (sunsetSeaFrameIndex + 1) % 4;
      }
    } else {
      gyaradosTimer += dt;
      if (gyaradosTimer >= GYARADOS_FRAME_DURATION) {
        gyaradosTimer -= GYARADOS_FRAME_DURATION;
        gyaradosFrameIndex = (gyaradosFrameIndex + 1) % 4;
      }
    }

    // A.3. Update Running Duo animation (running in place)
    pikaTimer += dt;
    if (pikaTimer >= PIKA_FRAME_DURATION) {
      pikaTimer -= PIKA_FRAME_DURATION;
      pikaFrameIndex = (pikaFrameIndex + 1) % 4;
    }

    trainerTimer += dt;
    if (trainerTimer >= TRAINER_FRAME_DURATION) {
      trainerTimer -= TRAINER_FRAME_DURATION;
      trainerFrameIndex = (trainerFrameIndex + 1) % 6;
    }

    // A4. Update Flying Birds
    const activeBirds =
      currentTheme === 'night' ? birdsNight : currentTheme === 'sunset' ? birdsSunset : birdsDay;

    for (const b of activeBirds) {
      b.x -= b.speed * dt;
      b.timer += dt;
      if (b.timer >= b.frameDuration) {
        b.timer -= b.frameDuration;
        b.frameIndex = (b.frameIndex + 1) % 4;
      }
      if (b.x < -140) {
        b.x = b.wrapX + Math.random() * 200;
      }
    }

    // A5. Update Wind Gusts
    for (let i = 0; i < windGusts.length; i++) {
      const w = windGusts[i];
      if (!w.active) {
        w.delayTimer -= dt;
        if (w.delayTimer <= 0) {
          const fresh = createGridWindGust(w.row, w.col, false);
          w.x = fresh.x;
          w.y = fresh.y;
          w.speed = fresh.speed;
          w.scale = fresh.scale;
          w.alpha = fresh.alpha;
          w.frameIndex = 0;
          w.timer = 0;
          w.frameDuration = fresh.frameDuration;
          w.active = true;
        }
      } else {
        w.x -= w.speed * dt;
        w.timer += dt;
        if (w.timer >= w.frameDuration) {
          w.timer -= w.frameDuration;
          w.frameIndex++;
          if (w.frameIndex >= 13 || w.x < -240) {
            w.active = false;
            w.delayTimer = 0.2 + Math.random() * 0.5;
          }
        }
      }
    }

    // C. Update Clouds
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.x += c.speed * dt;
      if (c.x > 1920 + 260) {
        clouds[i] = createRandomCloud();
      }
    }

    // C2. Update Windblown Pixel Leaves
    for (let i = 0; i < driftingLeaves.length; i++) {
      const leaf = driftingLeaves[i];
      leaf.x += leaf.vx * dt;
      leaf.y += leaf.vy * dt;
      leaf.animTimer += dt;

      if (leaf.x > 1980 || leaf.y > 1250) {
        leaf.x = -60 - Math.random() * 140;
        leaf.y = -60 + Math.random() * 950;
      }
    }

    // Helper: Render Pixel Art Leaves by Layer
    const renderLeaves = (targetLayer: 'mid' | 'fore') => {
      if (!leafImg.complete || leafImg.naturalWidth <= 0) return;
      const timeSec = currentTime / 1000;
      const FRAME_WIDTH = 16;
      const FRAME_HEIGHT = 16;
      const TOTAL_FRAMES = 5;

      for (let i = 0; i < driftingLeaves.length; i++) {
        const leaf = driftingLeaves[i];
        if (leaf.layer !== targetLayer) continue;

        const frameIndex = Math.floor(leaf.animTimer * leaf.animFps) % TOTAL_FRAMES;
        const sx = frameIndex * FRAME_WIDTH;
        const swayY = leaf.y + Math.sin(timeSec * leaf.swayFreq + leaf.swayPhase) * leaf.swayAmp;
        const dw = Math.round(FRAME_WIDTH * leaf.scale);
        const dh = Math.round(FRAME_HEIGHT * leaf.scale);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          leafImg,
          sx,
          0,
          FRAME_WIDTH,
          FRAME_HEIGHT,
          Math.round(leaf.x),
          Math.round(swayY),
          dw,
          dh
        );
      }
    };

    // D. Render Scene to 1920x1200 Canvas
    ctx.clearRect(0, 0, 1920, 1200);

    // 1. Layer 1: Sky (Full 1920x1200)
    const curSkyImg =
      currentTheme === 'night' ? skyNightImg : currentTheme === 'sunset' ? skySunsetImg : skyDayImg;

    if (curSkyImg.complete && curSkyImg.naturalWidth > 0) {
      ctx.drawImage(curSkyImg, 0, 0, 1920, 1200);
    } else {
      ctx.fillStyle =
        currentTheme === 'night' ? '#070b19' : currentTheme === 'sunset' ? '#f97316' : '#6ec5ff';
      ctx.fillRect(0, 0, 1920, 1200);
    }

    // 1.2. Layer 1.2: Stars (Night only)
    if (currentTheme === 'night' && starsNightImg.complete && starsNightImg.naturalWidth > 0) {
      const starTwinkle = 0.85 + Math.sin(currentTime / 700) * 0.15;
      ctx.save();
      ctx.globalAlpha = starTwinkle;
      ctx.drawImage(starsNightImg, 0, 0, 1920, 1200);
      ctx.restore();
    }

    // 1.5. Layer 1.5: Sunset Sun or Night Moon
    if (currentTheme === 'sunset') {
      // Mặt trời sunset: scale 0.88x và đẩy xuống 5px quanh tâm (1216, 800)
      const sunCenterX = 1216;
      const sunCenterY = 800;
      const sunScale = 0.88;
      const sunOffsetY = 5;

      ctx.save();
      ctx.translate(sunCenterX, sunCenterY + sunOffsetY);
      ctx.scale(sunScale, sunScale);
      ctx.translate(-sunCenterX, -sunCenterY);

      if (sunGlowSunsetImg.complete && sunGlowSunsetImg.naturalWidth > 0) {
        ctx.drawImage(sunGlowSunsetImg, 0, 0, 1920, 1200);
      }
      if (sunDiscSunsetImg.complete && sunDiscSunsetImg.naturalWidth > 0) {
        ctx.drawImage(sunDiscSunsetImg, 0, 0, 1920, 1200);
      }
      ctx.restore();
    } else if (currentTheme === 'night') {
      // Mặt trăng ban đêm trên bầu trời
      if (moonGlowNightImg.complete && moonGlowNightImg.naturalWidth > 0) {
        ctx.drawImage(moonGlowNightImg, 0, 0, 1920, 1200);
      }
      if (moonDiscNightImg.complete && moonDiscNightImg.naturalWidth > 0) {
        ctx.drawImage(moonDiscNightImg, 0, 0, 1920, 1200);
      }
    }

    // 2. Layer 2: Clouds (Drifting Left -> Right across sky)
    for (const c of clouds) {
      if (c.img.complete && c.img.naturalWidth > 0) {
        const cw = c.img.naturalWidth * c.scale;
        const ch = c.img.naturalHeight * c.scale;
        ctx.save();
        ctx.globalAlpha = currentTheme === 'night' ? c.opacity * 0.45 : c.opacity;
        ctx.drawImage(c.img, c.x, c.y - ch / 2, cw, ch);
        ctx.restore();
      }
    }

    // 2.5. Layer 2.5: Flying Pokémon (Day: Pelipper/Wingull, Sunset: Swanna/Swablu, Night: Lugia/Fearow)
    for (const b of activeBirds) {
      if (b.img.complete && b.img.naturalWidth > 0) {
        const sx = b.frameIndex * b.frameW;
        const curY = b.baseY + Math.sin((currentTime / 1000) * b.waveFreq) * b.waveAmp;
        const dw = Math.round(b.frameW * b.scale);
        const dh = Math.round(b.frameH * b.scale);
        ctx.drawImage(b.img, sx, 0, b.frameW, b.frameH, Math.round(b.x), Math.round(curY), dw, dh);
      }
    }

    // 3. Layer 3: Sea Strip (Y=848, H=92, Infinite Scroll from Right to Left)
    const curSeaImg =
      currentTheme === 'night' ? seaNightImg : currentTheme === 'sunset' ? seaSunsetImg : seaDayImg;

    if (curSeaImg.complete && curSeaImg.naturalWidth > 0) {
      ctx.drawImage(curSeaImg, 0, 848, 1920, 92, seaOffset, 848, 1920, 92);
      ctx.drawImage(curSeaImg, 0, 848, 1920, 92, seaOffset + 1920, 848, 1920, 92);
      if (seaOffset < 0) {
        ctx.drawImage(curSeaImg, 0, 848, 1920, 92, seaOffset + 3840, 848, 1920, 92);
      }
    }

    // 4. Layer 4: Celestial Reflection on Horizon (X=984, Y=848)
    if (currentTheme === 'sunset') {
      if (sunReflectionSunsetImg.complete && sunReflectionSunsetImg.naturalWidth > 0) {
        const refW = Math.round(466 * 0.88);
        const refH = 49;
        const refX = Math.round(1216 - refW / 2);
        ctx.drawImage(sunReflectionSunsetImg, refX, 850, refW, refH);
      }
    } else if (currentTheme === 'night') {
      if (moonReflectionNightImg.complete && moonReflectionNightImg.naturalWidth > 0) {
        ctx.drawImage(moonReflectionNightImg, 984, 848, 466, 49);
      }
    } else {
      if (sunDayImg.complete && sunDayImg.naturalWidth > 0) {
        ctx.drawImage(sunDayImg, 984, 848, 466, 49);
      }
    }

    // 4.5. Layer 4.5: Sea Pokémon swimming on waves
    if (currentTheme === 'night') {
      // 1. Kyogre (yogre.png, 4 frames 128x127) surfacing majestically on the sea
      if (kyogreImg.complete && kyogreImg.naturalWidth > 0) {
        const sx = nightSeaFrameIndex * 128;
        const kBobX = 1190 + Math.sin(currentTime / 850) * 8;
        const kBobY = 828 + Math.sin(currentTime / 500) * 3;
        ctx.drawImage(kyogreImg, sx, 0, 128, 127, Math.round(kBobX), Math.round(kBobY), 128, 127);
      }
      // 2. Feraligatr (Surfaligatueur.png, 4 frames 64x69)
      if (feraligatrImg.complete && feraligatrImg.naturalWidth > 0) {
        const sx = ((nightSeaFrameIndex + 1) % 4) * 64;
        const fBobX = 1460 + Math.sin(currentTime / 680 + 1) * 6;
        const fBobY = 848 + Math.sin(currentTime / 440 + 1) * 2;
        ctx.drawImage(feraligatrImg, sx, 0, 64, 69, Math.round(fBobX), Math.round(fBobY), 64, 69);
      }
      // 3. Starmie (surfstaross.png, 4 frames 64x68)
      if (starmieImg.complete && starmieImg.naturalWidth > 0) {
        const sx = ((nightSeaFrameIndex + 2) % 4) * 64;
        const sBobX = 980 + Math.sin(currentTime / 720 + 2) * 6;
        const sBobY = 849 + Math.sin(currentTime / 460 + 2) * 2;
        ctx.drawImage(starmieImg, sx, 0, 64, 68, Math.round(sBobX), Math.round(sBobY), 64, 68);
      }
    } else if (currentTheme === 'sunset') {
      // 1. Loklass / Lapras (surfloklass.png, 4 frames 64x65)
      if (loklassImg.complete && loklassImg.naturalWidth > 0) {
        const sx = sunsetSeaFrameIndex * 64;
        const lBobX = 1290 + Math.sin(currentTime / 720) * 8;
        const lBobY = 847 + Math.sin(currentTime / 460) * 2.5;
        ctx.drawImage(loklassImg, sx, 0, 64, 65, Math.round(lBobX), Math.round(lBobY), 64, 65);
      }
      // 2. Tentacool (surftentacool.png, 4 frames 64x73)
      if (tentacoolImg.complete && tentacoolImg.naturalWidth > 0) {
        const sx = ((sunsetSeaFrameIndex + 1) % 4) * 64;
        const tBobX = 1460 + Math.sin(currentTime / 640 + 1) * 6;
        const tBobY = 849 + Math.sin(currentTime / 420 + 1) * 2;
        ctx.drawImage(tentacoolImg, sx, 0, 64, 73, Math.round(tBobX), Math.round(tBobY), 64, 73);
      }
      // 3. Tentacruel (surftentacruel.png, 4 frames 64x75)
      if (tentacruelImg.complete && tentacruelImg.naturalWidth > 0) {
        const sx = ((sunsetSeaFrameIndex + 2) % 4) * 64;
        const tcBobX = 1060 + Math.sin(currentTime / 800 + 2) * 8;
        const tcBobY = 846 + Math.sin(currentTime / 500 + 2) * 3;
        ctx.drawImage(tentacruelImg, sx, 0, 64, 75, Math.round(tcBobX), Math.round(tcBobY), 64, 75);
      }
    } else {
      // Day mode: Gyarados Red (4 frames, 64x60)
      if (gyaradosImg.complete && gyaradosImg.naturalWidth > 0) {
        const gFrameX = gyaradosFrameIndex * 64;
        const gBobX = 1360 + Math.sin(currentTime / 750) * 8;
        const gBobY = 848 + Math.sin(currentTime / 450) * 2.5;
        ctx.drawImage(
          gyaradosImg,
          gFrameX,
          0,
          64,
          60,
          Math.round(gBobX),
          Math.round(gBobY),
          64,
          60
        );
      }
    }

    // 4.8. Layer 4.8: Running Duo (Pikachu ahead, Trainer chasing behind)
    if (pokemonRunnerImg.complete && pokemonRunnerImg.naturalWidth > 0) {
      const pFrameX = pikaFrameIndex * 220;
      const pikaW = Math.round(220 * 0.28);
      const pikaH = Math.round(220 * 0.28);
      const pikaBobY = 891 + Math.sin((currentTime / 1000) * 14) * 1.0;
      ctx.drawImage(
        pokemonRunnerImg,
        pFrameX,
        0,
        220,
        220,
        630,
        Math.round(pikaBobY),
        pikaW,
        pikaH
      );
    }

    if (trainerRunnerImg.complete && trainerRunnerImg.naturalWidth > 0) {
      const tFrameX = trainerFrameIndex * 120;
      const tW = Math.round(120 * 0.68);
      const tH = Math.round(120 * 0.68);
      const tBobY = 868 + Math.sin((currentTime / 1000) * 12) * 1.2;
      ctx.drawImage(trainerRunnerImg, tFrameX, 0, 120, 120, 735, Math.round(tBobY), tW, tH);
    }

    // 5. Layer 5: Back Grass & Animated Grass Blades (infinite scroll Left -> Right)
    const curBackGrassImg =
      currentTheme === 'night'
        ? backGrassNightImg
        : currentTheme === 'sunset'
          ? backGrassSunsetImg
          : backGrassDayImg;

    if (curBackGrassImg.complete && curBackGrassImg.naturalWidth > 0) {
      ctx.drawImage(curBackGrassImg, backGrassOffset - 1920, 13, 1920, 1200);
      ctx.drawImage(curBackGrassImg, backGrassOffset, 13, 1920, 1200);
      if (backGrassOffset > 0) {
        ctx.drawImage(curBackGrassImg, backGrassOffset + 1920, 13, 1920, 1200);
      }
    }

    const curGrassBlades =
      currentTheme === 'night'
        ? grassNightFrames[grassDayFrameIndex]
        : currentTheme === 'sunset'
          ? grassSunsetFrames[grassDayFrameIndex]
          : grassDayFrames[grassDayFrameIndex];

    if (curGrassBlades && curGrassBlades.complete && curGrassBlades.naturalWidth > 0) {
      ctx.drawImage(curGrassBlades, backGrassOffset - 1920, 13, 1920, 1200);
      ctx.drawImage(curGrassBlades, backGrassOffset, 13, 1920, 1200);
      if (backGrassOffset > 0) {
        ctx.drawImage(curGrassBlades, backGrassOffset + 1920, 13, 1920, 1200);
      }
    }

    // 5.5. Layer 5.5: Swirling Wind Gusts (Viento.png)
    if (vientoImg.complete && vientoImg.naturalWidth > 0) {
      for (const w of windGusts) {
        if (!w.active || w.frameIndex >= 13) continue;
        const col = w.frameIndex % 4;
        const row = Math.floor(w.frameIndex / 4);
        const sx = col * 192;
        const sy = row * 206;
        const dw = Math.round(192 * w.scale);
        const dh = Math.round(206 * w.scale);

        ctx.save();
        ctx.globalAlpha = currentTheme === 'night' ? w.alpha * 0.75 : w.alpha;
        ctx.drawImage(vientoImg, sx, sy, 192, 206, Math.round(w.x), Math.round(w.y), dw, dh);
        ctx.restore();
      }
    }

    // 6. Layer 6: Midground Drifting Leaves
    renderLeaves('mid');

    // 7a. Layer 7a: Back Foreground Grass Layer (06_grass_front4.png, Y=460, scroll Left -> Right)
    if (grassFrontImg.complete && grassFrontImg.naturalWidth > 0) {
      const sw = grassFrontImg.naturalWidth;
      const sh = grassFrontImg.naturalHeight;
      const dw1 = 1632;
      const dh1 = Math.round(dw1 * (sh / sw));
      const swayY1 = 460 + Math.sin((currentTime / 1000) * 2.2) * 2.0;
      ctx.drawImage(grassFrontImg, 0, 0, sw, sh, grassFrontOffset1 - dw1, swayY1, dw1, dh1);
      ctx.drawImage(grassFrontImg, 0, 0, sw, sh, grassFrontOffset1, swayY1, dw1, dh1);
      ctx.drawImage(grassFrontImg, 0, 0, sw, sh, grassFrontOffset1 + dw1, swayY1, dw1, dh1);
      ctx.drawImage(grassFrontImg, 0, 0, sw, sh, grassFrontOffset1 + dw1 * 2, swayY1, dw1, dh1);
    }

    // 7b. Layer 7b: Nearest Camera Grass Layer (06_grass_front4.png, Y=340, scroll Left -> Right)
    if (grassFrontImg.complete && grassFrontImg.naturalWidth > 0) {
      const sw = grassFrontImg.naturalWidth;
      const sh = grassFrontImg.naturalHeight;
      const dw2 = 1920;
      const dh2 = Math.round(dw2 * (sh / sw));
      const swayY2 = 340 + Math.sin((currentTime / 1000) * 2.8) * 2.5;
      ctx.drawImage(grassFrontImg, 0, 0, sw, sh, grassFrontOffset2 - dw2, swayY2, dw2, dh2);
      ctx.drawImage(grassFrontImg, 0, 0, sw, sh, grassFrontOffset2, swayY2, dw2, dh2);
      ctx.drawImage(grassFrontImg, 0, 0, sw, sh, grassFrontOffset2 + dw2, swayY2, dw2, dh2);
      ctx.drawImage(grassFrontImg, 0, 0, sw, sh, grassFrontOffset2 + dw2 * 2, swayY2, dw2, dh2);
    }

    // 8. Layer 8: Foreground Drifting Leaves
    renderLeaves('fore');

    animFrameId =
      typeof window !== 'undefined' && window.requestAnimationFrame
        ? window.requestAnimationFrame(loop)
        : (setTimeout(() => loop(performance.now()), 16) as unknown as number);
  }

  animFrameId =
    typeof window !== 'undefined' && window.requestAnimationFrame
      ? window.requestAnimationFrame(loop)
      : (setTimeout(() => loop(performance.now()), 16) as unknown as number);

  // 6. User Actions & Modal Handlers
  const triggerStart = () => {
    if (hasTriggeredStart) return;
    hasTriggeredStart = true;

    overlay.classList.add('fade-out');

    window.setTimeout(() => {
      destroy();
      if (options?.onStart) {
        options.onStart();
      }
    }, 450);
  };

  const showNotice = (msg: string) => {
    const prev = overlay.querySelector('#titlePixelNotice');
    if (prev) prev.remove();

    const notice = document.createElement('div');
    notice.id = 'titlePixelNotice';
    notice.className = 'title-pixel-notice';
    notice.innerText = msg;
    overlay.appendChild(notice);

    window.setTimeout(() => {
      notice.classList.add('fade-out');
      window.setTimeout(() => notice.remove(), 350);
    }, 2400);
  };

  const openSettingsModal = () => {
    if (settingsModal) {
      updateThemeButtonText();
      updateBgmControls();
      settingsModal.style.display = 'flex';
    }
  };

  const closeSettingsModal = () => {
    if (settingsModal) {
      settingsModal.style.display = 'none';
    }
  };

  btnNewWorld?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerStart();
  });

  btnLoadWorld?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerStart();
  });

  btnJoinWorld?.addEventListener('click', (e) => {
    e.stopPropagation();
    showNotice('🌐 Chức năng Gia Nhập Thế Giới (Multiplayer LAN) đang phát triển!');
  });

  btnSettings?.addEventListener('click', (e) => {
    e.stopPropagation();
    openSettingsModal();
  });

  btnToggleSunsetTheme?.addEventListener('click', (e) => {
    e.stopPropagation();
    const themes: TitleScreenTheme[] = ['day', 'sunset', 'night'];
    const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
    currentTheme = themes[nextIdx];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('pokemon_title_theme', currentTheme);
      } catch {
        // ignore storage errors
      }
    }
    updateThemeButtonText();
    const notices: Record<TitleScreenTheme, string> = {
      day: '☀️ Đã chuyển sang chủ đề Ban Ngày (Day)!',
      sunset: '🌅 Đã chuyển sang chủ đề Hoàng Hôn (Sunset)!',
      night: '🌙 Đã chuyển sang chủ đề Ban Đêm (Night)!',
    };
    showNotice(notices[currentTheme]);
  });

  btnSettingsModalCloseX?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSettingsModal();
  });

  btnSettingsModalDone?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSettingsModal();
  });

  settingsModal?.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && settingsModal && settingsModal.style.display !== 'none') {
      closeSettingsModal();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown);
  }

  btnDev?.addEventListener('click', (e) => {
    e.stopPropagation();
    titleBgmPlayer.stopBgm(450);
    destroy();
    if (options?.onStart) {
      options.onStart();
    }
  });

  const destroy = () => {
    isRunning = false;
    titleBgmPlayer.stopBgm(450);
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', onKeyDown);
      if (window.cancelAnimationFrame) {
        window.cancelAnimationFrame(animFrameId);
      } else {
        clearTimeout(animFrameId);
      }
    } else {
      clearTimeout(animFrameId);
    }
    if (overlay.parentNode) {
      overlay.remove();
    }
  };

  return {
    destroy,
    start: triggerStart,
    setTheme: (theme: TitleScreenTheme) => {
      currentTheme = theme;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('pokemon_title_theme', theme);
        } catch {
          // ignore storage errors
        }
      }
      updateThemeButtonText();
    },
    getTheme: () => currentTheme,
    setBgmVolume: (volume: number) => {
      titleBgmPlayer.setVolume(volume);
      updateBgmControls();
    },
    getBgmVolume: () => titleBgmPlayer.getVolume(),
  };
}
