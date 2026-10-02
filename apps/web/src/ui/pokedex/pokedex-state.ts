export type PokedexViewMode = 'list' | 'info';

export class PokedexState {
  public isOpen = false;
  public selectedIndex = 0;
  public scrollOffset = 0;
  public viewMode: PokedexViewMode = 'list';
  public query = '';
}
