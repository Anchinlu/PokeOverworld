import type { PokemonSpeciesData } from '@pokemon/shared-types';
import type { BattleMove } from '../../battle/types';
import { MOVES_DB } from '../../battle/moves-db';
import { getAllItems, type ItemData } from '../../data/items-db';
import { getPokedexEntries } from './pokedex-data';
import { filterPokemon } from './pokedex-filter';
import { filterMoves } from './pokedex-moves';
import { filterItems } from './pokedex-items';
import { PokemonSpriteAnimator } from './pokedex-sprite';
import { PokedexState, type PokedexInfoSubTab, type PokedexTab } from './pokedex-state';
import { PokedexView } from './pokedex-view';
import { pokemonCryPlayer } from './pokemon-cry';

export class PokedexController {
  public readonly state = new PokedexState();
  public readonly view = new PokedexView();

  private listAnimator: PokemonSpriteAnimator | null = null;
  private infoAnimator: PokemonSpriteAnimator | null = null;

  public allPokemon: PokemonSpeciesData[] = [];
  public filteredPokemon: PokemonSpeciesData[] = [];

  public allMoves: BattleMove[] = [];
  public filteredMoves: BattleMove[] = [];

  public allItems: ItemData[] = [];
  public filteredItems: ItemData[] = [];

  private isInitialized = false;

  constructor() {
    this.allPokemon = getPokedexEntries();
    this.filteredPokemon = [...this.allPokemon];

    this.allMoves = Object.values(MOVES_DB);
    this.filteredMoves = [...this.allMoves];

    this.allItems = getAllItems();
    this.filteredItems = [...this.allItems];
  }

