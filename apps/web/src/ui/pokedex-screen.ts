import type { PokemonSpeciesData } from '@pokemon/shared-types';
import { filterPokemon } from './pokedex/pokedex-filter';
import { getPokedexEntries } from './pokedex/pokedex-data';
import { PokedexState } from './pokedex/pokedex-state';
import { MOVES_DB } from '../battle/moves-db';
import type { BattleMove } from '../battle/types';

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

  private currentTab: 'pokemon' | 'moves' | 'items' = 'pokemon';
  private allPokemon: PokemonSpeciesData[] = [];
  private filteredPokemon: PokemonSpeciesData[] = [];
  private selectedIndex = 0;
  private scrollOffset = 0;

  private allMoves: BattleMove[] = [];
  private filteredMoves: BattleMove[] = [];
  private selectedMoveIndex = 0;
  private movesScrollOffset = 0;

  private readonly visibleCount = 7;
  private viewMode: 'list' | 'info' = 'list';
  private infoSubTab: 'bio' | 'moves' = 'bio';
  private isOpen = false;
  private readonly state = new PokedexState();

  private constructor() {
    this.allPokemon = getPokedexEntries();
    this.filteredPokemon = [...this.allPokemon];
    this.allMoves = Object.values(MOVES_DB);
    this.filteredMoves = [...this.allMoves];
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
          <!-- Left Header Navigation Tabs (Pokémon, Chiêu thức, Vật phẩm) -->
          <div class="pokedex-header-nav-tabs" id="pokedexHeaderNavTabs">
            <button class="pokedex-nav-tab active" data-tab="pokemon" id="tabPokemon" title="Danh lục Pokémon">
              <img src="/Graphics/Pokedex/tab_pokemon.png" class="pokedex-tab-icon" alt="Pokémon" />
              <span class="pokedex-tab-label">Pokémon</span>
            </button>
            <button class="pokedex-nav-tab" data-tab="moves" id="tabMoves" title="Danh lục Chiêu thức">
              <img src="/Graphics/Pokedex/tab_moves.png" class="pokedex-tab-icon" alt="Chiêu thức" />
              <span class="pokedex-tab-label">Chiêu thức</span>
            </button>
            <button class="pokedex-nav-tab" data-tab="items" id="tabItems" title="Danh lục Vật phẩm">
              <img src="/Graphics/Pokedex/tab_items.png" class="pokedex-tab-icon" alt="Vật phẩm" />
              <span class="pokedex-tab-label">Vật phẩm</span>
            </button>
          </div>

          <!-- Integrated Search Bar in the top black header area -->
          <div class="pokedex-retro-search-bar" id="pokedexRetroSearchBar">
            <img src="/Graphics/Pokedex/icon_search_ball.png" class="pokedex-search-icon-img" alt="Tìm kiếm" />
            <input type="text" id="inputPokedexSearch" placeholder="Tìm tên hoặc số hiệu..." autocomplete="off" />
            <button class="btn-clear-search" id="btnClearSearch" title="Xóa tìm kiếm">✕</button>
          </div>

          <!-- Integrated Close Button in the top black header area -->
          <button class="pokedex-retro-close" id="btnPokedexRetroClose" title="Đóng Pokédex (Esc)">✕</button>
          <!-- Left Panels Container -->
          <div class="list-left-panel" id="panelPokemon">
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
            <div class="list-counters-box" id="listCountersBox">
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
          </div>

          <!-- Moves Left Panel (Display when Chiêu thức tab is active) -->
          <div class="list-left-panel" id="panelMoves" style="display: none;">
            <div class="list-left-header move-left-header" id="moveLeftHeader">
              <div class="move-header-name-group">
                <span class="move-header-title-vi" id="moveLeftTitleVi">Súng Phun Lửa</span>
                <span class="move-header-title-en" id="moveLeftTitleEn">Flamethrower</span>
              </div>
            </div>

            <div class="list-preview-box move-preview-box" id="movePreviewBox">
              <div class="move-disc-wrapper">
                <img id="moveMachineImg" class="move-machine-img" src="/Graphics/Move/item move/machine_FIRE.png" alt="TM Disc" />
              </div>
              <div class="move-badges-row">
                <div class="move-badge-col">
                  <div class="move-badge-scaled-wrapper">
                    <canvas id="moveTypeCanvas" class="list-type-badge"></canvas>
                  </div>
                </div>
                <div class="move-badge-col">
                  <div class="move-badge-scaled-wrapper">
                    <div id="moveCategoryBadge" class="move-category-badge special" title="Đặc biệt"></div>
                  </div>
                  <span class="move-category-label special" id="moveCategoryLabel">Đặc biệt</span>
                </div>
              </div>
              <div class="move-specs-grid">
                <div class="move-spec-pill">
                  <span class="spec-k">UY LỰC</span>
                  <strong class="spec-v" id="movePower">90</strong>
                </div>
                <div class="move-spec-pill">
                  <span class="spec-k">CHÍNH XÁC</span>
                  <strong class="spec-v" id="moveAccuracy">100%</strong>
                </div>
                <div class="move-spec-pill">
                  <span class="spec-k">ĐIỂM PP</span>
                  <strong class="spec-v" id="movePP">15/15</strong>
                </div>
              </div>
            </div>

            <div class="list-counters-box move-desc-box" id="moveDescBox">
              <div class="move-desc-title">HIỆU ỨNG CHIÊU THỨC</div>
              <div class="move-desc-content" id="moveDescContent">
                Bắn ra ngọn lửa dữ dội thiêu đốt mục tiêu.
              </div>
            </div>
          </div>

          <!-- Items Left Panel (Display when Vật phẩm tab is active) -->
          <div class="list-left-panel" id="panelItems" style="display: none;">
            <div class="list-left-header">
              <span class="list-header-title">Túi Đồ & Vật Phẩm</span>
            </div>
            <div class="list-preview-box items-preview-box">
              <img src="/Graphics/Pokedex/tab_items.png" class="items-big-icon" alt="Items" />
              <div class="items-empty-notice">Hệ thống danh mục Vật phẩm đang được đồng bộ dữ liệu.</div>
            </div>
            <div class="list-counters-box items-desc-box">
              <div class="items-desc-text">Bạn có thể chọn tab Pokémon hoặc Chiêu thức để tra cứu ngay!</div>
            </div>
          </div>

          <!-- Right: 7-Row List Items (x: 240..484, y: 58..366) -->
          <div class="list-items-container" id="listItemsContainer"></div>

          <!-- Right Scrollbar Slider (x: 478, y: 72..351, height: 279px) -->
          <div class="list-slider-track" id="listSliderTrack">
            <div class="list-slider-handle" id="listSliderHandle"></div>
          </div>
        </div>

        <!-- 2. Screen Info / Detail (bg_info.PNG - 512x384) -->
        <div class="pokedex-screen pokedex-screen-info" id="pokedexScreenInfo" style="display: none;">
          <!-- Top Tab Navigation Bar (advancedInfoBar.png - 512x32) -->
          <div class="info-top-bar">
            <button class="info-tab-btn" id="btnInfoBack">◀ Danh sách</button>
            <div class="info-mode-nav" id="infoModeNav">
              <button class="info-mode-tab active" id="btnInfoTabBio" data-tab="bio">Chỉ số & Sinh học</button>
              <button class="info-mode-tab" id="btnInfoTabMoves" data-tab="moves">Chiêu thức học được</button>
            </div>
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
            <!-- 1. Bio & Stats View -->
            <div class="info-bottom-split" id="infoTabContentBio">
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

            <!-- 2. Learnset Moves View -->
            <div class="info-moves-content" id="infoTabContentMoves" style="display: none;">
              <div class="info-moves-header-row">
                <span class="im-col-lvl">CẤP</span>
                <span class="im-col-name">CHIÊU THỨC</span>
                <span class="im-col-type">HỆ</span>
                <span class="im-col-cat">LOẠI</span>
                <span class="im-col-pwr">LỰC</span>
                <span class="im-col-acc">CX</span>
                <span class="im-col-pp">PP</span>
              </div>
              <div class="info-moves-list" id="infoMovesList"></div>
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
    backdrop.querySelector('#btnInfoTabBio')?.addEventListener('click', () => {
      this.switchInfoSubTab('bio');
    });
    backdrop.querySelector('#btnInfoTabMoves')?.addEventListener('click', () => {
      this.switchInfoSubTab('moves');
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
      if (this.currentTab === 'pokemon') {
        this.filterPokemon(searchInput.value);
      } else if (this.currentTab === 'moves') {
        this.filterMoves(searchInput.value);
      }
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      if (this.currentTab === 'pokemon') {
        this.filterPokemon('');
      } else if (this.currentTab === 'moves') {
        this.filterMoves('');
      }
      searchInput.focus();
    });

    // Navigation Tabs (Pokemon, Moves, Items)
    const navTabs = backdrop.querySelectorAll<HTMLButtonElement>('.pokedex-nav-tab');
    navTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabKey = tab.dataset.tab as 'pokemon' | 'moves' | 'items';
        if (tabKey) {
          this.switchTab(tabKey);
        }
      });
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
      if (this.currentTab === 'pokemon') {
        const maxScroll = Math.max(0, this.filteredPokemon.length - this.visibleCount);
        this.scrollOffset = Math.round(clickRatio * maxScroll);
        this.renderListItems();
      } else if (this.currentTab === 'moves') {
        const maxScroll = Math.max(0, this.filteredMoves.length - this.visibleCount);
        this.movesScrollOffset = Math.round(clickRatio * maxScroll);
        this.renderMoveListItems();
      }
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
          // Open info screen (only in pokemon tab)
          if (this.currentTab === 'pokemon' && this.filteredPokemon.length > 0) {
            this.viewMode = 'info';
            this.render();
          }
          e.preventDefault();
        }
      } else if (this.viewMode === 'info') {
        if (e.key === 'ArrowLeft') {
          this.navigatePokemon(-1);
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          this.navigatePokemon(1);
          e.preventDefault();
        } else if (e.key === 'Tab') {
          this.switchInfoSubTab(this.infoSubTab === 'bio' ? 'moves' : 'bio');
          e.preventDefault();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          if (this.infoSubTab === 'moves') {
            const listEl = this.rootModal?.querySelector<HTMLElement>('#infoMovesList');
            if (listEl) {
              listEl.scrollTop += e.key === 'ArrowUp' ? -26 : 26;
            }
          } else {
            this.navigatePokemon(e.key === 'ArrowUp' ? -1 : 1);
          }
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

  private switchTab(tab: 'pokemon' | 'moves' | 'items'): void {
    if (this.currentTab === tab) return;
    this.currentTab = tab;

    if (this.rootModal) {
      const navTabs = this.rootModal.querySelectorAll<HTMLButtonElement>('.pokedex-nav-tab');
      navTabs.forEach((t) => {
        if (t.dataset.tab === tab) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });

      const panelPokemon = this.rootModal.querySelector<HTMLElement>('#panelPokemon');
      const panelMoves = this.rootModal.querySelector<HTMLElement>('#panelMoves');
      const panelItems = this.rootModal.querySelector<HTMLElement>('#panelItems');
      const searchInput = this.rootModal.querySelector<HTMLInputElement>('#inputPokedexSearch');

      if (panelPokemon) panelPokemon.style.display = tab === 'pokemon' ? 'block' : 'none';
      if (panelMoves) panelMoves.style.display = tab === 'moves' ? 'block' : 'none';
      if (panelItems) panelItems.style.display = tab === 'items' ? 'block' : 'none';

      if (searchInput) {
        searchInput.value = '';
        if (tab === 'pokemon') {
          searchInput.placeholder = 'Tìm tên hoặc số hiệu...';
          this.filterPokemon('');
        } else if (tab === 'moves') {
          searchInput.placeholder = 'Tìm chiêu thức (VD: Lửa, Surf, Tackle)...';
          this.filterMoves('');
        } else {
          searchInput.placeholder = 'Tìm vật phẩm...';
        }
      }
    }

    if (tab === 'pokemon') {
      this.render();
    } else if (tab === 'moves') {
      this.selectedMoveIndex = 0;
      this.movesScrollOffset = 0;
      this.renderMovesList();
    } else {
      this.renderItemsList();
    }
  }

  private filterPokemon(query: string): void {
    this.state.query = query;
    this.filteredPokemon = filterPokemon(this.allPokemon, query);

    this.selectedIndex = 0;
    this.scrollOffset = 0;
    this.render();
  }

  private filterMoves(query: string): void {
    const q = query.trim().toLowerCase();
    if (!q) {
      this.filteredMoves = [...this.allMoves];
    } else {
      this.filteredMoves = this.allMoves.filter((m) => {
        const nameVi = (m.nameVi || '').toLowerCase();
        const nameEn = (m.nameEn || m.name || '').toLowerCase();
        const type = (m.type || '').toLowerCase();
        const cat = (m.category || '').toLowerCase();
        return nameVi.includes(q) || nameEn.includes(q) || type.includes(q) || cat.includes(q);
      });
    }
    this.selectedMoveIndex = 0;
    this.movesScrollOffset = 0;
    this.renderMovesList();
  }

  private scrollList(delta: number): void {
    if (this.currentTab === 'pokemon') {
      const maxScroll = Math.max(0, this.filteredPokemon.length - this.visibleCount);
      this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset + delta));
      this.renderListItems();
    } else if (this.currentTab === 'moves') {
      const maxScroll = Math.max(0, this.filteredMoves.length - this.visibleCount);
      this.movesScrollOffset = Math.max(0, Math.min(maxScroll, this.movesScrollOffset + delta));
      this.renderMoveListItems();
    }
  }

  private moveSelection(delta: number): void {
    if (this.currentTab === 'pokemon') {
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
    } else if (this.currentTab === 'moves') {
      if (this.filteredMoves.length === 0) return;
      const newIdx = Math.max(
        0,
        Math.min(this.filteredMoves.length - 1, this.selectedMoveIndex + delta)
      );
      if (newIdx !== this.selectedMoveIndex) {
        this.selectedMoveIndex = newIdx;
        this.ensureMoveSelectionVisible();
        this.renderMovesList();
      }
    }
  }

  private ensureSelectionVisible(): void {
    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex;
    } else if (this.selectedIndex >= this.scrollOffset + this.visibleCount) {
      this.scrollOffset = this.selectedIndex - this.visibleCount + 1;
    }
  }

  private ensureMoveSelectionVisible(): void {
    if (this.selectedMoveIndex < this.movesScrollOffset) {
      this.movesScrollOffset = this.selectedMoveIndex;
    } else if (this.selectedMoveIndex >= this.movesScrollOffset + this.visibleCount) {
      this.movesScrollOffset = this.selectedMoveIndex - this.visibleCount + 1;
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
      if (this.currentTab === 'pokemon') {
        this.renderList();
      } else if (this.currentTab === 'moves') {
        this.renderMovesList();
      } else {
        this.renderItemsList();
      }
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

  private renderMovesList(): void {
    if (!this.rootModal) return;
    const current = this.filteredMoves[this.selectedMoveIndex];

    const titleViEl = this.rootModal.querySelector<HTMLElement>('#moveLeftTitleVi');
    const titleEnEl = this.rootModal.querySelector<HTMLElement>('#moveLeftTitleEn');
    if (titleViEl) {
      if (current) {
        titleViEl.innerText = current.nameVi || current.nameEn || current.name;
        titleViEl.title = `${current.nameEn || current.name} (${current.type})`;
      } else {
        titleViEl.innerText = 'Không tìm thấy chiêu thức';
      }
    }
    if (titleEnEl) {
      if (current) {
        titleEnEl.innerText = current.nameEn || current.name;
      } else {
        titleEnEl.innerText = '';
      }
    }

    const machineImg = this.rootModal.querySelector<HTMLImageElement>('#moveMachineImg');
    if (machineImg && current) {
      machineImg.src = `/Graphics/Move/item move/machine_${current.type.toUpperCase()}.png`;
      machineImg.alt = `${current.type} TM`;
    }

    const moveTypeCanvas = this.rootModal.querySelector<HTMLCanvasElement>('#moveTypeCanvas');
    if (moveTypeCanvas && current) {
      const typeIdx = TYPE_INDICES[current.type] ?? 0;
      TypeBadgeRenderer.renderBadge(moveTypeCanvas, typeIdx);
    }

    const moveCatBadge = this.rootModal.querySelector<HTMLElement>('#moveCategoryBadge');
    const moveCatLabel = this.rootModal.querySelector<HTMLElement>('#moveCategoryLabel');
    if (moveCatBadge && current) {
      const catKey = (current.category || 'physical').toLowerCase();
      moveCatBadge.className = `move-category-badge ${catKey}`;
      const catNames: Record<string, string> = {
        physical: 'Vật lí',
        special: 'Đặc biệt',
        status: 'Trạng thái',
      };
      const labelText = catNames[catKey] ?? 'Vật lí';
      moveCatBadge.title = labelText;
      if (moveCatLabel) {
        moveCatLabel.className = `move-category-label ${catKey}`;
        moveCatLabel.innerText = labelText;
      }
    }

    const movePower = this.rootModal.querySelector<HTMLElement>('#movePower');
    if (movePower) {
      movePower.innerText = current ? (current.power > 0 ? String(current.power) : '—') : '—';
    }

    const moveAccuracy = this.rootModal.querySelector<HTMLElement>('#moveAccuracy');
    if (moveAccuracy) {
      moveAccuracy.innerText = current
        ? current.accuracy > 0
          ? `${current.accuracy}%`
          : '—'
        : '—';
    }

    const movePP = this.rootModal.querySelector<HTMLElement>('#movePP');
    if (movePP) {
      movePP.innerText = current ? `${current.pp}/${current.maxPp || current.pp}` : '—';
    }

    const moveDesc = this.rootModal.querySelector<HTMLElement>('#moveDescContent');
    if (moveDesc) {
      moveDesc.innerText = current
        ? current.description || current.descriptionEn || 'Không có mô tả cho chiêu thức này.'
        : 'Không tìm thấy chiêu thức nào phù hợp.';
    }

    this.renderMoveListItems();
  }

  private renderMoveListItems(): void {
    if (!this.rootModal) return;
    const container = this.rootModal.querySelector<HTMLElement>('#listItemsContainer');
    if (!container) return;

    container.innerHTML = '';
    const visibleItems = this.filteredMoves.slice(
      this.movesScrollOffset,
      this.movesScrollOffset + this.visibleCount
    );

    visibleItems.forEach((move, idx) => {
      const realIndex = this.movesScrollOffset + idx;
      const isSelected = realIndex === this.selectedMoveIndex;

      const itemEl = document.createElement('div');
      itemEl.className = `pokedex-list-row move-list-row ${isSelected ? 'selected' : ''}`;
      itemEl.dataset.index = String(realIndex);

      const discImg = document.createElement('img');
      discImg.className = 'move-row-disc';
      discImg.src = `/Graphics/Move/item move/machine_${move.type.toUpperCase()}.png`;
      discImg.alt = move.type;

      const nameGroup = document.createElement('div');
      nameGroup.className = 'move-row-name-group';

      const nameVi = document.createElement('span');
      nameVi.className = 'move-row-name-vi';
      nameVi.innerText = move.nameVi || move.nameEn || move.name;

      const nameEn = document.createElement('span');
      nameEn.className = 'move-row-name-en';
      nameEn.innerText = move.nameEn || move.name;

      nameGroup.appendChild(nameVi);
      nameGroup.appendChild(nameEn);

      const badgeCanvas = document.createElement('canvas');
      badgeCanvas.className = 'list-type-badge move-row-type-badge';
      const typeIdx = TYPE_INDICES[move.type] ?? 0;
      TypeBadgeRenderer.renderBadge(badgeCanvas, typeIdx);

      const statsEl = document.createElement('div');
      statsEl.className = 'move-row-stats';
      const pwrStr = move.power > 0 ? String(move.power) : '—';
      statsEl.innerHTML = `<span>PWR ${pwrStr}</span><span>PP ${move.pp}</span>`;

      itemEl.appendChild(discImg);
      itemEl.appendChild(nameGroup);
      itemEl.appendChild(badgeCanvas);
      itemEl.appendChild(statsEl);

      itemEl.addEventListener('click', () => {
        this.selectedMoveIndex = realIndex;
        this.renderMovesList();
      });

      container.appendChild(itemEl);
    });

    // Update slider handle position
    const handle = this.rootModal.querySelector<HTMLElement>('#listSliderHandle');
    if (handle) {
      const maxScroll = Math.max(1, this.filteredMoves.length - this.visibleCount);
      const ratio = Math.max(0, Math.min(1, this.movesScrollOffset / maxScroll));
      const trackHeight = 279;
      const handleHeight = 30;
      const topPx = ratio * (trackHeight - handleHeight);
      handle.style.top = `${topPx}px`;
    }
  }

  private renderItemsList(): void {
    if (!this.rootModal) return;
    const container = this.rootModal.querySelector<HTMLElement>('#listItemsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="items-list-notice">
        <img src="/Graphics/Pokedex/tab_items.png" class="items-notice-icon" alt="Items" />
        <span class="items-notice-text">Danh mục Vật phẩm đang được đồng bộ dữ liệu</span>
        <span class="items-notice-sub">Vui lòng chọn tab Pokémon hoặc Chiêu thức để tra cứu</span>
      </div>
    `;

    const handle = this.rootModal.querySelector<HTMLElement>('#listSliderHandle');
    if (handle) {
      handle.style.top = '0px';
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

    // Render level-up moves for this Pokémon and apply current active sub tab
    this.renderInfoMoves(current);
    this.switchInfoSubTab(this.infoSubTab);
  }

  private switchInfoSubTab(subTab: 'bio' | 'moves'): void {
    this.infoSubTab = subTab;
    if (!this.rootModal) return;
    const btnBio = this.rootModal.querySelector('#btnInfoTabBio');
    const btnMoves = this.rootModal.querySelector('#btnInfoTabMoves');
    const contentBio = this.rootModal.querySelector<HTMLElement>('#infoTabContentBio');
    const contentMoves = this.rootModal.querySelector<HTMLElement>('#infoTabContentMoves');

    if (btnBio) btnBio.classList.toggle('active', subTab === 'bio');
    if (btnMoves) btnMoves.classList.toggle('active', subTab === 'moves');
    if (contentBio) contentBio.style.display = subTab === 'bio' ? 'flex' : 'none';
    if (contentMoves) contentMoves.style.display = subTab === 'moves' ? 'flex' : 'none';
  }

  private renderInfoMoves(pokemon: PokemonSpeciesData): void {
    if (!this.rootModal) return;
    const container = this.rootModal.querySelector<HTMLElement>('#infoMovesList');
    if (!container) return;

    container.innerHTML = '';
    const moves = pokemon.moves || [];
    if (moves.length === 0) {
      container.innerHTML =
        '<div class="info-moves-empty">Chưa có dữ liệu chiêu thức theo cấp cho Pokémon này.</div>';
      return;
    }

    moves.forEach((m) => {
      const moveDb = MOVES_DB[m.moveId];
      const row = document.createElement('div');
      row.className = 'info-move-row';
      const desc =
        moveDb?.description || moveDb?.descriptionEn || 'Không có mô tả cho chiêu thức này.';
      row.title = `${m.nameVi} (${m.nameEn}) - Cấp độ: ${m.level}\n${desc}`;

      const lvlEl = document.createElement('span');
      lvlEl.className = 'im-col-lvl';
      lvlEl.innerText = m.level === 1 ? 'Lv. 1' : `Lv. ${m.level}`;

      const nameGroup = document.createElement('div');
      nameGroup.className = 'im-col-name';

      const nameVi = document.createElement('span');
      nameVi.className = 'info-move-name-vi';
      nameVi.innerText = m.nameVi || m.nameEn;

      const nameEn = document.createElement('span');
      nameEn.className = 'info-move-name-en';
      nameEn.innerText = m.nameEn;

      nameGroup.appendChild(nameVi);
      nameGroup.appendChild(nameEn);

      const typeCol = document.createElement('div');
      typeCol.className = 'im-col-type';
      const badgeCanvas = document.createElement('canvas');
      badgeCanvas.className = 'info-move-type-badge';
      const typeIdx = TYPE_INDICES[m.type] ?? 0;
      TypeBadgeRenderer.renderBadge(badgeCanvas, typeIdx);
      typeCol.appendChild(badgeCanvas);

      const catCol = document.createElement('div');
      catCol.className = 'im-col-cat';
      const catKey = (moveDb?.category || 'physical').toLowerCase();
      const catNames: Record<string, string> = {
        physical: 'Vật lí',
        special: 'Đặc biệt',
        status: 'Trạng thái',
      };
      const catTitle = catNames[catKey] || 'Vật lí';
      catCol.innerHTML = `<div class="info-move-cat-icon ${catKey}" title="${catTitle}"></div>`;

      const pwrCol = document.createElement('span');
      pwrCol.className = 'im-col-pwr';
      pwrCol.innerText = moveDb && moveDb.power > 0 ? String(moveDb.power) : '—';

      const accCol = document.createElement('span');
      accCol.className = 'im-col-acc';
      accCol.innerText = moveDb && moveDb.accuracy > 0 ? `${moveDb.accuracy}%` : '—';

      const ppCol = document.createElement('span');
      ppCol.className = 'im-col-pp';
      ppCol.innerText = moveDb ? String(moveDb.pp) : '—';

      row.appendChild(lvlEl);
      row.appendChild(nameGroup);
      row.appendChild(typeCol);
      row.appendChild(catCol);
      row.appendChild(pwrCol);
      row.appendChild(accCol);
      row.appendChild(ppCol);

      container.appendChild(row);
    });
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
