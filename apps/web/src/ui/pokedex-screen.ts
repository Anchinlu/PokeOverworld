import type { PokemonSpeciesData } from '@pokemon/shared-types';
import { filterPokemon } from './pokedex/pokedex-filter';
import { getPokedexEntries } from './pokedex/pokedex-data';
import { PokedexState } from './pokedex/pokedex-state';

// Type indices in Graphics/Pokedex/icon_types.png (18 types, 32px height each)
const TYPE_INDICES: Record<string, number> = {
  Normal: 0,
  Fighting: 1,
  Flying: 2,
  Poison: 3,
  Ground: 4,
  Rock: 5,
  Bug: 6,
  Ghost: 7,
  Steel: 8,
  Fire: 10,
  Water: 11,
  Grass: 12,
  Electric: 13,
  Psychic: 14,
  Ice: 15,
  Dragon: 16,
  Dark: 17,
  Fairy: 18,
};

interface HabitatConfig {
  bg: string;
  base: string;
}

const TYPE_HABITATS: Record<string, HabitatConfig> = {
  grass: { bg: 'Forest.png', base: 'ForestGrass.png' },
  bug: { bg: 'Forest.png', base: 'ForestGrass.png' },
  fire: { bg: 'Mountain.png', base: 'Mountain.png' },
  water: { bg: 'Water.png', base: 'Water.png' },
  electric: { bg: 'Field.png', base: 'FieldGrass.png' },
  ice: { bg: 'Snow.png', base: 'Snow.png' },
  rock: { bg: 'Mountain.png', base: 'Mountain.png' },
  ground: { bg: 'Cave.png', base: 'FieldSand.png' },
  poison: { bg: 'Forest.png', base: 'ForestMud.png' },
  ghost: { bg: 'CaveDark.png', base: 'CaveDark.png' },
  psychic: { bg: 'IndoorB.png', base: 'IndoorB.png' },
  fighting: { bg: 'Gym1.png', base: 'Gym1.png' },
  dragon: { bg: 'Champion.png', base: 'Champion.png' },
  flying: { bg: 'Mountain.png', base: 'MountainGrass.png' },
  normal: { bg: 'Field.png', base: 'FieldGrass.png' },
  steel: { bg: 'City.png', base: 'CityConcrete.png' },
  fairy: { bg: 'Field.png', base: 'FieldGrass.png' },
  dark: { bg: 'CaveDark.png', base: 'CaveDark.png' },
};

function getPokemonHabitat(pokemon: PokemonSpeciesData): HabitatConfig {
  const name = pokemon.name.toLowerCase();

  // Deep water / Ocean Pokémon
  if (
    [
      'magikarp',
      'gyarados',
      'goldeen',
      'seaking',
      'shellder',
      'cloyster',
      'staryu',
      'starmie',
      'horsea',
      'seadra',
      'tentacool',
      'tentacruel',
      'lapras',
      'omanyte',
      'omastar',
      'kabuto',
      'kabutops',
    ].includes(name)
  ) {
    return { bg: 'Underwater.png', base: 'Underwater.png' };
  }

  // Cave dwellers
  if (
    ['zubat', 'golbat', 'diglett', 'dugtrio', 'geodude', 'graveler', 'golem', 'onix'].includes(name)
  ) {
    return { bg: 'Cave.png', base: 'Cave.png' };
  }

  // Ghost types
  if (pokemon.types.some((t) => t.toLowerCase() === 'ghost')) {
    return { bg: 'CaveDark.png', base: 'CaveDark.png' };
  }

  // Dragon types
  if (pokemon.types.some((t) => t.toLowerCase() === 'dragon')) {
    return { bg: 'Champion.png', base: 'Champion.png' };
  }

  // Ice types
  if (pokemon.types.some((t) => t.toLowerCase() === 'ice')) {
    return { bg: 'Snow.png', base: 'Snow.png' };
  }

  // Primary type mapping
  const primary = (pokemon.types[0] || 'normal').toLowerCase();
  return TYPE_HABITATS[primary] || { bg: 'Field.png', base: 'FieldGrass.png' };
}

// Canvas Pixel-Perfect Type Badge Renderer for types.png
class TypeBadgeRenderer {
  private static img: HTMLImageElement | null = null;
  private static isLoaded = false;
  private static pendingCallbacks: (() => void)[] = [];