  public init(): void {
    if (this.isInitialized) return;

    const els = this.view.init();

    // Sprite Animators
    this.listAnimator = new PokemonSpriteAnimator(els.canvasListSprite);
    this.infoAnimator = new PokemonSpriteAnimator(els.canvasInfoSprite, {
      fixedWidth: 170,
      fixedHeight: 145,
      groundY: 128,
    });

    // Close & Back Events
    els.btnClose.addEventListener('click', () => this.close());
    els.btnInfoClose.addEventListener('click', () => this.close());
    els.btnInfoBack.addEventListener('click', () => {
      this.state.viewMode = 'list';
      this.render();
    });

    // Info Sub Tabs
    els.btnInfoTabBio.addEventListener('click', () => this.switchInfoSubTab('bio'));
    els.btnInfoTabMoves.addEventListener('click', () => this.switchInfoSubTab('moves'));

    // Open detail from preview box
    els.listPreviewBox.addEventListener('click', () => {
      if (this.state.currentTab === 'pokemon' && this.filteredPokemon.length > 0) {
        const current = this.filteredPokemon[this.state.selectedIndex];
        if (current?.sprites?.cry) {
          pokemonCryPlayer.play(current.sprites.cry);
        }
        this.state.viewMode = 'info';
        this.render();
      }
    });

    // Search Input
    els.searchInput.addEventListener('input', () => {
      const q = els.searchInput.value;
      if (this.state.currentTab === 'pokemon') {
        this.filterPokemonList(q);
      } else if (this.state.currentTab === 'moves') {
        this.filterMovesList(q);
      } else if (this.state.currentTab === 'items') {
        this.filterItemsList(q);
      }
    });

    els.clearSearchBtn.addEventListener('click', () => {
      els.searchInput.value = '';
      if (this.state.currentTab === 'pokemon') {
        this.filterPokemonList('');
      } else if (this.state.currentTab === 'moves') {
        this.filterMovesList('');
      } else if (this.state.currentTab === 'items') {
        this.filterItemsList('');
      }
      els.searchInput.focus();
    });

    // Nav Tabs (Pokemon, Moves, Items)
    const navTabs = els.rootModal.querySelectorAll<HTMLButtonElement>('.pokedex-nav-tab');
    navTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabKey = tab.dataset.tab as PokedexTab;
        if (tabKey) {
          this.switchTab(tabKey);
        }
      });
    });

    // Mouse wheel on list
    els.listItemsContainer.addEventListener(
      'wheel',
      (e: Event) => {
        const wheelEv = e as WheelEvent;
        wheelEv.preventDefault();
        const delta = Math.sign(wheelEv.deltaY);
        this.scrollList(delta);
      },
      { passive: false }
    );

    // Slider track click
    els.listSliderTrack.addEventListener('click', (e: Event) => {
      const mouseEv = e as MouseEvent;
      const rect = els.listSliderTrack.getBoundingClientRect();
      const clickRatio = Math.max(0, Math.min(1, (mouseEv.clientY - rect.top) / rect.height));

      if (this.state.currentTab === 'pokemon') {
        const maxScroll = Math.max(0, this.filteredPokemon.length - this.state.visibleCount);
        this.state.scrollOffset = Math.round(clickRatio * maxScroll);
        this.renderPokemonList();
      } else if (this.state.currentTab === 'moves') {
        const maxScroll = Math.max(0, this.filteredMoves.length - this.state.visibleCount);
        this.state.movesScrollOffset = Math.round(clickRatio * maxScroll);
        this.renderMoveList();
      } else if (this.state.currentTab === 'items') {
        const maxScroll = Math.max(0, this.filteredItems.length - this.state.visibleCount);
        this.state.itemsScrollOffset = Math.round(clickRatio * maxScroll);
        this.renderItemList();
      }
    });

    // Global Key Listener
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Responsive resize
    window.addEventListener('resize', () => {
      if (this.state.isOpen) {
        this.view.updateResponsiveScale();
      }
    });

    this.isInitialized = true;
  }

  public open(initialPokemonId?: number): void {
    this.init();
    this.state.isOpen = true;
    this.state.viewMode = 'list';

    if (initialPokemonId) {
      const idx = this.filteredPokemon.findIndex((p) => p.id === initialPokemonId);
      if (idx >= 0) {
        this.state.selectedIndex = idx;
        this.ensureSelectionVisible();
      }
    }

    this.view.show();
    this.render();
  }

  public close(): void {
    this.state.isOpen = false;
    this.view.hide();
    this.listAnimator?.stop();
    this.infoAnimator?.stop();
  }

  public toggle(): void {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public isVisible(): boolean {
    return this.state.isOpen;
  }

  public switchTab(tab: PokedexTab): void {
    if (this.state.currentTab === tab) return;
    this.state.currentTab = tab;

    this.view.setTab(tab);
    if (this.view.elements?.searchInput) {
      this.view.elements.searchInput.value = '';
    }

    if (tab === 'pokemon') {
      this.filterPokemonList('');
    } else if (tab === 'moves') {
      this.state.selectedMoveIndex = 0;
      this.state.movesScrollOffset = 0;
      this.filterMovesList('');
    } else {
      this.state.selectedItemIndex = 0;
      this.state.itemsScrollOffset = 0;
      this.filterItemsList('');
    }

    this.render();
  }

  public switchInfoSubTab(subTab: PokedexInfoSubTab): void {
    this.state.infoSubTab = subTab;
    this.view.setInfoSubTab(subTab);
  }

  public filterPokemonList(query: string): void {
    this.state.query = query;
    this.filteredPokemon = filterPokemon(this.allPokemon, query);
    this.state.selectedIndex = 0;
    this.state.scrollOffset = 0;
    this.render();
  }

  public filterMovesList(query: string): void {
    this.filteredMoves = filterMoves(this.allMoves, query);
    this.state.selectedMoveIndex = 0;
    this.state.movesScrollOffset = 0;
    this.render();
  }

  public filterItemsList(query: string): void {
    this.filteredItems = filterItems(this.allItems, query);
    this.state.selectedItemIndex = 0;
    this.state.itemsScrollOffset = 0;
    this.render();
  }

  public scrollList(delta: number): void {
    if (this.state.currentTab === 'pokemon') {
      const maxScroll = Math.max(0, this.filteredPokemon.length - this.state.visibleCount);
      this.state.scrollOffset = Math.max(0, Math.min(maxScroll, this.state.scrollOffset + delta));
      this.renderPokemonList();
    } else if (this.state.currentTab === 'moves') {
      const maxScroll = Math.max(0, this.filteredMoves.length - this.state.visibleCount);
      this.state.movesScrollOffset = Math.max(
        0,
        Math.min(maxScroll, this.state.movesScrollOffset + delta)
      );
      this.renderMoveList();
    } else if (this.state.currentTab === 'items') {
      const maxScroll = Math.max(0, this.filteredItems.length - this.state.visibleCount);
      this.state.itemsScrollOffset = Math.max(
        0,
        Math.min(maxScroll, this.state.itemsScrollOffset + delta)
      );
      this.renderItemList();
    }
  }

  public moveSelection(delta: number): void {
    if (this.state.currentTab === 'pokemon') {
      if (this.filteredPokemon.length === 0) return;
      const newIdx = Math.max(
        0,
        Math.min(this.filteredPokemon.length - 1, this.state.selectedIndex + delta)
      );
      if (newIdx !== this.state.selectedIndex) {
        this.state.selectedIndex = newIdx;
        this.ensureSelectionVisible();
        this.render();
      }
    } else if (this.state.currentTab === 'moves') {
      if (this.filteredMoves.length === 0) return;
      const newIdx = Math.max(
        0,
        Math.min(this.filteredMoves.length - 1, this.state.selectedMoveIndex + delta)
      );
      if (newIdx !== this.state.selectedMoveIndex) {
        this.state.selectedMoveIndex = newIdx;
        this.ensureMoveSelectionVisible();
        this.render();
      }
    } else if (this.state.currentTab === 'items') {
      if (this.filteredItems.length === 0) return;
      const newIdx = Math.max(
        0,
        Math.min(this.filteredItems.length - 1, this.state.selectedItemIndex + delta)
      );
      if (newIdx !== this.state.selectedItemIndex) {
        this.state.selectedItemIndex = newIdx;
        this.ensureItemSelectionVisible();
        this.render();
      }
    }
  }

  public navigatePokemon(delta: number): void {
    if (this.filteredPokemon.length === 0) return;
    this.state.selectedIndex =
      (this.state.selectedIndex + delta + this.filteredPokemon.length) %
      this.filteredPokemon.length;

    // Don't play cry when navigating - can be jarring
    // User can click sprite to play if they want

    this.ensureSelectionVisible();
    this.render();
  }

  private ensureSelectionVisible(): void {
    if (this.state.selectedIndex < this.state.scrollOffset) {
      this.state.scrollOffset = this.state.selectedIndex;
    } else if (this.state.selectedIndex >= this.state.scrollOffset + this.state.visibleCount) {
      this.state.scrollOffset = this.state.selectedIndex - this.state.visibleCount + 1;
    }
  }

  private ensureMoveSelectionVisible(): void {
    if (this.state.selectedMoveIndex < this.state.movesScrollOffset) {
      this.state.movesScrollOffset = this.state.selectedMoveIndex;
    } else if (
      this.state.selectedMoveIndex >=
      this.state.movesScrollOffset + this.state.visibleCount
    ) {
      this.state.movesScrollOffset = this.state.selectedMoveIndex - this.state.visibleCount + 1;
    }
  }

  private ensureItemSelectionVisible(): void {
    if (this.state.selectedItemIndex < this.state.itemsScrollOffset) {
      this.state.itemsScrollOffset = this.state.selectedItemIndex;
    } else if (
      this.state.selectedItemIndex >=
      this.state.itemsScrollOffset + this.state.visibleCount
    ) {
      this.state.itemsScrollOffset = this.state.selectedItemIndex - this.state.visibleCount + 1;
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.state.isOpen) return;

    if (e.key === 'Escape') {
      if (this.state.viewMode === 'info') {
        this.state.viewMode = 'list';
        this.render();
      } else {
        this.close();
      }
      e.preventDefault();
      return;
    }

    if (this.state.viewMode === 'list') {
      if (e.key === 'ArrowUp') {
        this.moveSelection(-1);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        this.moveSelection(1);
        e.preventDefault();
      } else if (e.key === 'PageUp') {
        this.moveSelection(-this.state.visibleCount);
        e.preventDefault();
      } else if (e.key === 'PageDown') {
        this.moveSelection(this.state.visibleCount);
        e.preventDefault();
      } else if (e.key === 'Enter' || e.code === 'Space') {
        if (this.state.currentTab === 'pokemon' && this.filteredPokemon.length > 0) {
          this.state.viewMode = 'info';
          this.render();
        }
        e.preventDefault();
      }
    } else if (this.state.viewMode === 'info') {
      if (e.key === 'ArrowLeft') {
        this.navigatePokemon(-1);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        this.navigatePokemon(1);
        e.preventDefault();
      } else if (e.key === 'Tab') {
        this.switchInfoSubTab(this.state.infoSubTab === 'bio' ? 'moves' : 'bio');
        e.preventDefault();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (this.state.infoSubTab === 'moves') {
          const listEl = this.view.elements?.infoMovesList;
          if (listEl) {
            listEl.scrollTop += e.key === 'ArrowUp' ? -26 : 26;
          }
        } else {
          this.navigatePokemon(e.key === 'ArrowUp' ? -1 : 1);
        }
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        this.state.viewMode = 'list';
        this.render();
        e.preventDefault();
      }
    }
  }

  public render(): void {
    if (!this.state.isOpen) return;

    this.view.setViewMode(this.state.viewMode);

    if (this.state.viewMode === 'list') {
      this.infoAnimator?.stop();
      if (this.state.currentTab === 'pokemon') {
        this.renderPokemonPreview();
        this.renderPokemonList();
      } else if (this.state.currentTab === 'moves') {
        this.listAnimator?.stop();
        this.renderMovePreview();
        this.renderMoveList();
      } else {
        this.listAnimator?.stop();
        this.renderItemPreview();
        this.renderItemList();
      }
    } else {
      this.listAnimator?.stop();
      this.renderPokemonInfo();
    }
  }

  private renderPokemonPreview(): void {
    const current = this.filteredPokemon[this.state.selectedIndex];
    this.view.renderPokemonPreview(current, this.allPokemon.length);

    if (current && current.sprites.front) {
      this.listAnimator?.load(`/${current.sprites.front}`);
    }
  }

  private renderPokemonList(): void {
    this.view.renderPokemonList(
      this.filteredPokemon,
      this.state.selectedIndex,
      this.state.scrollOffset,
      this.state.visibleCount,
      (idx) => {
        this.state.selectedIndex = idx;
        // Play cry when selecting Pokemon from list (single click)
        const current = this.filteredPokemon[idx];
        if (current?.sprites?.cry) {
          pokemonCryPlayer.play(current.sprites.cry);
        }
        this.render();
      },
      (idx) => {
        this.state.selectedIndex = idx;
        const current = this.filteredPokemon[idx];
        if (current?.sprites?.cry) {
          pokemonCryPlayer.play(current.sprites.cry);
        }
        this.state.viewMode = 'info';
        this.render();
      }
    );
  }

  private renderMovePreview(): void {
    const current = this.filteredMoves[this.state.selectedMoveIndex];
    this.view.renderMovePreview(current);
  }

  private renderMoveList(): void {
    this.view.renderMoveList(
      this.filteredMoves,
      this.state.selectedMoveIndex,
      this.state.movesScrollOffset,
      this.state.visibleCount,
      (idx) => {
        this.state.selectedMoveIndex = idx;
        this.render();
      }
    );
  }

  private renderItemPreview(): void {
    const current = this.filteredItems[this.state.selectedItemIndex];
    this.view.renderItemPreview(current);
  }

  private renderItemList(): void {
    this.view.renderItemList(
      this.filteredItems,
      this.state.selectedItemIndex,
      this.state.itemsScrollOffset,
      this.state.visibleCount,
      (idx) => {
        this.state.selectedItemIndex = idx;
        this.render();
      }
    );
  }

  private renderPokemonInfo(): void {
    const current = this.filteredPokemon[this.state.selectedIndex];
    if (!current) return;

    this.view.renderPokemonInfo(current, this.allPokemon, (pokemonId) => {
      let targetIdx = this.filteredPokemon.findIndex((p) => p.id === pokemonId);
      if (targetIdx === -1) {
        this.filteredPokemon = [...this.allPokemon];
        targetIdx = this.filteredPokemon.findIndex((p) => p.id === pokemonId);
      }
      if (targetIdx >= 0) {
        this.state.selectedIndex = targetIdx;
        this.render();
      }
    });

    if (current.sprites.front) {
      this.infoAnimator?.load(`/${current.sprites.front}`);
    }

    // Add click listener to sprite box and canvas to play cry
    const canvas = this.view.elements?.canvasInfoSprite;
    const spriteBox = canvas?.parentElement;
    const targetElement = spriteBox || canvas;

    if (targetElement && current.sprites.cry) {
      targetElement.style.cursor = 'pointer';
      targetElement.title = `Nhấn để nghe tiếng kêu của ${current.name} (Cry)`;
      targetElement.onclick = (e) => {
        e.stopPropagation();
        pokemonCryPlayer.play(current.sprites.cry);
      };
    }

    this.view.setInfoSubTab(this.state.infoSubTab);
  }
}
