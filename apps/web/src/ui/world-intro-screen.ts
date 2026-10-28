/**
 * World Creation Intro Screen (Màn Hình Mở Đầu Khi Tạo Thế Giới)
 *
 * Features:
 * 1. Phase 1 - Video Cinematic:
 *    - Plays authentic anime intro battle (Gengar vs Nidorino in Pokemon League)
 *    - Retro TV CRT scanline styling & frame
 *    - Clean minimalist overlay (zero icons, zero HUD clutter)
 *    - Timeline progress indicator
 * 2. Smooth Seamless Transition (Chuyển Cảnh Mượt):
 *    - Linear audio fade-out (zero pops/clicks)
 *    - Anime-style white radiance cross-dissolve
 *    - Video stage scales & fades out while story stage scales & fades in
 * 3. Phase 2 - Interactive Manga Prologue (6 Pages):
 *    - Trang 1: Trận chiến Gengar vs Nidorino
 *    - Trang 2: Bruno tung Onix & Red theo dõi TV ban đêm tại Pallet Town
 *    - Trang 3: Mẹ nhắc nhở đi ngủ lúc 11h đêm & áp phích 3 Pokémon khởi đầu
 *    - Trang 4: Giáo sư Oak giới thiệu Bulbasaur, Charmander, Squirtle
 *    - Trang 5: Dodrio gáy sáng trên mái nhà & ánh nắng ban mai đánh thức Red
 *    - Trang 6: Red cuống cuồng chạy đến Viện Okido & đám đông đứng đợi trước cửa
 *    - Interactive navigation: [Trước], [Tiếp tục], phím Space/Enter/Arrows/Esc
 *    - Click on image to advance
 *    - Retro GBA narration dialogue box with typewriter text effect (zero emojis)
 * 4. Phase 3 - Transition to Overworld:
 *    - Deep fade into black with transition card: "SAU LÚC ĐÓ... Tại Thị Trấn Pallet"
 *    - Gentle chime sound effect, transitions into Pallet Town
 */

import { INTRO_ASSETS } from '../assets/asset-registry';

export interface WorldIntroOptions {
  onComplete: () => void;
  onSkip?: () => void;
}

export interface WorldIntroController {
  skip: () => void;
  nextPage: () => void;
  prevPage: () => void;
  destroy: () => void;
  isComplete: boolean;
}

interface StoryPageData {
  title: string;
  imgUrl: string;
  narration: string;
}

