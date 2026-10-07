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
  | 'battle_status_icons'
  | 'battle_command_buttons'
  | 'battle_overlay_exp'
  | 'battle_ball'
  | 'menu_bar_blank'
  | 'menu_icon_pokedex'
  | 'menu_icon_trainer'
  | 'menu_icon_options'
  | 'menu_icon_quit'
  | 'pokemon_shiny_icon'
  | 'party_databox_normal'
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
  getFrontSprite: (speciesKey: string, isShiny = false): string => {
    const folder = isShiny ? 'Front shiny' : 'Front';
    const key = isShiny ? `pokemon_front_shiny_${speciesKey}` : `pokemon_front_${speciesKey}`;
    return resolveAsset(key, `/Graphics/Pokemon/${folder}/${speciesKey}.png`);
  },
  getBackSprite: (speciesKey: string, isShiny = false): string => {
    const folder = isShiny ? 'Back shiny' : 'Back';
    const key = isShiny ? `pokemon_back_shiny_${speciesKey}` : `pokemon_back_${speciesKey}`;
    return resolveAsset(key, `/Graphics/Pokemon/${folder}/${speciesKey}.png`);
  },
  getIconSprite: (speciesKey: string, isShiny = false): string => {
    const folder = isShiny ? 'Icons shiny' : 'Icons';
    const key = isShiny ? `pokemon_icon_shiny_${speciesKey}` : `pokemon_icon_${speciesKey}`;
    return resolveAsset(key, `/Graphics/Pokemon/${folder}/${speciesKey}.png`);
  },
  get shinyIcon(): string {
    return resolveAsset('pokemon_shiny_icon', '/Graphics/Pokemon/shiny.png');
  },
} as const;

export function normalizeBallKey(name?: string): string {
  if (!name) return 'POKEBALL';
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.includes('GREAT')) return 'GREATBALL';
  if (clean.includes('ULTRA')) return 'ULTRABALL';
  if (clean.includes('MASTER')) return 'MASTERBALL';
  if (clean.includes('SAFARI')) return 'SAFARIBALL';
  if (clean.includes('NET')) return 'NETBALL';
  if (clean.includes('DIVE')) return 'DIVEBALL';
  if (clean.includes('NEST')) return 'NESTBALL';
  if (clean.includes('REPEAT')) return 'REPEATBALL';
  if (clean.includes('TIMER')) return 'TIMERBALL';
  if (clean.includes('LUXURY')) return 'LUXURYBALL';
  if (clean.includes('PREMIER')) return 'PREMIERBALL';
  if (clean.includes('DUSK')) return 'DUSKBALL';
  if (clean.includes('HEAL')) return 'HEALBALL';
  if (clean.includes('QUICK')) return 'QUICKBALL';
  if (clean.includes('FAST')) return 'FASTBALL';
  if (clean.includes('LEVEL')) return 'LEVELBALL';
  if (clean.includes('LURE')) return 'LUREBALL';
  if (clean.includes('HEAVY')) return 'HEAVYBALL';
  if (clean.includes('LOVE')) return 'LOVEBALL';
  if (clean.includes('FRIEND')) return 'FRIENDBALL';
  if (clean.includes('MOON')) return 'MOONBALL';
  if (clean.includes('SPORT')) return 'SPORTBALL';
  if (clean.includes('BEAST')) return 'BEASTBALL';
  if (clean.includes('DREAM')) return 'DREAMBALL';
  if (clean.includes('CHERISH')) return 'CHERISHBALL';
  return 'POKEBALL';
}

