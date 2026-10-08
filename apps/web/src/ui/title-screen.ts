/**
 * Game Title Screen / Màn Hình Chờ
 * Features:
 * 1. Layer 1 (Sky): 01_sky_moning.png (Static background, 1920x1200)
 * 2. Layer 2 (Clouds): Random cloud spawner (cloud_01 to cloud_16), drifting LEFT -> RIGHT with parallax
 * 3. Layer 3 (Sea): 03_sea_moning.png infinite seamless scroll, moving RIGHT -> LEFT
 * 4. Layer 4 (Sun Reflection): 04_sun_reflection_cropped_moning.png stationary on the horizon (X=984, Y=848)
 * 5. Layer 5 (Grass): 24 frames animation (frame_00 to frame_23) looping at ~11 FPS at bottom (Y=944..1200)
 * 6. Layer 6 (UI): Press Any Key / Click to Start prompt & Quick Dev Test button
 */

export interface TitleScreenController {
  destroy: () => void;
  start: () => void;
}

interface ActiveCloud {
  img: HTMLImageElement;
  x: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
}

const CLOUD_ASSET_PATHS = Array.from({ length: 16 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return `/Graphics/Intro/clouds/cloud_${num}.png`;
});

const GRASS_FRONT_DAY_PATHS = Array.from({ length: 24 }, (_, i) => {
  const num = String(i).padStart(2, '0');
  return `/Graphics/Intro/grass_front_day/frame_${num}.png`;
});

const SKY_PATH = '/Graphics/Intro/Intro_moning/01_sky_moning.png';
const SEA_PATH = '/Graphics/Intro/Intro_moning/03_sea_moning.png';
const SUN_PATH = '/Graphics/Intro/Intro_moning/04_sun_reflection_cropped_moning.png';
const BACK_GRASS_PATH = '/Graphics/Intro/Intro_moning/05_grass.png';
const GYARADOS_PATH = '/Graphics/Intro/Intro_moning/gyarados_red.png';
const PELIPPER_PATH = '/Graphics/Intro/Intro_moning/PELIPPER.png';
const WINGULL_PATH = '/Graphics/Intro/Intro_moning/WINGULL.png';
const RUNNING_POKEMON_PATH = '/Graphics/Intro/pokemon.png';
const RUNNING_TRAINER_PATH = '/Graphics/Intro/trainer000.png';
const VIENTO_PATH = '/Graphics/Intro/Viento.png';
const GRASS_FRONT_PATH = '/Graphics/Intro/06_grass_front4.png';

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

