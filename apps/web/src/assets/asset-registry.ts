/**
 * Centralized Asset Registry & Resolvers
 * Connects typed manifest keys with AssetLoader.
 * Eliminates direct path dependencies by routing all asset requests through Manifest resolution.
 */

import { AssetLoader } from '../rendering/asset-loader';

export type ManifestAssetKey =
  | 'pokedex_tab_pokemon'
  | 'pokedex_tab_moves'
  | 'pokedex_tab_items'
  | 'pokedex_icon_search'
  | 'pokedex_icon_own'
  | 'pokedex_icon_seen'
  | 'pokedex_icon_hw'
  | 'pokedex_icon_evo_arrow'
  | 'pokedex_icon_evo_pointer'
  | 'pokedex_bg_list'
  | 'pokedex_bg_info'
  | 'pokedex_overlay_info'
  | 'pokedex_cursor_tab'
  | 'pokedex_cursor_list'
  | 'pokedex_cursor_list_row'
  | 'pokedex_icon_slider'
  | 'move_category'
  | 'pokemon_type_badges'
  | 'battle_databox_player'
  | 'battle_databox_enemy'
  | 'battle_message'
  | 'battle_fight_overlay'
  | 'battle_cursor_command'
  | 'battle_overlay_exp'
  | 'battle_ball'
  | 'menu_bar_blank'
  | 'menu_icon_pokedex'
  | 'menu_icon_trainer'
  | 'menu_icon_options'
  | 'menu_icon_quit'
  | (string & {});

/**
 * Resolves an asset URL by its registered manifest key.
 * Queries AssetLoader's manifest cache first; if not yet loaded, falls back to default path.
 */
export function resolveAsset(key: ManifestAssetKey, fallbackPath: string): string {
  const loader = AssetLoader.getDefault();
  const url = loader.getAssetUrl(key);
  return url ?? fallbackPath;
}

export const POKEDEX_ASSETS = {
  get tabPokemon(): string {
    return resolveAsset('pokedex_tab_pokemon', '/Graphics/Pokedex/tab_pokemon.png');
  },
  get tabMoves(): string {
    return resolveAsset('pokedex_tab_moves', '/Graphics/Pokedex/tab_moves.png');
  },
  get tabItems(): string {
    return resolveAsset('pokedex_tab_items', '/Graphics/Pokedex/tab_items.png');
  },
  get searchIcon(): string {
    return resolveAsset('pokedex_icon_search', '/Graphics/Pokedex/icon_search_ball.png');
  },
  get iconOwn(): string {
    return resolveAsset('pokedex_icon_own', '/Graphics/Pokedex/icon_own.png');
  },
  get iconSeen(): string {
    return resolveAsset('pokedex_icon_seen', '/Graphics/Pokedex/icon_seen.png');
  },
  get iconHw(): string {
    return resolveAsset('pokedex_icon_hw', '/Graphics/Pokedex/icon_hw.png');
  },
  get iconEvoArrow(): string {
    return resolveAsset('pokedex_icon_evo_arrow', '/Graphics/Pokedex/icon_evo_arrow.png');
  },
  get iconEvoPointer(): string {
    return resolveAsset('pokedex_icon_evo_pointer', '/Graphics/Pokedex/icon_evo_pointer.png');
  },
  get bgList(): string {
    return resolveAsset('pokedex_bg_list', '/Graphics/Pokedex/bg_list.png');
  },
  get bgInfo(): string {
    return resolveAsset('pokedex_bg_info', '/Graphics/Pokedex/bg_info.png');
  },
  get overlayInfo(): string {
    return resolveAsset('pokedex_overlay_info', '/Graphics/Pokedex/overlay_info.png');
  },
  get cursorTab(): string {
    return resolveAsset('pokedex_cursor_tab', '/Graphics/Pokedex/cursor_tab.png');
  },
  get cursorList(): string {
    return resolveAsset('pokedex_cursor_list', '/Graphics/Pokedex/cursor_list.png');
  },
  get cursorListRow(): string {
    return resolveAsset('pokedex_cursor_list_row', '/Graphics/Pokedex/cursor_list_row.png');
  },
  get iconSlider(): string {
    return resolveAsset('pokedex_icon_slider', '/Graphics/Pokedex/icon_slider.png');
  },
} as const;