const STORY_PAGES: StoryPageData[] = [
  {
    title: 'Trận Đấu Đỉnh Cao',
    imgUrl: INTRO_ASSETS.storyPage1,
    narration:
      'Nidorino dùng sừng tấn công! Nhưng nó quá dễ để tránh. Gengar sử dụng thôi miên. Tình hình có vẻ bất lợi cho Nidorino. Nó gục ngã rồi. Nhà huấn luyện đã thu hồi Nidorino. Liệu anh ta sẽ đưa ra con gì tiếp theo đây? Một con Iwark. Và Iwark sử dụng đòn tấn công trực diện. Gengar đã né được. Hôm nay Gengar di chuyển rất uyển chuyển và nhanh nhẹn.',
  },
  {
    title: 'Đêm Trước Ngày Khởi Hành',
    imgUrl: INTRO_ASSETS.storyPage2,
    narration:
      'Tứ Đại Thiên Vương Bruno tung Iwark khổng lồ xuất trận làm rung chuyển sàn đấu! Cách xa đấu trường tại thị trấn Masara, cậu bé Satoshi đang say mê dõi theo từng đòn thế qua màn hình tivi nhỏ trong phòng ngủ...',
  },
  {
    title: 'Ước Mơ Của Satoshi',
    imgUrl: INTRO_ASSETS.storyPage3,
    narration:
      'Ngày mai là tớ 10 tuổi rồi, và tớ sẽ không để bất cứ thứ gì ngăn cản tớ để trở thành nhà huấn luyện Pokemon. Mọi đứa trẻ đều nhận được một Pokemon khởi đầu từ Giáo sư Okido, nhà nghiên cứu Pokemon của thành phố. Tớ sẽ khởi hành chuyến đi của mình như một nhà huấn luyện Pokemon. Tớ tuyên bố với tất cả Pokemon trên thế giới rằng tớ sẽ là nhà huấn luyện Pokemon tài ba nhất! À không, là bậc thầy Pokemon!\n\nMẹ của Satoshi: Con còn định thức đến bao giờ, Satoshi? 11 giờ đêm rồi đấy.\n\nSatoshi: Nhưng ngày mai là khởi hành rồi mà. Con không ngủ được.\n\nMẹ của Satoshi: Nếu không ngủ được, vậy thì học đi.',
  },
  {
    title: 'Ba Pokémon Khởi Đầu',
    imgUrl: INTRO_ASSETS.storyPage4,
    narration:
      'Giáo sư Okido (trên TV): Đây là những Pokemon tặng cho những huấn luyện viên mới vào nghề ở thị trấn Masara. Fushigidane, Hitokage, và Zenigame. Đây là những Pokemon thiết yếu, hãy chọn lấy một con.\n\nMẹ của Satoshi: Xem nốt cái này rồi lên giường ngủ đi nhé.\n\nSatoshi: Con biết rồi.',
  },
  {
    title: 'Tiếng Gáy Báo Thức',
    imgUrl: INTRO_ASSETS.storyPage5,
    narration:
      'Bình minh ló rạng trên thị trấn Masara yên bình! Chú Dodrio trên nóc nhà cất tiếng gáy vang dội báo hiệu một ngày mới bắt đầu. Những tia nắng sớm rọi thẳng qua khung cửa sổ phòng ngủ, đánh thức cậu bé Satoshi...',
  },
  {
    title: 'Cuống Cuồng Khởi Hành',
    imgUrl: INTRO_ASSETS.storyPage6,
    narration:
      'Thôi chết rồi, Satoshi đã ngủ quên! Cậu hớt hải trong bộ đồ ngủ lao ra khỏi nhà, chạy như bay qua con đường làng hướng về phía Viện Nghiên Cứu. Nhưng ở chân bậc thang trước viện Okido, một hàng dài người đã đứng đợi từ lúc nào...',
  },
];