  public static init(): void {
    if (!TypeBadgeRenderer.img) {
      const img = new Image();
      img.src = '/Graphics/Pokemon/Icons%20type/types.png?v=newtype';
      img.onload = () => {
        TypeBadgeRenderer.isLoaded = true;
        TypeBadgeRenderer.pendingCallbacks.forEach((cb) => cb());
        TypeBadgeRenderer.pendingCallbacks = [];
      };
      TypeBadgeRenderer.img = img;
    }
  }

  public static renderBadge(canvas: HTMLCanvasElement, typeIndex: number): void {
    TypeBadgeRenderer.init();
    const w = 64;
    const h = 28;
    canvas.width = w;
    canvas.height = h;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !TypeBadgeRenderer.img) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(TypeBadgeRenderer.img, 17, typeIndex * 32 + 2, 64, 28, 0, 0, w, h);
    };

    if (TypeBadgeRenderer.isLoaded) {
      draw();
    } else {
      TypeBadgeRenderer.pendingCallbacks.push(draw);
    }
  }
}

interface AnimatorOptions {
  fixedWidth?: number;
  fixedHeight?: number;
  groundY?: number;
}

// Canvas Animated Sprite Manager for EBS Generation 5 horizontal strip sprites
class PokemonSpriteAnimator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private img: HTMLImageElement | null = null;
  private animFrameId: number | null = null;
  private currentFrame = 0;
  private totalFrames = 1;
  private frameWidth = 0;
  private frameHeight = 0;
  private lastTime = 0;
  private frameDuration = 45; // ~22 FPS
  private options?: AnimatorOptions;
  private destX = 0;
  private destY = 0;
  private destW = 0;
  private destH = 0;

  constructor(canvas: HTMLCanvasElement, options?: AnimatorOptions) {
    this.canvas = canvas;
    this.options = options;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  load(src: string): void {
    this.stop();
    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.img = img;
      this.frameHeight = img.height;
      this.frameWidth = img.height; // Square frame
      this.totalFrames = Math.max(1, Math.floor(img.width / img.height));
      this.currentFrame = 0;

      if (this.options?.fixedWidth && this.options?.fixedHeight) {
        this.canvas.width = this.options.fixedWidth;
        this.canvas.height = this.options.fixedHeight;

        // Scan non-transparent bounding box of frame 0
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.frameWidth;
        tempCanvas.height = this.frameHeight;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        let minX = this.frameWidth;
        let maxX = 0;
        let minY = this.frameHeight;
        let maxY = 0;

        if (tempCtx) {
          tempCtx.drawImage(
            this.img,
            0,
            0,
            this.frameWidth,
            this.frameHeight,
            0,
            0,
            this.frameWidth,
            this.frameHeight
          );
          const imgData = tempCtx.getImageData(0, 0, this.frameWidth, this.frameHeight).data;
          for (let y = 0; y < this.frameHeight; y++) {
            for (let x = 0; x < this.frameWidth; x++) {
              const alpha = imgData[(y * this.frameWidth + x) * 4 + 3];
              if (alpha > 20) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
        }

        if (minX > maxX) {
          minX = 0;
          maxX = this.frameWidth - 1;
          minY = 0;
          maxY = this.frameHeight - 1;
        }

        const contentCenterX = (minX + maxX) / 2.0;
        const contentBottomY = maxY;
        const scale = Math.min(1.6, Math.max(1.0, 85 / this.frameHeight));
        const groundY = this.options.groundY ?? 128;

        this.destW = Math.round(this.frameWidth * scale);
        this.destH = Math.round(this.frameHeight * scale);
        this.destX = Math.round(this.options.fixedWidth / 2.0 - contentCenterX * scale);
        this.destY = Math.round(groundY - contentBottomY * scale);
      } else {
        this.canvas.width = this.frameWidth;
        this.canvas.height = this.frameHeight;
        this.destX = 0;
        this.destY = 0;
        this.destW = this.frameWidth;
        this.destH = this.frameHeight;
      }

      this.draw();
      if (this.totalFrames > 1) {
        this.start();
      }
    };
  }

  private draw(): void {
    if (!this.img) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.imageSmoothingEnabled = false;
    const sx = this.currentFrame * this.frameWidth;
    this.ctx.drawImage(
      this.img,
      sx,
      0,
      this.frameWidth,
      this.frameHeight,
      this.destX,
      this.destY,
      this.destW,
      this.destH
    );
  }

  private loop = (time: number) => {
    if (time - this.lastTime >= this.frameDuration) {
      this.lastTime = time;
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.draw();
    }
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  start(): void {
    if (!this.animFrameId && this.totalFrames > 1) {
      this.lastTime = performance.now();
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  }

  stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}

export class PokedexUI {
  private static instance: PokedexUI | null = null;
  private rootModal: HTMLElement | null = null;
  private listAnimator: PokemonSpriteAnimator | null = null;
  private infoAnimator: PokemonSpriteAnimator | null = null;

  private allPokemon: PokemonSpeciesData[] = [];
  private filteredPokemon: PokemonSpeciesData[] = [];
  private selectedIndex = 0;
  private scrollOffset = 0;
  private readonly visibleCount = 7;
  private viewMode: 'list' | 'info' = 'list';
  private isOpen = false;
  private readonly state = new PokedexState();

  private constructor() {
    this.allPokemon = getPokedexEntries();
    this.filteredPokemon = [...this.allPokemon];
  }

  public static getInstance(): PokedexUI {
    if (!PokedexUI.instance) {
      PokedexUI.instance = new PokedexUI();
    }
    return PokedexUI.instance;
  }

  public open(initialPokemonId?: number): void {
    if (!this.rootModal) {
      this.createDOM();
    }
    this.isOpen = true;
    this.state.isOpen = true;
    this.viewMode = 'list';

    if (initialPokemonId) {
      const idx = this.filteredPokemon.findIndex((p) => p.id === initialPokemonId);
      if (idx >= 0) {
        this.selectedIndex = idx;
        this.ensureSelectionVisible();
      }
    }

    if (this.rootModal) {
      this.rootModal.style.display = 'flex';
      this.updateResponsiveScale();
    }

    this.render();
  }

  public close(): void {
    this.isOpen = false;
    this.state.isOpen = false;
    if (this.rootModal) {
      this.rootModal.style.display = 'none';
    }
    this.listAnimator?.stop();
    this.infoAnimator?.stop();
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public isVisible(): boolean {
    return this.isOpen;
  }

  private updateResponsiveScale(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Calculate integer or crisp floating scale for 512x384 retro display
    const scaleX = (w - 32) / 512;
    const scaleY = (h - 32) / 384;
    const scale = Math.max(1, Math.min(scaleX, scaleY, 2.0));
    document.documentElement.style.setProperty('--pokedex-scale', scale.toFixed(2));
  }

  private createDOM(): void {
    const backdrop = document.createElement('div');
    backdrop.id = 'pokedexRetroBackdrop';
    backdrop.className = 'pokedex-retro-backdrop';

    backdrop.innerHTML = `
      <div class="pokedex-retro-wrapper" id="pokedexRetroWrapper">
        <!-- 1. Screen List (bg_list.png - 512x384) -->
        <div class="pokedex-screen pokedex-screen-list" id="pokedexScreenList">
          <!-- Integrated Search Bar in the top black header area -->
          <div class="pokedex-retro-search-bar" id="pokedexRetroSearchBar">
            <img src="/Graphics/Pokedex/icon_search_ball.png" class="pokedex-search-icon-img" alt="Tìm kiếm" />
            <input type="text" id="inputPokedexSearch" placeholder="Tìm tên hoặc số hiệu..." autocomplete="off" />
            <button class="btn-clear-search" id="btnClearSearch" title="Xóa tìm kiếm">✕</button>
          </div>

          <!-- Integrated Close Button in the top black header area -->
          <button class="pokedex-retro-close" id="btnPokedexRetroClose" title="Đóng Pokédex (Esc)">✕</button>
          <!-- Top Left Card: No. & Name (x: 28..195, y: 54..81) -->
          <div class="list-left-header" id="listLeftHeader">
            <img src="/Graphics/Pokedex/icon_own.png" class="list-own-icon" alt="Caught" />
            <span class="list-header-title" id="listLeftTitle">No. 001 Bulbasaur</span>
          </div>

          <!-- Middle Left: Sprite Canvas Preview on Watermark Grid (x: 10..223, y: 88..304) -->
          <div class="list-preview-box" id="listPreviewBox" title="Nhấn để xem chi tiết (Enter)">
            <canvas id="canvasListSprite" class="pokedex-canvas-sprite list-sprite-canvas"></canvas>
            <div class="list-pokemon-types" id="listPokemonTypes"></div>
          </div>

          <!-- Bottom Left Card: Seen & Caught Counters (x: 24..199, y: 310..369) -->
          <div class="list-counters-box">
            <div class="counter-row">
              <div class="counter-left-group">
                <img src="/Graphics/Pokedex/icon_seen.png" class="counter-mini-icon" alt="Seen" />
                <span class="counter-label">ĐÃ THẤY</span>
              </div>
              <strong class="counter-value" id="countSeen">151</strong>
            </div>
            <div class="counter-row">
              <div class="counter-left-group">
                <img src="/Graphics/Pokedex/icon_own.png" class="counter-mini-icon" alt="Caught" />
                <span class="counter-label">ĐÃ BẮT</span>
              </div>
              <strong class="counter-value" id="countCaught">151</strong>
            </div>
          </div>

          <!-- Right: 7-Row List Items (x: 240..484, y: 58..366) -->
          <div class="list-items-container" id="listItemsContainer"></div>

          <!-- Right Scrollbar Slider (x: 478, y: 72..351, height: 279px) -->
          <div class="list-slider-track" id="listSliderTrack">
            <div class="list-slider-handle" id="listSliderHandle"></div>
          </div>

          <!-- Bottom Action Hint -->
          <div class="list-bottom-hint">
            <span>[Enter] Xem chi tiết</span> | <span>[▲/▼] Di chuyển</span> | <span>[Esc] Đóng</span>
          </div>
        </div>

        <!-- 2. Screen Info / Detail (bg_info.PNG - 512x384) -->
        <div class="pokedex-screen pokedex-screen-info" id="pokedexScreenInfo" style="display: none;">
          <!-- Top Tab Navigation Bar (advancedInfoBar.png - 512x32) -->
          <div class="info-top-bar">
            <button class="info-tab-btn" id="btnInfoBack">◀ Danh sách</button>
            <span class="info-tab-title">Thông tin Pokémon</span>
            <button class="info-tab-btn" id="btnInfoClose">Đóng [✕]</button>
          </div>

          <!-- Top Meta Box (y: 40..104px, x: 20..492px) -->
          <div class="info-meta-box">
            <div class="info-num-name">
              <span class="info-pkmn-id" id="infoPkmnId">No. 025</span>
              <span class="info-pkmn-name" id="infoPkmnName">PIKACHU</span>
            </div>
            <div class="info-types-row" id="infoTypesRow"></div>
          </div>

          <!-- Middle Left: Large Sprite with habitat backdrop and base (y: 60..212px, x: 18..190px) -->
          <div class="info-sprite-box">
            <img id="infoHabitatBg" class="info-habitat-bg" alt="Môi trường sống" />
            <img id="infoHabitatBase" class="info-habitat-base" alt="Nền môi trường" />
            <canvas id="canvasInfoSprite" class="pokedex-canvas-sprite"></canvas>
          </div>

          <!-- Middle Center: HW Icon (y: 124..185px, x: 212..273px) -->
          <div class="info-hw-box">
            <img src="/Graphics/Pokedex/icon_hw.png" class="icon-hw-img" alt="Height Weight" />
          </div>

          <!-- Middle Right: Physical Specs (y: 162..217px, x: 300..493px) -->
          <div class="info-specs-box">
            <div class="specs-text-column">
              <div class="spec-item">
                <span class="spec-label">Chiều cao:</span>
                <span class="spec-value" id="infoHeight">0.4 m</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Cân nặng:</span>
                <span class="spec-value" id="infoWeight">6.0 kg</span>
              </div>
            </div>
          </div>

          <!-- Bottom: Info & Stats (y: 242..365px, x: 36..475px) -->
          <div class="info-bottom-box">
            <div class="info-bottom-split">
              <!-- Left: Pokemon Research Info -->
              <div class="info-research-col">
                <div class="research-title">THÔNG TIN</div>
                <div class="research-item">
                  <span class="research-label">Hệ Gen:</span>
                  <span class="research-value">Gen 1 (Kanto)</span>
                </div>
                <div class="research-item">
                  <span class="research-label">Loài:</span>
                  <span class="research-value" id="infoSpecies">Seed Pokémon</span>
                </div>
                <div class="research-item">
                  <span class="research-label">Khả năng:</span>
                  <span class="research-value" id="infoAbility">Overgrow</span>
                </div>
                <div class="research-item">
                  <span class="research-label">Tỉ lệ bắt:</span>
                  <span class="research-value" id="infoCatchRate">45</span>
                </div>
                <div class="research-item">
                  <span class="research-label">Nhóm trứng:</span>
                  <span class="research-value" id="infoEggGroups">Monster, Grass</span>
                </div>
                <div class="research-item">
                  <span class="research-label">Giới tính:</span>
                  <span class="research-value" id="infoGender">♂87.5% ♀12.5%</span>
                </div>
              </div>
              <!-- Right: Vertical Stats -->
              <div class="info-stats-col">
                <div class="research-title">CHỈ SỐ (TỔNG: <span id="infoTotalStats" class="stat-bst-val">320</span>)</div>
                <div class="stat-row"><span class="stat-k">HP</span><div class="stat-bar"><div class="stat-fill" id="barHp"></div></div><strong id="statHp">35</strong></div>
                <div class="stat-row"><span class="stat-k">ATK</span><div class="stat-bar"><div class="stat-fill" id="barAtk"></div></div><strong id="statAtk">55</strong></div>
                <div class="stat-row"><span class="stat-k">DEF</span><div class="stat-bar"><div class="stat-fill" id="barDef"></div></div><strong id="statDef">40</strong></div>
                <div class="stat-row"><span class="stat-k">SP.A</span><div class="stat-bar"><div class="stat-fill" id="barSpAtk"></div></div><strong id="statSpAtk">50</strong></div>
                <div class="stat-row"><span class="stat-k">SP.D</span><div class="stat-bar"><div class="stat-fill" id="barSpDef"></div></div><strong id="statSpDef">50</strong></div>
                <div class="stat-row"><span class="stat-k">SPD</span><div class="stat-bar"><div class="stat-fill" id="barSpd"></div></div><strong id="statSpd">90</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    this.rootModal = backdrop;

    // Sprite Animators
    const canvasList = backdrop.querySelector<HTMLCanvasElement>('#canvasListSprite')!;
    const canvasInfo = backdrop.querySelector<HTMLCanvasElement>('#canvasInfoSprite')!;
    this.listAnimator = new PokemonSpriteAnimator(canvasList);
    this.infoAnimator = new PokemonSpriteAnimator(canvasInfo, {
      fixedWidth: 170,
      fixedHeight: 145,
      groundY: 128,
    });

    // Event Listeners
    backdrop.querySelector('#btnPokedexRetroClose')?.addEventListener('click', () => this.close());
    backdrop.querySelector('#btnInfoClose')?.addEventListener('click', () => this.close());
    backdrop.querySelector('#btnInfoBack')?.addEventListener('click', () => {
      this.viewMode = 'list';
      this.render();
    });
    backdrop.querySelector('#btnOpenDetailFromMenu')?.addEventListener('click', () => {
      this.viewMode = 'info';
      this.render();
    });
    backdrop.querySelector('#listPreviewBox')?.addEventListener('click', () => {
      this.viewMode = 'info';
      this.render();
    });

    backdrop
      .querySelector('#btnPrevPkmn')
      ?.addEventListener('click', () => this.navigatePokemon(-1));
    backdrop
      .querySelector('#btnNextPkmn')
      ?.addEventListener('click', () => this.navigatePokemon(1));

    // Search Input
    const searchInput = backdrop.querySelector<HTMLInputElement>('#inputPokedexSearch')!;
    const clearBtn = backdrop.querySelector<HTMLButtonElement>('#btnClearSearch')!;

    searchInput.addEventListener('input', () => {
      this.filterPokemon(searchInput.value);
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.filterPokemon('');
      searchInput.focus();
    });

    // Mouse wheel on list
    const listContainer = backdrop.querySelector('#listItemsContainer')!;
    listContainer.addEventListener(
      'wheel',
      (e: Event) => {
        const wheelEv = e as WheelEvent;
        wheelEv.preventDefault();
        const delta = Math.sign(wheelEv.deltaY);
        this.scrollList(delta);
      },
      { passive: false }
    );

    // Slider track click / drag
    const sliderTrack = backdrop.querySelector('#listSliderTrack')!;
    sliderTrack.addEventListener('click', (e: Event) => {
      const mouseEv = e as MouseEvent;
      const rect = sliderTrack.getBoundingClientRect();
      const clickRatio = Math.max(0, Math.min(1, (mouseEv.clientY - rect.top) / rect.height));
      const maxScroll = Math.max(0, this.filteredPokemon.length - this.visibleCount);
      this.scrollOffset = Math.round(clickRatio * maxScroll);
      this.renderListItems();
    });

    // Global Key Listener for Pokédex navigation
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.key === 'Escape') {
        if (this.viewMode === 'info') {
          this.viewMode = 'list';
          this.render();
        } else {
          this.close();
        }
        e.preventDefault();
        return;
      }

      if (this.viewMode === 'list') {
        if (e.key === 'ArrowUp') {
          this.moveSelection(-1);
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          this.moveSelection(1);
          e.preventDefault();
        } else if (e.key === 'PageUp') {
          this.moveSelection(-this.visibleCount);
          e.preventDefault();
        } else if (e.key === 'PageDown') {
          this.moveSelection(this.visibleCount);
          e.preventDefault();
        } else if (e.key === 'Enter' || e.code === 'Space') {
          // Open info screen
          if (this.filteredPokemon.length > 0) {
            this.viewMode = 'info';
            this.render();
          }
          e.preventDefault();
        }
      } else if (this.viewMode === 'info') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          this.navigatePokemon(-1);
          e.preventDefault();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          this.navigatePokemon(1);
          e.preventDefault();
        } else if (e.key === 'Backspace') {
          this.viewMode = 'list';
          this.render();
          e.preventDefault();
        }
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (this.isOpen) {
        this.updateResponsiveScale();
      }
    });
  }

  private filterPokemon(query: string): void {
    this.state.query = query;
    this.filteredPokemon = filterPokemon(this.allPokemon, query);

    this.selectedIndex = 0;
    this.scrollOffset = 0;
    this.render();
  }

  private scrollList(delta: number): void {
    const maxScroll = Math.max(0, this.filteredPokemon.length - this.visibleCount);
    this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset + delta));
    this.renderListItems();
  }

  private moveSelection(delta: number): void {
    if (this.filteredPokemon.length === 0) return;
    const newIdx = Math.max(
      0,
      Math.min(this.filteredPokemon.length - 1, this.selectedIndex + delta)
    );
    if (newIdx !== this.selectedIndex) {
      this.selectedIndex = newIdx;
      this.ensureSelectionVisible();
      this.render();
    }
  }

  private ensureSelectionVisible(): void {
    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex;
    } else if (this.selectedIndex >= this.scrollOffset + this.visibleCount) {
      this.scrollOffset = this.selectedIndex - this.visibleCount + 1;
    }
  }

  private navigatePokemon(delta: number): void {
    if (this.filteredPokemon.length === 0) return;
    this.selectedIndex =
      (this.selectedIndex + delta + this.filteredPokemon.length) % this.filteredPokemon.length;
    this.ensureSelectionVisible();
    this.render();
  }

  private render(): void {
    if (!this.rootModal) return;

    const screenList = this.rootModal.querySelector<HTMLElement>('#pokedexScreenList')!;
    const screenInfo = this.rootModal.querySelector<HTMLElement>('#pokedexScreenInfo')!;

    if (this.viewMode === 'list') {
      screenList.style.display = 'block';
      screenInfo.style.display = 'none';
      this.infoAnimator?.stop();
      this.renderList();
    } else {
      screenList.style.display = 'none';
      screenInfo.style.display = 'block';
      this.listAnimator?.stop();
      this.renderInfo();
    }
  }

  private renderList(): void {
    if (!this.rootModal) return;
    const current = this.filteredPokemon[this.selectedIndex];

    // Left header: Name & No.
    const titleEl = this.rootModal.querySelector<HTMLElement>('#listLeftTitle');
    if (titleEl) {
      if (current) {
        titleEl.innerText = `No. ${String(current.id).padStart(3, '0')} ${current.name}`;
      } else {
        titleEl.innerText = 'Không tìm thấy';
      }
    }

    // Left preview sprite
    if (current && current.sprites.front) {
      this.listAnimator?.load(`/${current.sprites.front}`);
    }

    // Bottom Counters
    const countSeen = this.rootModal.querySelector<HTMLElement>('#countSeen');
    const countCaught = this.rootModal.querySelector<HTMLElement>('#countCaught');
    if (countSeen) countSeen.innerText = String(this.allPokemon.length);
    if (countCaught) countCaught.innerText = String(this.allPokemon.length);

    // Types badges at top right of preview area (Graphics/Pokemon/Icons type/types.png)
    const typesContainer = this.rootModal.querySelector<HTMLElement>('#listPokemonTypes');
    if (typesContainer) {
      typesContainer.innerHTML = '';
      if (current) {
        current.types.forEach((type) => {
          const typeIndex = TYPE_INDICES[type] ?? 0;
          const badgeCanvas = document.createElement('canvas');
          badgeCanvas.className = 'list-type-badge';
          badgeCanvas.title = type;
          TypeBadgeRenderer.renderBadge(badgeCanvas, typeIndex);
          typesContainer.appendChild(badgeCanvas);
        });
      }
    }

    this.renderListItems();
  }

  private renderListItems(): void {
    if (!this.rootModal) return;
    const container = this.rootModal.querySelector<HTMLElement>('#listItemsContainer');
    if (!container) return;

    container.innerHTML = '';
    const visibleItems = this.filteredPokemon.slice(
      this.scrollOffset,
      this.scrollOffset + this.visibleCount
    );

    visibleItems.forEach((pkmn, idx) => {
      const realIndex = this.scrollOffset + idx;
      const isSelected = realIndex === this.selectedIndex;

      const itemEl = document.createElement('div');
      itemEl.className = `pokedex-list-row ${isSelected ? 'selected' : ''}`;
      itemEl.dataset.index = String(realIndex);

      const padId = String(pkmn.id).padStart(3, '0');

      itemEl.innerHTML = `
        <img src="/Graphics/Pokedex/icon_own.png" class="row-pokeball-icon" alt="Caught" />
        <div class="row-pkmn-icon" style="background-image: url('/${pkmn.sprites.icon}');"></div>
        <span class="row-num">No. ${padId}</span>
        <span class="row-name">${pkmn.name}</span>
      `;

      itemEl.addEventListener('click', () => {
        this.selectedIndex = realIndex;
        this.render();
      });

      itemEl.addEventListener('dblclick', () => {
        this.selectedIndex = realIndex;
        this.viewMode = 'info';
        this.render();
      });

      container.appendChild(itemEl);
    });

    // Update slider handle position (Track groove between arrows: y:72..351 -> height: 279px)
    const handle = this.rootModal.querySelector<HTMLElement>('#listSliderHandle');
    if (handle) {
      const maxScroll = Math.max(1, this.filteredPokemon.length - this.visibleCount);
      const ratio = Math.max(0, Math.min(1, this.scrollOffset / maxScroll));
      const trackHeight = 279;
      const handleHeight = 30;
      const topPx = ratio * (trackHeight - handleHeight);
      handle.style.top = `${topPx}px`;
    }
  }

  private renderInfo(): void {
    if (!this.rootModal) return;
    const current = this.filteredPokemon[this.selectedIndex];
    if (!current) return;

    const padId = String(current.id).padStart(3, '0');

    // Header info
    const idEl = this.rootModal.querySelector<HTMLElement>('#infoPkmnId');
    const nameEl = this.rootModal.querySelector<HTMLElement>('#infoPkmnName');
    if (idEl) idEl.innerText = `No. ${padId}`;
    if (nameEl) nameEl.innerText = current.name.toUpperCase();

    // Type Badges from Graphics/Pokedex/icon_types.png
    const typesRow = this.rootModal.querySelector<HTMLElement>('#infoTypesRow');
    if (typesRow) {
      typesRow.innerHTML = '';
      current.types.forEach((type) => {
        const typeIndex = TYPE_INDICES[type] ?? 0;
        const badgeCanvas = document.createElement('canvas');
        badgeCanvas.className = 'info-type-badge';
        badgeCanvas.title = type;
        TypeBadgeRenderer.renderBadge(badgeCanvas, typeIndex);
        typesRow.appendChild(badgeCanvas);
      });
    }

    // Specs - use real data from pokemondb.net
    const heightEl = this.rootModal.querySelector<HTMLElement>('#infoHeight');
    const weightEl = this.rootModal.querySelector<HTMLElement>('#infoWeight');
    const totalEl = this.rootModal.querySelector<HTMLElement>('#infoTotalStats');

    const displayHeight = current.height
      ? `${current.height} m`
      : `${(0.3 + (current.stats.total / 600) * 1.5).toFixed(1)} m`;
    const displayWeight = current.weight
      ? `${current.weight} kg`
      : `${(3 + (current.stats.total / 600) * 75).toFixed(1)} kg`;

    if (heightEl) heightEl.innerText = displayHeight;
    if (weightEl) weightEl.innerText = displayWeight;
    if (totalEl) totalEl.innerText = String(current.stats.total);

    // Habitat Environment Background & Base Platform
    const habitat = getPokemonHabitat(current);
    const bgImg = this.rootModal.querySelector<HTMLImageElement>('#infoHabitatBg');
    const baseImg = this.rootModal.querySelector<HTMLImageElement>('#infoHabitatBase');
    if (bgImg) {
      bgImg.src = `/Graphics/Pokedex/backgound%20type/backgound%20type%20m/${habitat.bg}`;
    }
    if (baseImg) {
      baseImg.src = `/Graphics/Pokedex/backgound%20type/base%20backgound%20m/${habitat.base}`;
    }

    // Sprite
    if (current.sprites.front) {
      this.infoAnimator?.load(`/${current.sprites.front}`);
    }

    // Research info panel
    const setResearch = (id: string, val: string) => {
      const el = this.rootModal?.querySelector<HTMLElement>(`#${id}`);
      if (el) el.innerText = val;
    };
    setResearch('infoSpecies', current.species ?? '—');
    setResearch('infoAbility', current.ability ?? '—');
    setResearch('infoCatchRate', current.catchRate != null ? String(current.catchRate) : '—');
    setResearch('infoEggGroups', current.eggGroups ?? '—');
    setResearch('infoGender', current.genderRatio ?? '—');

    // Base Stats with color coding
    const stats = current.stats;
    const getStatRank = (val: number): number => {
      if (val < 30) return 1; // Very low - red
      if (val < 60) return 2; // Low - orange
      if (val < 80) return 3; // Below avg - yellow
      if (val < 100) return 4; // Average - lime
      if (val < 130) return 5; // High - green
      return 6; // Very high - cyan
    };

    const updateStat = (idVal: string, idBar: string, val: number, max = 160) => {
      const vEl = this.rootModal?.querySelector<HTMLElement>(`#${idVal}`);
      const bEl = this.rootModal?.querySelector<HTMLElement>(`#${idBar}`);
      if (vEl) vEl.innerText = String(val);
      if (bEl) {
        const pct = Math.min(100, Math.round((val / max) * 100));
        bEl.style.width = `${pct}%`;
        // Clear old rank classes and set new one
        bEl.className = `stat-fill stat-rank-${getStatRank(val)}`;
        // Also set rank class on parent .stat-row for text color
        const row = bEl.closest('.stat-row');
        if (row) {
          row.className = `stat-row rank-${getStatRank(val)}`;
        }
      }
    };

    updateStat('statHp', 'barHp', stats.hp);
    updateStat('statAtk', 'barAtk', stats.attack);
    updateStat('statDef', 'barDef', stats.defense);
    updateStat('statSpAtk', 'barSpAtk', stats.spAtk);
    updateStat('statSpDef', 'barSpDef', stats.spDef);
    updateStat('statSpd', 'barSpd', stats.speed);
  }
}

export function initPokedex(): PokedexUI {
  return PokedexUI.getInstance();
}

export function openPokedex(pokemonId?: number): void {
  PokedexUI.getInstance().open(pokemonId);
}

export function closePokedex(): void {
  PokedexUI.getInstance().close();
}

export function togglePokedex(): void {
  PokedexUI.getInstance().toggle();
}

export function isPokedexOpen(): boolean {
  return PokedexUI.getInstance().isVisible();
}
