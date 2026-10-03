export type PokedexViewMode = 'list' | 'info';
export type PokedexTab = 'pokemon' | 'moves' | 'items';
export type PokedexInfoSubTab = 'bio' | 'moves';

export class PokedexState {
  public isOpen = false;
  public currentTab: PokedexTab = 'pokemon';
  public viewMode: PokedexViewMode = 'list';
  public infoSubTab: PokedexInfoSubTab = 'bio';
  public query = '';

  public selectedIndex = 0;
  public scrollOffset = 0;

  public selectedMoveIndex = 0;
  public movesScrollOffset = 0;

  public selectedItemIndex = 0;
  public itemsScrollOffset = 0;

  public readonly visibleCount = 7;
}