export function playWorldIntro(options: WorldIntroOptions): WorldIntroController {
  // 1. Clean up any existing intro
  const existing = document.getElementById('worldIntroOverlay');
  if (existing) {
    existing.remove();
  }

  let isComplete = false;
  let phase: 'video' | 'transitioning' | 'story' | 'done' = 'video';
  let currentPageIndex = 0;
  let typewriterTimer: number | null = null;
  const timeoutIds: number[] = [];
  const intervalIds: number[] = [];

  const scheduleTimeout = (callback: () => void, delayMs: number): number => {
    const id = window.setTimeout(callback, delayMs);
    timeoutIds.push(id);
    return id;
  };

  const scheduleInterval = (callback: () => void, delayMs: number): number => {
    const id = window.setInterval(callback, delayMs);
    intervalIds.push(id);
    return id;
  };

  // 2. Create Overlay Container
  const overlay = document.createElement('div');
  overlay.id = 'worldIntroOverlay';
  overlay.className = 'world-intro-overlay';

  overlay.innerHTML = `
    <!-- Flash effect for anime crossfade -->
    <div class="world-intro-flash" id="worldIntroFlash"></div>

    <!-- Transition curtain for game transition -->
    <div class="world-intro-morning" id="worldIntroMorning">
      <div class="morning-card">
        <div class="morning-title">SAU LÚC ĐÓ...</div>
        <div class="morning-subtitle">Tại Thị Trấn Pallet</div>
      </div>
    </div>

    <!-- Phase 1: Video Cinematic Stage -->
    <div class="world-intro-video-stage" id="worldIntroVideoStage">
      <div class="video-crt-wrapper">
        <video
          id="worldIntroVideo"
          class="world-intro-video"
          src="${INTRO_ASSETS.openingVideo}"
          playsinline
          preload="auto"
        ></video>
        <div class="video-scanlines"></div>
        <div class="video-vignette"></div>

        <!-- Video Top Actions (Minimalist, Zero Icons) -->
        <div class="video-hud-actions">
          <button id="btnIntroSkipToStory" class="intro-btn-action" title="Chuyển sang phần truyện (Phím Space)">Xem Truyện [Space]</button>
          <button id="btnIntroSkipAll" class="intro-btn-hud subtle" title="Bỏ qua vào game (Phím Esc)">Bỏ qua [Esc]</button>
        </div>

        <!-- Video Timeline Progress Bar -->
        <div class="video-progress-bar-bg">
          <div class="video-progress-bar-fill" id="videoProgressFill"></div>
        </div>
      </div>
    </div>

    <!-- Phase 2: Interactive Manga Story Stage (Pure Artwork Focus, No Header Bar) -->
    <div class="world-intro-story-stage" id="worldIntroStoryStage">
      <!-- Story Center Viewport -->
      <div class="story-viewport" id="storyViewport">
        <div class="story-image-card" id="storyImageCard" title="Nhấp chuột để tiếp tục">
          <img id="storyImage" class="story-image" src="${STORY_PAGES[0].imgUrl}" alt="Manga Page" />
        </div>
      </div>

      <!-- Story Bottom Dialogue & Narration Box -->
      <div class="story-narration-box">
        <div class="narration-header">
          <span class="narration-tag">DẪN CHUYỆN</span>
          <span class="narration-page-indicator" id="narrationPageIndicator">Trang 1 / ${STORY_PAGES.length} • ${STORY_PAGES[0].title}</span>
        </div>
        <div class="narration-text" id="narrationText"></div>
        <div class="narration-controls">
          <button id="btnStorySkip" class="story-btn subtle" title="Bỏ qua vào game (Phím Esc)">Bỏ qua [Esc]</button>
          <div class="narration-nav-group">
            <button id="btnStoryPrev" class="story-btn secondary" disabled>Trước</button>
            <button id="btnStoryNext" class="story-btn primary">Tiếp Tục [Space]</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 3. Query DOM Elements
  const flashEl = overlay.querySelector<HTMLElement>('#worldIntroFlash')!;
  const morningCurtainEl = overlay.querySelector<HTMLElement>('#worldIntroMorning')!;
  const videoStageEl = overlay.querySelector<HTMLElement>('#worldIntroVideoStage')!;
  const videoEl = overlay.querySelector<HTMLVideoElement>('#worldIntroVideo')!;
  const videoProgressFill = overlay.querySelector<HTMLElement>('#videoProgressFill')!;
  const btnSkipToStory = overlay.querySelector<HTMLButtonElement>('#btnIntroSkipToStory');
  const btnSkipAll = overlay.querySelector<HTMLButtonElement>('#btnIntroSkipAll');
  const storyStageEl = overlay.querySelector<HTMLElement>('#worldIntroStoryStage')!;
  const storyImageCard = overlay.querySelector<HTMLElement>('#storyImageCard')!;
  const storyImage = overlay.querySelector<HTMLImageElement>('#storyImage')!;
  const narrationPageIndicator = overlay.querySelector<HTMLElement>('#narrationPageIndicator')!;
  const narrationText = overlay.querySelector<HTMLElement>('#narrationText')!;
  const btnStoryPrev = overlay.querySelector<HTMLButtonElement>('#btnStoryPrev')!;
  const btnStoryNext = overlay.querySelector<HTMLButtonElement>('#btnStoryNext')!;
  const btnStorySkip = overlay.querySelector<HTMLButtonElement>('#btnStorySkip');

  // 4. Safe Sound Helper
  const playSound = (path: string, volume = 0.5) => {
    try {
      const audio = new Audio(path);
      audio.volume = volume;
      audio.play().catch(() => {
        // Audio is optional; blocked playback must not interrupt the intro.
      });
    } catch {
      // Audio construction can fail in restricted browsers or test environments.
    }
  };

  // 5. Typewriter Effect
  const renderTypewriter = (text: string) => {
    if (typewriterTimer !== null) {
      window.clearInterval(typewriterTimer);
      typewriterTimer = null;
    }
    narrationText.textContent = '';
    let i = 0;
    const speed = 18; // ms per char
    typewriterTimer = window.setInterval(() => {
      if (i < text.length) {
        narrationText.textContent += text[i];
        i++;
      } else {
        if (typewriterTimer !== null) {
          window.clearInterval(typewriterTimer);
          typewriterTimer = null;
        }
      }
    }, speed);
  };

  // 6. Story Page Display Logic
  const showStoryPage = (idx: number) => {
    if (idx < 0) idx = 0;
    if (idx >= STORY_PAGES.length) {
      finishIntro();
      return;
    }
    currentPageIndex = idx;
    const pageData = STORY_PAGES[idx];

    // Update image with soft fade
    storyImage.style.opacity = '0.3';
    storyImage.style.transform = 'scale(0.99)';
    scheduleTimeout(() => {
      storyImage.src = pageData.imgUrl;
      storyImage.style.opacity = '1';
      storyImage.style.transform = 'scale(1)';
    }, 120);

    // Update Narration Header & Text
    narrationPageIndicator.textContent = `Trang ${idx + 1} / ${STORY_PAGES.length} • ${pageData.title}`;
    renderTypewriter(pageData.narration);

    // Update Navigation Buttons (Clean Text, No Emojis)
    btnStoryPrev.disabled = idx === 0;

    if (idx === STORY_PAGES.length - 1) {
      btnStoryNext.innerHTML = 'Bắt Đầu Hành Trình [Space]';
    } else {
      btnStoryNext.innerHTML = 'Tiếp Tục [Space]';
    }

    playSound('/Audio/SE/GUI save game.ogg', 0.25);
  };

  // 7. Smooth Transition from Video to Story
  const transitionToStory = () => {
    if (phase !== 'video') return;
    phase = 'transitioning';

    // A. Smoothly fade video audio over 450ms
    const fadeAudioTimer = scheduleInterval(() => {
      if (videoEl && videoEl.volume > 0.08) {
        videoEl.volume = Math.max(0, videoEl.volume - 0.15);
      } else {
        window.clearInterval(fadeAudioTimer);
        if (videoEl) {
          videoEl.volume = 0;
          videoEl.pause();
        }
      }
    }, 45);

    // B. Video container scales & fades out
    videoStageEl.classList.add('fade-out');

    // C. Anime-style white flash cross-dissolve
    flashEl.classList.add('flash-active');

    // D. Story stage scales & fades in smoothly
    scheduleTimeout(() => {
      storyStageEl.classList.add('active');
      phase = 'story';
      showStoryPage(0);
      playSound('/Audio/SE/HealBell.ogg', 0.35);
    }, 420);

    // E. Remove video container from display after transition
    scheduleTimeout(() => {
      videoStageEl.style.display = 'none';
      flashEl.classList.remove('flash-active');
    }, 850);
  };

  // 8. Morning Transition to Game Overworld
  const finishIntro = () => {
    if (isComplete) return;
    isComplete = true;
    phase = 'done';

    // Stop typewriter
    if (typewriterTimer !== null) {
      window.clearInterval(typewriterTimer);
      typewriterTimer = null;
    }

    // Stop video safely
    if (videoEl) {
      videoEl.pause();
      videoEl.src = '';
    }

    // The story stage is behind the morning curtain. Hide it before the
    // curtain fades so the last manga page cannot flash back on screen.
    storyStageEl.classList.remove('active');
    storyStageEl.style.display = 'none';
    storyStageEl.style.pointerEvents = 'none';
    videoStageEl.style.display = 'none';

    // Reveal Morning Curtain
    morningCurtainEl.classList.add('show');
    playSound('/Audio/SE/Pkmn healing.ogg', 0.45);

    scheduleTimeout(() => {
      morningCurtainEl.classList.add('fade-out');
      scheduleTimeout(() => {
        // Let the world initialize while the curtain is still mounted. This
        // prevents a blank canvas from flashing between the story and map.
        try {
          options.onComplete();
        } finally {
          destroy();
        }
      }, 250);
    }, 2000);
  };

  // 9. Instant Skip Handler
  const skipAll = () => {
    if (isComplete) return;
    isComplete = true;
    phase = 'done';

    if (typewriterTimer !== null) {
      window.clearInterval(typewriterTimer);
      typewriterTimer = null;
    }

    if (videoEl) {
      videoEl.pause();
      videoEl.src = '';
    }

    try {
      if (options.onSkip) {
        options.onSkip();
      } else {
        options.onComplete();
      }
    } finally {
      destroy();
    }
  };

  // 10. Destroy & Cleanup
  const destroy = () => {
    timeoutIds.forEach((id) => window.clearTimeout(id));
    intervalIds.forEach((id) => window.clearInterval(id));
    timeoutIds.length = 0;
    intervalIds.length = 0;
    if (typewriterTimer !== null) {
      window.clearInterval(typewriterTimer);
      typewriterTimer = null;
    }
    videoEl.pause();
    if (typeof videoEl.removeAttribute === 'function') {
      videoEl.removeAttribute('src');
    } else {
      // The Vitest media mock does not implement Element#removeAttribute.
      videoEl.src = '';
    }
    window.removeEventListener('keydown', handleKeyDown);
    overlay.remove();
  };

  // Browsers may start the video muted when autoplay is blocked. The first
  // user gesture is an allowed point to restore audio before continuing.
  const unlockVideoAudio = () => {
    if (phase !== 'video' || !videoEl.muted) return;
    videoEl.muted = false;
    videoEl.play().catch(() => {
      // The browser can still reject playback; the transition remains usable.
    });
  };

  // 11. Event Listeners - Video Stage
  if (videoEl) {
    // Attempt playback with audio
    videoEl.volume = 0.8;
    videoEl.play().catch(() => {
      // Browser blocked unmuted autoplay -> mute and retry
      videoEl.muted = true;
      videoEl.play().catch(() => {});
    });

    videoEl.addEventListener('timeupdate', () => {
      if (videoEl.duration) {
        const progress = (videoEl.currentTime / videoEl.duration) * 100;
        videoProgressFill.style.width = `${progress}%`;

        // Automatically start smooth transition 0.5s before video ends
        if (videoEl.currentTime >= videoEl.duration - 0.5 && phase === 'video') {
          transitionToStory();
        }
      }
    });

    videoEl.addEventListener('ended', () => {
      if (phase === 'video') {
        transitionToStory();
      }
    });
  }

  overlay.addEventListener('pointerdown', unlockVideoAudio, { capture: true });

  btnSkipToStory?.addEventListener('click', (e) => {
    e.stopPropagation();
    transitionToStory();
  });

  btnSkipAll?.addEventListener('click', (e) => {
    e.stopPropagation();
    skipAll();
  });

  // Clicking on video stage also triggers smooth transition to story
  videoStageEl.addEventListener('click', () => {
    if (phase === 'video') {
      transitionToStory();
    }
  });

  // 12. Event Listeners - Story Stage
  btnStoryPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentPageIndex > 0) showStoryPage(currentPageIndex - 1);
  });

  btnStoryNext.addEventListener('click', (e) => {
    e.stopPropagation();
    showStoryPage(currentPageIndex + 1);
  });

  storyImageCard.addEventListener('click', (e) => {
    e.stopPropagation();
    showStoryPage(currentPageIndex + 1);
  });

  btnStorySkip?.addEventListener('click', (e) => {
    e.stopPropagation();
    skipAll();
  });

  // 13. Global Keyboard Handler
  const handleKeyDown = (e: KeyboardEvent) => {
    unlockVideoAudio();
    if (e.key === 'Escape') {
      e.preventDefault();
      skipAll();
      return;
    }

    if (phase === 'video') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        transitionToStory();
      }
    } else if (phase === 'story') {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        showStoryPage(currentPageIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentPageIndex > 0) showStoryPage(currentPageIndex - 1);
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  return {
    skip: skipAll,
    nextPage: () => showStoryPage(currentPageIndex + 1),
    prevPage: () => {
      if (currentPageIndex > 0) showStoryPage(currentPageIndex - 1);
    },
    destroy,
    get isComplete() {
      return isComplete;
    },
  };
}