export function showTitleScreen(options?: { onStart?: () => void }): TitleScreenController {
  // 1. Teardown any existing title screen
  const existing = document.getElementById('titleScreenOverlay');
  if (existing) {
    existing.remove();
  }

  // 2. Preload assets
  const skyImg = loadImage(SKY_PATH);
  const seaImg = loadImage(SEA_PATH);
  const sunImg = loadImage(SUN_PATH);
  const backGrassImg = loadImage(BACK_GRASS_PATH);
  const grassDayFrames = GRASS_FRONT_DAY_PATHS.map(loadImage);
  const gyaradosImg = loadImage(GYARADOS_PATH);
  const pelipperImg = loadImage(PELIPPER_PATH);
  const wingullImg = loadImage(WINGULL_PATH);
  const pokemonRunnerImg = loadImage(RUNNING_POKEMON_PATH);
  const trainerRunnerImg = loadImage(RUNNING_TRAINER_PATH);
  const vientoImg = loadImage(VIENTO_PATH);
  const grassFrontImg = loadImage(GRASS_FRONT_PATH);
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

  // 4. State & Animation Parameters
  let isRunning = true;
  let hasTriggeredStart = false;
  let animFrameId = 0;
  let lastTime = performance.now();

  // Sea scroll: Right to Left. Reference speed ~28px/s
  let seaOffset = 0;
  const SEA_SPEED = 28; // px/sec

  // Back grass / grass_front_day scroll: Left to Right (~125px/s)
  let backGrassOffset = 0;
  const BACK_GRASS_SPEED = 125; // px/sec

  // grass_front_day animated blades cycle (~11 FPS)
  let grassDayTimer = 0;
  let grassDayFrameIndex = 0;
  const GRASS_DAY_FRAME_DURATION = 0.09; // sec per frame

  // Foreground grass scroll layer 1 (06_grass_front4.png, back layer pushed down 220px -> Y=460, scale 0.85): Left to Right
  let grassFrontOffset1 = 0;
  const FRONT_GRASS_SPEED_1 = 165; // px/sec

  // Foreground grass scroll layer 2 (06_grass_front4.png, near camera pushed down 180px -> Y=340): Left to Right
  let grassFrontOffset2 = 640; // staggered offset
  const FRONT_GRASS_SPEED_2 = 215; // px/sec

  // Gyarados red animation: 4 frames (64x60) cycling at ~6 FPS
  let gyaradosTimer = 0;
  let gyaradosFrameIndex = 0;
  const GYARADOS_FRAME_DURATION = 0.16; // sec per frame

  // Running Duo behind back grass (Pikachu ahead, Trainer chasing behind)
  let pikaTimer = 0;
  let pikaFrameIndex = 0;
  const PIKA_FRAME_DURATION = 0.1; // sec per frame (10 FPS)

  let trainerTimer = 0;
  let trainerFrameIndex = 0;
  const TRAINER_FRAME_DURATION = 0.09; // sec per frame (11 FPS)

  // Flying Birds: 1 Pelipper & 4 Wingull soaring across the morning sky
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

  const birds: FlyingBird[] = [
    // 1 Pelipper (stately pelican gliding steadily in the mid-upper sky)
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
    // 4 Wingull (arranged in a realistic soaring flock across the sky)
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

  const GRID_ROWS = 4; // 4 vertical height bands
  const GRID_COLS = 4; // 4 horizontal width columns

  function createGridWindGust(row: number, col: number, isInitial = false): WindGust {
    // Row 0: Top Sky (100..280 px)
    // Row 1: Mid Sky & Clouds (340..540 px)
    // Row 2: Horizon & Ocean (580..780 px)
    // Row 3: Grass Ridge & Characters (820..1020 px)
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
      frameDuration: 0.115 + Math.random() * 0.02, // ~8-9 FPS: Slow, graceful breeze
      delayTimer: 0,
      active: true,
      row,
      col,
    };
  }

  // Pre-seed all 16 cells of 4x4 grid across entire 1920x1200 canvas
  const windGusts: WindGust[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      windGusts.push(createGridWindGust(r, c, true));
    }
  }

  // Cloud management:
  // Clouds move LEFT -> RIGHT. Y bounds: 480 to 820 px (sky above horizon)
  const clouds: ActiveCloud[] = [];
  const TARGET_CLOUD_COUNT = 7;

  function createRandomCloud(initialX?: number): ActiveCloud {
    const img = cloudImages[Math.floor(Math.random() * cloudImages.length)];
    // Parallax speed: small clouds slower (16-24 px/s), big clouds faster (28-42 px/s)
    const scale = 0.75 + Math.random() * 0.55;
    const speed = (20 + Math.random() * 20) * scale;
    const y = 480 + Math.random() * 320;
    const opacity = 0.8 + Math.random() * 0.2;
    const x = initialX !== undefined ? initialX : -220 - Math.random() * 100;

    return { img, x, y, speed, scale, opacity };
  }

  // Pre-seed clouds across screen so sky is already lively
  for (let i = 0; i < TARGET_CLOUD_COUNT; i++) {
    const seedX = -50 + (i / TARGET_CLOUD_COUNT) * 2000 + (Math.random() * 120 - 60);
    clouds.push(createRandomCloud(seedX));
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

    // A2. Update Back Grass / grass_front_day Scroll (Left to Right: offset increases)
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

    // A3. Update Gyarados Red Animation Frame (4 frames)
    gyaradosTimer += dt;
    if (gyaradosTimer >= GYARADOS_FRAME_DURATION) {
      gyaradosTimer -= GYARADOS_FRAME_DURATION;
      gyaradosFrameIndex = (gyaradosFrameIndex + 1) % 4;
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

    // A4. Update Flying Birds (Pelipper & Wingull)
    for (const b of birds) {
      b.x -= b.speed * dt;
      b.timer += dt;
      if (b.timer >= b.frameDuration) {
        b.timer -= b.frameDuration;
        b.frameIndex = (b.frameIndex + 1) % 4;
      }
      if (b.x < -120) {
        b.x = b.wrapX + Math.random() * 200;
      }
    }

    // A5. Update Wind Gusts (16 matrix gusts drifting smoothly and slowly Right -> Left)
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
            // Short restful pause before next gust in this grid zone
            w.delayTimer = 0.2 + Math.random() * 0.5;
          }
        }
      }
    }

    // C. Update Clouds (Left to Right: x increases)
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.x += c.speed * dt;
      // If passed right edge (1920 + buffer), recycle to left
      if (c.x > 1920 + 260) {
        clouds[i] = createRandomCloud();
      }
    }

    // D. Render Scene to 1920x1200 Canvas
    ctx.clearRect(0, 0, 1920, 1200);

    // 1. Layer 1: Sky (Full 1920x1200)
    if (skyImg.complete && skyImg.naturalWidth > 0) {
      ctx.drawImage(skyImg, 0, 0, 1920, 1200);
    } else {
      ctx.fillStyle = '#6ec5ff';
      ctx.fillRect(0, 0, 1920, 1200);
    }

    // 2. Layer 2: Clouds (Drifting Left -> Right across sky)
    for (const c of clouds) {
      if (c.img.complete && c.img.naturalWidth > 0) {
        const cw = c.img.naturalWidth * c.scale;
        const ch = c.img.naturalHeight * c.scale;
        ctx.save();
        ctx.globalAlpha = c.opacity;
        ctx.drawImage(c.img, c.x, c.y - ch / 2, cw, ch);
        ctx.restore();
      }
    }

    // 2.5. Layer 2.5: Flying Pokémon (1 Pelipper & 4 Wingull soaring through the sky)
    for (const b of birds) {
      if (b.img.complete && b.img.naturalWidth > 0) {
        const sx = b.frameIndex * b.frameW;
        const curY = b.baseY + Math.sin((currentTime / 1000) * b.waveFreq) * b.waveAmp;
        const dw = Math.round(b.frameW * b.scale);
        const dh = Math.round(b.frameH * b.scale);
        ctx.drawImage(b.img, sx, 0, b.frameW, b.frameH, Math.round(b.x), Math.round(curY), dw, dh);
      }
    }

    // 3. Layer 3: Sea Strip (Y=848, H=90, Infinite Scroll from Right to Left)
    if (seaImg.complete && seaImg.naturalWidth > 0) {
      // Draw 2 copies side-by-side to guarantee seamless horizontal wrap
      ctx.drawImage(seaImg, 0, 848, 1920, 92, seaOffset, 848, 1920, 92);
      ctx.drawImage(seaImg, 0, 848, 1920, 92, seaOffset + 1920, 848, 1920, 92);
      if (seaOffset < 0) {
        ctx.drawImage(seaImg, 0, 848, 1920, 92, seaOffset + 3840, 848, 1920, 92);
      }
    }

    // 4. Layer 4: Sun Reflection (Stationary on Horizon at X=984, Y=848, W=466, H=49)
    if (sunImg.complete && sunImg.naturalWidth > 0) {
      ctx.drawImage(sunImg, 984, 848, 466, 49);
    }

    // 4.5. Layer 4.5: Gyarados Red swimming in the sea (4 frames, 64x60, right side at X~1360)
    if (gyaradosImg.complete && gyaradosImg.naturalWidth > 0) {
      const gFrameX = gyaradosFrameIndex * 64;
      const gBobX = 1360 + Math.sin(currentTime / 750) * 8;
      const gBobY = 848 + Math.sin(currentTime / 450) * 2.5;
      ctx.drawImage(gyaradosImg, gFrameX, 0, 64, 60, Math.round(gBobX), Math.round(gBobY), 64, 60);
    }

    // 4.8. Layer 4.8: Running Duo (Pikachu ahead, Trainer chasing behind, running in place behind back grass)
    // Draw Pikachu (220x220, 4 frames, scaled slightly smaller to ~0.28)
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

    // Draw Trainer (120x120, 6 frames, scaled smaller and shifted down 3px)
    if (trainerRunnerImg.complete && trainerRunnerImg.naturalWidth > 0) {
      const tFrameX = trainerFrameIndex * 120;
      const tW = Math.round(120 * 0.68);
      const tH = Math.round(120 * 0.68);
      const tBobY = 868 + Math.sin((currentTime / 1000) * 12) * 1.2;
      ctx.drawImage(trainerRunnerImg, tFrameX, 0, 120, 120, 735, Math.round(tBobY), tW, tH);
    }

    // 5. Layer 5: Back Grass & grass_front_day (infinite scroll Left -> Right)
    if (backGrassImg.complete && backGrassImg.naturalWidth > 0) {
      ctx.drawImage(backGrassImg, backGrassOffset - 1920, 13, 1920, 1200);
      ctx.drawImage(backGrassImg, backGrassOffset, 13, 1920, 1200);
      if (backGrassOffset > 0) {
        ctx.drawImage(backGrassImg, backGrassOffset + 1920, 13, 1920, 1200);
      }
    }

    const curGrassDay = grassDayFrames[grassDayFrameIndex];
    if (curGrassDay && curGrassDay.complete && curGrassDay.naturalWidth > 0) {
      ctx.drawImage(curGrassDay, backGrassOffset - 1920, 13, 1920, 1200);
      ctx.drawImage(curGrassDay, backGrassOffset, 13, 1920, 1200);
      if (backGrassOffset > 0) {
        ctx.drawImage(curGrassDay, backGrassOffset + 1920, 13, 1920, 1200);
      }
    }

    // 5.5. Layer 5.5: Swirling Wind Gusts (Viento.png, 12 concurrent gusts across all altitudes)
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
        ctx.globalAlpha = w.alpha;
        ctx.drawImage(vientoImg, sx, sy, 192, 206, Math.round(w.x), Math.round(w.y), dw, dh);
        ctx.restore();
      }
    }

    // 7a. Layer 7a: Back Foreground Grass Layer (06_grass_front4.png, scaled ~0.85x, Y=460, scroll Left -> Right)
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

    // 7b. Layer 7b: Nearest Camera Grass Layer (06_grass_front4.png, near camera Y=340, scroll Left -> Right)
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

    animFrameId =
      typeof window !== 'undefined' && window.requestAnimationFrame
        ? window.requestAnimationFrame(loop)
        : (setTimeout(() => loop(performance.now()), 16) as unknown as number);
  }

  animFrameId =
    typeof window !== 'undefined' && window.requestAnimationFrame
      ? window.requestAnimationFrame(loop)
      : (setTimeout(() => loop(performance.now()), 16) as unknown as number);

  // 6. User Trigger Action
  const triggerStart = () => {
    if (hasTriggeredStart) return;
    hasTriggeredStart = true;

    // Fade out overlay smoothly
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
    showNotice('⚙️ Cài Đặt: Âm thanh 100% • Tỉ lệ hiển thị Pixel Art Crisp');
  });

  btnDev?.addEventListener('click', (e) => {
    e.stopPropagation();
    destroy();
    if (options?.onStart) {
      options.onStart();
    }
  });

  const destroy = () => {
    isRunning = false;
    if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
      window.cancelAnimationFrame(animFrameId);
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
  };
}