export const BATTLE_ASSETS = {
  get databoxEnemy(): string {
    return resolveAsset('battle_databox_enemy', '/Graphics/Battle/databox_enermy.png');
  },
  get databoxPlayer(): string {
    return resolveAsset('battle_databox_player', '/Graphics/Battle/databox_player.png');
  },
  get messageBox(): string {
    return resolveAsset('battle_message', '/Graphics/Battle/overlay_message_3.png');
  },
  get statusIcons(): string {
    return resolveAsset('battle_status_icons', '/Graphics/Battle/icon_statuses.png');
  },
  get fightButtons(): string {
    return resolveAsset('battle_fight_buttons', '/Graphics/Battle/battleFightButtons.png');
  },
  get commandButtons(): string {
    return resolveAsset('battle_command_buttons', '/Graphics/Battle/command_buttons.png');
  },
  get cursorCommand(): string {
    return this.commandButtons;
  },
  get overlayExp(): string {
    return resolveAsset('battle_overlay_exp', '/Graphics/Battle/overlay_exp.png');
  },
  get ball(): string {
    return resolveAsset('battle_ball', '/Graphics/Battle/ball00.png');
  },
  getBall: (ballType: string = 'POKEBALL'): string => {
    const key = normalizeBallKey(ballType);
    return resolveAsset(`battle_ball_${key}`, `/Graphics/Battle animations/ball_${key}.png`);
  },
  getBallOpen: (ballType: string = 'POKEBALL'): string => {
    const key = normalizeBallKey(ballType);
    return resolveAsset(
      `battle_ball_${key}_open`,
      `/Graphics/Battle animations/ball_${key}_open.png`
    );
  },
  getBallClosed: (ballType: string = 'POKEBALL'): string => {
    const key = normalizeBallKey(ballType);
    return resolveAsset(
      `battle_ball_${key}_closed`,
      `/Graphics/Battle animations/ball_${key}_closed.png`
    );
  },
  get ballBurstRay(): string {
    return resolveAsset('battle_ballBurst_ray', '/Graphics/Battle animations/ballBurst_ray.png');
  },
  get ballBurstParticle(): string {
    return resolveAsset(
      'battle_ballBurst_particle',
      '/Graphics/Battle animations/ballBurst_particle.png'
    );
  },
  get ballBurstRing(): string {
    return resolveAsset('battle_ballBurst_ring', '/Graphics/Battle animations/ballBurst_ring1.png');
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
  getForegroundOverlay: (overlay: string): string => {
    return resolveAsset(`battle_overlay_${overlay}`, `/Graphics/Battle/overlay/${overlay}.png`);
  },
} as const;

export const MENU_ASSETS = {
  get barBlank(): string {
    return resolveAsset('menu_bar_blank', '/Graphics/Icons/Blank.png');
  },
  get menuPokedex(): string {
    return resolveAsset('menu_icon_pokedex', '/Graphics/Icons/menuPokedex.png');
  },
  get menuPokemon(): string {
    return resolveAsset('menu_icon_pokemon', '/Graphics/Icons/menuPokemon.png');
  },
  get menuBag(): string {
    return resolveAsset('menu_bag', '/Graphics/Icons/menuBag.png');
  },
  get menuTrainer(): string {
    return resolveAsset('menu_icon_trainer', '/Graphics/Icons/menuTrainer.png');
  },
  get menuOptions(): string {
    return resolveAsset('menu_icon_options', '/Graphics/Icons/menuOptions.png');
  },
  get menuPC(): string {
    return resolveAsset('menu_icon_pc', '/Graphics/Icons/menuPC.png');
  },
  get menuQuit(): string {
    return resolveAsset('menu_icon_quit', '/Graphics/Icons/menuQuit.png');
  },
} as const;

export const STORAGE_ASSETS = {
  get bg(): string {
    return resolveAsset('storage_bg', '/Graphics/Storage/bg.png');
  },
  get battlePlayerBoxS(): string {
    return resolveAsset('storage_party_slot_bg', '/Graphics/Storage/battlePlayerBoxS.png');
  },
  getBoxWallpaper: (wallpaperId: number): string => {
    return resolveAsset(`storage_box_${wallpaperId}`, `/Graphics/Storage/box_${wallpaperId}.png`);
  },
  get cursorFist(): string {
    return resolveAsset('storage_cursor_fist', '/Graphics/Storage/boxfist.PNG');
  },
  get cursorGrab(): string {
    return resolveAsset('storage_cursor_grab', '/Graphics/Storage/boxgrab.PNG');
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
    const key = `item_${clean.replace(/[/.]/g, '_')}`;
    return resolveAsset(key, `/${clean}`);
  },
} as const;

export const PARTY_ASSETS = {
  get bg(): string {
    return resolveAsset('party_bg', '/Graphics/Party/partybg.PNG');
  },
  get ball(): string {
    return resolveAsset('party_ball', '/Graphics/Party/partyBall.PNG');
  },
  get ballSel(): string {
    return resolveAsset('party_ball_sel', '/Graphics/Party/partyBallSel.PNG');
  },
  get panelRound(): string {
    return resolveAsset('party_panel_round', '/Graphics/Party/partyPanelRound.png');
  },
  get panelRoundSel(): string {
    return resolveAsset('party_panel_round_sel', '/Graphics/Party/partyPanelRoundSel.png');
  },
  get panelRoundFnt(): string {
    return resolveAsset('party_panel_round_fnt', '/Graphics/Party/partyPanelRoundFnt.png');
  },
  get panelRoundSwap(): string {
    return resolveAsset('party_panel_round_swap', '/Graphics/Party/partyPanelRoundSwap.png');
  },
  get panelRect(): string {
    return resolveAsset('party_panel_rect', '/Graphics/Party/partyPanelRect.png');
  },
  get panelRectSel(): string {
    return resolveAsset('party_panel_rect_sel', '/Graphics/Party/partyPanelRectSel.png');
  },
  get panelRectFnt(): string {
    return resolveAsset('party_panel_rect_fnt', '/Graphics/Party/partyPanelRectFnt.png');
  },
  get panelRectSwap(): string {
    return resolveAsset('party_panel_rect_swap', '/Graphics/Party/partyPanelRectSwap.png');
  },
  get cancel(): string {
    return resolveAsset('party_cancel', '/Graphics/Party/partyCancel.png');
  },
  get cancelSel(): string {
    return resolveAsset('party_cancel_sel', '/Graphics/Party/partyCancelSel.png');
  },
  get hpBar(): string {
    return resolveAsset('party_hp_bar', '/Graphics/Party/partyHP.png');
  },
  get statuses(): string {
    return resolveAsset('party_statuses', '/Graphics/Party/statuses.PNG');
  },
  get panelBlank(): string {
    return resolveAsset('party_panel_blank', '/Graphics/Party/partyPanelBlank.png');
  },
  get battlerGender(): string {
    return resolveAsset('party_battler_gender', '/Graphics/Party/battler_gender.png');
  },
  get databoxNormal(): string {
    return resolveAsset('party_databox_normal', '/Graphics/Party/databox_normal.png');
  },
} as const;

export const BAG_ASSETS = {
  get bg(): string {
    return resolveAsset('bag_bg', '/Graphics/Bag/ui2.png');
  },
  get bagIcon(): string {
    return resolveAsset('bag_icon', '/Graphics/Bag/bag icon.png');
  },
  get pocketIcons(): string {
    return resolveAsset('bag_pocket_icons', '/Graphics/Bag/icon_pocket.png');
  },
  get panelRectDesel(): string {
    return resolveAsset('bag_panel_rect_desel', '/Graphics/Bag/ptpanel_rect_desel.png');
  },
} as const;