export const MOVE_ASSETS = {
  get categoryIcon(): string {
    return resolveAsset('move_category', '/Graphics/Move/status move/category.png');
  },
  getMachineDisc: (type: string): string => {
    const key = `move_machine_${type.toUpperCase()}`;
    return resolveAsset(key, `/Graphics/Move/item move/machine_${type.toUpperCase()}.png`);
  },
  getMachineHmDisc: (type: string): string => {
    const key = `move_machine_hm_${type.toUpperCase()}`;
    return resolveAsset(key, `/Graphics/Move/item move/machine_hm_${type.toUpperCase()}.png`);
  },
  getMachineTrDisc: (type: string): string => {
    const key = `move_machine_tr_${type.toUpperCase()}`;
    return resolveAsset(key, `/Graphics/Move/item move/machine_tr_${type.toUpperCase()}.png`);
  },
} as const;

export const POKEMON_ASSETS = {
  get typeBadgesSheet(): string {
    return resolveAsset(
      'pokemon_type_badges',
      '/Graphics/Pokemon/Icons%20type/types.png?v=newtype'
    );
  },
  getFrontSprite: (speciesKey: string): string => {
    return resolveAsset(`pokemon_front_${speciesKey}`, `/Graphics/Pokemon/Front/${speciesKey}.png`);
  },
  getBackSprite: (speciesKey: string): string => {
    return resolveAsset(`pokemon_back_${speciesKey}`, `/Graphics/Pokemon/Back/${speciesKey}.png`);
  },
  getIconSprite: (speciesKey: string): string => {
    return resolveAsset(`pokemon_icon_${speciesKey}`, `/Graphics/Pokemon/Icons/${speciesKey}.png`);
  },
} as const;

export const BATTLE_ASSETS = {
  get databoxEnemy(): string {
    return resolveAsset('battle_databox_enemy', '/Graphics/Battle/databox_enermy.png');
  },
  get databoxPlayer(): string {
    return resolveAsset('battle_databox_player', '/Graphics/Battle/databox_player.png');
  },
  get messageBox(): string {
    return resolveAsset('battle_message', '/Graphics/Battle/battleMessage.png');
  },
  get fightOverlay(): string {
    return resolveAsset('battle_fight_overlay', '/Graphics/Battle/overlay_fight.png');
  },
  get cursorCommand(): string {
    return resolveAsset('battle_cursor_command', '/Graphics/Battle/cursor_command.png');
  },
  get overlayExp(): string {
    return resolveAsset('battle_overlay_exp', '/Graphics/Battle/overlay_exp.png');
  },
  get ball(): string {
    return resolveAsset('battle_ball', '/Graphics/Battle/ball00.png');
  },
  getBackground: (bg: string): string => {
    return resolveAsset(`battle_bg_${bg}`, `/Graphics/Battle/battlebg/${bg}`);
  },
  getEnemyBase: (base: string): string => {
    return resolveAsset(`battle_enemy_base_${base}`, `/Graphics/Battle/enemybase/${base}`);
  },
  getPlayerBase: (base: string): string => {
    return resolveAsset(`battle_player_base_${base}`, `/Graphics/Battle/playerbase/${base}`);
  },
} as const;

export const MENU_ASSETS = {
  get barBlank(): string {
    return resolveAsset('menu_bar_blank', '/Graphics/Icons/Blank.png');
  },
  get menuPokedex(): string {
    return resolveAsset('menu_icon_pokedex', '/Graphics/Icons/menuPokedex.png');
  },
  get menuTrainer(): string {
    return resolveAsset('menu_icon_trainer', '/Graphics/Icons/menuTrainer.png');
  },
  get menuOptions(): string {
    return resolveAsset('menu_icon_options', '/Graphics/Icons/menuOptions.png');
  },
  get menuQuit(): string {
    return resolveAsset('menu_icon_quit', '/Graphics/Icons/menuQuit.png');
  },
} as const;

export const HABITAT_ASSETS = {
  getHabitatBg: (bgFile: string): string => {
    return resolveAsset(
      `habitat_bg_${bgFile}`,
      `/Graphics/Pokedex/backgound%20type/backgound%20type%20m/${bgFile}`
    );
  },
  getHabitatBase: (baseFile: string): string => {
    return resolveAsset(
      `habitat_base_${baseFile}`,
      `/Graphics/Pokedex/backgound%20type/base%20backgound%20m/${baseFile}`
    );
  },
} as const;

export const ITEM_ASSETS = {
  get defaultPotion(): string {
    return resolveAsset('item_potion', '/Graphics/Items/POTION.png');
  },
  getItemSprite: (spritePath: string): string => {
    const clean = spritePath.replace(/^\//, '');
    const key = `item_${clean.replace(/[\/\.]/g, '_')}`;
    return resolveAsset(key, `/${clean}`);
  },
} as const;
